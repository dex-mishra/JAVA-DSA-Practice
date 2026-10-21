# Bitmask DP (recognition level)

> When n ≤ 20, a subset of items fits in an integer mask; dp[mask] = answer for that subset. O(2ⁿ · n).

## Idea

✍️ Represent "which items are used" as the bits of an integer. There are 2ⁿ masks; for n = 20 that is ~10⁶ — feasible.
✍️ Transition: add one unused item j to the mask: `dp[mask | (1 << j)]` from `dp[mask]`.

## Examples

- Partition to k equal sum subsets (LeetCode 698): dp[mask] = filled amount of the current bucket.
- Travelling salesman / shortest path visiting all nodes: state (mask, last node).
- Assigning tasks to workers with n ≤ 20.

## Recognise it

✍️ n ≤ 20 (sometimes 16) **and** the order or the set of used items matters for the remaining decisions.
