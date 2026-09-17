/**
 * Import the DSA sheet from `dsa material/` into `data/dsa/`.
 *
 *   node tools/import-dsa.mjs
 *   node tools/import-dsa.mjs --check    (validate and report, write nothing)
 *
 * Why an importer rather than dropping the uploads into data/ directly:
 *
 * Content is an input, not state. Phases arrive one at a time, get corrected,
 * and get re-uploaded; a re-import must be idempotent and must never touch
 * what the user has written. So this reads the drop zone, validates it,
 * normalises it, and reports what actually moved -- added, changed,
 * unchanged, per problem. Progress lives in a GCS blob this script cannot
 * reach, which is the other half of the same guarantee.
 *
 * Problem ids are `{topic}-{lc-slug}` and come from the content. They are
 * stable across regenerations and survive a problem moving day or tier,
 * which is what lets progress key on them.
 *
 * Output:
 *   data/dsa/spec.json       phase map, tiers, stuck ladder, AI protocol, tag seeds
 *   data/dsa/templates.json  the C++ pattern templates
 *   data/dsa/phase-<KEY>.json   one per phase: theory, learnings, problems
 *   data/dsa/index.json      thin index -- what the page bakes in and paints from
 *
 * The full phase payloads are served by the console API rather than baked
 * into index.html. At 600 problems the learnings alone are ~2 MB, and that
 * is a page nobody wants to parse on a phone. The thin index is ~140 KB and
 * carries everything a row needs, so the day view paints with no network.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "dsa material");
const OUT = join(ROOT, "data", "dsa");

const CHECK_ONLY = process.argv.includes("--check");

const TIERS = new Set(["CORE", "DRILL", "SKIM"]);
const DIFFICULTY = new Set(["Easy", "Medium", "Hard"]);
const CAMPUS_OA = new Set(["HIGH", "MEDIUM", "LOW"]);
const STATUSES = new Set(["todo", "solved", "revisit"]);

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`could not read ${path}: ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------- sources

if (!existsSync(SRC)) {
  console.error(`no drop zone at ${SRC}`);
  process.exit(1);
}

const spec = readJson(join(SRC, "SPEC.json"));
const templateDoc = readJson(join(SRC, "cpp-pattern-templates.json"));
if (!spec || !templateDoc) {
  errors.forEach((e) => console.error(`  error: ${e}`));
  process.exit(1);
}

const templates = templateDoc.templates || [];
const templateIds = new Set(templates.map((t) => t.id));

const phaseFiles = readdirSync(SRC)
  .filter((f) => /^phase-.*\.json$/.test(f))
  .sort();

if (!phaseFiles.length) {
  console.error(`no phase-*.json in ${SRC}`);
  process.exit(1);
}

// Phase order comes from SPEC, not from filename sort: P2A must precede P2B
// and a lexical sort only happens to get that right.
const phaseOrder = new Map(spec.phases.map((p, i) => [p.key, i]));

// ---------------------------------------------------------------- validate

const phases = [];
const bySlug = new Map(); // lc slug -> problem id, for sibling and citation links
const seenIds = new Map(); // problem id -> phase key, to catch cross-phase duplicates

for (const file of phaseFiles) {
  const doc = readJson(join(SRC, file));
  if (!doc) continue;

  const key = doc.phase;
  const specPhase = spec.phases.find((p) => p.key === key);
  if (!specPhase) {
    fail(`${file}: phase ${key!== undefined ? key : "(none)"} is not in SPEC.json`);
    continue;
  }
  if (!phaseOrder.has(key)) fail(`${file}: unknown phase key ${key}`);

  const problems = doc.problems || [];

  // problem_count is the file's own claim about itself. A mismatch means the
  // upload was truncated, which is worth failing on rather than importing a
  // partial phase that looks complete.
  if (doc.problem_count !== problems.length) {
    fail(`${file}: declares problem_count ${doc.problem_count} but carries ${problems.length} problems`);
  }

  // The SPEC quota is a plan, not a contract -- phases come in a little over
  // or under. Worth saying out loud, not worth refusing.
  if (specPhase.quota !== problems.length) {
    warn(`${key}: SPEC quota ${specPhase.quota}, file has ${problems.length}`);
  }

  const [dayStart, dayEnd] = doc.days || specPhase.days;

  for (const p of problems) {
    const where = `${file}:${p.id || "(no id)"}`;
    if (!p.id) fail(`${where}: missing id`);
    else if (seenIds.has(p.id)) fail(`${where}: duplicate id, also in ${seenIds.get(p.id)}`);
    else seenIds.set(p.id, file);

    if (!TIERS.has(p.tier)) fail(`${where}: tier ${JSON.stringify(p.tier)} not one of CORE/DRILL/SKIM`);
    if (!CAMPUS_OA.has(p.campus_oa)) fail(`${where}: campus_oa ${JSON.stringify(p.campus_oa)} not one of HIGH/MEDIUM/LOW`);
    if (!p.lc || !DIFFICULTY.has(p.lc.difficulty)) {
      fail(`${where}: difficulty ${JSON.stringify(p.lc && p.lc.difficulty)} not one of Easy/Medium/Hard`);
    }
    if (!p.lc || !p.lc.slug || !p.lc.url) fail(`${where}: missing lc.slug or lc.url`);
    if (typeof p.day !== "number" || p.day < dayStart || p.day > dayEnd) {
      warn(`${where}: day ${p.day} outside phase range ${dayStart}-${dayEnd}`);
    }
    if (!p.learnings || !p.learnings.insight) fail(`${where}: missing learnings.insight`);

    // A dangling template deep-link renders as a dead end in the UI. Warn
    // rather than fail: the template library is a separate file that can
    // legitimately lag a phase upload.
    if (p.template && !templateIds.has(p.template)) {
      warn(`${where}: template ${p.template} is not in cpp-pattern-templates.json`);
    }

    if (p.lc && p.lc.slug) {
      if (bySlug.has(p.lc.slug)) fail(`${where}: lc slug ${p.lc.slug} already used by ${bySlug.get(p.lc.slug)}`);
      else bySlug.set(p.lc.slug, p.id);
    }
  }

  phases.push({ key, file, doc, specPhase, dayStart, dayEnd, problems });
}

phases.sort((a, b) => phaseOrder.get(a.key) - phaseOrder.get(b.key));

// Cross-reference pass, once every problem is known.
let danglingSiblings = 0;
for (const { file, doc, problems } of phases) {
  for (const p of problems) {
    for (const s of (p.learnings && p.learnings.siblings) || []) {
      if (!bySlug.has(s)) danglingSiblings++;
    }
  }
  for (const l of doc.learnings || []) {
    for (const a of l.applied || []) {
      if (!bySlug.has(a[0])) {
        warn(`${file}:${l.id}: cites ${a[0]}, which is not a problem in the sheet`);
      }
    }
  }
}
if (danglingSiblings) {
  // Expected while phases are still arriving, and expected forever for
  // siblings that were deliberately left out of the 600. The UI renders
  // these as plain LeetCode links instead of internal ones.
  warn(`${danglingSiblings} sibling references point outside the sheet (rendered as external links)`);
}

if (errors.length) {
  console.error(`\nrefusing to import -- ${errors.length} error(s):\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

// ---------------------------------------------------------------- normalise

/** The page's row shape. Everything a problem row, badge or filter needs,
 *  and nothing it does not -- the learnings payload is the other 90% of the
 *  bytes and is fetched on demand. */
function thin(p) {
  return {
    id: p.id,
    phase: p.phase,
    day: p.day,
    ord: p.order,
    topic: p.topic,
    tier: p.tier,
    title: p.title,
    lc_id: p.lc.id || "",
    slug: p.lc.slug,
    url: p.lc.url,
    difficulty: p.lc.difficulty,
    ac_rate: p.lc.ac_rate == null ? null : p.lc.ac_rate,
    lc_tags: p.lc.tags || [],
    pattern: p.pattern || "",
    template: p.template || "",
    companies: p.companies || [],
    campus_oa: p.campus_oa,
    // Cheap flags so a row can advertise what opening it will show.
    tuf: !!(p.tuf && (p.tuf.article || p.tuf.youtube)),
    followups: ((p.learnings && p.learnings.followups) || []).length
  };
}

/** The stored problem. `user_fields` is stripped: it is the schema's default
 *  row, and keeping a copy next to the content invites someone to write to
 *  it. Real progress lives in the console's own blob, keyed by problem id. */
function content(p) {
  const { user_fields, ...rest } = p;
  return rest;
}

// ---------------------------------------------------------------- report

/** Compare against what is already in data/dsa, so a re-import says what it
 *  actually did. Content-identical problems report as unchanged even when
 *  the upload was regenerated wholesale. */
function diffPhase(key, nextProblems) {
  const path = join(OUT, `phase-${key}.json`);
  const prev = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  const prevById = new Map(((prev && prev.problems) || []).map((p) => [p.id, JSON.stringify(p)]));

  let added = 0;
  let changed = 0;
  let unchanged = 0;
  const changedIds = [];
  for (const p of nextProblems) {
    const now = JSON.stringify(p);
    if (!prevById.has(p.id)) added++;
    else if (prevById.get(p.id) !== now) {
      changed++;
      changedIds.push(p.id);
    } else unchanged++;
    prevById.delete(p.id);
  }
  const removed = [...prevById.keys()];
  return { added, changed, unchanged, removed, changedIds };
}

// ---------------------------------------------------------------- write

if (!CHECK_ONLY) mkdirSync(OUT, { recursive: true });

const index = [];
const phaseSummaries = [];
const reports = [];

for (const { key, doc, specPhase, dayStart, dayEnd, problems } of phases) {
  const normalised = problems.map(content);
  reports.push({ key, ...diffPhase(key, normalised) });

  const payload = {
    key,
    slug: doc.slug || specPhase.slug,
    title: doc.title || specPhase.title,
    goal: doc.goal || specPhase.goal,
    day_start: dayStart,
    day_end: dayEnd,
    problem_count: problems.length,
    theory: doc.theory || [],
    learnings: doc.learnings || [],
    problems: normalised
  };

  if (!CHECK_ONLY) {
    writeFileSync(join(OUT, `phase-${key}.json`), JSON.stringify(payload, null, 1));
  }

  problems.forEach((p) => index.push(thin(p)));

  phaseSummaries.push({
    key,
    slug: payload.slug,
    title: payload.title,
    goal: payload.goal,
    day_start: dayStart,
    day_end: dayEnd,
    problem_count: problems.length,
    theory_count: payload.theory.length,
    learning_count: payload.learnings.length
  });
}

// Day order is the sheet's order: by day, then by the order field within it.
index.sort((a, b) => a.day - b.day || a.ord - b.ord);

const specOut = {
  version: 1,
  pool_size: spec.pool_size,
  total_days: spec.total_days,
  // Every phase SPEC knows about, flagged by whether its content has landed.
  // The page uses this to show the unimported phases as pending rather than
  // pretending the sheet is 261 problems long.
  phases: spec.phases.map((p) => {
    const loaded = phaseSummaries.find((s) => s.key === p.key);
    return {
      key: p.key,
      slug: p.slug,
      title: p.title,
      goal: p.goal,
      day_start: p.days[0],
      day_end: p.days[1],
      quota: p.quota,
      problem_count: loaded ? loaded.problem_count : 0,
      theory_count: loaded ? loaded.theory_count : 0,
      learning_count: loaded ? loaded.learning_count : 0,
      loaded: !!loaded
    };
  }),
  topic_quota: spec.topic_quota,
  tiers: spec.tiers,
  tier_mix: spec.tier_mix,
  user_field_schema: spec.user_field_schema,
  tag_seed: (spec.user_field_schema.tags && spec.user_field_schema.tags.seed) || [],
  statuses: [...STATUSES],
  revision_queue_rule: spec.revision_queue_rule,
  stuck_ladder: spec.stuck_ladder,
  ai_protocol: spec.ai_protocol,
  theory_parts: spec.theory_parts,
  checkpoint_scope: spec.checkpoint_scope,
  decay: spec.decay,
  closed_topic_rollup: spec.closed_topic_rollup
};

const indexOut = {
  version: 1,
  generated: new Date().toISOString(),
  total: index.length,
  problems: index,
  // slug -> id, so a sibling or citation can be resolved to an internal link
  // without shipping the whole problem list twice.
  by_slug: Object.fromEntries(index.map((p) => [p.slug, p.id])),
  // Topic -> the theory section that teaches it, for the day view's header
  // link. Built here because only the importer sees every phase at once.
  theory_for_topic: {}
};

for (const { doc } of phases) {
  for (const t of doc.theory || []) {
    // Theory ids are 't-<topic>'; the few that are not fall back to matching
    // on the id suffix, which is why this is a map and not a string slice.
    const topic = t.id.replace(/^t-/, "");
    indexOut.theory_for_topic[topic] = t.id;
  }
}

if (!CHECK_ONLY) {
  writeFileSync(join(OUT, "spec.json"), JSON.stringify(specOut, null, 1));
  writeFileSync(join(OUT, "templates.json"), JSON.stringify({ count: templates.length, templates }, null, 1));
  writeFileSync(join(OUT, "index.json"), JSON.stringify(indexOut));
}

// ---------------------------------------------------------------- output

const kb = (n) => (n / 1024).toFixed(1) + " KB";

console.log(CHECK_ONLY ? "\nDSA import — check only, nothing written\n" : "\nDSA import\n");

for (const r of reports) {
  const bits = [];
  if (r.added) bits.push(`${r.added} added`);
  if (r.changed) bits.push(`${r.changed} changed`);
  if (r.unchanged) bits.push(`${r.unchanged} unchanged`);
  if (r.removed.length) bits.push(`${r.removed.length} REMOVED`);
  console.log(`  ${r.key.padEnd(4)} ${bits.join(", ")}`);
  // A removal is the one case where progress can be orphaned, so name them.
  r.removed.forEach((id) => console.log(`         gone: ${id}`));
  if (r.changed && r.changed <= 12) r.changedIds.forEach((id) => console.log(`         diff: ${id}`));
}

console.log(`\n  problems    ${index.length} of ${spec.pool_size} in the pool`);
console.log(`  phases      ${phaseSummaries.length} of ${spec.phases.length} imported`);
console.log(`  templates   ${templates.length}`);
console.log(`  index.json  ${kb(JSON.stringify(indexOut).length)}  (baked into the page)`);

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`    ${w}`));
}
console.log("");
