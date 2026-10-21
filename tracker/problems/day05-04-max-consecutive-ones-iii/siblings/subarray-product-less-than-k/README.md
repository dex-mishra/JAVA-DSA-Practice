# Subarray Product Less Than K

**LeetCode:** [713. Subarray Product Less Than K](https://leetcode.com/problems/subarray-product-less-than-k/) (Medium)  
**Tier:** optional  
**How it maps from Max Consecutive Ones III:** Count windows instead of measuring them: every valid window ending at r contributes r − l + 1 subarrays.

## Analyse

✍️ Count contiguous subarrays with product strictly less than k (positive integers).

## Brainstorm

✍️ Positive values → product is monotone in window size. For each r, after shrinking until product < k, every start in [l, r] works → add r − l + 1. O(n).

## Algorithm in words

✍️ Multiply in a[r]; while product ≥ k divide out a[l]; add the window length to the count.

## Pseudocode

```
if k <= 1: return 0
for r: prod *= a[r]; while prod >= k: prod /= a[l++]
    cnt += r - l + 1
```

## Reference Java

```java
class Solution {
    public int numSubarrayProductLessThanK(int[] a, int k) {
        if (k <= 1) return 0;
        long prod = 1;
        int l = 0, cnt = 0;
        for (int r = 0; r < a.length; r++) {
            prod *= a[r];
            while (prod >= k) prod /= a[l++];
            cnt += r - l + 1;
        }
        return cnt;
    }
}
```

## Quick theory

✍️ Counting subarrays with a monotone rule: add the number of valid starts for each end ([[sw-at-most-k-trick#idea]]).
✍️ The k ≤ 1 guard prevents shrinking past r.
