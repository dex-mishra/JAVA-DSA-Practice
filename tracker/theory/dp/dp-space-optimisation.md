# Space optimisation — keeping only the rows you need

> If dp[i] only reads dp[i−1] (and dp[i−2]), keep a few variables or two rows instead of the whole table. In knapsack, iterating capacity backwards lets one row suffice.

## Rolling variables

✍️ `dp[i] = f(dp[i−1], dp[i−2])` → keep `prev2`, `prev1`, compute `cur`, shift. O(1) space.
```java
int a = 1, b = 1;                     // dp[i-2], dp[i-1]
for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
```

## Two rows / one row for grids

✍️ Grid DP where `dp[r][c]` uses `dp[r−1][c]` and `dp[r][c−1]` → a single row `dp[c]`: before the update, `dp[c]` still holds the row above; `dp[c−1]` already holds the current row. So `dp[c] = f(dp[c], dp[c−1])`.

## The loop direction rule (knapsack)

✍️ One-row 0/1 knapsack must loop capacity **downwards**, so `dp[c − w]` still holds the previous item's value (each item used once).
✍️ Looping capacity **upwards** lets `dp[c − w]` already include the current item → the item can be reused → that is the **unbounded** knapsack ([[dp-unbounded-knapsack]]).

## When not to bother

✍️ Optimise space only after the full-table version works, or when memory limits demand it. If you need to reconstruct the actual choices (not just the value), keep the full table.
