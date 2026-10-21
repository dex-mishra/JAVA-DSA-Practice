# Divide and conquer

> Split the problem into independent smaller parts, solve them recursively, combine. Fast power and merge sort are the two models.

## Idea

✍️ Divide into parts (usually halves), conquer each part recursively, combine their answers.
✍️ Gains come from halving: problems that take n steps naively take log n levels when each level halves the size.

## Fast exponentiation

✍️ xⁿ = (x^(n/2))² if n is even, x·(x^(n/2))² if odd. One recursive call per level → O(log n).
```java
double myPow(double x, long n) {
    if (n < 0) { x = 1 / x; n = -n; }          // long: -Integer.MIN_VALUE overflows int
    double res = 1;
    while (n > 0) {                             // iterative version of the same idea
        if ((n & 1) != 0) res *= x;
        x *= x;
        n >>= 1;
    }
    return res;
}
```
✍️ Compute the half **once** and square it. Writing `pow(x, n/2) * pow(x, n/2)` makes two calls per level → back to O(n).

## Merge sort as the second model

✍️ Split in halves, sort each, merge in O(n) → O(n log n) ([[sort-merge-sort]]).
- Other D&C problems: maximum subarray (crossing the middle), closest pair of points, counting inversions, building a balanced BST from a sorted array.

## Pitfalls

✍️ Pow(x, n): n = Integer.MIN_VALUE cannot be negated in `int`; use `long`.
✍️ Repeating the same recursive call instead of storing its result.
