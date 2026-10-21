# Left and Right Sum Differences

**LeetCode:** [2574. Left and Right Sum Differences](https://leetcode.com/problems/left-and-right-sum-differences/) (Easy)  
**Tier:** optional  
**How it maps from Running Sum of 1d Array:** Output |leftSum − rightSum| at every index — the pivot-index idea, but recorded everywhere.

## Analyse

✍️ out[i] = |sum(a[0..i−1]) − sum(a[i+1..n−1])|.

## Brainstorm

✍️ Brute O(n²) → running `left` + total → O(n).

## Algorithm in words

✍️ Total first; walk with left; right = total − left − a[i]; store the absolute difference; add a[i] to left.

## Pseudocode

```
total = sum(a); left = 0
for i in 0..n-1: out[i] = |left - (total - left - a[i])|; left += a[i]
```

## Reference Java

```java
class Solution {
    public int[] leftRightDifference(int[] a) {
        int total = 0; for (int x : a) total += x;
        int[] out = new int[a.length];
        int left = 0;
        for (int i = 0; i < a.length; i++) {
            out[i] = Math.abs(left - (total - left - a[i]));
            left += a[i];
        }
        return out;
    }
}
```

## Quick theory

✍️ Any "left vs right of i" quantity = one running prefix + one total.
