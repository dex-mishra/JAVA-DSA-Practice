# Maximum Subarray

**LeetCode:** [53. Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) (Medium)  
**Day:** 4  
**Pattern:** kadane  
**Role:** LEARN

## Understand

✍️ f(array, possibly negative) → the largest sum of a non-empty contiguous subarray.
- n ≤ 10⁵ → O(n) or O(n log n).
- [−2,1,−3,4,−1,2,1,−5,4] → 6 ([4,−1,2,1]).

## Analyse

✍️ By hand: I keep adding while the total helps. When the running total becomes negative it can only drag down anything after it, so I start fresh.
✍️ Hard part: the all-negative case — the answer is the single largest element, not 0.
✍️ Edges: n = 1; all negative; zeros.

## Brainstorm: brute → optimal

✍️ **1. Brute.** All (i, j), sum each. O(n³), or O(n²) with running sums.
✍️ ↳ Bottleneck: for each end j, trying every start i.
✍️ ↳ Observation: the best subarray ending at j is either [a[j]] alone or (best subarray ending at j−1) + a[j]. So "best ending at j" comes from "best ending at j−1" in O(1).
✍️ **2. Optimal (Kadane).** cur = max(a[j], cur + a[j]); best = max(best, cur). O(n), O(1).
✍️ (Prefix-sum view: answer = max over j of pre[j+1] − min prefix before it — the same as tomorrow's stock problem.)

## Algorithm in words

✍️ 1. Set cur and best to the first element.
✍️ 2. For each next element: cur becomes the larger of (the element alone) and (cur plus the element).
✍️ 3. Update best with cur.
✍️ 4. Return best.

## Pseudocode

```
STATE   cur = a[0]; best = a[0]
LOOP    for i in 1..n-1
UPDATE    cur  = max(a[i], cur + a[i])     extend or restart
          best = max(best, cur)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int maxSubArray(int[] a) {
        int cur = a[0], best = a[0];
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

## Dry run

| a[i] | cur | best |
|---|---|---|
| −2 | −2 | −2 |
| 1 | 1 (restart) | 1 |
| −3 | −2 | 1 |
| 4 | 4 (restart) | 4 |
| −1 | 3 | 4 |
| 2 | 5 | 5 |
| 1 | 6 | 6 |
| −5 | 1 | 6 |
| 4 | 5 | 6 |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ All negative [−3, −1, −2] → −1. `best = 0` initialisation would wrongly return 0.

## Carry forward

✍️ "Best contiguous segment" → state = best ending exactly here; extend or restart.
✍️ This is the first DP of the plan: dp[i] depends only on dp[i−1].
✍️ Initialise optimisation answers with the first real candidate, not with 0.

## Interview follow-ups

- *Return the subarray.* Track the start index at each restart and the best (start, end).
- *Divide and conquer version* (LeetCode's follow-up): best of left half, right half, and crossing the middle → O(n log n).
- *Circular array.* max(Kadane, total − min subarray), unless all negative ([[kad-kadane#variations]]).
- *Maximum product.* Track max and min ([[kad-max-product-variant]]).

## Siblings

- [Maximum Product Subarray](siblings/maximum-product-subarray/) (must)
- [Maximum Sum Circular Subarray](siblings/maximum-sum-circular-subarray/) (optional)
- [Maximum Absolute Sum of Any Subarray](siblings/maximum-absolute-sum-of-any-subarray/) (optional)
