# Length of the Longest Alphabetical Continuous Substring

**LeetCode:** [2414. Length of the Longest Alphabetical Continuous Substring](https://leetcode.com/problems/length-of-the-longest-alphabetical-continuous-substring/) (Medium)  
**Tier:** optional  
**How it maps from Max Consecutive Ones:** Streak condition "s[i] is exactly the next letter after s[i−1]".

## Analyse

✍️ Longest substring like "abc", "xyz" where each letter is the next in the alphabet.

## Brainstorm

✍️ Same streak with condition `s[i] − s[i−1] == 1`. O(n).

## Algorithm in words

✍️ Extend when consecutive letters, else reset to 1; track the best.

## Pseudocode

```
cur = best = 1
for i in 1..n-1: cur = (s[i]-s[i-1] == 1) ? cur+1 : 1; best = max(best, cur)
```

## Reference Java

```java
class Solution {
    public int longestContinuousSubstring(String s) {
        int cur = 1, best = 1;
        for (int i = 1; i < s.length(); i++) {
            cur = (s.charAt(i) - s.charAt(i - 1) == 1) ? cur + 1 : 1;
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

## Quick theory

✍️ Character arithmetic `s[i] − s[i−1]` ([[cpp-string#basics]]).
