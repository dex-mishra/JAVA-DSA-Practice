# Prefix sums modulo k

> A subarray's sum is divisible by k exactly when the two bounding prefixes have the same remainder mod k — count equal remainders.

## Idea

✍️ `(pre[j] − pre[i]) % k == 0` ⇔ `pre[j] % k == pre[i] % k`. So count pairs of prefixes with equal remainders.
✍️ Map (or array of size k) from remainder → count, seeded with `{0: 1}`.

## Negative remainders in C++

✍️ In C++, `-3 % 5 == -3`, not 2. Normalise: `r = ((run % k) + k) % k;` Otherwise −3 and 2 (which are the same remainder) are counted as different keys.

## Where it appears

Subarray sums divisible by K (LeetCode 974), continuous subarray sum (LeetCode 523: needs length ≥ 2 → store first index, not count).
