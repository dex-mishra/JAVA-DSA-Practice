# Edit distance

> dp[i][j] = minimum operations to turn a's first i characters into b's first j. Match → dp[i−1][j−1]; else 1 + min(insert, delete, replace).

## Idea

✍️ State as in LCS: prefixes of length i and j.
✍️ If `a[i−1] == b[j−1]`: no operation needed → `dp[i−1][j−1]`.
✍️ Else 1 + the minimum of: **replace** `dp[i−1][j−1]`, **delete** from a `dp[i−1][j]`, **insert** into a `dp[i][j−1]`.
✍️ Base cases: `dp[i][0] = i` (delete everything), `dp[0][j] = j` (insert everything).

## Template

```java
int minDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a.charAt(i-1) == b.charAt(j-1)) ? dp[i-1][j-1]
                     : 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
    return dp[n][m];
}
```

## How to remember the three moves

✍️ In the table, the three neighbours are **diagonal** (replace / match), **up** (delete a character of a), **left** (insert a character of b). Draw the 3-cell picture next to the formula in your notes.

## Complexity

O(n·m) time and space.
