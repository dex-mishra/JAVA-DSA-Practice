# Topological sort — ordering with dependencies

> Order the vertices of a directed acyclic graph so every edge points forward. Kahn's algorithm repeatedly takes a vertex with in-degree 0.

## Idea

✍️ A vertex with **no incoming edges** (in-degree 0) has no unmet dependencies, so it can go first.
✍️ Remove it (decrement the in-degree of its neighbours); new in-degree-0 vertices become available. Repeat.
✍️ If the graph has a cycle, vertices in the cycle never reach in-degree 0 — the order ends up shorter than n.

## Template: Kahn's algorithm

```java
int[] topoOrder(int n, int[][] prereq) {
    List<List<Integer>> adj = new ArrayList<>(); int[] indeg = new int[n];
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] p : prereq) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }   // edge b to a
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[n]; int oi = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); order[oi++] = u;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    if (oi < n) return new int[]{};             // cycle → impossible
    return order;
}
```
✍️ Direction: `[a, b]` "a depends on b" → edge **b → a** (b must come before a).

## DFS version

✍️ Run DFS; when a vertex finishes (state 2), append it to a list. Reverse the list at the end. Use the three-state colouring to detect cycles at the same time.

## Recognise it

✍️ "prerequisites", "order of tasks / courses / build steps", "dependencies", "alien dictionary" (derive edges from adjacent words), "can all be completed".

## Complexity

O(n + m) time and space.
