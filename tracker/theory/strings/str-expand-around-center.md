# Expand around center — longest palindromic substring

> Every palindrome has a center (a character or a gap between two). Try all 2n−1 centers and expand while both sides match. O(n²) time, O(1) space.

## Idea

✍️ A palindrome mirrors around its center. Odd length → center is a character; even length → center is the gap between two characters.
✍️ For each of the 2n − 1 centers, expand `l--, r++` while `s[l] == s[r]`. The longest expansion found is the answer.

## Recognise it

✍️ "longest palindromic substring", "count palindromic substrings" (LeetCode 647: count every successful expansion step).
✍️ Substring (contiguous), not subsequence — subsequence is DP ([[dp-lcs-two-strings]]).

## Brute force → expand

Brute force: all O(n²) substrings, check each in O(n) → O(n³).
✍️ Bottleneck: checking each substring from scratch, although `s[l..r]` is a palindrome iff `s[l+1..r−1]` is a palindrome and `s[l] == s[r]`.
✍️ Fix: grow palindromes outward from their centers, so each check reuses the previous one in O(1).
(The same recurrence as a 2D DP table is also O(n²) but uses O(n²) memory.)

## Template

```java
int bestStart = 0, bestLen = 1;
void expand(String s, int l, int r) {
    int n = s.length();
    while (l >= 0 && r < n && s.charAt(l) == s.charAt(r)) { l--; r++; }
    // the palindrome is s[l+1 .. r-1], length r - l - 1
    if (r - l - 1 > bestLen) { bestLen = r - l - 1; bestStart = l + 1; }
}
String longestPalindrome(String s) {
    for (int c = 0; c < s.length(); c++) {
        expand(s, c, c);        // odd length
        expand(s, c, c + 1);    // even length
    }
    return s.substring(bestStart, bestStart + bestLen);
}
```

## Pitfalls

✍️ After the while loop, l and r have gone **one step too far**: the palindrome is `[l+1, r−1]`, length `r − l − 1`.
✍️ Forgetting even-length centers misses answers like "abba".

## Complexity

O(n²) time worst case (e.g. "aaaa…"), O(1) extra space. Manacher's algorithm achieves O(n) but is not expected in interviews.
