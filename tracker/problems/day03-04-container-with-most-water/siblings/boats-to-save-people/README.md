# Boats to Save People

**LeetCode:** [881. Boats to Save People](https://leetcode.com/problems/boats-to-save-people/) (Medium)  
**Tier:** must  
**How it maps from Container With Most Water:** Opposite ends after sorting: the heaviest person boards now; take the lightest along if they fit.

## Analyse

✍️ Each boat carries at most 2 people with total weight ≤ limit. Minimum boats.

## Brainstorm

✍️ Sort. The heaviest person must go in some boat; the best partner is the lightest (if even the lightest doesn't fit, nobody does). Greedy with l, r → O(n log n).

## Algorithm in words

✍️ Sort; while l ≤ r: if a[l] + a[r] ≤ limit, l++; always r−− and count a boat.

## Pseudocode

```
sort a; l = 0; r = n-1; boats = 0
while l <= r:
    if a[l] + a[r] <= limit: l++
    r--; boats++
```

## Reference Java

```java
class Solution {
    public int numRescueBoats(int[] a, int limit) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, boats = 0;
        while (l <= r) {
            if (a[l] + a[r] <= limit) l++;
            r--; boats++;
        }
        return boats;
    }
}
```

## Quick theory

✍️ `l <= r` here (not `<`): one person alone still needs a boat.
✍️ The "heaviest with lightest" choice is justified by an exchange argument ([[gr-what-greedy-is-and-proofs#exchange]]).
