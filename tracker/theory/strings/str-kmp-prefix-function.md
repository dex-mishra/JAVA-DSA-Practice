# KMP and the prefix function (recognition level)

> Linear-time pattern matching using, for each prefix, the length of its longest proper prefix that is also a suffix. Know what it is and when it is needed; code it only if asked.

## What it solves

✍️ Find all occurrences of a pattern p (length m) in a text s (length n) in **O(n + m)**, instead of O(n·m) for the naive check at every position.
✍️ Needed when n·m is too large (both up to 10⁵), or when a problem asks about repeated prefixes/suffixes ("shortest palindrome", "repeated substring pattern").

## The prefix function (lps array)

✍️ `lps[i]` = length of the longest proper prefix of `p[0..i]` that is also a suffix of it. Example: p = "ababc" → lps = [0, 0, 1, 2, 0].
✍️ On a mismatch after matching j characters, jump to `j = lps[j−1]` instead of restarting from 0 — the characters already matched tell you how much of the pattern still lines up.

## Code (for reference)

```java
int[] buildLps(String p) {
    int m = p.length(); int[] lps = new int[m];
    for (int i = 1, len = 0; i < m; ) {
        if (p.charAt(i) == p.charAt(len)) lps[i++] = ++len;
        else if (len != 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    return lps;
}
int strStr(String s, String p) {
    int[] lps = buildLps(p);
    for (int i = 0, j = 0; i < s.length(); ) {
        if (s.charAt(i) == p.charAt(j)) { i++; j++; if (j == p.length()) return i - j; }
        else if (j != 0) j = lps[j - 1];
        else i++;
    }
    return -1;
}
```

## Interview level

✍️ For campus OAs, `s.indexOf(p)` or the naive O(n·m) check usually passes. Mention KMP as the optimisation if asked "can you do better than O(n·m)?".
