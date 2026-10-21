# Prefix sums — any range sum in O(1)

> Precompute pre[i] = sum of the first i elements; then the sum of a[l..r] is pre[r+1] − pre[l]. One O(n) pass turns every range-sum query into O(1).

## Idea

✍️ Define `pre[0] = 0` and `pre[i+1] = pre[i] + a[i]`. So `pre[i]` is the sum of the first i elements, `a[0..i−1]`.
✍️ Range sum: `sum(a[l..r]) = pre[r+1] − pre[l]`. The prefix up to r, minus the part before l.
✍️ The extra leading 0 (size n+1) removes every special case for ranges that start at index 0.

## Recognise it

✍️ Many queries of "sum from l to r" on an array that does not change.
✍️ "pivot index / equilibrium", "left sum vs right sum", "split the array into parts with sums …".
✍️ Anything that needs the sum of a subarray, repeatedly → prefix sums. Combined with "count subarrays with sum k" → [[ps-prefix-sum-hashmap]].

## Brute force → prefix sums

Brute force: for each query, loop from l to r. O(n) per query → O(n·q).
✍️ Bottleneck: different queries re-add the same overlapping elements.
✍️ Fix: add each element **once** into a running total, store every running total, and answer any range as a difference of two stored totals.

## Template

```java
class NumArray {
    private long[] pre;                 // pre[i] = a[0] + ... + a[i-1]
    public NumArray(int[] a) {
        pre = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
    }
    public int sumRange(int l, int r) { // inclusive l..r
        return (int)(pre[r + 1] - pre[l]);
    }
}
```

## The index convention (draw this)

✍️ Draw it once and keep the picture:
```
index i:     0   1   2   3          a   = [ 3, -1,  4,  2 ]
pre index: 0   1   2   3   4        pre = [0, 3,  2,  6,  8]
sum(a[1..2]) = pre[3] - pre[1] = 6 - 3 = 3  (= -1 + 4)
```
✍️ `pre[k]` sits on the boundary **before** index k. A range [l, r] is the gap between boundary l and boundary r+1.

## Variations

- Pivot index (LeetCode 724): left sum = `pre[i]`, right sum = `total − pre[i] − a[i]`; find i where they are equal. You do not even need the array — a running left sum and the total suffice.
- Product of array except self: prefix and suffix **products** ([[ps-prefix-suffix-passes]]).
- 2D range sums: `pre[r][c]` over rectangles with inclusion–exclusion ([[ps-2d-prefix-sum]]).
- XOR queries (LeetCode 1310): same idea with XOR, since `x ^ x = 0` acts like subtraction.
- Highest altitude (LeetCode 1732): the answer is the maximum prefix sum.

## Pitfalls

✍️ Off-by-one: with the size-(n+1) convention it is always `pre[r+1] − pre[l]`. Mixing conventions (sometimes `pre[i]` includes `a[i]`, sometimes not) is the main source of bugs — pick one and draw it.
✍️ Overflow: n · max|a| can exceed 2·10⁹ → store prefix sums in `long`.
✍️ Prefix sums only work when the array is **static**. If values change between queries, you need a Fenwick tree / segment tree (outside this plan).

## Complexity

Build O(n), each query O(1). Space O(n) for the prefix array.
