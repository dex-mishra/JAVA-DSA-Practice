# Fixed-size sliding window

> For every window of exactly k consecutive elements, update the window's summary in O(1) by adding the element that enters and removing the one that leaves.

## Idea

✍️ Consecutive windows of size k overlap in k−1 elements. Moving the window one step right **adds** `a[i]` and **removes** `a[i−k]`.
✍️ Keep a summary of the current window (sum, count of vowels, character counts). Update it with one add and one remove per step → O(1) per window, O(n) total.

## Recognise it

✍️ "subarray / substring **of length k**", "every window of size k", "k consecutive", "average of k elements", "permutation of p inside s" (window size = |p|).

## Brute force → fixed window

Brute force: for each start, recompute the summary over k elements. O(n·k).
✍️ Bottleneck: recomputing k elements when only 2 changed (one in, one out).
✍️ Fix: maintain the summary incrementally.

## Template

```java
// max sum of any window of size k
long win = 0, best = Long.MIN_VALUE;
for (int i = 0; i < n; i++) {
    win += a[i];                      // a[i] enters
    if (i >= k) win -= a[i - k];      // a[i-k] leaves
    if (i >= k - 1) best = Math.max(best, win);   // window [i-k+1, i] is complete
}
```
✍️ Three lines in a fixed order: **add the new element, remove the old one, record the answer once the window is full**.

## Variations

- Count vowels in each window (LeetCode 1456): summary = vowel count.
- k-radius averages (LeetCode 2090): window size 2k+1, output centred at i−k.
- Anagram positions (LeetCode 438): summary = 26 counts, compare with the pattern's counts ([[str-anagram-window]]).
- Max of each window: the summary (max) cannot be "un-added" → monotonic deque ([[stq-monotonic-deque]]).

## Pitfalls

✍️ Recording before the window is full (`i < k−1`) gives answers for partial windows.
✍️ Not every summary can be updated by "remove": sums and counts can, max/min cannot (use a deque or multiset).
✍️ Average: compare sums, divide only at the end, to avoid floating point issues.

## Complexity

O(n) time, O(1) space for sums/counts (O(alphabet) for character counts).
