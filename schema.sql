-- Launch Console state, on D1.
--
-- Two shapes, because the data has two shapes.
--
-- `doc` holds the small whole-document state that the Cloud Run version kept
-- as JSON objects in a bucket: topic ticks, the MBA overlay, goals, the
-- Codeforces cache, manually-added opportunities. Each is read and written
-- whole, a few times a day, and none benefits from being pulled apart into
-- columns.
--
-- `dsa_progress` gets real rows, because it is the one thing written a
-- problem at a time. As a document, saving a note meant re-uploading every
-- other problem's notes with it, and two tabs open at once could silently
-- lose an edit. As rows, a write touches one row and the revision queue is
-- an ORDER BY rather than a sort in the browser.

CREATE TABLE IF NOT EXISTS doc (
  key        TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_ts REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS dsa_progress (
  problem_id    TEXT PRIMARY KEY,
  status        TEXT    NOT NULL DEFAULT 'todo',   -- todo | solved | revisit
  revision      INTEGER NOT NULL DEFAULT 0,        -- the Striver star
  notes         TEXT    NOT NULL DEFAULT '',       -- markdown allowed
  tags          TEXT    NOT NULL DEFAULT '[]',     -- JSON array
  confidence    INTEGER,                           -- 1..5, null until rated
  last_revised  TEXT,                              -- YYYY-MM-DD
  goodnotes_ref TEXT    NOT NULL DEFAULT '',       -- opaque, never parsed
  my_approach   TEXT    NOT NULL DEFAULT '',
  updated_at    REAL    NOT NULL
);

-- The revision queue's own ordering: confidence ascending, then least
-- recently revised. SPEC's rule, as an index.
CREATE INDEX IF NOT EXISTS dsa_progress_queue
  ON dsa_progress (confidence, last_revised);

-- Filtering the sheet by status is the other common read.
CREATE INDEX IF NOT EXISTS dsa_progress_status
  ON dsa_progress (status);
