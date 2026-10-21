# Representing graphs — edge lists, adjacency lists, matrices

> Vertices and edges, directed vs undirected, weighted vs unweighted, and how to build an adjacency list from the input format LeetCode gives you.

## Terms

✍️ A graph = vertices (nodes) + edges (connections). **Directed**: edges have a direction (u → v). **Undirected**: an edge connects both ways. **Weighted**: each edge has a cost.
✍️ n vertices, m edges. Dense graphs have m ≈ n²; sparse graphs have m ≈ n (most interview graphs are sparse).

## Adjacency list (default choice)

✍️ `List<List<Integer>> adj` — `adj[u]` lists the neighbours of u. Space O(n + m). Iterating u's neighbours costs O(deg u).
```java
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int[] e : edges) {            // edges = [[u, v], ...]
    adj.get(e[0]).add(e[1]);
    adj.get(e[1]).add(e[0]);       // omit for directed graphs
}
// weighted: List<List<int[]>> adj; adj.get(u).add(new int[]{v, w});
```

## Adjacency matrix

✍️ `g[u][v] = 1` if there is an edge. O(n²) space; O(1) edge check; iterating neighbours is O(n). Some problems give the input this way (Number of Provinces: `isConnected[i][j]`).
- Fine for n ≤ ~1000; wasteful for large sparse graphs.

## Input formats you will see

- Edge list `[[0,1],[1,2]]` → build an adjacency list.
- Prerequisites `[a, b]` = "to take a you need b" → edge **b → a** (direction matters for topological sort).
- Grid → implicit graph, no list needed ([[graph-grid-as-graph]]).
- `graph[i]` already given as neighbours (Is Graph Bipartite) → use directly.
