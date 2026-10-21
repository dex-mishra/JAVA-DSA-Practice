# Variable-size sliding window — expand right, shrink left

> Grow the window by moving right one step at a time; whenever the window breaks a rule, shrink from the left until it is valid again. Each index enters and leaves once, so it is O(n).

## Idea

✍️ Window = `[l, r]`. The outer loop moves `r` right (expand). After adding `a[r]`, if the window violates the condition, move `l` right (shrink) until it is valid again.
✍️ Invariant: after the shrink loop, `[l, r]` is the **longest valid window ending at r**. Record its length.
✍️ Both pointers only move right. Each moves at most n times → O(n) total, even with a `while` inside the `for`.

## Recognise it

✍️ "longest / shortest substring or subarray such that …", "at most k distinct / at most k zeros / without repeating", "minimum length with sum ≥ target".
✍️ The condition is **monotone**: if a window is valid, every smaller window inside it is valid too (or for "shortest", every larger window is valid). See [[sw-monotonicity-requirement]].

## Brute force → expand/shrink

Brute force: every (l, r), check validity. O(n²) windows × check cost.
✍️ Bottleneck: for each r, trying every l from scratch.
✍️ Observation (monotonicity): if `[l, r]` is invalid, then `[l, r+1]` is also invalid, so for the next r we never need to look at starts ≤ l again. The best start only ever moves right → it can be a pointer that never goes back.

## Template: longest valid window

```java
int l = 0, best = 0;
// state describing the window, e.g. counts
for (int r = 0; r < n; r++) {
    add(a[r]);                          // 1. expand
    while (!valid()) {                  // 2. shrink until valid
        remove(a[l]);
        l++;
    }
    best = Math.max(best, r - l + 1);   // 3. record (window is valid here)
}
```

## Template: shortest valid window

```java
int l = 0, best = Integer.MAX_VALUE;
for (int r = 0; r < n; r++) {
    add(a[r]);
    while (valid()) {                   // while it is valid, try to make it shorter
        best = Math.min(best, r - l + 1); // record INSIDE the loop
        remove(a[l]);
        l++;
    }
}
return best == Integer.MAX_VALUE ? 0 : best;
```
✍️ Longest: shrink while **invalid**, record **after** the loop. Shortest: shrink while **valid**, record **inside** the loop. This is the most common mix-up.

## The "budget" form: at most k bad things

✍️ Many problems are "longest window containing at most k bad elements" (zeros you may flip, characters you may replace).
✍️ State = count of bad elements in the window. Valid ⇔ `bad ≤ k`.
✍️ Character replacement (LeetCode 424): bad = `windowLength − maxCountOfOneChar`; valid ⇔ `len − maxCount ≤ k`.

## Variations

- No repeating characters (LeetCode 3): state = counts; invalid when the new character's count > 1. Or store last index and jump `l` directly past it.
- Max consecutive ones with k flips (LeetCode 1004): bad = number of zeros.
- Fruit into baskets (LeetCode 904): at most 2 distinct values → map size ≤ 2.
- Minimum size subarray sum (LeetCode 209): shortest window with sum ≥ target (positive values only).
- Minimum window substring (LeetCode 76): shortest window containing all characters of t; track how many required characters are satisfied.
- Exactly k distinct: atMost(k) − atMost(k−1) ([[sw-at-most-k-trick]]).

## Pitfalls

✍️ Using `if` instead of `while` for shrinking: one step may not be enough to restore validity (except in the special "never-shrinking window" trick for LeetCode 424).
✍️ Forgetting to undo the state when `l` moves (decrement counts, remove keys whose count hits 0 if you use `map.size()` as "distinct").
✍️ Applying this to sums with negative numbers — the condition is not monotone; use prefix sums ([[ps-prefix-sum-hashmap]]).

## Complexity

O(n) time: r moves n times, l moves at most n times in total. Space O(k) or O(alphabet) for the window state.

## Interview follow-ups

- "Why is the nested while loop still O(n)?" — l only moves forward and never past r; across the whole run it moves at most n times ([[cx-amortised-analysis#counting-trick]]).
- "Can you avoid the inner loop?" — for LeetCode 3, store each character's last index and set `l = max(l, last[c] + 1)` in one step.
