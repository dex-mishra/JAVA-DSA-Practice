-- DSA v3.1: reader, notes, recall, CS core (PRD-v3.1 §13.1). Additive only.
-- (The PRD names this 0004; 0004 was already taken by the Groq drill check.)
--
--   npx wrangler d1 execute launch-console --local  --file=./migrations/0005_dsa_v31.sql
--   npx wrangler d1 execute launch-console --remote --file=./migrations/0005_dsa_v31.sql

CREATE TABLE IF NOT EXISTS dsa_page_note (
  page_id TEXT PRIMARY KEY, noted INTEGER NOT NULL DEFAULT 0,
  goodnotes_ref TEXT NOT NULL DEFAULT '', noted_on TEXT, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_recall (
  item_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0, due_on TEXT, last_result INTEGER,
  updated_at REAL NOT NULL);
CREATE INDEX IF NOT EXISTS dsa_recall_due ON dsa_recall (due_on);

CREATE TABLE IF NOT EXISTS dsa_core_day (
  day INTEGER PRIMARY KEY, topics_done TEXT NOT NULL DEFAULT '[]',
  mcq_score INTEGER, mcq_total INTEGER, mcq_answers TEXT NOT NULL DEFAULT '{}',
  explain_text TEXT NOT NULL DEFAULT '', explain_feedback TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_reading (
  path_key TEXT PRIMARY KEY, step INTEGER NOT NULL DEFAULT 0, done INTEGER NOT NULL DEFAULT 0,
  updated_at REAL NOT NULL);
