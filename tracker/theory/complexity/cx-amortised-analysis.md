# Amortised analysis — why "sometimes expensive" can still be O(1)

> How to count total work across a whole sequence of operations, with the ArrayList add, two-stack queue and monotonic stack examples.

## The idea

✍️ Amortised cost = total cost of a sequence of operations ÷ number of operations.
✍️ An operation can be occasionally expensive and still be O(1) amortised, if the expensive moments are rare enough that their cost spreads over many cheap ones.

## The counting trick: charge each element

✍️ The easiest proof: count how many times each element can be touched over the whole run.
✍️ If every element is pushed once and popped at most once, the total work is ≤ 2n, so the whole algorithm is O(n) — even if one single step pops many elements.
This is exactly why a monotonic stack is O(n) despite having a `while` loop inside a `for` loop ([[stq-monotonic-stack#complexity]]).

## Example: ArrayList.add

A `vector` doubles its capacity when full and copies everything across. One push can cost O(n). But after a copy of size k, the next k pushes are cheap. Total copies over n pushes ≤ 1 + 2 + 4 + … + n < 2n → O(1) amortised per push.

## Interview phrasing

✍️ Say: "Each element is pushed and popped at most once, so the total is O(n) amortised, even though one iteration can pop several."
- Do not say "the while loop is O(n) so the total is O(n²)" — that is the most common wrong answer on monotonic stack problems.
