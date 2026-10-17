# Authoring pipeline for DSA content (v3.1 format)

Content is written as plain-text sources and compiled to JSON by `build.py`, which validates every cross-reference and (without `--no-compile`) compiles and runs every C++ solution.

```
python3 plan.py ..                 # PLAN.json + MOCK-SCHEDULE.json (only if dates move)
python3 coreplan.py ..             # CORE-PLAN.json (CS core syllabus)
python3 build.py .. [--no-compile] # theory/*.txt + days/*.txt  ->  ../theory/*.json, ../days/day-NN.json
python3 verify_cpp.py ..           # compile + test every solution in ../days/*.json (parallel)
```

## Theory pages (`theory/*.txt`)
```
=== page: <page-id>
title: ...
topic: ...                       (DSA topic, or for CS core: oop | dbms | os | cn | lld | sd | hld)
kind: concept | mechanics | cpp | pattern | meta | skim | core
summary: one line
prereqs: id, id
related: id, id
--- <section-id> | <Section title> | write | screenshot | mixed
markdown body; in mixed sections lines starting with "✍️ " are write-lines
inline links: [[page-id]] or [[page-id#section-id]]
detour (on its own line, placed exactly where the reader should jump):
>> detour <page-id>#<section-id> | <why, one line> | <N> min
```
Section ids `note`, `recall`, `shot` are reserved.

## Notes for a page (`=== notes:` block, any theory file; Days 1–2 notes are in `50-notes-day01-02.txt`)
```
=== notes: <page-id>
--- note | Note this | write
1. Topic
   • pointer
       ◦ sub-pointer
✎ In my words: ______
--- recall | Recall | write
- question :: answer          (≥ 3 lines)
--- shot | <card title> | screenshot
markdown: a table, code block or ASCII picture worth pasting as an image
```
Rules: note, recall and shot come together (all three or none). `kind: core` pages must have them. A page with them gets `notes_status: ready`. Outline levels: `N.` at column 0, `•` after 3 spaces, `◦` after 7 spaces; a `✎` line is a write-in prompt.

## Days (`days/day-NN.txt`)
```
=== day: N
micro_title: ...
micro_theory: page, page                      (v3 fallback; keep it)
reading_path:                                 (required from Day 1 onwards in v3.1 batches)
- <page>#<section> | <bridge: why this step, one line> | <minutes>
--- micro | Today in one minute | mixed
--- card | Pattern card | write

=== problem: <slug from PLAN.json, in PLAN order>
theory_refs:
- <stage> | <at: short quote from that stage> | <page>#<section> | <why> | <when: before|while|stuck|after> | <need: must|optional>
stuck_refs:
- 10 | <page>#<section>
--- understand | Understand | mixed
--- analyse | Analyse | write
--- brainstorm | Brainstorm: brute → optimal | write
--- algorithm | Algorithm in words | write
--- pseudocode | Pseudocode | write
--- solution | Reference C++ | screenshot       (class Solution in a ```cpp fence)
--- dry_run | Dry run | screenshot
--- edges | Edge cases and complexity | mixed
--- carry | Carry forward | write
--- followups | Interview follow-ups | screenshot
--- note | Note this | write                    (outline; required in v3.1 batches)
--- tests | Tests | hidden                       (C++ statements using CHECK(cond))
+++ sibling: <lc id> | <slug> | <title> | <difficulty> | must | optional
maps: one line
--- analyse / brainstorm / algorithm / pseudocode / solution / quick_theory / note / tests

=== drill
+++ item: <lc id> | <slug> | <title> | <difficulty>
statement: original paraphrase (never copy LeetCode text)
pattern: <page id>
pattern_name: ...
approach: ...
trigger: ...
complexity: ...

=== core: N                                    (replaces legacy === cs_core)
subject: OOP | DBMS | OS | CN | LLD | System design | HLD
unit: ...
title: ...
minutes: 45
topics: <core page id>, <core page id>        (each needs notes)
explain: one interview-style "explain it aloud" prompt
--- intro | Today | mixed
+++ mcq: <id>
q: ...
a: ...
b: ...
c: ...
d: ...
answer: a|b|c|d
why: one or two lines
topic: <core page id>
```
4-field refs (v3) still parse and default to `while | optional`. Stage bodies may also contain detour lines.

## Validation (build.py refuses on failure; the importer mirrors it)
- Every ref, stuck ref, link, detour and reading-path step resolves to an existing page and section.
- Days in a v3.1 batch: reading_path present, every path page has notes ready, every problem has a `note`, must siblings have a `note`, every LEARN problem has ≥ 1 `before` ref.
- Core block: topics are `kind: core` pages with notes; ≥ 5 MCQs, each with a valid answer and a `topic` among the block's topics.
- `used_by` on every page is recomputed (refs, stuck, links, detours, paths, core) with where, why and when.

## Batch checklist (5 days ahead of the user)
1. Problems come from `PLAN.json` (never change the list).
2. Exactly one `must` sibling per problem; sibling and drill slugs must not appear anywhere else in the plan.
3. Write `=== notes:` for every page that the batch's reading paths and `must` refs use.
4. Write the batch's reading paths with bridges; place detours inside page bodies at the exact line where a jump helps.
5. Write the CS core days from `CORE-PLAN.json` (core pages with notes + one `=== core:` block per day).
6. `build.py` must pass with compilation on (every solution has tests).
7. Write the mock(s) whose dates fall in the next window; `source_day` within `covers_days`.
8. Flip `content` to `ready` for the batch's days in `PLAN.json` and `CORE-PLAN.json`, and mocks in `MOCK-SCHEDULE.json`.
