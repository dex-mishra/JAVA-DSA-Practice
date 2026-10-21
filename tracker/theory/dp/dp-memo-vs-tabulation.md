# Memoisation vs tabulation

> Top-down (recursion + cache) and bottom-up (fill a table in order) compute the same states. Start top-down when the recursion is clearer; convert to bottom-up for speed and space optimisation.

## Top-down: memoisation

✍️ Write the plain recursion, then add a cache: check the cache at the start of the call, store the result before returning.
```java
long[] memo;                     // -1 = not computed
long ways(int n) {
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    return memo[n] = ways(n - 1) + ways(n - 2);
}
```
✍️ Advantage: you only write the recurrence; only reachable states are computed. Disadvantage: recursion overhead and stack depth.

## Bottom-up: tabulation

✍️ Allocate the table, fill base cases, loop over states in an order where dependencies are already filled.
```java
long[] dp = new long[n + 1];
dp[0] = dp[1] = 1;
for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
```
✍️ Advantage: no recursion, easy to see which previous states are used → easy space optimisation ([[dp-space-optimisation]]).

## Which to write first

✍️ In interviews: describe the recursion first (it shows the thinking), memoise it, then offer the bottom-up version.
- When the order of states is awkward (intervals, trees, DAGs) top-down is often easier to get right.
