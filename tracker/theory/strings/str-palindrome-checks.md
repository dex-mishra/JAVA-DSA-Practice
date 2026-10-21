# Palindrome checks

> Two-pointer palindrome checks, skipping non-alphanumeric characters, and the "delete at most one character" extension.

## Basic check

✍️ Compare `s[l]` and `s[r]` moving inwards; any mismatch → not a palindrome. O(n) time, O(1) space ([[tp-opposite-ends#palindrome]]).

## Skipping characters

```java
boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;    // inner loops also check l < r
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
        l++; r--;
    }
    return true;
}
```
✍️ Every inner `while` repeats the `l < r` guard; otherwise a string of only symbols runs out of bounds.

## At most one deletion (LeetCode 680)

✍️ At the first mismatch (l, r), the answer is yes iff `s[l+1..r]` or `s[l..r−1]` is a palindrome. Check both with the basic helper. O(n).
