# Group Anagrams

**LeetCode:** [49. Group Anagrams](https://leetcode.com/problems/group-anagrams/) (Medium)  
**Tier:** must  
**How it maps from Valid Anagram:** Instead of comparing two words, compute each word's canonical key and group words with equal keys.

## Analyse

✍️ Group the words that are anagrams of each other; any order.
✍️ Brute: compare every pair with Valid Anagram → O(n² · L).

## Brainstorm

✍️ Bottleneck: pairwise comparison. Fix: two words are anagrams iff their sorted forms are equal → use the sorted form as a hash-map key → O(n · L log L).
✍️ (Count signature key gives O(n · L).)

## Algorithm in words

✍️ For each word, sort a copy to get its key; append the word to groups[key]. Output all groups.

## Pseudocode

```
groups = map key → list
for w in words: key = sorted(w); groups[key].append(w)
return all lists in groups
```

## Reference Java

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] words) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String w : words) {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            String key = new String(c);
            groups.putIfAbsent(key, new ArrayList<>());
            groups.get(key).add(w);
        }
        return new ArrayList<>(groups.values());
    }
}
```

## Quick theory

✍️ "Group items that are equivalent" → canonical key + map of lists ([[hash-derived-keys#idea]]).
✍️ Key choice trade-off: sorted string vs count signature ([[hash-derived-keys#key-choice]]).
