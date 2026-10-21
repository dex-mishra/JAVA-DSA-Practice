# First Unique Character in a String

**LeetCode:** [387. First Unique Character in a String](https://leetcode.com/problems/first-unique-character-in-a-string/) (Easy)  
**Tier:** optional  
**How it maps from Valid Anagram:** Count in pass 1; pass 2 restores the original order and returns the first count of 1.

## Analyse

✍️ Index of the first character that appears exactly once, or −1.

## Brainstorm

✍️ For each character scan the whole string → O(n²). Two passes with counts → O(n).

## Algorithm in words

✍️ Count all letters; walk the string again and return the first index whose letter count is 1.

## Pseudocode

```
cnt[26] from s
for i in 0..n-1: if cnt[s[i]] == 1: return i
return -1
```

## Reference Java

```java
class Solution {
    public int firstUniqChar(String s) {
        int[] cnt = new int[26];
        for (char c : s.toCharArray()) cnt[c - 'a']++;
        for (int i = 0; i < s.length(); i++) if (cnt[s.charAt(i) - 'a'] == 1) return i;
        return -1;
    }
}
```

## Quick theory

✍️ Counting loses order; a second pass over the input gets it back.
