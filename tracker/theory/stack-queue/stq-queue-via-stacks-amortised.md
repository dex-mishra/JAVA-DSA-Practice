# Queue from two stacks — amortised O(1)

> Push into an input stack; pop from an output stack, refilling it from the input only when it is empty. Every element moves at most once.

## Idea

✍️ Pouring stack A into stack B reverses the order, so B's top is the **oldest** element — exactly the queue's front.
✍️ Only pour when B is empty. If you poured while B still had elements, newer elements would sit above older ones and break FIFO order.

## Template

```java
class MyQueue {
    private Deque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();
    private void move() { if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop()); }
    public void push(int x) { in.push(x); }
    public int pop() { move(); return out.pop(); }
    public int peek() { move(); return out.peek(); }
    public boolean empty() { return in.isEmpty() && out.isEmpty(); }
}
```

## Why it is O(1) amortised

✍️ Each element is pushed to `in` once, moved to `out` once, and popped from `out` once → 3 operations per element over its whole life. A single `pop` can cost O(n), but the total over n operations is O(n) ([[cx-amortised-analysis#counting-trick]]).
