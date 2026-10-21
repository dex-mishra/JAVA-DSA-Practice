# Binary search on the answer

> When the question is "smallest X that works" and "works" is monotone in X, binary search over the value of X and test each guess with an O(n) check.

## Idea

✍️ You are not searching an array; you are searching the **range of possible answers** (speeds, capacities, days, maximum sums).
✍️ Write `feasible(x)`: "can the task be done with answer x?". If feasible is monotone (x works ⇒ x+1 works), the answers look like F F F T T T and the smallest feasible x is a first-true search.
✍️ Cost = log(range) × cost of feasible. With range 10⁹ and an O(n) check: ~30·n.

## Recognise it

✍️ "minimum speed / capacity / time / largest-sum such that it can be done within D / H / m", "minimise the maximum", "maximise the minimum".
✍️ Checking a given answer is easy (usually a greedy pass), but finding it directly is hard.

## Brute force → search the answer

Brute force: try x = 1, 2, 3, … until feasible. O(range × n) — with range 10⁹, far too slow.
✍️ Bottleneck: trying candidate answers one by one in order.
✍️ Observation: feasibility is monotone in x. Checking candidates in order on a monotone predicate is exactly what binary search removes.

## Template

```java
// smallest x in [lo, hi] with feasible(x) true
long lo = LOWEST_POSSIBLE, hi = HIGHEST_POSSIBLE;   // hi must be feasible
while (lo < hi) {
    long mid = lo + (hi - lo) / 2;
    if (feasible(mid)) hi = mid;
    else lo = mid + 1;
}
return lo;
```
✍️ Bounds: `lo` = the smallest value that could possibly work (often 1 or max element); `hi` = a value that **certainly** works (often max element or total sum).

## Writing feasible(x)

✍️ Usually a greedy simulation: "pack items into groups of capacity x, counting groups; feasible if groups ≤ D".
```java
boolean feasible(int[] w, int days, long cap) {
    int used = 1; long cur = 0;
    for (int x : w) {
        if (x > cap) return false;           // one item does not fit at all
        if (cur + x > cap) { used++; cur = 0; }
        cur += x;
    }
    return used <= days;
}
```
✍️ Koko: hours(speed) = Σ ceil(pile / speed) = Σ (pile + speed − 1) / speed. Feasible if hours ≤ h.

## Variations

- Koko eating bananas (LeetCode 875): range [1, max pile].
- Ship packages (LeetCode 1011): range [max weight, total weight].
- Bouquets (LeetCode 1482): search over days; feasible counts runs of ≥ k adjacent bloomed flowers.
- Split array largest sum (LeetCode 410): identical to ship packages with D = k — "minimise the maximum part".
- Magnetic balls / aggressive cows (LeetCode 1552): "maximise the minimum distance" → last-true search.

## Pitfalls

✍️ `hi` must be feasible, otherwise the search returns hi even when nothing works. Choose a value you can prove works.
✍️ Overflow in feasible: sums of capacities or hours can exceed int → `long`.
✍️ Lower bound too small: for shipping, any capacity below the heaviest package is impossible; starting at 1 is correct but the check must return false for x < max (as above).

## Complexity

O(n · log(range)) time, O(1) extra space.

## Interview follow-ups

- "Why is feasibility monotone?" — say it concretely: "a faster speed never needs more hours".
- "What is the search range and why?" — justify both ends.
