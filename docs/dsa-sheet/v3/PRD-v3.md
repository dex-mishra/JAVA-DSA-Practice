# DSA tab — PRD v3: the 30-day beginner plan

**Audience:** Claude Code, working in this repository (`Launch Console`).
**Scope:** the DSA section of the tracker only (`dsa-*` tabs, their importer, build output, Worker routes and D1 tables). Placement and MBA sections must not change, apart from the shared mastery rating maths in §13.
**Status of content:** everything in `docs/dsa-sheet/v3/` is authored and verified. The 30-day list and the full theory library are final; per-problem teaching content exists for Days 1–5 and arrives in batches of five days (§16).

Read this whole file before changing code. Then read `START-HERE.md` in this folder for the file map.

---

## 0. Decisions already made (do not reopen)

| # | Decision |
|---|---|
| D1 | The plan is **30 days, 120 LeetCode problems**, 4 per day, foundations first. It replaces the 145-problem v2 sheet entirely. |
| D2 | Start date **2026-10-18** (Day 1). Day N is a calendar date (IST). Days never move; the plan is never redrawn. |
| D3 | Problem ids are the **LeetCode slug** (`two-sum`). v2 ids (`hashing-two-sum`) are migrated once (§14). |
| D4 | Tiers CORE/DRILL/SKIM are replaced by **roles** LEARN / APPLY / TWIST / DISGUISE. SKIM survives only as "skims" (recognition-only extras per day) and as cut-order step 3. |
| D5 | Each problem's dropdown is a **9-stage thinking pipeline** with ✍️ write / 📸 screenshot tags. |
| D6 | Theory is a library of **161 atomic pages**, each with section ids; problems deep-link to exact sections. |
| D7 | Siblings: exactly **one must-study** sibling per problem (shown the next day) + optional siblings. |
| D8 | Recognition drill: **5 unseen statements per day** from a separate pool (not the siblings). |
| D9 | Mocks are **add-ons**, never a whole day; **pre-scheduled dates** (fixed, public), **random unlock time** 09:00–17:00 IST revealed at 08:45, **3-hour start window**. |
| D10 | Daily email nudges, a 21:00 miss check and a Sunday report, sent by the Worker. |
| D11 | Groq-backed doubt chat and pseudocode review inside the problem panel — **v3 phase**, not v1. |
| D12 | Features ship in phases v1 → v2 → v3 (§17). Do not build v2/v3 items while v1 is unfinished. |

---

## 1. Why this exists

The user is a complete beginner at DSA (treat any rating shown elsewhere as irrelevant), with **placements on 2026-12-01**. The failure history that this design is built around:

1. **Over-planning as procrastination.** A 600-problem plan, then 145, then repeated re-ordering — and still stuck on Day 1. → The list is frozen (§16), design changes are budgeted, and the UI must never invite re-planning.
2. **Overestimated capacity.** → 4 problems/day, a mandatory *floor* on bad days, a fixed *cut order* when behind, one data-driven recalibration on Day 7 (§9).
3. **Hard topics first.** v2 put trees/graphs/DP before arrays. → v3 runs foundations → linear structures → recursion → trees → graphs → DP.
4. **Jumping from paper to code.** The user solves on paper (GoodNotes) but cannot turn thoughts into pseudocode. → The pipeline separates *analyse → brainstorm (brute → optimal with named bottlenecks) → algorithm in words → pseudocode → code*.
5. **Note-taking fatigue.** Hand-copying every insight was slow. → Every line is tagged ✍️ (write by hand) or 📸 (screenshot), with a "✍️ only" view.
6. **Starting is the hard part.** → The app opens on today's first item, already expanded; emails name the next single action.

Success is measured by the mocks, not by ticks: by Day 30 the user should score ≥ 60% on a 90–120-minute mock and recognise the pattern of most unseen mediums within five minutes.

---

## 2. Non-goals

- No change to Placement or MBA tabs, the MBA "window integrity" instrument, or the countdown spine.
- No multi-user support, accounts or sharing.
- No new code-execution backend (Judge0 via `worker/runner.js` stays).
- No authoring of Days 6–30 content by Claude Code. Content arrives as data (§16). Claude Code builds the machinery and, when a batch lands, imports it.
- No editing of anything under `docs/dsa-sheet/v3/` except via the documented pipeline.

---

## 3. What exists today (read these files)

| Area | File(s) | Keep / change |
|---|---|---|
| Content sources | `docs/dsa-sheet/SPEC.json`, `v0-…v5-*.json`, `cpp-pattern-templates.json`, `PATTERN-INDEX.json`, `oa/mock-oa-01-problems.json` | **Retire.** Move to `docs/dsa-sheet/_superseded-v2/` (keep, never read). |
| Importer | `tools/import-dsa.mjs` | **Rewrite** to read `docs/dsa-sheet/v3/` (§6). Keep its philosophy: validate, normalise, report added/changed/removed, refuse on error, `--check` mode, never touch progress. |
| Build | `tools/build.mjs` | **Change** the DSA explosion step (§6.3). Keep: single-file `index.html`, `public/` derived and gitignored, guard rails. |
| Page | `src/app.js` (DSA section from line ~1863), `src/styles.css`, `src/shell.html` | **Rework** the `dsa-*` renderers (§8). Reuse helpers: `md`, `mdInline`, `highlightCpp`, `esc`, `dsaGet`, `dsaHelp`, the stuck-ladder timer, `dsaUserPanel` fields. |
| Worker | `worker/index.js` (routes), `worker/store.js` (progress columns), `worker/oa.js`, `worker/oa-gen.js`, `worker/runner.js` | **Extend** (§10–12). |
| DB | `schema.sql` (D1: `doc`, `dsa_progress`, `oa_attempt`) | **Migrate additively** (§7). Never drop `dsa_progress` rows. |
| Tests | `worker/*.test.mjs`, `npm run check` | **Extend** (§18). |

Sub-tabs today: `dsa-sheet`, `dsa-patterns`, `dsa-browse`, `dsa-revision`, `dsa-theory`, `dsa-templates`, `dsa-oa`. After v3: `dsa-today` (renamed sheet), `dsa-plan`, `dsa-theory`, `dsa-revision`, `dsa-browse`, `dsa-oa`. **Retire** `dsa-templates` (templates now live inside theory pattern pages) and **fold** `dsa-patterns` into `dsa-theory` (§8.5).

---

## 4. Target experience in one page

**Opening the DSA tab on a plan day** shows `Today` with blocks in this order (from `PLAN.json → daily_blocks`):

1. **Due re-solves** (≤ 2, oldest first) — cold re-solves of earlier problems at +2/+7/+14 days.
2. **Yesterday's must-study siblings** — one per problem solved yesterday.
3. **Micro-theory + pattern card** for today.
4. **Carried over** (≤ 4 unfinished LEARN/APPLY items from past days), then **today's 4 problems**.
5. **Recognition drill** (5 statements).
6. **CS core card**.

A header strip shows: `Day N of 30 · <date> · <cluster>`, **next mock countdown** (`Mock 02 · Wed 28 Oct · 4 days`), **behind by N** (if any), **floor status** (`floor: done ✓` / `floor: re-solves + Two Sum`), and the streak of kept days.

The first unfinished item is expanded automatically. No item requires choosing what to do next.

**A problem row expanded** shows the pipeline stages one by one with reveal controls (§8.3), theory links on each stage, the stuck ladder with per-rung theory links, the user's own fields, and (v3) the AI panel.

**Mocks** appear in the header countdown; on the mock day an 08:45 email reveals the unlock time; the OA tab shows the mock as locked → unlocked → in-progress → submitted/missed.

---

## 5. Content files (the contract)

Everything below lives in `docs/dsa-sheet/v3/`. Treat it as read-only input.

### 5.1 `PLAN.json`
```jsonc
{
  "version": 3, "start_date": "2026-10-18", "end_date": "2026-11-16", "placement_day": "2026-12-01",
  "post_plan": { "start": "2026-11-17", "end": "2026-11-30", "focus": [...] },
  "problem_count": 120, "skim_count": 8,
  "clusters": [{ "key": "arrays-hashing", "title": "Arrays & hashing", "days": [1,2,3,4,5] }, ...],
  "roles": { "LEARN": { "meaning": "...", "weight": 10 }, "APPLY": {...}, "TWIST": {...}, "DISGUISE": {...} },
  "daily_blocks": [{ "key": "resolves", "title": "...", "minutes": 20, "note": "..." }, ...],
  "floor": ["resolves", "the day's first LEARN problem"],
  "never_miss_twice": "...", "cut_order": [{ "step": 1, "action": "..." }, ...],
  "carry_over": "...", "calibration": { "day": 7, "rule": "..." }, "change_budget": "...",
  "days": [{
    "day": 1, "date": "2026-10-18", "weekday": "Sun", "cluster": "arrays-hashing",
    "title": "Array traversal and in-place writes", "content": "ready" | "pending",
    "problems": [{
      "id": "running-sum-of-1d-array", "ord": 1, "role": "LEARN", "title": "...",
      "lc": { "id": "1480", "slug": "...", "url": "https://leetcode.com/problems/.../", "difficulty": "Easy" },
      "topic": "arrays", "pattern": "running-state", "theory": ["arr-single-pass-running-state", ...],
      "companies": [...], "campus_oa": "HIGH", "tuf": { "article", "practice", "youtube" } | null,
      "legacy_id": "hashing-two-sum" | null, "content": "ready" | "pending"
    }],
    "skims": [{ "id": "n-queens", "lc": {...}, "title": "N-Queens", "theory": ["bt-pruning"] }]
  }]
}
```
- `theory` lists the **primary** pages for the problem (shown on the row even when content is pending).
- `content: "pending"` means the day file does not exist yet; render the row with title, role, LC link, pattern and its primary theory links, plus "Full notes arrive by <date − 5 days>".

### 5.2 `MOCK-SCHEDULE.json`
Generated once with a fixed seed and **frozen** — never regenerate in code.
```jsonc
{ "rules": { "first_mock_day": [6,7], "gap_days": [3,6], "unlock_time_window_ist": ["09:00","17:00"],
             "unlock_time_granularity_min": 15, "start_window_hours": 3, "covers": "...", "missed": "...",
             "plan_day_load_on_mock_day": "3 problems: ..." },
  "mocks": [{ "id": "mock-01", "day": 6, "date": "2026-10-23", "weekday": "Fri",
              "covers_days": [1,2,3,4,5], "kind": "regular" | "grand", "duration_min": 90, "content": "ready" | "pending" }] }
```
Current schedule: mock-01 Fri 23 Oct (Day 6) · mock-02 Wed 28 Oct (Day 11) · mock-03 Sat 31 Oct (Day 14) · mock-04 Fri 6 Nov (Day 20) · mock-05 Mon 9 Nov (Day 23) · mock-06 Fri 13 Nov (Day 27) · grand Mon 16 Nov (Day 30, 120 min).

### 5.3 `days/day-NN.json`
```jsonc
{
  "day": 2,
  "micro": { "title": "...", "theory": ["hash-table-internals", ...],
             "sections": [{ "id": "micro", "title": "...", "note": "mixed", "body": "<markdown>" },
                          { "id": "card",  "title": "Pattern card", "note": "write", "body": "..." }] },
  "problems": [{
    "id": "two-sum",
    "theory_refs": [{ "stage": "pseudocode", "at": "CHECK before UPDATE", "page": "hash-complement-lookup",
                      "section": "self-pairing", "why": "Why inserting first pairs an element with itself." }],
    "stuck_refs": { "10": { "page": "...", "section": "..." }, "20": {...}, "30": {...}, "40": {...} },
    "stages": [{ "id": "understand", "title": "Understand", "note": "mixed", "body": "<markdown>" }, ... ],
    "siblings": [{ "id": "contains-duplicate", "title": "...", "tier": "must" | "optional",
                   "lc": {...}, "maps": "one line: how it maps to the parent",
                   "stages": [ analyse, brainstorm, algorithm, pseudocode, solution, quick_theory ],
                   "verify": { "solution": "<C++>", "tests": "<C++ statements>" } }],
    "verify": { "solution": "<C++>", "tests": "<C++ statements>" }
  }],
  "drill": [{ "id": "isomorphic-strings", "title": "...", "lc": {...}, "statement": "<original paraphrase>",
              "pattern_page": "hash-derived-keys", "pattern_name": "...", "approach": "...", "trigger": "...", "complexity": "..." }],
  "cs_core": { "id": "oop-02-encapsulation", "subject": "OOP", "title": "...", "sections": [ concept, code, interview ] }
}
```
**Problem stage ids, in order (fixed):** `understand, analyse, brainstorm, algorithm, pseudocode, solution, dry_run, edges, carry, followups`.
Sibling stage ids: `analyse, brainstorm, algorithm, pseudocode, solution, quick_theory`.

### 5.4 Markdown conventions inside every `body`
- Standard markdown as the current renderer supports (fenced C++, tables, lists, emphasis, code spans).
- **Note tags.** A section's `note` is `write`, `screenshot` or `mixed`. In a `mixed` section, a line that begins with `✍️ ` is a write-line; every other line is screenshot material. In a `write` section every line is a write-line (the ✍️ prefix may also appear and must render the same).
- **Inline theory links.** `[[page-id]]` or `[[page-id#section-id]]` must render as a link that opens that theory page scrolled to that section (§8.5). The importer guarantees every link resolves.

### 5.5 `theory/<page-id>.json` and `theory/INDEX.json`
```jsonc
// theory/hash-complement-lookup.json
{ "id": "hash-complement-lookup", "title": "...", "topic": "hashing",
  "kind": "pattern" | "concept" | "mechanics" | "cpp" | "meta" | "skim",
  "summary": "one line", "prereqs": ["cpp-unordered-map-set", ...], "related": [...],
  "sections": [{ "id": "idea", "title": "Idea", "note": "write", "body": "<markdown>" }, ...],
  "used_by": [...]   // advisory only; the importer recomputes it (§6.2)
}
// theory/INDEX.json
{ "version": 3, "count": 161, "topics": { "hashing": ["hash-table-internals", ...] },
  "pages": [{ "id", "title", "topic", "kind", "summary", "sections": [{ "id", "title", "note" }], "prereqs", "related" }] }
```
Pattern pages use the section ids `idea, recognise, think, template, variations, pitfalls, complexity, interview` (not all are present on every page). 27 topics; meta pages (`meta-*`) are the "how to think" library and the master **pattern decision tree** (`meta-pattern-decision-tree`).

### 5.6 `oa/mock-NN-problems.json`
Same schema as the existing `mock-oa-01-problems.json` (statement, samples, hidden tests with optional `gen.builder_js`, review payload). `mock-01-problems.json` is ready: q1 and q2 are carried over unchanged from v2 (their ported generators in `worker/oa-gen.js` under keys `mock-01-q1#6` and `mock-01-q2#7` stay valid because ids and test order are unchanged); q3 is new (sliding window, all tests inline). `source_day` values refer to **v3 days** and `related` to **v3 ids**.

---

## 6. Importer and build

### 6.1 `tools/import-dsa.mjs` (rewrite)
Inputs: `docs/dsa-sheet/v3/PLAN.json`, `MOCK-SCHEDULE.json`, `theory/*.json`, `days/day-*.json`, `oa/*-problems.json`.
Outputs (to `data/dsa/`, as today): `plan.json`, `schedule.json`, `index.json` (thin rows), `theory-index.json`, `theory/<id>.json`, `day/<n>.json`, `problem/<id>.json`; plus `worker/oa-content.json` (unchanged mechanism, Worker-only).

**Validation — refuse to import on any of these:**
1. Duplicate ids across problems, skims, siblings and drill items (all ids share one namespace).
2. A `days/day-NN.json` whose problem ids or order differ from `PLAN.json` day N.
3. A problem without exactly the 10 stage ids in order; a sibling without its 6; a stage with an empty body; a `note` outside `write|screenshot|mixed`.
4. Not exactly one `must` sibling per problem.
5. Any `theory_refs`, `stuck_refs`, `micro.theory`, `PLAN` problem `theory`, drill `pattern_page`, or inline `[[…]]` link that points to a missing page or section.
6. A drill day without exactly 5 items; a ready day without `cs_core`.
7. OA: everything the current importer checks, with `source_day ∈ covers_days`, `covers_days` equal to `MOCK-SCHEDULE.json`'s list for that mock, `tests_pattern ∈` the set of PLAN `pattern` values, and `related ∈` PLAN problem ids.
8. A `MOCK-SCHEDULE.json` mock date that does not equal `start_date + day − 1`.

**Warnings (import continues):** pending days; theory pages not referenced by anything; a pending mock whose date is within 3 days.

**Report:** per day added/changed/unchanged/removed (as today per phase), page count, sibling count, drill count, mocks ready/pending, total bytes per output.

### 6.2 Derived data the importer computes
- **Reverse index** for every theory section: the problems, siblings, micro-theory blocks and drill items that link to it (from `theory_refs`, `stuck_refs`, `micro.theory`, PLAN `theory`, `pattern_page` and inline `[[…]]` links). Overwrite the advisory `used_by` with `{ kind, id, day, stage, at }` rows.
- **Legacy map** `{ "<v2 id>": "<v3 id>" }` from PLAN `legacy_id`, written into `index.json` for the one-time migration (§14).
- **Pattern list** for the revision surface: distinct PLAN `pattern` values → `{ pattern, topic, problems[], primary_page }`.
- Strip `verify` from everything that goes to `public/` (it is only for CI, §18).

### 6.3 `tools/build.mjs`
- Bake `plan` (without day bodies) and the thin `index` into `index.html`.
- Explode to `public/data/dsa/`: `day/<n>.json` (micro, drill, cs_core, skims), `problem/<id>.json` (stages, refs, siblings, plus row meta), `theory/<id>.json`, `theory-index.json`, `schedule.json`.
- Keep the guard rail: refuse to build if `data/dsa/` exists but has zero problems. Add: refuse if Day 1 content is missing.

---

## 7. D1 schema changes (additive migration)

Write `migrations/0003_dsa_v3.sql` (and fold into `schema.sql`). Never drop existing columns or rows.

```sql
-- dsa_progress: new columns
ALTER TABLE dsa_progress ADD COLUMN my_pseudocode   TEXT NOT NULL DEFAULT '';
ALTER TABLE dsa_progress ADD COLUMN first_done_at   TEXT;           -- YYYY-MM-DD (IST) first time status left 'todo'
ALTER TABLE dsa_progress ADD COLUMN minutes_spent   INTEGER;        -- from the stuck-ladder timer when marked done
ALTER TABLE dsa_progress ADD COLUMN resolve_stage   INTEGER NOT NULL DEFAULT 0;  -- 0..3 re-solves completed
ALTER TABLE dsa_progress ADD COLUMN next_resolve_on TEXT;           -- YYYY-MM-DD, null when all 3 done
ALTER TABLE dsa_progress ADD COLUMN cut_state       TEXT NOT NULL DEFAULT '';    -- '' | 'skim' | 'queued'
-- status gains a value: 'skimmed' (TWIST closed via cut-order step 3). Accept todo|solved|revisit|skimmed.

CREATE TABLE IF NOT EXISTS dsa_sibling (            -- must + optional siblings
  sibling_id TEXT PRIMARY KEY, parent_id TEXT NOT NULL,
  studied INTEGER NOT NULL DEFAULT 0, solved INTEGER NOT NULL DEFAULT 0,
  studied_on TEXT, notes TEXT NOT NULL DEFAULT '', updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_drill (              -- recognition drill attempts
  item_id TEXT PRIMARY KEY, day INTEGER NOT NULL,
  guess TEXT NOT NULL DEFAULT '', correct INTEGER,  -- null until self-marked
  answered_on TEXT, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS dsa_day (                -- per-calendar-day ledger
  day INTEGER PRIMARY KEY, kept INTEGER NOT NULL DEFAULT 0,   -- floor met
  micro_read INTEGER NOT NULL DEFAULT 0, cs_core_done INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '', updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS oa_schedule (            -- runtime state for MOCK-SCHEDULE.json
  mock_id TEXT PRIMARY KEY, unlock_at REAL,         -- epoch ms, drawn at 08:45 IST on the mock day
  state TEXT NOT NULL DEFAULT 'scheduled',          -- scheduled|revealed|unlocked|started|submitted|missed
  attempt_id INTEGER, updated_at REAL NOT NULL);

CREATE TABLE IF NOT EXISTS notify_log (             -- de-duplicates cron sends
  key TEXT PRIMARY KEY,                             -- e.g. 'nudge:2026-10-18:11', 'mock:mock-01', 'weekly:2026-10-25'
  sent_at REAL NOT NULL, detail TEXT NOT NULL DEFAULT '');

-- v3 phase only:
CREATE TABLE IF NOT EXISTS dsa_ai_message (
  id INTEGER PRIMARY KEY AUTOINCREMENT, problem_id TEXT NOT NULL, mode TEXT NOT NULL,
  role TEXT NOT NULL, content TEXT NOT NULL, tokens INTEGER, created_at REAL NOT NULL);
CREATE INDEX IF NOT EXISTS dsa_ai_by_problem ON dsa_ai_message (problem_id, created_at);
CREATE TABLE IF NOT EXISTS ai_usage (minute_key TEXT PRIMARY KEY, requests INTEGER NOT NULL, tokens INTEGER NOT NULL);
```
Add an `oa_attempt.kind TEXT NOT NULL DEFAULT 'scored'` column (`scored` | `practice`).
Extend `worker/store.js` `COLUMNS` with the new `dsa_progress` fields.

---

## 8. Page behaviour (`src/app.js`, `src/styles.css`)

### 8.1 Time and "today"
- All dates are IST (`Asia/Kolkata`). `planDay(date) = days between start_date and date + 1`, clamped to 1..30; before the start show a "Starts Sun 18 Oct" card with Day 1 preview; after Day 30 show the post-plan view (§8.8).
- `dsaCurrentDay()` changes meaning: it returns **today's plan day**, not "first unfinished day". Prev/next navigation still browses any day.

### 8.2 Today view (`dsa-today`)
Blocks per §4, driven by `PLAN.json → daily_blocks`. Rules:
- **Re-solves:** problems with `next_resolve_on ≤ today`, oldest due first, at most 2 shown. Marking a re-solve done (a "re-solved cold" button with confidence 1–5) increments `resolve_stage` and sets `next_resolve_on` to `first_done_at + 7` then `+ 14`, then null. A re-solve with confidence ≤ 3 resets the next interval to +2 days.
- **Must-study siblings:** for each plan problem whose `first_done_at` is yesterday, its `must` sibling. Opening it shows its 6 stages; buttons "studied" (required) and "solved on LeetCode" (optional). Optional siblings are listed collapsed under each parent problem (after the parent is done) and are never scheduled.
- **Carried over:** past-day LEARN/APPLY problems still `todo`, at most 4 shown (oldest first) with "+N more" linking to the plan view.
- **Today's problems:** the 4 rows. On a mock day the DISGUISE problem (or the last `ord`) is auto-moved: it shows as "moved to revision queue (mock day)" and gets `cut_state = 'queued'`, `next_resolve_on = today + 2`.
- **Drill:** 5 cards. Each shows the paraphrased statement, a text box "pattern + one-line approach", a **reveal** button, then self-mark ✓/✗. Reveal shows `pattern_name`, `approach`, `trigger`, `complexity`, link to `pattern_page`, and a LeetCode link. ✗ items appear in the revision tab under "Recognition misses".
- **CS core card:** rendered sections, a "done" checkbox (`dsa_day.cs_core_done`).
- **Floor:** a day is **kept** when all due re-solves shown that day are done and the first LEARN problem of the day is done (`solved|revisit`). Store in `dsa_day.kept`. Streak = consecutive kept days ending today/yesterday.
- **Never miss twice:** if yesterday was not kept, show a top banner ("Yesterday was missed — floor first today") and render the floor items first.
- **Behind by N:** count of past-day plan problems with status `todo` and `cut_state = ''`.

### 8.3 Problem panel (the pipeline)
Opening a row (still one open at a time, as today):
1. **Header:** title → LeetCode, role badge with its meaning on hover (from `PLAN.roles`), difficulty, OA badge, primary theory links, TUF links when present.
2. **Spoiler model.**
   - For `LEARN`: all stages visible immediately (the role means "read first, then code from an empty file").
   - For `APPLY | TWIST | DISGUISE`: `understand` is visible; every other stage starts **covered**. Each covered stage has its own "reveal" button. A "reveal all" exists but sits at the bottom. Covered state resets each time the row is opened (as the learnings panel did).
   - A **cover mode** toggle ("hide stages 3–5 again") lets the user re-attempt the brainstorm/algorithm/pseudocode on paper during revision.
3. **Stage rendering:** title, ✍️/📸 badge from `note`, markdown body. Under each stage, the `theory_refs` whose `stage` matches, as chips: `<at> → <page title> § <section title>` with `why` as the tooltip. Clicking opens the theory page at that section (§8.5) in a side drawer on wide screens, full view on narrow screens, without losing the open row.
4. **✍️ only toggle** (per browser, remembered): hides `screenshot` stages and every non-✍️ line of `mixed` stages; strips the ✍️ prefix from shown lines. This is the "copy to GoodNotes" view.
5. **Siblings** (shown after the parent is done): must-study first, then optional, each expandable to its 6 stages and `maps` line.
6. **Stuck ladder:** unchanged timer; rungs and the AI protocol now come from `PLAN.json → stuck_ladder / ai_protocol` (same texts as v2). Each rung shows its `stuck_refs[from_min]` link when present ("read this section").
7. **Your record:** existing fields (status, star, confidence, approach, GoodNotes ref, notes, tags) + **My pseudocode** textarea (`my_pseudocode`). When status first leaves `todo`, write `first_done_at` (IST date) and `minutes_spent` from the running timer (null if not started), and schedule `next_resolve_on = first_done_at + 2`.
8. **Status values:** `todo → solved → revisit` cycle as today; `skimmed` is offered only when `cut_state = 'skim'` (§9).
9. **Pending content:** if the day is `pending`, show header + primary theory links + "Full notes arrive by …".

### 8.4 Plan view (`dsa-plan`)
Replaces the phase strip and day rail: a 30-day grid grouped by cluster, each day showing its 4 problems as dots (done / revisit / todo / skimmed / queued), skims as hollow dots, mock days marked with the mock id, and the post-plan window. Clicking a day opens it in the Today view's layout (read-only for future days except notes). Shows plan totals, pace (median minutes per problem over the last 7 days), and calibration status after Day 7 (§9).

### 8.5 Theory (`dsa-theory`)
- **Index:** topics in plan order (meta first), pages as cards with kind badge and summary; search box over titles and summaries; "pages used today" pinned on top.
- **Page view:** title, kind, summary, prereqs/related chips, then sections with ✍️/📸 badges, the same ✍️-only toggle, and per section a collapsible **Used by** list (from §6.2) linking back to problems/siblings/drill.
- **Deep links:** route `#dsa/theory/<page>/<section>`; opening scrolls to the section and highlights it for 2 s. Inline `[[…]]` links inside any markdown body use the same route.
- **Pattern list:** a sub-view "Patterns" lists PLAN patterns with their problems and primary page (replaces `dsa-patterns`).
- Retire the old `t-*` theory files and the 3-part (breadth/depth/analogy) renderer.

### 8.6 Revision (`dsa-revision`)
Sections: Due re-solves (all, not just 2), Queued by cut order, Low confidence (≤ 3) / starred (existing rule), Recognition misses, Studied siblings (for re-reading). Keep the existing ordering rule for the low-confidence list.

### 8.7 Browse (`dsa-browse`)
Keep the filter bar; replace tier filter with role; add filters `cluster`, `content ready/pending`, `has pseudocode`, `cut_state`.

### 8.8 Post-plan (from 2026-11-17)
Today view switches to: daily mock prompt, revision queue, and a "stretch" list = optional siblings of Hard difficulty + skims. Keep it simple; no new content is required.

### 8.9 Learning checkpoint
Rebuild from the `carry` stage of every done problem (instead of v2 `learnings.json`), keeping the existing decay rule (today full → yesterday first sentence → older: title only → finished cluster: one line per pattern). Show it at the bottom of the Today view.

### 8.10 Copy and help text
Rewrite the "How this sheet works" panel for v3: the role meanings, the daily blocks, floor, cut order, the ✍️/📸 convention, and the mock rules. Remove every mention of CORE/DRILL/SKIM tiers, 145 problems, "forty days", and phases V0–V5.

---

## 9. Behind-schedule mechanics (no re-planning, ever)

Run when the page loads and in the nightly cron (§11), over every **past** day:
1. **Optional siblings** are never scheduled (nothing to do).
2. Unfinished **DISGUISE** → `cut_state = 'queued'`, `next_resolve_on = day_date + 7` → appears in Revision "Queued".
3. Unfinished **TWIST** → `cut_state = 'skim'`; its row offers status `skimmed` (reveal the pipeline, write pseudocode, no code). `skimmed` counts for the rating at weight 3 (not 10).
4. Unfinished **LEARN/APPLY** → stay `todo` and appear in "Carried over".
5. **Calibration (once, on Day 8 morning):** compute the median number of plan problems completed per day over Days 1–7 (by `first_done_at`). If < 4, set a flag `calibrated_light = true` in `doc` storage; from then on DISGUISE problems of Days 8–30 show as "queued for revision" **on their own day** (step 2 applied in advance) — Today shows 3 problems. Show a one-time explanation card. This is the only recalibration; there is no UI to change the plan.

Days, problem order and mock dates never change.

---

## 10. Mocks

- **Source of truth:** `MOCK-SCHEDULE.json` (+ `oa_schedule` runtime rows created by the importer/first run).
- **Countdown:** header shows the next mock (id, weekday, date, days left). Clicking opens the OA tab.
- **Coverage rule change:** a mock covers `covers_days` regardless of completion. Replace `oaUnmetDays` gating with a **warning** ("You have N unfinished problems from the covered days") shown 2 days before and on the mock card; never block.
- **Reveal:** at 08:45 IST on the mock date, the cron draws `unlock_at` uniformly from 09:00–17:00 IST in 15-minute steps (`crypto.getRandomValues`), stores it, sets `state = 'revealed'`, sends the mock email (§11). Before 08:45 the app shows only the date.
- **Unlock and window:** at `unlock_at` the mock becomes startable (`unlocked`). It must be **started within 3 hours** (`start_window_hours`). Starting creates the attempt (`kind = 'scored'`) and the existing 90-minute (grand: 120) timer runs. After the window without a start → `missed`; the mock remains available as `practice` (unscored, recorded separately in history).
- **Mock-day load:** see §8.2.
- **Content readiness:** if a mock's content is `pending` within 3 days of its date, show an admin warning in the OA tab (the content batch is late).
- **Review screen:** keep the existing review payload; add an "Explain your approach (2 minutes)" textarea stored in `oa_attempt.notes` (v1), graded by Groq in v3.
- Existing generator ports (`worker/oa-gen.js`) for `mock-01-q1#6` and `mock-01-q2#7` remain valid.

---

## 11. Notifications (Worker cron + email)

**Provider:** Resend (free tier; verify the current free limits when setting up — at the time of writing it allows sending from `onboarding@resend.dev` to the account's own address without a domain). Secrets: `RESEND_API_KEY`, `NOTIFY_TO`; optional var `REPORT_CC`. If the secret is missing, cron runs but only logs (no failure).

**Cron:** add to `wrangler.toml`:
```toml
[triggers]
crons = ["*/15 * * * *"]   # every 15 min; the handler decides what is due in IST
```
Implement `scheduled(event, env, ctx)` in `worker/index.js` delegating to a new `worker/notify.js`. Every send is guarded by a unique `notify_log.key`, so retries never double-send.

| Kind | When (IST) | Condition | Content |
|---|---|---|---|
| `nudge` | 09:00, 11:00, 13:00, 15:00, 17:00, 19:00 | plan day 1–30 and today not complete | **One next action**: the first unfinished item in block order (re-solve → must-sibling → carried → today's problems), with its LeetCode link, role, the micro-theory link, and a deep link to the row. Subject: `DSA Day N · next: <title>`. |
| `mock` | 08:45 on a mock date | always | "Mock 0X unlocks at HH:MM. Start by HH:MM (3-hour window)." + covered days + unfinished count. Attach an `.ics` event for the 90/120-minute block. |
| `mock-open` | at `unlock_at` | not started | "Mock is open now — window closes at HH:MM." |
| `miss` | 21:00 | today not kept | "Floor not met today: <floor items>. Tomorrow starts with these." |
| `weekly` | Sunday 20:00 | always during the plan | Problems done this week vs plan, behind by N, median minutes per problem, re-solves done, drill accuracy, mock score(s), next week's clusters and mock dates. CC `REPORT_CC` if set. |

"Today complete" = all of today's blocks done (re-solves shown, must-siblings studied, 4 problems not `todo` or cut, drill answered, CS card done). Stop nudging once complete.

Email body: plain HTML, no images, every link absolute to the deployed console (`CONSOLE_URL` var).

---

## 12. Groq integration (v3 phase)

**Route:** `POST /api/dsa/ask` `{ problem_id, mode, message?, code?, pseudocode? }` → `{ reply, tokens, remaining: { rpm, rpd } }`. Secret `GROQ_API_KEY`; var `GROQ_MODEL` (default `openai/gpt-oss-120b`), `GROQ_FALLBACK_MODEL`.

**Modes and rules**
| Mode | Allowed when | System prompt essence |
|---|---|---|
| `hint` | stuck timer ≥ 20 min (client sends `minutes`; server re-checks against a stored timer start if available) | Socratic: ask one question or point at the broken step; never give code or the full approach. |
| `pseudocode_review` | any time | Review only the pseudocode the user wrote: missing cases, wrong order of CHECK/UPDATE, loop bounds. No code. |
| `code_review` | status ≠ `todo` | "Review like a FAANG interviewer": correctness, complexity, naming, edge cases. |
| `explain_grade` | after a mock attempt | Grade the 2-minute explanation for clarity, correctness, complexity statement. |
| `doubt` | any time | Answer a conceptual question; may cite theory page titles; for an unsolved problem, no solution code. |

**Context sent** (keep under ~2,000 input tokens): problem title, role, pattern, the user's `my_approach` and `my_pseudocode`, the last 6 messages of this problem's thread, the requested mode's rules, and for `doubt` the titles of the problem's primary theory pages. **Never send** the hidden stages of a covered problem (`brainstorm`…`followups`) unless mode is `code_review`.

**Free-tier guard:** limits are per organisation and shown in the Groq console; at the time of writing the free tier for `gpt-oss-120b` is about 30 requests/min, 1,000/day, 8,000 tokens/min. Enforce in `ai_usage`: ≤ 25 requests/min, ≤ 900/day, ≤ 7,000 tokens/min (estimate tokens as chars/4 plus `max_tokens`), `max_tokens = 600`. On a 429 or local cap, try the fallback model once, else return `{ error: "rate", retry_after }` and show "try again in N s".

**UI:** an "Ask" panel at the bottom of the problem panel with mode buttons, the thread (from `dsa_ai_message`), and the lock message for `hint` before 20 minutes. A "Review my pseudocode" button next to the pseudocode textarea. Pseudocode gate is **soft**: a problem can be marked solved without a review, but the row shows a small "no pseudocode" marker.

---

## 13. Mastery rating

- Replace `DSA_WEIGHT = { CORE: 10, DRILL: 2, SKIM: 1 }` with role weights from `PLAN.roles` (all 10), `skimmed` = 3, must-sibling studied = 2. Denominator = 120 problems × 10 + 120 must-siblings × 2 (the full pool, not what is imported — same reasoning as v2).
- Re-solves, drill and CS core do not move the rating (they are habits, not mastery), but they appear in the weekly report.
- Update the README section "The DSA sheet" accordingly.

---

## 14. One-time progress migration

- `tools/migrate-dsa-ids.mjs` reads `data/dsa/index.json → legacy_map` and prints/executes SQL that renames `dsa_progress.problem_id` from v2 ids to v3 ids (`UPDATE … WHERE problem_id = ?`), skipping rows whose target already exists.
- Rows for v2 problems not in v3 stay untouched (orphaned rows are harmless, as today).
- Currently non-`todo` v2 rows: `hashing-majority-element`, `hashing-single-number`, `hashing-two-sum` (revisit) and `sorting-sort-an-array` (solved). After migration they live on v3 Days 2, 30, 2 and 9. Set `first_done_at` for them to the migration date so re-solves start.
- Run against local D1 first (`npm run db:init:local` then the script with `--local`), then remote.

---

## 15. Content pipeline (how later batches arrive)

- Authoring sources and tools are in `docs/dsa-sheet/v3/authoring/` (`*.txt` sources, `build.py`, `plan.py`, `verify_cpp.py`, `mock01.py`). Claude Code does not author content but must keep `verify_cpp.py` runnable in CI.
- **Batch rule:** content stays **5 days ahead**. Batch 2 (Days 6–10) must land by **2026-10-20**, batch 3 (11–15) by 10-25, batch 4 (16–20) by 10-30, batch 5 (21–25) by 11-04, batch 6 (26–30) by 11-09. Each batch includes the mock(s) whose dates fall inside the next batch window.
- Landing a batch = adding `days/day-NN.json` files (+ `oa/mock-NN-problems.json`) and flipping `content` flags in `PLAN.json` / `MOCK-SCHEDULE.json`. Then `npm run import && npm run verify:dsa && npm run build`.

---

## 16. The frozen list

The 120 problems and 8 skims are in `PLAN.json`. Clusters: Arrays & hashing (1–5), Search, strings & sorting (6–9), Linked lists & stacks (10–13), Recursion, backtracking, greedy & heaps (14–17), Trees (18–21), Graphs (22–24), DP & tries/bits (25–30). Coverage commitment: every non-premium Blind-75 problem is a plan problem, a skim, or a sibling. Days 1–5 siblings already cover 49, 217, 238, 152, 76 and 42; the remaining ones (153, 572, 100, 226, 133, 417, 377, 73, 143, 647, 57, 212, 190, 191, 268, 371) are assigned as siblings in their batches. **No code path may edit the list.**

---

## 17. Phases and acceptance criteria

### v1 — needed for Day 1 (ship first)
1. Importer + build for v3 (§6), old sources moved to `_superseded-v2/`.
2. D1 migration (§7) and id migration (§14).
3. Today view with all blocks (§8.2) except AI; problem panel with pipeline, spoiler model, theory chips, ✍️-only toggle, stuck-ladder links, pseudocode field (§8.3).
4. Theory library with deep links and Used-by (§8.5).
5. Plan view (§8.4) and header strip (countdown, behind, floor, streak).
6. Mock schedule, reveal, unlock, 3-hour window, practice mode, coverage warning (§10).
7. Notifications: `nudge`, `mock`, `mock-open`, `miss` (§11). (`weekly` may ship in v2.)
8. Rating change (§13) and help-text rewrite (§8.10).

**v1 acceptance:** with the clock set to 2026-10-18 09:00 IST, the Today view opens on Day 1 with Running Sum expanded, LEARN stages visible, micro-theory and pattern card shown, drill and CS card present; every theory chip opens the right section; the ✍️-only toggle works on problem stages and theory pages; marking Running Sum solved sets `first_done_at` and schedules a re-solve for 10-20; a forced cron run at 11:00 sends exactly one nudge naming Max Consecutive Ones; with the clock at 2026-10-23 08:45 the mock email is sent once and the OA tab shows the unlock time; `npm run check` and `npm run verify:dsa` pass.

### v2 — during week 1
Siblings block and statuses (if any part slipped from v1), drill misses in Revision, cut-order automation (§9), Day-8 calibration, weekly report, learning checkpoint rebuild (§8.9), post-plan view.

### v3 — week 2
Groq panel and modes (§12), pseudocode review button, mock explanation grading.

A phase starts only when the previous one is deployed and used.

---

## 18. Testing

- `npm run verify:dsa` → `python3 docs/dsa-sheet/v3/authoring/verify_cpp.py docs/dsa-sheet/v3` (compiles and runs all 80 reference solutions; needs g++). Add to `npm run check` when g++ is available, otherwise warn.
- Importer unit tests: each refusal rule in §6.1 with a minimal broken fixture.
- Worker tests (`node --test`): IST day computation across midnight; re-solve scheduling; floor/kept; cut-order transitions; calibration; mock reveal/unlock/window/missed; notify de-duplication; Groq rate guard (mock fetch).
- A build test asserting no `verify` field and no OA hidden tests appear under `public/`.
- Manual smoke list = the v1 acceptance paragraph.

---

## 19. Risks and open questions

| Risk | Mitigation |
|---|---|
| v1 is not deployed by the morning of Day 1 | Day 1 can be studied directly from `days/day-01.json` rendered by the existing markdown helper in a temporary static page; do not delay the start date. If the start date must move, change `start_date` and regenerate `MOCK-SCHEDULE.json` with `authoring/plan.py` (same seed). |
| Email deliverability / provider limits | De-dup log, at most ~9 mails/day; switch provider via one module. |
| Groq limits or model names change | Read model and caps from vars; fail soft with a clear message. |
| Content batch late | Pending-day rendering + OA readiness warning; the PLAN list itself is complete, so the user can still solve. |
| Spoilers via public JSON | Accepted (single user, honour system). Hidden OA tests stay Worker-only. |
| Clock/timezone bugs | All date maths through one `istDate()` helper, unit-tested. |

Open question for the user (default chosen, can be changed in config): pseudocode gate is **soft** (§12).
