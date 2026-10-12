# Start here

Read this, then `PRD-v2.md`, then `HANDOFF.md`. Everything else is data.

---

## Give the Claude Code session these 6 files

Copy them into the repo under `docs/dsa-sheet/` (or wherever you keep specs) plus a `data/` folder:

**Specs — read, don't parse**
1. `PRD-v2.md` — what the sheet is, what changed, the interface work required
2. `HANDOFF.md` — database schema, importer contract, API surface, UI requirements
3. `SPEC.json` — machine-readable: phase map, user-field schema with types and defaults, revision-queue SQL, stuck ladder

**Data — parse these**
4. `v0-prerequisites.json`
5. `v1-trees.json`
6. `v2-graphs.json`
7. `v4-core-patterns.json`
8. `cpp-pattern-templates.json`

**Optional, import later or not at all**
- `OPTIONAL-narrow-tricks.json` — 31 unscheduled stretch problems

**Do not give it** the `.md` versions of the phase files (they're the same content, for your reading) or `_superseded-600-plan/` (the dead 600-problem plan).

---

## Paste this into the Claude Code session

> I'm adding a DSA practice sheet as a new tab in this placement tracker. The content is already
> authored and verified — 105 problems now, 40 more arriving later with an identical schema.
>
> Read `docs/dsa-sheet/PRD-v2.md` and `docs/dsa-sheet/HANDOFF.md` first. HANDOFF has the table
> definitions and API surface; PRD has what's different from an earlier 600-problem version that we
> abandoned.
>
> Before writing any code, answer these from the codebase and tell me what you found:
> 1. What's the ORM/query layer and the database? (HANDOFF assumes Postgres-ish DDL — adapt it.)
> 2. Where does the existing tracker's topic/mastery data actually live?
> 3. Is there a users table the new tables should key on, or is this single-user?
> 4. How is the existing tracker tab built — which components, which styling approach? The DSA tab
>    should match it, not introduce a second visual language.
> 5. How does the mastery rating currently aggregate across tracks? DSA progress feeds that same
>    aggregate — don't add a new track or a separate rating.
>
> Then do these in order, stopping after each so I can look:
>
> **Step 1 — migrations.** The six content tables plus `dsa_progress` from HANDOFF §3. `dsa_progress`
> is the only table the user writes; keep it separate from content so re-importing never touches it.
>
> **Step 2 — the importer.** `import_phase(json)` doing an idempotent upsert keyed on
> `dsa_problem.id`, which is stable across regenerations. It must report added / changed / unchanged
> and must never delete progress rows. Write this before anything else that touches data — every
> future content update flows through it.
>
> **Step 3 — import and verify.** Load the four phase JSONs and the templates. Assert each phase's
> row count matches its `problem_count` field.
>
> **Step 4 — day view, read-only.** Problems grouped by day, each with its LeetCode link, difficulty,
> company chips, pattern name, and a collapsible "What this teaches you" panel built from the
> `learnings` object. No tier badges — every problem is CORE in this version, so the field is dead
> weight in the UI.
>
> **Step 5 — progress writes.** The eight user fields from `SPEC.json → user_field_schema`. Status
> cycle, revision star, confidence 1–5, notes, tags with the seeded vocabulary.
>
> **Step 6 — the pattern index.** PRD §3.4. One page listing every problem's `pattern` grouped by
> topic, each linking to its problem and its C++ template. This is the revision surface and it's the
> highest-value screen in the whole tab.
>
> Two things to be careful about: `tuf.article` and `tuf.youtube` are null for problems outside
> Striver's sheet — hide the chip, don't render a dead link. And checkpoints are computed from the
> `learnings` array at request time, not stored; the decay rules are in PRD §3 and HANDOFF §7.

---

## State of the content

| Phase | Days | Problems | Status |
|---|---|---|---|
| V0 Prerequisites | 1–3 | 14 | ready |
| V1 Trees & BST | 4–7 | 20 | ready |
| V2 Graphs | 8–13 | 31 | ready |
| V3 Dynamic Programming | 14–21 | 38 | **pending** |
| V4 Core Patterns | 22–29 | 40 | ready |
| V5 Tries | 30 | 2 | **pending** |

**105 of 145 ready.** The pending 40 use the identical record shape, so they drop in through the
same importer with no migration. Don't wait for them to start building.

---

## Then start solving

The sheet is usable from the markdown right now — `v0-prerequisites.md` is day 1. You don't need the
website finished to begin, and waiting for it is the most expensive form of procrastination
available to you.
