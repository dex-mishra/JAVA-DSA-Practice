# Anagram windows — finding permutations inside a string

> A fixed window of size |p| sliding over s, with 26 counts compared against p's counts — or a single "matches" counter for O(1) comparison.

## Idea

✍️ A substring of s is an anagram of p iff it has length |p| and the same letter counts. So slide a fixed window of size |p| and compare counts.
✍️ Comparing two 26-arrays each step is O(26) → O(26n) total, which is fine.

## The O(1) comparison: a matches counter

✍️ Keep `need[26]` (p's counts minus window's counts). Track `zeros` = number of letters where `need[c] == 0`. The window is an anagram iff `zeros == 26`.
- On every add/remove, only one letter's value changes, so `zeros` changes by at most one → O(1) per step.

## Template

```java
List<Integer> findAnagrams(String s, String p) {
    List<Integer> res = new ArrayList<>(); int n = s.length(), m = p.length();
    if (m > n) return res;
    int[] want = new int[26], have = new int[26];
    for (char c : p.toCharArray()) want[c - 'a']++;
    for (int i = 0; i < n; i++) {
        have[s.charAt(i) - 'a']++;                    // enter
        if (i >= m) have[s.charAt(i - m) - 'a']--;    // leave
        if (i >= m - 1 && Arrays.equals(have, want)) res.add(i - m + 1);
    }
    return res;
}
```
✍️ `Arrays.equals` compares two `int[]`, which compares all 26 entries.

## Variations

- Permutation in string (LeetCode 567): return true on the first match.
- Minimum window containing all of t (LeetCode 76): variable window, not fixed ([[sw-variable-window]]).
