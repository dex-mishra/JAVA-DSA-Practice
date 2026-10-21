# Duplicate Zeros

**LeetCode:** [1089. Duplicate Zeros](https://leetcode.com/problems/duplicate-zeros/) (Easy)  
**Tier:** optional  
**How it maps from Remove Duplicates from Sorted Array:** Another in-place write from the back: count where each element will land, then write right to left.

## Analyse

✍️ Duplicate every zero, shifting the rest right; elements pushed past the end are dropped. In place.

## Brainstorm

✍️ Shifting on each zero → O(n²). Instead: count zeros to know the final length, then walk backwards writing each element (twice for zeros) only if its target index is inside the array.

## Algorithm in words

✍️ zeros = count; walk i from n−1 down, with target j = i + zeros (zeros before i); write a[i] at j if j < n; if a[i] is 0, decrement zeros and write another 0 at j−1 if inside.

## Pseudocode

```
z = count of zeros
for i from n-1 down to 0:
    j = i + z
    if j < n: a[j] = a[i]
    if a[i] == 0:
        z = z - 1; if j-1 < n: a[j-1] = 0
```

## Reference Java

```java
class Solution {
    public void duplicateZeros(int[] a) {
        int n = a.length, z = 0;
        for (int x : a) if (x == 0) z++;
        for (int i = n - 1; i >= 0; i--) {
            int j = i + z;
            if (j < n) a[j] = a[i];
            if (a[i] == 0) {
                z--;
                if (j - 1 < n) a[j - 1] = 0;
            }
        }
    }
}
```

## Quick theory

✍️ When writes move elements to the **right**, write from the right so you never overwrite something unread.
