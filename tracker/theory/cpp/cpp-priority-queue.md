# PriorityQueue — Java's heap

> Min-heap by default, how to make a max-heap, heaps of int[] pairs, and custom comparators.

## API

✍️ `PriorityQueue<Integer> pq = new PriorityQueue<>();` is a **min-heap**: `pq.peek()` is the smallest. (This is the opposite of C++'s `priority_queue`, which is a max-heap by default.)
✍️ Max-heap: `PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());`
✍️ `offer`/`add` O(log n), `poll` O(log n), `peek` O(1), `size`/`isEmpty` O(1).

```java
// min-heap of (dist, node) using int[] pairs, ordered by dist
PriorityQueue<int[]> pq = new PriorityQueue<>((x, y) -> x[0] - y[0]);
pq.offer(new int[]{0, src});
while (!pq.isEmpty()) {
    int[] top = pq.poll();
    int d = top[0], u = top[1];
    // ...
}
```

## Custom comparator

✍️ A `PriorityQueue` comparator is a normal ascending `Comparator`: `(a, b) -> a - b` orders smallest-first (a min-heap). This is the **same** direction as sorting, unlike C++ where the heap comparator is reversed.
✍️ Flip to a max-heap with `Comparator.reverseOrder()` or `(a, b) -> b - a`. Prefer `Integer.compare(a, b)` over `a - b` when values can be large (subtraction can overflow).

```java
// min-heap by the second field of an int[] pair
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
```

## Tricks

✍️ Negate values to flip ordering: push `-x` into a min-heap and read `-pq.peek()` to simulate a max-heap.
- There is no decrease-key. Dijkstra pushes a new entry and skips stale ones when polled ([[graph-dijkstra#lazy-deletion]]).
- Building from a collection: `new PriorityQueue<>(list)` heapifies in O(n), faster than n offers.
