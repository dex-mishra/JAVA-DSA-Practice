# Unbounded knapsack — coins you can reuse

> Items can be used any number of times; loop capacity upwards. Coin change (minimum coins) and coin change II (number of combinations).

## Idea

✍️ Each coin can be used again, so taking a coin leads to the **same** row: `dp[c] = best(dp[c], dp[c − coin] + 1)` where `dp[c − coin]` may already include this coin. Loop capacity **upwards**.

## Minimum coins

```java
int coinChange(int[] coins, int amount) {
    final int INF = 1_000_000_000;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int c = 1; c <= amount; c++)
        for (int coin : coins)
            if (coin <= c && dp[c - coin] != INF)
                dp[c] = Math.min(dp[c], dp[c - coin] + 1);
    return dp[amount] == INF ? -1 : dp[amount];
}
```
✍️ `dp[c]` = fewest coins to make exactly c. INF marks "impossible"; check before adding 1.
✍️ Greedy (largest coin first) is wrong: coins {1, 3, 4}, amount 6.

## Number of combinations

```java
int change(int amount, int[] coins) {
    long[] dp = new long[amount + 1];
    dp[0] = 1;
    for (int coin : coins)                     // coins OUTER → combinations
        for (int c = coin; c <= amount; c++)
            dp[c] += dp[c - coin];
    return (int) dp[amount];
}
```
✍️ Coins in the **outer** loop counts each multiset once ({1,2} and {2,1} are the same). Amount in the outer loop counts ordered sequences instead ([[dp-counting-vs-optimising#order]]).

## Variations

- Perfect squares (LeetCode 279): coins = 1, 4, 9, …, minimum count.
- Combination sum IV (LeetCode 377): **ordered** sequences → amount outer, nums inner.
- Rod cutting, minimum cost tickets (with a twist).

## Complexity

O(amount × number of coins) time, O(amount) space.
