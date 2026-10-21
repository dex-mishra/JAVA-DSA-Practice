# The recursion tree — seeing the cost of recursion

> Draw each call as a node and its recursive calls as children; the number of nodes is the number of calls, the height is the stack depth.

## Draw it

✍️ Root = the first call. Children = the calls it makes. Leaves = base cases.
✍️ Total time ≈ (number of nodes) × (work per node). Space ≈ height of the tree.
✍️ Branching factor b, depth d → up to bᵈ nodes.

## Examples

✍️ Subsets of n elements (pick or skip each): binary tree of depth n → 2ⁿ leaves. Each leaf copies a subset of size ≤ n → O(n·2ⁿ).
✍️ Permutations: n choices, then n−1, … → n! leaves → O(n·n!).
✍️ Naive Fibonacci: binary tree of depth n, but most nodes repeat the same subproblem → memoisation collapses it to n distinct nodes ([[dp-what-dp-is#overlap]]).

## Spotting repeated subproblems

✍️ If the same arguments appear in several places in the tree, the recursion is doing repeated work → memoise (DP). If every node has different arguments (subsets, permutations), there is nothing to reuse — the output itself is exponential.
