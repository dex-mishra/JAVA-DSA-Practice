# Maximum Number of Vowels in a Substring of Given Length

**LeetCode:** [1456. Maximum Number of Vowels in a Substring of Given Length](https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/) (Medium)  
**Tier:** must  
**How it maps from Maximum Average Subarray I:** Same fixed window; the summary is a vowel count instead of a sum.

## Analyse

✍️ Max number of vowels in any substring of length k.

## Brainstorm

✍️ Recount each window → O(n·k). Maintain the vowel count: +1 if the entering char is a vowel, −1 if the leaving char is. O(n).

## Algorithm in words

✍️ Fixed-window skeleton with "is vowel" as the value of each character.

## Pseudocode

```
cnt = 0; best = 0
for i: cnt += vowel(s[i]); if i >= k: cnt -= vowel(s[i-k]); if i >= k-1: best = max(best, cnt)
```

## Reference Java

```java
class Solution {
    private boolean v(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
    public int maxVowels(String s, int k) {
        int cnt = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (v(s.charAt(i))) cnt++;
            if (i >= k && v(s.charAt(i - k))) cnt--;
            if (i >= k - 1) best = Math.max(best, cnt);
        }
        return best;
    }
}
```

## Quick theory

✍️ Any additive summary (sum, count of a property) slides in O(1) ([[sw-fixed-window#variations]]).
