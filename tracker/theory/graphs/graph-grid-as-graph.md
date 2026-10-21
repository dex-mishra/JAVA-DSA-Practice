# Grids as graphs — flood fill

> Each cell is a vertex; its 4 neighbours are edges. DFS/BFS from a cell marks its whole region. Counting starts = counting islands.

## Idea

✍️ No adjacency list needed: the neighbours of (r, c) are the in-bounds cells among (r±1, c), (r, c±1) that satisfy the problem's condition (land, open, same colour).
✍️ **Flood fill**: starting from one cell, DFS/BFS visits its entire connected region. Mark visited cells (often by overwriting the grid).

## Template: count islands

```java
void sink(char[][] g, int r, int c) {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';                               // mark visited by sinking the land
    sink(g, r+1, c); sink(g, r-1, c); sink(g, r, c+1); sink(g, r, c-1);
}
int numIslands(char[][] g) {
    int count = 0;
    for (int r = 0; r < g.length; r++)
        for (int c = 0; c < g[0].length; c++)
            if (g[r][c] == '1') { count++; sink(g, r, c); }   // each new start = new island
    return count;
}
```
✍️ The outer double loop + "start a fill at every unvisited land cell" counts components ([[graph-connected-components]]).

## Border trick (Surrounded Regions, enclaves)

✍️ "Regions not connected to the border": flood fill **from every border cell** first and mark what you reach as safe. Everything still unmarked is enclosed.
✍️ Starting from the border is much simpler than checking for each region whether it touches the border.

## Variations

- Max area of island: the fill returns the number of cells it sank.
- Pacific Atlantic water flow: flood fill **uphill** from each ocean's border, answer = cells reached by both.
- Number of enclaves, closed islands: border trick.
- Shortest path in a grid → BFS, not DFS.

## Pitfalls

✍️ Bounds check **before** reading `g[r][c]`.
✍️ Mark at the moment of visiting, before recursing, or two neighbours visit each other forever.
✍️ Recursive DFS on a 1000×1000 all-land grid can reach depth 10⁶ — use BFS or an explicit stack if the grid is large.

## Complexity

O(R·C) time — each cell is filled once. O(R·C) worst-case stack/queue.
