# Reading n — converting constraints into a target complexity

> The 10⁸ operations-per-second rule and the table that maps n to the complexity you must hit.

## The 10⁸ rule

✍️ A typical judge does roughly **10⁸ simple operations per second** in C++. Time limits are usually 1–2 seconds.
✍️ So: plug n into your complexity. If the result is ≤ ~10⁸, it passes. If it is 10¹⁰, it does not.
Example: n = 10⁵ and O(n²) → 10¹⁰ → too slow. O(n log n) → 1.7·10⁶ → fine.

## The table

✍️ Learn this table by heart — it is the single most useful thing on this page.

| n up to | Target complexity | Typical techniques |
|---|---|---|
| 10–12 | O(n!) | permutations |
| 20–25 | O(2ⁿ) | subsets, bitmask, backtracking |
| 100 | O(n⁴) | brute force over 4 indices |
| 500 | O(n³) | triple loops, interval DP, Floyd–Warshall |
| 5,000 | O(n²) | 2D DP, all pairs |
| 10⁵ – 10⁶ | O(n log n) or O(n) | sorting, heaps, binary search, hashing, windows, prefix sums, greedy |
| 10⁹ and beyond | O(log n) or O(1) | binary search on value, math |

## Value constraints matter too

✍️ Values up to 10⁹: a sum of two fits in `int` barely (2·10⁹ > 2³¹−1 ≈ 2.147·10⁹ — it does NOT). Sum of many → `long`. See [[cpp-integer-overflow]].
✍️ Small value range (e.g. 0–100, lowercase letters) → counting arrays instead of maps; sometimes counting sort.
- Negative values → windows on sums break ([[sw-monotonicity-requirement]]).

## How to use it in an OA

✍️ Before coding, write `target: O(...)` at the top of your paper. If your idea is slower, do not code it yet — unless you are out of ideas, in which case code the brute force for partial marks and keep thinking.
