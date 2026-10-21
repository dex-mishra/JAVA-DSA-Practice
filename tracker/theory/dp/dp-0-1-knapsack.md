# 0/1 knapsack — each item at most once

> dp[c] = best (or whether possible, or number of ways) using items so far with capacity/sum c. For each item, loop c downwards: dp[c] = combine(dp[c], dp[c − w]).

## Idea

✍️ Items with weights (and maybe values); each can be taken **once** or not at all. Capacity / target sum C.
✍️ Full state: `dp[i][c]` = answer using the first i items with capacity c. Transition: skip item i → `dp[i−1][c]`; take it (if `w ≤ c`) → `dp[i−1][c − w] + value`.
✍️ One-row version: iterate items outer, capacity **from C down to w** inner.

## Recognise it

✍️ "subset with sum equal to …", "partition into two equal-sum subsets", "assign + or − signs to reach target", "pick items under a budget to maximise value", each item used once.

## Partition equal subset sum

```java
boolean canPartition(int[] a) {
    int total = 0; for (int x : a) total += x;
    if (total % 2 != 0) return false;
    int T = total / 2;
    boolean[] dp = new boolean[T + 1];
    dp[0] = true;                                   // empty subset makes sum 0
    for (int x : a)
        for (int c = T; c >= x; c--)                // DOWNWARDS: each x used once
            dp[c] = dp[c] || dp[c - x];
    return dp[T];
}
```

## Target sum → subset count

✍️ Signs + and −: let P = sum of '+' numbers, N = sum of '−'. P − N = target, P + N = total ⇒ **P = (target + total) / 2**. Count subsets with sum P (0/1 knapsack counting: `dp[c] += dp[c − x]`).
✍️ Impossible if `(target + total)` is odd or `|target| > total`.

## Pitfalls

✍️ Looping capacity upwards in the one-row version reuses items → wrong answer (that is unbounded knapsack).
✍️ `dp[0] = true` / `dp[0] = 1` is the empty subset; forgetting it makes everything false/zero.
✍️ Zeros in target sum: each zero doubles the count — the counting DP handles this naturally if `dp[c] += dp[c − 0]` is applied once per zero item.

## Complexity

O(n·C) time, O(C) space. "Pseudo-polynomial": fine when C ≤ ~10⁴–10⁵.
