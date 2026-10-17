# docs/dsa-sheet/v3 — start here

This folder is the complete input for the DSA tab v3. Claude Code: read `PRD-v3.md` first, then this map.

## Read as specs (do not parse)
| File | What |
|---|---|
| `PRD-v3.md` | What to build, in what order, and how to accept it. |
| `CLAUDE-CODE-PROMPT.md` | The prompt to paste into Claude Code to start the work. |
| `authoring/README.md` | How content batches are produced (for later batches). |

## Parse as data
| File | Count | What |
|---|---|---|
| `PLAN.json` | 30 days, 120 problems, 8 skims | The frozen plan: roles, daily blocks, floor, cut order, stuck ladder, AI protocol, legacy ids. |
| `MOCK-SCHEDULE.json` | 6 regular + 1 grand | Frozen mock dates (seeded once). |
| `days/day-01.json` … `day-05.json` | 20 problems, 60 siblings, 25 drill items, 5 CS-core cards | Full teaching content for Days 1–5. Days 6–30 arrive in batches (PRD §15). |
| `theory/*.json` | 161 pages, 27 topics | The whole theory library, all 30 days. |
| `theory/INDEX.json` | — | Catalogue of pages and their section ids. |
| `oa/mock-01-problems.json` | 3 problems, 100 marks | Mock 01 (Fri 23 Oct). q1/q2 carried from v2, q3 new. |

## Tools
| File | Run |
|---|---|
| `authoring/verify_cpp.py` | `python3 docs/dsa-sheet/v3/authoring/verify_cpp.py docs/dsa-sheet/v3` — compiles and tests all 80 reference C++ solutions (all pass as delivered). |
| `authoring/build.py` | Content author's tool: `.txt` sources → the JSON above, with every cross-reference validated. Not part of the site build. |
| `authoring/plan.py` | Regenerates `PLAN.json` and `MOCK-SCHEDULE.json` (fixed seed). Only needed if the start date ever moves. |

## Ignore completely
- Everything in `docs/dsa-sheet/` outside `v3/` once you have moved it to `docs/dsa-sheet/_superseded-v2/` (PRD §3).
- `authoring/*.txt` and `authoring/old_*.json` — sources and fixtures for the authoring tools, not inputs to the importer.

## Numbers to sanity-check after import
- 120 plan problems; ids are LeetCode slugs; 89 have a `legacy_id`.
- Day 1 = 2026-10-18 (Sun), Day 30 = 2026-11-16 (Mon).
- Mocks: 23 Oct, 28 Oct, 31 Oct, 6 Nov, 9 Nov, 13 Nov, 16 Nov (grand).
- 161 theory pages; every reference in Days 1–5 resolves to an existing page and section.
