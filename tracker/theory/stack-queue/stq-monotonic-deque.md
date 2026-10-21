# Monotonic deque — maximum of every window

> Keep window indices in a deque with decreasing values; the front is the window maximum. Pop the back when a bigger element arrives, pop the front when it leaves the window.

## Idea

✍️ A window's maximum cannot be "un-added" like a sum. But an element that is smaller than a **newer** element can never be the maximum again (the newer one is bigger and stays in the window longer). Discard it.
✍️ So the deque holds indices with **decreasing** values: the front is the current maximum; the back is where new elements enter.

## Template

```java
int[] maxSlidingWindow(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();         // indices, a[] decreasing front→back
    int[] out = new int[a.length - k + 1]; int oi = 0;
    for (int i = 0; i < a.length; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();     // left the window
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();  // dominated by a[i]
        dq.offerLast(i);
        if (i >= k - 1) out[oi++] = a[dq.peekFirst()];
    }
    return out;
}
```
✍️ Two different pops: the **front** for "out of the window" (age), the **back** for "dominated" (value).

## Complexity

✍️ O(n) time — each index enters and leaves the deque once. O(k) space.

## Where else

- Shortest subarray with sum ≥ K with negatives (LeetCode 862): monotonic deque over prefix sums.
- Jump Game VI / constrained subsequence sum: DP where each state takes the max over the last k states → deque makes it O(n).
