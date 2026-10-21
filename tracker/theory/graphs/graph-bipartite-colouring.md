# Bipartite check — two-colouring

> Colour the start vertex 0, every neighbour the opposite colour; a neighbour that already has the same colour proves the graph is not bipartite. Run from every uncoloured vertex.

## Idea

✍️ Bipartite = vertices can be split into two groups with every edge going **between** groups (no edge inside a group).
✍️ BFS/DFS assigning alternating colours. If an edge connects two vertices of the same colour, it is impossible.
✍️ Equivalent: the graph has **no odd-length cycle**.

## Template

```java
boolean isBipartite(int[][] g) {
    int n = g.length; int[] col = new int[n];
    Arrays.fill(col, -1);
    for (int s = 0; s < n; s++) {
        if (col[s] != -1) continue;                     // graph may be disconnected
        Deque<Integer> q = new ArrayDeque<>(); q.offer(s); col[s] = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : g[u]) {
                if (col[v] == -1) { col[v] = col[u] ^ 1; q.offer(v); }
                else if (col[v] == col[u]) return false;
            }
        }
    }
    return true;
}
```

## Recognise it

✍️ "split into two groups", "possible bipartition" (people who dislike each other), "two teams", "is graph bipartite".

## Pitfalls

✍️ Only colouring from vertex 0 — a disconnected graph needs a start in every component.
