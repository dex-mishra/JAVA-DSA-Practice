# Squares of a Sorted Array

**LeetCode:** [977. Squares of a Sorted Array](https://leetcode.com/problems/squares-of-a-sorted-array/) (Easy)  
**Tier:** must  
**How it maps from Two Sum II - Input Array Is Sorted:** The biggest square is always at one of the two ends — two pointers fill the output from the back.

## Analyse

✍️ Sorted (may contain negatives); return the squares in sorted order in O(n).
✍️ Brute: square and sort → O(n log n).

## Brainstorm

✍️ Bottleneck: sorting, although the squares are "large at both ends, small in the middle". The largest remaining square is at l or r → write it at the end of the output and move that pointer.

## Algorithm in words

✍️ l = 0, r = n−1, write = n−1; compare |a[l]| and |a[r]|; put the larger square at out[write], move that pointer, write--.

## Pseudocode

```
l = 0; r = n-1
for w from n-1 down to 0:
    if |a[l]| > |a[r]|: out[w] = a[l]^2; l++
    else: out[w] = a[r]^2; r--
```

## Reference Java

```java
class Solution {
    public int[] sortedSquares(int[] a) {
        int n = a.length, l = 0, r = n - 1;
        int[] out = new int[n];
        for (int w = n - 1; w >= 0; w--) {
            if (Math.abs(a[l]) > Math.abs(a[r])) { out[w] = a[l] * a[l]; l++; }
            else { out[w] = a[r] * a[r]; r--; }
        }
        return out;
    }
}
```

## Quick theory

✍️ Two ends hold the extremes of a sorted array — the basis of every opposite-end scan ([[tp-opposite-ends#variations]]).
