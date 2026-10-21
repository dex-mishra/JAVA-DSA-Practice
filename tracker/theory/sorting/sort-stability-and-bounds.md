# Stability and the n log n lower bound

> What stability means and when it matters, and why comparison sorts cannot beat O(n log n) — but counting sort can.

## Stability

✍️ A sort is **stable** if equal elements keep their original relative order.
✍️ Matters when sorting records by one key after another: sort by name, then stable-sort by department → within each department names stay alphabetical.
✍️ Stable: merge sort, insertion sort, counting sort, Java's `Collections.sort`/`Arrays.sort` on objects (a stable merge sort). Not stable: quick sort, heap sort, `Arrays.sort` on primitives (dual-pivot quicksort).

## The comparison lower bound

✍️ Any sort that only compares elements needs Ω(n log n) comparisons in the worst case (there are n! possible orders and each comparison at best halves the possibilities: log₂(n!) ≈ n log n).
- Non-comparison sorts (counting, radix, bucket) beat it by using the values themselves as indices, when the value range is small.
