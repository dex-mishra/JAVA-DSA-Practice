# Maximum Product Subarray

**LeetCode:** [152. Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) (Medium)  
**Tier:** must  
**How it maps from Maximum Subarray:** Kadane with products — but a negative turns the minimum into the maximum, so track both.

## Analyse

✍️ Largest product of a contiguous subarray; values in [−10, 10] including 0.
✍️ Why plain Kadane fails: [−2, 3, −4] → the best is the whole array (24), built from a very negative product times −4.

## Brainstorm

✍️ Keep hi and lo = max and min product ending here. For x < 0 swap them first; then hi = max(x, hi·x), lo = min(x, lo·x). O(n).

## Algorithm in words

✍️ For each x: if negative, swap hi/lo; update both from the old values; best = max(best, hi).

## Pseudocode

```
hi = lo = best = a[0]
for x in a[1..]:
    if x < 0: swap(hi, lo)
    hi = max(x, hi*x); lo = min(x, lo*x); best = max(best, hi)
```

## Reference Java

```java
class Solution {
    public int maxProduct(int[] a) {
        int hi = a[0], lo = a[0], best = a[0];
        for (int i = 1; i < a.length; i++) {
            int x = a[i];
            if (x < 0) { int t = hi; hi = lo; lo = t; }
            hi = Math.max(x, hi * x);
            lo = Math.min(x, lo * x);
            best = Math.max(best, hi);
        }
        return best;
    }
}
```

## Quick theory

✍️ When an operation can flip order (negatives, multiplication), keep both extremes ([[kad-max-product-variant#idea]]).
