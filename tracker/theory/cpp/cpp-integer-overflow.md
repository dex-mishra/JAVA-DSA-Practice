# Integer overflow — int, long and where sums blow up

> Ranges of int and long, the operations that overflow in DSA problems, Java's silent two's-complement wraparound, and safe patterns like mid = lo + (hi - lo) / 2.

## Ranges

✍️ `int` is 32-bit: about ±2.147·10⁹ (`Integer.MAX_VALUE` = 2,147,483,647).
✍️ `long` is 64-bit: about ±9.22·10¹⁸ (`Long.MAX_VALUE`).
✍️ Two values up to 10⁹ added together can exceed `int`. A product of two values up to 10⁵ (10¹⁰) exceeds `int`.
✍️ Java has **no unsigned integer types**; when an `int` overflows it wraps around (two's complement) and never throws — the bug is silent.

## Where it happens in DSA

✍️ Prefix sums of 10⁵ values up to 10⁴ → up to 10⁹, borderline; values up to 10⁹ → definitely `long`.
✍️ `mid = (lo + hi) / 2` overflows when lo + hi > 2·10⁹. Use `mid = lo + (hi - lo) / 2`.
✍️ Multiplying `a * b` where both are `int` overflows **before** the result widens into a `long`. Write `(long)a * b`.
✍️ Binary search on the answer with a large `hi` (e.g. sum of weights) → make lo, hi, mid `long`.

## How to spot it

✍️ Wrong answer only on large tests, negative results that should be positive → overflow (the silent wraparound).
- Default to `long` for any sum, product, or count of pairs. It costs nothing in speed.
- When you want a crash instead of a silent wrap, `Math.addExact(a, b)` / `Math.multiplyExact(a, b)` throw `ArithmeticException` on overflow.
