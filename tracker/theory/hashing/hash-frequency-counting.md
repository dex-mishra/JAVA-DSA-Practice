# Frequency counting

> Count how many times each value occurs in one pass, then answer questions about counts — anagrams, majority, duplicates, first unique.

## Idea

✍️ One pass builds a table `count[value] = number of occurrences`. Every later question about "how many times" becomes an O(1) lookup instead of an O(n) scan.
✍️ Use an array when values are small and dense (letters → `int cnt[26]`), a hash map otherwise.
>> detour cpp-container-choice#rule | Array vs HashMap vs TreeMap — the one-minute rule | 1 min

## Recognise it

✍️ "anagram", "same characters", "permutation of", "appears more than", "most frequent", "first unique / non-repeating", "duplicate", "can be constructed from".
✍️ The order of elements does not matter, only the multiset of values.

## Brute force → counting

Brute force for "is t an anagram of s": sort both and compare (O(n log n)), or for each character of s, search and remove it from t (O(n²)).
✍️ Bottleneck: searching for each character individually.
✍️ Fix: two strings are anagrams exactly when every character has the same count in both. Counting is O(n) and needs no search.

## Template

```java
// two strings same multiset of lowercase letters
boolean sameCounts(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] cnt = new int[26];
    for (char c : s.toCharArray()) cnt[c - 'a']++;
    for (char c : t.toCharArray()) cnt[c - 'a']--; // cancel out
    for (int k = 0; k < 26; k++) if (cnt[k] != 0) return false;
    return true;
}

// general values
Map<Integer,Integer> freq = new HashMap<>();
for (int x : a) freq.put(x, freq.getOrDefault(x, 0) + 1);
for (Map.Entry<Integer,Integer> e : freq.entrySet()) { /* answer using counts */ }
```
✍️ One table with `++` for the first input and `--` for the second is cleaner than two tables.

## Variations

- Ransom note: every letter of the note must have count ≤ its count in the magazine (LeetCode 383).
- First unique character: count, then scan the string again and return the first index with count 1 (LeetCode 387). Two passes — the second pass restores order.
- Group anagrams: the count array itself (or the sorted string) becomes a **key** ([[hash-derived-keys]]).
- Top k frequent: count, then pick the k largest counts with a heap or buckets ([[heap-top-k]]).
- Counts inside a moving window → [[sw-frequency-map-window]].

## Pitfalls

✍️ Check lengths first for anagram-type problems: different lengths can never match, and the check avoids out-of-range assumptions.
✍️ `freq[x]` on a missing key inserts it ([[cpp-unordered-map-set#bracket-trap]]). Harmless while counting; harmful when you later use `freq.size()` as "number of distinct values".

## Complexity

O(n) time. Space O(k) for k distinct values — O(1) when the alphabet is fixed (26 letters), O(n) in general.
