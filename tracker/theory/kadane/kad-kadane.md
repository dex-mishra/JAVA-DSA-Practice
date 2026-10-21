# Kadane's algorithm — maximum subarray sum

> At each index decide: extend the best subarray ending at the previous index, or start fresh here. cur = max(x, cur + x); best = max(best, cur).

## Idea

✍️ Let `cur` = the best sum of a subarray that **ends exactly at** the current index.
✍️ A subarray ending at i either is just `a[i]`, or is a subarray ending at i−1 extended by `a[i]`. So `cur = max(a[i], cur + a[i])`.
✍️ Equivalently: if the running sum has become negative, it can only hurt anything that follows — drop it and start fresh.
✍️ The answer is the best `cur` seen at any index.

## Recognise it

✍️ "maximum (or minimum) sum of a contiguous subarray", "largest sum", "best segment", "circular" variants.
✍️ Values can be negative (if they cannot, the whole array is the answer).

## Brute force → Kadane

Brute force: every (i, j), sum each. O(n³), or O(n²) with running sums.
✍️ Bottleneck: for each end j, trying every start i.
✍️ Observation: for a fixed end j, the best start is the one that makes the part before j as large as possible — and that is exactly the best subarray ending at j−1 (or nothing, if that is negative).
✍️ So the answer for end j is derived from the answer for end j−1 in O(1). This is a 1D DP with state "best ending here" ([[dp-1d-linear]]).

## Template

```java
int maxSubArray(int[] a) {
    int cur = a[0], best = a[0];          // start from a[0], not 0: all-negative arrays
    for (int i = 1; i < a.length; i++) {
        cur = Math.max(a[i], cur + a[i]); // extend or restart
        best = Math.max(best, cur);
    }
    return best;
}
```

## Why it is correct (one paragraph)

✍️ The optimal subarray ends at some index j. When the loop reaches j, `cur` is the best sum of any subarray ending at j (by induction on the recurrence), so `cur` ≥ the optimal sum, and `best` records it.
- The induction: assume `cur` was the best ending at j−1. Any subarray ending at j is either `[a[j]]` or (subarray ending at j−1) + a[j], and the best of the second kind is (best ending at j−1) + a[j]. The max of the two is the best ending at j.

## Variations

- Return the subarray, not just the sum: remember the start index whenever you restart.
- Minimum subarray sum: same with `min`.
- Maximum absolute sum (LeetCode 1749): max of (max subarray sum, −min subarray sum).
- Circular (LeetCode 918): answer = max(normal Kadane, total − minimum subarray); if all negative, use normal Kadane only.
- Maximum product: track both max and min ending here, because a negative flips them ([[kad-max-product-variant]]).
- Best time to buy and sell stock is Kadane on the array of daily differences — or, more directly, [[kad-min-so-far]].

## Pitfalls

✍️ Initialising `best = 0` returns 0 for an all-negative array; the correct answer is the largest (least negative) element. Initialise with `a[0]`.
✍️ Updating `best` before `cur` uses yesterday's value. Update `cur`, then `best`.

## Complexity

O(n) time, O(1) space.
