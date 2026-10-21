# Sort Array By Parity

**LeetCode:** [905. Sort Array By Parity](https://leetcode.com/problems/sort-array-by-parity/) (Easy)  
**Tier:** optional  
**How it maps from Move Zeroes:** keep = "is even", with swap so the odds survive at the back.

## Analyse

✍️ Return the array with all evens before all odds (any order within each group).

## Brainstorm

✍️ Two new arrays → O(n) space. In place: read/write pointer with swap, keep = even. (Two pointers from both ends also works.)

## Algorithm in words

✍️ For each element that is even, swap it into a[write] and advance write.

## Pseudocode

```
write = 0
for read in 0..n-1: if a[read] % 2 == 0: swap(a[write], a[read]); write++
return a
```

## Reference Java

```java
class Solution {
    public int[] sortArrayByParity(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (a[read] % 2 == 0) { int t = a[write]; a[write] = a[read]; a[read] = t; write++; }
        return a;
    }
}
```

## Quick theory

✍️ Two-group partition = read/write + swap. Three groups = Dutch flag ([[sort-dutch-national-flag]]).
