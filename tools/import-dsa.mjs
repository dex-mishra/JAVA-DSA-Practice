/**
 * Import the DSA plan from `docs/dsa-sheet/v3/` into `data/dsa/`.
 *
 *   node tools/import-dsa.mjs
 *   node tools/import-dsa.mjs --check    (validate and report, write nothing)
 *
 * Content is an input, not state. Batches of five days arrive, get corrected
 * and get re-delivered; a re-import must be idempotent and must never touch
 * what the user has written. So this reads the content folder, validates it,
 * normalises it and reports what actually moved -- per day, added / changed /
 * unchanged / removed. Progress lives in D1, which this script cannot reach.
 *
 * Refusal is the default. Every reference a page will render as a link --
 * theory chips, stuck-ladder rungs, inline [[page#section]] links, drill
 * answers, mock coverage -- is resolved here, and one that does not resolve
 * stops the import (PRD §6.1). A dead link found by the importer costs a
 * re-delivery; one found by the user mid-problem costs the problem.
 *
 * Output (data/dsa/, copied to public/data/dsa/ by the build):
 *   plan.json            the frozen plan without day bodies -- baked into the page
 *   index.json           thin problem rows, legacy map, patterns -- baked in
 *   schedule.json        MOCK-SCHEDULE.json, validated
 *   theory-index.json    the theory catalogue, with per-page use counts
 *   theory/<id>.json     one page each, `used_by` recomputed
 *   day/<n>.json         micro-theory, drill, CS core, skims for a ready day
 *   problem/<id>.json    stages, refs, siblings and row meta for a ready problem
 * And, never under public/:
 *   worker/oa-content.json   mocks with hidden tests (Worker bundle only)
 *   worker/dsa-plan.json     the thin plan the cron reads (Worker bundle only)
 *
 * `verify` fields (reference solutions and their tests) exist only for CI and
 * are dropped here, so nothing downstream can ship them by accident.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildInput as oaBuildInput } from "../worker/oa-gen.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PROBLEM_STAGES = ["understand", "analyse", "brainstorm", "algorithm", "pseudocode",
  "solution", "dry_run", "edges", "carry", "followups"];
export const SIBLING_STAGES = ["analyse", "brainstorm", "algorithm", "pseudocode", "solution", "quick_theory"];
const NOTES = new Set(["write", "screenshot", "mixed"]);
const ROLES = new Set(["LEARN", "APPLY", "TWIST", "DISGUISE"]);
const DIFFICULTY = new Set(["Easy", "Medium", "Hard"]);
const DRILL_PER_DAY = 5;
const LINK = /\[\[([a-z0-9-]+)(?:#([a-z0-9_-]+))?\]\]/g;
// v3.1 §5.2: a pre-placed jump, `>> detour page#section | why | N min`.
export const DETOUR = /^>> detour ([a-z0-9-]+)(?:#([a-z0-9_-]+))? \| (.+?) \| (\d+) min\s*$/;
const WHEN = new Set(["before", "while", "stuck", "after"]);
const NEED = new Set(["must", "optional"]);
const KINDS = new Set(["concept", "mechanics", "cpp", "pattern", "meta", "skim", "core"]);

/** Days after an ISO date, as an ISO date. Pure calendar arithmetic in UTC,
 *  so the machine's own timezone cannot shift a plan date. */
export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function stripVerify(o) {
  const { verify, ...rest } = o;
  return rest;
}

/**
 * Validate and normalise. Returns { errors, warnings, outputs, report } and
 * writes nothing -- `writeOutputs` does that, so the tests can run this over
 * deliberately broken copies of the content without touching data/.
 */
export function importDsa({ src, today = new Date().toISOString().slice(0, 10) }) {
  const errors = [];
  const warnings = [];
  const fail = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  function readJson(path, fallback) {
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      if (fallback !== undefined) return fallback;
      fail(`could not read ${relative(src, path) || path}: ${e.message}`);
      return null;
    }
  }

  const plan = readJson(join(src, "PLAN.json"));
  const schedule = readJson(join(src, "MOCK-SCHEDULE.json"));
  const theoryIndex = readJson(join(src, "theory", "INDEX.json"));
  if (!plan || !schedule || !theoryIndex) return { errors, warnings };

  // ------------------------------------------------------------ theory

  const pages = new Map();       // id -> page
  const sectionsOf = new Map();  // id -> Set(section ids)
  for (const f of readdirSync(join(src, "theory")).filter((f) => f.endsWith(".json") && f !== "INDEX.json").sort()) {
    const page = readJson(join(src, "theory", f));
    if (!page) continue;
    const where = `theory/${f}`;
    if (page.id !== f.replace(/\.json$/, "")) fail(`${where}: id '${page.id}' does not match the file name`);
    if (pages.has(page.id)) { fail(`${where}: duplicate theory page id ${page.id}`); continue; }
    checkSections(where, page.sections, null);
    if (page.kind && !KINDS.has(page.kind)) fail(`${where}: kind '${page.kind}' is not one of ${[...KINDS].join("/")}`);
    checkNotes(where, page);
    pages.set(page.id, page);
    sectionsOf.set(page.id, new Set((page.sections || []).map((s) => s.id)));
  }
  if (theoryIndex.count !== pages.size) {
    fail(`theory/INDEX.json declares ${theoryIndex.count} pages but ${pages.size} page files exist`);
  }
  for (const row of theoryIndex.pages || []) {
    if (!pages.has(row.id)) fail(`theory/INDEX.json lists '${row.id}', which has no page file`);
  }

  /* A section's `note` drives the ✍️/📸 rendering and an empty body renders as
     a heading with nothing under it, so both are checked wherever sections
     appear: theory pages, problem stages, siblings, micro-theory, CS core. */
  function checkSections(where, sections, wantIds) {
    if (!Array.isArray(sections) || !sections.length) { fail(`${where}: no sections`); return; }
    if (wantIds) {
      const got = sections.map((s) => s.id);
      if (got.join(",") !== wantIds.join(",")) {
        fail(`${where}: stages must be exactly [${wantIds.join(", ")}] in order, got [${got.join(", ")}]`);
      }
    }
    for (const s of sections) {
      if (!s.id) fail(`${where}: a section has no id`);
      if (!NOTES.has(s.note)) fail(`${where}#${s.id}: note '${s.note}' is not write, screenshot or mixed`);
      if (typeof s.body !== "string" || !s.body.trim()) fail(`${where}#${s.id}: empty body`);
    }
  }

  /* v3.1 §6.1/§12: note, recall and shot come together or not at all; recall
     has at least three question/answer pairs; a CS core page always has
     them; notes_status says which. */
  function checkNotes(where, page) {
    const has = [!!page.note, Array.isArray(page.recall) && page.recall.length > 0, !!page.shot];
    if (has.some(Boolean) && !has.every(Boolean)) {
      fail(`${where}: note, recall and shot must come together (note=${has[0]} recall=${has[1]} shot=${has[2]})`);
    }
    if (has[1]) {
      if (page.recall.length < 3) fail(`${where}: recall needs at least 3 questions, has ${page.recall.length}`);
      page.recall.forEach((r, i) => {
        if (!r || typeof r.q !== "string" || !r.q.trim() || typeof r.a !== "string" || !r.a.trim()) {
          fail(`${where}: recall[${i}] needs a question and an answer`);
        }
      });
    }
    if (has[2] && (typeof page.shot.title !== "string" || typeof page.shot.body !== "string" || !page.shot.body.trim())) {
      fail(`${where}: shot needs a title and a body`);
    }
    const status = has[0] ? "ready" : "pending";
    if (page.notes_status && page.notes_status !== status) fail(`${where}: notes_status '${page.notes_status}' but the page ${has[0] ? "has" : "has no"} notes`);
    page.notes_status = status;
    if (page.kind === "core" && !has[0]) fail(`${where}: CS core pages need note, recall and shot`);
  }

  // Every reference anywhere funnels through here, which is also what builds
  // the reverse index -- a reference that resolves is a `used_by` row.
  const usedBy = new Map(); // page id -> rows
  const referenced = new Set(); // includes prereq/related links, which are not `used_by` rows
  function ref(where, page, section, use) {
    if (!pages.has(page)) { fail(`${where}: theory page '${page}' does not exist`); return; }
    referenced.add(page);
    if (section && !sectionsOf.get(page).has(section)) {
      fail(`${where}: theory page '${page}' has no section '${section}'`);
      return;
    }
    if (use) {
      if (!usedBy.has(page)) usedBy.set(page, []);
      usedBy.get(page).push({ ...use, section: section || null });
    }
  }
  /* Inline [[links]] and detour lines in any markdown body. A line that
     starts with `>> ` but is not a well-formed detour is refused: it would
     render as a stray line of punctuation instead of the card it meant. */
  function inlineLinks(where, body, use) {
    const text = String(body || "");
    for (const m of text.matchAll(LINK)) ref(where, m[1], m[2], use ? { ...use, kind: "link" } : null);
    for (const line of text.split("\n")) {
      if (!line.startsWith(">> ")) continue;
      const m = line.match(DETOUR);
      if (!m) { fail(`${where}: malformed detour line '${line.slice(0, 80)}' (want '>> detour page#section | why | N min')`); continue; }
      ref(`${where} detour`, m[1], m[2], use ? { ...use, kind: "detour", why: m[3], minutes: Number(m[4]) } : null);
    }
  }

  // Page-to-page links resolve like any other, but a page only being some
  // other page's prereq is not "used" -- so these never become used_by rows.
  for (const page of pages.values()) {
    for (const p of page.prereqs || []) ref(`theory/${page.id} prereqs`, p);
    for (const p of page.related || []) ref(`theory/${page.id} related`, p);
    for (const s of page.sections || []) {
      inlineLinks(`theory/${page.id}#${s.id}`, s.body, { src: "page", id: page.id, from_page: page.id, from_section: s.id });
    }
    if (page.note) inlineLinks(`theory/${page.id} note`, page.note, null);
    if (page.shot) inlineLinks(`theory/${page.id} shot`, page.shot.body, null);
  }

  // ------------------------------------------------------------ plan

  const ids = new Map(); // shared namespace: problems, skims, siblings, drill
  function claim(id, where) {
    if (!id) { fail(`${where}: missing id`); return; }
    if (ids.has(id)) fail(`${where}: id '${id}' is already used by ${ids.get(id)}`);
    else ids.set(id, where);
  }

  const start = plan.start_date;
  const days = plan.days || [];
  if (days.length !== 30) fail(`PLAN.json: expected 30 days, found ${days.length}`);

  const planProblems = [];
  const patterns = new Set();
  for (const d of days) {
    const where = `PLAN day ${d.day}`;
    if (d.date !== addDays(start, d.day - 1)) fail(`${where}: date ${d.date} is not start_date + ${d.day - 1}`);
    if (!(plan.clusters || []).some((c) => c.key === d.cluster)) fail(`${where}: unknown cluster '${d.cluster}'`);
    for (const p of d.problems || []) {
      const pw = `${where} ${p.id}`;
      claim(p.id, pw);
      if (!ROLES.has(p.role)) fail(`${pw}: role '${p.role}' is not LEARN/APPLY/TWIST/DISGUISE`);
      if (!p.lc || !p.lc.url || !DIFFICULTY.has(p.lc.difficulty)) fail(`${pw}: lc.url or lc.difficulty missing`);
      for (const t of p.theory || []) ref(`${pw} theory`, t, null, { kind: "primary", src: "problem", id: p.id, day: d.day });
      if (p.pattern) patterns.add(p.pattern);
      planProblems.push({ ...p, day: d.day });
    }
    for (const s of d.skims || []) {
      claim(s.id, `${where} skim`);
      for (const t of s.theory || []) ref(`${where} skim ${s.id}`, t, null, { kind: "skim", src: "skim", id: s.id, day: d.day });
    }
  }
  if (planProblems.length !== plan.problem_count) {
    fail(`PLAN.json: problem_count ${plan.problem_count} but ${planProblems.length} problems listed`);
  }

  // ------------------------------------------------------------ days

  const dayOut = new Map();      // n -> day payload
  const problemOut = new Map();  // id -> problem payload
  const mustOf = new Map();      // problem id -> { id, title }
  const siblingCount = new Map();
  let siblingTotal = 0;
  let drillTotal = 0;

  const dayFiles = new Set(existsSync(join(src, "days"))
    ? readdirSync(join(src, "days")).filter((f) => /^day-\d+\.json$/.test(f)) : []);

  for (const d of days) {
    const file = `day-${String(d.day).padStart(2, "0")}.json`;
    const where = `days/${file}`;
    if (!dayFiles.has(file)) {
      if (d.content === "ready") fail(`${where}: PLAN marks day ${d.day} ready but the file is missing`);
      continue;
    }
    if (d.content !== "ready") warn(`${where}: exists but PLAN still marks day ${d.day} pending -- not imported`);
    if (d.content !== "ready") continue;

    const doc = readJson(join(src, "days", file));
    if (!doc) continue;
    if (doc.day !== d.day) fail(`${where}: declares day ${doc.day}`);

    const want = (d.problems || []).map((p) => p.id);
    const got = (doc.problems || []).map((p) => p.id);
    if (want.join(",") !== got.join(",")) {
      fail(`${where}: problems [${got.join(", ")}] differ from PLAN day ${d.day} [${want.join(", ")}]`);
    }

    // Micro-theory and pattern card.
    const micro = doc.micro || {};
    checkSections(`${where} micro`, micro.sections, null);
    for (const t of micro.theory || []) ref(`${where} micro.theory`, t, null, { kind: "micro", src: "day", id: `day-${d.day}`, day: d.day, at: micro.title || "" });
    for (const s of micro.sections || []) inlineLinks(`${where} micro#${s.id}`, s.body, { src: "day", id: `day-${d.day}`, day: d.day, stage: "micro", at: micro.title || "" });

    // Reading path (v3.1 §5.4). Days 1–2 must have one, built on pages that
    // have notes; later days may leave it empty and fall back to micro.theory.
    const path = Array.isArray(doc.reading_path) ? doc.reading_path : [];
    path.forEach((st, i) => {
      const sw = `${where} reading_path[${i + 1}]`;
      if (st.step !== i + 1) fail(`${sw}: step is ${st.step}, expected ${i + 1}`);
      if (!st.bridge || typeof st.bridge !== "string") fail(`${sw}: needs a bridge line`);
      if (!Number.isInteger(st.minutes) || st.minutes < 1) fail(`${sw}: minutes must be a positive whole number`);
      ref(sw, st.page, st.section, { kind: "path", src: "day", id: `day-${d.day}`, day: d.day, step: st.step, why: st.bridge });
      if (d.day <= 2 && pages.has(st.page) && !pages.get(st.page).note) fail(`${sw}: page ${st.page} has no notes yet`);
    });
    if (d.day <= 2 && !path.length) fail(`${where}: days 1–2 need a reading_path`);

    // Problems.
    for (const p of doc.problems || []) {
      const pw = `${where} ${p.id}`;
      checkSections(pw, p.stages, PROBLEM_STAGES);
      for (const s of p.stages || []) inlineLinks(`${pw}#${s.id}`, s.body, { src: "problem", id: p.id, day: d.day, stage: s.id });
      // v3 rows have no when/need: they read as "while solving, optional".
      const refs = (p.theory_refs || []).map((r) => ({ ...r, when: r.when || "while", need: r.need || "optional" }));
      for (const r of refs) {
        if (!PROBLEM_STAGES.includes(r.stage)) fail(`${pw}: theory_ref stage '${r.stage}' is not a stage`);
        if (!WHEN.has(r.when)) fail(`${pw}: theory_ref when '${r.when}' is not before/while/stuck/after`);
        if (!NEED.has(r.need)) fail(`${pw}: theory_ref need '${r.need}' is not must/optional`);
        ref(`${pw} theory_refs`, r.page, r.section, { kind: "ref", src: "problem", id: p.id, day: d.day, stage: r.stage,
          at: r.at || "", why: r.why || "", when: r.when, need: r.need });
      }
      for (const [min, r] of Object.entries(p.stuck_refs || {})) {
        ref(`${pw} stuck_refs[${min}]`, r.page, r.section, { kind: "stuck", src: "problem", id: p.id, day: d.day, stage: `stuck-${min}`, at: `stuck ladder, ${min} min` });
      }
      const prow = planProblems.find((x) => x.id === p.id) || {};
      if (p.note !== undefined && p.note !== null && (typeof p.note !== "string" || !p.note.trim())) fail(`${pw}: note is present but empty`);
      if (d.day <= 2 && !p.note) fail(`${pw}: days 1–2 problems need a note outline`);
      if (d.day <= 2 && prow.role === "LEARN" && !refs.some((r) => r.when === "before")) fail(`${pw}: LEARN problems need at least one 'before' reference`);
      if (p.note) inlineLinks(`${pw} note`, p.note, null);

      const sibs = p.siblings || [];
      const musts = sibs.filter((s) => s.tier === "must");
      if (musts.length !== 1) fail(`${pw}: needs exactly one must sibling, has ${musts.length}`);
      for (const s of sibs) {
        const sw = `${pw} sibling ${s.id}`;
        claim(s.id, sw);
        if (s.tier !== "must" && s.tier !== "optional") fail(`${sw}: tier '${s.tier}' is not must or optional`);
        checkSections(sw, s.stages, SIBLING_STAGES);
        for (const st of s.stages || []) inlineLinks(`${sw}#${st.id}`, st.body, { src: "sibling", id: s.id, parent: p.id, day: d.day, stage: st.id });
        if (s.note !== undefined && s.note !== null && (typeof s.note !== "string" || !s.note.trim())) fail(`${sw}: note is present but empty`);
      }
      siblingTotal += sibs.length;
      siblingCount.set(p.id, sibs.length);
      if (musts[0]) mustOf.set(p.id, { id: musts[0].id, title: musts[0].title });

      const row = planProblems.find((x) => x.id === p.id) || {};
      problemOut.set(p.id, {
        id: p.id,
        day: d.day,
        ord: row.ord,
        role: row.role,
        title: row.title,
        lc: row.lc,
        pattern: row.pattern || "",
        theory: row.theory || [],
        theory_refs: refs,
        stuck_refs: p.stuck_refs || {},
        note: p.note || null,
        stages: p.stages,
        siblings: sibs.map(stripVerify)
      });
    }

    // Recognition drill.
    const drill = doc.drill || [];
    if (drill.length !== DRILL_PER_DAY) fail(`${where}: drill needs exactly ${DRILL_PER_DAY} items, has ${drill.length}`);
    for (const it of drill) {
      const iw = `${where} drill ${it.id}`;
      claim(it.id, iw);
      if (!it.statement) fail(`${iw}: no statement`);
      if (it.details !== undefined && (typeof it.details !== "string" || !it.details.trim())) fail(`${iw}: details is present but empty`);
      inlineLinks(`${iw} details`, it.details, null);
      ref(`${iw} pattern_page`, it.pattern_page, null, { kind: "drill", src: "drill", id: it.id, day: d.day, at: it.pattern_name || "" });
    }
    drillTotal += drill.length;

    // CS core: the v3.1 `core` block, or the legacy `cs_core` card (Days 3–5).
    if (!doc.cs_core && !doc.core) fail(`${where}: a ready day needs a core block (core or cs_core)`);
    if (doc.cs_core) {
      checkSections(`${where} cs_core`, doc.cs_core.sections, null);
      for (const s of doc.cs_core.sections || []) inlineLinks(`${where} cs_core#${s.id}`, s.body, null);
    }
    if (doc.core) checkCore(`${where} core`, doc.core, d.day);

    dayOut.set(d.day, {
      day: d.day,
      date: d.date,
      weekday: d.weekday,
      cluster: d.cluster,
      title: d.title,
      micro,
      drill,
      cs_core: doc.cs_core || null,
      core: doc.core || null,
      reading_path: path,
      skims: d.skims || []
    });
  }

  function checkCore(cw, core, dayN) {
    if (!core.subject || !core.title) fail(`${cw}: needs subject and title`);
    if (!Array.isArray(core.topics) || !core.topics.length) fail(`${cw}: needs at least one topic`);
    for (const t of core.topics || []) {
      ref(`${cw} topic`, t, null, { kind: "core", src: "core", id: `core-day-${dayN}`, day: dayN, at: core.title || "" });
      const pg = pages.get(t);
      if (pg && pg.kind !== "core") fail(`${cw}: topic ${t} is not a CS core page`);
      if (pg && !pg.note) fail(`${cw}: topic ${t} has no notes`);
    }
    if (!core.explain || typeof core.explain !== "string") fail(`${cw}: needs an explain prompt`);
    if (core.intro) checkSections(`${cw} intro`, core.intro, null);
    const mcqs = core.mcqs || [];
    if (mcqs.length < 5) fail(`${cw}: needs at least 5 MCQs, has ${mcqs.length}`);
    const seen = new Set();
    for (const q of mcqs) {
      const qw = `${cw} mcq ${q.id || "?"}`;
      if (!q.id || seen.has(q.id)) fail(`${qw}: missing or duplicate id`);
      seen.add(q.id);
      const opts = Object.keys(q.options || {});
      if (!q.q || opts.length < 3 || !opts.includes(q.answer) || !q.why) {
        fail(`${qw}: needs q, at least options a–c, an answer among them, and why`);
      }
      if (q.topic && !(core.topics || []).includes(q.topic)) fail(`${qw}: topic ${q.topic} is not one of the day's topics`);
    }
  }

  // ------------------------------------------------------------ CORE-PLAN

  /* The CS core syllabus (v3.1 §14): 30 plan days plus the Nov 17–30
     intensive. Topic pages are optional (pending subjects name topics before
     their pages exist), but a page that is named must exist. */
  const corePlan = existsSync(join(src, "CORE-PLAN.json")) ? readJson(join(src, "CORE-PLAN.json")) : null;
  if (corePlan) {
    for (const cd of corePlan.days || []) {
      const cw = `CORE-PLAN ${cd.day ? "day " + cd.day : cd.date}`;
      if (cd.day && cd.date !== addDays(start, cd.day - 1)) fail(`${cw}: date ${cd.date} is not start_date + ${cd.day - 1}`);
      for (const t of cd.topics || []) {
        if (t.page && !pages.has(t.page)) fail(`${cw}: topic page '${t.page}' does not exist`);
      }
      if (cd.day && cd.content === "ready" && dayOut.has(cd.day) && !dayOut.get(cd.day).core) {
        fail(`${cw}: marked ready but day ${cd.day} has no core block`);
      }
    }
  }

  for (const d of days) {
    if (d.content !== "ready") {
      // Pending is normal; pending inside the five-day window is the batch being late.
      const lead = Math.round((Date.parse(d.date) - Date.parse(today)) / 86400000);
      if (lead <= 5 && lead >= -30) warn(`day ${d.day} (${d.date}) is pending and ${lead < 0 ? "already past" : `${lead} day(s) away`}`);
    }
  }
  const pendingDays = days.filter((d) => d.content !== "ready").map((d) => d.day);

  // ------------------------------------------------------------ schedule

  const mocks = schedule.mocks || [];
  for (const m of mocks) {
    const mw = `MOCK-SCHEDULE ${m.id}`;
    if (m.date !== addDays(start, m.day - 1)) fail(`${mw}: date ${m.date} is not start_date + ${m.day - 1}`);
    const lead = Math.round((Date.parse(m.date) - Date.parse(today)) / 86400000);
    if (m.content !== "ready" && lead >= 0 && lead <= 3) warn(`${mw}: content is pending and the mock is ${lead} day(s) away`);
  }

  // ------------------------------------------------------------ OAs

  /* Mock assessments go into the Worker bundle, never public/: hidden tests
     must not be readable before submission, and anything under public/ is
     world-readable. The generator-port check is unchanged from v2. */
  const oaMocks = [];
  const planIds = new Set(planProblems.map((p) => p.id));
  const oaDir = join(src, "oa");
  const oaFiles = existsSync(oaDir) ? readdirSync(oaDir).filter((f) => /-problems\.json$/.test(f)).sort() : [];

  for (const file of oaFiles) {
    const mock = readJson(join(oaDir, file), null);
    if (!mock) continue;
    const where = `oa/${file}`;
    if (!mock.id || !Array.isArray(mock.problems)) { fail(`${where}: not a mock (needs id and problems[])`); continue; }

    const sched = mocks.find((m) => m.id === mock.id);
    if (!sched) { fail(`${where}: '${mock.id}' is not in MOCK-SCHEDULE.json`); continue; }
    const coversDays = Array.isArray(mock.covers_days) ? mock.covers_days : [];
    if (coversDays.join(",") !== (sched.covers_days || []).join(",")) {
      fail(`${where}: covers_days [${coversDays.join(", ")}] differ from MOCK-SCHEDULE [${(sched.covers_days || []).join(", ")}]`);
    }

    let marks = 0;
    const problems = [];
    for (const q of mock.problems) {
      const qw = `${where} ${q.id}`;
      if (!coversDays.includes(q.source_day)) fail(`${qw}: source_day ${q.source_day} is not in covers_days`);
      if (q.tests_pattern && !patterns.has(q.tests_pattern)) fail(`${qw}: tests_pattern '${q.tests_pattern}' is not a PLAN pattern`);
      if (q.related && !planIds.has(q.related)) fail(`${qw}: related '${q.related}' is not a PLAN problem`);
      for (const [i, t] of (q.samples || []).entries()) {
        if (typeof t.input !== "string" || typeof t.output !== "string") fail(`${qw}: sample[${i}] needs both input and output`);
      }

      const hidden = [];
      let hiddenMarks = 0;
      for (const [i, t] of (q.hidden || []).entries()) {
        const key = `${q.id}#${i}`;
        if (typeof t.output !== "string") { fail(`${qw}: hidden[${i}] has no output`); continue; }
        hiddenMarks += Number(t.marks) || 0;
        if (typeof t.input === "string") {
          // The code runner caps stdin at 100 KB; anything near that ships
          // as a generator (gen.builder_js + a port in worker/oa-gen.js).
          if (t.input.length > 95_000) fail(`${qw}: hidden[${i}] input is ${Math.round(t.input.length / 1024)} KB -- over 95 KB, make it a gen test`);
          hidden.push({ desc: t.desc || "", marks: Number(t.marks) || 0, input: t.input, output: t.output });
          continue;
        }
        if (!t.gen || typeof t.gen.builder_js !== "string") { fail(`${qw}: hidden[${i}] has neither input nor gen.builder_js`); continue; }
        // The one place builder_js is evaluated: import time, on this machine,
        // over content from this repository. The Worker never sees the string.
        let authored, ported;
        try { authored = new Function(`${t.gen.builder_js}; return build();`)(); }
        catch (e) { fail(`${qw}: hidden[${i}] gen.builder_js does not run: ${e.message}`); continue; }
        try { ported = oaBuildInput(key); }
        catch (e) { fail(`${qw}: hidden[${i}] ${e.message} -- port it into worker/oa-gen.js under '${key}'`); continue; }
        if (authored !== ported) { fail(`${qw}: hidden[${i}] the port in worker/oa-gen.js disagrees with gen.builder_js`); continue; }
        hidden.push({ desc: t.desc || "", marks: Number(t.marks) || 0, gen_key: key, output: t.output });
      }
      if (hiddenMarks !== Number(q.marks)) fail(`${qw}: hidden tests total ${hiddenMarks} marks but the problem declares ${q.marks}`);
      marks += Number(q.marks) || 0;

      problems.push({
        id: q.id, ord: q.ord, title: q.title, marks: q.marks, difficulty: q.difficulty,
        statement: q.statement, input_format: q.input_format, output_format: q.output_format,
        constraints: q.constraints, samples: q.samples || [], hidden,
        tests_pattern: q.tests_pattern || "", source_day: q.source_day,
        intended_approach: q.intended_approach || "", intended_complexity: q.intended_complexity || "",
        common_wrong_turn: q.common_wrong_turn || "", related: q.related || ""
      });
    }
    if (marks !== Number(mock.total_marks)) fail(`${where}: problems total ${marks} marks but the mock declares ${mock.total_marks}`);

    oaMocks.push({
      id: mock.id, title: mock.title, covers_days: coversDays,
      last_covered_day: Math.max(0, ...coversDays),
      duration_min: mock.duration_min || sched.duration_min, total_marks: mock.total_marks,
      difficulty: mock.difficulty || "campus-standard", grading: mock.grading || {},
      problems: problems.sort((a, b) => a.ord - b.ord)
    });
  }
  for (const m of mocks) {
    if (m.content === "ready" && !oaMocks.some((o) => o.id === m.id)) fail(`MOCK-SCHEDULE ${m.id}: marked ready but oa/${m.id}-problems.json is missing`);
  }

  if (errors.length) return { errors, warnings };

  // ------------------------------------------------------------ normalise

  for (const id of pages.keys()) {
    if (!referenced.has(id)) warn(`theory/${id}: not referenced by anything`);
  }

  const theoryPages = [...pages.values()].map((page) => ({
    ...page,
    used_by: (usedBy.get(page.id) || []).sort((a, b) => a.day - b.day || a.id.localeCompare(b.id))
  }));

  const rows = planProblems.map((p) => ({
    id: p.id,
    day: p.day,
    ord: p.ord,
    role: p.role,
    title: p.title,
    lc_id: (p.lc && p.lc.id) || "",
    slug: (p.lc && p.lc.slug) || p.id,
    url: p.lc.url,
    difficulty: p.lc.difficulty,
    topic: p.topic || "",
    pattern: p.pattern || "",
    theory: p.theory || [],
    companies: p.companies || [],
    campus_oa: p.campus_oa || "",
    cluster: (days.find((d) => d.day === p.day) || {}).cluster || "",
    tuf_article: (p.tuf && p.tuf.article) || null,
    tuf_practice: (p.tuf && p.tuf.practice) || null,
    tuf_youtube: (p.tuf && p.tuf.youtube) || null,
    legacy_id: p.legacy_id || null,
    content: problemOut.has(p.id) ? "ready" : "pending",
    must: mustOf.get(p.id) || null,
    siblings: siblingCount.get(p.id) || 0,
    before: problemOut.has(p.id) ? problemOut.get(p.id).theory_refs.filter((x) => x.when === "before").length : 0,
    refs: problemOut.has(p.id) ? problemOut.get(p.id).theory_refs.length : 0
  }));

  const patternList = [...patterns].map((pattern) => {
    const ps = rows.filter((r) => r.pattern === pattern);
    return { pattern, topic: ps[0].topic, primary_page: ps[0].theory[0] || "", problems: ps.map((r) => r.id) };
  }).sort((a, b) => rows.findIndex((r) => r.pattern === a.pattern) - rows.findIndex((r) => r.pattern === b.pattern));

  const { days: _days, ...planHead } = plan;
  const planOut = {
    ...planHead,
    days: days.map((d) => ({
      day: d.day, date: d.date, weekday: d.weekday, cluster: d.cluster, title: d.title,
      content: dayOut.has(d.day) ? "ready" : "pending",
      problems: (d.problems || []).map((p) => p.id),
      skims: (d.skims || []).map((s) => ({ id: s.id, title: s.title, lc: s.lc, theory: s.theory || [] })),
      micro: dayOut.has(d.day) ? { title: dayOut.get(d.day).micro.title, theory: dayOut.get(d.day).micro.theory || [] } : null,
      reading_path: dayOut.has(d.day) ? dayOut.get(d.day).reading_path.map((st) => ({ page: st.page, section: st.section, minutes: st.minutes })) : [],
      core: dayOut.has(d.day) && dayOut.get(d.day).core
        ? { subject: dayOut.get(d.day).core.subject, title: dayOut.get(d.day).core.title, minutes: dayOut.get(d.day).core.minutes,
            topics: dayOut.get(d.day).core.topics, mcqs: (dayOut.get(d.day).core.mcqs || []).length }
        : null
    })),
    core_plan: corePlan,
    // The schedule is public by design (PRD D9): dates from Day 1, unlock times never.
    mocks: mocks.map((m) => ({ id: m.id, day: m.day, date: m.date, weekday: m.weekday, kind: m.kind,
      duration_min: m.duration_min, covers_days: m.covers_days, content: m.content })),
    mock_rules: schedule.rules
  };

  /* Titles of every theory page and section, so a chip or an inline
     [[page#section]] link renders its real name on first paint instead of
     waiting for the 140 KB catalogue. Kind rides along for the badge. */
  const theoryTitles = {};
  for (const page of pages.values()) {
    theoryTitles[page.id] = {
      t: page.title, k: page.kind, topic: page.topic, n: page.notes_status === "ready" ? 1 : 0,
      s: Object.fromEntries((page.sections || []).map((x) => [x.id, x.title]))
    };
  }

  const indexOut = {
    version: 3,
    total: rows.length,
    problems: rows,
    theory: theoryTitles,
    legacy_map: Object.fromEntries(rows.filter((r) => r.legacy_id).map((r) => [r.legacy_id, r.id])),
    patterns: patternList
  };

  const theoryIndexOut = {
    version: 3,
    count: theoryPages.length,
    topics: theoryIndex.topics,
    pages: (theoryIndex.pages || []).map((row) => ({
      ...row, notes_status: pages.get(row.id).notes_status, used: (usedBy.get(row.id) || []).length,
      // What the Library search looks through besides title and summary
      // (v3.1 §9): the outline note and the recall questions, flattened.
      search: [pages.get(row.id).note || "", ...(pages.get(row.id).recall || []).map((r) => r.q)]
        .join(" ").replace(/[`*_#>\[\]•◦✎]/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 4000)
    }))
  };

  /* What the cron needs, and nothing else. The Worker cannot read public/
     cheaply from a scheduled handler, and a nudge has to name the next
     action with its link -- so the thin plan is bundled, like the OAs. */
  const workerPlan = {
    start_date: plan.start_date,
    end_date: plan.end_date,
    floor: plan.floor,
    days: planOut.days.map((d) => ({
      day: d.day, date: d.date, title: d.title, cluster: d.cluster, content: d.content,
      micro_theory: d.micro ? d.micro.theory : [],
      drill: dayOut.has(d.day) ? dayOut.get(d.day).drill.map((it) => it.id) : [],
      cs_core: dayOut.has(d.day) && dayOut.get(d.day).cs_core ? dayOut.get(d.day).cs_core.id : null,
      core: dayOut.has(d.day) && dayOut.get(d.day).core ? { title: dayOut.get(d.day).core.title, subject: dayOut.get(d.day).core.subject } : null,
      reading_steps: dayOut.has(d.day) ? dayOut.get(d.day).reading_path.length : 0,
      problems: rows.filter((r) => r.day === d.day).sort((a, b) => a.ord - b.ord).map((r) => ({
        id: r.id, ord: r.ord, role: r.role, title: r.title, url: r.url, difficulty: r.difficulty,
        theory: r.theory, must: r.must,
        before: problemOut.has(r.id) ? problemOut.get(r.id).theory_refs.filter((x) => x.when === "before").length : 0
      }))
    })),
    rules: schedule.rules,
    mocks
  };

  const outputs = new Map();
  outputs.set("plan.json", planOut);
  outputs.set("index.json", indexOut);
  outputs.set("schedule.json", schedule);
  outputs.set("theory-index.json", theoryIndexOut);
  for (const page of theoryPages) outputs.set(`theory/${page.id}.json`, page);
  for (const [n, day] of dayOut) outputs.set(`day/${n}.json`, day);
  for (const [id, p] of problemOut) outputs.set(`problem/${id}.json`, p);

  return {
    errors,
    warnings,
    outputs,
    worker: {
      "oa-content.json": { count: oaMocks.length, mocks: oaMocks },
      "dsa-plan.json": workerPlan,
      // The drill with its answers, for the Groq check: the grader has to
      // know the reference pattern and approach to compare against.
      // CS core explain prompts with the topics' note outlines: what the
      // Groq grader compares an explanation against (v3.1 §7).
      "dsa-core.json": {
        days: Object.fromEntries([...dayOut.values()].filter((d) => d.core).map((d) => [d.day, {
          subject: d.core.subject, title: d.core.title, explain: d.core.explain,
          notes: (d.core.topics || []).map((t) => ({ page: t, title: pages.get(t).title, note: pages.get(t).note || "" }))
        }]))
      },
      "dsa-drill.json": {
        items: Object.fromEntries([...dayOut.values()].flatMap((d) => d.drill.map((it) => [it.id, {
          day: d.day, title: it.title, statement: it.statement, details: it.details || "",
          pattern_name: it.pattern_name, approach: it.approach, trigger: it.trigger, complexity: it.complexity
        }])))
      }
    },
    stats: {
      problems: rows.length, ready_days: dayOut.size, pending_days: pendingDays,
      skims: planOut.days.reduce((n, d) => n + d.skims.length, 0),
      pages: theoryPages.length, siblings: siblingTotal, drill: drillTotal,
      mocks_ready: oaMocks.length, mocks_pending: mocks.length - oaMocks.length
    }
  };
}

// ---------------------------------------------------------------- report + write

function listJson(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listJson(p, base));
    else if (e.name.endsWith(".json")) out.push(relative(base, p));
  }
  return out;
}

/** Per-day movement against what is already in data/dsa, so a re-import
 *  says what it actually did. A day counts as changed when its day file or
 *  any of its problem files changed. */
function diff(out, outputs) {
  const prev = (rel) => {
    const p = join(out, rel);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  };
  const byDay = new Map();
  for (const [rel, value] of outputs) {
    const m = rel.match(/^(day|problem)\//);
    if (!m) continue;
    const day = value.day;
    const was = prev(rel);
    const now = JSON.stringify(value);
    const state = was === null ? "added" : was === now ? "unchanged" : "changed";
    const cur = byDay.get(day) || { added: 0, changed: 0, unchanged: 0 };
    cur[state]++;
    byDay.set(day, cur);
  }
  const stale = listJson(out).filter((rel) => !outputs.has(rel));
  return { byDay, stale };
}

function writeOutputs(out, result) {
  const { byDay, stale } = diff(out, result.outputs);
  mkdirSync(out, { recursive: true });
  // Removed first: v2's phase files, templates and pattern index would
  // otherwise be served next to the v3 content and look current.
  for (const rel of stale) rmSync(join(out, rel));
  for (const [rel, value] of result.outputs) {
    const target = join(out, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(value));
  }
  for (const [name, value] of Object.entries(result.worker)) {
    writeFileSync(join(ROOT, "worker", name), JSON.stringify(value));
  }
  return { byDay, stale };
}

function main() {
  const check = process.argv.includes("--check");
  const src = join(ROOT, "docs", "dsa-sheet", "v3");
  const out = join(ROOT, "data", "dsa");
  const result = importDsa({ src });

  if (result.errors.length) {
    console.error(`\nrefusing to import -- ${result.errors.length} error(s):\n`);
    result.errors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  const { byDay, stale } = check ? diff(out, result.outputs) : writeOutputs(out, result);
  const s = result.stats;
  const kb = (v) => (JSON.stringify(v).length / 1024).toFixed(1) + " KB";

  console.log(check ? "\nDSA import (v3) — check only, nothing written\n" : "\nDSA import (v3)\n");
  for (const [day, r] of [...byDay].sort((a, b) => a[0] - b[0])) {
    const bits = [];
    if (r.added) bits.push(`${r.added} added`);
    if (r.changed) bits.push(`${r.changed} changed`);
    if (r.unchanged) bits.push(`${r.unchanged} unchanged`);
    console.log(`  day ${String(day).padStart(2)}  ${bits.join(", ")}`);
  }
  if (stale.length) console.log(`  removed  ${stale.length} file(s) the content no longer produces`);
  console.log(`\n  problems     ${s.problems} (${s.ready_days} days ready, ${s.pending_days.length} pending)`);
  console.log(`  skims        ${s.skims}`);
  console.log(`  theory       ${s.pages} pages`);
  console.log(`  siblings     ${s.siblings}`);
  console.log(`  drill        ${s.drill}`);
  console.log(`  mocks        ${s.mocks_ready} ready, ${s.mocks_pending} pending`);
  console.log(`  plan.json    ${kb(result.outputs.get("plan.json"))}  (baked into the page)`);
  console.log(`  index.json   ${kb(result.outputs.get("index.json"))}  (baked into the page)`);
  console.log(`  OA bundle    ${kb(result.worker["oa-content.json"])}  (Worker only, never public/)`);
  console.log(`  cron plan    ${kb(result.worker["dsa-plan.json"])}  (Worker only)`);
  if (result.warnings.length) {
    console.log(`\n  ${result.warnings.length} warning(s):`);
    result.warnings.forEach((w) => console.log(`    ${w}`));
  }
  console.log("");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
