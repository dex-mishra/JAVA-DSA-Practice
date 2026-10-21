# Best Time to Buy and Sell Stock II

**LeetCode:** [122. Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) (Medium)  
**Tier:** must  
**How it maps from Best Time to Buy and Sell Stock:** With unlimited trades, every upward step can be captured — sum all positive differences.

## Analyse

✍️ Unlimited buy/sell (hold at most one share at a time). Maximum total profit.

## Brainstorm

✍️ Any profitable trade from i to j equals the sum of the daily increases between them, and taking every positive daily increase is never worse. Greedy O(n). (State-machine DP also works: hold/cash.)

## Algorithm in words

✍️ For each day after the first, add max(0, today − yesterday).

## Pseudocode

```
profit = 0
for i in 1..n-1: profit += max(0, p[i] - p[i-1])
```

## Reference Java

```java
class Solution {
    public int maxProfit(int[] p) {
        int profit = 0;
        for (int i = 1; i < p.length; i++) profit += Math.max(0, p[i] - p[i - 1]);
        return profit;
    }
}
```

## Quick theory

✍️ A long rise = a chain of daily rises, so greedy capture is safe. With fees or cooldowns that breaks → DP ([[dp-state-machine#family]]).
