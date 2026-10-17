---
phase: V3
title: Dynamic Programming
days: 14-21
problems: 38
generated: 2026-09-17
---

# V3 — Dynamic Programming

**Days 14–21** &nbsp;·&nbsp; **38 problems** &nbsp;·&nbsp; Every DP family that appears in interviews: 1D, grids, knapsack, subsequences, strings, stocks, LIS and interval partition.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Dynamic programming

[Striver: DP series](https://www.youtube.com/watch?v=tyB0ztf0DNY)

<!-- theory-id:t-dp -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Dynamic programming solves a problem by solving smaller instances of the same
problem and reusing those answers. Two conditions must hold:

1. **Optimal substructure** — the optimal answer is built from optimal answers to subproblems.
2. **Overlapping subproblems** — the same subproblem is reached many times.

If the first holds but not the second, you have divide and conquer or greedy, not DP. Enumerating
subsets has optimal substructure and no overlap, which is exactly why it stays exponential.

**The method, in order. Do not skip steps.**

1. **Write the brute-force recursion.** Define the state in words first — "the best total
   considering the first `i` items with `j` capacity left". If you cannot say the state in a
   sentence, you cannot write the DP.
2. **Add memoisation.** A map or array keyed on the state. This alone turns exponential into
   polynomial and is often enough.
3. **Convert to bottom-up** (tabulation) if recursion depth is a risk or you want the constant
   factor.
4. **Compress the space** if only the last few rows or columns are read.

That progression — recursion, memo, tabulate, compress — is the whole discipline. Jumping straight
to a table is how people get stuck.

**Top-down versus bottom-up.**

```cpp
// Top-down: memoised recursion. Natural, computes only reachable states.
int f(int i, vector<int>& memo) {
    if (i <= 1) return i;
    if (memo[i] != -1) return memo[i];
    return memo[i] = f(i-1, memo) + f(i-2, memo);
}
// Bottom-up: no stack risk, easier to compress.
int fib(int n) {
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
    return n ? b : 0;
}
```

**The families, and the one thing that identifies each.**

*1D DP.* State is one index. `dp[i]` depends on a constant number of earlier entries.
Climbing Stairs, House Robber, Decode Ways. Compress to two or three variables.

*2D grid DP.* State is (row, column). Transitions come from above and/or the left.
Unique Paths, Minimum Path Sum, Maximal Square. Compress to one rolling row.

*Knapsack / subset sum.* State is (item index, remaining capacity). The decisive detail is the
loop direction:

```cpp
// 0/1 — each item once. Capacity loop DOWNWARD.
for (int x : items) for (int c = cap; c >= x; c--) dp[c] = dp[c] || dp[c - x];
// Unbounded — unlimited reuse. Capacity loop UPWARD.
for (int x : items) for (int c = x; c <= cap; c++) dp[c] = min(dp[c], dp[c - x] + 1);
```

That single direction flip is the entire difference between the two. Nothing else changes.

*DP on two strings.* State is (i, j) — prefix lengths. `dp[i][j]` compares `a[i-1]` with `b[j-1]`
and takes from `dp[i-1][j-1]`, `dp[i-1][j]` or `dp[i][j-1]`. LCS, edit distance, distinct
subsequences. 1-indexing the table removes every boundary case.

*DP on stocks.* A state machine: holding or not holding, with transaction count or cooldown as
extra dimensions. Transitions are buy, sell, hold.

*LIS.* `dp[i]` = longest increasing subsequence ending at `i`, giving O(n²). The O(n log n) version
maintains an array of smallest possible tails and binary searches it.

*Interval / partition DP.* State is (i, j) — a range. You choose a split point `k` inside it and
recurse on both halves. Burst Balloons, Matrix Chain, Palindrome Partitioning II. Always O(n³) and
the constraints — n around 500 — tell you so.

*DP on squares.* `dp[i][j]` = size of the largest valid square ending at (i, j), computed as
`1 + min(up, left, diagonal)`.

**Reading the complexity off the state.** Time is (number of states) × (work per state). Space is
the number of states you must keep. For interval DP: n² states, O(n) work each, so O(n³).

**Space compression.** If `dp[i][*]` reads only `dp[i-1][*]`, keep two rows. If it reads only
`dp[i-1][j-1]` and `dp[i-1][j]`, one row plus a saved diagonal suffices. A 5000×5000 int table is
100 MB and will exceed the limit; two rows is 40 KB.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why memoisation requires overlapping subproblems.** A memo helps only when a state is reached more
than once. Naive Fibonacci reaches `f(n-2)` twice per level, so the call tree collapses from 2ⁿ nodes
to n. Generating subsets reaches every state once — each leaf is a distinct subset — so memoising
costs memory and saves nothing. Before adding a memo, ask whether the same state genuinely recurs.

**Why loop direction decides 0/1 versus unbounded.** In the compressed 1D array, `dp[c]` currently
holds the answer *before* considering the current item. Iterating capacity downward means
`dp[c - x]` is still from the previous item, so the item is used at most once. Iterating upward means
`dp[c - x]` may already include the current item, which permits reuse. The two-dimensional table
makes this explicit; compression is what makes the direction load-bearing.

A second, related trap: for counting problems, loop order decides combinations versus permutations.
Item loop outside, capacity inside counts **combinations** (order-insensitive). Capacity outside,
item inside counts **permutations**. Coin Change II wants the first; Combination Sum IV wants the
second. The code differs only in which loop is outer.

**Target Sum and the transformation.** Assigning + or − to each number looks like 2ⁿ enumeration. Let
`P` be the set receiving +. Then `sum(P) − sum(N) = target` and `sum(P) + sum(N) = total`, so
`sum(P) = (total + target) / 2`. The problem becomes counting subsets with a given sum — a knapsack.
Reject immediately when `total + target` is odd or negative. Last Stone Weight II is the same
transformation aimed at minimising a difference rather than hitting a target.

**LIS in O(n log n), and what `tails` actually is.** Maintain `tails[k]` = the smallest possible tail
of any increasing subsequence of length `k+1`. For each element, binary search for the first tail at
or above it and overwrite; append if none exists. The length of `tails` is the answer. `tails` is
**not** a valid subsequence — only its length is meaningful, and claiming otherwise is a common
error. Using `upper_bound` instead of `lower_bound` gives the longest non-decreasing version.

Russian Doll Envelopes reduces to LIS by sorting width ascending and height **descending** within
equal widths — the descending tiebreak is what prevents two equal widths from both being counted.

**Interval DP and choosing k as the last operation.** In Burst Balloons, thinking of `k` as the first
balloon burst leaves the neighbours of the subproblems undefined, because bursting changes
adjacency. Thinking of `k` as the **last** balloon burst in the range fixes the boundaries: when `k`
is burst last, its neighbours are exactly `i-1` and `j+1`, which are outside the range and therefore
stable. That reframing is the problem's entire difficulty, and the same move works for Minimum Cost
to Cut a Stick.

**Stocks as a state machine.** Model states, not decisions. With at most `k` transactions:
`buy[t] = max(buy[t], sell[t-1] − price)` and `sell[t] = max(sell[t], buy[t] + price)`. A cooldown
adds a third state. A transaction fee is subtracted at the sell transition. Unlimited transactions
collapse to summing positive daily differences, because greedy becomes exact once there is no limit
to spend.

**String DP recurrences worth knowing cold.**

- LCS: equal characters give `dp[i-1][j-1] + 1`, otherwise `max(dp[i-1][j], dp[i][j-1])`.
- Edit distance: equal gives `dp[i-1][j-1]`, otherwise `1 + min` of the three (replace, delete,
  insert).
- Distinct subsequences: equal gives `dp[i-1][j-1] + dp[i-1][j]`, otherwise `dp[i-1][j]`. Counts
  overflow, so use `unsigned long long` or reduce modulo.
- Longest palindromic subsequence = LCS of `s` and `reverse(s)`. Minimum insertions to make a
  palindrome = `n − LPS`.

**Regular expression and wildcard matching.** Both are (i, j) string DP, but `*` makes the transition
branch: for wildcard `*`, either consume a character (`dp[i-1][j]`) or match empty (`dp[i][j-1]`).
For regex, `x*` either matches zero occurrences (`dp[i][j-2]`) or one more (`dp[i-1][j]` when the
characters match). Getting the `*` branch right is the whole problem.

**Game DP.** Store the score **difference** the current player can force, not two separate scores.
`dp[i][j] = max(a[i] − dp[i+1][j], a[j] − dp[i][j-1])`. The minus sign encodes that the opponent then
plays optimally against you, which halves the state and removes the whose-turn dimension.

**When DP is the wrong tool.** If the subproblems do not overlap, it is divide and conquer. If a local
choice is provably safe, greedy is faster — and greedy's failure mode is exactly where DP is
required: Coin Change with `{1,3,4}` and target 6 breaks greedy (4+1+1) where DP finds 3+3. If the
state space is exponential and cannot be compressed, you are looking at bitmask DP at best, and
`n ≤ 20` in the constraints is the signal.

**Reconstructing the answer, not just its value.** Keep a parent or choice array alongside the DP
table and walk backwards from the final state. For space-compressed DP this is impossible — you have
discarded the history — so reconstruction forces you to keep the full table.

**The grilling chain.**

- *Write the recursion before the table.* — If asked to "just DP it", state the recurrence in words
  first; interviewers are checking that you derived it rather than recalled it.
- *Why is your memo correct?* — Overlapping subproblems; name a state reached twice.
- *0/1 or unbounded — what changes?* — The capacity loop direction, and nothing else.
- *Combinations or permutations?* — Which loop is outer.
- *LIS in O(n log n) — what is in the tails array?* — Smallest possible tails per length, not a
  subsequence.
- *Burst Balloons — why last and not first?* — Bursting changes adjacency; last-burst fixes the
  boundaries.
- *Your table is 5000×5000.* — 100 MB; compress to two rows.
- *Recover the actual subsequence.* — Parent pointers, and say that compression forfeits this.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Overlapping subproblems**

You are asked to add the same long column of figures four times during an afternoon. The second
time, you do not re-add it — you read off the answer you wrote down.

That only helps because the same question came up again. If every column were different, keeping
notes would be pure overhead. DP is worth it exactly when the questions repeat.

**Why the loop direction matters**

You are handing out sweets from a tin and writing down how many each child received.

If you read your notes from the bottom of the page upward, you see only what happened *before* this
round of sweets — so each child can receive at most one.

If you read downward, you might see an entry you made during *this* round, and accidentally give the
same child a second sweet from the same tin.

Same notes, same children. The direction you read decides whether reuse is possible.

**The state is the question you are answering**

Before you can look something up in a ledger, you have to know what the columns mean. "Best total
using the first i items with j rupees left" is a column heading.

People get stuck on DP because they start drawing the table before deciding what a cell means. Write
the sentence first and the recurrence usually writes itself.

**Why 'last balloon' rather than 'first'**

You are dismantling a row of connected pipes, and removing one changes which pipes touch each other.
If you ask "which do I remove first", every later question depends on a shape you have already
disturbed.

Ask instead "which do I remove last". That one's neighbours are whatever sat at the two ends all
along — untouched, known, stable. Now the two halves are independent problems.

**Game DP as a score difference**

Two people split a pile of money, alternating. Rather than tracking both totals, track only how far
ahead the person whose turn it is can get.

When it becomes the other person's turn, their lead is your deficit — so you subtract. One number
instead of two, and the turn is implied rather than stored.

</details>

## Problems

### Day 14

*5 problems — 4 core, 1 drill, 0 skim.*

#### `[CORE]` 1. Climbing Stairs &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 70

<!-- id:dp-climbing-stairs | order:1 | day:14 | pattern:1d-dp | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/climbing-stairs/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/climbing-stairs?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=mLfjzJsN8us)

**Asked by:** Amazon, Adobe, Apple &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `1d-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The gentlest DP there is, and the right place to practise the discipline rather than the answer. Write the recursion, add a memo, tabulate, compress - four steps on a problem where you already know the result, so the method is what you are learning.

**Trick.** ways(i) = ways(i-1) + ways(i-2), because the last move was either one step or two. Only two previous values are ever read, so compress to two variables.

**Edge cases that bite.**

- n = 1 returns 1, n = 2 returns 2 - seed both before the loop.
- The answer is Fibonacci, which overflows int around n = 46.
- This has no greedy solution; every path must be counted.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two scalars. The naive recursion is O(2^n) because ways(i-2) is reached twice per level - which is exactly the overlapping subproblem a memo removes.

**Same pattern.** [House Robber](https://leetcode.com/problems/house-robber/), [Min Cost Climbing Stairs](https://leetcode.com/problems/min-cost-climbing-stairs/), [Decode Ways](https://leetcode.com/problems/decode-ways/), [Fibonacci Number](https://leetcode.com/problems/fibonacci-number/)

**Interview follow-ups.**

- **Q.** Steps of size 1, 2 or 3.
  <br>**A.** Three terms instead of two. The state is unchanged; only the transition widens - which is how most DP generalisations work.
- **Q.** Each step has a cost and you minimise it.
  <br>**A.** LC 746 - same recurrence with min and a cost added. Counting becomes optimising with one operator change.
- **Q.** Why is the naive recursion exponential?
  <br>**A.** ways(i-2) is computed independently by both ways(i-1) and ways(i). The call tree branches twice at every level, giving ~2^n nodes for n distinct states.

</details>

#### `[CORE]` 2. House Robber &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 198

<!-- id:dp-house-robber | order:2 | day:14 | pattern:1d-dp-skip | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/house-robber/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/maximum-sum-of-non-adjacent-elements?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=GrMBfJNk_NY)

**Asked by:** Amazon, Google, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `1d-dp-skip`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Adjacency constraints become DP by making the choice explicit: at each house you either take it and skip the previous, or skip it and keep the previous best. Two options, one max, state is one index.

**Trick.** dp[i] = max(dp[i-1], dp[i-2] + a[i]). Only two previous values are read, so two variables suffice - prev1 and prev2.

**Edge cases that bite.**

- Single house returns its value.
- All values are non-negative here, so no clamping is needed.
- The greedy 'take every other house' fails on [2,1,1,2] - it gives 3, the answer is 4.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two scalars.

**Same pattern.** [House Robber II](https://leetcode.com/problems/house-robber-ii/), [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/), [Delete and Earn](https://leetcode.com/problems/delete-and-earn/)

**Interview follow-ups.**

- **Q.** Houses in a circle.
  <br>**A.** LC 213 - the first and last are now adjacent, so run the linear version twice: once excluding the first house, once excluding the last, and take the maximum.
- **Q.** Houses arranged in a binary tree.
  <br>**A.** LC 337 - return a {robbed, notRobbed} pair from each node. Same two-state idea on a different structure.
- **Q.** Why does greedy fail?
  <br>**A.** [2,1,1,2]: alternating takes 2+1=3. The optimum skips two middles and takes 2+2=4. A local choice can block a strictly better future, which is the signature of DP over greedy.

</details>

#### `[CORE]` 3. Decode Ways &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 91

<!-- id:dp-decode-ways | order:4 | day:14 | pattern:1d-dp-with-validity | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/decode-ways/)

**Asked by:** Facebook, Amazon, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `1d-dp-with-validity`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Same two-term recurrence as Climbing Stairs, but each term is conditional on validity. That is the general upgrade from counting paths to counting valid paths, and zeros are what make it genuinely fiddly.

**Trick.** dp[i] = (s[i-1] != '0' ? dp[i-1] : 0) + (valid two-digit ending at i ? dp[i-2] : 0). A two-digit code is valid only in 10..26.

**Edge cases that bite.**

- A leading '0' makes the whole string undecodable - return 0.
- '06' is not a valid two-digit code; only 10 through 26 are.
- '100' is 1 way, '101' is 1 way, '110' is 1 way - work these by hand before coding.
- dp[0] = 1 for the empty prefix.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two scalars and constant-time validity checks.

**Same pattern.** [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/), [Word Break](https://leetcode.com/problems/word-break/), [Word Break](https://leetcode.com/problems/word-break/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/)

**Interview follow-ups.**

- **Q.** The string may contain '*' matching any digit 1-9.
  <br>**A.** LC 639 - each term becomes a count of valid digit choices rather than 0 or 1. Substantially more case analysis, same recurrence shape.
- **Q.** Why is dp[0] = 1?
  <br>**A.** The empty prefix has exactly one decoding - the empty one. Seeding it to 0 breaks every two-digit code starting at index 0.

</details>

#### `[CORE]` 4. Unique Paths &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 62

<!-- id:dp-unique-paths | order:5 | day:14 | pattern:2d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/unique-paths/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/grid-unique-paths?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=sdE0A2Oxofw)

**Asked by:** Amazon, Google, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `2d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The first 2D state. Paths to a cell are paths from above plus paths from the left, which is the grid analogue of the two-term 1D recurrence. Only the previous row is ever read, so one rolling row suffices.

**Trick.** dp[j] += dp[j-1] walking each row left to right. Before the update dp[j] holds the row above; after it, the current row. One array, no second dimension.

**Edge cases that bite.**

- First row and first column are all 1 - initialise the row to 1s.
- A 1xN or Nx1 grid has exactly one path.
- The combinatorial answer is C(m+n-2, m-1), computable in O(min(m,n)).

**Complexity.** `O(m·n)` time, `O(n)` space — every cell is computed once from two neighbours. The rolling row drops the space from O(mn) to O(n).

**Same pattern.** [Unique Paths II](https://leetcode.com/problems/unique-paths-ii/), [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Triangle](https://leetcode.com/problems/triangle/), [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/)

**Interview follow-ups.**

- **Q.** Do it in O(min(m,n)) time.
  <br>**A.** It is a binomial coefficient: you make m-1 downs and n-1 rights in any order, so C(m+n-2, m-1). Compute it iteratively to avoid factorial overflow.
- **Q.** Why does one rolling row work?
  <br>**A.** dp[i][j] reads only dp[i-1][j] and dp[i][j-1]. Walking left to right, dp[j] still holds the row above when you read it, and dp[j-1] already holds the current row.

</details>

#### `[DRILL]` 5. House Robber II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 213

<!-- id:dp-house-robber-ii | order:3 | day:14 | pattern:circular-reduction | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/house-robber-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/house-robber?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3WaxQMELSkw)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `circular-reduction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Circularity is handled by reducing to two linear instances rather than inventing a circular recurrence. Either the first house is robbed or it is not, and those two cases are each a plain House Robber.

**Trick.** Run the linear solver on a[0..n-2] and on a[1..n-1], and take the maximum. The first excludes the last house, the second excludes the first, so they can never both be taken.

**Edge cases that bite.**

- n = 1 must be special-cased - both slices would be empty.
- n = 2 returns the maximum of the two.
- Do not try to patch the recurrence for wraparound; the two-run reduction is cleaner and provably correct.

**Complexity.** `O(n)` time, `O(1)` space — two linear passes. Reduction to a solved subproblem is the technique, not the arithmetic.

**Same pattern.** [House Robber](https://leetcode.com/problems/house-robber/), [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Maximum Sum Circular Subarray](https://leetcode.com/problems/maximum-sum-circular-subarray/)

**Interview follow-ups.**

- **Q.** Why does the two-run reduction cover every case?
  <br>**A.** Any valid selection either includes house 0 or does not. If it does, house n-1 cannot be included, so it lies in a[0..n-2]. If it does not, it lies in a[1..n-1]. Both cases are covered and neither is over-counted.
- **Q.** Circular maximum subarray sum.
  <br>**A.** LC 918 - the same circular trick in a different form: either a normal Kadane, or the total minus the minimum subarray. Watch the all-negative case.

</details>

### Day 14 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Recursion, memo, tabulate, compress - in that order.** Write the brute-force recursion first and state the subproblem in one sentence. Jumping straight to a table is how people get stuck, because the table is meaningless until you know what a cell answers.
  <br>↳ *Climbing Stairs* — practising all four steps on a problem whose answer you already know; *House Robber* — the same progression where the choice at each index is explicit
- **Memoisation only helps when subproblems overlap.** A memo pays off when a state is reached more than once. Subset enumeration reaches each state once, which is why it stays exponential no matter what you cache.
  <br>↳ *Climbing Stairs* — ways(i-2) being reached by both ways(i-1) and ways(i), collapsing 2^n into n
- **The transition widens, the state usually does not.** Most DP generalisations change only which previous entries you read. Two terms becomes three; a plus becomes a min. Recognising this stops each variant feeling like a new problem.
  <br>↳ *Climbing Stairs* — two terms - one step or two; *Decode Ways* — the same two terms, each gated on a validity check; *Unique Paths* — the grid analogue - from above and from the left
- **Reduce circularity to two linear runs.** Rather than inventing a wraparound recurrence, split on whether the first element is used. Each case is a problem you have already solved.
  <br>↳ *House Robber II* — running the linear solver on a[0..n-2] and a[1..n-1] and taking the maximum

### Day 15

*6 problems — 2 core, 4 drill, 0 skim.*

#### `[CORE]` 1. Minimum Path Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 64

<!-- id:dp-minimum-path-sum | order:7 | day:15 | pattern:2d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-path-sum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/minimum-falling-path-sum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_rgTlyky1uQ)

**Asked by:** Amazon, Google, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `2d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting becomes optimising by swapping the plus for a min. The state, the transitions and the compression are identical to Unique Paths - which is worth noticing explicitly, because it means one template covers a whole family.

**Trick.** dp[j] = min(dp[j], dp[j-1]) + grid[i][j]. The first column has no left neighbour, so guard j > 0 rather than initialising with infinity.

**Edge cases that bite.**

- The first row accumulates left to right only; the first column top to bottom only.
- A single cell returns its own value.
- Values are non-negative here; negatives would still work but would rule out any pruning.

**Complexity.** `O(m·n)` time, `O(n)` space — one pass, rolling row.

**Same pattern.** [Unique Paths](https://leetcode.com/problems/unique-paths/), [Triangle](https://leetcode.com/problems/triangle/), [Minimum Falling Path Sum](https://leetcode.com/problems/minimum-falling-path-sum/), [Maximal Square](https://leetcode.com/problems/maximal-square/)

**Interview follow-ups.**

- **Q.** Maximise instead of minimise.
  <br>**A.** Swap min for max. The same template answers count, minimum and maximum - the operator is the only variable.
- **Q.** Return the path, not just the sum.
  <br>**A.** Keep a choice array recording whether each cell came from above or the left, then walk back from the corner. Compression forfeits this, which is the trade.

</details>

#### `[CORE]` 2. Maximal Square &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 221

<!-- id:dp-maximal-square | order:10 | day:15 | pattern:dp-on-squares | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/maximal-square/)

**Asked by:** Amazon, Google, Facebook, Airbnb &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dp-on-squares`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Define dp[i][j] as the SIDE of the largest square whose bottom-right corner is (i,j). Then it is 1 + min of the three neighbours, because a square of side k needs all three overlapping squares of side k-1 to exist. Choosing what the cell means is the whole problem.

**Trick.** dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) when the cell is '1', else 0. Track the maximum side; the answer is its square.

**Edge cases that bite.**

- min of three, not two - the diagonal is what prevents an L-shape being counted.
- The answer is the AREA, so square the maximum side.
- First row and column can only be 0 or 1.

**Complexity.** `O(m·n)` time, `O(n) with a rolling row plus a saved diagonal` space — each cell is computed once from three neighbours. The brute force checks every possible square at every cell, which is O(m·n·min(m,n)^2).

**Same pattern.** [Count Square Submatrices with All Ones](https://leetcode.com/problems/count-square-submatrices-with-all-ones/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/), [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/)

**Interview follow-ups.**

- **Q.** Why the diagonal term?
  <br>**A.** Without it, a cell with a long row of 1s above and a long column to the left would claim a large square that is actually an L. The diagonal certifies the interior is filled.
- **Q.** Largest RECTANGLE instead of square.
  <br>**A.** LC 85 - no such local recurrence exists. Run Largest Rectangle in Histogram once per row, treating consecutive 1s above as bar heights.
- **Q.** Compress to O(n) space.
  <br>**A.** One rolling row plus one saved variable for the diagonal, because dp[i-1][j-1] is overwritten before you read it.

</details>

#### `[DRILL]` 3. Unique Paths II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 63

<!-- id:dp-unique-paths-ii | order:6 | day:15 | pattern:2d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/unique-paths-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/unique-paths-ii?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=TmhpgXScLyY)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `2d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Obstacles are handled by zeroing the cell, not by branching around it. A blocked cell has zero paths through it, and the arithmetic then propagates that for free - which is the general way to encode a constraint in a DP table.

**Trick.** Set dp[j] = 0 when the cell is an obstacle, otherwise dp[j] += dp[j-1]. No special case is needed anywhere else.

**Edge cases that bite.**

- An obstacle at the start or the finish makes the answer 0.
- An obstacle in the first row blocks everything to its right in that row.
- Counts can exceed int on large grids - the constraints here keep it safe.

**Complexity.** `O(m·n)` time, `O(n)` space — one pass with a rolling row. Encoding the obstacle as a zero keeps the inner loop branch-free apart from the obstacle test itself.

**Same pattern.** [Unique Paths](https://leetcode.com/problems/unique-paths/), [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Maximal Square](https://leetcode.com/problems/maximal-square/), [Unique Paths III](https://leetcode.com/problems/unique-paths-iii/)

**Interview follow-ups.**

- **Q.** Why zero rather than skip?
  <br>**A.** Zero is the correct count of paths through a blocked cell, so the recurrence stays valid everywhere. Skipping requires the neighbours to know they were skipped.
- **Q.** You must visit every empty cell exactly once.
  <br>**A.** LC 980 - that is no longer DP. It is backtracking, because the state would need the set of visited cells.

</details>

#### `[DRILL]` 4. Triangle &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 120

<!-- id:dp-triangle | order:8 | day:15 | pattern:2d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/triangle/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/triangle?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=SrP-PiLSYC0)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `2d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rows have different lengths, which makes bottom-up the clean direction: from the last row upward, every cell has exactly two children and no boundary cases at all. Choosing the direction that removes the edge cases is the skill.

**Trick.** Start from the bottom row and work up: dp[j] = triangle[i][j] + min(dp[j], dp[j+1]). Top-down would need separate handling for the first and last element of each row.

**Edge cases that bite.**

- Bottom-up has no boundary cases; top-down has two per row.
- A single-row triangle returns its only element.
- The answer ends at dp[0].

**Complexity.** `O(n²)` time, `O(n)` space — each of the n(n+1)/2 cells is computed once, with one rolling array of size n.

**Same pattern.** [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Minimum Falling Path Sum](https://leetcode.com/problems/minimum-falling-path-sum/), [Unique Paths](https://leetcode.com/problems/unique-paths/)

**Interview follow-ups.**

- **Q.** Why is bottom-up cleaner here?
  <br>**A.** Going upward, cell (i,j) always has children (i+1,j) and (i+1,j+1), both of which exist. Going downward, the first and last elements of each row have only one parent.
- **Q.** O(n) space is the stated follow-up. Is O(1) possible?
  <br>**A.** Not without mutating the input triangle in place, which is usually acceptable if stated.

</details>

#### `[DRILL]` 5. Minimum Falling Path Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 931

<!-- id:dp-minimum-falling-path-sum | order:9 | day:15 | pattern:2d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-falling-path-sum/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `2d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Three predecessors instead of two - the cell above and both diagonals. The widening of the transition is the only change from Minimum Path Sum, which is the third time in two days that the state stayed the same and only the transition moved.

**Trick.** dp[j] = matrix[i][j] + min of the up to three entries dp[j-1], dp[j], dp[j+1] from the previous row. Guard both edges.

**Edge cases that bite.**

- First and last columns have only two predecessors.
- A 1x1 matrix returns its single value.
- Values may be negative, so initialise with a proper sentinel rather than 0.

**Complexity.** `O(n²)` time, `O(n)` space — one pass with a rolling row and three reads per cell.

**Same pattern.** [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Triangle](https://leetcode.com/problems/triangle/), [Minimum Falling Path Sum II](https://leetcode.com/problems/minimum-falling-path-sum-ii/), [Maximal Square](https://leetcode.com/problems/maximal-square/)

**Interview follow-ups.**

- **Q.** Adjacent columns are forbidden between rows.
  <br>**A.** LC 1289 - you need the two smallest values from the previous row rather than a windowed minimum, which keeps it O(n) per row instead of O(n^2).
- **Q.** Name the pattern across the last four problems.
  <br>**A.** State (row, col), transition from a small set of previous-row cells, rolling-row compression. Count, minimum and maximum are the same code with one operator changed.

</details>

#### `[DRILL]` 6. Count Square Submatrices with All Ones &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1277

<!-- id:dp-count-square-submatrices-with-all-ones | order:11 | day:15 | pattern:dp-on-squares | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/count-square-submatrices-with-all-ones/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/data-structure/count-square-submatrices-with-all-1s-dp-on-rectangles-dp-56/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=auS1fynpnjo)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dp-on-squares`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The identical recurrence as Maximal Square, but the answer is the SUM of all dp values rather than the maximum. dp[i][j] = k means there are exactly k squares ending at that cell - sides 1 through k - so summing counts every square once.

**Trick.** Same 1 + min-of-three recurrence. Accumulate every dp value into a running total.

**Edge cases that bite.**

- Sum, do not take the maximum.
- Each dp value counts k squares, not one - that is why summing is correct.
- Totals can be large on a dense grid; accumulate in long long.

**Complexity.** `O(m·n)` time, `O(n)` space — one pass with a rolling row. Enumerating all squares is O(m·n·min(m,n)).

**Same pattern.** [Maximal Square](https://leetcode.com/problems/maximal-square/), [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)

**Interview follow-ups.**

- **Q.** Why does summing count each square exactly once?
  <br>**A.** Every square has exactly one bottom-right corner. dp at that corner is its largest side k, and the squares of sides 1..k all share that corner, so k is the count there.

</details>

### Day 15 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Count, minimum and maximum are one template with one operator changed.** Grid DP for path counts, cheapest paths and richest paths share the state, the transitions and the compression. Only the combining operator differs.
  <br>↳ *Unique Paths* — sum, for counting paths; *Minimum Path Sum* — min, for the cheapest path; *Triangle* — min again, with bottom-up chosen to remove the boundary cases
- **Encode a constraint as a value, not a branch.** A blocked cell has zero paths through it, so setting it to zero propagates the constraint through the arithmetic with no special case anywhere else.
  <br>↳ *Unique Paths II* — zeroing obstacle cells instead of branching around them
- **Pick the direction that eliminates the edge cases.** Bottom-up on a triangle gives every cell exactly two children. Top-down gives the first and last of each row only one parent. Same answer, far less code.
  <br>↳ *Triangle* — working upward from the last row
- **Choosing what the cell MEANS is the problem.** Defining dp[i][j] as the side of the largest square ending at (i,j) makes the recurrence fall out. Defining it as anything else makes it intractable.
  <br>↳ *Maximal Square* — 1 + min of three neighbours, where the diagonal is what forbids an L-shape; *Count Square Submatrices with All Ones* — the identical recurrence, summed instead of maximised, because dp=k means k squares share that corner

#### From yesterday

- **Recursion, memo, tabulate, compress - in that order.** Write the brute-force recursion first and state the subproblem in one sentence. ↳ *Climbing Stairs* — practising all four steps on a problem whose answer you already know
- **Memoisation only helps when subproblems overlap.** A memo pays off when a state is reached more than once. ↳ *Climbing Stairs* — ways(i-2) being reached by both ways(i-1) and ways(i), collapsing 2^n into n
- **The transition widens, the state usually does not.** Most DP generalisations change only which previous entries you read. ↳ *Climbing Stairs* — two terms - one step or two
- **Reduce circularity to two linear runs.** Rather than inventing a wraparound recurrence, split on whether the first element is used. ↳ *House Robber II* — running the linear solver on a[0..n-2] and a[1..n-1] and taking the maximum

### Day 16

*5 problems — 4 core, 1 drill, 0 skim.*

#### `[CORE]` 1. Partition Equal Subset Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 416

<!-- id:dp-partition-equal-subset-sum | order:12 | day:16 | pattern:0-1-knapsack | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/partition-equal-subset-sum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/partition-equal-subset-sum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7win3dcgo3k)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `0-1-knapsack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Splitting into two equal halves means finding a subset summing to total/2 - the rest is forced. That reframing turns a partition question into subset sum, which is the canonical 0/1 knapsack.

**Trick.** Reject an odd total immediately. Then boolean DP over capacities, iterating capacity DOWNWARD so each number is used at most once.

**Edge cases that bite.**

- An odd total is immediately false - check before any DP.
- The capacity loop MUST run downward; upward permits reuse and gives wrong answers.
- dp[0] = true seeds the empty subset.
- A single element can only partition if it is 0.

**Complexity.** `O(n · sum)` time, `O(sum)` space — n items times sum/2 capacities, compressed to one row. The 2^n subset enumeration is what this replaces - at n = 200 that is impossible.

**Same pattern.** [Target Sum](https://leetcode.com/problems/target-sum/), [Last Stone Weight II](https://leetcode.com/problems/last-stone-weight-ii/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Ones and Zeroes](https://leetcode.com/problems/ones-and-zeroes/)

**Interview follow-ups.**

- **Q.** Why downward?
  <br>**A.** In the compressed array, dp[c - x] must still describe the state BEFORE this item. Walking downward guarantees that; walking upward may read a value already updated by this same item, which is the unbounded case.
- **Q.** Partition into k equal subsets.
  <br>**A.** LC 698 - no longer plain knapsack. It needs bitmask DP or backtracking with pruning, because you must track which elements each of the k groups took.

</details>

#### `[CORE]` 2. Target Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 494

<!-- id:dp-target-sum | order:13 | day:16 | pattern:knapsack-transformation | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/target-sum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/target-sum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=b3GD8263-PQ)

**Asked by:** Facebook, Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `knapsack-transformation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Assigning + or - to each number looks like 2^n enumeration. Let P be the set given +; then sum(P) - sum(N) = target and sum(P) + sum(N) = total, so sum(P) = (total + target)/2. The algebra converts it into counting subsets with a fixed sum.

**Trick.** Verify (total + target) is non-negative and even, then count subsets summing to half of it with a 0/1 knapsack - capacity loop downward.

**Edge cases that bite.**

- (total + target) odd, or |target| > total, means zero ways - return before the DP.
- Zeros double the count for each, which the DP handles naturally and enumeration must not miss.
- dp[0] = 1 counts the empty subset.

**Complexity.** `O(n · sum)` time, `O(sum)` space — one knapsack pass. The 2^n enumeration is 2^20 at the constraint limit - passable but far slower, and the transformation is the actual lesson.

**Same pattern.** [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/), [Last Stone Weight II](https://leetcode.com/problems/last-stone-weight-ii/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/)

**Interview follow-ups.**

- **Q.** Derive the transformation on paper.
  <br>**A.** Two equations, two unknowns. sum(P) - sum(N) = target and sum(P) + sum(N) = total give sum(P) = (total + target)/2. If that is not a non-negative integer, no assignment exists.
- **Q.** Why does this count rather than decide?
  <br>**A.** The DP stores counts rather than booleans. Same recurrence, += instead of ||.

</details>

#### `[CORE]` 3. Coin Change &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 322

<!-- id:dp-coin-change | order:15 | day:16 | pattern:unbounded-knapsack-min | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/coin-change/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/minimum-coins?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=myPeWb3Y68A)

**Asked by:** Amazon, Google, Facebook, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `unbounded-knapsack-min`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Unlimited reuse means the capacity loop runs UPWARD - the only difference from 0/1 knapsack. It is also the standard proof that greedy fails: coins {1,3,4} and target 6 give 4+1+1 greedily, where 3+3 is optimal.

**Trick.** dp[v] = min(dp[v], dp[v - coin] + 1), with the capacity loop upward so a coin can be reused. Initialise to a sentinel larger than any possible answer.

**Edge cases that bite.**

- Unreachable amounts must return -1, so the sentinel must be distinguishable.
- amount = 0 returns 0.
- Guard against adding 1 to the sentinel and overflowing - compare before adding.

**Complexity.** `O(n · amount)` time, `O(amount)` space — n coins times amount capacities. Greedy is O(n log n) and wrong.

**Same pattern.** [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/), [Perfect Squares](https://leetcode.com/problems/perfect-squares/), [Minimum Cost For Tickets](https://leetcode.com/problems/minimum-cost-for-tickets/)

**Interview follow-ups.**

- **Q.** Give the greedy counterexample.
  <br>**A.** Coins {1,3,4}, target 6. Greedy takes 4, then 1, then 1 - three coins. Optimal is 3+3 - two coins. A locally largest choice blocked a better combination.
- **Q.** Count the ways rather than minimise the coins.
  <br>**A.** LC 518 - same unbounded structure, += instead of min, and now the loop ORDER decides combinations versus permutations.

</details>

#### `[CORE]` 4. Coin Change II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 518

<!-- id:dp-coin-change-ii | order:16 | day:16 | pattern:unbounded-knapsack-count | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/coin-change-ii/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `unbounded-knapsack-count`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting combinations rather than minimising. The decisive detail is loop order: coin loop OUTSIDE counts each combination once; capacity outside would count orderings separately. That distinction is the single most-missed point in knapsack DP.

**Trick.** `for each coin: for v from coin to amount: dp[v] += dp[v - coin]`. The coin loop must be outer.

**Edge cases that bite.**

- Swapping the loops counts permutations and gives a much larger wrong answer.
- dp[0] = 1 for the empty selection.
- Counts overflow int; the constraints here keep it in range but check.

**Complexity.** `O(n · amount)` time, `O(amount)` space — one pass per coin over all capacities.

**Same pattern.** [Coin Change](https://leetcode.com/problems/coin-change/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/), [Target Sum](https://leetcode.com/problems/target-sum/), [Perfect Squares](https://leetcode.com/problems/perfect-squares/)

**Interview follow-ups.**

- **Q.** What happens if you swap the loops?
  <br>**A.** You count permutations instead of combinations - {1,2} and {2,1} become two ways. That is Combination Sum IV, which is a genuinely different problem with nearly identical code.
- **Q.** Why does coin-outer count each combination once?
  <br>**A.** Coins are considered in a fixed order, so a combination is only ever built in non-decreasing coin order. There is exactly one such ordering per multiset.

</details>

#### `[DRILL]` 5. Last Stone Weight II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1049

<!-- id:dp-last-stone-weight-ii | order:14 | day:16 | pattern:knapsack-minimise-difference | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/last-stone-weight-ii/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `knapsack-minimise-difference`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Smashing stones pairwise is really partitioning them into two groups and taking the difference of the sums. Minimising that difference means finding the achievable subset sum closest to total/2 - the same knapsack, read differently.

**Trick.** Compute all achievable subset sums up to total/2 with boolean knapsack, take the largest achievable one s, and answer total - 2s.

**Edge cases that bite.**

- The answer is total - 2s, not total/2 - s.
- A single stone returns its own weight.
- The sign juggling of 'smashing' is a red herring - any +/- assignment is reachable.

**Complexity.** `O(n · sum)` time, `O(sum)` space — one knapsack over sum/2 capacities.

**Same pattern.** [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/), [Target Sum](https://leetcode.com/problems/target-sum/), [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/)

**Interview follow-ups.**

- **Q.** Why is pairwise smashing equivalent to a two-way partition?
  <br>**A.** Each smash replaces two stones with their difference, which is the same as assigning one a + and the other a -. Any final value is therefore some +/- assignment of all stones, and every assignment is achievable.
- **Q.** How does this differ from LC 1046?
  <br>**A.** LC 1046 simulates greedily with a max-heap and is a different problem despite the name. This one is subset sum. Same story, unrelated algorithms.

</details>

### Day 16 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Loop direction is the whole difference between 0/1 and unbounded.** In the compressed array, dp[c-x] must describe the state before this item. Walking capacity downward guarantees that; walking upward lets the item be reused.
  <br>↳ *Partition Equal Subset Sum* — downward, so each number is used at most once; *Coin Change* — upward, so coins may be reused; *Ones and Zeroes* — downward on BOTH capacities, since the item is still used once
- **Algebra can turn an enumeration into a knapsack.** Two equations in two unknowns convert a +/- assignment problem into counting subsets with a fixed sum. Doing the algebra first is cheaper than optimising the search.
  <br>↳ *Target Sum* — sum(P) = (total + target)/2, with odd or negative totals rejected up front; *Last Stone Weight II* — the same partition, aimed at minimising the difference rather than hitting a target
- **Greedy's failure is where DP becomes necessary.** Coins {1,3,4} and target 6 defeat greedy: it takes 4+1+1 where 3+3 is optimal. A locally largest choice can block a strictly better combination.
  <br>↳ *Coin Change* — the canonical counterexample to greedy coin selection

#### From yesterday

- **Count, minimum and maximum are one template with one operator changed.** Grid DP for path counts, cheapest paths and richest paths share the state, the transitions and the compression. ↳ *Unique Paths* — sum, for counting paths
- **Encode a constraint as a value, not a branch.** A blocked cell has zero paths through it, so setting it to zero propagates the constraint through the arithmetic with no special case anywhere else. ↳ *Unique Paths II* — zeroing obstacle cells instead of branching around them
- **Pick the direction that eliminates the edge cases.** Bottom-up on a triangle gives every cell exactly two children. ↳ *Triangle* — working upward from the last row
- **Choosing what the cell MEANS is the problem.** Defining dp[i][j] as the side of the largest square ending at (i,j) makes the recurrence fall out. ↳ *Maximal Square* — 1 + min of three neighbours, where the diagonal is what forbids an L-shape

#### Two days back

- **Recursion, memo, tabulate, compress - in that order** — Climbing Stairs
- **Memoisation only helps when subproblems overlap** — Climbing Stairs
- **The transition widens, the state usually does not** — Climbing Stairs
- **Reduce circularity to two linear runs** — House Robber II

### Day 17

*3 problems — 0 core, 3 drill, 0 skim.*

#### `[DRILL]` 1. Combination Sum IV &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 377

<!-- id:dp-combination-sum-iv | order:17 | day:17 | pattern:unbounded-knapsack-permutations | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/combination-sum-iv/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `unbounded-knapsack-permutations`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The mirror of Coin Change II, placed immediately after it on purpose. Here order MATTERS, so the capacity loop goes outside and the number loop inside. Two problems, one line of difference.

**Trick.** `for v from 1 to target: for each num: if (num <= v) dp[v] += dp[v - num]`. Capacity outer.

**Edge cases that bite.**

- Counts overflow int quickly - use unsigned or long long.
- dp[0] = 1.
- Negative numbers would make the answer infinite, which is why the constraints forbid them.

**Complexity.** `O(target · n)` time, `O(target)` space — target capacities times n numbers.

**Same pattern.** [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Coin Change](https://leetcode.com/problems/coin-change/), [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/), [Perfect Squares](https://leetcode.com/problems/perfect-squares/)

**Interview follow-ups.**

- **Q.** Say the rule out loud.
  <br>**A.** Item loop outer counts combinations. Capacity loop outer counts permutations. Write it on the page before you write the loops.
- **Q.** What if negatives were allowed?
  <br>**A.** The count becomes infinite - you could add and subtract forever. The problem notes this, and it is the reason for the positivity constraint.

</details>

#### `[DRILL]` 2. Ones and Zeroes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 474

<!-- id:dp-ones-and-zeroes | order:18 | day:17 | pattern:two-dimensional-knapsack | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/ones-and-zeroes/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-dimensional-knapsack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A knapsack with two independent capacities instead of one. The state gains a dimension but nothing else changes - including the downward iteration, which must now run downward on both.

**Trick.** dp[i][j] over remaining zeros and ones. For each string, iterate BOTH capacities downward so each string is used at most once.

**Edge cases that bite.**

- Both loops must run downward - getting one right and one wrong is a subtle bug.
- Count zeros and ones per string once, up front.
- The answer is the maximum count, so initialise to 0 rather than a sentinel.

**Complexity.** `O(L · m · n)` time, `O(m · n)` space — L strings times the m×n capacity grid, compressed from three dimensions to two.

**Same pattern.** [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/), [Target Sum](https://leetcode.com/problems/target-sum/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/)

**Interview follow-ups.**

- **Q.** Why must both loops run downward?
  <br>**A.** The same reason as 1D: dp[i][j] must read the state before this string was considered. Any ascending dimension lets the string be reused along that axis.
- **Q.** Three or more constraints.
  <br>**A.** The state grows a dimension each time and the table becomes unaffordable fast. Beyond two or three, the problem is usually intended to be solved differently.

</details>

#### `[DRILL]` 3. Perfect Squares &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 279

<!-- id:dp-perfect-squares | order:19 | day:17 | pattern:unbounded-knapsack-min | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/perfect-squares/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `unbounded-knapsack-min`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Coin Change where the coins are perfect squares. Recognising the restatement immediately is the exercise - and the number-theoretic shortcut is worth knowing as a contrast.

**Trick.** dp[i] = min over j of dp[i - j*j] + 1. Loop j while j*j <= i, with the capacity loop upward since squares may be reused.

**Edge cases that bite.**

- dp[0] = 0 seeds the recurrence.
- n = 1 returns 1.
- The answer is always 1, 2, 3 or 4 by Lagrange's four-square theorem.

**Complexity.** `O(n·√n)` time, `O(n)` space — n states, each trying up to sqrt(n) squares.

**Same pattern.** [Coin Change](https://leetcode.com/problems/coin-change/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/), [Numbers With Same Consecutive Differences](https://leetcode.com/problems/numbers-with-same-consecutive-differences/)

**Interview follow-ups.**

- **Q.** The O(1) mathematical answer.
  <br>**A.** Lagrange's four-square theorem says every n is the sum of at most four squares. Legendre's three-square theorem identifies exactly which n need four: those of the form 4^a(8b+7). A perfect square needs 1; the rest need 2 or 3, testable directly. Worth naming - interviewers like that you know DP is not the only route.
- **Q.** Why is the DP still the better interview answer?
  <br>**A.** It generalises. The number theory works only for squares.

</details>

### Day 17 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Loop order decides combinations versus permutations.** Item loop outer counts each multiset once. Capacity loop outer counts orderings separately. The code differs by which loop is outside, and nothing else.
  <br>↳ *Coin Change II* — coin loop outer, counting combinations; *Combination Sum IV* — capacity loop outer, counting permutations
- **A second capacity adds a dimension, not a new idea.** Two independent limits means a 2D capacity grid, iterated downward on both. The knapsack logic is untouched.
  <br>↳ *Ones and Zeroes* — dp over remaining zeros and ones, both loops descending
- **Recognise the restatement before solving.** Perfect Squares is Coin Change with square-valued coins. Noticing that takes seconds; deriving it from scratch takes twenty minutes.
  <br>↳ *Perfect Squares* — the unbounded-min recurrence with coins j*j, plus Lagrange's four-square theorem as the O(1) contrast

#### From yesterday

- **Loop direction is the whole difference between 0/1 and unbounded.** In the compressed array, dp[c-x] must describe the state before this item. ↳ *Partition Equal Subset Sum* — downward, so each number is used at most once
- **Algebra can turn an enumeration into a knapsack.** Two equations in two unknowns convert a +/- assignment problem into counting subsets with a fixed sum. ↳ *Target Sum* — sum(P) = (total + target)/2, with odd or negative totals rejected up front
- **Greedy's failure is where DP becomes necessary.** Coins {1,3,4} and target 6 defeat greedy: it takes 4+1+1 where 3+3 is optimal. ↳ *Coin Change* — the canonical counterexample to greedy coin selection

#### Two days back

- **Count, minimum and maximum are one template with one operator changed** — Unique Paths
- **Encode a constraint as a value, not a branch** — Unique Paths II
- **Pick the direction that eliminates the edge cases** — Triangle
- **Choosing what the cell MEANS is the problem** — Maximal Square

#### Earlier in dp

- Recursion, memo, tabulate, compress - in that order · Memoisation only helps when subproblems overlap · The transition widens, the state usually does not · Reduce circularity to two linear runs

### Day 18

*7 problems — 4 core, 2 drill, 1 skim.*

#### `[CORE]` 1. Longest Common Subsequence &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1143

<!-- id:dp-longest-common-subsequence | order:20 | day:18 | pattern:two-string-dp | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-common-subsequence/)

**Asked by:** Amazon, Google, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-string-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The parent of every two-string DP. State is (i, j) - prefix lengths, not positions. Equal characters extend the diagonal; unequal characters take the better of dropping one character from either string.

**Trick.** 1-index the table so dp[0][*] and dp[*][0] are naturally 0 and no boundary case exists. Equal: dp[i-1][j-1] + 1. Unequal: max(dp[i-1][j], dp[i][j-1]).

**Edge cases that bite.**

- 1-indexing the table removes every boundary check - do it.
- Either string empty gives 0.
- Subsequence, not substring - characters need not be contiguous.

**Complexity.** `O(n·m)` time, `O(min(n,m)) with two rolling rows` space — every (i,j) pair is computed once from three neighbours.

**Same pattern.** [Edit Distance](https://leetcode.com/problems/edit-distance/), [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/), [Shortest Common Supersequence ](https://leetcode.com/problems/shortest-common-supersequence/)

**Interview follow-ups.**

- **Q.** Print the subsequence itself.
  <br>**A.** Walk backwards from dp[n][m]: equal characters mean move diagonally and emit; otherwise move toward the larger neighbour. This requires the full table, so compression forfeits it.
- **Q.** Longest common SUBSTRING instead.
  <br>**A.** Different recurrence - dp resets to 0 on a mismatch rather than taking a max, and the answer is the table maximum rather than the corner.
- **Q.** Shortest common supersequence.
  <br>**A.** n + m - LCS. One subtraction once you have the LCS length.

</details>

#### `[CORE]` 2. Edit Distance &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 72

<!-- id:dp-edit-distance | order:21 | day:18 | pattern:two-string-dp | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/edit-distance/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/edit-distance?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=fJaKO8FbDdo)

**Asked by:** Amazon, Google, Microsoft, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-string-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Same (i, j) state as LCS with three operations instead of two. Each operation maps to one neighbour: replace is the diagonal, delete is up, insert is left. Naming that mapping is what makes the recurrence memorable rather than memorised.

**Trick.** Equal characters: dp[i-1][j-1] with no cost. Otherwise 1 + min(dp[i-1][j-1] replace, dp[i-1][j] delete, dp[i][j-1] insert).

**Edge cases that bite.**

- Base cases are dp[i][0] = i and dp[0][j] = j - converting to or from empty costs one operation per character.
- All three operations cost 1 here; weighted variants change only the min.
- Either string empty gives the other's length.

**Complexity.** `O(n·m)` time, `O(min(n,m))` space — every state computed once from three neighbours.

**Same pattern.** [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/), [Delete Operation for Two Strings](https://leetcode.com/problems/delete-operation-for-two-strings/), [Minimum ASCII Delete Sum for Two Strings](https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/)

**Interview follow-ups.**

- **Q.** Which neighbour is which operation?
  <br>**A.** Diagonal = replace (both advance). Up = delete from a (a advances). Left = insert into a (b advances). Say it this way and you never have to recall the formula.
- **Q.** Operations have different costs.
  <br>**A.** Weight each term in the min. The structure is unchanged, which is why this recurrence is worth understanding rather than memorising.
- **Q.** Only deletions allowed.
  <br>**A.** Then it is n + m - 2·LCS. Restricting the operations collapses it to a simpler problem.

</details>

#### `[CORE]` 3. Longest Palindromic Subsequence &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 516

<!-- id:dp-longest-palindromic-subsequence | order:23 | day:18 | pattern:lcs-reduction | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-palindromic-subsequence/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/longest-palindromic-subsequence?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=6i_T5kkfv4A)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lcs-reduction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A palindromic subsequence of s is a common subsequence of s and reverse(s). That single observation means you do not need a new recurrence at all - you reuse LCS. Recognising a reduction beats deriving a solution.

**Trick.** return LCS(s, reverse(s)). The interval DP formulation also works, but the reduction is two lines and uses code you already have.

**Edge cases that bite.**

- Subsequence, not substring - no contiguity requirement.
- A single character is a palindrome of length 1.
- Minimum insertions to make s a palindrome is n - LPS, which is the usual follow-up.

**Complexity.** `O(n²)` time, `O(n)` space — one LCS over two strings of length n.

**Same pattern.** [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/), [Palindrome Partitioning II](https://leetcode.com/problems/palindrome-partitioning-ii/), [Edit Distance](https://leetcode.com/problems/edit-distance/)

**Interview follow-ups.**

- **Q.** Prove the reduction.
  <br>**A.** A palindromic subsequence reads the same forwards and backwards, so it appears in s and also in reverse(s). Conversely any common subsequence of s and reverse(s) is a palindrome. The sets coincide.
- **Q.** Minimum insertions to make a palindrome.
  <br>**A.** n - LPS. Every character not in the longest palindromic subsequence needs a partner inserted.
- **Q.** Longest palindromic SUBSTRING.
  <br>**A.** Different problem - expand around centres, O(n^2) time and O(1) space. Substring requires contiguity, which the LCS reduction does not respect.

</details>

#### `[CORE]` 4. Word Break &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 139

<!-- id:dp-word-break | order:24 | day:18 | pattern:front-partition-dp | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/word-break/)

**Asked by:** Amazon, Google, Facebook, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `front-partition-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Front partition DP: dp[i] is true when some split point j makes dp[j] true and s[j..i) a dictionary word. The state is one index even though the problem looks two-dimensional, which is what keeps it O(n^2) rather than exponential.

**Trick.** Put the dictionary in an unordered_set. dp[0] = true, then for each i try every j < i. Break on the first success - you only need existence.

**Edge cases that bite.**

- dp[0] = true for the empty prefix.
- The dictionary must be a set; a vector scan makes each check O(k·L).
- Words may be reused any number of times.

**Complexity.** `O(n² · L)` time, `O(n)` space — n^2 split points with an O(L) substring hash each. The naive recursion retries the same suffixes repeatedly and is exponential.

**Same pattern.** [Word Break II](https://leetcode.com/problems/word-break-ii/), [Decode Ways](https://leetcode.com/problems/decode-ways/), [Palindrome Partitioning II](https://leetcode.com/problems/palindrome-partitioning-ii/), [Coin Change](https://leetcode.com/problems/coin-change/)

**Interview follow-ups.**

- **Q.** Return all possible sentences.
  <br>**A.** LC 140 - now you must enumerate, so it becomes backtracking with memoisation on the suffix. Exponential output, which no DP can avoid.
- **Q.** Use a trie instead of a set.
  <br>**A.** Walk the trie forward from each i, which prunes as soon as no word has that prefix. Better than trying every j when the dictionary is large.
- **Q.** Why is the state one-dimensional?
  <br>**A.** You only need to know whether a prefix is breakable, not how. The split point is iterated over, not stored.

</details>

#### `[DRILL]` 5. Distinct Subsequences &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 115

<!-- id:dp-distinct-subsequences | order:22 | day:18 | pattern:two-string-dp-count | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/distinct-subsequences/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/distinct-subsequences?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nVG7eTiD2bY)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-string-dp-count`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting rather than measuring. On a character match you may either use it or skip it, so the two counts ADD - that plus sign instead of a max is the only structural change from LCS, and it is where the counts explode.

**Trick.** Equal: dp[i-1][j-1] + dp[i-1][j] - use the match, or skip this character of s. Unequal: dp[i-1][j] only.

**Edge cases that bite.**

- Counts overflow int - the problem guarantees the answer fits in 32 bits but intermediate values may not. Use unsigned or long long.
- dp[i][0] = 1 for every i - the empty target is a subsequence of anything.
- dp[0][j] = 0 for j > 0.

**Complexity.** `O(n·m)` time, `O(m)` space — one pass per character of s over all prefixes of t.

**Same pattern.** [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Edit Distance](https://leetcode.com/problems/edit-distance/), [Number of Matching Subsequences](https://leetcode.com/problems/number-of-matching-subsequences/), [Is Subsequence](https://leetcode.com/problems/is-subsequence/)

**Interview follow-ups.**

- **Q.** Why add rather than max?
  <br>**A.** Max answers 'how long'. Add answers 'how many'. When a character matches, the matches that use it and the matches that skip it are disjoint sets, so their counts sum.
- **Q.** Why does dp[i][0] = 1?
  <br>**A.** There is exactly one way to form the empty string from any prefix - take nothing. Seeding it to 0 collapses the whole table to zero.

</details>

#### `[DRILL]` 6. Interleaving String &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 97

<!-- id:dp-interleaving-string | order:25 | day:18 | pattern:two-string-dp | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/interleaving-string/)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-string-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The state (i, j) means 'the first i of s1 and first j of s2 produce the first i+j of s3'. The third string needs no dimension of its own, because its position is determined - spotting that is what keeps the table 2D instead of 3D.

**Trick.** dp[i][j] true if (dp[i-1][j] and s1[i-1]==s3[i+j-1]) or (dp[i][j-1] and s2[j-1]==s3[i+j-1]). The index i+j-1 into s3 is the key insight.

**Edge cases that bite.**

- Reject immediately when |s1| + |s2| != |s3|.
- Greedy character matching fails - when both strings offer the same next character you must try both.
- Empty strings interleave trivially.

**Complexity.** `O(n·m)` time, `O(m)` space — every (i,j) pair computed once. The third index is derived, not stored, which is what avoids an O(n·m·k) table.

**Same pattern.** [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Edit Distance](https://leetcode.com/problems/edit-distance/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/), [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/)

**Interview follow-ups.**

- **Q.** Why does greedy fail?
  <br>**A.** If s1 and s2 both start with 'a' and s3 starts with 'a', choosing wrong can dead-end much later. Both branches must be explored, which is why it is DP and not a two-pointer walk.
- **Q.** Why is the state only two-dimensional?
  <br>**A.** Having consumed i from s1 and j from s2, exactly i+j characters of s3 are accounted for. The third position is a function of the first two.

</details>

#### `[SKIM]` 7. Regular Expression Matching &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 10

<!-- id:dp-regular-expression-matching | order:26 | day:18 | pattern:two-string-dp-with-wildcards | template:T-DP-04 -->

[Solve on LeetCode](https://leetcode.com/problems/regular-expression-matching/)

**Asked by:** Google, Facebook, Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-string-dp-with-wildcards`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The hardest two-string DP in common circulation, and its entire difficulty is the `*` branch: `x*` can match zero occurrences or one more. Getting those two cases right is the problem; everything else is standard.

**Trick.** When p[j-1] == '*': dp[i][j] = dp[i][j-2] (match zero) OR (dp[i-1][j] if p[j-2] matches s[i-1]) (match one more). Note j-2, because the star and its preceding character are one unit.

**Edge cases that bite.**

- '*' applies to the PRECEDING character, so patterns are read two symbols at a time.
- dp[0][j] must handle patterns like 'a*b*c*' matching the empty string.
- '.' matches any single character, which only affects the equality test.
- An empty pattern matches only an empty string.

**Complexity.** `O(n·m)` time, `O(n·m)` space — every (i,j) pair computed once, with a constant number of branches.

**Same pattern.** [Wildcard Matching](https://leetcode.com/problems/wildcard-matching/), [Interleaving String](https://leetcode.com/problems/interleaving-string/), [Edit Distance](https://leetcode.com/problems/edit-distance/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/)

**Interview follow-ups.**

- **Q.** Wildcard matching is easier. Why?
  <br>**A.** LC 44's '*' matches any sequence independently, so the branch is dp[i-1][j] (consume a character) or dp[i][j-1] (match empty) - no paired preceding character to consider.
- **Q.** Why j-2 for the zero-match case?
  <br>**A.** The pattern unit is two symbols - the character and its star. Skipping the unit means moving back two positions in the pattern, not one.

</details>

### Day 18 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Two-string DP is a (prefix, prefix) state, 1-indexed.** State is (i, j) meaning the first i of a and first j of b. 1-indexing the table makes the zero row and column naturally correct and removes every boundary check.
  <br>↳ *Longest Common Subsequence* — equal gives the diagonal plus one, unequal takes the better of dropping one character; *Edit Distance* — the same state with three operations mapping to three neighbours; *Interleaving String* — two dimensions only, because the third string's position is i+j
- **Name which neighbour is which operation.** Diagonal is replace, up is delete, left is insert. Saying it that way means you reconstruct the recurrence rather than recall it, and it survives weighted variants.
  <br>↳ *Edit Distance* — 1 + min of the three neighbours when characters differ
- **Max answers how long, plus answers how many.** The same recurrence skeleton measures or counts depending on the operator. Counting versions overflow much sooner, so the type matters.
  <br>↳ *Distinct Subsequences* — dp[i-1][j-1] + dp[i-1][j] on a match - use it or skip it; *Longest Common Subsequence* — max on the same structure, for length rather than count
- **Look for a reduction before writing a recurrence.** A palindromic subsequence of s is a common subsequence of s and reverse(s). Reusing LCS beats deriving an interval DP.
  <br>↳ *Longest Palindromic Subsequence* — LCS(s, reverse(s)), with n - LPS giving minimum insertions
- **Front partition DP keeps a one-dimensional state.** dp[i] true when some split j makes dp[j] true and the piece between them valid. The split point is iterated over, not stored, which is what keeps it polynomial.
  <br>↳ *Word Break* — trying every j below i against a dictionary set; *Palindrome Partitioning II* — the same shape, with a precomputed palindrome table to keep each validity check O(1)
- **Precompute validity or pay a factor of n.** A DP that asks an O(n) question at each of O(n^2) states is O(n^3). Precomputing the answers first is two separate quadratic passes.
  <br>↳ *Palindrome Partitioning II* — building isPal[i][j] before the DP rather than checking inside it

#### From yesterday

- **Loop order decides combinations versus permutations.** Item loop outer counts each multiset once. ↳ *Coin Change II* — coin loop outer, counting combinations
- **A second capacity adds a dimension, not a new idea.** Two independent limits means a 2D capacity grid, iterated downward on both. ↳ *Ones and Zeroes* — dp over remaining zeros and ones, both loops descending
- **Recognise the restatement before solving.** Perfect Squares is Coin Change with square-valued coins. ↳ *Perfect Squares* — the unbounded-min recurrence with coins j*j, plus Lagrange's four-square theorem as the O(1) contrast

#### Two days back

- **Loop direction is the whole difference between 0/1 and unbounded** — Partition Equal Subset Sum
- **Algebra can turn an enumeration into a knapsack** — Target Sum
- **Greedy's failure is where DP becomes necessary** — Coin Change

#### Earlier in dp

- Recursion, memo, tabulate, compress - in that order · Memoisation only helps when subproblems overlap · The transition widens, the state usually does not · Reduce circularity to two linear runs · Count, minimum and maximum are one template with one operator changed · Encode a constraint as a value, not a branch · Pick the direction that eliminates the edge cases · Choosing what the cell MEANS is the problem

### Day 19

*5 problems — 3 core, 2 drill, 0 skim.*

#### `[CORE]` 1. Best Time to Buy and Sell Stock III &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 123

<!-- id:dp-best-time-to-buy-and-sell-stock-iii | order:27 | day:19 | pattern:state-machine-dp | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/best-time-to-buy-and-sell-stock-iii?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=-uQGzhYj8BQ)

**Asked by:** Amazon, Google, Microsoft, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `state-machine-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Model STATES, not decisions. With at most two transactions there are four states - after the first buy, first sell, second buy, second sell - and each day updates all four in order. Searching over split points is the slower alternative.

**Trick.** Four scalars: buy1, sell1, buy2, sell2, updated left to right each day. Each depends on the previous state in the chain, so one pass suffices.

**Edge cases that bite.**

- Initialise buy1 and buy2 to INT_MIN or -prices[0], not 0.
- Updating in the order buy1, sell1, buy2, sell2 within the same day is correct here - it models same-day re-entry, which is harmless.
- Fewer than two profitable opportunities is fine; the max handles it.

**Complexity.** `O(n)` time, `O(1)` space — one pass with four scalars. The split-point formulation - best profit in [0,i] plus best in [i,n] - is O(n) too but needs two auxiliary arrays.

**Same pattern.** [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/), [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/), [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/), [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/)

**Interview follow-ups.**

- **Q.** Generalise to k transactions.
  <br>**A.** LC 188 - arrays buy[k+1] and sell[k+1] instead of four scalars, with an inner loop over t. The four-scalar version is the k=2 case written out.
- **Q.** Why is a state machine better than searching split points?
  <br>**A.** It generalises. Adding a cooldown or a fee adds a state or a term; the split-point approach would need rethinking from scratch.

</details>

#### `[CORE]` 2. Best Time to Buy and Sell Stock IV &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 188

<!-- id:dp-best-time-to-buy-and-sell-stock-iv | order:28 | day:19 | pattern:state-machine-dp | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/best-time-to-buy-and-sell-stock-iv?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=IV1dHbk5CDc)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `state-machine-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The general form that LC 121, 122 and 123 are all special cases of. Once written, you never need the specialised versions again - which is why it is worth writing properly.

**Trick.** buy[t] = max(buy[t], sell[t-1] - price) and sell[t] = max(sell[t], buy[t] + price), looping t from 1 to k. When k >= n/2 the limit is unreachable, so fall back to the unlimited greedy.

**Edge cases that bite.**

- k >= n/2 means the limit never binds - sum the positive daily differences instead, or the O(n·k) table is wasteful.
- buy[] initialises to INT_MIN; sell[] to 0.
- k = 0 returns 0.

**Complexity.** `O(n·k), or O(n) when k is large` time, `O(k)` space — n days times k transaction counts. The large-k shortcut matters because k can be given as 10^9 while n is small.

**Same pattern.** [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/), [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/), [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

**Interview follow-ups.**

- **Q.** Why the k >= n/2 shortcut?
  <br>**A.** Each transaction needs at least two days, so more than n/2 transactions is impossible. Past that point the constraint is vacuous and greedy is exact.
- **Q.** Where do 121, 122 and 123 sit?
  <br>**A.** 121 is k=1, 123 is k=2, 122 is k=infinity. Writing this once covers all three.

</details>

#### `[CORE]` 3. Longest Increasing Subsequence &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 300

<!-- id:dp-longest-increasing-subsequence | order:31 | day:19 | pattern:lis | template:T-DP-06 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-increasing-subsequence/)

**Asked by:** Amazon, Google, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lis`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The O(n^2) DP is dp[i] = longest ending at i. The O(n log n) version maintains the smallest possible TAIL for each achievable length - and that array is not a subsequence, only its length is meaningful. Believing otherwise is the standard error.

**Trick.** For each x, lower_bound in tails; overwrite if found, append if not. The answer is tails.size().

**Edge cases that bite.**

- `tails` is NOT the actual subsequence - do not return it.
- upper_bound instead of lower_bound gives the longest NON-DECREASING version.
- A strictly decreasing array gives 1.

**Complexity.** `O(n log n)` time, `O(n)` space — one binary search per element. The O(n^2) DP compares against every earlier index.

**Same pattern.** [Russian Doll Envelopes](https://leetcode.com/problems/russian-doll-envelopes/), [Longest String Chain](https://leetcode.com/problems/longest-string-chain/), [Number of Longest Increasing Subsequence](https://leetcode.com/problems/number-of-longest-increasing-subsequence/), [Maximum Length of Pair Chain](https://leetcode.com/problems/maximum-length-of-pair-chain/)

**Interview follow-ups.**

- **Q.** Why is tails not a valid subsequence?
  <br>**A.** Overwriting a middle entry can leave a mix of tails from different subsequences. The invariant is only that tails[k] is the smallest achievable tail of length k+1, which is enough for the length but not for reconstruction.
- **Q.** Reconstruct the actual subsequence.
  <br>**A.** Record, for each element, the length it achieved and a predecessor index. Walk back from the longest. Needs O(n) extra bookkeeping.
- **Q.** Count the number of LIS.
  <br>**A.** LC 673 - the O(n^2) DP with a parallel count array. The O(n log n) form does not extend cleanly to counting.

</details>

#### `[DRILL]` 4. Best Time to Buy and Sell Stock with Cooldown &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 309

<!-- id:dp-best-time-to-buy-and-sell-stock-with-cooldown | order:29 | day:19 | pattern:state-machine-dp | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/best-time-to-buy-and-sell-stock-with-cooldown?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=IGIe46xw3YY)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `state-machine-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A cooldown adds a third state - you can be holding, free to buy, or resting after a sale. The state machine absorbs the new rule with one extra variable, which is the payoff for having modelled states rather than decisions.

**Trick.** Three states: hold, sold (just sold, must rest), rest (free to buy). hold from rest or hold; sold from hold; rest from rest or sold.

**Edge cases that bite.**

- The cooldown is one day, so 'sold' transitions to 'rest' and only then to 'hold'.
- Initialise hold to -prices[0], sold to 0, rest to 0.
- Unlimited transactions apart from the cooldown.

**Complexity.** `O(n)` time, `O(1)` space — one pass with three scalars.

**Same pattern.** [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/), [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/), [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/)

**Interview follow-ups.**

- **Q.** A two-day cooldown.
  <br>**A.** Add another resting state, or track how many rest days remain. The state machine scales linearly in the cooldown length.
- **Q.** Why can't you reuse the two-state version?
  <br>**A.** Two states cannot distinguish 'free to buy' from 'just sold', and those permit different actions. The constraint demands a new state, not a new condition.

</details>

#### `[DRILL]` 5. Best Time to Buy and Sell Stock with Transaction Fee &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 714

<!-- id:dp-best-time-to-buy-and-sell-stock-with-transaction-fee | order:30 | day:19 | pattern:state-machine-dp | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/best-time-to-buy-and-sell-stock-with-cooldown-and-transaction-fees?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=k4eK-vEmnKg)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `state-machine-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A fee is where the greedy of LC 122 breaks - short profitable holds stop being worth it once a cost is attached. Two states handle it, with the fee subtracted at exactly one transition.

**Trick.** hold = max(hold, free - price); free = max(free, hold + price - fee). Subtract the fee on the sell, not the buy - either is consistent, but pick one and say which.

**Edge cases that bite.**

- Subtracting the fee twice, or at both transitions, halves the answer.
- Initialise hold = -prices[0], free = 0.
- A fee larger than every price spread gives 0.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two scalars.

**Same pattern.** [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/), [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/), [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/)

**Interview follow-ups.**

- **Q.** Why does the LC 122 greedy fail here?
  <br>**A.** Summing every positive daily difference assumed each one-day hold was free. With a fee, a gain smaller than the fee is a loss, and consecutive small gains should be merged into one longer hold.
- **Q.** Buy-side or sell-side fee?
  <br>**A.** Either works as long as it is applied exactly once per completed transaction. State which you chose - an interviewer will check you did not double-count.

</details>

### Day 19 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Model states, not decisions.** Holding or not holding, with transaction count or cooldown as extra dimensions. New rules add a state or a term rather than requiring a new algorithm.
  <br>↳ *Best Time to Buy and Sell Stock III* — four scalars for at most two transactions; *Best Time to Buy and Sell Stock IV* — the general k-transaction form that 121, 122 and 123 are special cases of; *Best Time to Buy and Sell Stock with Cooldown* — a third state for the forced rest day; *Best Time to Buy and Sell Stock with Transaction Fee* — the fee subtracted at exactly one transition
- **A cost term can break a greedy that worked without it.** Summing positive daily differences is exact with unlimited free transactions. Add a fee and short holds become losses, so the greedy has to become a state machine.
  <br>↳ *Best Time to Buy and Sell Stock with Transaction Fee* — why the LC 122 greedy no longer applies
- **The LIS tails array is not a subsequence.** tails[k] is the smallest achievable tail of an increasing subsequence of length k+1. Its length is the answer; its contents are a mix from different subsequences.
  <br>↳ *Longest Increasing Subsequence* — lower_bound and overwrite, with upper_bound giving the non-decreasing variant

#### From yesterday

- **Two-string DP is a (prefix, prefix) state, 1-indexed.** State is (i, j) meaning the first i of a and first j of b. ↳ *Longest Common Subsequence* — equal gives the diagonal plus one, unequal takes the better of dropping one character
- **Name which neighbour is which operation.** Diagonal is replace, up is delete, left is insert. ↳ *Edit Distance* — 1 + min of the three neighbours when characters differ
- **Max answers how long, plus answers how many.** The same recurrence skeleton measures or counts depending on the operator. ↳ *Distinct Subsequences* — dp[i-1][j-1] + dp[i-1][j] on a match - use it or skip it
- **Look for a reduction before writing a recurrence.** A palindromic subsequence of s is a common subsequence of s and reverse(s). ↳ *Longest Palindromic Subsequence* — LCS(s, reverse(s)), with n - LPS giving minimum insertions
- **Front partition DP keeps a one-dimensional state.** dp[i] true when some split j makes dp[j] true and the piece between them valid. ↳ *Word Break* — trying every j below i against a dictionary set
- **Precompute validity or pay a factor of n.** A DP that asks an O(n) question at each of O(n^2) states is O(n^3). ↳ *Palindrome Partitioning II* — building isPal[i][j] before the DP rather than checking inside it

#### Two days back

- **Loop order decides combinations versus permutations** — Coin Change II
- **A second capacity adds a dimension, not a new idea** — Ones and Zeroes
- **Recognise the restatement before solving** — Perfect Squares

#### Earlier in dp

- Recursion, memo, tabulate, compress - in that order · Memoisation only helps when subproblems overlap · The transition widens, the state usually does not · Reduce circularity to two linear runs · Count, minimum and maximum are one template with one operator changed · Encode a constraint as a value, not a branch · Pick the direction that eliminates the edge cases · Choosing what the cell MEANS is the problem · Loop direction is the whole difference between 0/1 and unbounded · Algebra can turn an enumeration into a knapsack · Greedy's failure is where DP becomes necessary

### Day 20

*4 problems — 2 core, 2 drill, 0 skim.*

#### `[CORE]` 1. Russian Doll Envelopes &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 354

<!-- id:dp-russian-doll-envelopes | order:32 | day:20 | pattern:lis-after-sort | template:T-DP-06 -->

[Solve on LeetCode](https://leetcode.com/problems/russian-doll-envelopes/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lis-after-sort`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two dimensions reduce to one by sorting on the first, after which the second becomes a plain LIS. The decisive detail is the tiebreak: equal widths must sort by height DESCENDING, or two envelopes of the same width get chained together illegally.

**Trick.** Sort by width ascending, height DESCENDING within equal widths. Then run O(n log n) LIS on the heights.

**Edge cases that bite.**

- The descending height tiebreak is the entire difficulty - ascending silently gives a wrong answer.
- Strict nesting, so equal dimensions do not nest.
- A single envelope gives 1.

**Complexity.** `O(n log n)` time, `O(n)` space — sort plus one LIS pass. The O(n^2) pairwise DP is what this replaces.

**Same pattern.** [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/), [Maximum Length of Pair Chain](https://leetcode.com/problems/maximum-length-of-pair-chain/), [Longest String Chain](https://leetcode.com/problems/longest-string-chain/)

**Interview follow-ups.**

- **Q.** Why descending on height?
  <br>**A.** With ascending, two envelopes of width 5 and heights 3 and 7 would appear as an increasing pair in the height array and be chained - but equal widths cannot nest. Descending makes them a decreasing pair, which LIS rejects.
- **Q.** Three dimensions.
  <br>**A.** The reduction breaks - sorting fixes one dimension but you now need a 2D longest-chain query, which needs a BIT or segment tree over the second dimension. O(n log^2 n).

</details>

#### `[CORE]` 2. Burst Balloons &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 312

<!-- id:dp-burst-balloons | order:34 | day:20 | pattern:interval-dp | template:T-DP-07 -->

[Solve on LeetCode](https://leetcode.com/problems/burst-balloons/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/burst-balloons?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Yz4LlDSlkns)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `interval-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The hardest reframing in the DP set. Asking which balloon to burst FIRST leaves the subproblems' neighbours undefined, because bursting changes adjacency. Asking which to burst LAST fixes them: when k is last in (i, j), its neighbours are exactly i-1 and j+1, which are outside the range and therefore stable.

**Trick.** Pad the array with 1s at both ends. dp[i][j] = max over k in (i,j) of dp[i][k] + dp[k][j] + a[i]*a[k]*a[j], with i and j exclusive boundaries.

**Edge cases that bite.**

- Padding with 1s makes the boundary multiplications work without special cases.
- The boundaries i and j are EXCLUSIVE - k ranges strictly between them.
- n <= 500 in the constraints is the signal that O(n^3) is intended.

**Complexity.** `O(n³)` time, `O(n²)` space — n^2 ranges, each trying O(n) split points. The naive 'try every burst order' is O(n!).

**Same pattern.** [Minimum Cost to Cut a Stick](https://leetcode.com/problems/minimum-cost-to-cut-a-stick/), [Palindrome Partitioning II](https://leetcode.com/problems/palindrome-partitioning-ii/), [Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/), [Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/)

**Interview follow-ups.**

- **Q.** Why last and not first?
  <br>**A.** If k is burst first, the subproblems (i,k) and (k,j) have had their adjacency altered by subsequent bursts and their boundaries are unknown. If k is burst last, everything else in (i,j) is already gone, so k's neighbours are the untouched i and j.
- **Q.** Minimum Cost to Cut a Stick.
  <br>**A.** LC 1547 - identical structure, where k is the LAST cut made in the segment. Having done Burst Balloons, this is a rename.
- **Q.** Matrix chain multiplication.
  <br>**A.** The classical form of the same recurrence - k is the last multiplication performed.

</details>

#### `[DRILL]` 3. Longest String Chain &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1048

<!-- id:dp-longest-string-chain | order:33 | day:20 | pattern:lis-on-predecessors | template:T-DP-06 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-string-chain/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/longest-string-chain?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=YY8iBaYcc4g)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `lis-on-predecessors`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Chains are built by DELETING one character, so sort by length and look up each possible predecessor in a hash map. The 'increasing' relation is not numeric here, which is the generalisation worth taking away.

**Trick.** Sort words by length. For each word, try removing each character and look up the result in a map of word to best chain length. dp[word] = 1 + max over predecessors.

**Edge cases that bite.**

- Sorting by length is what guarantees predecessors are already computed.
- Try every deletion position - there are L of them per word.
- A single word is a chain of length 1.

**Complexity.** `O(n · L²)` time, `O(n · L)` space — n words, L deletions each, with an O(L) hash of the resulting string.

**Same pattern.** [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/), [Russian Doll Envelopes](https://leetcode.com/problems/russian-doll-envelopes/), [Word Break](https://leetcode.com/problems/word-break/)

**Interview follow-ups.**

- **Q.** Why generate predecessors rather than compare all pairs?
  <br>**A.** Comparing every pair is O(n^2 · L). Generating the L possible predecessors and hashing is O(n · L^2), and L is small. Same instinct as Word Ladder.
- **Q.** Chains that allow insertion as well as deletion.
  <br>**A.** Symmetric, but now both directions must be considered and the length ordering no longer guarantees predecessors come first.

</details>

#### `[DRILL]` 4. Minimum Cost to Cut a Stick &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 1547

<!-- id:dp-minimum-cost-to-cut-a-stick | order:35 | day:20 | pattern:interval-dp | template:T-DP-07 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-cost-to-cut-a-stick/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/minimum-cost-to-cut-the-stick?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xwomavsC86c)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `interval-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Burst Balloons under a different story. k is the LAST cut made within a segment, so the cost of that cut is the segment's full current length - which is known precisely because everything else in it was cut earlier.

**Trick.** Sort the cut positions and add 0 and n as sentinels. dp[i][j] = min over k between them of dp[i][k] + dp[k][j] + (cuts[j] - cuts[i]).

**Edge cases that bite.**

- Sorting the cuts is mandatory - the recurrence assumes ordered positions.
- Sentinels 0 and n represent the stick's ends.
- The cost term is the segment length, not the cut position.

**Complexity.** `O(m³)` time, `O(m²)` space — m^2 segments with O(m) split points, where m is the number of cuts plus two.

**Same pattern.** [Burst Balloons](https://leetcode.com/problems/burst-balloons/), [Palindrome Partitioning II](https://leetcode.com/problems/palindrome-partitioning-ii/), [Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/)

**Interview follow-ups.**

- **Q.** Why is the cost the segment length?
  <br>**A.** Cutting a stick costs its current length. If k is the last cut in (i,j), no other cut has shortened that segment yet, so its length is cuts[j] - cuts[i].
- **Q.** Having done Burst Balloons, how long should this take?
  <br>**A.** Ten minutes. If it took longer, the last-operation reframing has not landed - redo Burst Balloons cold.

</details>

### Day 20 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Sort to collapse one dimension, and the tiebreak carries the constraint.** Two-dimensional nesting becomes LIS once the first dimension is sorted - but equal first values must sort descending on the second, or they chain illegally.
  <br>↳ *Russian Doll Envelopes* — width ascending, height descending within equal widths; *Longest String Chain* — sorting by length so every predecessor is already computed
- **In interval DP, k is the LAST operation.** Choosing k as the first move leaves the subproblems' boundaries undefined, because the operation changes adjacency. Choosing it as the last fixes them at i-1 and j+1, which are outside the range.
  <br>↳ *Burst Balloons* — k burst last, so its neighbours are the untouched padding at i and j; *Minimum Cost to Cut a Stick* — k cut last, so the segment is still its full length

#### From yesterday

- **Model states, not decisions.** Holding or not holding, with transaction count or cooldown as extra dimensions. ↳ *Best Time to Buy and Sell Stock III* — four scalars for at most two transactions
- **A cost term can break a greedy that worked without it.** Summing positive daily differences is exact with unlimited free transactions. ↳ *Best Time to Buy and Sell Stock with Transaction Fee* — why the LC 122 greedy no longer applies
- **The LIS tails array is not a subsequence.** tails[k] is the smallest achievable tail of an increasing subsequence of length k+1. ↳ *Longest Increasing Subsequence* — lower_bound and overwrite, with upper_bound giving the non-decreasing variant

#### Two days back

- **Two-string DP is a (prefix, prefix) state, 1-indexed** — Longest Common Subsequence
- **Name which neighbour is which operation** — Edit Distance
- **Max answers how long, plus answers how many** — Distinct Subsequences
- **Look for a reduction before writing a recurrence** — Longest Palindromic Subsequence
- **Front partition DP keeps a one-dimensional state** — Word Break
- **Precompute validity or pay a factor of n** — Palindrome Partitioning II

#### Earlier in dp

- Recursion, memo, tabulate, compress - in that order · Memoisation only helps when subproblems overlap · The transition widens, the state usually does not · Reduce circularity to two linear runs · Count, minimum and maximum are one template with one operator changed · Encode a constraint as a value, not a branch · Pick the direction that eliminates the edge cases · Choosing what the cell MEANS is the problem · Loop direction is the whole difference between 0/1 and unbounded · Algebra can turn an enumeration into a knapsack · Greedy's failure is where DP becomes necessary · Loop order decides combinations versus permutations · A second capacity adds a dimension, not a new idea · Recognise the restatement before solving

### Day 21

*3 problems — 1 core, 1 drill, 1 skim.*

#### `[CORE]` 1. Palindrome Partitioning II &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 132

<!-- id:dp-palindrome-partitioning-ii | order:36 | day:21 | pattern:front-partition-dp | template:T-DP-07 -->

[Solve on LeetCode](https://leetcode.com/problems/palindrome-partitioning-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/palindrome-partitioning-ii-?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_H8V5hJUGd0)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `front-partition-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Front partition with a precomputed validity table. Recomputing whether each substring is a palindrome inside the DP makes it O(n^3); precomputing isPal in O(n^2) first brings the whole thing to O(n^2).

**Trick.** Build isPal[i][j] by expanding lengths, then dp[i] = 1 + min over j of dp[j] where s[j..i) is a palindrome. Two separate O(n^2) passes.

**Edge cases that bite.**

- Precompute the palindrome table or the solution is O(n^3) and times out.
- dp[0] = -1 so that a fully palindromic prefix needs 0 cuts.
- A single character needs 0 cuts.

**Complexity.** `O(n²)` time, `O(n²)` space — the palindrome table is O(n^2) to build and the DP is O(n^2) to fill. Checking palindromes inside the DP loop adds a factor of n.

**Same pattern.** [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/), [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/), [Word Break](https://leetcode.com/problems/word-break/), [Burst Balloons](https://leetcode.com/problems/burst-balloons/)

**Interview follow-ups.**

- **Q.** Return the partitions rather than the count.
  <br>**A.** LC 131 - backtracking, because the output is exponential. Counting is polynomial; enumerating is not.
- **Q.** Why precompute isPal?
  <br>**A.** The DP asks 'is s[j..i) a palindrome' O(n^2) times. Each check is O(n) naively, giving O(n^3). Precomputing answers every check in O(1).

</details>

#### `[DRILL]` 2. Stone Game &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 877

<!-- id:dp-stone-game | order:37 | day:21 | pattern:game-dp | template:T-DP-08 -->

[Solve on LeetCode](https://leetcode.com/problems/stone-game/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `game-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Store the score DIFFERENCE the current player can force, not two separate scores. The minus sign in the recurrence encodes that the opponent then plays optimally against you, which removes the whose-turn dimension entirely.

**Trick.** dp[i][j] = max(a[i] - dp[i+1][j], a[j] - dp[i][j-1]). Player one wins when dp[0][n-1] > 0.

**Edge cases that bite.**

- The minus sign is the whole trick - it flips the perspective each level.
- An even number of piles with a total that cannot tie means player one always wins here, which is a valid O(1) answer worth mentioning.
- Both players play optimally by assumption.

**Complexity.** `O(n²)` time, `O(n²)` space — n^2 ranges with O(1) work each.

**Same pattern.** [Stone Game II](https://leetcode.com/problems/stone-game-ii/), [Predict the Winner](https://leetcode.com/problems/predict-the-winner/), [Burst Balloons](https://leetcode.com/problems/burst-balloons/), [Minimum Cost to Cut a Stick](https://leetcode.com/problems/minimum-cost-to-cut-a-stick/)

**Interview follow-ups.**

- **Q.** The O(1) answer for this specific problem.
  <br>**A.** With an even pile count, player one can always take all odd-indexed or all even-indexed piles, and one of those groups has at least half the total. So player one always wins - return true. Mention it, then give the DP, because the DP generalises.
- **Q.** Predict the Winner, where the counts may be odd.
  <br>**A.** LC 486 - the same difference DP, and now the O(1) shortcut does not apply.
- **Q.** Why store a difference?
  <br>**A.** Two scores would need a turn flag and twice the state. The difference is symmetric under turn-swapping, so one number plus a sign suffices.

</details>

#### `[SKIM]` 3. Cherry Pickup II &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 1463

<!-- id:dp-cherry-pickup-ii | order:38 | day:21 | pattern:3d-grid-dp | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/cherry-pickup-ii/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `3d-grid-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two robots moving simultaneously means the state is (row, col1, col2) - one row index shared, two column indices. Moving them in lockstep rather than sequentially is what keeps the state three-dimensional instead of exponential.

**Trick.** dp[r][c1][c2] with nine transitions - three moves each. Add both cells' values, but count a shared cell only once.

**Edge cases that bite.**

- When c1 == c2 the cherries are counted once, not twice.
- Both robots advance one row per step, which is what synchronises them.
- Nine transitions per state - all combinations of the two robots' three moves.

**Complexity.** `O(rows · cols²)` time, `O(cols²)` space — rows times cols^2 states with nine constant-time transitions each, compressed to one rolling layer.

**Same pattern.** [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/), [Unique Paths](https://leetcode.com/problems/unique-paths/), [Cherry Pickup](https://leetcode.com/problems/cherry-pickup/), [Minimum Falling Path Sum](https://leetcode.com/problems/minimum-falling-path-sum/)

**Interview follow-ups.**

- **Q.** Why move them simultaneously?
  <br>**A.** Moving one robot fully and then the other would require remembering the entire first path - an exponential state. Synchronising on the row makes the state small.
- **Q.** The original Cherry Pickup.
  <br>**A.** LC 741 - one robot going there and back, which is equivalent to two robots going one way. The same reframing, harder to spot.

</details>

### Day 21 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Store a score difference, not two scores.** Game DP halves its state by tracking how far ahead the current player can get. The minus sign encodes the opponent playing optimally and removes the whose-turn dimension.
  <br>↳ *Stone Game* — dp[i][j] = max(a[i] - dp[i+1][j], a[j] - dp[i][j-1])
- **Synchronise moving parts to keep the state small.** Two robots advanced in lockstep share a row index, giving a three-dimensional state. Running one fully and then the other would require remembering an entire path.
  <br>↳ *Cherry Pickup II* — dp[row][col1][col2] with nine transitions, counting a shared cell once

#### From yesterday

- **Sort to collapse one dimension, and the tiebreak carries the constraint.** Two-dimensional nesting becomes LIS once the first dimension is sorted - but equal first values must sort descending on the second, or they chain illegally. ↳ *Russian Doll Envelopes* — width ascending, height descending within equal widths
- **In interval DP, k is the LAST operation.** Choosing k as the first move leaves the subproblems' boundaries undefined, because the operation changes adjacency. ↳ *Burst Balloons* — k burst last, so its neighbours are the untouched padding at i and j

#### Two days back

- **Model states, not decisions** — Best Time to Buy and Sell Stock III
- **A cost term can break a greedy that worked without it** — Best Time to Buy and Sell Stock with Transaction Fee
- **The LIS tails array is not a subsequence** — Longest Increasing Subsequence

#### Earlier in dp

- Recursion, memo, tabulate, compress - in that order · Memoisation only helps when subproblems overlap · The transition widens, the state usually does not · Reduce circularity to two linear runs · Count, minimum and maximum are one template with one operator changed · Encode a constraint as a value, not a branch · Pick the direction that eliminates the edge cases · Choosing what the cell MEANS is the problem · Loop direction is the whole difference between 0/1 and unbounded · Algebra can turn an enumeration into a knapsack · Greedy's failure is where DP becomes necessary · Loop order decides combinations versus permutations · A second capacity adds a dimension, not a new idea · Recognise the restatement before solving · Two-string DP is a (prefix, prefix) state, 1-indexed · Name which neighbour is which operation · Max answers how long, plus answers how many · Look for a reduction before writing a recurrence · Front partition DP keeps a one-dimensional state · Precompute validity or pay a factor of n
