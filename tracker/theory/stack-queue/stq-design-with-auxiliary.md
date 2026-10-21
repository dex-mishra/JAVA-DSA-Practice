# Designing with an auxiliary stack (Min Stack)

> Store extra information alongside each element — the minimum so far — so queries about the whole stack stay O(1) after any push or pop.

## Idea

✍️ The minimum of a stack only changes when you push or pop. If each element remembers "the minimum of everything at or below me", the top's remembered value is always the current minimum.
✍️ Store pairs `(value, minSoFar)`, or keep a second stack of minimums.

## Template

```java
class MinStack {
    private Deque<int[]> st = new ArrayDeque<>();   // {value, min of stack up to here}
    public void push(int x) { st.push(new int[]{x, st.isEmpty() ? x : Math.min(x, st.peek()[1])}); }
    public void pop() { st.pop(); }
    public int top() { return st.peek()[0]; }
    public int getMin() { return st.peek()[1]; }
}
```

## Why it works

✍️ Popping removes exactly the elements pushed after the current top, and the top's stored minimum was computed from the elements below it — which are all still there. So the stored minimum is still correct.
- Space-saving variant: a second stack that only pushes when the new value is ≤ the current min (≤, not <, to handle duplicate minimums).
