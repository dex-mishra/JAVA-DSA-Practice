# Valid Palindrome

**LeetCode:** [125. Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) (Easy)  
**Day:** 3  
**Pattern:** opposite-ends  
**Role:** APPLY

## Understand

✍️ f(string) → true if, after dropping non-alphanumeric characters and ignoring case, it reads the same both ways.
- Length ≤ 2·10⁵, printable ASCII.
- "A man, a plan, a canal: Panama" → true.

## Analyse

✍️ By hand: compare the first letter with the last, skipping spaces and punctuation, moving inwards.
✍️ Hard part: skipping on both sides without running past each other.
✍️ Edges: empty after cleaning (e.g. " ", ".,") → true; "0P" → false (digits count).

## Brainstorm: brute → optimal

✍️ **1. Simple.** Build a cleaned lowercase copy, compare it with its reverse. O(n) time, O(n) space. Perfectly acceptable as a first answer.
✍️ ↳ The extra string is the only cost; the follow-up asks for O(1) space.
✍️ **2. Optimal.** Two pointers on the original string, skipping non-alphanumerics on each side, comparing lowercase forms. O(n), O(1).

## Algorithm in words

✍️ 1. l at the start, r at the end.
✍️ 2. Move l right past non-alphanumeric characters; move r left likewise (never crossing).
✍️ 3. If the lowercase characters differ, return false; else move both inwards.
✍️ 4. If the pointers meet, return true.

## Pseudocode

```
STATE   l = 0; r = n-1
LOOP    while l < r
UPDATE    while l < r and not alnum(s[l]): l++
          while l < r and not alnum(s[r]): r--
CHECK     if lower(s[l]) != lower(s[r]): return false
UPDATE    l++; r--
RETURN  true
```

## Reference Java

```java
class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }
}
```

## Dry run

"race a car" → cleaned "raceacar":
| l char | r char | equal? |
|---|---|---|
| r | r | yes |
| a | a | yes |
| c | c | yes |
| e | a | no → false |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ All non-alphanumeric → the inner loops stop at l == r → returns true.
- `tolower` on digits leaves them unchanged.

## Carry forward

✍️ Palindrome / symmetry → opposite ends, compare, move both.
✍️ Any inner skip loop must repeat the outer guard (`l < r`).

## Interview follow-ups

- *Allow deleting one character* (LeetCode 680): at the first mismatch, try skipping either side ([[str-palindrome-checks#one-deletion]]).
- *Longest palindromic substring* — expand around centers (Day 8).

## Siblings

- [Valid Palindrome II](siblings/valid-palindrome-ii/) (must)
- [Reverse Vowels of a String](siblings/reverse-vowels-of-a-string/) (optional)
- [Reverse Only Letters](siblings/reverse-only-letters/) (optional)
