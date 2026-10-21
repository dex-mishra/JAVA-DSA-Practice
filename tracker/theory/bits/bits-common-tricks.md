# Common bit tricks

> n & (n−1) clears the lowest set bit, power-of-two checks, counting set bits, and enumerating subsets with masks.

## n & (n − 1)

✍️ Subtracting 1 flips the lowest set bit to 0 and every bit below it to 1; AND-ing with n clears them all. So `n & (n − 1)` removes the lowest set bit.
✍️ Power of two (exactly one bit set): `n > 0 && (n & (n − 1)) == 0`.
✍️ Count set bits (Kernighan): repeat `n &= n − 1` until 0; the number of steps = popcount. Or `Integer.bitCount(n)` (`Long.bitCount` for long).

## Enumerating subsets with masks

```java
for (int mask = 0; mask < (1 << n); mask++) {
    for (int j = 0; j < n; j++)
        if ((mask & (1 << j)) != 0) { /* item j is in this subset */ }
}
```
✍️ 2ⁿ masks × n → O(n·2ⁿ), the same as recursive subsets ([[bt-pick-or-skip]]).

## Others worth knowing

- Lowest set bit value: `n & (−n)`.
- Reverse bits / number of 1 bits: loop over 32 positions with `unsigned`.
- `x >> 1` = x / 2 and `x & 1` = x % 2 for non-negative x.
