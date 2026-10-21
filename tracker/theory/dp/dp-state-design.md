# Designing the DP state

> The state must contain exactly the information needed to make the remaining decisions optimally. If the transition needs to know something the state does not say, add a dimension.

## The question to ask

✍️ "If I stopped halfway, what would I need to know to finish optimally?" Everything in that answer belongs in the state; nothing else does.
✍️ Typical state ingredients: an index (how far along the input), a remaining budget (capacity, target), a position in a second string, a mode (holding a stock or not, last action).

## "Best in prefix" vs "best ending at i"

✍️ Two common definitions for sequences:
✍️ `dp[i]` = best answer **using the first i elements** (house robber, word break, decode ways).
✍️ `dp[i]` = best answer for something that **ends exactly at i** (LIS, Kadane, maximal square). The final answer is then the max over all i.
✍️ Pick "ending at i" when the next element must connect to the previous one (increasing, adjacent).

## When the transition needs more

✍️ Stock with cooldown: knowing the profit by day i is not enough — you need to know whether you hold a stock. Add a mode dimension: `dp[i][holding]` ([[dp-state-machine]]).
✍️ House robber II (circle): the first and last houses interact. Instead of adding state, split into two linear problems (exclude the first, or exclude the last).
- More dimensions = more time and memory; add only what the transition actually needs.
