# Maximum Sum Circular Subarray

**LeetCode:** [918. Maximum Sum Circular Subarray](https://leetcode.com/problems/maximum-sum-circular-subarray/) (Medium)  
**Tier:** optional  
**How it maps from Maximum Subarray:** A wrapping subarray = total minus a middle subarray → max(Kadane max, total − Kadane min).

## Analyse

✍️ Max subarray sum when the array is circular (a subarray may wrap from the end to the start).

## Brainstorm

✍️ Either the best subarray does not wrap (normal Kadane) or it wraps, in which case the excluded part is a contiguous middle block with minimum sum. If every value is negative, the wrap case would be empty → use normal Kadane.

## Algorithm in words

✍️ Run max-Kadane and min-Kadane together with the total; answer as above.

## Pseudocode

```
compute maxSub, minSub, total
if maxSub < 0: return maxSub
return max(maxSub, total - minSub)
```

## Reference Java

```java
class Solution {
    public int maxSubarraySumCircular(int[] a) {
        int total = 0, curMax = 0, curMin = 0, best = a[0], worst = a[0];
        for (int x : a) {
            curMax = Math.max(x, curMax + x); best = Math.max(best, curMax);
            curMin = Math.min(x, curMin + x); worst = Math.min(worst, curMin);
            total += x;
        }
        if (best < 0) return best;
        return Math.max(best, total - worst);
    }
}
```

## Quick theory

✍️ Complement trick: "maximum wrapping part" = "total − minimum non-wrapping part".
