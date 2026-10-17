# Start here

Read this, then `PRD-v2.md`, then `HANDOFF.md`. Everything else is data.

**The content is finished.** 145 of 145 problems authored, verified, 0 errors. Nothing is pending any
more, so there is no "wait for the rest" step in the build.

---

## Give the Claude Code session these files

Copy them into the repo under `docs/dsa-sheet/` plus a `data/` folder.

**Specs — read, don't parse**

1. `PRD-v2.md` — what the sheet is, what changed, the interface work required
2. `HANDOFF.md` — database schema, importer contract, API surface, UI requirements
3. `PRD-OA-TAB.md` — the OAs sub-tab: tables, execution backend, scoring, mock generation
4. `SPEC.json` — machine-readable: phase map, user-field schema with types and defaults,
   revision-queue SQL, stuck ladder

**Data — parse these**

5. `v0-prerequisites.json` — 14 problems, days 1–3
6. `v1-trees.json` — 20, days 4–7
7. `v2-graphs.json` — 31, days 8–13
8. `v3-dp.json` — 38, days 14–21
9. `v4-core-patterns.json` — 40, days 22–29
10. `v5-advanced.json` — 2, day 30
11. `cpp-pattern-templates.json` — 76 C++ templates
12. `PATTERN-INDEX.json` — 145 patterns across 17 topics, each row already joined
    problem → pattern → template. Build the pattern index page from this rather than re-deriving it.
13. `oa/mock-oa-01-problems.json` — the first mock OA, to seed the OAs tab

**Optional, import later or not at all**

- `OPTIONAL-narrow-tricks.json` — 31 unscheduled stretch problems

**Do not give it** the `.md` twins of any JSON file (same content, for your reading) or
`_superseded-600-plan/` (the dead 600-problem plan).

---

## Paste this into the Claude Code session

Use `CLAUDE-CODE-PROMPT.md` — it is the prompt, kept in its own file so you can paste it without
editing. It names every file to use and every file to ignore.

---

## State of the content

| Phase | Days | Problems | Status |
|---|---|---|---|
| V0 Prerequisites | 1–3 | 14 | ready |
| V1 Trees & BST | 4–7 | 20 | ready |
| V2 Graphs | 8–13 | 31 | ready |
| V3 Dynamic Programming | 14–21 | 38 | ready |
| V4 Core Patterns | 22–29 | 40 | ready |
| V5 Tries & Revision | 30 | 2 | ready |

**145 / 145.** Trees, graphs and DP are 89 of them — 61% of the sheet, which is the point.

Supporting content: 76 C++ templates, 145-row pattern index, 1 mock OA.

---

## The OAs tab, in one paragraph

`PRD-OA-TAB.md` specifies a sub-tab under DSA that holds timed mock OAs at campus-OA standard. Each
mock is scoped to days you have already covered, so it can only test concepts you have met. Mock OA
01 is built: 90 minutes, 100 marks, 3 problems, scoped to days 1–3 only (Boyer-Moore voting,
prefix-sum with a hashmap, bounded combinations with dedup). All 6 sample cases were brute-force
verified against reference implementations.

The published artifact is a working HackerRank-style environment you can sit for right now — timer,
split pane, editor, sample runs, hidden-test checklist, scored review. It executes JavaScript for
real; for C++ it shows expected output for you to compare against, because an artifact cannot
compile C++. The real app should wire Judge0 or Piston instead — PRD §4 says how, and says plainly
not to build your own sandbox.

---

## Then start solving

The sheet is usable from the markdown right now — `v0-prerequisites.md` is day 1. You do not need
the website finished to begin, and waiting for it is the most expensive form of procrastination
available to you.
