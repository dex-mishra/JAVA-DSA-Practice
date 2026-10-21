# Max Consecutive Ones III

**LeetCode:** [1004. Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) (Medium)  
**Day:** 5  
**Pattern:** variable-window-budget  
**Role:** DISGUISE

## Understand

✍️ f(binary array, k) → the maximum number of consecutive 1s if you may flip at most k zeros.
- n ≤ 10⁵.
- [1,1,1,0,0,0,1,1,1,1,0], k = 2 → 6.

## Analyse

✍️ DISGUISE: it reads like a flipping puzzle. Reframe: "longest subarray containing at most k zeros" — flipping those zeros makes it all ones.
✍️ By hand: grow the window counting zeros; when a third zero enters (k = 2), drop elements from the left until a zero leaves.
✍️ Edges: k = 0 (Day 1's problem); k ≥ number of zeros (answer n); all zeros.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Every subarray, count zeros. O(n²).
✍️ ↳ Bottleneck: retrying every start for each end.
✍️ ↳ Rule "zeros ≤ k" is monotone → variable window.
✍️ **2. Optimal.** Expand r counting zeros; while zeros > k, if a[l] is 0 decrement zeros, l++. Record. O(n), O(1).

## Algorithm in words

✍️ 1. Window [l, r], zero count 0.
✍️ 2. For each r, if a[r] is 0 increase the zero count.
✍️ 3. While the zero count exceeds k, remove a[l] (decrease the count if it was 0) and move l right.
✍️ 4. Record the window length.

## Pseudocode

```
STATE   l = 0; zeros = 0; best = 0
LOOP    for r in 0..n-1
UPDATE    if a[r] == 0: zeros++
          while zeros > k:
              if a[l] == 0: zeros--
              l++
CHECK     best = max(best, r - l + 1)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int longestOnes(int[] a, int k) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            if (a[r] == 0) zeros++;
            while (zeros > k) {
                if (a[l] == 0) zeros--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Dry run

a = [1,0,0,1,1,0,1], k = 1:
| r | a[r] | zeros | shrink | window | best |
|---|---|---|---|---|---|
| 0 | 1 | 0 | | [0,0] | 1 |
| 1 | 0 | 1 | | [0,1] | 2 |
| 2 | 0 | 2 → 1 | drop 1, drop 0 | [2,2] | 2 |
| 3 | 1 | 1 | | [2,3] | 2 |
| 4 | 1 | 1 | | [2,4] | 3 |
| 5 | 0 | 2 → 1 | drop 0 at 2 | [3,5] | 3 |
| 6 | 1 | 1 | | [3,6] | 4 |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ k = 0 reduces to Day 1 (longest run of ones).

## Carry forward

✍️ "You may change at most k elements" → longest window with at most k bad elements.
✍️ A DISGUISE becomes easy once you restate it in pattern words — practise the restating, not the code.

## Interview follow-ups

- *Must delete exactly one element* (LeetCode 1493): window with ≤ 1 zero, answer = length − 1.
- *Return the positions to flip.* Track the best window; its zeros are the flips.
- *Streaming input with k = 1.* Keep the index of the last zero.

## Siblings

- [Longest Subarray of 1's After Deleting One Element](siblings/longest-subarray-of-1s-after-deleting-one-element/) (must)
- [Longest Nice Subarray](siblings/longest-nice-subarray/) (optional)
- [Subarray Product Less Than K](siblings/subarray-product-less-than-k/) (optional)
