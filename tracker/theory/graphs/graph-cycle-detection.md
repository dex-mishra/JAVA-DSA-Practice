# Cycle detection — undirected and directed

> Undirected: a visited neighbour that is not your parent means a cycle. Directed: a neighbour that is still on the current DFS path (state "visiting") means a cycle.

## Undirected graphs

✍️ DFS passing the parent. Reaching an already-visited vertex that is **not the parent** means there is another path to it → cycle.
✍️ Union-find alternative: for each edge (u, v), if u and v are already in the same set, this edge closes a cycle ([[graph-dsu]]). This is Redundant Connection.

## Directed graphs: three states

✍️ "Visited" alone is not enough: in a directed graph, reaching a vertex finished by an earlier branch is fine (a diamond shape), not a cycle.
✍️ Use three states: 0 = unvisited, 1 = **on the current path** (visiting), 2 = done. An edge to a state-1 vertex is a back edge → cycle.
```java
int[] state;                             // 0 unvisited, 1 visiting, 2 done
boolean hasCycle(int u, List<List<Integer>> adj) {
    state[u] = 1;
    for (int v : adj.get(u)) {
        if (state[v] == 1) return true;              // back edge
        if (state[v] == 0 && hasCycle(v, adj)) return true;
    }
    state[u] = 2;
    return false;
}
```

## Kahn's algorithm also detects cycles

✍️ Topological sort by in-degrees processes every vertex iff the graph is acyclic. If fewer than n vertices were processed, there is a cycle ([[graph-topological-sort#kahn]]).

## Where it appears

Course schedule (can you finish all courses?), find eventual safe states (vertices not leading to a cycle = those that reach state 2), redundant connection, detect deadlock.
