# Depth-first search on graphs

> Go as deep as possible along one path before backtracking. A visited array prevents infinite loops. O(n + m).

## Idea

✍️ From a vertex, visit an unvisited neighbour, then its unvisited neighbour, and so on; when stuck, return and try the next neighbour.
✍️ Mark a vertex visited **when you first reach it**. Graphs can have cycles; without marking, DFS loops forever.

## Template

```java
List<List<Integer>> adj; boolean[] vis;
void dfs(int u) {
    vis[u] = true;
    for (int v : adj.get(u))
        if (!vis[v]) dfs(v);
}
```

## Iterative DFS

```java
Deque<Integer> st = new ArrayDeque<>(); st.push(src); vis[src] = true;
while (!st.isEmpty()) {
    int u = st.pop();
    for (int v : adj.get(u)) if (!vis[v]) { vis[v] = true; st.push(v); }
}
```
✍️ Use it when the graph can be very deep (10⁵+ vertices in a chain) to avoid stack overflow ([[cpp-recursion-stack-limits]]).

## What DFS is used for

✍️ Reachability, connected components ([[graph-connected-components]]), flood fill on grids, cycle detection ([[graph-cycle-detection]]), topological order ([[graph-topological-sort]]), path existence.
✍️ DFS does **not** find shortest paths in general — use BFS for unweighted shortest paths.

## Complexity

O(n + m) time: each vertex visited once, each edge examined once (twice if undirected). O(n) space.
