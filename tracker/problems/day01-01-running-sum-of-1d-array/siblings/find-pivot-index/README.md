# Find Pivot Index

**LeetCode:** [724. Find Pivot Index](https://leetcode.com/problems/find-pivot-index/) (Easy)  
**Tier:** must  
**How it maps from Running Sum of 1d Array:** Same running total, but now you compare "sum to my left" with "sum to my right" = total − left − a[i].

## Analyse

✍️ Find the leftmost index i where (sum of elements left of i) equals (sum of elements right of i); −1 if none.
✍️ Brute force: for every i, add up both sides → O(n²).

## Brainstorm

✍️ Bottleneck: re-adding both sides for every i.
✍️ Fix: the total is fixed. Keep `left` as running state; then right = total − left − a[i] in O(1). → O(n).

## Algorithm in words

✍️ 1. Compute the total sum. 2. Walk i from left to right with `left = 0`. 3. If left == total − left − a[i], return i. 4. Add a[i] to left. 5. Return −1.

## Pseudocode

```
STATE   total = sum(a); left = 0
LOOP    for i in 0..n-1
CHECK     if left == total - left - a[i]: return i
UPDATE    left += a[i]          (after the check: a[i] is not on its own left)
RETURN  -1
```

## Reference Java

```java
class Solution {
    public int pivotIndex(int[] a) {
        int total = 0;
        for (int x : a) total += x;
        int left = 0;
        for (int i = 0; i < a.length; i++) {
            if (left == total - left - a[i]) return i;
            left += a[i];
        }
        return -1;
    }
}
```

## Quick theory

✍️ "Left part vs right part" problems = prefix sum + total. See [[ps-prefix-sum-basics#variations]].
- Same CHECK-then-UPDATE ordering lesson as Two Sum tomorrow.
