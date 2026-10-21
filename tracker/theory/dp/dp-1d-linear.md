# 1D DP on a line — take or skip, ways to reach

> dp[i] depends on a fixed number of earlier states: climbing stairs (sum of ways), house robber (take or skip), decode ways (one or two digits).

## Idea

✍️ Process positions left to right. At position i there are a few **choices**, each leading back to an earlier position. dp[i] combines them: sum (counting ways), max/min (optimising).

## The three models

✍️ **Ways to reach** (climbing stairs): `dp[i] = dp[i−1] + dp[i−2]` — the last step was 1 or 2.
✍️ **Take or skip** (house robber): `dp[i] = max(dp[i−1], dp[i−2] + a[i])` — skip house i, or rob it and skip i−1.
✍️ **Decode in pieces** (decode ways): `dp[i] = (s[i−1] valid ? dp[i−1] : 0) + (s[i−2..i−1] in 10..26 ? dp[i−2] : 0)`, with `dp[i]` = ways to decode the first i characters.

## Template: house robber

```java
int rob(int[] a) {
    int prev2 = 0, prev1 = 0;                 // best for houses up to i-2, up to i-1
    for (int x : a) {
        int cur = Math.max(prev1, prev2 + x); // skip x, or take x
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
}
```

## Circular version (House Robber II)

✍️ First and last houses are neighbours, so they cannot both be robbed. Answer = max(rob(houses 0..n−2), rob(houses 1..n−1)). Special case n = 1.

## Decode ways details

```java
int numDecodings(String s) {
    int n = s.length();
    int[] dp = new int[n + 1];
    dp[0] = 1;                                         // empty prefix: one way
    for (int i = 1; i <= n; i++) {
        if (s.charAt(i - 1) != '0') dp[i] += dp[i - 1];// single digit 1..9
        if (i >= 2) {
            int two = (s.charAt(i - 2) - '0') * 10 + (s.charAt(i - 1) - '0');
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
    }
    return dp[n];
}
```
✍️ '0' cannot stand alone; "06" is not a valid two-digit code (must be 10..26). Zeros are where all the bugs are.

## Variations

- Min cost climbing stairs: `dp[i] = cost[i] + min(dp[i−1], dp[i−2])`.
- Delete and earn: bucket values, then house robber on the buckets.
- Jump game with costs, tribonacci, paint fence.

## Complexity

O(n) time, O(1) space with rolling variables.
