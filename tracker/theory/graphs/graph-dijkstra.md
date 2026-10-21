# Dijkstra's algorithm — shortest paths with non-negative weights

> Repeatedly finalise the closest unfinalised vertex using a min-heap, and relax its edges. O((n + m) log n). Fails with negative edges.

## Idea

✍️ Generalises BFS to weighted edges. Keep `dist[v]` = best known distance. A min-heap gives the vertex with the smallest tentative distance.
✍️ When a vertex is popped with its current best distance, that distance is **final**: any other path to it would go through vertices that are at least as far (weights are non-negative), so it cannot be shorter.
✍️ **Relax** each outgoing edge: if `dist[u] + w < dist[v]`, improve `dist[v]` and push `(dist[v], v)`.

## Template

```java
long[] dijkstra(int src, List<List<int[]>> adj) {   // adj.get(u) = list of {v, w}
    int n = adj.size();
    long[] dist = new long[n];
    Arrays.fill(dist, Long.MAX_VALUE);
    PriorityQueue<long[]> pq = new PriorityQueue<>(new Comparator<long[]>() {
        public int compare(long[] a, long[] b) { return Long.compare(a[0], b[0]); }
    });
    dist[src] = 0; pq.offer(new long[]{0, src});
    while (!pq.isEmpty()) {
        long[] top = pq.poll();
        long d = top[0]; int u = (int) top[1];
        if (d > dist[u]) continue;                    // stale entry: skip
        for (int[] e : adj.get(u)) {
            int v = e[0], w = e[1];
            if (d + w < dist[v]) { dist[v] = d + w; pq.offer(new long[]{dist[v], v}); }
        }
    }
    return dist;
}
```

## Lazy deletion: skipping stale entries

✍️ `PriorityQueue` cannot decrease a key. Instead, push a new entry each time a distance improves. Old entries for the same vertex stay in the heap; when popped, `d > dist[u]` identifies them as stale → skip.
✍️ Forgetting the skip still gives correct distances but can be much slower.

## Variations

- Network delay time (LeetCode 743): answer = max over dist (−1 if any unreachable).
- Path with minimum effort (LeetCode 1631): cost of a path = **maximum** edge on it; relax with `max(d, w)` instead of `d + w`. Dijkstra still works because the cost never decreases along a path.
- Probability paths: maximise a product of probabilities ≤ 1 → max-heap.
- Grid Dijkstra: state = (r, c), push tuples (cost, r, c).

## Pitfalls

✍️ Negative edge weights break the "popped = final" argument → use Bellman–Ford.
✍️ Using a max-heap by accident (forgot `greater<>`).
✍️ `dist + w` overflow if dist is Integer.MAX_VALUE — use Long.MAX_VALUE with long, or check `dist[u] != INF` first.

## Complexity

O((n + m) log n) with a binary heap. O(n + m) space.
