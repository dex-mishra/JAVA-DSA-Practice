# Multi-source BFS

> Push every source into the queue at time 0 and run one BFS; each cell's distance is to its nearest source. Rotting oranges, distance to nearest 0, walls and gates.

## Idea

✍️ When the spread starts from **many** places at once, do not run a BFS from each source (O(k · R·C)). Put all sources in the queue initially with distance 0 and run a single BFS.
✍️ It behaves as if there were one super-source connected to all real sources. Each cell is reached first by its nearest source.

## Template: rotting oranges

```java
int orangesRotting(int[][] g) {
    int R = g.length, C = g[0].length, fresh = 0, minutes = 0;
    Deque<int[]> q = new ArrayDeque<>();
    for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) {
        if (g[r][c] == 2) q.offer(new int[]{r, c});
        else if (g[r][c] == 1) fresh++;
    }
    int[] dr = {1,-1,0,0}, dc = {0,0,1,-1};
    while (!q.isEmpty() && fresh > 0) {
        for (int sz = q.size(); sz > 0; sz--) {         // one minute = one level
            int[] cell = q.poll(); int r = cell[0], c = cell[1];
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C || g[nr][nc] != 1) continue;
                g[nr][nc] = 2; fresh--; q.offer(new int[]{nr, nc});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}
```

## Pitfalls

✍️ Counting a minute for the last level even when it rotted nothing — the `fresh > 0` loop guard prevents the extra minute.
✍️ No fresh oranges at the start → answer 0, not −1.

## Where else

01 Matrix (distance to nearest 0: sources = all zeros), walls and gates, as far from land as possible (LeetCode 1162).
