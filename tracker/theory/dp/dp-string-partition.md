# Partition DP on strings — word break

> dp[i] = can the first i characters be split into dictionary words? dp[i] is true if some j < i has dp[j] true and s[j..i) in the dictionary.

## Idea

✍️ The last word of a valid split of `s[0..i)` is some `s[j..i)`. The part before it must itself be splittable → `dp[j]`.
✍️ `dp[0] = true` (empty prefix). `dp[i] = OR over j of (dp[j] AND s[j..i) is a word)`.

## Template

```java
boolean wordBreak(String s, List<String> words) {
    Set<String> dict = new HashSet<>(words);
    int n = s.length(), maxLen = 0;
    for (String w : words) maxLen = Math.max(maxLen, w.length());
    boolean[] dp = new boolean[n + 1];
    dp[0] = true;
    for (int i = 1; i <= n; i++)
        for (int j = i - 1; j >= Math.max(0, i - maxLen); j--)   // only lengths that can be words
            if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
    return dp[n];
}
```
✍️ Bounding j by the longest word length is a big speed-up and a good interview point.

## Variations

- Word break II: return all sentences → memoised backtracking.
- Palindrome partitioning II (min cuts): dp[i] = min cuts for the first i characters, with a precomputed palindrome table.
- Concatenated words, extra characters in a string (LeetCode 2707).

## Complexity

O(n · L · L) with substring hashing (L = max word length), O(n) space.
