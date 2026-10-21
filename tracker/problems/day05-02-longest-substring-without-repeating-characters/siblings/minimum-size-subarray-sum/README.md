# Minimum Size Subarray Sum

**LeetCode:** [209. Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) (Medium)  
**Tier:** optional  
**How it maps from Longest Substring Without Repeating Characters:** Shortest window with sum ≥ target; positive values make the sum monotone.

## Analyse

✍️ Minimal length of a subarray with sum ≥ target (all values positive); 0 if none.

## Brainstorm

✍️ Positive values → growing the window increases the sum, shrinking decreases it → monotone → shortest-valid window. O(n).

## Algorithm in words

✍️ Add a[r]; while sum ≥ target: record length, remove a[l], l++.

## Pseudocode

```
for r: sum += a[r]
    while sum >= target: best = min(best, r-l+1); sum -= a[l++]
return best == INF ? 0 : best
```

## Reference Java

```java
class Solution {
    public int minSubArrayLen(int target, int[] a) {
        int l = 0, best = Integer.MAX_VALUE;
        long sum = 0;
        for (int r = 0; r < a.length; r++) {
            sum += a[r];
            while (sum >= target) {
                best = Math.min(best, r - l + 1);
                sum -= a[l++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }
}
```

## Quick theory

✍️ This only works because values are positive ([[sw-monotonicity-requirement#rule]]).
