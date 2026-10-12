---
phase: V2
title: Graphs
days: 8-13
problems: 31
generated: 2026-09-17
---

# V2 — Graphs

**Days 8–13** &nbsp;·&nbsp; **31 problems** &nbsp;·&nbsp; Traversal, topological order, shortest paths, disjoint sets and minimum spanning trees.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Graphs

[Striver: Graph series](https://www.youtube.com/watch?v=M3_pLsDdeuU)

<!-- theory-id:t-graphs -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A graph is a set of vertices and a set of edges connecting them. Trees and linked
lists are special cases — a tree is a connected graph with no cycles — so graph techniques subsume
much of what you already know.

**The vocabulary that matters.**

- *Directed* vs *undirected* — whether an edge can be traversed both ways.
- *Weighted* vs *unweighted* — whether edges carry a cost.
- *Degree* — edges at a vertex. Directed graphs split it into *in-degree* and *out-degree*.
- *Connected component* — a maximal set of mutually reachable vertices.
- *DAG* — a directed graph with no cycles. Topological ordering exists only for DAGs.
- *Cycle* — a path returning to its start.

**Representation.** Adjacency list almost always; adjacency matrix only when the graph is dense or
you need O(1) edge lookups.

```cpp
vector<vector<int>> adj(n);                        // unweighted
adj[u].push_back(v);                               // and adj[v].push_back(u) if undirected

vector<vector<pair<int,int>>> wadj(n);             // weighted: (neighbour, weight)
wadj[u].push_back({v, w});
```

Adjacency list is O(V + E) space; matrix is O(V²). At V = 10⁵ the matrix is impossible, which the
constraints will tell you.

**A grid is a graph.** Every cell is a vertex with up to four neighbours. Map (i, j) to `i * cols + j`
when you need a flat index for DSU.

```cpp
static const int d[] = {0, 1, 0, -1, 0};           // four neighbours from one array
for (int t = 0; t < 4; t++) { int ni = i + d[t], nj = j + d[t+1]; }
```

**The two traversals.**

*DFS* goes as deep as possible before backtracking. Natural recursively; used for connected
components, cycle detection, topological order and anything needing subtree information.

```cpp
void dfs(int u, vector<vector<int>>& adj, vector<bool>& vis) {
    vis[u] = true;
    for (int v : adj[u]) if (!vis[v]) dfs(v, adj, vis);
}
```

*BFS* explores level by level. Used whenever the question is about **fewest steps**, because on an
unweighted graph BFS visits vertices in non-decreasing distance order.

```cpp
vector<int> bfs(int src, vector<vector<int>>& adj) {
    vector<int> dist(adj.size(), -1);
    queue<int> q; q.push(src); dist[src] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u])
            if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return dist;
}
```

Mark visited when **enqueuing**, not when dequeuing, or vertices enter the queue many times.

**Multi-source BFS.** Push every source at distance 0 before the loop starts. One BFS then computes
the distance to the *nearest* source for every vertex, which is what Rotting Oranges and 01 Matrix
need.

**Topological sort (Kahn's algorithm).** Repeatedly remove a vertex with in-degree zero.

```cpp
vector<int> topo(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};   // short means a cycle
}
```

The length check **is** the cycle detection — no separate pass.

**Dijkstra.** Shortest paths with non-negative weights.

```cpp
vector<long long> dijkstra(int n, vector<vector<pair<int,int>>>& adj, int src) {
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[src] = 0; pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;                  // stale entry
        for (auto [v, w] : adj[u])
            if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }
    }
    return dist;
}
```

**Disjoint Set Union.** Connected components and cycle detection in undirected graphs.

```cpp
struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }      // path compression
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                   // already joined: this edge closes a cycle
        if (r[a] < r[b]) swap(a, b);
        p[b] = a;
        if (r[a] == r[b]) r[a]++;                   // union by rank
        return true;
    }
};
```

**Complexity summary.**

| Algorithm | Time | Use |
|---|---|---|
| DFS / BFS | O(V + E) | reachability, components, levels |
| Multi-source BFS | O(V + E) | distance to nearest source |
| Kahn topological sort | O(V + E) | ordering, DAG cycle detection |
| DFS colour cycle detection | O(V + E) | directed cycles |
| Dijkstra | O((V + E) log V) | non-negative weights |
| Bellman-Ford | O(V · E) | negative weights, negative-cycle detection |
| Floyd-Warshall | O(V³) | all pairs, V ≤ a few hundred |
| DSU operation | ~O(1) amortised | components, Kruskal |
| Kruskal MST | O(E log E) | minimum spanning tree |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why BFS gives shortest paths only on unweighted graphs.** BFS dequeues vertices in non-decreasing
distance order, so the first time it reaches a vertex is via a minimum-edge-count path. With weights,
a path of two cheap edges can beat one expensive edge, and BFS has no mechanism to reconsider —
hence Dijkstra's priority queue.

A useful middle case: when all weights are 0 or 1, **0-1 BFS** with a deque gives O(V + E) — push
zero-weight neighbours to the front and one-weight to the back. This beats Dijkstra's log factor and
appears in minimum-obstacle-removal problems.

**Mark visited on enqueue.** If you mark on dequeue, a vertex reachable from several frontier
vertices is enqueued once per incoming edge. The queue grows to O(E) and the constant factor
collapses. This is the single most common BFS bug.

**Dijkstra's correctness and why it needs non-negative weights.** The invariant is that when a vertex
is popped, its distance is final. The proof: any alternative path to it must pass through an
unfinalised vertex whose tentative distance is already at least as large, and since edge weights are
non-negative, extending that path cannot make it shorter. A negative edge breaks the last step — a
longer-looking path could later shrink — so the greedy commitment is unsound. Use Bellman-Ford there:
V−1 rounds of relaxing every edge, and a Vth round that still improves something proves a negative
cycle.

**The stale-entry check replaces decrease-key.** `std::priority_queue` cannot update a key, so
Dijkstra pushes duplicates and skips any pop whose distance exceeds the recorded one. The queue holds
O(E) entries rather than O(V), which is why the bound is O((V+E) log V) rather than O(E + V log V).
An indexed binary heap or a Fibonacci heap achieves the tighter bound; neither is worth implementing
in an interview.

**Dijkstra variants change only the relaxation step.** Maximum-probability paths multiply instead of
adding and use a max-heap. Minimum-effort paths take `max(currentEffort, edgeWeight)` instead of a
sum — a minimax objective, and it still works because that function is monotone along a path. Spotting
that a problem is "Dijkstra with a different combine operator" is worth more than memorising the
variants.

**Cheapest Flights Within K Stops** is the case where Dijkstra's invariant genuinely fails: a vertex's
cheapest route may use too many stops, so arriving cheaply is not the same as arriving usefully. Either
run Bellman-Ford for exactly K+1 rounds, or run BFS level by level where each level is one additional
stop. The lesson is that adding a second dimension to the state can invalidate a greedy algorithm.

**Directed cycle detection needs three colours, not two.** A visited vertex is only evidence of a
cycle if it lies on the *current* recursion path. White, grey and black — unvisited, in-progress,
finished — distinguish a back edge from a harmless cross edge. In undirected graphs you instead ignore
the edge back to the parent, and must be careful with parallel edges.

**DSU complexity.** Path compression alone gives O(log n) amortised; union by rank alone gives
O(log n); together they give O(α(n)), where α is the inverse Ackermann function and is below 5 for any
n you will ever see. Treat it as constant but know the real bound and that it comes from combining
both optimisations.

DSU answers connectivity under *additions* only. It cannot delete an edge, which is why dynamic
connectivity problems are much harder, and why "offline, process the queries in reverse" is a common
trick — deletions become additions when time runs backwards.

**Kruskal versus Prim.** Kruskal sorts edges and unions greedily: O(E log E), better on sparse graphs,
and trivially correct given the cut property. Prim grows one tree with a priority queue: O(E log V),
better on dense graphs. Both rely on the cut property — the lightest edge crossing any partition of
the vertices belongs to some MST.

**Bridges and articulation points (Tarjan).** A bridge is an edge whose removal disconnects the graph.
Track each vertex's DFS discovery time and the lowest discovery time reachable from its subtree. An
edge (u, v) is a bridge when `low[v] > disc[u]` — nothing in v's subtree can reach u or above except
through that edge. O(V + E), one DFS. This is Critical Connections, and the `low` array idea also
gives strongly connected components via Tarjan's SCC algorithm.

**When the graph is implicit.** Word Ladder, Open the Lock and Shortest Path Visiting All Nodes have
no edge list — states are strings, dial positions, or (vertex, visited-bitmask) pairs, and neighbours
are generated on demand. Recognising a state space as a graph is usually the whole difficulty; the
BFS afterwards is routine. When the state includes a bitmask, `n ≤ 20` in the constraints is the tell.

**Eulerian paths.** Reconstruct Itinerary wants a path using every edge exactly once. Hierholzer's
algorithm does a DFS that appends a vertex to the answer only after exhausting its edges, then
reverses. Greedily picking the lexicographically smallest next edge without that post-order append
gets stuck in a dead end — which is exactly the trap the problem sets.

**The grilling chain.**

- *BFS or Dijkstra here?* — Whether edges are weighted; mention 0-1 BFS for the 0/1 case.
- *Why does Dijkstra fail on negative weights?* — The finalisation invariant; name Bellman-Ford.
- *How do you decrease-key in `priority_queue`?* — You do not; push duplicates and skip stale pops.
- *Detect a cycle in a directed graph.* — Three colours, and why two are insufficient.
- *What is DSU's real complexity?* — O(α(n)) from path compression plus union by rank.
- *Can DSU handle edge deletion?* — No. Mention offline reverse processing.
- *Find all bridges.* — Tarjan's `disc` and `low`, with the `low[v] > disc[u]` condition.
- *Shortest path with at most K edges.* — Dijkstra's invariant breaks; Bellman-Ford rounds or
  level-wise BFS.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Why BFS finds the shortest route**

You are looking for the nearest open shop. Rather than walking one street to its very end, you check
every shop one minute away, then every shop two minutes away, then three.

The first shop you find open is necessarily among the closest, because you never looked further
before looking nearer. Depth-first would send you down a single long road, and you might find an
open shop forty minutes away while missing one around the corner.

**Why Dijkstra breaks on negative edges**

You are budgeting a journey and you finalise each leg as soon as it looks cheapest. Then someone
tells you a particular road pays you to use it.

Now a route you had already dismissed as too long might end up cheaper than the one you locked in.
Every decision you finalised is suspect. Dijkstra's whole speed comes from never revisiting a
finalised vertex, and a negative edge destroys that guarantee.

**Disjoint Set Union**

Two hostels merge. Rather than relabelling everyone, each hostel just names one person as the
representative, and the smaller hostel's representative starts pointing at the larger one's.

To ask whether two students share a hostel, each follows the chain of representatives to the top and
you compare. Path compression is everyone remembering the final answer so nobody walks the chain
twice.

**The cut property behind MST**

Split a railway network into two halves any way you like. Among all the lines crossing that split,
the cheapest one must be in the optimal network.

If it were not, you could add it and remove whatever other crossing line the network used — the
network stays connected and gets cheaper, so the original was not optimal.

**An implicit graph**

A combination lock with four dials is a graph nobody drew for you. Each lock position is a place you
can stand, and one click of one dial is a road to a neighbouring position.

Once you see that, "fewest clicks to open it" is just "shortest route", and you already know how to
find shortest routes.

</details>

## Problems

### Day 8

*6 problems — 3 core, 3 drill, 0 skim.*

#### `[CORE]` 1. Number of Islands &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 200

<!-- id:graphs-number-of-islands | order:1 | day:8 | pattern:grid-dfs-flood-fill | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/number-of-islands/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/number-of-distinct-islands/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=muncqlKJrH0)

**Asked by:** Amazon, Facebook, Google, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `grid-dfs-flood-fill`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A grid is a graph nobody drew for you: each cell is a vertex with up to four neighbours. Counting components means starting a traversal from every unvisited land cell and sinking everything it reaches.

**Trick.** Sink as you go - overwrite the visited cell with '0' instead of keeping a separate visited array. O(1) extra space, and it cannot desynchronise from the grid.

**Edge cases that bite.**

- Bounds must be checked before dereferencing the cell.
- Recursion can hit 10^6 depth on an all-land 1000x1000 grid and overflow the stack - use BFS or an explicit stack there.
- Only four-directional adjacency; diagonals do not connect.

**Complexity.** `O(m·n)` time, `O(1) sinking, O(m·n) worst-case recursion` space — every cell is visited at most twice - once by the outer scan, once by a traversal. Sinking removes the visited array entirely.

**Same pattern.** [Max Area of Island](https://leetcode.com/problems/max-area-of-island/), [Surrounded Regions](https://leetcode.com/problems/surrounded-regions/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/)

**Interview follow-ups.**

- **Q.** The grid is too large to recurse.
  <br>**A.** Convert to BFS with a queue, or an explicit stack. The recursion depth on an all-land grid is the cell count, not the perimeter.
- **Q.** Count islands as the grid is built up, one cell at a time.
  <br>**A.** That is LC 305 and it needs DSU - each new land cell either starts a component or merges existing ones. Sinking cannot answer incremental queries.
- **Q.** Why is a grid a graph?
  <br>**A.** Vertices are cells, edges are adjacency. Saying that out loud is what unlocks BFS, DSU and Dijkstra on grid problems.

</details>

#### `[CORE]` 2. Surrounded Regions &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 130

<!-- id:graphs-surrounded-regions | order:3 | day:8 | pattern:boundary-first-dfs | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/surrounded-regions/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/graph/surrounded-regions-replace-os-with-xs/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=BtdgAys4yMk)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `boundary-first-dfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Finding enclosed regions directly is awkward. Inverting the question - mark everything reachable from the BORDER as safe, then flip the rest - makes it one pass. Solving the complement is the transferable idea.

**Trick.** DFS from every border 'O', marking them with a temporary sentinel. Then sweep the grid: sentinel becomes 'O', every remaining 'O' becomes 'X'.

**Edge cases that bite.**

- Start from all four borders, not just the top and left.
- A temporary third symbol is needed; flipping in place during the DFS loses information.
- A 1xN or Nx1 grid is entirely border, so nothing is captured.

**Complexity.** `O(m·n)` time, `O(m·n) recursion worst case` space — one traversal from the border plus one sweep, each linear in the cell count.

**Same pattern.** [Number of Enclaves](https://leetcode.com/problems/number-of-enclaves/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/), [Count Sub Islands](https://leetcode.com/problems/count-sub-islands/)

**Interview follow-ups.**

- **Q.** Why solve the complement?
  <br>**A.** An enclosed region is defined by what it canNOT reach, which is a global property. Border-reachability is local and traversable, and its complement is exactly the answer.
- **Q.** Pacific Atlantic Water Flow.
  <br>**A.** LC 417 - two border-first traversals, one from each ocean, then intersect. The same inversion applied twice.

</details>

#### `[CORE]` 3. Rotting Oranges &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 994

<!-- id:graphs-rotting-oranges | order:4 | day:8 | pattern:multi-source-bfs | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/rotting-oranges/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/rotten-oranges-min-time-to-rot-all-oranges-bfs/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=yf3oUhkvqA0)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `multi-source-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Several sources spread simultaneously, so a per-source BFS would be wrong as well as slow. Pushing every source at distance 0 before the loop starts makes one BFS compute the distance to the NEAREST source for every cell.

**Trick.** Enqueue all initially rotten cells first, then BFS level by level. The number of levels is the elapsed time. Count fresh oranges up front and verify none remain at the end.

**Edge cases that bite.**

- Any fresh orange unreachable from a rotten one means -1 - count them rather than inspecting the grid afterwards.
- A grid with no fresh oranges returns 0, even with no rotten ones.
- Time is levels minus one if you enqueue sources at level 0 and count levels.

**Complexity.** `O(m·n)` time, `O(m·n)` space — every cell is enqueued once. Running a separate BFS per source would be O((mn)^2).

**Same pattern.** [01 Matrix](https://leetcode.com/problems/01-matrix/), [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [As Far from Land as Possible](https://leetcode.com/problems/as-far-from-land-as-possible/)

**Interview follow-ups.**

- **Q.** Why does multi-source BFS give the nearest source?
  <br>**A.** All sources sit at distance 0 in the same frontier, so the wave expands from all of them together. The first wave to reach a cell came from its closest source.
- **Q.** Which cell is furthest from any land?
  <br>**A.** LC 1162 - the same multi-source BFS, taking the maximum distance instead of the level count.

</details>

#### `[DRILL]` 4. Max Area of Island &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 695

<!-- id:graphs-max-area-of-island | order:2 | day:8 | pattern:grid-dfs-flood-fill | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/max-area-of-island/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `grid-dfs-flood-fill`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Number of Islands with the DFS returning a size instead of nothing. The lesson is that a flood fill can compute any aggregate over its component - area, perimeter, maximum value - by returning it up the recursion.

**Trick.** Return `1 + dfs(up) + dfs(down) + dfs(left) + dfs(right)`, with out-of-bounds and water returning 0. Take the maximum across all starting cells.

**Edge cases that bite.**

- Out-of-bounds and water must both return 0 so the sum arithmetic works.
- An all-water grid returns 0, not 1.
- Sink before recursing, or the same cell is counted repeatedly.

**Complexity.** `O(m·n)` time, `O(m·n) recursion worst case` space — one traversal per component, each cell visited once.

**Same pattern.** [Number of Islands](https://leetcode.com/problems/number-of-islands/), [Island Perimeter](https://leetcode.com/problems/island-perimeter/), [Making A Large Island](https://leetcode.com/problems/making-a-large-island/), [Count Sub Islands](https://leetcode.com/problems/count-sub-islands/)

**Interview follow-ups.**

- **Q.** Perimeter instead of area.
  <br>**A.** Count edges facing water or the boundary. The traversal is identical; only the accumulated quantity changes.
- **Q.** Largest island after flipping one water cell.
  <br>**A.** LC 827 - label each component with DSU or a colouring pass, record sizes, then for each water cell sum the distinct neighbouring component sizes. Re-running DFS per flip is O((mn)^2).

</details>

#### `[DRILL]` 5. 01 Matrix &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 542

<!-- id:graphs-01-matrix | order:5 | day:8 | pattern:multi-source-bfs | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/01-matrix/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/graph/distance-of-nearest-cell-having-1/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=edXdVwkYHF8)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `multi-source-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Doing a BFS from each 1 to find the nearest 0 is O((mn)^2). Inverting it - BFS outward from every 0 at once - answers all cells in one pass. Second instance of the same inversion, deliberately placed next to the first.

**Trick.** Enqueue every 0 at distance 0, set every 1 to -1 as unvisited, then BFS filling distances.

**Edge cases that bite.**

- Initialise the 1 cells to a sentinel so visited and distance-zero are distinguishable.
- An all-zero matrix returns all zeros.
- The problem guarantees at least one 0.

**Complexity.** `O(m·n)` time, `O(m·n)` space — each cell enters the queue once.

**Same pattern.** [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/), [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/), [As Far from Land as Possible](https://leetcode.com/problems/as-far-from-land-as-possible/)

**Interview follow-ups.**

- **Q.** Solve it with DP instead.
  <br>**A.** Two passes - top-left to bottom-right, then bottom-right to top-left - each taking the minimum of the neighbour above/left or below/right plus one. O(mn) with O(1) extra space, and it works because Manhattan distance decomposes by direction.
- **Q.** Why can't you BFS from each 1?
  <br>**A.** Correct but O((mn)^2). Reversing the direction of the search is the whole optimisation.

</details>

#### `[DRILL]` 6. Shortest Path in Binary Matrix &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1091

<!-- id:graphs-shortest-path-in-binary-matrix | order:6 | day:8 | pattern:bfs-grid-shortest | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/shortest-path-in-binary-matrix/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/g-36-shortest-distance-in-a-binary-maze/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=U5Mw4eyUmw4)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-grid-shortest`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Unweighted shortest path on a grid, with eight-directional movement. The only thing worth internalising is that BFS - not DFS, not Dijkstra - is correct precisely because every step costs the same.

**Trick.** BFS from (0,0) with an eight-neighbour offset array. Return the level on reaching the bottom-right. Mark visited on enqueue.

**Edge cases that bite.**

- Eight directions, not four - diagonals count.
- The start or end cell may itself be blocked; check before starting.
- A 1x1 grid with value 0 has path length 1.

**Complexity.** `O(m·n)` time, `O(m·n)` space — each cell is enqueued once, with eight edge checks each.

**Same pattern.** [01 Matrix](https://leetcode.com/problems/01-matrix/), [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/), [Open the Lock](https://leetcode.com/problems/open-the-lock/), [Word Ladder](https://leetcode.com/problems/word-ladder/)

**Interview follow-ups.**

- **Q.** Why BFS rather than Dijkstra?
  <br>**A.** All edges cost 1, so BFS already dequeues in non-decreasing distance order. Dijkstra's heap would add a log factor for no benefit.
- **Q.** Some cells cost 2 to enter.
  <br>**A.** Now it is weighted. Use Dijkstra - or 0-1 BFS with a deque if the only weights are 0 and 1, which keeps it O(V+E).

</details>

### Day 8 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **A grid is a graph nobody drew for you.** Cells are vertices, adjacency is edges. Saying that out loud is what unlocks BFS, DSU and Dijkstra on grid problems, and the {0,1,0,-1,0} offset array gives all four neighbours from one loop.
  <br>↳ *Number of Islands* — treating each land cell as a vertex and flood-filling its component; *Shortest Path in Binary Matrix* — BFS over cells with an eight-neighbour offset array
- **Sink as you go instead of keeping a visited array.** Overwriting a visited cell with a sentinel is O(1) extra space and cannot desynchronise from the grid. The cost is mutating the input, which must be acceptable or restored.
  <br>↳ *Number of Islands* — setting the cell to '0' on arrival; *Max Area of Island* — the same sink, with the DFS returning a size instead of nothing
- **Push every source before the loop starts.** Multi-source BFS computes the distance to the NEAREST source for every vertex in one pass. Running a separate BFS per source is correct and quadratic.
  <br>↳ *Rotting Oranges* — enqueuing every rotten orange at level 0 so the waves expand together; *01 Matrix* — enqueuing every zero rather than searching outward from each one
- **Solve the complement when the property is global.** Being enclosed is defined by what a region cannot reach, which no local traversal can see. Border-reachability is local and traversable, and its complement is the answer.
  <br>↳ *Surrounded Regions* — marking everything reachable from the border, then flipping the rest
- **A flood fill can return any aggregate over its component.** Area, perimeter, maximum value - whatever the DFS returns up the recursion becomes a property of the whole component, with no second pass.
  <br>↳ *Max Area of Island* — returning 1 plus the four recursive sizes, with water returning 0

### Day 9

*8 problems — 5 core, 2 drill, 1 skim.*

#### `[CORE]` 1. Clone Graph &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 133

<!-- id:graphs-clone-graph | order:7 | day:9 | pattern:traversal-with-mapping | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/clone-graph/)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `traversal-with-mapping`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Cycles mean a naive recursive copy loops forever. A map from original node to its clone serves as both the memo and the visited set, which is the general fix for any traversal that must build a parallel structure.

**Trick.** Create the clone and insert it into the map BEFORE recursing into neighbours. Inserting afterwards lets a cycle re-enter the same node.

**Edge cases that bite.**

- The map insert must precede the recursion, or cycles cause infinite descent.
- A null input returns null.
- A single node with no neighbours still needs a clone.

**Complexity.** `O(V + E)` time, `O(V)` space — each node and edge is processed once; the map holds one entry per node.

**Same pattern.** [Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [Course Schedule](https://leetcode.com/problems/course-schedule/)

**Interview follow-ups.**

- **Q.** Why insert into the map before recursing?
  <br>**A.** The map is the visited set. A cycle returning to this node must find the clone already registered, or it recurses forever.
- **Q.** BFS instead of DFS.
  <br>**A.** Identical - create the clone on first sight, enqueue the original, and wire neighbours as they are dequeued. Avoids deep recursion on a long chain.

</details>

#### `[CORE]` 2. Number of Provinces &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 547

<!-- id:graphs-number-of-provinces | order:8 | day:9 | pattern:dsu-components | template:T-GRAPH-05 -->

[Solve on LeetCode](https://leetcode.com/problems/number-of-provinces/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/number-of-provinces/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ACzkVtewUYA)

**Asked by:** Amazon, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dsu-components`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting connected components can be done with DFS or with DSU, and this is the cleanest place to learn DSU because the answer is literally the number of distinct roots. DSU is what you reach for when connectivity is built up incrementally.

**Trick.** Union every connected pair, then count vertices that are their own root. Path compression plus union by rank makes each operation effectively constant.

**Edge cases that bite.**

- The adjacency matrix is symmetric - iterate only j > i to avoid redundant unions.
- Every vertex is its own province when there are no edges.
- Counting roots at the end is simpler than maintaining a running component count.

**Complexity.** `O(n² · α(n))` time, `O(n)` space — the matrix scan is O(n^2) and dominates; each union is effectively O(1). A DFS solution is also O(n^2) here because the input is a matrix.

**Same pattern.** [Redundant Connection](https://leetcode.com/problems/redundant-connection/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [Accounts Merge](https://leetcode.com/problems/accounts-merge/), [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/)

**Interview follow-ups.**

- **Q.** DFS or DSU - does it matter here?
  <br>**A.** Not for this input. DSU wins when edges arrive incrementally or when you need to answer connectivity queries during construction; DFS wins when you have the whole graph up front.
- **Q.** What is DSU's actual complexity?
  <br>**A.** O(α(n)) amortised per operation with path compression and union by rank, where α is the inverse Ackermann function - under 5 for any n in practice.

</details>

#### `[CORE]` 3. Redundant Connection &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 684

<!-- id:graphs-redundant-connection | order:9 | day:9 | pattern:dsu-cycle-detection | template:T-GRAPH-05 -->

[Solve on LeetCode](https://leetcode.com/problems/redundant-connection/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dsu-cycle-detection`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A tree on n vertices has exactly n-1 edges, so one extra edge creates exactly one cycle. DSU detects it directly: the first edge whose endpoints already share a root is the redundant one.

**Trick.** `unite` returning false IS the cycle test. Process edges in input order and return the first one that fails to merge.

**Edge cases that bite.**

- Return the LAST such edge in input order if several would close cycles - here the problem guarantees exactly one.
- Vertices are 1-indexed, so size the DSU n+1.
- The graph is undirected; the directed version is substantially harder.

**Complexity.** `O(n · α(n))` time, `O(n)` space — one pass over the edges with near-constant union operations.

**Same pattern.** [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/), [Most Stones Removed with Same Row or Column](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/), [Number of Operations to Make Network Connected](https://leetcode.com/problems/number-of-operations-to-make-network-connected/)

**Interview follow-ups.**

- **Q.** The directed version.
  <br>**A.** LC 685 - a node may have two parents, or there may be a cycle, or both. You must identify which case applies and that changes which edge to remove. Genuinely harder.
- **Q.** Validate that a graph is a tree.
  <br>**A.** n-1 edges, no cycle, and one component. DSU gives all three: unite every edge, fail on any false return, then check the root count is 1.

</details>

#### `[CORE]` 4. Is Graph Bipartite? &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 785

<!-- id:graphs-is-graph-bipartite | order:10 | day:9 | pattern:two-colouring | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/is-graph-bipartite/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/graph/bipartite-graph-dfs-implementation/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=KG5YFfR0j8A)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-colouring`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Bipartite means two-colourable, and that is a traversal with a colour assignment: paint each neighbour the opposite colour and fail on a conflict. A graph is bipartite exactly when it has no odd-length cycle.

**Trick.** BFS or DFS assigning alternating colours from each unvisited vertex. A neighbour already coloured the SAME as the current vertex is the failure condition.

**Edge cases that bite.**

- The graph may be disconnected - loop over every vertex as a potential start.
- A conflict is same-colour, not merely already-coloured.
- Self-loops make a graph non-bipartite immediately.

**Complexity.** `O(V + E)` time, `O(V)` space — one traversal per component, visiting every edge once.

**Same pattern.** [Possible Bipartition](https://leetcode.com/problems/possible-bipartition/), [Course Schedule](https://leetcode.com/problems/course-schedule/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Clone Graph](https://leetcode.com/problems/clone-graph/)

**Interview follow-ups.**

- **Q.** Why is bipartite the same as no odd cycle?
  <br>**A.** Walking an odd cycle returns you to the start having flipped colour an odd number of times, which contradicts the start's own colour. Even cycles flip back consistently.
- **Q.** Possible Bipartition.
  <br>**A.** LC 886 - the same two-colouring, phrased as splitting people who dislike each other into two groups. Recognising the rename is the exercise.

</details>

#### `[CORE]` 5. Course Schedule &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 207

<!-- id:graphs-course-schedule | order:11 | day:9 | pattern:topological-cycle-detection | template:T-GRAPH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/course-schedule/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/detect-cycle-in-an-undirected-graph-using-dfs/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=zQ3zgFypzX4)

**Asked by:** Amazon, Facebook, Google, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `topological-cycle-detection`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** 'Can all courses be completed' is 'is this graph a DAG'. Kahn's algorithm answers it without a separate cycle check: if the topological order is shorter than the vertex count, the leftovers are stuck in a cycle.

**Trick.** Compute in-degrees, enqueue every zero, and peel. Compare the processed count to n - that comparison IS the cycle detection.

**Edge cases that bite.**

- Build the edge direction deliberately: prerequisite -> course.
- Courses with no prerequisites must be in the initial queue.
- A graph with no edges is trivially orderable.

**Complexity.** `O(V + E)` time, `O(V + E)` space — each vertex is enqueued once and each edge decremented once.

**Same pattern.** [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/), [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/), [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/), [Course Schedule IV](https://leetcode.com/problems/course-schedule-iv/)

**Interview follow-ups.**

- **Q.** Return the order, not just feasibility.
  <br>**A.** LC 210 - the same algorithm, returning the peeling order. Feasibility is the special case where you discard it.
- **Q.** Detect the cycle with DFS instead.
  <br>**A.** Three-colour DFS: white unvisited, grey in-progress, black finished. A grey neighbour is a back edge and therefore a cycle. Two colours are insufficient, because a black neighbour is harmless.

</details>

#### `[DRILL]` 6. Course Schedule II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 210

<!-- id:graphs-course-schedule-ii | order:12 | day:9 | pattern:topological-order | template:T-GRAPH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/course-schedule-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/detect-cycle-in-a-directed-graph-using-dfs-g-19/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9twcmtQj4DU)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `topological-order`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The same peeling as Course Schedule, but you keep the order. Worth doing immediately afterwards because it makes explicit that feasibility was never a separate algorithm.

**Trick.** Identical to LC 207, returning the order vector when its length equals n and an empty vector otherwise.

**Edge cases that bite.**

- Any valid order is accepted; the queue's internal order decides which.
- A cycle means returning empty, not a partial order.
- Use a priority_queue instead for the lexicographically smallest valid order.

**Complexity.** `O(V + E)` time, `O(V + E)` space — one peeling pass.

**Same pattern.** [Course Schedule](https://leetcode.com/problems/course-schedule/), [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/), [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/), [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/)

**Interview follow-ups.**

- **Q.** Lexicographically smallest order.
  <br>**A.** Swap the queue for a min-heap. O((V+E) log V), and it is the standard follow-up.
- **Q.** Alien Dictionary.
  <br>**A.** Build the precedence edges by comparing adjacent words at their first differing character, then topologically sort. The graph construction is the hard part, not the sort.

</details>

#### `[DRILL]` 7. Find Eventual Safe States &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 802

<!-- id:graphs-find-eventual-safe-states | order:13 | day:9 | pattern:reverse-topological | template:T-GRAPH-07 -->

[Solve on LeetCode](https://leetcode.com/problems/find-eventual-safe-states/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-eventual-safe-states-bfs-topological-sort-g-25/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=2gtg3VsDGyc)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `reverse-topological`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A node is safe when every path from it terminates. Reversing the edges turns that into a reachability question from the terminal nodes, and Kahn's algorithm then peels safety outward. Reversing a graph to flip the question is a technique worth owning.

**Trick.** Reverse the edges and peel from out-degree-zero nodes - which become in-degree-zero in the reversed graph. Everything peeled is safe.

**Edge cases that bite.**

- Terminal nodes (no outgoing edges) are safe by definition and seed the queue.
- The answer must be returned sorted.
- The three-colour DFS alternative is equally valid and worth knowing.

**Complexity.** `O(V + E)` time, `O(V + E)` space — one reversal plus one peeling pass, both linear.

**Same pattern.** [Course Schedule](https://leetcode.com/problems/course-schedule/), [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/), [Is Graph Bipartite?](https://leetcode.com/problems/is-graph-bipartite/)

**Interview follow-ups.**

- **Q.** Solve it with three-colour DFS.
  <br>**A.** A node is unsafe if any descendant is grey when reached. Mark black-safe on successful completion and cache it, which is memoised DFS.
- **Q.** Why reverse the graph?
  <br>**A.** Safety propagates backwards - a node is safe because its successors are. Reversing makes that propagation a forward peel, which Kahn already does.

</details>

#### `[SKIM]` 8. All Paths From Source to Target &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 797

<!-- id:graphs-all-paths-from-source-to-target | order:14 | day:9 | pattern:dag-path-enumeration | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/all-paths-from-source-to-target/)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dag-path-enumeration`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Enumerating all paths is backtracking, not BFS, and because the graph is a DAG there is no visited set at all - a node may legitimately appear on different paths. Knowing when the visited set is unnecessary is the point.

**Trick.** DFS pushing the node, recursing into neighbours, popping on the way out. No visited array, because acyclicity guarantees termination.

**Edge cases that bite.**

- No visited set - adding one would wrongly block a node reachable by two routes.
- The DAG guarantee is what makes this safe; a cycle would loop forever.
- The number of paths can be exponential, which is the real bound.

**Complexity.** `O(2^V · V)` time, `O(V) excluding output` space — a DAG on V nodes can have exponentially many source-to-target paths, and each costs O(V) to copy.

**Same pattern.** [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Subsets](https://leetcode.com/problems/subsets/), [Word Search](https://leetcode.com/problems/word-search/), [Course Schedule](https://leetcode.com/problems/course-schedule/)

**Interview follow-ups.**

- **Q.** Why no visited set?
  <br>**A.** Visited sets prevent revisiting on a SINGLE path. Here a node can appear on many distinct paths, and acyclicity already prevents infinite descent.
- **Q.** Count the paths instead of listing them.
  <br>**A.** Memoised DFS - the count from a node is the sum of counts from its neighbours. O(V + E) instead of exponential, which is the usual count-vs-enumerate split.

</details>

### Day 9 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Mark visited when enqueuing, never when dequeuing.** A vertex reachable from several frontier vertices is otherwise enqueued once per incoming edge, and the queue grows to O(E). This is the single most common BFS bug.
  <br>↳ *Rotting Oranges* — setting the cell rotten as it is pushed; *Is Graph Bipartite?* — assigning the colour at push time, which doubles as the visited mark
- **A map from original to copy is both the memo and the visited set.** Any traversal building a parallel structure over a cyclic graph needs this, and the entry must be inserted BEFORE recursing or a cycle re-enters the same node forever.
  <br>↳ *Clone Graph* — registering the clone in the map before visiting any neighbour
- **The topological order's length is the cycle check.** Kahn's algorithm peels in-degree-zero vertices. If fewer than n come out, the remainder are stuck in a cycle - no separate detection pass is needed.
  <br>↳ *Course Schedule* — comparing the processed count to n; *Course Schedule II* — the identical peel, keeping the order instead of discarding it; *Minimum Height Trees* — the same peeling mechanic applied to leaves to find tree centroids
- **Reverse the graph to flip the direction a property propagates.** Safety, reachability and dependency all propagate backwards along edges. Reversing turns that into a forward peel, which Kahn already does.
  <br>↳ *Find Eventual Safe States* — peeling from terminal nodes in the reversed graph
- **Two-colourable means no odd cycle.** Paint each neighbour the opposite colour; a neighbour already painted the SAME colour is the failure. Walking an odd cycle flips colour an odd number of times and contradicts the start.
  <br>↳ *Is Graph Bipartite?* — alternating colours from every unvisited vertex, since the graph may be disconnected
- **DSU's false return IS the cycle test.** If two endpoints already share a root, the edge closes a cycle. Path compression plus union by rank makes each operation O(alpha(n)), effectively constant.
  <br>↳ *Redundant Connection* — returning the first edge whose unite fails; *Number of Provinces* — counting vertices that are their own root
- **A visited set prevents revisits on ONE path, not across paths.** On a DAG, enumerating all routes needs no visited array at all - acyclicity already guarantees termination, and a vertex may legitimately appear on many different paths.
  <br>↳ *All Paths From Source to Target* — DFS with push and pop but no visited marking

#### From yesterday

- **A grid is a graph nobody drew for you.** Cells are vertices, adjacency is edges. ↳ *Number of Islands* — treating each land cell as a vertex and flood-filling its component
- **Sink as you go instead of keeping a visited array.** Overwriting a visited cell with a sentinel is O(1) extra space and cannot desynchronise from the grid. ↳ *Number of Islands* — setting the cell to '0' on arrival
- **Push every source before the loop starts.** Multi-source BFS computes the distance to the NEAREST source for every vertex in one pass. ↳ *Rotting Oranges* — enqueuing every rotten orange at level 0 so the waves expand together
- **Solve the complement when the property is global.** Being enclosed is defined by what a region cannot reach, which no local traversal can see. ↳ *Surrounded Regions* — marking everything reachable from the border, then flipping the rest
- **A flood fill can return any aggregate over its component.** Area, perimeter, maximum value - whatever the DFS returns up the recursion becomes a property of the whole component, with no second pass. ↳ *Max Area of Island* — returning 1 plus the four recursive sizes, with water returning 0

### Day 10

*4 problems — 3 core, 1 drill, 0 skim.*

#### `[CORE]` 1. Network Delay Time &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 743

<!-- id:graphs-network-delay-time | order:15 | day:10 | pattern:dijkstra | template:T-GRAPH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/network-delay-time/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/network-delay-time)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dijkstra`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The canonical Dijkstra problem. Weighted edges mean BFS is wrong, and the priority queue is what replaces the plain queue. The stale-entry skip is what stands in for the decrease-key operation `std::priority_queue` lacks.

**Trick.** Min-heap of (distance, node). Skip any pop whose distance exceeds the recorded one. The answer is the maximum finalised distance, or -1 if any node is unreachable.

**Edge cases that bite.**

- Unreachable nodes mean -1 - check for any remaining infinity.
- Nodes are 1-indexed.
- Distances can exceed int when weights and paths are large - use long long.
- Self-loops and parallel edges are harmless but should not be assumed absent.

**Complexity.** `O((V + E) log V)` time, `O(V + E)` space — each edge can push one heap entry, so the heap holds O(E) entries and each operation is O(log V). The stale skip keeps correctness without decrease-key.

**Same pattern.** [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/), [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/), [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/), [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/)

**Interview follow-ups.**

- **Q.** Why not BFS?
  <br>**A.** BFS dequeues in edge-count order, not cost order. With weights, two cheap edges can beat one expensive one and BFS cannot reconsider.
- **Q.** Negative weights.
  <br>**A.** Dijkstra's finalisation invariant breaks. Bellman-Ford: V-1 rounds of relaxing every edge, and a Vth round that still improves proves a negative cycle. O(V·E).
- **Q.** How do you decrease-key?
  <br>**A.** You do not. Push a duplicate and skip stale pops - that is why the bound is O((V+E) log V) rather than O(E + V log V).

</details>

#### `[CORE]` 2. Cheapest Flights Within K Stops &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 787

<!-- id:graphs-cheapest-flights-within-k-stops | order:16 | day:10 | pattern:bellman-ford-rounds | template:T-GRAPH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/cheapest-flights-within-k-stops/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/g-38-cheapest-flights-within-k-stops/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9XybHVqTHcQ)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bellman-ford-rounds`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is the problem that shows Dijkstra's invariant failing. Arriving at a city cheaply is not the same as arriving usefully, because the cheap route may have used too many stops. Adding a dimension to the state can invalidate a greedy algorithm.

**Trick.** Bellman-Ford for exactly K+1 rounds, relaxing from a SNAPSHOT of the previous round's distances. Relaxing in place lets one round use edges from the same round.

**Edge cases that bite.**

- Copy the distance array each round, or a single round chains multiple edges.
- K stops means K+1 edges.
- Unreachable within the stop limit returns -1, which is different from unreachable at all.

**Complexity.** `O(K · E)` time, `O(V)` space — K+1 rounds, each relaxing every edge once. Level-wise BFS carrying (city, cost) is an equivalent formulation with the same bound.

**Same pattern.** [Network Delay Time](https://leetcode.com/problems/network-delay-time/), [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/), [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/)

**Interview follow-ups.**

- **Q.** Why does plain Dijkstra fail?
  <br>**A.** It finalises a node at its cheapest distance and never revisits. But the cheapest route may exceed the stop budget, and a costlier route with fewer stops is the one you need.
- **Q.** Fix Dijkstra rather than switching.
  <br>**A.** Make the state (node, stopsUsed) rather than just node. The state space grows K-fold but the invariant is restored.
- **Q.** Why snapshot the distances?
  <br>**A.** Without it, round i can relax an edge whose source was already updated in round i, using i+1 edges in one round and breaking the stop bound.

</details>

#### `[CORE]` 3. Path With Minimum Effort &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1631

<!-- id:graphs-path-with-minimum-effort | order:17 | day:10 | pattern:dijkstra-minimax | template:T-GRAPH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/path-with-minimum-effort/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/g-37-path-with-minimum-effort/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=0ytpZyiZFhA)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dijkstra-minimax`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Dijkstra with the combine operator changed from addition to maximum. It still works because max is monotone along a path - extending a path can never reduce its effort - which is the only property Dijkstra's proof actually needs.

**Trick.** Relax with `max(currentEffort, abs(heightDiff))` instead of a sum. Everything else is unchanged.

**Edge cases that bite.**

- The effort of a single cell with no moves is 0.
- Grid cells need flattening to indices, or use a 2D distance array.
- Binary search on the answer plus a connectivity check is an equally valid O(mn log(range)) alternative.

**Complexity.** `O(m·n·log(m·n))` time, `O(m·n)` space — a grid Dijkstra over mn vertices with four edges each.

**Same pattern.** [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/), [Network Delay Time](https://leetcode.com/problems/network-delay-time/), [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/), [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)

**Interview follow-ups.**

- **Q.** Why can you swap addition for maximum?
  <br>**A.** Dijkstra needs the path cost to be non-decreasing as the path extends. Both sum with non-negative weights and max satisfy that, so the finalisation invariant survives.
- **Q.** Solve it with binary search instead.
  <br>**A.** Binary search the effort threshold and check reachability with BFS or DSU. Often easier to reason about, and it generalises to other minimax path problems.
- **Q.** Maximum probability path.
  <br>**A.** LC 1514 - multiply instead of add and use a max-heap. Same template, third operator.

</details>

#### `[DRILL]` 4. Swim in Rising Water &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 778

<!-- id:graphs-swim-in-rising-water | order:18 | day:10 | pattern:dijkstra-minimax | template:T-GRAPH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/swim-in-rising-water/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/swim-in-rising-water)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dijkstra-minimax`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The same minimax objective as Minimum Effort, which is why it sits next to it. It also admits a DSU solution: add cells in increasing height order and stop when start and end connect. Two very different routes to one answer.

**Trick.** Either Dijkstra with max as the combiner, or sort cells by height and union them into a DSU until (0,0) and (n-1,n-1) share a root.

**Edge cases that bite.**

- The answer is at least the maximum of the start and end cell heights.
- Heights are a permutation of 0..n^2-1, which is what makes the DSU ordering clean.
- Eight-direction movement is not allowed here - four only.

**Complexity.** `O(n² log n)` time, `O(n²)` space — both routes are dominated by a sort or a heap over n^2 cells.

**Same pattern.** [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/), [Network Delay Time](https://leetcode.com/problems/network-delay-time/), [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/)

**Interview follow-ups.**

- **Q.** Compare the two solutions.
  <br>**A.** Dijkstra answers one query. The DSU version naturally answers 'at what time does X connect to Y' for many pairs, because it builds connectivity over time.
- **Q.** Why does adding cells in height order work?
  <br>**A.** At time t exactly the cells with height <= t are swimmable. Processing in sorted order simulates time advancing, and DSU tracks connectivity as it does.

</details>

### Day 10 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **BFS is shortest-path only when every edge costs the same.** BFS dequeues in non-decreasing edge-count order. With weights, two cheap edges can beat one expensive edge and BFS cannot reconsider - that is what the priority queue buys.
  <br>↳ *Network Delay Time* — a min-heap on distance instead of a plain queue; *Shortest Path in Binary Matrix* — the contrasting case where every step costs 1 so BFS suffices
- **The stale-entry skip replaces decrease-key.** std::priority_queue cannot update a key, so Dijkstra pushes duplicates and discards any pop whose distance exceeds the recorded one. The heap holds O(E) entries rather than O(V).
  <br>↳ *Network Delay Time* — `if (d > dist[u]) continue;` at the top of the loop
- **Dijkstra only needs the cost to be monotone along a path.** Swap addition for maximum and it still works, because extending a path can never reduce its maximum. Multiplication with a max-heap works for probabilities for the same reason.
  <br>↳ *Path With Minimum Effort* — relaxing with max(currentEffort, |heightDiff|); *Swim in Rising Water* — the same minimax relaxation, with a DSU-over-time alternative
- **Adding a dimension to the state can break a greedy algorithm.** Arriving somewhere cheaply is not the same as arriving usefully once a second constraint exists. Either make the state carry that dimension, or switch to Bellman-Ford rounds.
  <br>↳ *Cheapest Flights Within K Stops* — K+1 relaxation rounds over a snapshot, because the cheapest route may use too many stops

#### From yesterday

- **Mark visited when enqueuing, never when dequeuing.** A vertex reachable from several frontier vertices is otherwise enqueued once per incoming edge, and the queue grows to O(E). ↳ *Rotting Oranges* — setting the cell rotten as it is pushed
- **A map from original to copy is both the memo and the visited set.** Any traversal building a parallel structure over a cyclic graph needs this, and the entry must be inserted BEFORE recursing or a cycle re-enters the same node forever. ↳ *Clone Graph* — registering the clone in the map before visiting any neighbour
- **The topological order's length is the cycle check.** Kahn's algorithm peels in-degree-zero vertices. ↳ *Course Schedule* — comparing the processed count to n
- **Reverse the graph to flip the direction a property propagates.** Safety, reachability and dependency all propagate backwards along edges. ↳ *Find Eventual Safe States* — peeling from terminal nodes in the reversed graph
- **Two-colourable means no odd cycle.** Paint each neighbour the opposite colour. ↳ *Is Graph Bipartite?* — alternating colours from every unvisited vertex, since the graph may be disconnected
- **DSU's false return IS the cycle test.** If two endpoints already share a root, the edge closes a cycle. ↳ *Redundant Connection* — returning the first edge whose unite fails
- **A visited set prevents revisits on ONE path, not across paths.** On a DAG, enumerating all routes needs no visited array at all - acyclicity already guarantees termination, and a vertex may legitimately appear on many different paths. ↳ *All Paths From Source to Target* — DFS with push and pop but no visited marking

#### Two days back

- **A grid is a graph nobody drew for you** — Number of Islands
- **Sink as you go instead of keeping a visited array** — Number of Islands
- **Push every source before the loop starts** — Rotting Oranges
- **Solve the complement when the property is global** — Surrounded Regions
- **A flood fill can return any aggregate over its component** — Max Area of Island

### Day 11

*4 problems — 2 core, 2 drill, 0 skim.*

#### `[CORE]` 1. Min Cost to Connect All Points &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1584

<!-- id:graphs-min-cost-to-connect-all-points | order:19 | day:11 | pattern:kruskal-mst | template:T-GRAPH-06 -->

[Solve on LeetCode](https://leetcode.com/problems/min-cost-to-connect-all-points/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `kruskal-mst`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Minimum spanning tree on a complete graph. The correctness rests on the cut property: the lightest edge crossing any partition of the vertices belongs to some MST. That one fact justifies both Kruskal and Prim.

**Trick.** Generate all n(n-1)/2 edges with Manhattan weights, sort, and union greedily until n-1 edges are accepted. DSU's false return skips cycle-forming edges.

**Edge cases that bite.**

- The graph is complete, so there are O(n^2) edges to generate.
- Stop at n-1 accepted edges to avoid scanning the tail.
- Weights fit in int here, but the total can be large - accumulate in long long.

**Complexity.** `O(n² log n)` time, `O(n²)` space — generating and sorting n^2 edges dominates. Prim with an adjacency matrix is O(n^2) with no sort, which is strictly better on a complete graph - worth saying.

**Same pattern.** [Redundant Connection](https://leetcode.com/problems/redundant-connection/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/), [Most Stones Removed with Same Row or Column](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/)

**Interview follow-ups.**

- **Q.** Prim would be better here. Why?
  <br>**A.** The graph is dense - E = O(V^2) - so Kruskal's sort costs O(V^2 log V) while Prim with an adjacency matrix is O(V^2). Kruskal wins on sparse graphs, Prim on dense ones.
- **Q.** State the cut property.
  <br>**A.** Partition the vertices any way you like; the cheapest edge crossing the partition is in some MST. If it were not, swapping it for whatever crossing edge the MST used keeps the tree connected and reduces its weight.

</details>

#### `[CORE]` 2. Accounts Merge &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 721

<!-- id:graphs-accounts-merge | order:20 | day:11 | pattern:dsu-with-mapping | template:T-GRAPH-05 -->

[Solve on LeetCode](https://leetcode.com/problems/accounts-merge/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/accounts-merge-dsu-g-50/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=FMwpt_aQOGw)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dsu-with-mapping`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** DSU over non-integer keys. Mapping each email to an index is the whole technique, and it is what lets DSU apply to strings, coordinates, or any hashable identity.

**Trick.** Map each email to an index, union all emails within an account, then group emails by root. Sort each group and prepend the owner's name.

**Edge cases that bite.**

- The same person may appear under several account entries with different name spellings - any one name is accepted.
- Emails within each merged group must be sorted.
- Two different people can share a name but never an email, which is what makes the merge sound.

**Complexity.** `O(N·α + N log N)` time, `O(N)` space — unions are near-constant; the sort of each group dominates. N is the total email count.

**Same pattern.** [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Redundant Connection](https://leetcode.com/problems/redundant-connection/), [Most Stones Removed with Same Row or Column](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/), [Evaluate Division](https://leetcode.com/problems/evaluate-division/)

**Interview follow-ups.**

- **Q.** How do you apply DSU to non-integers?
  <br>**A.** Assign each distinct key an index via a hash map. Grid cells use i*cols+j; strings use an incrementing counter. The DSU itself never changes.
- **Q.** Why can you merge on email but not name?
  <br>**A.** An email uniquely identifies a person; a name does not. Choosing the right equivalence relation is the actual modelling decision.

</details>

#### `[DRILL]` 3. Most Stones Removed with Same Row or Column &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 947

<!-- id:graphs-most-stones-removed-with-same-row-or-column | order:21 | day:11 | pattern:dsu-implicit-edges | template:T-GRAPH-05 -->

[Solve on LeetCode](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/most-stones-removed-with-same-row-or-column-dsu-g-53/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=OwMNX8SPavM)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dsu-implicit-edges`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The answer is stones minus components, because each component can be reduced to a single stone. Reframing 'how many can I remove' as 'how many must remain' is what makes it a connectivity problem at all.

**Trick.** Union stones sharing a row or column - or more cleverly, union row r with column c for each stone, treating rows and columns as the DSU elements. Then count distinct roots among occupied rows and columns.

**Edge cases that bite.**

- Rows and columns must occupy disjoint index ranges in the DSU - offset columns by 10000.
- Count roots over the keys that actually appear, not all possible indices.
- A single stone forms its own component and cannot be removed.

**Complexity.** `O(n · α(n))` time, `O(n)` space — one union per stone with near-constant operations, versus O(n^2) for comparing every pair.

**Same pattern.** [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Accounts Merge](https://leetcode.com/problems/accounts-merge/), [Redundant Connection](https://leetcode.com/problems/redundant-connection/), [Number of Islands](https://leetcode.com/problems/number-of-islands/)

**Interview follow-ups.**

- **Q.** Why can every component be reduced to one stone?
  <br>**A.** A connected component has a spanning tree; removing stones in reverse order of a DFS leaves each one still sharing a line with an unremoved stone until only the root remains.
- **Q.** Why union rows with columns rather than stones with stones?
  <br>**A.** Stone-to-stone is O(n^2) comparisons. Treating each row and column as a node makes each stone a single edge, giving O(n).

</details>

#### `[DRILL]` 4. Evaluate Division &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 399

<!-- id:graphs-evaluate-division | order:22 | day:11 | pattern:weighted-graph-path | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/evaluate-division/)

**Asked by:** Google, Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `weighted-graph-path`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Ratios compose multiplicatively along a path, so a/d is the product of edge weights from a to d. Division problems become weighted graph traversal, which is the reframing worth taking away.

**Trick.** Build a graph with edge weight a/b from a to b and b/a back. Each query is a DFS or BFS multiplying weights along the path; -1 if no path exists.

**Edge cases that bite.**

- Unknown variables - not merely unconnected ones - must return -1.
- A query like a/a is 1.0, but only if a appears in the input.
- Floating-point accumulation drifts; the problem allows a tolerance.

**Complexity.** `O(Q · (V + E))` time, `O(V + E)` space — one traversal per query. Weighted DSU answers each query in near-constant time after an O(E·α) build, which is the better solution for many queries.

**Same pattern.** [Accounts Merge](https://leetcode.com/problems/accounts-merge/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Clone Graph](https://leetcode.com/problems/clone-graph/), [Find the City With the Smallest Number of Neighbors at a Threshold Distance](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/)

**Interview follow-ups.**

- **Q.** Many queries over a fixed input.
  <br>**A.** Weighted DSU: store each node's ratio to its root and compose during find. Queries become O(α(n)) instead of O(V+E).
- **Q.** Floyd-Warshall alternative.
  <br>**A.** Compute all pairwise ratios in O(V^3). Fine when V is small and queries are numerous.

</details>

### Day 11 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The cut property justifies every MST algorithm.** The cheapest edge crossing any partition of the vertices belongs to some MST - otherwise swapping it in keeps the tree connected and reduces its weight.
  <br>↳ *Min Cost to Connect All Points* — sorting all edges and unioning greedily until n-1 are accepted
- **DSU works on anything hashable once you index it.** Map each distinct key to an integer and the DSU itself never changes. Emails, grid cells, rows and columns all become DSU elements this way.
  <br>↳ *Accounts Merge* — mapping each email to an index and unioning within each account; *Most Stones Removed with Same Row or Column* — treating rows and columns as the elements, with columns offset so the index ranges stay disjoint
- **Pick the equivalence relation deliberately.** An email identifies a person; a name does not. Choosing what counts as 'the same thing' is the modelling decision, and getting it wrong produces a correct algorithm on the wrong graph.
  <br>↳ *Accounts Merge* — merging on shared email rather than shared name
- **Composition along a path makes division a graph problem.** Ratios multiply along edges, so a/d is the product of weights from a to d. Any associative composition turns a relational query into a traversal.
  <br>↳ *Evaluate Division* — building edges a->b with weight a/b and multiplying along the path

#### From yesterday

- **BFS is shortest-path only when every edge costs the same.** BFS dequeues in non-decreasing edge-count order. ↳ *Network Delay Time* — a min-heap on distance instead of a plain queue
- **The stale-entry skip replaces decrease-key.** std::priority_queue cannot update a key, so Dijkstra pushes duplicates and discards any pop whose distance exceeds the recorded one. ↳ *Network Delay Time* — `if (d > dist[u]) continue;` at the top of the loop
- **Dijkstra only needs the cost to be monotone along a path.** Swap addition for maximum and it still works, because extending a path can never reduce its maximum. ↳ *Path With Minimum Effort* — relaxing with max(currentEffort, |heightDiff|)
- **Adding a dimension to the state can break a greedy algorithm.** Arriving somewhere cheaply is not the same as arriving usefully once a second constraint exists. ↳ *Cheapest Flights Within K Stops* — K+1 relaxation rounds over a snapshot, because the cheapest route may use too many stops

#### Two days back

- **Mark visited when enqueuing, never when dequeuing** — Rotting Oranges
- **A map from original to copy is both the memo and the visited set** — Clone Graph
- **The topological order's length is the cycle check** — Course Schedule
- **Reverse the graph to flip the direction a property propagates** — Find Eventual Safe States
- **Two-colourable means no odd cycle** — Is Graph Bipartite?
- **DSU's false return IS the cycle test** — Redundant Connection
- **A visited set prevents revisits on ONE path, not across paths** — All Paths From Source to Target

#### Earlier in graphs

- A grid is a graph nobody drew for you · Sink as you go instead of keeping a visited array · Push every source before the loop starts · Solve the complement when the property is global · A flood fill can return any aggregate over its component

### Day 12

*4 problems — 2 core, 2 drill, 0 skim.*

#### `[CORE]` 1. Word Ladder &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 127

<!-- id:graphs-word-ladder | order:23 | day:12 | pattern:implicit-graph-bfs | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/word-ladder/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/graph/word-ladder-i-g-29/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tRPda0rcf8E)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `implicit-graph-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** There is no edge list. Vertices are words and two words are adjacent when they differ in one character, so neighbours are generated on demand. Recognising a state space as a graph is the whole difficulty; the BFS afterwards is routine.

**Trick.** Generate neighbours by trying all 26 letters at each position - O(26L) per word - rather than comparing against every word in the list, which is O(N·L).

**Edge cases that bite.**

- endWord must be in the dictionary, or no transformation exists.
- Erase words from the set as they are enqueued; a visited set is otherwise mandatory.
- The answer counts words including both ends, so a one-step change is length 2.

**Complexity.** `O(N · L · 26)` time, `O(N · L)` space — each word is enqueued once and generates 26L candidate neighbours. Pairwise comparison would be O(N^2 · L).

**Same pattern.** [Open the Lock](https://leetcode.com/problems/open-the-lock/), [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/), [Bus Routes](https://leetcode.com/problems/bus-routes/), [Minimum Genetic Mutation](https://leetcode.com/problems/minimum-genetic-mutation/)

**Interview follow-ups.**

- **Q.** Why generate neighbours rather than compare all pairs?
  <br>**A.** 26L is a constant times the word length; comparing against the whole dictionary is O(N). With N = 5000 that is the difference between passing and timing out.
- **Q.** Return all shortest transformation sequences.
  <br>**A.** LC 126 - BFS to compute levels, then DFS backwards through the level structure. Much harder, because you need the whole predecessor DAG rather than one path.
- **Q.** Bidirectional BFS.
  <br>**A.** Search from both ends and stop when the frontiers meet. Roughly halves the explored depth, which is an exponential saving on a branching graph.

</details>

#### `[CORE]` 2. Reconstruct Itinerary &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 332

<!-- id:graphs-reconstruct-itinerary | order:26 | day:12 | pattern:eulerian-path | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/reconstruct-itinerary/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `eulerian-path`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Every ticket must be used exactly once, which makes this an Eulerian path - and greedy lexicographic choice gets stuck in dead ends. Hierholzer's algorithm fixes it by appending each airport only after its edges are exhausted, then reversing.

**Trick.** DFS consuming edges from a sorted multiset per airport. Append the airport to the answer AFTER the loop over its neighbours, then reverse the whole result at the end.

**Edge cases that bite.**

- Appending before the recursion gives a path that strands remaining tickets.
- Neighbours must be visited in sorted order for lexicographic minimality.
- Tickets may repeat, so a multiset or an index-into-sorted-vector is needed, not a set.

**Complexity.** `O(E log E)` time, `O(E)` space — sorting each airport's destinations dominates; each edge is consumed exactly once.

**Same pattern.** [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/), [All Paths From Source to Target](https://leetcode.com/problems/all-paths-from-source-to-target/), [Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/)

**Interview follow-ups.**

- **Q.** Why does naive greedy fail?
  <br>**A.** Taking the smallest next airport can enter a branch that dead-ends while tickets remain elsewhere. The post-order append defers commitment until a branch is provably exhausted.
- **Q.** When does an Eulerian path exist?
  <br>**A.** In a directed graph: at most one vertex with outdegree-indegree = 1, at most one with indegree-outdegree = 1, all others balanced, and the edges connected. Here the problem guarantees it.

</details>

#### `[DRILL]` 3. Open the Lock &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 752

<!-- id:graphs-open-the-lock | order:24 | day:12 | pattern:implicit-graph-bfs | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/open-the-lock/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `implicit-graph-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Second implicit graph in a row, deliberately. Lock positions are vertices and one click of one dial is an edge. Once stated that way, 'fewest clicks' is just 'shortest path' and you already know the algorithm.

**Trick.** BFS from '0000' generating 8 neighbours per state - each of 4 dials up or down. Put the deadends into the visited set up front so they are never expanded.

**Edge cases that bite.**

- '0000' may itself be a deadend, in which case the answer is -1.
- Dials wrap: 9 goes to 0 and 0 goes to 9.
- The target may be the start, giving 0.

**Complexity.** `O(10⁴ · 8)` time, `O(10⁴)` space — the state space is bounded at 10,000 lock positions with 8 transitions each.

**Same pattern.** [Word Ladder](https://leetcode.com/problems/word-ladder/), [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/), [Shortest Path Visiting All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/)

**Interview follow-ups.**

- **Q.** Seeding deadends into visited - why is that clean?
  <br>**A.** A deadend is a state you may never occupy, which is exactly what 'already visited' means to BFS. It needs no separate check inside the loop.
- **Q.** What makes a state space tractable?
  <br>**A.** Here it is bounded at 10^4. When the bound is unclear, estimate it before coding - that estimate is what tells you whether BFS is viable at all.

</details>

#### `[DRILL]` 4. Bus Routes &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 815

<!-- id:graphs-bus-routes | order:25 | day:12 | pattern:graph-of-routes | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/bus-routes/)

**Asked by:** Amazon, Google, Uber &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `graph-of-routes`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Modelling stops as vertices is the trap - the answer counts BUSES, not stops. Making each ROUTE a vertex, with two routes adjacent when they share a stop, turns the problem into a short BFS. Choosing what the vertices are is the entire exercise.

**Trick.** Build a map from stop to the routes serving it. BFS over routes, starting from every route serving the source stop, and stop when a route serves the target.

**Edge cases that bite.**

- Source equal to target returns 0 without taking any bus.
- Mark routes visited, not stops - and also mark stops consumed, or you re-expand them.
- A stop may be served by many routes.

**Complexity.** `O(sum of route lengths)` time, `O(sum of route lengths)` space — each route is expanded once and each stop's route list is scanned once.

**Same pattern.** [Word Ladder](https://leetcode.com/problems/word-ladder/), [Open the Lock](https://leetcode.com/problems/open-the-lock/), [Shortest Path Visiting All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/)

**Interview follow-ups.**

- **Q.** Why routes rather than stops?
  <br>**A.** The cost is one per bus boarded, not one per stop travelled. Edges must correspond to the thing being counted, and here that is a route change.
- **Q.** General lesson.
  <br>**A.** Before writing BFS, ask what one unit of the answer corresponds to. That decides what a vertex is.

</details>

### Day 12 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Generate neighbours instead of comparing all pairs.** In an implicit graph, neighbours are defined by a rule. Applying the rule is usually a constant times the state size; scanning the whole state set is linear in it.
  <br>↳ *Word Ladder* — trying all 26 letters at each position, O(26L), rather than comparing against every dictionary word; *Open the Lock* — generating the 8 single-click neighbours of a lock position
- **Decide what a vertex is from what the answer counts.** The edges must correspond to the unit being measured. Counting bus changes means routes are vertices; counting stops travelled would mean stops are.
  <br>↳ *Bus Routes* — making each route a vertex, adjacent when they share a stop
- **Seed forbidden states into visited.** A state you may never occupy is indistinguishable, to BFS, from one already visited. Seeding them removes a check from the inner loop entirely.
  <br>↳ *Open the Lock* — inserting every deadend into the visited set before the search begins
- **Commit after exhausting, not before.** Greedy lexicographic choice strands remaining edges in a dead end. Appending a vertex only once its edges are used up, then reversing, is Hierholzer's fix.
  <br>↳ *Reconstruct Itinerary* — appending the airport AFTER the neighbour loop, then reversing the result

#### From yesterday

- **The cut property justifies every MST algorithm.** The cheapest edge crossing any partition of the vertices belongs to some MST - otherwise swapping it in keeps the tree connected and reduces its weight. ↳ *Min Cost to Connect All Points* — sorting all edges and unioning greedily until n-1 are accepted
- **DSU works on anything hashable once you index it.** Map each distinct key to an integer and the DSU itself never changes. ↳ *Accounts Merge* — mapping each email to an index and unioning within each account
- **Pick the equivalence relation deliberately.** An email identifies a person. ↳ *Accounts Merge* — merging on shared email rather than shared name
- **Composition along a path makes division a graph problem.** Ratios multiply along edges, so a/d is the product of weights from a to d. ↳ *Evaluate Division* — building edges a->b with weight a/b and multiplying along the path

#### Two days back

- **BFS is shortest-path only when every edge costs the same** — Network Delay Time
- **The stale-entry skip replaces decrease-key** — Network Delay Time
- **Dijkstra only needs the cost to be monotone along a path** — Path With Minimum Effort
- **Adding a dimension to the state can break a greedy algorithm** — Cheapest Flights Within K Stops

#### Earlier in graphs

- A grid is a graph nobody drew for you · Sink as you go instead of keeping a visited array · Push every source before the loop starts · Solve the complement when the property is global · A flood fill can return any aggregate over its component · Mark visited when enqueuing, never when dequeuing · A map from original to copy is both the memo and the visited set · The topological order's length is the cycle check · Reverse the graph to flip the direction a property propagates · Two-colourable means no odd cycle · DSU's false return IS the cycle test · A visited set prevents revisits on ONE path, not across paths

### Day 13

*5 problems — 2 core, 2 drill, 1 skim.*

#### `[CORE]` 1. Critical Connections in a Network &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 1192

<!-- id:graphs-critical-connections-in-a-network | order:27 | day:13 | pattern:tarjan-bridges | template:T-GRAPH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/critical-connections-in-a-network/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/graph/bridges-in-graph-using-tarjans-algorithm-of-time-in-and-low-time-g-55/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=qrAub5z8FeA)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `tarjan-bridges`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A bridge is an edge whose removal disconnects the graph. Tarjan's insight is to track, for each vertex, the lowest discovery time reachable from its subtree - if a child cannot reach the parent or above except through their shared edge, that edge is a bridge.

**Trick.** DFS recording `disc[u]` and `low[u]`. The edge (u, v) is a bridge exactly when `low[v] > disc[u]`. Skip the edge back to the parent, but not other edges to visited nodes.

**Edge cases that bite.**

- Skipping ALL visited neighbours is wrong - back edges to ancestors are what make low[] meaningful.
- Parallel edges mean no bridge; track the parent edge id rather than the parent vertex.
- The graph may be disconnected - loop over all vertices as roots.

**Complexity.** `O(V + E)` time, `O(V + E)` space — one DFS computing two timestamps per vertex. The naive approach removes each edge and tests connectivity, which is O(E · (V+E)).

**Same pattern.** [Number of Provinces](https://leetcode.com/problems/number-of-provinces/), [Redundant Connection](https://leetcode.com/problems/redundant-connection/), [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/)

**Interview follow-ups.**

- **Q.** Why does low[v] > disc[u] mean a bridge?
  <br>**A.** low[v] is the earliest-discovered vertex reachable from v's subtree. If that is still later than u's discovery, nothing in the subtree has a back edge bypassing (u,v), so removing it severs the subtree.
- **Q.** Articulation points.
  <br>**A.** Nearly the same DFS with `low[v] >= disc[u]` and a special case for the root, which is an articulation point only if it has two or more DFS children.
- **Q.** Strongly connected components.
  <br>**A.** The same disc/low machinery gives Tarjan's SCC algorithm. Learning low[] once pays three times.

</details>

#### `[CORE]` 2. Longest Increasing Path in a Matrix &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 329

<!-- id:graphs-longest-increasing-path-in-a-matrix | order:29 | day:13 | pattern:memoised-dag-dfs | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `memoised-dag-dfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Because moves must strictly increase, the grid is implicitly a DAG - no cycles are possible. That is what makes memoisation valid without any visited set, and it is the bridge between graph traversal and DP.

**Trick.** DFS from every cell returning the longest path starting there, caching the result. Strict increase guarantees acyclicity, so the memo is sound.

**Edge cases that bite.**

- No visited array needed - strict monotonicity prevents cycles.
- Without memoisation this is exponential.
- A single cell has path length 1, not 0.

**Complexity.** `O(m·n)` time, `O(m·n)` space — each cell's answer is computed once and reused, with four edge checks each.

**Same pattern.** [Course Schedule](https://leetcode.com/problems/course-schedule/), [All Paths From Source to Target](https://leetcode.com/problems/all-paths-from-source-to-target/), [Unique Paths](https://leetcode.com/problems/unique-paths/), [Word Search](https://leetcode.com/problems/word-search/)

**Interview follow-ups.**

- **Q.** Why is a visited set unnecessary?
  <br>**A.** Each move strictly increases the value, so no path can return to a cell. The graph is a DAG, and DAGs admit memoisation without cycle handling.
- **Q.** Solve it with topological order instead.
  <br>**A.** Sort cells by value and process in increasing order, so every predecessor is already computed. Same bound, no recursion - and it makes the DAG structure explicit.
- **Q.** This is DP on a graph. Where is the boundary?
  <br>**A.** Memoised DFS on a DAG IS dynamic programming. Trees and grids are the DAGs where you meet it first.

</details>

#### `[DRILL]` 3. Find the City With the Smallest Number of Neighbors at a Threshold Distance &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1334

<!-- id:graphs-find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance | order:28 | day:13 | pattern:floyd-warshall | template:T-GRAPH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-the-city-with-the-smallest-number-of-neighbours-at-a-threshold-distance-g-43/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9XybHVqTHcQ)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `floyd-warshall`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** All-pairs shortest paths with n <= 100. That constraint is the problem telling you an O(n^3) algorithm is intended, and Floyd-Warshall is three nested loops with the intermediate vertex OUTERMOST.

**Trick.** `for k, for i, for j: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`. The k loop must be outermost - it is the DP dimension 'paths using only the first k vertices'.

**Edge cases that bite.**

- k outermost. Putting it innermost silently computes something wrong.
- Initialise non-edges to a large sentinel, but small enough that adding two does not overflow.
- Ties on the city count break toward the LARGEST index.

**Complexity.** `O(n³)` time, `O(n²)` space — three nested loops over n = 100 is 10^6 operations. Running Dijkstra from each vertex is O(V·(V+E) log V), which is also fine here but more code.

**Same pattern.** [Network Delay Time](https://leetcode.com/problems/network-delay-time/), [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/), [Evaluate Division](https://leetcode.com/problems/evaluate-division/)

**Interview follow-ups.**

- **Q.** Why must k be the outer loop?
  <br>**A.** dist after iteration k means 'shortest paths using intermediates from the first k vertices'. That recurrence requires all i,j pairs updated for one k before moving to k+1.
- **Q.** When is Floyd-Warshall the right choice over repeated Dijkstra?
  <br>**A.** When V is small - a few hundred - or when the graph is dense, or when you need all pairs and want twenty lines rather than a heap.
- **Q.** Does it handle negative edges?
  <br>**A.** Yes, unlike Dijkstra, and a negative value on the diagonal afterwards reveals a negative cycle.

</details>

#### `[DRILL]` 4. Minimum Height Trees &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 310

<!-- id:graphs-minimum-height-trees | order:30 | day:13 | pattern:indegree-peeling | template:T-GRAPH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-height-trees/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `indegree-peeling`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Trying every vertex as a root is O(V^2). The insight is that the best roots are the tree's centroids, and peeling leaves layer by layer - the same mechanic as Kahn's algorithm - converges on them.

**Trick.** Repeatedly remove all degree-1 vertices. The last one or two remaining are the centroids and therefore the answer.

**Edge cases that bite.**

- A tree has at most two centroids - stop when 2 or fewer vertices remain.
- n = 1 returns [0]; n = 2 returns both.
- Degrees must be decremented as neighbours are removed, exactly as in Kahn.

**Complexity.** `O(V + E)` time, `O(V + E)` space — each vertex is removed once. Running BFS from every vertex is O(V·(V+E)).

**Same pattern.** [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/), [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/)

**Interview follow-ups.**

- **Q.** Why at most two centroids?
  <br>**A.** If three existed, two would have to be adjacent to the third and to each other, forming a cycle - impossible in a tree.
- **Q.** Why does peeling find them?
  <br>**A.** Each peel removes the current outermost layer, so the vertices surviving longest are furthest from every leaf - which is the definition of a centroid.

</details>

#### `[SKIM]` 5. Shortest Path Visiting All Nodes &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 847

<!-- id:graphs-shortest-path-visiting-all-nodes | order:31 | day:13 | pattern:bitmask-bfs | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/shortest-path-visiting-all-nodes/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bitmask-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Visiting every node means the state is not just 'where am I' but 'where have I been'. With n <= 12, that visited set fits in a bitmask, and the state becomes (node, mask) - which is the standard way graph problems and bitmask DP meet.

**Trick.** BFS over (node, mask) pairs, starting from every node with only its own bit set. Finish when the mask is all ones. Revisiting a node with a DIFFERENT mask is legal and necessary.

**Edge cases that bite.**

- Nodes may be revisited; the (node, mask) pair is what must not repeat.
- Start from all n nodes simultaneously - the path may begin anywhere.
- n <= 12 in the constraints is the signal that 2^n states are intended.

**Complexity.** `O(2ⁿ · n²)` time, `O(2ⁿ · n)` space — 2^n masks times n positions, each expanding to n neighbours.

**Same pattern.** [Open the Lock](https://leetcode.com/problems/open-the-lock/), [Word Ladder](https://leetcode.com/problems/word-ladder/), [Subsets](https://leetcode.com/problems/subsets/), [Partition to K Equal Sum Subsets](https://leetcode.com/problems/partition-to-k-equal-sum-subsets/)

**Interview follow-ups.**

- **Q.** Why can nodes be revisited?
  <br>**A.** Revisiting with a larger visited set is progress. The state is the pair, so (3, 0b0011) and (3, 0b1011) are genuinely different situations.
- **Q.** What does n <= 12 tell you?
  <br>**A.** 2^12 = 4096, so an exponential-in-n state space is affordable. Small n bounds are nearly always a bitmask instruction.

</details>

### Day 13 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **disc and low turn one DFS into three algorithms.** Tracking each vertex's discovery time and the lowest discovery time reachable from its subtree gives bridges, articulation points and strongly connected components from the same machinery.
  <br>↳ *Critical Connections in a Network* — the bridge condition low[v] > disc[u], skipping only the parent edge and not all visited neighbours
- **The intermediate vertex must be the outermost loop.** Floyd-Warshall's state is 'shortest paths using only the first k vertices as intermediates', so every (i,j) pair must be updated for one k before moving to k+1.
  <br>↳ *Find the City With the Smallest Number of Neighbors at a Threshold Distance* — the k, i, j loop order, with n <= 100 signalling that O(n^3) is intended
- **Monotone movement makes a grid a DAG, and DAGs admit memoisation.** Strict increase means no path can return to a cell, so no visited set is needed and caching each cell's answer is sound. This is where graph traversal becomes dynamic programming.
  <br>↳ *Longest Increasing Path in a Matrix* — memoising the longest path from each cell with no visited array
- **When the state includes a visited set, bitmask it.** Small n in the constraints - 12 or 20 - is an instruction. The state becomes (position, mask), and revisiting a position with a different mask is legal and necessary.
  <br>↳ *Shortest Path Visiting All Nodes* — BFS over (node, mask) pairs starting from every node

#### From yesterday

- **Generate neighbours instead of comparing all pairs.** In an implicit graph, neighbours are defined by a rule. ↳ *Word Ladder* — trying all 26 letters at each position, O(26L), rather than comparing against every dictionary word
- **Decide what a vertex is from what the answer counts.** The edges must correspond to the unit being measured. ↳ *Bus Routes* — making each route a vertex, adjacent when they share a stop
- **Seed forbidden states into visited.** A state you may never occupy is indistinguishable, to BFS, from one already visited. ↳ *Open the Lock* — inserting every deadend into the visited set before the search begins
- **Commit after exhausting, not before.** Greedy lexicographic choice strands remaining edges in a dead end. ↳ *Reconstruct Itinerary* — appending the airport AFTER the neighbour loop, then reversing the result

#### Two days back

- **The cut property justifies every MST algorithm** — Min Cost to Connect All Points
- **DSU works on anything hashable once you index it** — Accounts Merge
- **Pick the equivalence relation deliberately** — Accounts Merge
- **Composition along a path makes division a graph problem** — Evaluate Division

#### Earlier in graphs

- A grid is a graph nobody drew for you · Sink as you go instead of keeping a visited array · Push every source before the loop starts · Solve the complement when the property is global · A flood fill can return any aggregate over its component · Mark visited when enqueuing, never when dequeuing · A map from original to copy is both the memo and the visited set · The topological order's length is the cycle check · Reverse the graph to flip the direction a property propagates · Two-colourable means no odd cycle · DSU's false return IS the cycle test · A visited set prevents revisits on ONE path, not across paths · BFS is shortest-path only when every edge costs the same · The stale-entry skip replaces decrease-key · Dijkstra only needs the cost to be monotone along a path · Adding a dimension to the state can break a greedy algorithm
