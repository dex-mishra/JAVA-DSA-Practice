# Intervals I — sort by start and merge

> Sort intervals by start; each next interval either overlaps the last merged one (extend its end) or starts a new block.

## Idea

✍️ After sorting by start, any interval that overlaps the current block must start before (or at) the block's end. So one pass with a "current block" is enough.
✍️ Overlap test for sorted intervals: `next.start <= cur.end` → merge: `cur.end = max(cur.end, next.end)`.

## Template

```java
int[][] merge(int[][] iv) {
    Arrays.sort(iv, new Comparator<int[]>() {       // sort by [0] then [1]
        public int compare(int[] a, int[] b) { return a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]; }
    });
    List<int[]> out = new ArrayList<>();
    for (int[] x : iv) {
        if (out.isEmpty() || x[0] > out.get(out.size() - 1)[1]) out.add(x);   // gap → new block
        else out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], x[1]); // overlap → extend
    }
    return out.toArray(new int[0][]);
}
```
✍️ `max` matters: an interval can be fully inside the block ([1, 10] then [2, 3]).

## Variations

- Insert interval (LeetCode 57): input already sorted; copy intervals ending before the new one, merge all that overlap it, copy the rest. O(n).
- Meeting rooms (can attend all?): sort, check `a[i].start < a[i−1].end`.
- Minimum meeting rooms: sort starts and ends separately and sweep, or a min-heap of end times.
- Interval intersection (two sorted lists): two pointers, advance the one that ends first.

## Pitfalls

✍️ Touching intervals ([1, 2] and [2, 3]): LeetCode 56 merges them (`>` for the gap test). Read the statement — some problems treat touching as non-overlapping.

## Complexity

O(n log n) for the sort + O(n) pass. O(n) output.
