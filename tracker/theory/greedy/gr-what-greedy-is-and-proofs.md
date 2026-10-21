# Greedy algorithms and how to trust them

> Make the locally best choice and never revisit it. Correct only when an exchange argument shows the greedy choice can always be part of an optimal answer.

## Idea

✍️ A greedy algorithm builds the answer step by step, each time taking the option that looks best **now**, and never undoes a choice.
✍️ It is fast (often one sort + one pass) but often wrong. You need a reason it works before trusting it.

## The exchange argument

✍️ To prove greedy: take any optimal solution. Show you can **swap** its first choice for the greedy choice without making it worse. Repeat for the next choice. Hence some optimal solution makes all the greedy choices.
✍️ Example (interval scheduling): the interval that ends earliest can replace the first interval of any optimal schedule — it ends no later, so it conflicts with nothing the original did not.

## How to test a greedy idea quickly

✍️ Try to break it with a small counterexample before coding: 3–4 elements, adversarial values. If you find one, it is DP, not greedy.
✍️ Classic trap: coin change with coins {1, 3, 4} and amount 6 — greedy takes 4+1+1 (3 coins), optimal is 3+3 (2 coins). Coin change is DP ([[dp-unbounded-knapsack]]).

## Signs greedy is intended

✍️ Sorting by one key makes the decision obvious; "maximum number of non-overlapping …"; "minimum number of jumps/arrows/platforms"; "can you reach the end".
- Signs it is NOT greedy: you found a counterexample; choices interact far into the future; the problem asks for the number of ways.
