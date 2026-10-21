# GCD, LCM and modular arithmetic

> Euclid's algorithm, LCM without overflow, and the rules for adding and multiplying modulo 10⁹+7.

## GCD and LCM

✍️ Euclid: `gcd(a, b) = gcd(b, a % b)`, `gcd(a, 0) = a`. O(log min(a, b)). Java: `java.math.BigInteger.gcd` or a hand-written loop.
✍️ `lcm(a, b) = a / gcd(a, b) * b` — divide **first** to avoid overflow.

## Modular arithmetic

✍️ `(a + b) % M = ((a % M) + (b % M)) % M`; `(a · b) % M = ((a % M) · (b % M)) % M` — multiply in `long`.
✍️ Subtraction: `((a − b) % M + M) % M` to stay non-negative.
✍️ Division needs the modular inverse: `a / b ≡ a · b^(M−2) (mod M)` for prime M (fast power, [[rec-divide-and-conquer#fast-power]]).
