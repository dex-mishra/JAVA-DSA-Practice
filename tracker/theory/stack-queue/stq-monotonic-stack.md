# Monotonic stack — next greater and previous smaller

> Keep a stack whose values are always decreasing (or increasing). When a new element breaks the order, it is the "next greater" for every element it pops. O(n) total.

## Idea

✍️ For each element you want its **next greater element** to the right. Scan left to right with a stack of indices still waiting for an answer.
✍️ The waiting elements are always in decreasing order of value (an element that found a greater one has already been answered and popped).
✍️ When `a[i]` arrives, it is the answer for every waiting element smaller than it: pop them and record `i` as their answer. Then push `i` — it waits too.

## Recognise it

✍️ "next greater / next smaller / previous greater / previous smaller element".
✍️ "how many days until a warmer temperature", "stock span", "nearest taller building", "visible people".
✍️ Areas bounded by the nearest smaller bar on each side → histogram ([[stq-histogram-area]]).
✍️ "remove k digits to make the smallest number" → keep an increasing stack, pop larger digits while k > 0.

## Brute force → monotonic stack

Brute force: for each i, scan right until a larger element appears. O(n²) on a decreasing array.
✍️ Bottleneck: many elements scan over the same stretch of the array.
✍️ Observation: an element only needs to be remembered until something bigger shows up — at that moment it gets its answer and can be forgotten. Keep the still-unanswered elements in a stack; each is pushed once and popped once.
✍️ The unanswered elements are automatically in decreasing order: if a bigger one had come after a smaller one, the smaller one would already have been answered.

## Template: next greater element (indices)

```java
int[] nextGreater(int[] a) {
    int n = a.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> st = new ArrayDeque<>();  // indices, values strictly decreasing
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) {
            ans[st.peek()] = i;             // a[i] is the next greater for st.peek()
            st.pop();
        }
        st.push(i);
    }
    return ans;                             // -1 = no greater element to the right
}
```
✍️ Store **indices**, not values: you usually need distances (`i − top`) or positions.

## The four variants

✍️ Next greater: decreasing stack, pop while `a[top] < a[i]`.
✍️ Next smaller: increasing stack, pop while `a[top] > a[i]`.
✍️ Previous greater/smaller: after popping, the element left on top (if any) is the answer for `i` itself.
✍️ Circular arrays (LeetCode 503): loop i from 0 to 2n−1 and use `i % n`.

## Complexity

✍️ O(n) time: every index is pushed once and popped at most once, so the inner while runs at most n times **in total** ([[cx-amortised-analysis]]). O(n) space.

## Pitfalls

✍️ `<` vs `<=` decides how duplicates are handled. For "strictly greater", pop on `<`. For histogram areas, one side uses strict and the other non-strict to avoid double counting.
✍️ Elements left in the stack at the end have **no** answer — initialise the result array with the "none" value (−1 or 0).
