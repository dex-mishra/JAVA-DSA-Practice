/**
 * The renderer pieces v3.1 depends on: deterministic anchors, detour cards,
 * outline levels and the ✎ prompt, `at`-quote matching, and a detour that
 * survives a reload (PRD-v3.1 §5, §6, CLAUDE-CODE-PROMPT step 6).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  renderMarkdown, parseDetour, outlineLines, renderOutline, findQuoteAnchor,
  pushDetour, popDetour, restoreReader, emptyReader, STACK_MAX
} from "../shared/dsa-render.mjs";

const day1 = JSON.parse(readFileSync(new URL("../data/dsa/day/1.json", import.meta.url)));
const runningSum = JSON.parse(readFileSync(new URL("../data/dsa/problem/running-sum-of-1d-array.json", import.meta.url)));
const rwPointer = JSON.parse(readFileSync(new URL("../data/dsa/theory/arr-read-write-pointer.json", import.meta.url)));

test("anchors are deterministic and in document order", () => {
  const body = runningSum.stages.find((s) => s.id === "brainstorm").body;
  const a = renderMarkdown(body, { anchor: "p:rs:brainstorm" });
  const b = renderMarkdown(body, { anchor: "p:rs:brainstorm" });
  assert.equal(a, b);
  const ids = [...a.matchAll(/data-anchor="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 3);
  assert.deepEqual(ids, ids.map((_, i) => "p:rs:brainstorm:" + i));
});

test("a detour line becomes a card at its position, with its own anchor", () => {
  assert.deepEqual(parseDetour(">> detour cx-space-and-in-place#in-place | What in-place allows | 2 min"),
    { page: "cx-space-and-in-place", section: "in-place", why: "What in-place allows", minutes: 2 });
  assert.equal(parseDetour(">> detour broken line"), null);
  const sec = rwPointer.sections.find((s) => s.body.includes(">> detour"));
  const seen = [];
  const html = renderMarkdown(sec.body, {
    anchor: "t:rw:" + sec.id,
    detour: (d, id) => { seen.push([d.page, id]); return "<aside>DETOUR</aside>"; }
  });
  assert.ok(seen.length >= 1);
  assert.ok(html.includes('data-anchor="' + seen[0][1] + '"'));
  assert.ok(!html.includes(">> detour"), "no raw detour line leaks into the page");
});

test("Day 1 reading path step 7 carries the in-place detour (acceptance)", () => {
  const step = day1.reading_path[6];
  assert.equal(step.page, "arr-read-write-pointer");
  const sec = rwPointer.sections.find((s) => s.id === step.section);
  const cards = [];
  renderMarkdown(sec.body, { anchor: "x", detour: (d) => { cards.push(d); return ""; } });
  assert.ok(cards.some((d) => d.page === "cx-space-and-in-place" && d.minutes === 2));
});

test("outline levels: N. bold topic, • pointer, ◦ sub-pointer, ✎ prompt", () => {
  const items = outlineLines("1. Idea\n   • first\n       ◦ deeper\n✎ say it yourself\n2. Next\n  • off-by-one indent");
  assert.deepEqual(items.map((i) => i.level), [1, 2, 3, 0, 1, 2]);
  assert.ok(items[3].prompt);
  const html = renderOutline("1. Idea\n   • first\n       ◦ deeper\n✎ say it yourself", { anchor: "n" });
  assert.match(html, /<div class="ol-1"[^>]*><b>1\. Idea<\/b>/);
  assert.match(html, /class="ol-2"/);
  assert.match(html, /class="ol-3"/);
  assert.match(html, /class="ol-write"[^>]*><span class="ol-write-label">✎ In my words<\/span>/);
});

test("the delivered Running Sum note renders every level it uses", () => {
  const levels = new Set(outlineLines(runningSum.note).map((i) => i.level));
  assert.ok(levels.has(1) && levels.has(2) && levels.has(3));
});

test("an `at` quote finds its block, ignoring markdown and case", () => {
  const blocks = [];
  const body = runningSum.stages.find((s) => s.id === "brainstorm").body;
  renderMarkdown(body, { anchor: "b", collect: blocks });
  const ref = runningSum.theory_refs.find((r) => r.stage === "brainstorm");
  const anchor = findQuoteAnchor(blocks, ref.at);
  const block = blocks.find((b) => b.anchor === anchor);
  assert.ok(block.text.toLowerCase().includes("bottleneck"), `matched: ${block.text}`);
  assert.equal(findQuoteAnchor(blocks, "text that is nowhere in the stage"), blocks[0].anchor);
});

test("detour push → reload → return restores the route and the anchor", () => {
  let r = emptyReader();
  ({ reader: r } = pushDetour(r, { origin: "#dsa/read/day-1/7", anchor: "t:arr-read-write-pointer:idea:4", label: "Read pointer § The idea", scrollY: 812 }, 1));
  // "Reload": through JSON, as localStorage and D1 store it.
  const restored = restoreReader(JSON.stringify(r));
  const { reader, entry } = popDetour(restored);
  assert.equal(entry.origin, "#dsa/read/day-1/7");
  assert.equal(entry.anchor, "t:arr-read-write-pointer:idea:4");
  assert.equal(entry.scrollY, 812);
  assert.equal(reader.stack.length, 0);
});

test("the stack stops at three deep, and junk restores to empty", () => {
  let r = emptyReader();
  for (let i = 0; i < STACK_MAX; i++) ({ reader: r } = pushDetour(r, { origin: "#a" + i }, i));
  const fourth = pushDetour(r, { origin: "#a4" }, 9);
  assert.match(fourth.error, /three deep/);
  assert.equal(fourth.reader.stack.length, 3);
  assert.deepEqual(restoreReader("not json"), emptyReader());
  assert.deepEqual(restoreReader({ stack: [{ nope: 1 }] }).stack, []);
});
