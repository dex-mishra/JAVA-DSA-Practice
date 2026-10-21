# Maximize the Confusion of an Exam

**LeetCode:** [2024. Maximize the Confusion of an Exam](https://leetcode.com/problems/maximize-the-confusion-of-an-exam/) (Medium)  
**Tier:** must  
**How it maps from Longest Repeating Character Replacement:** Two-letter version of character replacement: run a budget window for "all T" and for "all F".

## Analyse

✍️ Answer key of 'T'/'F'; change at most k answers to maximise the longest run of identical answers.

## Brainstorm

✍️ Longest window with at most k 'F's (to make all T), and separately at most k 'T's. Answer = max of both. O(n).

## Algorithm in words

✍️ A helper computes the longest window containing at most k of a given letter; call it for both letters.

## Pseudocode

```
best(c): l = 0; bad = 0
    for r: bad += (s[r] == c); while bad > k: bad -= (s[l++] == c); ans = max(ans, r-l+1)
return max(best('T'), best('F'))
```

## Reference Java

```java
class Solution {
    private int longest(String s, int k, char bad) {
        int l = 0, cnt = 0, ans = 0;
        for (int r = 0; r < s.length(); r++) {
            if (s.charAt(r) == bad) cnt++;
            while (cnt > k) if (s.charAt(l++) == bad) cnt--;
            ans = Math.max(ans, r - l + 1);
        }
        return ans;
    }
    public int maxConsecutiveAnswers(String s, int k) {
        return Math.max(longest(s, k, 'T'), longest(s, k, 'F'));
    }
}
```

## Quick theory

✍️ Budget window: bad = count of the letter you would have to change ([[sw-variable-window#budget]]).
