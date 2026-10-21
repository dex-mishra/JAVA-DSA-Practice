# XOR tricks

> x ^ x = 0 and x ^ 0 = x, so XOR-ing everything cancels pairs. Single number, missing number, swap without a temp, and finding two unique numbers.

## Properties

✍️ `x ^ x = 0`, `x ^ 0 = x`, XOR is commutative and associative (order does not matter).
✍️ So XOR-ing a list where every value appears twice except one leaves exactly that one value. O(n) time, O(1) space.

## Single number

```java
int singleNumber(int[] a) {
    int x = 0;
    for (int v : a) x ^= v;
    return x;
}
```
✍️ The O(1)-space requirement rules out a hash map — and points at XOR ([[hash-boyer-moore-voting#recognise]] is the same "forbidden space is a hint" idea).

## Missing number

✍️ XOR all indices 0..n and all values: every present number cancels with its index, the missing one remains. (Or sum formula n(n+1)/2 − sum.)

## Two numbers appear once (LeetCode 260)

XOR everything → `x = a ^ b` (non-zero). Pick any set bit of x (`x & −x`): a and b differ there. Split all numbers by that bit and XOR each group separately → a and b.

## Pitfalls

✍️ XOR only cancels **pairs**. "Every element appears three times except one" (LeetCode 137) needs per-bit counting mod 3.
