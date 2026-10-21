# Stack, queue and deque in Java

> Using ArrayDeque as a stack, a queue and a double-ended queue, their O(1) operations, and why Deque replaces all three.

## API

```java
Deque<Integer> st = new ArrayDeque<>();  // stack (LIFO)
st.push(x); st.peek(); st.pop(); st.isEmpty(); st.size();
Deque<Integer> q = new ArrayDeque<>();   // queue (FIFO)
q.offer(x); q.peek(); q.poll();          // offer at tail, poll from head
Deque<Integer> dq = new ArrayDeque<>();  // double-ended
dq.offerLast(x); dq.offerFirst(x); dq.pollLast(); dq.pollFirst();
dq.peekFirst(); dq.peekLast();
```
✍️ All of these are O(1) (amortised for the resizing array).
✍️ Prefer the null-returning forms on an empty deque: `peek`/`poll` return `null` rather than throwing, while `element`/`remove` throw `NoSuchElementException`. Check `isEmpty()` first when you expect a value.
✍️ Use `ArrayDeque`, not the legacy `java.util.Stack` (synchronised, slower) and not `LinkedList` for a stack.

## Which to use

✍️ LIFO (last in, first out: undo, brackets, DFS) → `Deque` with `push`/`pop`/`peek`.
✍️ FIFO (first in, first out: BFS, processing order) → `Deque` with `offer`/`poll`/`peek`.
✍️ Need both ends (sliding window max, 0-1 BFS) → `Deque` with the `First`/`Last` methods.
- One `ArrayDeque` covers all three roles, so you rarely need anything else; a plain `ArrayList` also works as a stack via `add`/`get(size-1)`/`remove(size-1)` when you also want to iterate it.
