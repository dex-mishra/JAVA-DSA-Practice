# Binary search on rotated sorted arrays

> After rotation one half around mid is always sorted; check whether the target lies in that sorted half to decide which half to keep.

## Idea

✍️ A rotated sorted array (e.g. [4,5,6,7,0,1,2]) is two sorted runs. For any mid, **at least one** of `[lo, mid]` and `[mid, hi]` is fully sorted.
✍️ Find which half is sorted by comparing `a[lo]` with `a[mid]`. Then: if the target lies within that sorted half's range, go there; otherwise go to the other half.

## Template: search in rotated array (distinct values)

```java
int search(int[] a, int t) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[lo] <= a[mid]) {                       // left half [lo, mid] is sorted
            if (a[lo] <= t && t < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                     // right half [mid, hi] is sorted
            if (a[mid] < t && t <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

## Finding the minimum (the rotation point)

✍️ First index with `a[i] <= a[n−1]` — a "first true" search ([[bs-off-by-one-templates#choose-ok]]). Then the array splits into two normal sorted arrays if you prefer two plain searches.

## Pitfalls

✍️ `a[lo] <= a[mid]` needs `<=`: when lo == mid (two elements left), the left "half" is a single element and is sorted.
- With duplicates (LeetCode 81), `a[lo] == a[mid] == a[hi]` gives no information; shrink with `lo++, hi--`. Worst case becomes O(n).
