# Maximum Absolute Sum of Any Subarray

**LeetCode:** [1749. Maximum Absolute Sum of Any Subarray](https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/) (Medium)  
**Tier:** optional  
**How it maps from Maximum Subarray:** Run Kadane for the max and for the min; the answer is the bigger magnitude.

## Analyse

✍️ Maximum of |sum| over all subarrays (empty allowed → at least 0).

## Brainstorm

✍️ |sum| is largest either at the max subarray sum or at the min subarray sum → two Kadanes in one pass.

## Algorithm in words

✍️ Track max-ending-here (floored at 0) and min-ending-here (capped at 0); answer = max(best max, −best min).

## Pseudocode

```
hi = lo = 0; ans = 0
for x: hi = max(0, hi + x); lo = min(0, lo + x); ans = max(ans, hi, -lo)
```

## Reference Java

```java
class Solution {
    public int maxAbsoluteSum(int[] a) {
        int hi = 0, lo = 0, ans = 0;
        for (int x : a) {
            hi = Math.max(0, hi + x);
            lo = Math.min(0, lo + x);
            ans = Math.max(ans, Math.max(hi, -lo));
        }
        return ans;
    }
}
```

## Quick theory

✍️ Allowing an empty subarray lets you floor the running value at 0 (classic Kadane variant).
