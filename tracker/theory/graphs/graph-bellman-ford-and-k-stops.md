# Bellman–Ford and shortest paths with at most k edges

> Relax every edge n−1 times; after round i, dist holds the shortest paths using at most i edges. Copying dist each round enforces the "at most k stops" limit.

## Idea

✍️ A shortest path has at most n − 1 edges. Relaxing **all** edges once extends every shortest path by one more edge. After n − 1 rounds, all shortest paths are found — even with negative weights.
✍️ A further improvement in round n means a **negative cycle**.

## At most k stops (Cheapest Flights)

✍️ k stops = at most k + 1 edges. Run exactly k + 1 rounds, and in each round relax using the distances from the **previous** round (a copy), so one round adds at most one edge.
```java
int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    final int INF = 1_000_000_000;
    int[] dist = new int[n];
    Arrays.fill(dist, INF); dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        int[] nd = dist.clone();                       // copy: use last round's values
        for (int[] f : flights) {
            int u = f[0], v = f[1], w = f[2];
            if (dist[u] != INF && dist[u] + w < nd[v]) nd[v] = dist[u] + w;
        }
        dist = nd;
    }
    return dist[dst] == INF ? -1 : dist[dst];
}
```
✍️ Without the copy, one round can chain several edges and break the stop limit.

## Why plain Dijkstra fails here

✍️ Dijkstra finalises the cheapest route to a city, but that route might use too many stops; a more expensive route with fewer stops could be the only valid one. The state must include the number of stops (Dijkstra on (city, stops) also works).

## Complexity

O(k · m) for the k-stops version; O(n · m) for full Bellman–Ford.
