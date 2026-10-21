# Reverse Vowels of a String

**LeetCode:** [345. Reverse Vowels of a String](https://leetcode.com/problems/reverse-vowels-of-a-string/) (Easy)  
**Tier:** optional  
**How it maps from Valid Palindrome:** Opposite ends that only stop on vowels — same skip-loop structure as Valid Palindrome.

## Analyse

✍️ Reverse only the vowels (both cases) of a string.

## Brainstorm

✍️ Move l to the next vowel, r to the previous vowel, swap, repeat.

## Algorithm in words

✍️ Skip non-vowels on both sides (guarding l < r), swap, move inwards.

## Pseudocode

```
while l < r:
    while l < r and not vowel(s[l]): l++
    while l < r and not vowel(s[r]): r--
    swap(s[l++], s[r--])
```

## Reference Java

```java
class Solution {
    private boolean v(char c) { c = Character.toLowerCase(c); return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
    public String reverseVowels(String s) {
        char[] a = s.toCharArray();
        int l = 0, r = a.length - 1;
        while (l < r) {
            while (l < r && !v(a[l])) l++;
            while (l < r && !v(a[r])) r--;
            char t = a[l]; a[l++] = a[r]; a[r--] = t;
        }
        return new String(a);
    }
}
```

## Quick theory

✍️ The skip-loop structure is reusable for any "act only on some characters" two-pointer problem.
