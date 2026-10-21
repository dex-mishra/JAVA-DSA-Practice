# Bridges and articulation points — Tarjan (recognition level)

> An edge is a bridge if removing it disconnects the graph. DFS with discovery times and low-links finds all bridges in O(n + m).

## Idea

✍️ `tin[u]` = DFS discovery time; `low[u]` = smallest discovery time reachable from u's subtree using at most one back edge.
✍️ Tree edge (u, v) is a **bridge** iff `low[v] > tin[u]`: nothing under v can climb back to u or above without that edge.

## Code (for reference)

```java
int timer = 0; int[] tin, low; List<int[]> bridges = new ArrayList<>();
void dfs(int u, int parent, List<List<Integer>> adj) {
    tin[u] = low[u] = timer++;
    for (int v : adj.get(u)) {
        if (v == parent) continue;
        if (tin[v] != -1) low[u] = Math.min(low[u], tin[v]);     // back edge
        else {
            dfs(v, u, adj);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > tin[u]) bridges.add(new int[]{u, v});
        }
    }
}
```

## Interview level

✍️ Appears as "critical connections in a network" (LeetCode 1192). Rare in campus OAs; know the definition and the `low[v] > tin[u]` condition.
