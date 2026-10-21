# Quick sort, partitioning and quickselect

> Partition around a pivot so smaller elements go left, then recurse on both sides. O(n log n) average, O(n²) worst case with bad pivots; quickselect finds the k-th element in O(n) average.

## Partition (Lomuto)

✍️ Pick a pivot; move every element smaller than it to the front with a write pointer; put the pivot right after them. Now the pivot is at its final sorted position.
```java
int partition(int[] a, int lo, int hi) {
    int p = lo + (int)(Math.random() * (hi - lo + 1));
    int t = a[p]; a[p] = a[hi]; a[hi] = t;         // random pivot moved to the end
    int pivot = a[hi], w = lo;
    for (int r = lo; r < hi; r++)
        if (a[r] < pivot) { int s = a[w]; a[w++] = a[r]; a[r] = s; }
    int s = a[w]; a[w] = a[hi]; a[hi] = s;
    return w;                                      // pivot's final index
}
```

## Why the pivot matters

✍️ Average O(n log n): a random pivot splits the array reasonably on average.
✍️ Worst O(n²): if the pivot is always the smallest or largest (e.g. first element on already-sorted input), each partition only removes one element.
✍️ Fix: random pivot or median-of-three. Java's `Arrays.sort` uses a dual-pivot quicksort (primitives) (quick sort that switches to heap sort if recursion gets too deep), so it is O(n log n) worst case.
- Many equal elements also hurt Lomuto; three-way partitioning ([[sort-dutch-national-flag]]) fixes it.

## Quickselect

✍️ To find the k-th smallest, partition once and recurse **only into the side that contains index k**. Average O(n) (n + n/2 + n/4 + …), worst O(n²).
✍️ `Arrays` has no built-in quickselect, so write partitioning yourself; it does this in the library.

## Merge sort vs quick sort

| | merge sort | quick sort |
|---|---|---|
| time | O(n log n) always | O(n log n) avg, O(n²) worst |
| extra space | O(n) | O(log n) stack |
| stable | yes | no |
| in practice on arrays | slower (copying) | faster (cache-friendly) |
