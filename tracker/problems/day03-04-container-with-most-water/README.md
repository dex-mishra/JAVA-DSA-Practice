# Container With Most Water

**LeetCode:** [11. Container With Most Water](https://leetcode.com/problems/container-with-most-water/) (Medium)  
**Day:** 3  
**Pattern:** opposite-ends-greedy-shrink  
**Role:** DISGUISE

## Understand

✍️ f(heights h) → max over i < j of min(h[i], h[j]) × (j − i).
- n ≤ 10⁵ → O(n²) is too slow.
- [1,8,6,2,5,4,8,3,7] → 49 (walls at index 1 and 8: min(8,7) × 7).

## Analyse

✍️ This is a DISGUISE: it is not sorted, there is no target — yet it is opposite-end two pointers.
✍️ By hand: start with the widest container (both ends). To find something better I must lose width, so I need more height. The shorter wall caps the height — keeping it can never help.
✍️ Hard part: convincing yourself that discarding the shorter wall loses nothing.
✍️ Edges: n = 2; equal heights; heights of 0.

## Brainstorm: brute → optimal

✍️ **1. Brute.** All pairs. O(n²) → too slow at 10⁵.
✍️ ↳ Bottleneck: checking pairs that obviously cannot win.
✍️ ↳ Unlock: which pairs can be discarded safely? With l and r at the ends and h[l] < h[r], every pair (l, j) with j < r has smaller width and height ≤ h[l]. So l's best is already computed → discard l.
✍️ **2. Optimal.** l = 0, r = n−1. Record area, move the pointer at the **shorter** wall. O(n), O(1).

## Algorithm in words

✍️ 1. Pointers at both ends, best = 0.
✍️ 2. Compute the area of the current pair and update best.
✍️ 3. Move the pointer with the smaller height inward (either one if equal).
✍️ 4. Stop when they meet.

## Pseudocode

```
STATE   l = 0; r = n-1; best = 0
LOOP    while l < r
UPDATE    best = max(best, min(h[l], h[r]) * (r - l))
          if h[l] < h[r]: l++  else: r--
RETURN  best
```

## Reference Java

```java
class Solution {
    public int maxArea(int[] h) {
        int l = 0, r = h.length - 1, best = 0;
        while (l < r) {
            best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
            if (h[l] < h[r]) l++;
            else r--;
        }
        return best;
    }
}
```

## Dry run

h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
| l | r | area | best | move |
|---|---|---|---|---|
| 0 | 8 | 1×8 = 8 | 8 | l (1 < 7) |
| 1 | 8 | 7×7 = 49 | 49 | r (8 > 7) |
| 1 | 7 | 3×6 = 18 | 49 | r |
| 1 | 6 | 8×5 = 40 | 49 | r (equal → either) |
| … | | | 49 | … |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
- Max area ≤ 10⁴ × 10⁵ = 10⁹ fits in int.
- Equal heights: moving either is safe — both have already achieved their best.

## Carry forward

✍️ Two pointers work whenever you can prove one side is "done" after each comparison — sortedness is only one way to get that proof.
✍️ Learn the proof sentence; it is the interview answer ([[tp-why-discarding-is-safe#how-to-say]]).

## Interview follow-ups

- *Why not move the taller wall?* Width drops and height stays capped by the shorter wall.
- *Trapping Rain Water* (LeetCode 42) looks similar but sums water over every bar: two pointers with leftMax/rightMax, or prefix/suffix maxima ([[ps-prefix-suffix-passes]]).

## Siblings

- [Boats to Save People](siblings/boats-to-save-people/) (must)
- [Trapping Rain Water](siblings/trapping-rain-water/) (optional)
- [Max Number of K-Sum Pairs](siblings/max-number-of-k-sum-pairs/) (optional)
