# Why moving a pointer is safe — the exchange argument

> The proof that two-pointer scans do not skip the answer, for pair-sum and for Container With Most Water, phrased so you can say it in an interview.

## The argument for pair sum

✍️ Sorted array, `a[l] + a[r] < target`. Every pair `(l, j)` with `j < r` has sum ≤ `a[l] + a[r]` < target (because `a[j] ≤ a[r]`). So **no pair using index l can work**. Discard l → `l++`.
✍️ Symmetric for `> target`: no pair using r can work → `r--`.
✍️ So each move throws away only pairs that provably fail. The answer is never skipped.

## The argument for Container With Most Water

✍️ Area = `min(h[l], h[r]) × (r − l)`. Suppose `h[l] < h[r]`.
✍️ Any container that keeps `l` and moves `r` inward has a smaller width, and its height is still capped by `h[l]` (the min can only stay or drop). So every such container is **no better** than the current one.
✍️ Therefore the shorter side `l` has already achieved its best possible area. Discard it → `l++`. (If heights are equal, moving either is safe.)

## How to say it in an interview

✍️ "Moving the taller wall can never help: the width shrinks and the height is still limited by the shorter wall. So the shorter wall's best container is the current one, and I can discard it."
- This style of proof — "the option I am throwing away cannot beat what I already have" — is an **exchange argument**, the same tool used to prove greedy algorithms ([[gr-what-greedy-is-and-proofs]]).
