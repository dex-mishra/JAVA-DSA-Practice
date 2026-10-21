# Minimum Window Substring

**LeetCode:** [76. Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) (Hard)  
**Tier:** optional  
**How it maps from Longest Substring Without Repeating Characters:** Shortest window that contains every character of t (with counts) — the "shortest valid" skeleton.

## Analyse

✍️ Smallest substring of s containing all characters of t, including duplicates; "" if none.

## Brainstorm

✍️ need[c] = count in t; missing = |t|. Expand r: if need[s[r]] > 0 then missing−−; need[s[r]]−−. While missing == 0 (valid): record, then remove s[l] (need++, if it becomes > 0 missing++), l++. O(n + m).

## Algorithm in words

✍️ Expand until all characters are covered; then shrink as long as it stays covered, recording the shortest.

## Pseudocode

```
need from t; missing = |t|
for r: if need[s[r]]-- > 0: missing--
    while missing == 0:
        record window; if ++need[s[l]] > 0: missing++; l++
```

## Reference Java

```java
class Solution {
    public String minWindow(String s, String t) {
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        int missing = t.length(), l = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
        for (int r = 0; r < s.length(); r++) {
            if (need[s.charAt(r)]-- > 0) missing--;
            while (missing == 0) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                if (++need[s.charAt(l)] > 0) missing++;
                l++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
    }
}
```

## Quick theory

✍️ Shortest valid: shrink **while valid**, record **inside** the loop ([[sw-variable-window#template-shortest]]).
✍️ `need` going negative just means "more than required in the window" — that is fine.
