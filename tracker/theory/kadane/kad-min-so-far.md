# Best partner to the left — min so far

> For pair problems "j > i, maximise a[j] − a[i]", the best i for each j is simply the smallest value seen before j. Keep one running minimum.

## Idea

✍️ Maximise `a[j] − a[i]` with `i < j`. For a fixed sell day j, the best buy day is the one with the **smallest price before j**.
✍️ So walk left to right keeping `minSoFar`. At each j: profit = `a[j] − minSoFar`; update the best; then update `minSoFar`.

## Recognise it

✍️ "buy then sell", "maximum difference where the larger comes after the smaller", "best pair i < j" whose score splits into `f(j) − g(i)` or `f(j) + g(i)`.

## Brute force → min so far

Brute force: all pairs i < j. O(n²).
✍️ Bottleneck: for each j, scanning all earlier i for the smallest value.
✍️ Waste: the smallest of `a[0..j−1]` differs from the smallest of `a[0..j−2]` by at most one element → keep it as running state ([[arr-single-pass-running-state]]).

## Template

```java
int maxProfit(int[] p) {
    int minSoFar = p[0], best = 0;
    for (int j = 1; j < p.length; j++) {
        best = Math.max(best, p[j] - minSoFar);   // sell today, bought at the cheapest earlier day
        minSoFar = Math.min(minSoFar, p[j]);      // today becomes a buy option for later days
    }
    return best;
}
```

## Variations

- Best sightseeing pair (LeetCode 1014): score `a[i] + i + a[j] − j` → keep the best `a[i] + i` so far.
- Maximum difference between increasing elements (LeetCode 2016): same, return −1 if no positive difference.
- Unlimited transactions (LeetCode 122): add every positive day-to-day difference.
- With cooldown / fee / at most k transactions → state machine DP ([[dp-state-machine]]).

## Pitfalls

✍️ Order: compute profit with the minimum of **earlier** days, then fold today into the minimum. Doing it the other way still works for profit (selling the same day gives 0) but breaks variants where i must be strictly before j with a positive gap.
✍️ Answer 0 if prices only fall (you may choose not to trade). Initialise `best = 0`.

## Complexity

O(n) time, O(1) space.
