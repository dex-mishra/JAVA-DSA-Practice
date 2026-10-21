# Peaks and unimodal arrays

> Binary search works without full sortedness: if a[mid] < a[mid+1], a peak exists to the right. Compare neighbours instead of a target.

## Idea

✍️ If `a[mid] < a[mid+1]`, you are on an uphill slope; walking right must eventually reach a peak (the array ends with −∞ by the problem's convention). Keep the right half.
✍️ Otherwise `a[mid] > a[mid+1]` and mid itself or something to its left is a peak. Keep `[lo, mid]`.
✍️ This is "first true" with `ok(i) = a[i] > a[i+1]`.

## Template

```java
int findPeakElement(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;            // mid < hi, so mid+1 is valid
        if (a[mid] > a[mid + 1]) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
```

## Where it appears

Find peak element (LeetCode 162), peak index in a mountain array (LeetCode 852), find in mountain array (LeetCode 1095: peak first, then two ordinary searches).
