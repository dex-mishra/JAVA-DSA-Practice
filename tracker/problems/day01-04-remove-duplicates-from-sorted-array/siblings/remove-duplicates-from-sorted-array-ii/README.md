# Remove Duplicates from Sorted Array II

**LeetCode:** [80. Remove Duplicates from Sorted Array II](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/) (Medium)  
**Tier:** must  
**How it maps from Remove Duplicates from Sorted Array:** Same template, but compare with a[write−2] to allow two copies.

## Analyse

✍️ Sorted; keep each value at most twice, in place; return k.
✍️ Trap: comparing with a[read−1] or a[read−2] (the input) fails once you start overwriting. Compare with the **written** array.

## Brainstorm

✍️ Counting runs works but is fiddly. Cleanest: keep a[read] if fewer than 2 elements are written, or if a[read] differs from the element written two places back.

## Algorithm in words

✍️ write = 0; for each element: if write < 2 or it differs from a[write−2], write it.

## Pseudocode

```
write = 0
for read in 0..n-1:
    if write < 2 or a[read] != a[write-2]: a[write] = a[read]; write++
return write
```

## Reference Java

```java
class Solution {
    public int removeDuplicates(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (write < 2 || a[read] != a[write - 2]) a[write++] = a[read];
        return write;
    }
}
```

## Quick theory

✍️ "At most k copies" in a sorted array → keep if `write < k || a[read] != a[write−k]` ([[arr-read-write-pointer#variations]]).
