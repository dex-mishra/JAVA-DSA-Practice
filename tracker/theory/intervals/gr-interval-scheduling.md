# Intervals II — sort by end, keep the earliest finisher

> To keep the maximum number of non-overlapping intervals (or remove the minimum), sort by end time and greedily keep each interval that starts after the last kept end.

## Idea

✍️ Among intervals that could come first, the one that **ends earliest** leaves the most room for the rest. Keep it; discard everything overlapping it; repeat.
✍️ Max kept = greedy count. Minimum removals = n − max kept.

## Template

```java
int eraseOverlapIntervals(int[][] iv) {
    Arrays.sort(iv, new Comparator<int[]>() {         // by END
        public int compare(int[] a, int[] b) { return Integer.compare(a[1], b[1]); }
    });
    int kept = 0; long lastEnd = Long.MIN_VALUE;
    for (int[] x : iv) {
        if (x[0] >= lastEnd) { kept++; lastEnd = x[1]; }   // no overlap with last kept
    }
    return iv.length - kept;
}
```

## Why sort by end, not by start

✍️ Sorting by start fails: [1, 100], [2, 3], [4, 5] — keeping [1, 100] first blocks two intervals.
✍️ Exchange argument: swap the first interval of any optimal set for the earliest-ending interval; it ends no later, so nothing after it conflicts ([[gr-what-greedy-is-and-proofs#exchange]]).

## Variations

- Minimum arrows to burst balloons (LeetCode 452): sort by end, shoot at the end of the first balloon, skip all balloons containing that point (start ≤ arrow).
- Maximum length of pair chain (LeetCode 646): same as max non-overlapping with strict `>`.
