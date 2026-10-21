# Two-string DP — longest common subsequence

> dp[i][j] = answer for the prefixes a[0..i) and b[0..j). If the last characters match, extend dp[i−1][j−1]; otherwise take the better of dropping one character from either string.

## Idea

✍️ Two strings → state = (how much of a, how much of b): `dp[i][j]` = LCS of the first i characters of a and the first j of b.
✍️ If `a[i−1] == b[j−1]`: that character can end the common subsequence → `dp[i][j] = dp[i−1][j−1] + 1`.
✍️ Otherwise one of the two last characters is not used → `dp[i][j] = max(dp[i−1][j], dp[i][j−1])`.
✍️ Row 0 and column 0 are empty prefixes → 0.

## Template

```java
int longestCommonSubsequence(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a.charAt(i-1) == b.charAt(j-1)) ? dp[i-1][j-1] + 1
                                          : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[n][m];
}
```
✍️ Use size (n+1) × (m+1) with index i meaning "first i characters" — no special cases for empty prefixes.

## Longest palindromic subsequence = LCS(s, reverse(s))

✍️ A palindromic subsequence reads the same forwards and backwards, so it is a common subsequence of s and its reverse. Answer = LCS(s, reverse(s)).
✍️ Direct alternative: interval DP `dp[i][j]` on s[i..j]: equal ends → `2 + dp[i+1][j−1]`, else `max(dp[i+1][j], dp[i][j−1])`.

## Recognise it

✍️ Two sequences and a question about matching, aligning, transforming one into the other, or a common part ("common subsequence", "minimum deletions to make equal", "shortest common supersequence", "edit distance").

## Variations

- Minimum deletions to make two strings equal (LeetCode 583) = n + m − 2·LCS.
- Shortest common supersequence length = n + m − LCS.
- Minimum insertions to make a palindrome = n − LPS.
- Distinct subsequences, interleaving string: same 2D prefix state, different transitions.

## Complexity

O(n·m) time, O(n·m) space (O(min(n, m)) with two rows).
