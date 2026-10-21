# Ransom Note

**LeetCode:** [383. Ransom Note](https://leetcode.com/problems/ransom-note/) (Easy)  
**Tier:** optional  
**How it maps from Valid Anagram:** Count the magazine's letters, then spend them on the note — a count may never go negative.

## Analyse

✍️ Can the note be built using each magazine letter at most once?

## Brainstorm

✍️ Count magazine letters; for each note letter decrement; if any count drops below 0 → false. O(n + m).

## Algorithm in words

✍️ Count the supply, consume the demand, fail on a shortage.

## Pseudocode

```
cnt[26] from magazine
for c in note: cnt[c]--; if cnt[c] < 0: return false
return true
```

## Reference Java

```java
class Solution {
    public boolean canConstruct(String note, String mag) {
        int[] cnt = new int[26];
        for (char c : mag.toCharArray()) cnt[c - 'a']++;
        for (char c : note.toCharArray()) if (--cnt[c - 'a'] < 0) return false;
        return true;
    }
}
```

## Quick theory

✍️ Supply/demand counting: the same ++/−− table, with an early exit on a shortage ([[hash-frequency-counting#variations]]).
