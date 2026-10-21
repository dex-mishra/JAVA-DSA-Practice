# Best Time to Buy and Sell Stock

**LeetCode:** [121. Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) (Easy)  
**Day:** 4  
**Pattern:** min-so-far  
**Role:** APPLY

## Understand

✍️ f(prices by day) → max of prices[j] − prices[i] with i < j, or 0 if no profit is possible. One buy, one sell.
- n ≤ 10⁵ → O(n).
- [7,1,5,3,6,4] → 5 (buy 1, sell 6). [7,6,4,3,1] → 0.

## Analyse

✍️ By hand: walking day by day, I remember the cheapest price so far. Each day I ask "if I sold today, what would I make?".
✍️ Hard part: the buy must come **before** the sell — so the max minus the min of the whole array is wrong.
✍️ Edges: prices only fall → 0; one day → 0.

## Brainstorm: brute → optimal

✍️ **1. Brute.** All pairs i < j. O(n²).
✍️ ↳ Bottleneck: for each sell day j, scanning all earlier days for the minimum.
✍️ ↳ Unlock: "recomputing something that changed a little" — the minimum of days 0..j−1 is the minimum of days 0..j−2 plus one more day.
✍️ **2. Optimal.** Keep minSoFar; profit today = price − minSoFar. O(n), O(1).

## Algorithm in words

✍️ 1. Remember the first price as the cheapest so far; best profit 0.
✍️ 2. For each later day: compute today's price minus the cheapest so far; update the best profit.
✍️ 3. Then update the cheapest so far with today's price.

## Pseudocode

```
STATE   minSoFar = p[0]; best = 0
LOOP    for j in 1..n-1
UPDATE    best = max(best, p[j] - minSoFar)     sell today
          minSoFar = min(minSoFar, p[j])        today becomes a buy option
RETURN  best
```

## Reference Java

```java
class Solution {
    public int maxProfit(int[] p) {
        int minSoFar = p[0], best = 0;
        for (int j = 1; j < p.length; j++) {
            best = Math.max(best, p[j] - minSoFar);
            minSoFar = Math.min(minSoFar, p[j]);
        }
        return best;
    }
}
```

## Dry run

| p[j] | profit if sold | best | minSoFar |
|---|---|---|---|
| 7 | – | 0 | 7 |
| 1 | −6 | 0 | 1 |
| 5 | 4 | 4 | 1 |
| 3 | 2 | 4 | 1 |
| 6 | 5 | 5 | 1 |
| 4 | 3 | 5 | 1 |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ Max − min of the whole array is wrong when the min comes after the max ([7, 1] → 0, not 6).

## Carry forward

✍️ "Best pair i < j" where the score is f(j) − g(i) → keep the best g so far.
✍️ This is the root of the stock family; adding rules (cooldown, fees, k trades) turns it into a state-machine DP.

## Interview follow-ups

- *Unlimited transactions* (LeetCode 122): sum every positive day-to-day increase.
- *At most two transactions / k transactions / cooldown / fee:* state machine DP (Day 29, [[dp-state-machine]]).
- *Return the buy and sell days.* Remember the index of minSoFar when best improves.

## Siblings

- [Best Time to Buy and Sell Stock II](siblings/best-time-to-buy-and-sell-stock-ii/) (must)
- [Maximum Difference Between Increasing Elements](siblings/maximum-difference-between-increasing-elements/) (optional)
- [Best Sightseeing Pair](siblings/best-sightseeing-pair/) (optional)
