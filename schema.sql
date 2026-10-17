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
  status        TEXT    NOT NULL DEFAULT 'todo',   -- todo | solved | revisit | skimmed
  revision      INTEGER NOT NULL DEFAULT 0,        -- the Striver star
  notes         TEXT    NOT NULL DEFAULT '',       -- markdown allowed
  tags          TEXT    NOT NULL DEFAULT '[]',     -- JSON array
  confidence    INTEGER,                           -- 1..5, null until rated
  last_revised  TEXT,                              -- YYYY-MM-DD
  goodnotes_ref TEXT    NOT NULL DEFAULT '',       -- opaque, never parsed
  my_approach   TEXT    NOT NULL DEFAULT '',
  updated_at    REAL    NOT NULL,
  -- v3 (migrations/0003_dsa_v3.sql adds these to an existing database)
  my_pseudocode   TEXT    NOT NULL DEFAULT '',
  first_done_at   TEXT,                            -- YYYY-MM-DD, IST: first time status left todo
  minutes_spent   INTEGER,                         -- from the stuck-ladder timer
  resolve_stage   INTEGER NOT NULL DEFAULT 0,      -- 0..3 cold re-solves done
  next_resolve_on TEXT,                            -- YYYY-MM-DD, IST; null when all done
  cut_state       TEXT    NOT NULL DEFAULT ''      -- '' | skim | queued (PRD §9)
);

-- The revision queue's own ordering: confidence ascending, then least
-- recently revised. SPEC's rule, as an index.
CREATE INDEX IF NOT EXISTS dsa_progress_queue
  ON dsa_progress (confidence, last_revised);

-- Filtering the sheet by status is the other common read.
CREATE INDEX IF NOT EXISTS dsa_progress_status
  ON dsa_progress (status);

CREATE INDEX IF NOT EXISTS dsa_progress_resolve
  ON dsa_progress (next_resolve_on);

-- v3 per-thing ledgers. Siblings and drill items have their own ids in the
-- same namespace as plan problems, but different fields, so they get their
-- own tables rather than half-empty dsa_progress rows.

CREATE TABLE IF NOT EXISTS dsa_sibling (
  sibling_id TEXT PRIMARY KEY,
  parent_id  TEXT NOT NULL,
  studied    INTEGER NOT NULL DEFAULT 0,
  solved     INTEGER NOT NULL DEFAULT 0,
  studied_on TEXT,
  notes      TEXT NOT NULL DEFAULT '',
  updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS dsa_drill (
  item_id     TEXT PRIMARY KEY,
  day         INTEGER NOT NULL,
  guess       TEXT NOT NULL DEFAULT '',
  correct     INTEGER,                  -- null until marked (by Groq or by hand)
  answered_on TEXT,
  updated_at  REAL NOT NULL,
  ai_verdict  TEXT,                     -- correct | partial | wrong (migrations/0004_dsa_ai.sql)
  ai_feedback TEXT NOT NULL DEFAULT ''
);

-- The Groq free-tier guard: requests and tokens per minute and per day.
CREATE TABLE IF NOT EXISTS ai_usage (
  minute_key TEXT PRIMARY KEY,
  requests   INTEGER NOT NULL,
  tokens     INTEGER NOT NULL
);

-- One row per plan day: was the floor met, and the two once-a-day ticks.
CREATE TABLE IF NOT EXISTS dsa_day (
  day          INTEGER PRIMARY KEY,
  kept         INTEGER NOT NULL DEFAULT 0,
  micro_read   INTEGER NOT NULL DEFAULT 0,
  cs_core_done INTEGER NOT NULL DEFAULT 0,
  note         TEXT NOT NULL DEFAULT '',
  updated_at   REAL NOT NULL
);

-- Runtime state for MOCK-SCHEDULE.json. The dates are content; the unlock
-- time is drawn once, on the morning, and lives here.
CREATE TABLE IF NOT EXISTS oa_schedule (
  mock_id    TEXT PRIMARY KEY,
  unlock_at  REAL,                       -- epoch ms
  state      TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled|revealed|unlocked|started|submitted|missed
  attempt_id INTEGER,
  updated_at REAL NOT NULL
);

-- Every cron send is keyed here first, so a retried run never sends twice.
CREATE TABLE IF NOT EXISTS notify_log (
  key     TEXT PRIMARY KEY,              -- e.g. nudge:2026-10-18:11
  sent_at REAL NOT NULL,
  detail  TEXT NOT NULL DEFAULT ''
);

-- Mock online assessments.
--
-- Only the attempt is a table. The mocks and their problems live in the
-- Worker bundle (worker/oa-content.json, written by tools/import-dsa.mjs),
-- because PRD §5.1 requires that hidden tests never reach the client and
-- anything under public/ is world-readable. Bundling also means content
-- regenerates with a deploy instead of drifting from a seed script.
--
-- `per_problem` holds the submitted code, so an attempt is reviewable
-- months later without the browser's local draft still existing.

CREATE TABLE IF NOT EXISTS oa_attempt (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mock_id     TEXT    NOT NULL,
  started_at  REAL    NOT NULL,     -- server clock; the timer is computed from this
  ended_at    REAL,                 -- null while in progress
  score       INTEGER,              -- null until finished
  per_problem TEXT    NOT NULL DEFAULT '{}',  -- {qid: {code, lang, passed, total, marks, tests, minutes}}
  notes       TEXT    NOT NULL DEFAULT '',
  kind        TEXT    NOT NULL DEFAULT 'scored'   -- scored | practice (taken after the window)
);

-- History reads newest-first and the in-progress check reads ended_at.
CREATE INDEX IF NOT EXISTS oa_attempt_recent ON oa_attempt (started_at DESC);
CREATE INDEX IF NOT EXISTS oa_attempt_open   ON oa_attempt (ended_at);
