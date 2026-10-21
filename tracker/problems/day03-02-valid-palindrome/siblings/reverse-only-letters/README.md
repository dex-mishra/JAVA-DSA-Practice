# Reverse Only Letters

**LeetCode:** [917. Reverse Only Letters](https://leetcode.com/problems/reverse-only-letters/) (Easy)  
**Tier:** optional  
**How it maps from Valid Palindrome:** Identical shape with `isalpha` as the filter.

## Analyse

✍️ Reverse the letters, leaving every non-letter in place.

## Brainstorm

✍️ Opposite ends skipping non-letters; swap letters.

## Algorithm in words

✍️ Same as reverse vowels with the filter "is a letter".

## Pseudocode

```
while l < r: skip non-letters on both sides; swap; move inwards
```

## Reference Java

```java
class Solution {
    public String reverseOnlyLetters(String s) {
        char[] a = s.toCharArray();
        int l = 0, r = a.length - 1;
        while (l < r) {
            while (l < r && !Character.isLetter(a[l])) l++;
            while (l < r && !Character.isLetter(a[r])) r--;
            char t = a[l]; a[l++] = a[r]; a[r--] = t;
        }
        return new String(a);
    }
}
```

## Quick theory

✍️ Pattern recognition: if two problems differ only in the filter predicate, they are the same problem.
