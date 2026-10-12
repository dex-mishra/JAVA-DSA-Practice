# DSA Sheet — Claude Code handoff

Everything needed to build the DSA tab on top of the existing inbox-agent / placement-tracker repo.

---

## 1. Files to hand over

| File | Role | Authoritative? |
|---|---|---|
| `phase-N-*.json` | Content: theory, problems, learnings per phase | **Yes** — the build reads these |
| `phase-N-*.md` | Same content, human-readable | No — for reading, not parsing |
| `cpp-pattern-templates.json` | 73 C++ pattern templates | **Yes** |
| `cpp-pattern-templates.md` | Same, human-readable | No |
| `SPEC.json` | Phase map, tier definitions, user-field schema, revision rule, stuck ladder | **Yes** |
| `HANDOFF.md` | This file | Read once |

**Parse the JSON, never the markdown.** The MD is generated from the same source and is there for reading in an editor or rendering as a fallback. Every field the UI needs exists in the JSON.

---

## 2. What is already in the repo, and how this fits

The tracker today models progress as **topics**:

```
tracks:  cv | ds | sde | plan
topic:   { id, label, track, track_label, section, group, rated, done }
mastery: { rating, rank, done, total, percent }     // Codeforces-style, currently 903 / Newbie
streak_days
window_integrity: { dated_items, missed, percent }
```

The DSA sheet is a **different shape** — problems carry links, difficulty, tiers, company tags and a learnings payload, none of which fit the `topics` table. So:

- **Do not** force DSA problems into `topics`. Create new tables.
- **Do** feed the existing `mastery` and `streak_days` systems from DSA activity, so one number still represents overall readiness.
- The `sde` track already has 654 topics at 3 done. DSA problems should contribute to SDE mastery rather than forming a fifth track, unless you want the split visible.

**Decide this explicitly before coding** — it is the one architectural choice that is painful to reverse.

---

## 3. Data model

### Content tables (regenerated from JSON, never edited by the user)

```sql
CREATE TABLE dsa_phase (
  key           TEXT PRIMARY KEY,        -- 'P0','P1','P2A','P2B','P3','P4'
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  goal          TEXT NOT NULL,
  day_start     INT  NOT NULL,
  day_end       INT  NOT NULL,
  problem_count INT  NOT NULL
);

CREATE TABLE dsa_theory (
  id       TEXT PRIMARY KEY,             -- 't-complexity', 't-arrays', ...
  phase    TEXT REFERENCES dsa_phase(key),
  title    TEXT NOT NULL,
  links    JSONB,                        -- array of markdown links
  parts    JSONB NOT NULL                -- { breadth, depth, analogy }
);

CREATE TABLE dsa_problem (
  id          TEXT PRIMARY KEY,          -- '{topic}-{slug}', stable across regenerations
  phase       TEXT REFERENCES dsa_phase(key),
  day         INT  NOT NULL,             -- 1..40
  ord         INT  NOT NULL,             -- order within the phase
  topic       TEXT NOT NULL,
  tier        TEXT NOT NULL,             -- 'CORE' | 'DRILL' | 'SKIM'
  title       TEXT NOT NULL,
  lc_id       TEXT,
  lc_slug     TEXT NOT NULL,
  lc_url      TEXT NOT NULL,
  difficulty  TEXT NOT NULL,             -- 'Easy' | 'Medium' | 'Hard'
  ac_rate     REAL,
  lc_tags     JSONB,
  tuf_article TEXT,                      -- nullable
  tuf_youtube TEXT,                      -- nullable
  pattern     TEXT NOT NULL,
  template_id TEXT REFERENCES dsa_template(id),
  companies   JSONB,
  campus_oa   TEXT NOT NULL,             -- 'HIGH' | 'MEDIUM' | 'LOW'
  learnings   JSONB NOT NULL             -- insight, trick, edge_cases, complexity, siblings, followups
);

CREATE TABLE dsa_template (
  id    TEXT PRIMARY KEY,                -- 'T-HASH-04'
  name  TEXT NOT NULL,
  topic TEXT NOT NULL,
  when_ TEXT NOT NULL,
  code  TEXT NOT NULL,
  notes JSONB
);

CREATE TABLE dsa_learning (
  id       TEXT PRIMARY KEY,             -- 'L-HASH-01'
  phase    TEXT REFERENCES dsa_phase(key),
  topic    TEXT NOT NULL,
  day      INT  NOT NULL,                -- day it is first taught
  headline TEXT NOT NULL,
  detail   TEXT NOT NULL,
  applied  JSONB NOT NULL                -- [[problem_slug, where_it_was_used], ...]
);
```

### User-state table (the only table the user writes)

Derived directly from `SPEC.json → user_field_schema`. Keep it separate from content so regeneration never touches it.

```sql
CREATE TABLE dsa_progress (
  problem_id    TEXT PRIMARY KEY REFERENCES dsa_problem(id),
  status        TEXT    NOT NULL DEFAULT 'todo',   -- 'todo' | 'solved' | 'revisit'
  revision      BOOLEAN NOT NULL DEFAULT false,    -- the Striver star
  notes         TEXT    NOT NULL DEFAULT '',       -- markdown allowed
  tags          JSONB   NOT NULL DEFAULT '[]',
  confidence    INT,                               -- 1..5, null until rated
  last_revised  DATE,
  goodnotes_ref TEXT    NOT NULL DEFAULT '',       -- opaque free text, NEVER parsed
  my_approach   TEXT    NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Seed tag vocabulary** (user-extensible, from `SPEC.json`):
`stuck` · `off-by-one` · `wrong-complexity` · `misread-constraints` · `slow-implementation` · `ask-in-mock` · `elegant` · `redo-cold` · `template-drilled` · `interview-asked`

---

## 4. The regeneration contract

This matters more than anything else in this document.

1. **Content is an input, not state.** Re-importing a phase JSON must be idempotent: upsert by `id`, never delete `dsa_progress` rows.
2. **`dsa_problem.id` is stable.** It is `{topic}-{slug}` and does not change when a problem moves day or tier.
3. **Writing an importer is the first task.** `import_phase(json) → upsert` plus a report of added / changed / unchanged. Every later content change flows through it.
4. **The user never edits content tables through the UI.** Notes, tags, confidence and status are the only writable surface.

---

## 5. API surface

```
GET  /api/dsa/phases                          -> phase list with progress rollups
GET  /api/dsa/day/:n                          -> the day's problems + its checkpoint
GET  /api/dsa/problem/:id                     -> problem + learnings + template + progress
GET  /api/dsa/theory/:id                      -> one theory section (3 parts)
GET  /api/dsa/template/:id                    -> one C++ template
GET  /api/dsa/revision-queue?limit=20         -> computed, see below
PATCH /api/dsa/progress/:problem_id           -> partial update of user fields
GET  /api/dsa/search?q=&topic=&tier=&company= -> filtered problem list
```

**Revision queue** — from `SPEC.json → revision_queue_rule`:

```sql
SELECT p.* FROM dsa_problem p
JOIN dsa_progress g ON g.problem_id = p.id
WHERE g.status <> 'todo' AND (g.revision = true OR g.confidence <= 3)
ORDER BY g.confidence ASC NULLS LAST, g.last_revised ASC NULLS FIRST
LIMIT :limit;
```

No revision days are scheduled — by design, the queue is pulled on demand.

---

## 6. UI requirements

**Day view** (the main screen)
- Problems grouped by day, sorted CORE → DRILL → SKIM
- Tier badge per row, colour-coded; difficulty badge; company chips; campus-OA marker
- Row actions: status cycle, revision star, confidence 1–5, tag picker, notes
- Collapsible **"What this teaches you"** panel per problem: insight, trick, edge cases, complexity, sibling links, interview follow-ups
- The day's **learning checkpoint** renders at the bottom, built from `dsa_learning` (see §7)

**Theory view**
- Three collapsible parts: breadth open by default, depth and analogy collapsed
- Code blocks with C++ syntax highlighting and copy-to-clipboard

**Template library**
- Indexed by topic; every problem's `template_id` deep-links into it

**Filters**
- topic · tier · difficulty · company · campus_oa · status · confidence · has-notes · tag

**Stuck ladder** — from `SPEC.json → stuck_ladder`. A timer-backed panel on the problem view surfacing the right rung by elapsed minutes, plus the AI protocol list.

---

## 7. Rendering a checkpoint

Checkpoints are **computed**, not stored. For day `D` with dominant topic `T`:

| Section | Source | Rendering |
|---|---|---|
| New today | `learning.day == D` | headline + full detail + every citation |
| From yesterday | `topic == T and day == D-1` | headline + first citation + first sentence of detail |
| Two days back | `topic == T and day == D-2` | headline + problem title only |
| Earlier in *T* | `topic == T and day <= D-3` | headlines, comma-joined |
| Carried forward | any closed topic | one line per topic: all its headlines, joined |

Nothing is ever dropped — older material only gets denser.

---

## 8. What I still need from you

I cannot write repo-specific code without these:

1. **Stack.** Next.js + which backend? Prisma, Drizzle, raw SQL? Postgres or SQLite?
2. **Where the inbox-agent tracker's data actually lives** — the MCP exposes it, but is the store Postgres, SQLite, or a JSON file?
3. **Auth model.** Single-user, or is there a users table the DSA tables must key on?
4. **Existing UI conventions** — component library, styling approach, how the current tracker tab is built, so the DSA tab matches rather than clashes.
Give me those and I can write the migrations, the importer and the API layer against your actual codebase rather than describing them.

---

## 9. Suggested build order

1. Migrations for the six tables above
2. `import_phase()` — idempotent upsert, with an added/changed/unchanged report
3. Import Phase 0 and Phase 1 (181 problems), verify counts against `problem_count`
4. Day view, read-only
5. `dsa_progress` writes — status, star, confidence, notes, tags
6. Learnings panel and the computed checkpoint
7. Theory view and template library
8. Revision queue and filters
9. Mastery and streak integration
10. Import remaining phases as they arrive — no schema change needed
