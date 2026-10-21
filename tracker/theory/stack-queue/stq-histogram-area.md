# Largest rectangle in a histogram

> Each bar's best rectangle spans to the nearest smaller bar on each side. A monotonic increasing stack finds both boundaries in one pass.

## Idea

✍️ The largest rectangle has some bar as its **shortest** bar. If bar i is the shortest, the rectangle extends left and right until the first bar shorter than `h[i]`.
✍️ So for each bar: width = (index of next smaller) − (index of previous smaller) − 1, area = `h[i] × width`. Take the max.

## Template: one pass

```java
int largestRectangleArea(int[] h) {
    int n = h.length, best = 0;
    Deque<Integer> st = new ArrayDeque<>();           // indices, heights increasing
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];               // sentinel 0 flushes the stack at the end
        while (!st.isEmpty() && h[st.peek()] >= cur) {
            int height = h[st.pop()];
            int left = st.isEmpty() ? -1 : st.peek(); // previous smaller index
            best = Math.max(best, height * (i - left - 1)); // i is the next smaller index
        }
        st.push(i);
    }
    return best;
}
```
✍️ When a bar is popped, `i` is its next smaller (right boundary) and the new top is its previous smaller (left boundary).

## Pitfalls

✍️ Without the sentinel at `i == n`, bars still in the stack at the end are never processed.
✍️ Width is `i − left − 1`, with `left = −1` when the stack is empty (the bar extends to the very start).

## Where else

Maximal rectangle in a binary matrix (LeetCode 85): treat each row as the base of a histogram of consecutive 1s above it, and run this algorithm per row → O(R·C).
