# Longest Nice Subarray

**LeetCode:** [2401. Longest Nice Subarray](https://leetcode.com/problems/longest-nice-subarray/) (Medium)  
**Tier:** optional  
**How it maps from Max Consecutive Ones III:** Window state is the OR of its elements; valid when the new element shares no bit with it.

## Analyse

✍️ Longest subarray where every pair has bitwise AND equal to 0 (no two elements share a set bit).

## Brainstorm

✍️ Keep `used` = OR of the window. Adding x is valid iff `used & x == 0`. Removing a[l] works with XOR (its bits are unique in the window). Variable window, O(n).

## Algorithm in words

✍️ While the new element conflicts, remove a[l] from `used`; then add the new element; record.

## Pseudocode

```
for r: while used & a[r]: used ^= a[l++]
    used |= a[r]; best = max(best, r-l+1)
```

## Reference Java

```java
class Solution {
    public int longestNiceSubarray(int[] a) {
        int used = 0, l = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            while ((used & a[r]) != 0) used ^= a[l++];
            used |= a[r];
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Quick theory

✍️ The window state can be any summary you can add to and remove from — even a bitmask ([[bits-binary-and-operators#operators]]).
