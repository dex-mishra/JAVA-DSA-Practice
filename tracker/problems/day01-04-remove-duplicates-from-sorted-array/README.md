# Remove Duplicates from Sorted Array

**LeetCode:** [26. Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) (Easy)  
**Day:** 1  
**Pattern:** read-write-pointer  
**Role:** APPLY

## Understand

✍️ f(sorted array, in place) → k = number of distinct values; the first k slots must hold them in order.
- n ≤ 3·10⁴, sorted non-decreasing.
- Example: [0,0,1,1,1,2,2,3,3,4] → k = 5, front = [0,1,2,3,4].

## Analyse

✍️ By hand: because it is sorted, a value is "new" exactly when it differs from the last value I kept.
✍️ Hard part: deciding what to compare against — the previous element in the input, or the last kept element. (For this problem both work; for the "keep two" version only the kept one does.)
✍️ Edges: one element → k = 1; all equal → k = 1.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Use a set to collect distinct values, write them back sorted. O(n log n) or O(n) time, O(n) space.
✍️ ↳ Bottleneck: the set exists only to answer "have I seen this?", but sortedness already answers that in O(1).
✍️ **2. Optimal.** Read/write pointer; keep a[read] if it differs from a[write−1]. O(n), O(1).

## Algorithm in words

✍️ 1. The first element is always kept: write = 1.
✍️ 2. For each later element, if it differs from the last kept element a[write−1], copy it to a[write] and advance.
✍️ 3. Return write.

## Pseudocode

```
STATE   write = 1                         (n ≥ 1 is guaranteed)
LOOP    for read in 1..n-1
CHECK     if a[read] != a[write-1]
UPDATE      a[write] = a[read]; write++
RETURN  write
```

## Reference Java

```java
class Solution {
    public int removeDuplicates(int[] a) {
        if (a.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < a.length; read++)
            if (a[read] != a[write - 1]) a[write++] = a[read];
        return write;
    }
}
```

## Dry run

| read | a[read] | a[write−1] | keep? | front | write |
|---|---|---|---|---|---|
| start | | | | [1] | 1 |
| 1 | 1 | 1 | no | [1] | 1 |
| 2 | 2 | 1 | yes | [1,2] | 2 |
| 3 | 2 | 2 | no | [1,2] | 2 |
| 4 | 3 | 2 | yes | [1,2,3] | 3 |
(input [1,1,2,2,3])

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ Return the **count** `write`, not `write − 1`.
- Empty input is excluded by constraints, but the guard costs nothing.

## Carry forward

✍️ Sorted input + "seen before?" → compare with the neighbour / last kept, no set needed.
✍️ Compare against the **written** prefix (`a[write−k]`) to allow at most k copies.

## Interview follow-ups

- *Allow each value at most twice* (LeetCode 80): keep if `write < 2 || a[read] != a[write−2]`.
- *Unsorted input?* Then you need a hash set (O(n) space) or sorting first.
- *Return the count of duplicates removed.* n − k.

## Siblings

- [Remove Duplicates from Sorted Array II](siblings/remove-duplicates-from-sorted-array-ii/) (must)
- [Merge Sorted Array](siblings/merge-sorted-array/) (optional)
- [Duplicate Zeros](siblings/duplicate-zeros/) (optional)
