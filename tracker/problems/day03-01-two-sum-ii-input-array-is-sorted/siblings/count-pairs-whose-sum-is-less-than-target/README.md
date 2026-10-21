# Count Pairs Whose Sum is Less than Target

**LeetCode:** [2824. Count Pairs Whose Sum is Less than Target](https://leetcode.com/problems/count-pairs-whose-sum-is-less-than-target/) (Easy)  
**Tier:** optional  
**How it maps from Two Sum II - Input Array Is Sorted:** Sort first (indices don't matter for a count), then count r − l pairs at once.

## Analyse

✍️ Count pairs i < j with a[i] + a[j] < target.

## Brainstorm

✍️ Brute O(n²). The count does not depend on positions → sort. If a[l] + a[r] < target, then a[l] pairs with every index l+1..r → add r − l, l++. Else r−−.

## Algorithm in words

✍️ Sort; opposite ends; add a block of pairs whenever the sum is small enough.

## Pseudocode

```
sort a; l = 0; r = n-1; cnt = 0
while l < r:
    if a[l] + a[r] < target: cnt += r - l; l++
    else: r--
```

## Reference Java

```java
class Solution {
    public int countPairs(int[] a, int target) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, cnt = 0;
        while (l < r) {
            if (a[l] + a[r] < target) { cnt += r - l; l++; }
            else r--;
        }
        return cnt;
    }
}
```

## Quick theory

✍️ Counting with two pointers adds a whole block at once — the trick reused in Valid Triangle Number ([[tp-fix-one-k-sum#variations]]).
