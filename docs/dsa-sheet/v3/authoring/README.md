# Authoring pipeline for DSA v3 content

Content is written as plain-text sources and compiled to JSON by `build.py`, which validates every cross-reference and (without `--no-compile`) compiles and runs every C++ solution.

```
python3 plan.py ..                 # PLAN.json + MOCK-SCHEDULE.json (only if the plan itself changes — it should not)
python3 build.py .. [--no-compile] # theory/*.txt + days/*.txt  ->  ../theory/*.json, ../days/day-NN.json
python3 verify_cpp.py ..           # compile + test every solution in ../days/*.json (parallel)
```

## Theory source format (`theory/*.txt`)
```
=== page: <page-id>
title: ...
topic: ...
kind: concept | mechanics | cpp | pattern | meta | skim
summary: one line
prereqs: id, id
related: id, id
--- <section-id> | <Section title> | write | screenshot | mixed
markdown body; in mixed sections lines starting with "✍️ " are write-lines
inline links: [[page-id]] or [[page-id#section-id]]
```

## Day source format (`days/day-NN.txt`)
```
=== day: N
micro_title: ...
micro_theory: page, page
--- micro | ... | mixed
--- card | Pattern card | write

=== problem: <slug from PLAN.json, in PLAN order>
theory_refs:
- <stage> | <what in that stage> | <page>#<section> | <why>
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
--- tests | Tests | hidden                       (C++ statements using CHECK(cond))
+++ sibling: <lc id> | <slug> | <title> | <difficulty> | must | optional
maps: one line
--- analyse / brainstorm / algorithm / pseudocode / solution / quick_theory / tests

=== drill
+++ item: <lc id> | <slug> | <title> | <difficulty>
statement: original paraphrase (never copy LeetCode text)
pattern: <page id>
pattern_name: ...
approach: ...
trigger: ...
complexity: ...
--- details | Full statement | screenshot          (optional; input, output, constraints, one example —
                                                   original words, never LeetCode's text, no hint of the technique)

=== cs_core: <id>
subject: OOP | DBMS | OS | CN
title: ...
--- concept | Concept | write
--- code | ... | screenshot
--- interview | Interview questions | mixed
```

## Batch checklist (5 days ahead of the user)
1. Problems come from `PLAN.json` (never change the list).
2. Exactly one `must` sibling per problem; sibling and drill slugs must not appear anywhere else in the plan.
3. Assign the outstanding Blind-75 siblings listed in PRD §16 to the batch where they fit.
4. `build.py` must pass with compilation on (every solution has tests).
5. Write the mock(s) whose dates fall in the next window; `source_day` within `covers_days`.
6. Flip `content` to `ready` for the batch's days in `PLAN.json` (via `plan.py READY_DAYS`) and mocks in `MOCK-SCHEDULE.json`.
