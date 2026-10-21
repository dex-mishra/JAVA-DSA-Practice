# Splitting into words and reversing

> Extracting words while skipping extra spaces, reversing word order, and the in-place reverse-twice trick.

## Splitting on spaces

✍️ Easiest: `String[] words = s.trim().split("\\s+");` — skips any amount of whitespace.
✍️ Manual (when you need control or O(1) extra space): skip spaces with a `while`, then read characters until the next space.
```java
List<String> words = new ArrayList<>(); int i = 0, n = s.length();
while (i < n) {
    while (i < n && s.charAt(i) == ' ') i++;   // skip spaces
    if (i == n) break;
    int j = i;
    while (j < n && s.charAt(j) != ' ') j++;   // [i, j) is a word
    words.add(s.substring(i, j));
    i = j;
}
```

## Reversing word order

✍️ With extra space: split, reverse the vector of words, join with single spaces.
✍️ In place (C++ strings are mutable): reverse the whole string, then reverse each word, then compact spaces with a write pointer ([[arr-read-write-pointer]]).
```
"  the sky  " → reverse all "  yks eht  " → reverse each word "  sky the  " → compact "sky the"
```

## Pitfalls

✍️ Leading, trailing and multiple spaces are the whole point of LeetCode 151 — test `"  a  b  "`.
- Joining with `res += w + " "` then trimming the final space is fine; `res = res + w` in a loop is O(n²) ([[cpp-string#building]]).
