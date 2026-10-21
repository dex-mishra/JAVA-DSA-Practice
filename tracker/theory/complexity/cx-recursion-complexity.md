# Complexity of recursive code

> Counting calls × work per call, the recursion tree picture, and the three results you need without the full master theorem.

## Calls × work per call

✍️ Time of a recursive function = (total number of calls) × (work done inside one call, excluding the recursive calls).
✍️ Space = maximum depth of the call stack (+ any memory each call allocates and keeps).

## Three results to memorise

✍️ Halve the input and do O(1) work: T(n) = T(n/2) + O(1) → **O(log n)** (binary search, fast power).
✍️ Split in two halves and do O(n) work to combine: T(n) = 2T(n/2) + O(n) → **O(n log n)** (merge sort).
✍️ Two calls each on n−1 (branching factor 2, depth n): T(n) = 2T(n−1) + O(1) → **O(2ⁿ)** (naive Fibonacci, subsets).
- Branching factor b and depth d → about bᵈ calls.

## What memoisation does to this

✍️ With memoisation, each distinct state is computed once. Time becomes (number of distinct states) × (work per state). Fibonacci drops from O(2ⁿ) to O(n). See [[dp-memo-vs-tabulation]].
