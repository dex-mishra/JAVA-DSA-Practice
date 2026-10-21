# Backtracking on a grid (Word Search)

> DFS from every cell, matching one character per step; mark the cell as used on the way in and restore it on the way out so other paths can use it.

## Idea

✍️ Try every cell as the start. From a cell matching `word[k]`, move to any of 4 neighbours that matches `word[k+1]`, without revisiting a cell on the **current** path.
✍️ Mark the cell (e.g. overwrite with '#') before exploring neighbours; restore it after. Unlike flood fill, cells must be restored because a different path may need them.

## Template

```java
boolean dfs(char[][] g, String w, int r, int c, int k) {
    if (k == w.length()) return true;                          // matched everything
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return false;
    if (g[r][c] != w.charAt(k)) return false;                  // also fails on '#'
    char saved = g[r][c]; g[r][c] = '#';                       // choose: mark used
    boolean found = dfs(g, w, r+1, c, k+1) || dfs(g, w, r-1, c, k+1) ||
                 dfs(g, w, r, c+1, k+1) || dfs(g, w, r, c-1, k+1);
    g[r][c] = saved;                                           // undo
    return found;
}
```

## Backtracking vs flood fill

✍️ Flood fill (islands): a visited cell stays visited forever — each cell processed once, O(R·C).
✍️ Backtracking (word search): a cell is "visited" only for the current path and restored after — cells are revisited by different paths, exponential in the word length.

## Complexity

O(R·C·3^L) worst case: each start, then up to 3 new directions per step (not going back). Pruning by character match makes it far smaller in practice.
