-- DSA v3: the 30-day plan. Additive only -- no column or row is dropped.
--
-- Run once against a database created from an earlier schema.sql:
--
--   npm run db:migrate:local     then     npm run db:migrate
--
-- Not folded into schema.sql as ALTERs because SQLite has no
-- ADD COLUMN IF NOT EXISTS: re-running an ALTER fails, and schema.sql is
-- meant to be safe to re-run. schema.sql instead carries these columns in
-- its CREATE TABLE, for databases created fresh.

ALTER TABLE dsa_progress ADD COLUMN my_pseudocode   TEXT NOT NULL DEFAULT '';
ALTER TABLE dsa_progress ADD COLUMN first_done_at   TEXT;                       -- YYYY-MM-DD, IST
ALTER TABLE dsa_progress ADD COLUMN minutes_spent   INTEGER;
ALTER TABLE dsa_progress ADD COLUMN resolve_stage   INTEGER NOT NULL DEFAULT 0;  -- 0..3
ALTER TABLE dsa_progress ADD COLUMN next_resolve_on TEXT;                       -- YYYY-MM-DD, IST
ALTER TABLE dsa_progress ADD COLUMN cut_state       TEXT NOT NULL DEFAULT '';    -- '' | skim | queued

CREATE INDEX IF NOT EXISTS dsa_progress_resolve ON dsa_progress (next_resolve_on);

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
  correct     INTEGER,
  answered_on TEXT,
  updated_at  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS dsa_day (
  day          INTEGER PRIMARY KEY,
  kept         INTEGER NOT NULL DEFAULT 0,
  micro_read   INTEGER NOT NULL DEFAULT 0,
  cs_core_done INTEGER NOT NULL DEFAULT 0,
  note         TEXT NOT NULL DEFAULT '',
  updated_at   REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS oa_schedule (
  mock_id    TEXT PRIMARY KEY,
  unlock_at  REAL,
  state      TEXT NOT NULL DEFAULT 'scheduled',
  attempt_id INTEGER,
  updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS notify_log (
  key     TEXT PRIMARY KEY,
  sent_at REAL NOT NULL,
  detail  TEXT NOT NULL DEFAULT ''
);

ALTER TABLE oa_attempt ADD COLUMN kind TEXT NOT NULL DEFAULT 'scored';
