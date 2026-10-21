# lowerBound and upperBound — first ≥ and first >

> The two boundary searches that solve insert position, first/last occurrence and counting in a sorted array.

## Definitions

✍️ `lowerBound(x)` = index of the first element **≥ x** (n if none).
✍️ `upperBound(x)` = index of the first element **> x** (n if none).
✍️ So: insert position of x = lowerBound(x). First occurrence = lowerBound(x) if `a[that] == x`. Last occurrence = upperBound(x) − 1. Count of x = upperBound(x) − lowerBound(x).

## Template: write your own

```java
int lowerBound(int[] a, int x) {
    int lo = 0, hi = a.length;           // half-open [lo, hi): answer can be n
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) hi = mid;       // mid could be the answer: keep it
        else lo = mid + 1;               // mid is too small: discard it
    }
    return lo;                           // lo == hi == first index with a[i] >= x
}
// upperBound: same with  a[mid] > x
```
✍️ `Arrays.binarySearch` returns *some* match or `-(insertionPoint)-1`, so for boundaries write your own — "first and last position" is often asked without library calls.

## The picture

```
a     = [1, 2, 2, 2, 5]      x = 2
a[i] >= 2 ?  F  T  T  T  T   → lowerBound = 1
a[i] >  2 ?  F  F  F  F  T   → upperBound = 4
first = 1, last = 4 - 1 = 3, count = 3
```

## Pitfalls

✍️ lowerBound returns n when every element is smaller — check `idx < n` before reading `a[idx]`.
- Searching for "first occurrence" with the exact-match template and then walking left is O(n) in the worst case (all equal). Use lowerBound.
