# Counting bits for every number — a bit DP

> bits(i) = bits(i >> 1) + (i & 1), or bits(i) = bits(i & (i − 1)) + 1. Fills the answer for 0..n in O(n).

## Idea

✍️ `i >> 1` is i without its last bit, and it is smaller than i — its count is already known. Add back the last bit `i & 1`.
✍️ Alternative: `i & (i − 1)` is i without its lowest set bit → count + 1.

## Template

```java
int[] countBits(int n) {
    int[] res = new int[n + 1];
    for (int i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
    return res;
}
```

## Complexity

O(n) time, versus O(n log n) for counting each number separately.
