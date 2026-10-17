/**
 * Markdown, outline notes and the reader's return stack (PRD-v3.1 §5, §6).
 *
 * Shared for the same reason as dsa-core.mjs: the page renders with it, and
 * the tests can check -- in Node, without a browser -- that anchors are
 * deterministic, that outline levels and the ✎ prompt render as specified,
 * and that a detour pushed, reloaded and popped comes back to the same
 * place. tools/build.mjs inlines it into the page as DSA_RENDER.
 *
 * It must stay dependency-free: anything page-specific (escaping, inline
 * links, C++ highlighting, what a detour card looks like) is passed in as a
 * hook.
 */

// ---------------------------------------------------------------- detours

/* `>> detour page#section | why | N min` (content format, §5.2). */
export const DETOUR_LINE = /^>> detour ([a-z0-9-]+)(?:#([a-z0-9_-]+))? \| (.+?) \| (\d+) min\s*$/;

export function parseDetour(line) {
  const m = String(line).match(DETOUR_LINE);
  return m ? { page: m[1], section: m[2] || null, why: m[3], minutes: Number(m[4]) } : null;
}

// ---------------------------------------------------------------- markdown

const WRITE_MARK = /^\s*✍️\s?/;

/**
 * Markdown to HTML with a stable anchor on every block.
 *
 * Every paragraph, list item, heading, code block, table and detour card
 * gets `data-anchor="<prefix>:<n>"`, numbered in document order. The same
 * text always produces the same anchors, which is what lets a return land on
 * the exact paragraph it left from, even after a reload.
 *
 * opts:
 *   anchor   prefix, e.g. "problem:two-sum:brainstorm" (no anchors if absent)
 *   wl       "mark" | "plain" -- how ✍️ write-lines render (v3 convention)
 *   esc, inline(text), code(code, lang), detour(d, anchorId)   -- hooks
 *   collect  an array to receive { anchor, text } per block (for `at` search)
 */
export function renderMarkdown(text, opts) {
  const o = opts || {};
  const esc = o.esc || ((s) => String(s));
  const inline = o.inline || esc;
  const code = o.code || ((c) => "<pre><code>" + esc(c) + "</code></pre>");
  const detour = o.detour || ((d) => "<p>" + esc(d.why) + "</p>");
  const wl = o.wl || "";
  const lines = String(text == null ? "" : text).replace(/\r/g, "").split("\n");
  const out = [];
  let n = 0;
  let para = [];
  let list = null;
  let items = [];

  const next = (raw) => {
    if (!o.anchor) return { attr: "", id: null };
    const id = o.anchor + ":" + n++;
    if (o.collect) o.collect.push({ anchor: id, text: raw });
    return { attr: ' data-anchor="' + esc(id) + '"', id };
  };

  function flushPara() {
    if (!para.length) return;
    const raw = para.join(" ");
    out.push("<p" + next(raw).attr + ">" + inline(raw) + "</p>");
    para = [];
  }
  function flushList() {
    if (!list) return;
    out.push("<" + list + ">" + items.map((i) => "<li" + next(i).attr + ">" + inline(i) + "</li>").join("") + "</" + list + ">");
    list = null;
    items = [];
  }
  function flush() { flushPara(); flushList(); }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      flush();
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) buf.push(lines[i++]);
      const a = next(buf.join("\n"));
      out.push("<div class=\"md-block\"" + a.attr + ">" + code(buf.join("\n"), fence[1]) + "</div>");
      continue;
    }

    const d = line.startsWith(">> ") ? parseDetour(line) : null;
    if (d) {
      flush();
      const a = next(d.why);
      out.push("<div class=\"md-block\"" + a.attr + ">" + detour(d, a.id) + "</div>");
      continue;
    }

    if (WRITE_MARK.test(line)) {
      flush();
      const raw = line.replace(WRITE_MARK, "");
      out.push("<p class=\"" + (wl === "mark" ? "wl" : "wp") + "\"" + next(raw).attr + ">" + inline(raw) + "</p>");
      continue;
    }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      i--;
      const a = next(head.join(" ") + " " + rows.map((r) => r.join(" ")).join(" "));
      out.push("<div class=\"dsa-tablewrap\"" + a.attr + "><table class=\"dsa-table\"><thead><tr>" +
        head.map((h) => "<th>" + inline(h) + "</th>").join("") + "</tr></thead><tbody>" +
        rows.map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") +
        "</tbody></table></div>");
      continue;
    }

    const heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      const lvl = Math.min(6, heading[1].length + 2);
      out.push("<h" + lvl + next(heading[2]).attr + ">" + inline(heading[2]) + "</h" + lvl + ">");
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const want = ul ? "ul" : "ol";
      if (list && list !== want) flushList();
      list = want;
      items.push((ul || ol)[1]);
      continue;
    }

    if (!line.trim()) { flush(); continue; }

    if (list && /^\s{2,}\S/.test(line)) {
      items[items.length - 1] += " " + line.trim();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join("");
}

// ---------------------------------------------------------------- outlines

/**
 * Outline notes (§6.2):
 *   `N. text`           (column 0)        level-1 topic, bold
 *   `   • text`         (3 spaces + •)    level-2 pointer
 *   `       ◦ text`     (7 spaces + ◦)    level-3 sub-pointer
 *   `✎ text`                              a write-in prompt, rendered as an
 *                                         "In my words" field, not as content
 * Indentation is matched loosely (2–4 / 5–9 spaces) so a hand-edited note
 * with one space off still renders at the right level. Any other line
 * continues the item above it.
 */
export function outlineLines(text) {
  const out = [];
  for (const line of String(text == null ? "" : text).replace(/\r/g, "").split("\n")) {
    if (!line.trim()) continue;
    let m;
    if ((m = line.match(/^(\d+)\.\s+(.*)$/))) out.push({ level: 1, num: Number(m[1]), text: m[2] });
    else if ((m = line.match(/^\s{2,4}•\s?(.*)$/))) out.push({ level: 2, text: m[1] });
    else if ((m = line.match(/^\s{5,9}◦\s?(.*)$/))) out.push({ level: 3, text: m[1] });
    else if ((m = line.match(/^\s*✎\s?(.*)$/))) out.push({ level: 0, prompt: true, text: m[1] });
    else if (out.length) out[out.length - 1].text += " " + line.trim();
    else out.push({ level: 2, text: line.trim() });
  }
  return out;
}

export function renderOutline(text, opts) {
  const o = opts || {};
  const esc = o.esc || ((s) => String(s));
  const inline = o.inline || esc;
  let n = 0;
  const attr = () => (o.anchor ? ' data-anchor="' + esc(o.anchor + ":" + n++) + '"' : "");
  return outlineLines(text).map((it) => {
    if (it.prompt) {
      // Content writes "✎ In my words: ________"; the label and the line are
      // drawn here, so only a real hint (if any) is kept.
      const hint = it.text.replace(/^in my words\s*:?\s*/i, "").replace(/_{3,}/g, "").replace(/\.{4,}/g, "").trim();
      return '<div class="ol-write"' + attr() + '><span class="ol-write-label">✎ In my words</span>' +
        (hint ? '<span class="ol-write-hint">' + inline(hint) + "</span>" : "") + "<span class=\"ol-write-line\"></span></div>";
    }
    if (it.level === 1) return '<div class="ol-1"' + attr() + "><b>" + it.num + ". " + inline(it.text) + "</b></div>";
    if (it.level === 3) return '<div class="ol-3"' + attr() + "><span class=\"ol-bullet\">◦</span>" + inline(it.text) + "</div>";
    return '<div class="ol-2"' + attr() + "><span class=\"ol-bullet\">•</span>" + inline(it.text) + "</div>";
  }).join("");
}

// ---------------------------------------------------------------- `at` quotes

/* A theory reference quotes the line it belongs to (`at`). The return
   anchor is the block containing that quote: compared case-insensitively
   with markdown symbols and spacing ignored, so `**Bottleneck:** the …` in
   the body matches "Bottleneck: the …" in the reference. */
export function normaliseQuote(s) {
  return String(s || "").toLowerCase().replace(/[*_`#>\[\]()✍️]/g, "").replace(/\s+/g, " ").trim();
}

export function findQuoteAnchor(blocks, at) {
  const want = normaliseQuote(at);
  if (!want || !blocks.length) return blocks.length ? blocks[0].anchor : null;
  const tries = [want, want.slice(0, 40), want.slice(0, 20)].filter((t) => t.length >= 6);
  for (const t of tries) {
    const hit = blocks.find((b) => normaliseQuote(b.text).includes(t));
    if (hit) return hit.anchor;
  }
  return blocks[0].anchor;
}

// ---------------------------------------------------------------- return stack

/* §5.2: a detour pushes { origin, anchor, label, scrollY, ts }; Return pops
   it. At most three deep -- a fourth is refused with a reason, because a
   stack you cannot see the bottom of is a maze, not a reading flow. The
   state is plain JSON so it survives localStorage and D1 unchanged. */
export const STACK_MAX = 3;

export function emptyReader() {
  return { pathKey: null, step: 0, stack: [], lastAnchorByPage: {} };
}

export function pushDetour(reader, entry, now) {
  const r = { ...emptyReader(), ...(reader || {}) };
  const stack = (r.stack || []).slice();
  if (stack.length >= STACK_MAX) return { reader: r, error: "Finish this detour first — you are already three deep." };
  stack.push({
    origin: String(entry.origin || ""),
    anchor: entry.anchor || null,
    label: String(entry.label || "").slice(0, 160),
    scrollY: Math.max(0, Math.round(entry.scrollY || 0)),
    ts: now === undefined ? Date.now() : now
  });
  return { reader: { ...r, stack }, error: null };
}

export function popDetour(reader) {
  const r = { ...emptyReader(), ...(reader || {}) };
  const stack = (r.stack || []).slice();
  const entry = stack.pop() || null;
  return { reader: { ...r, stack }, entry };
}

/** Restore from storage, tolerating anything malformed. */
export function restoreReader(raw) {
  let r = raw;
  if (typeof raw === "string") {
    try { r = JSON.parse(raw); } catch { r = null; }
  }
  if (!r || typeof r !== "object") return emptyReader();
  const stack = Array.isArray(r.stack) ? r.stack.filter((e) => e && typeof e.origin === "string").slice(-STACK_MAX) : [];
  return {
    pathKey: typeof r.pathKey === "string" ? r.pathKey : null,
    step: Number.isInteger(r.step) ? r.step : 0,
    stack,
    lastAnchorByPage: r.lastAnchorByPage && typeof r.lastAnchorByPage === "object" ? r.lastAnchorByPage : {}
  };
}
