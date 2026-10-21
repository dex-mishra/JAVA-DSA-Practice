# Range Sum Query - Immutable

**LeetCode:** [303. Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) (Easy)  
**Day:** 4  
**Pattern:** prefix-sum  
**Role:** LEARN

## Understand

✍️ Design a class: constructor gets an array; `sumRange(l, r)` returns a[l] + … + a[r] (inclusive). Up to 10⁴ queries on n ≤ 10⁴.
- The array never changes ("immutable").

## Analyse

✍️ Per-query loop: 10⁴ queries × 10⁴ length = 10⁸ — borderline. The real point: many queries on a static array.
✍️ By hand: sum(2..4) = (sum of first 5) − (sum of first 2). If I had all "sum of first i", every query is one subtraction.
✍️ Edges: l = 0 (must not read index −1); l == r.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Loop from l to r per query. O(n) per query.
✍️ ↳ Bottleneck: different queries re-add overlapping elements.
✍️ ↳ Unlock: "recomputing something…" → precompute every running total once.
✍️ **2. Optimal.** Build `pre` in O(n); answer each query as `pre[r+1] − pre[l]` in O(1).

## Algorithm in words

✍️ 1. In the constructor, build pre of size n+1 with pre[0] = 0 and pre[i+1] = pre[i] + a[i].
✍️ 2. For a query (l, r), return pre[r+1] − pre[l].

## Pseudocode

```
CONSTRUCT  pre = [0] * (n+1)
           for i in 0..n-1: pre[i+1] = pre[i] + a[i]
QUERY      return pre[r+1] - pre[l]
```

## Reference Java

```java
class NumArray {
    private long[] pre;
    public NumArray(int[] a) {
        pre = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
    }
    public int sumRange(int l, int r) { return (int)(pre[r + 1] - pre[l]); }
}
```

## Dry run

a = [−2, 0, 3, −5, 2, −1] → pre = [0, −2, −2, 1, −4, −2, −3]
| query | formula | value |
|---|---|---|
| (0, 2) | pre[3] − pre[0] | 1 |
| (2, 5) | pre[6] − pre[2] | −1 |
| (0, 5) | pre[6] − pre[0] | −3 |

## Edge cases and complexity

✍️ Build O(n), query O(1), space O(n).
✍️ The leading 0 means l = 0 needs no special case.

## Carry forward

✍️ Many range-sum queries on a static array → prefix sums.
✍️ `pre[k]` = sum of the first k elements = boundary before index k.
✍️ Sum of a[l..r] = pre[r+1] − pre[l]. Memorise the picture, not the formula.

## Interview follow-ups

- *The array gets point updates between queries.* Fenwick tree / segment tree: O(log n) update and query (beyond this plan; mention it).
- *2D version.* Rectangle sums with inclusion–exclusion ([[ps-2d-prefix-sum]]).

## Siblings

- [Product of Array Except Self](siblings/product-of-array-except-self/) (must)
- [Range Sum Query 2D - Immutable](siblings/range-sum-query-2d-immutable/) (optional)
- [Find the Highest Altitude](siblings/find-the-highest-altitude/) (optional)
