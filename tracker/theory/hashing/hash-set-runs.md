# Hash set membership and the start-of-run trick

> Put all values in a set so membership is O(1), then only start counting a run from values whose predecessor is missing — finding the longest consecutive run in O(n).

## Idea

✍️ A run of consecutive integers `v, v+1, v+2, …` has exactly one **start**: the value `v` such that `v − 1` is not present.
✍️ Put every value in a `HashSet`. For each value that is a start, walk upward (`v+1`, `v+2`, …) while present and measure the length.
✍️ Each value is visited by at most one upward walk (the walk of its own run's start), so the total work is O(n) even though there is a loop inside a loop.

## Recognise it

✍️ "longest consecutive", "sequence of consecutive integers", "in O(n)" with unsorted input — sorting would give O(n log n), so the O(n) requirement is the hint to use a set.

## Brute force → start-of-run

Brute force: for every value, walk upward checking membership with a linear scan. O(n) per check → O(n³) worst, or O(n²) with a set.
Better: sort, then scan counting runs (skip duplicates). O(n log n).
✍️ Bottleneck of the set version without the trick: a run of length L is re-walked from each of its L elements → O(n²) on input like 1..n.
✍️ Fix: only walk from starts. A value with a predecessor is never a start, so it is never the beginning of a walk.
>> detour cx-amortised-analysis#counting-trick | Why a loop inside a loop can still be O(n) | 3 min

## Template

```java
int longestConsecutive(int[] a) {
    Set<Integer> s = new HashSet<>();
    for (int x : a) s.add(x);
    int best = 0;
    for (int v : s) {                       // iterate the SET, not the array (duplicates!)
        if (s.contains(v - 1)) continue;    // not a start
        int len = 1;
        while (s.contains(v + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}
```

## Pitfalls

✍️ Iterate over the **set**, not the original array. With many duplicates of a start value, iterating the array would re-walk the same run once per duplicate → O(n²).
✍️ Empty input → 0. Handled naturally if `best` starts at 0.
- `v + len` could overflow at INT_MAX; LeetCode's range (±10⁹) keeps it safe.

## Complexity

O(n) average time: n inserts, and each value is touched once by the "is it a start" check and at most once by a walk. O(n) space.
