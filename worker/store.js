/**
 * D1 access, and the two shapes the state comes in.
 *
 * `doc` rows are whole JSON documents, the direct descendants of the GCS
 * objects the Cloud Run console kept. `dsa_progress` rows are real columns,
 * because that is the one table written a problem at a time.
 */

import { istDate, nextResolveOn } from "../shared/dsa-core.mjs";

export const DOC = {
  PROGRESS: "progress",
  /* When DSA progress was last written, as opposed to what it says.
     `updated_ts` used to be the newest `updated_at` across the rows, which
     made "the server has zero rows" and "the server has never been written
     to" the same answer: 0. The page treats the second as permission to
     upload its local cache, so clearing every problem on one device made
     the next device quietly restore them. A marker that outlives the rows
     tells the two apart. */
  DSA_META: "dsa_meta",
  MBA_CUSTOM: "mba_custom",
  GOALS: "goals",
  CODEFORCES: "codeforces",
  OPPORTUNITIES: "opportunities"
};

export async function readDoc(db, key, fallback) {
  const row = await db.prepare("SELECT json, updated_ts FROM doc WHERE key = ?").bind(key).first();
  if (!row) return { data: fallback, updated_ts: 0 };
  try {
    return { data: JSON.parse(row.json), updated_ts: row.updated_ts };
  } catch {
    // A row that exists but will not parse is deliberately not repaired:
    // overwriting it would destroy state, and the caller seeing the fallback
    // is better than the caller seeing a 500 for every request afterwards.
    return { data: fallback, updated_ts: row.updated_ts };
  }
}

export async function writeDoc(db, key, data) {
  const ts = Date.now() / 1000;
  await db
    .prepare("INSERT INTO doc (key, json, updated_ts) VALUES (?, ?, ?) " +
             "ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_ts = excluded.updated_ts")
    .bind(key, JSON.stringify(data), ts)
    .run();
  return ts;
}

/**
 * Read-modify-write one document.
 *
 * The bucket version used an if-generation-match compare-and-swap so that a
 * write could not silently discard a concurrent one. D1 gives the same
 * guarantee more cheaply: a single statement that does the merge in SQL, so
 * there is no window between the read and the write at all.
 *
 * `mutate` receives the document and returns the version to store.
 */
export async function mutateDoc(db, key, fallback, mutate) {
  const current = await readDoc(db, key, fallback);
  const next = mutate(structuredClone(current.data));
  await writeDoc(db, key, next);
  return next;
}

// ---------------------------------------------------------------- dsa rows

export const DSA_DEFAULTS = {
  status: "todo",
  revision: false,
  notes: "",
  tags: [],
  confidence: null,
  last_revised: null,
  goodnotes_ref: "",
  my_approach: "",
  // v3
  my_pseudocode: "",
  first_done_at: null,
  minutes_spent: null,
  resolve_stage: 0,
  next_resolve_on: null,
  cut_state: ""
};

/** A database row as the page expects it: booleans as booleans, tags parsed. */
export function rowToProgress(row) {
  if (!row) return { ...DSA_DEFAULTS, tags: [] };
  let tags = [];
  try {
    const parsed = JSON.parse(row.tags || "[]");
    if (Array.isArray(parsed)) tags = parsed;
  } catch { /* a malformed tag list is an empty one, not an error */ }
  return {
    status: row.status || "todo",
    revision: !!row.revision,
    notes: row.notes || "",
    tags,
    confidence: row.confidence === null || row.confidence === undefined ? null : Number(row.confidence),
    last_revised: row.last_revised || null,
    goodnotes_ref: row.goodnotes_ref || "",
    my_approach: row.my_approach || "",
    my_pseudocode: row.my_pseudocode || "",
    first_done_at: row.first_done_at || null,
    minutes_spent: row.minutes_spent === null || row.minutes_spent === undefined ? null : Number(row.minutes_spent),
    resolve_stage: Number(row.resolve_stage) || 0,
    next_resolve_on: row.next_resolve_on || null,
    cut_state: row.cut_state || ""
  };
}

/** Every touched problem, keyed by id. Untouched problems are simply absent,
 *  which is what keeps this proportional to work done rather than to the
 *  size of the sheet. */
export async function readDsaProgress(db) {
  const { results } = await db.prepare("SELECT * FROM dsa_progress").all();
  const out = {};
  let newestRow = 0;
  for (const row of results || []) {
    out[row.problem_id] = rowToProgress(row);
    if (row.updated_at > newestRow) newestRow = row.updated_at;
  }

  /* The marker wins when it exists. It is written on every patch and never
     deleted, so a non-zero value means "this account has DSA progress,
     whatever the current rows say" -- including when the honest answer is
     that every problem is back to todo. */
  const meta = await readDoc(db, DOC.DSA_META, {});
  const updated = meta.data.updated_ts || newestRow;

  return { problems: out, updated_ts: updated };
}

const COLUMNS = ["status", "revision", "notes", "tags", "confidence", "last_revised", "goodnotes_ref", "my_approach",
  "my_pseudocode", "first_done_at", "minutes_spent", "resolve_stage", "next_resolve_on", "cut_state"];

/** Apply a validated patch to one problem, creating the row if needed.
 *
 *  A row back at every default is absence, not state, so it is deleted
 *  rather than stored -- the same collapse the bucket version did, and the
 *  reason an untouched sheet costs nothing.
 */
export async function patchDsaProgress(db, problemId, patch, { now = Date.now() } = {}) {
  const existing = await db
    .prepare("SELECT * FROM dsa_progress WHERE problem_id = ?")
    .bind(problemId)
    .first();

  const before = rowToProgress(existing);
  const next = { ...DSA_DEFAULTS, ...before, ...patch };
  const today = istDate(now);

  // Moving off todo stamps the revision date, unless the caller set one
  // explicitly. IST, like every other date in the plan.
  if (patch.status !== undefined && patch.status !== "todo" && patch.last_revised === undefined) {
    next.last_revised = today;
  }

  /* The first time a problem leaves todo is the moment the re-solve ladder
     starts (PRD §8.3): first_done_at, the timer's minutes, and the +2 re-solve.
     Stamped here rather than by the page so two tabs cannot disagree, and
     never overwritten -- a later revisit is not a first solve. */
  if (patch.status !== undefined && patch.status !== "todo" && !before.first_done_at) {
    next.first_done_at = today;
    next.resolve_stage = 0;
    next.next_resolve_on = nextResolveOn(today, 0);
    if (patch.minutes_spent === undefined) next.minutes_spent = null;
  }
  /* Back to todo before any re-solve happened is an undo of a mis-click, so
     the ladder it started is undone with it. After a re-solve it is a real
     history and stays. */
  if (patch.status === "todo" && before.first_done_at && before.resolve_stage === 0) {
    next.first_done_at = null;
    next.next_resolve_on = null;
    next.minutes_spent = null;
  }

  const bare =
    next.status === "todo" && !next.revision && !next.notes && next.tags.length === 0 &&
    next.confidence === null && !next.goodnotes_ref && !next.my_approach &&
    !next.my_pseudocode && !next.first_done_at && next.minutes_spent === null &&
    !next.resolve_stage && !next.next_resolve_on && !next.cut_state;

  await writeDoc(db, DOC.DSA_META, { updated_ts: now / 1000 });

  if (bare) {
    await db.prepare("DELETE FROM dsa_progress WHERE problem_id = ?").bind(problemId).run();
    return { ...DSA_DEFAULTS, tags: [] };
  }

  await db
    .prepare(
      `INSERT INTO dsa_progress (problem_id, ${COLUMNS.join(", ")}, updated_at)
       VALUES (${["?"].concat(COLUMNS.map(() => "?"), ["?"]).join(", ")})
       ON CONFLICT(problem_id) DO UPDATE SET
         ${COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ")},
         updated_at = excluded.updated_at`
    )
    .bind(
      problemId,
      next.status,
      next.revision ? 1 : 0,
      next.notes,
      JSON.stringify(next.tags),
      next.confidence,
      next.last_revised,
      next.goodnotes_ref,
      next.my_approach,
      next.my_pseudocode,
      next.first_done_at,
      next.minutes_spent,
      next.resolve_stage,
      next.next_resolve_on,
      next.cut_state,
      now / 1000
    )
    .run();

  return next;
}

// ---------------------------------------------------------------- v3 ledgers

/* Siblings, drill attempts and the per-day ledger. Small tables written one
   row at a time, read whole at boot alongside progress -- for one user over
   thirty days that is a few hundred rows at most. */

export async function readDsaLedgers(db) {
  const [sib, drill, days] = await Promise.all([
    db.prepare("SELECT * FROM dsa_sibling").all(),
    db.prepare("SELECT * FROM dsa_drill").all(),
    db.prepare("SELECT * FROM dsa_day").all()
  ]);
  const siblings = {};
  for (const r of sib.results || []) {
    siblings[r.sibling_id] = { parent_id: r.parent_id, studied: !!r.studied, solved: !!r.solved,
      studied_on: r.studied_on || null, notes: r.notes || "" };
  }
  const drillOut = {};
  for (const r of drill.results || []) {
    drillOut[r.item_id] = { day: r.day, guess: r.guess || "", correct: r.correct === null ? null : !!r.correct,
      answered_on: r.answered_on || null };
  }
  const dayOut = {};
  for (const r of days.results || []) {
    dayOut[r.day] = { kept: !!r.kept, micro_read: !!r.micro_read, cs_core_done: !!r.cs_core_done, note: r.note || "" };
  }
  return { siblings, drill: drillOut, days: dayOut };
}

export async function patchSibling(db, id, patch, { now = Date.now() } = {}) {
  const row = await db.prepare("SELECT * FROM dsa_sibling WHERE sibling_id = ?").bind(id).first();
  const cur = row
    ? { parent_id: row.parent_id, studied: !!row.studied, solved: !!row.solved, studied_on: row.studied_on || null, notes: row.notes || "" }
    : { parent_id: patch.parent_id || "", studied: false, solved: false, studied_on: null, notes: "" };
  const next = { ...cur, ...patch };
  if (patch.studied === true && !cur.studied) next.studied_on = istDate(now);
  if (patch.studied === false) next.studied_on = null;
  if (!next.parent_id) throw new Error("parent_id is required the first time a sibling is written");
  await db.prepare(
    `INSERT INTO dsa_sibling (sibling_id, parent_id, studied, solved, studied_on, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(sibling_id) DO UPDATE SET parent_id = excluded.parent_id, studied = excluded.studied,
       solved = excluded.solved, studied_on = excluded.studied_on, notes = excluded.notes,
       updated_at = excluded.updated_at`
  ).bind(id, next.parent_id, next.studied ? 1 : 0, next.solved ? 1 : 0, next.studied_on, next.notes, now / 1000).run();
  await writeDoc(db, DOC.DSA_META, { updated_ts: now / 1000 });
  return next;
}

export async function patchDrill(db, id, patch, { now = Date.now() } = {}) {
  const row = await db.prepare("SELECT * FROM dsa_drill WHERE item_id = ?").bind(id).first();
  const cur = row
    ? { day: row.day, guess: row.guess || "", correct: row.correct === null ? null : !!row.correct, answered_on: row.answered_on || null }
    : { day: patch.day, guess: "", correct: null, answered_on: null };
  const next = { ...cur, ...patch };
  if (!Number.isInteger(next.day)) throw new Error("day is required the first time a drill item is written");
  if (patch.correct !== undefined && patch.correct !== null && cur.correct === null) next.answered_on = istDate(now);
  if (patch.correct === null) next.answered_on = null;
  await db.prepare(
    `INSERT INTO dsa_drill (item_id, day, guess, correct, answered_on, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(item_id) DO UPDATE SET day = excluded.day, guess = excluded.guess, correct = excluded.correct,
       answered_on = excluded.answered_on, updated_at = excluded.updated_at`
  ).bind(id, next.day, next.guess, next.correct === null ? null : next.correct ? 1 : 0, next.answered_on, now / 1000).run();
  await writeDoc(db, DOC.DSA_META, { updated_ts: now / 1000 });
  return next;
}

export async function patchDay(db, day, patch, { now = Date.now() } = {}) {
  const row = await db.prepare("SELECT * FROM dsa_day WHERE day = ?").bind(day).first();
  const cur = row
    ? { kept: !!row.kept, micro_read: !!row.micro_read, cs_core_done: !!row.cs_core_done, note: row.note || "" }
    : { kept: false, micro_read: false, cs_core_done: false, note: "" };
  const next = { ...cur, ...patch };
  await db.prepare(
    `INSERT INTO dsa_day (day, kept, micro_read, cs_core_done, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET kept = excluded.kept, micro_read = excluded.micro_read,
       cs_core_done = excluded.cs_core_done, note = excluded.note, updated_at = excluded.updated_at`
  ).bind(day, next.kept ? 1 : 0, next.micro_read ? 1 : 0, next.cs_core_done ? 1 : 0, next.note, now / 1000).run();
  await writeDoc(db, DOC.DSA_META, { updated_ts: now / 1000 });
  return next;
}
