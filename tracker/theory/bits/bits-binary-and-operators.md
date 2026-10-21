# Binary numbers and bitwise operators

> How integers look in binary, the six bitwise operators, shifts, and two's complement for negative numbers.

## Binary

✍️ Bit k (counting from 0 on the right) has value 2ᵏ. 13 = 1101₂ = 8 + 4 + 1.
✍️ `1 << k` is 2ᵏ (a number with only bit k set). Use `1LL << k` for k ≥ 31.

## Operators

| Op | Meaning | Example (5 = 101, 3 = 011) |
|---|---|---|
| `a & b` | 1 where both are 1 | 001 = 1 |
| `a \| b` | 1 where either is 1 | 111 = 7 |
| `a ^ b` | 1 where they differ | 110 = 6 |
| `~a` | flip every bit | … |
| `a << k` | multiply by 2ᵏ | 5 << 1 = 10 |
| `a >> k` | divide by 2ᵏ (floor, for non-negative) | 5 >> 1 = 2 |
✍️ Check bit k: `(x >> k) & 1`. Set: `x | (1 << k)`. Clear: `x & ~(1 << k)`. Toggle: `x ^ (1 << k)`.

## Negative numbers

✍️ Two's complement: `−x = ~x + 1`. So `x & (−x)` isolates the lowest set bit.
- Right-shifting a negative number keeps the sign (arithmetic shift). Cast to `unsigned` when you want logical shifts (e.g. reversing bits).

## Precedence trap

✍️ `x & 1 == 0` parses as `x & (1 == 0)`. Always parenthesise: `(x & 1) == 0`.
