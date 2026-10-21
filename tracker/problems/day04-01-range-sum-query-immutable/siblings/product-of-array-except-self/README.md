# Product of Array Except Self

**LeetCode:** [238. Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) (Medium)  
**Tier:** must  
**How it maps from Range Sum Query - Immutable:** Prefix and suffix **products** instead of sums; division is banned, so combine a left pass and a right pass.

## Analyse

✍️ out[i] = product of all elements except a[i]; O(n), no division.
✍️ Division would break on zeros anyway.

## Brainstorm

✍️ Brute: for each i multiply the rest → O(n²). out[i] = (product of a[0..i−1]) × (product of a[i+1..n−1]) → a forward pass and a backward pass. Write the forward pass into out, then sweep backwards with one variable → O(1) extra.

## Algorithm in words

✍️ Pass 1: out[i] = product of everything left of i. Pass 2 from the right: multiply out[i] by a running product of everything right of i.

## Pseudocode

```
out[0] = 1
for i in 1..n-1: out[i] = out[i-1] * a[i-1]
right = 1
for i from n-1 down to 0: out[i] *= right; right *= a[i]
```

## Reference Java

```java
class Solution {
    public int[] productExceptSelf(int[] a) {
        int n = a.length;
        int[] out = new int[n];
        out[0] = 1;
        for (int i = 1; i < n; i++) out[i] = out[i - 1] * a[i - 1];
        int right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= a[i]; }
        return out;
    }
}
```

## Quick theory

✍️ "Everything except me" = left part ⊕ right part ([[ps-prefix-suffix-passes#idea]]); zeros need no special case ([[ps-prefix-suffix-passes#why-no-division]]).
