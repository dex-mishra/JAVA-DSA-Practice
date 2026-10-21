# Characters as numbers — counting, mapping and comparing

> Using c − 'a' as an index, case handling, scanning several strings column by column, and comparing strings character by character.

## Character → index

✍️ `c − 'a'` maps 'a'..'z' to 0..25; `c − 'A'` for uppercase; `c − '0'` for digits. Use the result to index a fixed array: `int cnt[26]`.
✍️ For any printable ASCII character, `int cnt[128]` indexed by `c` directly covers everything.

## Case and character classes

✍️ `tolower(c)`, `toupper(c)`, `isalpha(c)`, `isdigit(c)`, `isalnum(c)`, `isspace(c)`.
✍️ Ignoring case: normalise every character with `tolower` before comparing or counting.

## Vertical scanning: many strings at once

✍️ Longest common prefix: look at column j of every string; stop at the first column where a string is too short or differs from the first string.
```java
String lcp(String[] v) {
    for (int j = 0; j < v[0].length(); j++)
        for (String s : v)
            if (j == s.length() || s.charAt(j) != v[0].charAt(j)) return v[0].substring(0, j);
    return v[0];
}
```
✍️ Cost O(total characters). The check `j == s.length()` must come **before** reading `s[j]`.
- Alternative: sort the strings; the LCP of the whole list is the LCP of the first and last string. O(n·L log n).

## Comparing strings

✍️ `a < b` compares lexicographically (dictionary order). "apple" < "apply" < "b". A prefix is smaller than the longer string: "app" < "apple".
- Comparison cost is O(length of the common prefix + 1).
