# Maximum Average Subarray I

**LeetCode:** [643. Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) (Easy)  
**Day:** 5  
**Pattern:** fixed-window  
**Role:** LEARN

## Understand

✍️ f(array, k) → the maximum average of any contiguous subarray of length exactly k.
- n ≤ 10⁵, k ≤ n, values ±10⁴.
- [1,12,−5,−6,50,3], k = 4 → 12.75 ((12 − 5 − 6 + 50) / 4).

## Analyse

✍️ Max average with fixed length = max sum / k. So find the max window sum.
✍️ By hand: the window [1,12,−5,−6] has sum 2. Sliding right: remove 1, add 50 → 51. I never re-add the middle three.
✍️ Edges: k = n (one window); k = 1 (max element); all negative.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Sum each of the n−k+1 windows from scratch. O(n·k) → up to 10¹⁰ when k ≈ n/2.
✍️ ↳ Bottleneck: consecutive windows share k−1 elements, but each is re-summed.
✍️ **2. Optimal.** Maintain the window sum: + entering, − leaving. O(n), O(1).
✍️ (Prefix sums also work: window sum = pre[i+1] − pre[i−k+1], O(n) time but O(n) space.)

## Algorithm in words

✍️ 1. Walk i from 0 to n−1, adding a[i] to the window sum.
✍️ 2. Once i ≥ k, subtract a[i−k], the element that just left.
✍️ 3. Once i ≥ k−1 (the first full window), update the best sum.
✍️ 4. Return best / k.

## Pseudocode

```
STATE   win = 0; best = -infinity
LOOP    for i in 0..n-1
UPDATE    win += a[i]
          if i >= k: win -= a[i-k]
CHECK     if i >= k-1: best = max(best, win)
RETURN  best / k   (as double)
```

## Reference Java

```java
class Solution {
    public double findMaxAverage(int[] a, int k) {
        long win = 0, best = Long.MIN_VALUE;
        for (int i = 0; i < a.length; i++) {
            win += a[i];
            if (i >= k) win -= a[i - k];
            if (i >= k - 1) best = Math.max(best, win);
        }
        return (double) best / k;
    }
}
```

## Dry run

a = [1, 12, −5, −6, 50, 3], k = 4
| i | add | remove | win | best |
|---|---|---|---|---|
| 0 | 1 | | 1 | – |
| 1 | 12 | | 13 | – |
| 2 | −5 | | 8 | – |
| 3 | −6 | | 2 | 2 |
| 4 | 50 | 1 | 51 | 51 |
| 5 | 3 | 12 | 42 | 51 |
51 / 4 = 12.75.

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ Initialise best to −∞ (or the first window), not 0 — all-negative windows exist.
- Divide once at the end; comparing averages each step adds float error for nothing.

## Carry forward

✍️ "Subarray of length k" → fixed window: one add, one remove, record when full.
✍️ Max average with fixed length = max sum.

## Interview follow-ups

- *Length at least k* (LeetCode 644, Hard): binary search on the average + prefix sums (beyond this plan).
- *Count windows with average ≥ threshold* (LeetCode 1343): same window, compare sum ≥ threshold·k.

## Siblings

- [Maximum Number of Vowels in a Substring of Given Length](siblings/maximum-number-of-vowels-in-a-substring-of-given-length/) (must)
- [K Radius Subarray Averages](siblings/k-radius-subarray-averages/) (optional)
- [Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold](siblings/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/) (optional)
