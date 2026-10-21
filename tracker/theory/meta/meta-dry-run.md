# Dry runs — tracing variables by hand

> How to trace pseudocode on a small input in a table, so bugs show up on paper instead of in submissions.

## What a dry run is

✍️ A dry run executes your pseudocode by hand on a small input, writing the value of every state variable after each iteration in a table.
It is the paper equivalent of a debugger. It takes 2–3 minutes and catches the two bugs that cost the most submissions: wrong initial values and off-by-one loop bounds.

## The table layout

✍️ One column per state variable, one row per loop iteration, plus a column for "what happened".

```
i | x | need | seen (after) | note
0 | 2 |  7   | {2:0}        | 7 not in seen, insert 2
1 | 7 |  2   |              | 2 in seen → return [0,1]
```

✍️ Always include a row for the state **before** the first iteration — that is where initialisation bugs live.

## Choosing the dry-run input

✍️ Use the edge case you are least sure about, not the sample (the sample usually works).
- For pointer problems: a case where the pointers meet or cross.
- For window problems: a case where the window must shrink more than once in a row.
- For counting problems: a case with duplicates.
- Keep it to 4–6 elements. If the table needs more than 8 rows, pick a smaller input.

## When to do one

✍️ Always before submitting a TWIST or DISGUISE problem.
- After any wrong answer, before changing code: dry-run the failing case on paper first. Changing code without knowing why it failed usually creates a second bug.
