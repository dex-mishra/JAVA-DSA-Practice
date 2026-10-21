# Minimum spanning tree — Kruskal and Prim (recognition level)

> Connect all vertices with minimum total edge weight. Kruskal: sort edges, add each one that joins two different components (DSU). Prim: grow from a vertex with a min-heap.

## Kruskal

✍️ Sort all edges by weight. For each edge, if its endpoints are in different components (`dsu.unite` returns true), take it. Stop after n − 1 edges. O(m log m).

## Prim

✍️ Start from any vertex; a min-heap holds edges leaving the tree; repeatedly take the cheapest edge to a vertex not yet in the tree. O(m log n). For dense graphs (all pairs, like LeetCode 1584 points) an O(n²) array version is simplest.

## Why greedy works

✍️ Cut property: for any split of the vertices into two sides, the cheapest edge crossing the split belongs to some MST. Both algorithms only ever take such edges.
