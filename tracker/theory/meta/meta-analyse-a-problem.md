# Analysing a problem before you think of an algorithm

> The five questions to answer on paper before any idea of a solution — what goes in, what comes out, what the constraints allow, what a tiny example shows, and what makes it hard.

## Why analysis is a separate step

Most "I jumped to code and it was a disaster" moments have the same cause: the algorithm was invented while typing. Typing is slow and linear; thinking is fast and branching. When both happen at once, the first idea that compiles becomes the solution, and its bugs are discovered one test case at a time.

✍️ Analysis answers "what exactly is being asked and what is allowed". Brainstorming answers "how". Never mix them.

Analysis takes 3–5 minutes on paper. It feels like a waste on easy problems. It is the habit that saves you on medium ones, so do it on easy ones too, where it is cheap to practise.

## The five questions

✍️ 1. **Input → output in one line.** Restate the problem in your own words, as a function: `f(array of n ints, target) → two indices`. If you cannot write this line, you have not understood the problem yet.
✍️ 2. **What do the constraints allow?** Read `n` and convert it into a target complexity using [[cx-constraints-to-target]]. Also note value ranges (negatives? zero? up to 10⁹ → overflow?), and guarantees ("exactly one answer", "sorted", "distinct").
✍️ 3. **Solve a tiny example by hand.** Take the sample, or make one with 4–6 elements, and solve it *as a human*, slowly. Watch what your eyes and hands actually do — that is usually the algorithm.
✍️ 4. **What is hard about it?** Name the obstacle in one sentence: "checking every pair is too slow", "the window can't shrink when values are negative", "I need the order of elements but sorting destroys it".
✍️ 5. **What would the answer look like for edge inputs?** Empty, one element, all equal, all negative, already sorted, maximum size. Write the expected output for two of these before you start.

## How to use the tiny example

The tiny example is not a test — it is a microscope. Rules for using it well:

✍️ Make it small enough to do by hand (≤ 6 elements), but not so small it is trivial (2 elements hides most patterns).
✍️ Include at least one "awkward" feature: a duplicate, a negative, a zero, the answer at the edge.
- Solve it the dumbest way first and **count the work**: how many comparisons did you make? That count is your brute force complexity.
- Then ask: *which of those comparisons were wasted?* The wasted work is where the optimisation lives (see [[meta-bottleneck-method#find-bottleneck]]).

Example. Two Sum on `[2, 7, 11, 15]`, target 9. By hand, you look at 2 and think "I need a 7". Your eyes then scan for 7. That scan *is* the inner loop — and the thought "I need a 7" is the complement idea that removes it.

## Reading constraints like a hint

Problem setters choose constraints deliberately. They are the closest thing to a hint you will get in an OA.

✍️ `n ≤ 20` → exponential is fine (subsets, backtracking, bitmask).
✍️ `n ≤ 10⁵` or `2·10⁵` → you need O(n log n) or O(n). O(n²) will time out.
✍️ Values can be negative → sliding windows on sums usually break; think prefix sums.
✍️ "Sorted" → binary search or two pointers is almost certainly intended.
✍️ Values up to 10⁹ and you add them → use `long`.
- "Return any valid answer" → a greedy or constructive idea may exist.
- "Modulo 10⁹+7" → the count is huge, which means counting DP or combinatorics, never enumeration.

## The analysis box (copy this layout onto paper)

✍️ Use the same box at the top of every problem page in GoodNotes:

```
UNDERSTAND   f(...) → ...
CONSTRAINTS  n ≤ ...  → target O(...)     values: ...     guarantees: ...
BY HAND      example: ...   what I did: ...   work done: ...
HARD PART    ...
EDGES        empty → ...   one → ...   all same → ...
```

Only after this box is filled do you move to [[meta-bottleneck-method]].
