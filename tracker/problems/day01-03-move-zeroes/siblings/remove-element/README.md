# Remove Element

**LeetCode:** [27. Remove Element](https://leetcode.com/problems/remove-element/) (Easy)  
**Tier:** must  
**How it maps from Move Zeroes:** keep = "a[read] != val", and copy is enough because the tail does not matter.

## Analyse

✍️ Remove every occurrence of `val` in place; return k = number of remaining elements, which must be in a[0..k−1].

## Brainstorm

✍️ Brute: erase each match → O(n²). Optimal: read/write pointer with copy → O(n), O(1).

## Algorithm in words

✍️ write = 0; for each element not equal to val, copy it to a[write] and advance write; return write.

## Pseudocode

```
write = 0
for read in 0..n-1:
    if a[read] != val: a[write] = a[read]; write++
return write
```

## Reference Java

```java
class Solution {
    public int removeElement(int[] a, int val) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (a[read] != val) a[write++] = a[read];
        return write;
    }
}
```

## Quick theory

✍️ The same template as Move Zeroes; copy instead of swap because only a[0..k−1] is checked ([[arr-read-write-pointer#swap-vs-copy]]).
