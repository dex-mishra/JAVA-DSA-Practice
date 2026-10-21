# Reverse String

**LeetCode:** [344. Reverse String](https://leetcode.com/problems/reverse-string/) (Easy)  
**Tier:** optional  
**How it maps from Two Sum II - Input Array Is Sorted:** The simplest opposite-ends loop: swap and move both pointers.

## Analyse

✍️ Reverse a char array in place, O(1) extra.

## Brainstorm

✍️ Swap a[l] and a[r], l++, r−−, until they meet.

## Algorithm in words

✍️ Swap the outermost pair, then the next pair inwards, until the middle.

## Pseudocode

```
l = 0; r = n-1
while l < r: swap(a[l], a[r]); l++; r--
```

## Reference Java

```java
class Solution {
    public void reverseString(char[] a) {
        int l = 0, r = a.length - 1;
        while (l < r) { char t = a[l]; a[l++] = a[r]; a[r--] = t; }
    }
}
```

## Quick theory

✍️ Symmetric processing = opposite ends ([[tp-opposite-ends#palindrome]]).
