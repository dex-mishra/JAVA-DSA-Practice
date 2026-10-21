# Read pointer and write pointer — in-place compaction

> One index reads every element; a second index marks where the next kept element should be written. Removes, filters and deduplicates in O(n) time and O(1) space.

## Idea

✍️ Two indices move left to right. `read` visits every element. `write` only advances when an element is **kept**.
✍️ Invariant: `a[0..write-1]` always holds exactly the kept elements seen so far, in their original order.
✍️ Because `write ≤ read` always, writing to `a[write]` never overwrites an element we have not read yet.
>> detour cx-space-and-in-place#in-place | What "in-place" allows and forbids | 2 min

## Recognise it

✍️ "in-place", "O(1) extra memory", "remove / move / filter elements", "return the new length k, first k elements must be …".
✍️ Order of kept elements must be preserved.

## Brute force → write pointer

Brute force A: build a new array of kept elements, copy back. O(n) time but O(n) space — fails "in-place".
Brute force B: when you find an element to remove, shift everything after it left by one (`erase`). O(n) per removal → O(n²).
✍️ Bottleneck of B: elements are shifted many times — each removal moves the whole tail again.
✍️ Fix: move each kept element **once**, directly to its final position. Its final position is "how many kept elements came before it" = `write`.

## Template

```java
int write = 0;
for (int read = 0; read < n; read++) {
    if (keep(a[read])) {          // the only problem-specific line
        a[write] = a[read];       // or swap a[write] with a[read] to keep the rest
        write++;
    }
}
// a[0..write-1] are the kept elements; return write
```
✍️ `keep` for Move Zeroes: `a[read] != 0`. For Remove Element: `a[read] != val`. For Remove Duplicates (sorted): `write == 0 || a[read] != a[write-1]`.

## Swap or copy?

✍️ Copy (`a[write] = a[read]`) when you do not care what is left after position `write` (most "return k" problems).
✍️ Swap (`swap(a[write], a[read])`) when the removed elements must still exist at the end — Move Zeroes needs the zeroes at the back.
- Alternative for Move Zeroes: copy all non-zeros forward, then fill `a[write..n-1]` with 0.

## Variations

- Keep at most two copies of each value in a sorted array: keep if `write < 2 || a[read] != a[write-2]` (LeetCode 80).
- Partition evens before odds: keep = "is even", using swap (LeetCode 905).
- Merge two sorted arrays in place from the back: two read pointers, one write pointer starting at the end (LeetCode 88).
- Three-way partition (0s, 1s, 2s) → Dutch national flag ([[sort-dutch-national-flag]]).

## Pitfalls

✍️ Comparing with `a[read-1]` instead of `a[write-1]` for deduplication works only for "keep one copy"; for "keep two", you must compare against the **written** array, `a[write-2]`.
✍️ Return `write`, not `write - 1`: it is the count of kept elements.

## Complexity

O(n) time — each element is read once and written at most once. O(1) extra space.
