# Merge Sorted Array

**LeetCode:** [88. Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) (Easy)  
**Tier:** optional  
**How it maps from Remove Duplicates from Sorted Array:** Write pointer again — but from the **back**, so nothing unread is overwritten.

## Analyse

✍️ nums1 has m elements plus n empty slots at the end; merge nums2 (n elements) into it, sorted, in place.

## Brainstorm

✍️ Merging from the front overwrites unread elements of nums1. From the back, the free slots are exactly where the largest elements go. Two read pointers (i = m−1, j = n−1), one write pointer (k = m+n−1).

## Algorithm in words

✍️ While nums2 has elements left: place the larger of nums1[i] and nums2[j] at k, move that pointer and k left.

## Pseudocode

```
i = m-1; j = n-1; k = m+n-1
while j >= 0:
    if i >= 0 and a[i] > b[j]: a[k--] = a[i--]
    else: a[k--] = b[j--]
```

## Reference Java

```java
class Solution {
    public void merge(int[] a, int m, int[] b, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && a[i] > b[j]) a[k--] = a[i--];
            else a[k--] = b[j--];
        }
    }
}
```

## Quick theory

✍️ Loop until nums2 is used up; leftover nums1 elements are already in place. Merge step itself: [[sort-merge-sort#merge]].
