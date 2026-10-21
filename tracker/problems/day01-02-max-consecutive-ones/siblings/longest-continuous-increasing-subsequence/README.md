# Longest Continuous Increasing Subsequence

**LeetCode:** [674. Longest Continuous Increasing Subsequence](https://leetcode.com/problems/longest-continuous-increasing-subsequence/) (Easy)  
**Tier:** optional  
**How it maps from Max Consecutive Ones:** Streak condition becomes "a[i] > a[i−1]".

## Analyse

✍️ Longest strictly increasing **contiguous** run.

## Brainstorm

✍️ Same streak; extend when a[i] > a[i−1], else reset to 1. (Non-contiguous version is LIS, Day 28.)

## Algorithm in words

✍️ cur = best = 1; extend or reset; track best.

## Pseudocode

```
cur = best = 1
for i in 1..n-1: cur = a[i] > a[i-1] ? cur+1 : 1; best = max(best, cur)
```

## Reference Java

```java
class Solution {
    public int findLengthOfLCIS(int[] a) {
        int cur = 1, best = 1;
        for (int i = 1; i < a.length; i++) {
            cur = (a[i] > a[i - 1]) ? cur + 1 : 1;
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

## Quick theory

✍️ "Continuous" = contiguous = streak. "Subsequence" without "continuous" = DP ([[dp-lis]]).
