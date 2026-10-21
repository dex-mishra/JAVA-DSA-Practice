# Max Number of K-Sum Pairs

**LeetCode:** [1679. Max Number of K-Sum Pairs](https://leetcode.com/problems/max-number-of-k-sum-pairs/) (Medium)  
**Tier:** optional  
**How it maps from Container With Most Water:** Sort + opposite ends; each exact hit removes both elements (moves both pointers).

## Analyse

✍️ Repeatedly remove two numbers summing to k; maximum number of removals.

## Brainstorm

✍️ Sort + two pointers: hit → count++, l++, r−−; small → l++; big → r−−. (Hash-map counting also works in O(n).)

## Algorithm in words

✍️ Two-sum scan that keeps going after each hit.

## Pseudocode

```
sort a; l = 0; r = n-1; ops = 0
while l < r:
    s = a[l] + a[r]
    if s == k: ops++; l++; r--
    elif s < k: l++ else: r--
```

## Reference Java

```java
class Solution {
    public int maxOperations(int[] a, int k) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, ops = 0;
        while (l < r) {
            int s = a[l] + a[r];
            if (s == k) { ops++; l++; r--; }
            else if (s < k) l++;
            else r--;
        }
        return ops;
    }
}
```

## Quick theory

✍️ Pairing up greedily on sorted data is optimal for "maximum number of disjoint pairs with sum k".
