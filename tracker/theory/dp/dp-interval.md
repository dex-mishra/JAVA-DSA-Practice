# Interval DP (recognition level)

> dp[i][j] = answer for the subarray i..j, computed from smaller intervals by choosing a split point k. Burst balloons, matrix chain, palindrome partitioning. O(n³).

## Idea

✍️ State = an interval [i, j]. Transition: try every split point k in the interval; combine `dp[i][k]` and `dp[k][j]` (plus a cost for the split).
✍️ Order: by increasing interval length, so all shorter intervals are ready.

## Burst balloons insight

✍️ Think of k as the **last** balloon burst in (i, j), not the first. Then its neighbours at that moment are exactly i and j (padded with 1s at both ends): `dp[i][j] = max over k of dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]`.

## Recognise it

✍️ n ≤ ~500, the answer for a range depends on how it is split or which element is handled last; merging stones, minimum cost to cut a stick, matrix chain multiplication.
