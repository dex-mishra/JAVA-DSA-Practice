# State machine DP — the stock problems

> Model each day as being in one of a few modes (holding, not holding, cooling down) with transitions between them; dp[mode] holds the best profit in that mode.

## Idea

✍️ The decision on a day depends on your **mode**: if you hold a stock you can sell or keep; if not, you can buy or wait. So the state is (day, mode).
✍️ Draw the modes as circles and the actions as arrows; each arrow becomes one term in a transition.

## Cooldown (LeetCode 309)

✍️ Modes: `hold` (own a stock), `sold` (sold today → must cool down tomorrow), `rest` (no stock, free to buy).
✍️ Transitions for each price p:
✍️ `hold' = max(hold, rest − p)` (keep, or buy from rest)
✍️ `sold' = hold + p` (sell today)
✍️ `rest' = max(rest, sold)` (stay resting, or finish cooldown)
```java
int maxProfit(int[] prices) {
    int hold = Integer.MIN_VALUE / 2, sold = 0, rest = 0;
    for (int p : prices) {
        int h = Math.max(hold, rest - p), s = hold + p, r = Math.max(rest, sold);
        hold = h; sold = s; rest = r;          // update all from the OLD values
    }
    return Math.max(sold, rest);
}
```

## Transaction fee (LeetCode 714)

✍️ Two modes: `hold' = max(hold, cash − p)`, `cash' = max(cash, hold + p − fee)`.

## The whole stock family

| Problem | State |
|---|---|
| one transaction (121) | min so far ([[kad-min-so-far]]) |
| unlimited (122) | hold / cash |
| cooldown (309) | hold / sold / rest |
| fee (714) | hold / cash with fee on sell |
| at most 2 (123) / k (188) | hold[t] / cash[t] for t = 1..k |

## Pitfalls

✍️ Updating `hold` and then using the new `hold` to compute `sold` on the same day. Compute all new values from the old ones first.
✍️ Initial `hold` must be "impossible" (very negative), not 0 — you cannot start holding a stock for free.

## Complexity

O(n · modes) time, O(modes) space.
