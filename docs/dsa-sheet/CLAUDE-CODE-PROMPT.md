I'm adding a DSA practice sheet as a new tab in this placement tracker, with an OAs sub-tab under it.
The content is already authored and verified — all 145 problems, nothing pending.

## Files in docs/dsa-sheet/ — use these

**Read as specs (do not parse):**

- `PRD-v2.md` — what the sheet is, what changed from an abandoned 600-problem version, and the
  interface work required. Read this first.
- `HANDOFF.md` — database schema, importer contract, API surface, UI requirements.
- `PRD-OA-TAB.md` — the OAs sub-tab: three tables, code-execution backend, scoring bands, how mocks
  are generated and scoped. Read before step 7, not before step 1.

**Parse as data:**

- `SPEC.json` — phase map, the 8 user fields with types and defaults, revision-queue SQL, stuck ladder
- `v0-prerequisites.json` — 14 problems, days 1–3
- `v1-trees.json` — 20 problems, days 4–7
- `v2-graphs.json` — 31 problems, days 8–13
- `v3-dp.json` — 38 problems, days 14–21
- `v4-core-patterns.json` — 40 problems, days 22–29
- `v5-advanced.json` — 2 problems, day 30
- `cpp-pattern-templates.json` — 76 C++ pattern templates
- `PATTERN-INDEX.json` — 145 rows, each joining problem → pattern → topic → template id. Build the
  pattern index page from this; do not re-derive it by scanning the phase files.
- `oa/mock-oa-01-problems.json` — one mock OA (3 problems, 90 min, 100 marks) to seed the OAs tab

## Files in that folder — ignore these completely

- Every `.md` file that has a `.json` twin (`v0-prerequisites.md`, `v1-trees.md`, `v2-graphs.md`,
  `v3-dp.md`, `v4-core-patterns.md`, `v5-advanced.md`, `cpp-pattern-templates.md`,
  `PATTERN-INDEX.md`) — identical content, kept for human reading. The markdown is lossy. Never
  parse it.
- `OPTIONAL-narrow-tricks.json` and `.md` — 31 stretch problems deliberately excluded from the
  sheet. Do not import, do not schedule, do not count.
- `oa/mock-oa-01.html` — a standalone reference implementation of the OA-taking UI. Read it for the
  interaction model if that helps; do not ship it or embed it. The real tab is built in this app's
  own components.
- `_superseded-600-plan/` — the abandoned 600-problem version. Do not read.
- `START-HERE.md` — notes to me, not to you.

## Before writing any code

Answer these from the codebase and report back:

1. What is the ORM / query layer and the database? HANDOFF uses Postgres-flavoured DDL — adapt it to
   whatever is actually here.
2. Where does the existing tracker's topic and mastery data live?
3. Is there a users table the new tables should key on, or is this single-user?
4. How is the existing tracker tab built — which components, which styling approach? The DSA tab must
   match it rather than introduce a second visual language.
5. How does the mastery rating aggregate across tracks today? DSA progress feeds that **same**
   aggregate. Do not add a new track and do not build a separate DSA rating.

## Then build, stopping after each step

**Step 1 — migrations.** The six content tables plus `dsa_progress`, per HANDOFF §3. `dsa_progress`
is the only table the user writes; keep it fully separate from content tables so re-importing never
touches it.

**Step 2 — the importer.** `import_phase(json)` performing an idempotent upsert keyed on
`dsa_problem.id`, which is stable across regenerations. It must report added / changed / unchanged
counts and must never delete `dsa_progress` rows. Build this before anything else that touches data —
every future content update flows through it.

**Step 3 — import and verify.** Load all six phase JSONs and the templates. Assert each phase's row
count equals its `problem_count` field, and that the total is 145.

**Step 4 — day view, read-only.** Problems grouped by day. Each row: LeetCode link, difficulty,
company chips, pattern name, and a collapsible "What this teaches you" panel rendered from the
`learnings` object (insight, trick, edge_cases, complexity, siblings, followups).

No tier badges. Every problem in this version is `CORE`, so the field is dead weight in the UI —
drop it from rows, filters, and the per-day summary line.

**Step 5 — progress writes.** The 8 user fields from `SPEC.json → user_field_schema`: status cycle,
revision star, confidence 1–5, notes, tags using the seeded vocabulary, last_revised, goodnotes_ref,
my_approach.

`goodnotes_ref` is opaque free text — a pointer to a handwritten page. Never parse it.

**Step 6 — pattern index.** PRD §3.4, built from `PATTERN-INDEX.json`. One page listing every
problem's pattern grouped by topic, each row linking to its problem and its C++ template. This is the
revision surface and the highest-value screen in the tab.

**Step 7 — the OAs sub-tab.** Now read `PRD-OA-TAB.md` and follow its build order: the three tables
(`oa_mock`, `oa_problem`, `oa_attempt`), then the execution backend, then the taking interface, then
scoring and review. Seed it with `oa/mock-oa-01-problems.json`.

Two things from that PRD that are easy to get wrong:

- **Do not build your own code sandbox.** Use Judge0 or Piston as the PRD specifies. A hand-rolled
  `exec` on submitted C++ is a remote code execution hole in a tool that lives on my machine.
- A mock is valid only for days already covered. `source_day` on each OA problem is what enforces
  that — honour it when listing which mocks are available.

## Two things to get right in the main tab

- `tuf.article`, `tuf.practice` and `tuf.youtube` are `null` for problems outside Striver's sheet
  (37 of 145). Hide the chip when null — never render a dead link or a placeholder.
- `tuf.legacy_article` is provenance only. **Do not import it and never render it.** Those are the
  pre-October-2026 `/data-structure/<slug>` URLs, which now serve an empty shell. PRD §3.5 has the
  table.
- Checkpoints are **computed** from the top-level `learnings` array at request time, not stored. The
  decay rules are in PRD §3 and HANDOFF §7.

## One hard rule

Never hand-edit the phase JSONs or `PATTERN-INDEX.json`. They are generated upstream and
regeneration overwrites them. If content needs changing, tell me and I'll have it regenerated — your
job is the interface.
