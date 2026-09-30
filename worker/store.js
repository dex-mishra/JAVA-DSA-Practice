/**
 * D1 access, and the two shapes the state comes in.
 *
 * `doc` rows are whole JSON documents, the direct descendants of the GCS
 * objects the Cloud Run console kept. `dsa_progress` rows are real columns,
 * because that is the one table written a problem at a time.
 */

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
  my_approach: ""
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
    my_approach: row.my_approach || ""
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

const COLUMNS = ["status", "revision", "notes", "tags", "confidence", "last_revised", "goodnotes_ref", "my_approach"];

/** Apply a validated patch to one problem, creating the row if needed.
 *
 *  A row back at every default is absence, not state, so it is deleted
 *  rather than stored -- the same collapse the bucket version did, and the
 *  reason an untouched sheet costs nothing.
 */
export async function patchDsaProgress(db, problemId, patch) {
  const existing = await db
    .prepare("SELECT * FROM dsa_progress WHERE problem_id = ?")
    .bind(problemId)
    .first();

  const now = { ...DSA_DEFAULTS, ...rowToProgress(existing), ...patch };

  // Moving off todo stamps the revision date, unless the caller set one
  // explicitly. Typing today's date by hand every time is the kind of
  // friction that stops a field being used at all.
  if (patch.status !== undefined && patch.status !== "todo" && patch.last_revised === undefined) {
    now.last_revised = new Date().toISOString().slice(0, 10);
  }

  const bare =
    now.status === "todo" && !now.revision && !now.notes && now.tags.length === 0 &&
    now.confidence === null && !now.goodnotes_ref && !now.my_approach;

  await writeDoc(db, DOC.DSA_META, { updated_ts: Date.now() / 1000 });

  if (bare) {
    await db.prepare("DELETE FROM dsa_progress WHERE problem_id = ?").bind(problemId).run();
    return { ...DSA_DEFAULTS, tags: [] };
  }

  await db
    .prepare(
      `INSERT INTO dsa_progress (problem_id, ${COLUMNS.join(", ")}, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(problem_id) DO UPDATE SET
         ${COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ")},
         updated_at = excluded.updated_at`
    )
    .bind(
      problemId,
      now.status,
      now.revision ? 1 : 0,
      now.notes,
      JSON.stringify(now.tags),
      now.confidence,
      now.last_revised,
      now.goodnotes_ref,
      now.my_approach,
      Date.now() / 1000
    )
    .run();

  return now;
}
