# Maximum product subarray — tracking max and min together

> A negative number turns the smallest product into the largest, so keep both the max and the min product ending here.

## Idea

✍️ Kadane fails for products because multiplying by a negative flips order: the most negative product so far becomes the most positive after one more negative.
✍️ Keep `hi` (max product ending here) and `lo` (min product ending here). For each x: candidates are `x`, `hi·x`, `lo·x`; new hi = max, new lo = min.

## Template

```java
int maxProduct(int[] a) {
    int hi = a[0], lo = a[0], best = a[0];
    for (int i = 1; i < a.length; i++) {
        int x = a[i];
        if (x < 0) { int t = hi; hi = lo; lo = t; } // a negative flips the roles
        hi = Math.max(x, hi * x);
        lo = Math.min(x, lo * x);
        best = Math.max(best, hi);
    }
    return best;
}
```

## Pitfalls

✍️ Compute new hi and lo from the **old** values (the swap trick, or temporary variables). Updating hi then using the new hi for lo is wrong.
- Zero resets both to 0, and the `max(x, …)` restart handles the element after the zero.
