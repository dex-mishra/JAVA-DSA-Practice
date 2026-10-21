# Matrix traversal and direction arrays

> Rows, columns, bounds checks, the dr/dc direction arrays for neighbours, and flattening (r, c) into one index.

## Basics

✍️ `int R = g.length, C = g[0].length;` Cell (r, c) is valid iff `0 <= r < R && 0 <= c < C`.
✍️ Row-major traversal: outer loop over r, inner over c (fast, cache-friendly).

## Direction arrays

```java
int[] dr = {-1, 1, 0, 0};    // up, down, left, right
int[] dc = {0, 0, -1, 1};
for (int d = 0; d < 4; d++) {
    int nr = r + dr[d], nc = c + dc[d];
    if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;   // bounds FIRST
    // use g[nr][nc]
}
```
✍️ 8 directions: add the four diagonals `(−1,−1), (−1,1), (1,−1), (1,1)`.

## Flattening a cell to an index

✍️ `id = r * C + c`, and back: `r = id / C`, `c = id % C`. Useful for union-find on grids, visited arrays and BFS queues of ints.

## Diagonals

Cells on the same **main** diagonal share `r − c`; on the same **anti**-diagonal share `r + c`. Used in N-Queens and diagonal traversal problems.
