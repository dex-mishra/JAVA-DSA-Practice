# docs/dsa-sheet/v3 — start here

This folder is the complete input for the DSA tab. v3 is live; **v3.1** (guided UI, reader flow, notes, CS core) is the current work.
Claude Code: read `PRD-v3.1-guided.md` first, then this map. `PRD-v3.md` stays the base spec for everything v3.1 does not change.

## Read as specs (do not parse)
| File | What |
|---|---|
| `PRD-v3.1-guided.md` | **Current work.** Guided UI, reader with return stack, outline notes, recall, CS core, content-format extension, P1/P2 phasing and acceptance. |
| `PRD-v3.md` | Base spec (data model, scheduling, mocks, notifications). Already built. |
| `CLAUDE-CODE-PROMPT.md` | The prompt to paste into Claude Code to start v3.1. |
| `authoring/README.md` | How content is written and compiled (for later batches). |

## Parse as data
| File | Count | What |
|---|---|---|
| `PLAN.json` | 30 days, 120 problems, 8 skims | Frozen plan (unchanged in v3.1). |
| `MOCK-SCHEDULE.json` | 6 regular + 1 grand | Frozen mock dates (unchanged). |
| `CORE-PLAN.json` | 44 core days | **New.** CS core syllabus: Days 1–30 at 45 min (OOP → DBMS+SQL → OS → CN), then Nov 17–30 at ~3 h (LLD → system design → HLD → revision). Content ready for Days 1–2. |
| `days/day-01.json`, `day-02.json` | 8 problems | **v3.1 format:** `reading_path`, refs with `when`/`need`, detours, problem `note`, must-sibling `note`, `core` block with MCQs. |
| `days/day-03.json` … `day-05.json` | 12 problems | v3 format; render through the fallbacks (PRD v3.1 §12). |
| `theory/*.json` | 165 pages, 28 topics | 161 DSA pages + 4 CS core pages (OOP). 23 pages have `notes_status: ready` (note + recall + shot); the rest `pending`. |
| `theory/INDEX.json` | — | Catalogue of pages, sections and notes status. |
| `oa/mock-01-problems.json` | 3 problems | Mock 01 (Fri 23 Oct). Unchanged. |

## Tools
| File | Run |
|---|---|
| `authoring/verify_cpp.py` | `python3 docs/dsa-sheet/v3/authoring/verify_cpp.py docs/dsa-sheet/v3` — compiles and tests all 80 reference solutions (all pass). |
| `authoring/build.py` | Content author's tool: `.txt` sources → JSON above. Its validation rules are the ones the importer must mirror (PRD v3.1 §12). |
| `authoring/plan.py`, `authoring/coreplan.py` | Regenerate `PLAN.json`/`MOCK-SCHEDULE.json` and `CORE-PLAN.json`. Only if dates move. |

## Ignore completely
- `authoring/*.txt`, `authoring/**/*.txt`, `authoring/old_*.json`, `authoring/bak/` — authoring sources, not importer inputs.
- `docs/dsa-sheet/_superseded-v2/` and `docs/dsa-sheet/_to_delete/`.

## Numbers to sanity-check after import
- 120 plan problems; Day 1 = 2026-10-18 (Sun), Day 30 = 2026-11-16 (Mon).
- Day 1 reading path: 7 steps, 21 min. Day 2: 6 steps, 13 min.
- Day 1 core: `oop-classes-objects-memory`, `oop-constructors-destructors`, 6 MCQs. Day 2 core: `oop-encapsulation-access`, `oop-abstraction-interfaces`, 6 MCQs.
- Every Day 1–2 problem has a `note`; every LEARN problem has ≥ 1 `before` ref.
- Every reference, detour and reading-path step resolves to an existing page and section.
