# Trapping Rain Water

**LeetCode:** [42. Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) (Hard)  
**Tier:** optional  
**How it maps from Container With Most Water:** Water above bar i = min(maxLeft, maxRight) − h[i]; two pointers process the side with the smaller max.

## Analyse

✍️ Total water trapped between bars after rain.
✍️ Brute: for each bar, scan left and right for maxima → O(n²).

## Brainstorm

✍️ Prefix max + suffix max arrays → O(n) time, O(n) space ([[ps-prefix-suffix-passes]]). Two pointers: if leftMax < rightMax, the left bar's water is decided by leftMax (the right side has something at least as tall) → O(1) space.

## Algorithm in words

✍️ Move the pointer whose running max is smaller; add (its max − its height) and update the max.

## Pseudocode

```
l = 0; r = n-1; lm = rm = 0; water = 0
while l < r:
    if h[l] < h[r]: lm = max(lm, h[l]); water += lm - h[l]; l++
    else: rm = max(rm, h[r]); water += rm - h[r]; r--
```

## Reference Java

```java
class Solution {
    public int trap(int[] h) {
        int l = 0, r = h.length - 1, lm = 0, rm = 0, water = 0;
        while (l < r) {
            if (h[l] < h[r]) { lm = Math.max(lm, h[l]); water += lm - h[l]; l++; }
            else { rm = Math.max(rm, h[r]); water += rm - h[r]; r--; }
        }
        return water;
    }
}
```

## Quick theory

✍️ Same "the smaller side is decided" logic as Container With Most Water ([[tp-why-discarding-is-safe#container]]).
