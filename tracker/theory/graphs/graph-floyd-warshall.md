# Floyd–Warshall — all-pairs shortest paths (recognition level)

> dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) for every intermediate k. O(n³), n ≤ ~400.

## Idea

✍️ After processing intermediate vertices 0..k, `dist[i][j]` is the shortest path from i to j using only those vertices in between. Loop **k outermost**.
```java
for (int k = 0; k < n; k++)
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
      if (d[i][k] < INF && d[k][j] < INF) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
```

## When to use

✍️ Small n (≤ 400), many queries between arbitrary pairs, e.g. "city with the smallest number of neighbours within a threshold" (LeetCode 1334).
