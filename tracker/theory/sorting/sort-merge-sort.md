# Merge sort

> Split in half, sort each half recursively, merge the two sorted halves with two pointers. O(n log n) always, stable, O(n) extra space.

## Idea

✍️ Divide: split the array into two halves. Conquer: sort each half recursively (base case: 0 or 1 element is sorted). Combine: **merge** two sorted halves into one sorted array.
✍️ Merge = two pointers, one per half; repeatedly take the smaller front element. O(length) per merge.

## The merge step

```java
void merge(int[] a, int lo, int mid, int hi, int[] tmp) {
    // a[lo..mid] and a[mid+1..hi] are sorted
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];  // <= keeps it stable
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi)  tmp[k++] = a[j++];
    for (int t = lo; t <= hi; t++) a[t] = tmp[t];
}
void mergeSort(int[] a, int lo, int hi, int[] tmp) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, tmp);
    mergeSort(a, mid + 1, hi, tmp);
    merge(a, lo, mid, hi, tmp);
}
```
✍️ Allocate `tmp` **once** (size n) and pass it by reference. Allocating inside each call is a common source of TLE.

## Why O(n log n)

✍️ log₂ n levels of splitting; each level merges a total of n elements → n per level × log n levels.
✍️ Recurrence T(n) = 2T(n/2) + O(n) → O(n log n) ([[cx-recursion-complexity#three-results]]). Same in best, average and worst case.
✍️ Space O(n) for tmp + O(log n) recursion depth.

## Counting while merging

✍️ The merge step sees every pair (left element, right element) in sorted order. Anything you can count about such pairs — inversions (`a[i] > a[j]`, i < j), "reverse pairs" (`a[i] > 2·a[j]`) — can be counted during the merge in O(n log n) total.
- Count inversions: when you take `a[j]` from the right half, every remaining element of the left half (`mid − i + 1` of them) is bigger → add that.

## Interview points

- Stable: yes (with `<=` in the merge). Quick sort: no.
- Preferred for linked lists: merging lists needs no extra array, and random access (which quick sort needs) is expensive on lists ([[ll-merge-and-split]]).
- External sorting (data bigger than memory) is merge-based.
