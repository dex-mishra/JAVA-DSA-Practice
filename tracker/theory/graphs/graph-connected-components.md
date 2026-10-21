# Connected components

> Loop over every vertex; each unvisited one starts a new DFS/BFS that marks its whole component. The number of starts is the number of components.

## Idea

✍️ A connected component is a maximal set of vertices reachable from each other. One traversal from any vertex marks exactly its component.
✍️ So: `for each vertex v: if not visited → components++, traverse(v)`.

## Template

```java
void dfs(int u, int[][] M, boolean[] vis) {
    vis[u] = true;
    for (int v = 0; v < M.length; v++) if (M[u][v] == 1 && !vis[v]) dfs(v, M, vis);
}
int findCircleNum(int[][] M) {                          // adjacency matrix input
    int n = M.length, comps = 0;
    boolean[] vis = new boolean[n];
    for (int i = 0; i < n; i++) if (!vis[i]) { comps++; dfs(i, M, vis); }
    return comps;
}
```

## Union-find alternative

✍️ Union every edge's endpoints; components = number of distinct roots ([[graph-dsu]]). Better when edges arrive one by one (online), or when you also need "are u and v connected?" many times.

## Complexity

O(n + m) with an adjacency list, O(n²) with a matrix.
