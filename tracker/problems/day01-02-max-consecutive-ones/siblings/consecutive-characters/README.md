# Consecutive Characters

**LeetCode:** [1446. Consecutive Characters](https://leetcode.com/problems/consecutive-characters/) (Easy)  
**Tier:** must  
**How it maps from Max Consecutive Ones:** Same streak, but "matching" means "equal to the previous character" instead of "equal to 1".

## Analyse

✍️ Longest substring made of one repeated character. "abbcccddddeeeeedcba" → 5.

## Brainstorm

✍️ Brute: from each start count equal characters → O(n²). Optimal: streak that extends when s[i] == s[i−1], resets to **1** (not 0) otherwise — the current character alone is a run.

## Algorithm in words

✍️ cur = best = 1; for i from 1: extend if equal to previous else cur = 1; best = max.

## Pseudocode

```
cur = 1; best = 1
for i in 1..n-1:
    cur = (s[i] == s[i-1]) ? cur + 1 : 1
    best = max(best, cur)
return best
```

## Reference Java

```java
class Solution {
    public int maxPower(String s) {
        int cur = 1, best = 1;
        for (int i = 1; i < s.length(); i++) {
            cur = (s.charAt(i) == s.charAt(i - 1)) ? cur + 1 : 1;
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

## Quick theory

✍️ Reset value depends on meaning: "count of matching elements" resets to 0; "length of a run that includes me" resets to 1 ([[arr-single-pass-running-state#pitfalls]]).
