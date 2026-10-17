-- Groq-checked recognition drill. Additive only.
--
--   npx wrangler d1 execute launch-console --local  --file=./migrations/0004_dsa_ai.sql
--   npx wrangler d1 execute launch-console --remote --file=./migrations/0004_dsa_ai.sql

ALTER TABLE dsa_drill ADD COLUMN ai_verdict  TEXT;   -- correct | partial | wrong, null until checked
ALTER TABLE dsa_drill ADD COLUMN ai_feedback TEXT NOT NULL DEFAULT '';

-- The free-tier guard (PRD-v3 §12): one row per minute and one per day.
CREATE TABLE IF NOT EXISTS ai_usage (
  minute_key TEXT PRIMARY KEY,            -- 'm:YYYY-MM-DDTHH:MM' or 'd:YYYY-MM-DD' (UTC)
  requests   INTEGER NOT NULL,
  tokens     INTEGER NOT NULL
);
