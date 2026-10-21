# The "first true" template — one binary search for everything

> Turn any monotone yes/no question into F…FT…T and find the first T with a half-open loop. Avoids every off-by-one decision.

## The template

✍️ Define `ok(i)` that is false for small i and true from some point on. Find the first i with `ok(i)`.
```java
int lo = LOW, hi = HIGH;        // the answer is in [LOW, HIGH]; HIGH may be "none" sentinel
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (ok(mid)) hi = mid;      // mid works: answer is mid or to its left
    else lo = mid + 1;          // mid fails: answer is to its right
}
return lo;
```
✍️ Three fixed lines: `while (lo < hi)`, `hi = mid` on true, `lo = mid + 1` on false. `mid` rounds down, so `lo` always moves → no infinite loop.

## Last true (T…TF…F)

✍️ For "the last i with ok(i)", either search for the first `!ok` and subtract 1, or use `mid = lo + (hi − lo + 1) / 2` (round **up**) with `lo = mid` on true and `hi = mid − 1` on false.
✍️ Rounding up is required in that form: with round-down, `lo = mid` can repeat forever on a two-element range.

## Choosing ok(i)

✍️ The skill is writing `ok` so it is monotone. Examples:
- First ≥ x: `ok(i) = a[i] >= x`.
- Minimum in rotated array: `ok(i) = a[i] <= a[n−1]` (every element of the right, smaller part satisfies it).
- Peak element: `ok(i) = a[i] > a[i+1]` (true from the peak onward on any increasing-then-decreasing slope).
- Smallest speed that finishes in time: `ok(s) = hoursNeeded(s) <= h` ([[bs-on-answer]]).
