# Valid Anagram

**LeetCode:** [242. Valid Anagram](https://leetcode.com/problems/valid-anagram/) (Easy)  
**Day:** 2  
**Pattern:** frequency-count  
**Role:** APPLY

## Understand

✍️ f(s, t) → true if t is a rearrangement of s (same letters, same counts).
- Lowercase English letters, length ≤ 5·10⁴.
- "anagram", "nagaram" → true; "rat", "car" → false.

## Analyse

✍️ Order does not matter; only how many of each letter. That is a frequency question.
✍️ Hard part: none conceptually — the decision is which container to use.
✍️ Edges: different lengths → false immediately; one character.

## Brainstorm: brute → optimal

✍️ **1. Brute.** For each character of s, find and remove one copy from t. O(n²).
✍️ ↳ Bottleneck: searching t for each character.
✍️ **2. Better.** Sort both strings and compare. O(n log n).
✍️ ↳ Bottleneck: sorting establishes a full order, but we only need equal counts.
✍️ **3. Optimal.** Count letters: +1 for s, −1 for t; all 26 must end at 0. O(n) time, O(1) space (26 is a constant).
>> detour cpp-container-choice#rule | Array vs HashMap vs TreeMap — the one-minute rule | 1 min

## Algorithm in words

✍️ 1. If the lengths differ, return false.
✍️ 2. Make an array of 26 zeros.
✍️ 3. For each position, add 1 for s's letter and subtract 1 for t's letter.
✍️ 4. Return true iff every entry is 0.

## Pseudocode

```
STATE   if len(s) != len(t): return false
        cnt[26] = 0
LOOP    for i in 0..n-1
UPDATE    cnt[s[i]-'a']++ ; cnt[t[i]-'a']--
CHECK   for k in 0..25: if cnt[k] != 0: return false
RETURN  true
```

## Reference Java

```java
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] cnt = new int[26];
        for (int i = 0; i < s.length(); i++) {
            cnt[s.charAt(i) - 'a']++;
            cnt[t.charAt(i) - 'a']--;
        }
        for (int k = 0; k < 26; k++) if (cnt[k] != 0) return false;
        return true;
    }
}
```

## Dry run

s = "rat", t = "car":
| i | s[i] | t[i] | changed counts |
|---|---|---|---|
| 0 | r | c | r:+1, c:−1 |
| 1 | a | a | a: 0 |
| 2 | t | r | t:+1, r:0 |
Final non-zeros: c = −1, t = +1 → false.

## Edge cases and complexity

✍️ O(n) time, O(1) space (fixed 26 counters).
- Unicode follow-up: the alphabet is no longer small → a HashMap keyed by code point.

## Carry forward

✍️ "Same multiset of items" → count, don't sort.
✍️ Two inputs to compare → one table with + and −; check all zero.
✍️ Letters only → `int cnt[26]` with `c − 'a'`.

## Interview follow-ups

- *What if inputs contain Unicode?* Hash map keyed by character.
- *Group many words into anagram groups.* The sorted word (or count signature) becomes a key ([[hash-derived-keys]]).
- *Find all anagrams of p inside s.* Fixed window of counts (Day 8, [[str-anagram-window]]).

## Siblings

- [Group Anagrams](siblings/group-anagrams/) (must)
- [Ransom Note](siblings/ransom-note/) (optional)
- [First Unique Character in a String](siblings/first-unique-character-in-a-string/) (optional)
