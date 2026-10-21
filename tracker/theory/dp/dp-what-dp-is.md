# What dynamic programming is

> DP = recursion + remembering answers. It applies when the same subproblems repeat (overlap) and the best answer is built from best answers to subproblems (optimal substructure).

## The idea

✍️ Write the problem as a recursion: "the answer for size n uses answers for smaller sizes".
✍️ If that recursion computes the **same smaller answer many times**, store each answer the first time and reuse it. That is all DP is.
✍️ Cost drops from (number of calls in the recursion tree) to (number of **distinct** subproblems) × (work per subproblem).

## Overlapping subproblems

✍️ Climbing stairs: ways(n) = ways(n−1) + ways(n−2). The recursion tree calls ways(n−2) from two places, ways(n−3) from three, … → exponential. But there are only n distinct values ways(0..n).
✍️ Test for overlap: draw 3 levels of the recursion tree. If the same arguments appear twice, memoisation will help.

## Optimal substructure

✍️ The optimal answer can be assembled from optimal answers to subproblems. House robber: the best for houses 0..i is either the best for 0..i−1 (skip i) or the best for 0..i−2 plus house i (rob i).
✍️ If choosing optimally for a subproblem could hurt the overall answer, the subproblem is defined wrongly — add more information to the state ([[dp-state-design]]).

## Recognise a DP problem

✍️ "number of ways", "minimum cost / maximum value", "is it possible", "longest/shortest … subsequence".
✍️ Each step has **choices** (take or skip, which coin, which split point) and later choices depend on earlier ones.
✍️ Greedy fails on a small counterexample ([[gr-what-greedy-is-and-proofs#test]]).
✍️ n is moderate (≤ 10⁴ for O(n²), ≤ 10⁵–10⁶ for O(n)) — exponential brute force is clearly too slow.

## The recipe

✍️ 1. **State**: what does `dp[i]` (or `dp[i][j]`) mean? One precise sentence.
✍️ 2. **Transition**: how is `dp[i]` computed from smaller states? Usually "max/min/sum over the choices at step i".
✍️ 3. **Base cases**: the smallest states, answered directly.
✍️ 4. **Order**: compute states so that every state's dependencies are ready (smaller i first).
✍️ 5. **Answer**: which state (or max over states) is the final answer.
