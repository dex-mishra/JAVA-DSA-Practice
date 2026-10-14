# DSA Sheet — PRD v2

**Supersedes the 600-problem plan.** The sheet is now **145 concept-building problems across 30 days**, reordered so trees, graphs and DP come first. Read this alongside `HANDOFF.md`, which still
holds the database schema and API surface — those are unchanged.

---

## 1. What changed, and why

The 600-problem plan was unusable. At ~15 problems a day it optimised for coverage over
understanding, and coverage is not what gets you through an interview.

| | v1 | v2 |
|---|---|---|
| Problems | 600 | **145** |
| Days | 40 | **30** |
| Per day | ~15 | **~5** |
| Tiers | CORE / DRILL / SKIM | **all CORE** — every problem is coded fully |
| Order | foundations → breadth → trees → graphs+DP → depth | **prerequisites → trees → graphs → DP → core patterns → advanced** |
| Trees + graphs + DP share | 37% | **61%** |

**The selection principle:** one problem per *transferable* concept — which is stricter than one
per distinct pattern. The v1 CORE tier gave 114 problems with 114 distinct patterns, but an audit
of those found three classes:

| Class | Count | Kept? |
|---|---|---|
| **LOAD** — the technique transfers to many problems | 58 | yes |
| **CLASSIC** — narrow, but asked by name often enough that skipping is a risk | 16 | yes |
| **NARROW** — clever one-off, buys exactly one problem | 30 | **cut** |

Rotate Image is a memorised transpose-then-reverse. Next Permutation is a three-step procedure.
Happy Number is Floyd's cycle detection, which Linked List Cycle II already teaches. None of those
make you better at the next unseen problem, so none of them earn a slot.

The 30 cut problems ship as `OPTIONAL-narrow-tricks.md` — authored in full, unscheduled, and
excluded from the count. Ten further problems were dropped earlier as outright pattern duplicates;
those are listed in `data/dropped_v2.json`.

**Ten problems were dropped as duplicates**, listed with reasons in `data/dropped_v2.json`. For
example `balanced-binary-tree` taught `bottom-up-return`, which `diameter-of-binary-tree` and
`binary-tree-maximum-path-sum` already teach better. They remain available as stretch problems if
you want them later.

---

## 2. Phase structure

| Phase | Title | Days | Problems | Source |
|---|---|---|---|---|
| `V0` | Prerequisites | 1–3 | 14 | reused |
| `V1` | Trees & BST | 4–7 | 20 | reused |
| `V2` | Graphs | 8–13 | 31 | **delivered** |
| `V3` | Dynamic Programming | 14–21 | 38 | **delivered** |
| `V4` | Core Patterns | 22–29 | 40 | reused |
| `V5` | Advanced & Revision | 30 | 2 | **delivered** |

Flat ~4.8 problems a day.

**V0 is deliberately thin.** It carries only what trees, graphs and DP actually require: hashing,
sorting, recursion and backtracking, plus the five array patterns DP is built on — Kadane, prefix
sums with a map, the running minimum, backward merging and the two-pointer write.

**V4 sits after DP on purpose.** Aryan has already done basic array work, and the stated priority is
to reach the high-yield topics first. The trade-off is real and worth naming: arriving at DP without
array fluency is harder. V0's five array problems are the hedge against that.

---

## 3. Interface changes required

### 3.1 Drop the tier system from the UI

Every one of the 145 problems is `CORE`. The field stays in the schema so no migration is needed,
but:

- **Remove** the tier badge from problem rows
- **Remove** `tier` from the filter set
- **Remove** the per-day "N core, N drill, N skim" summary line

Replace that summary with `N problems · <topic>`.

### 3.2 Re-key phases

Phase keys changed from `P0/P1/P2A/P2B/P3/P4` to `V0…V5`. If any v1 data was imported, the importer
should upsert the new keys and delete orphaned `dsa_phase` rows whose key starts with `P`. Problem
ids are **unchanged** (`{topic}-{slug}`), so `dsa_progress` survives intact — this is exactly what
the stable-id rule in HANDOFF.md §4 was for.

### 3.3 Day view becomes the primary surface

At five problems a day the day view is a comfortable screen rather than a scroll. Show all five
expanded by default, with the learnings panel collapsed.

### 3.4 Add a pattern index

New requirement, and the highest-value addition in v2. Because every problem now owns a distinct
pattern, `dsa_problem.pattern` is a genuine index rather than a tag.

```
GET /api/dsa/patterns  ->  [{ pattern, problem_id, title, topic, template_id }]
```

Render it as a single scrollable page grouped by topic. This is the revision surface: 145 pattern
names, each linking to its one problem and its C++ template. Aryan should be able to read the whole
list in ten minutes and know which names he cannot explain.

### 3.5 Striver link coverage is partial, by design

`tuf.article`, `tuf.practice` and `tuf.youtube` are `null` for problems outside Striver's sheet.
Hide the chip when null; do not render a dead link or a placeholder.

Coverage across all 145: **108 editorials (74%), 107 practice pages (74%), 100 videos (69%)**. The
remaining 37 are LeetCode-only problems chosen because they teach a pattern Striver's sheet does
not isolate.

**URL migration (October 2026).** TUF moved its articles off `/data-structure/<slug>` onto
`/plus/dsa/problems/<slug>`. The old URLs now mostly serve an empty shell — the title renders, the
article body does not. Every link in the sheet has been repointed:

| Field | Value | Note |
|---|---|---|
| `tuf.article` | `https://takeuforward.org/plus/dsa/problems/<slug>?tab=editorial` | the editorial. Render this as the TUF chip. |
| `tuf.practice` | `https://takeuforward.org/plus/dsa/problems/<slug>` | TUF's own judge for the same problem. Optional second chip. |
| `tuf.legacy_article` | the old `/data-structure/…` URL | kept for provenance only. **Never render it.** |

One problem, `dp-count-square-submatrices-with-all-ones`, has no page under the new scheme, so its
`article` is still a legacy URL. That one was checked by hand and still serves its full article;
`practice` is null for it.

### 3.6 Progress maths

Mastery contribution is computed against **145**, not 600.

DSA already feeds the existing rating alongside the placement tracks — this is not a new decision.
`dsa_progress` becomes one more contributing source to the same aggregate the `sde` track already
uses. Do **not** create a fifth track and do **not** build a separate DSA rating.

---

## 4. What is unchanged

Do not rework any of this:

- The six tables in HANDOFF.md §3 (ignore §2's "open decision" — see §3.6 above, it is settled)
- `dsa_progress` and all eight user fields
- The importer contract — idempotent upsert by stable id
- The API surface, except the two additions above
- Checkpoint computation and the decay rules
- The theory three-part structure
- The 76 C++ pattern templates and their ids
- `revision_queue_rule`

---

## 5. Build order from here

1. Import all six phase JSONs (145 problems) — all generated and verified, nothing pending
2. Apply the interface changes in §3
3. Build the pattern index from §3.4, using `PATTERN-INDEX.json` as the pre-computed source
4. Build the OAs sub-tab per `PRD-OA-TAB.md`, seeding it with `oa/mock-oa-01-problems.json`
5. Answer the five codebase questions in START-HERE.md so the migrations target the real schema

---

## 6. Honest risks

- **V4 after DP** is the right call for motivation and the wrong call for prerequisite order. If days
  15–21 feel impossible, move `V4`'s arrays and binary-search problems earlier; the schema does not
  care about phase order.
- **145 problems is not comprehensive** and is not meant to be. It is one representative per pattern.
  If an interview asks a variation, the pattern should carry you — but only if the 145 were genuinely
  understood rather than ticked.
- **Five a day is sustainable, so there is no slack excuse.** The old plan had SKIM problems as a
  pressure valve. This one does not: every problem is to be coded fully, and falling behind means
  falling behind.


---

## 7. The optional appendix

`OPTIONAL-narrow-tricks.json` holds 31 problems cut from the main path. If you import it:

- Keep it in a **separate list**, not in `dsa_problem` alongside the 145
- Do not schedule it, do not give it days, do not count it in mastery
- Surface it as a "stretch" tab or a per-topic "more problems" link

The records use the identical schema, so the importer needs no changes — only a flag or a separate
table to keep them out of the day view.
