# Valid Palindrome II

**LeetCode:** [680. Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/) (Easy)  
**Tier:** must  
**How it maps from Valid Palindrome:** At the first mismatch you get one deletion: try skipping the left char or the right char.

## Analyse

✍️ Can the string be a palindrome after deleting at most one character?
✍️ Brute: delete each position and check → O(n²).

## Brainstorm

✍️ Before the first mismatch everything matched, so the deletion must be one of the two mismatching characters. Check s[l+1..r] or s[l..r−1] → O(n).

## Algorithm in words

✍️ Walk inwards; on a mismatch return isPal(l+1, r) || isPal(l, r−1); if no mismatch, true.

## Pseudocode

```
while l < r:
    if s[l] != s[r]: return pal(l+1, r) or pal(l, r-1)
    l++; r--
return true
```

## Reference Java

```java
class Solution {
    private boolean pal(String s, int l, int r) {
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }
    public boolean validPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) return pal(s, l + 1, r) || pal(s, l, r - 1);
            l++; r--;
        }
        return true;
    }
}
```

## Quick theory

✍️ "At most one mistake allowed" → handle the first mistake both possible ways, then continue normally ([[str-palindrome-checks#one-deletion]]).
