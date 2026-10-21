# Counting DP vs optimising DP — and loop order

> Counting adds over choices and starts from dp[0] = 1; optimising takes min/max and starts from 0 or infinity. For counting, the loop order decides whether order matters.

## Differences

✍️ Counting: `dp[state] = Σ dp[previous states]`, base case `dp[empty] = 1` (one way to do nothing). Answers can be huge → often modulo 10⁹+7.
✍️ Optimising: `dp[state] = min/max over choices`, base case 0 for the empty state and ±∞ for impossible states.

## Loop order: combinations vs permutations

✍️ Items outer, amount inner → each multiset counted once (**combinations**). Coin Change II.
✍️ Amount outer, items inner → at each amount any item can be last → ordered sequences (**permutations**). Combination Sum IV, climbing stairs with steps {1, 2}.
✍️ Check with amount 3, coins {1, 2}: combinations = 2 ({1,1,1}, {1,2}); permutations = 3 (1+1+1, 1+2, 2+1).

## Modulo arithmetic

✍️ Apply `% MOD` after every addition; use `long` for intermediate sums. With subtraction, add MOD before taking the modulo to stay non-negative.
