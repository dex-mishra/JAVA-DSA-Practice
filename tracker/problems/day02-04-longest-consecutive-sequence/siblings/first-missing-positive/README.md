# First Missing Positive

**LeetCode:** [41. First Missing Positive](https://leetcode.com/problems/first-missing-positive/) (Hard)  
**Tier:** optional  
**How it maps from Longest Consecutive Sequence:** A set solves it in O(n) space; the O(1)-space version places each value v at index v−1 (cyclic placement).

## Analyse

✍️ Smallest positive integer not in the array; O(n) time, O(1) extra space.
✍️ The answer is in 1..n+1, so only values in [1, n] matter.

## Brainstorm

✍️ Set of values, then test 1, 2, 3, … → O(n) time, O(n) space. For O(1): swap each value v ∈ [1, n] into position v−1 until positions are stable; then the first i with a[i] ≠ i+1 gives i+1.

## Algorithm in words

✍️ Cyclic placement, then scan for the first misplaced index.

## Pseudocode

```
for i in 0..n-1:
    while 1 <= a[i] <= n and a[a[i]-1] != a[i]: swap(a[i], a[a[i]-1])
for i: if a[i] != i+1: return i+1
return n+1
```

## Reference Java

```java
class Solution {
    public int firstMissingPositive(int[] a) {
        int n = a.length;
        for (int i = 0; i < n; i++)
            while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i]) {
                int j = a[i] - 1, t = a[j]; a[j] = a[i]; a[i] = t;
            }
        for (int i = 0; i < n; i++) if (a[i] != i + 1) return i + 1;
        return n + 1;
    }
}
```

## Quick theory

✍️ Each swap puts one value in its final place → O(n) total ([[arr-in-place-tricks#cyclic]]).
✍️ The guard `a[a[i]−1] != a[i]` stops infinite swapping on duplicates.
