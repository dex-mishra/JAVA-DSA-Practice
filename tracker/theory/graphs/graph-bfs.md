# Breadth-first search — shortest paths in unweighted graphs

> Explore vertices in order of distance from the source using a queue. The first time a vertex is reached is along a shortest path.

## Idea

✍️ BFS visits all vertices at distance 1, then all at distance 2, and so on, because the queue is first-in first-out.
✍️ So when a vertex is first discovered, the path that discovered it is a **shortest** path (fewest edges). Record `dist[v] = dist[u] + 1` at that moment.

## Template

```java
int[] bfs(int src, List<List<Integer>> adj) {
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, -1);                      // -1 = not visited
    Deque<Integer> q = new ArrayDeque<>(); q.offer(src); dist[src] = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj.get(u)) {
            if (dist[v] != -1) continue;
            dist[v] = dist[u] + 1;              // mark when PUSHING, not when popping
            q.offer(v);
        }
    }
    return dist;
}
```
✍️ Mark visited when you push. Marking when you pop lets the same vertex be pushed many times (wasteful, sometimes TLE).

## Counting levels

✍️ For "minimum number of steps/minutes", process the queue level by level with `sz = q.size()` (as in [[tree-bfs-level-order#template]]) and increment a step counter after each level.

## Recognise it

✍️ "minimum number of steps / moves / minutes / transformations", unweighted grid shortest path, spreading processes (rotting, infection, fire).
✍️ If edges have different weights, BFS is wrong → Dijkstra ([[graph-dijkstra]]). If weights are only 0 and 1 → 0-1 BFS with a deque.

## Complexity

O(n + m) time, O(n) space.
