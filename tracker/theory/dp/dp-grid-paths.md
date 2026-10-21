# Grid DP — paths moving right and down

> dp[r][c] depends on the cell above and the cell to the left. Count paths (sum), minimum path sum (min), obstacles (zero out), squares (min of three neighbours + 1).

## Idea

✍️ If movement is only right or down, cell (r, c) can only be entered from (r−1, c) or (r, c−1). So its answer depends only on those two — both computed earlier in row-major order.
✍️ First row and first column have only one way in → base cases.

## Template: minimum path sum

```java
int minPathSum(int[][] g) {
    int R = g.length, C = g[0].length;
    int[][] dp = new int[R][C];
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (r == 0 && c == 0) dp[r][c] = g[0][0];
            else if (r == 0) dp[r][c] = dp[r][c-1] + g[r][c];
            else if (c == 0) dp[r][c] = dp[r-1][c] + g[r][c];
            else dp[r][c] = Math.min(dp[r-1][c], dp[r][c-1]) + g[r][c];
        }
    return dp[R-1][C-1];
}
```
✍️ Counting unique paths: same shape with `+` instead of `min`, `dp = 1` along the first row and column.

## Obstacles

✍️ Unique paths II: an obstacle cell has `dp = 0`. Careful with the first row/column: once an obstacle appears, every cell after it in that row/column is 0 too (not 1).

## Maximal square

✍️ `dp[r][c]` = side of the largest all-1 square with its **bottom-right corner** at (r, c).
✍️ If `g[r][c] == '1'`: `dp[r][c] = 1 + min(dp[r−1][c], dp[r][c−1], dp[r−1][c−1])`. The answer is (max dp)².
✍️ Why the min: a square of side k at (r, c) needs squares of side k−1 ending above, left and diagonally — the smallest of the three limits it.

## Variations

- Triangle (LeetCode 120): bottom-up from the last row, `dp[c] = t[r][c] + min(dp[c], dp[c+1])`.
- Minimum falling path sum: each cell from three cells above.
- Dungeon game: fill from the bottom-right backwards.
- Cherry pickup II: two walkers → state (row, c1, c2) (recognition).
- Unique paths has a closed form: C(m+n−2, m−1).

## Complexity

O(R·C) time, O(C) space with one rolling row ([[dp-space-optimisation#rows]]).
