# Backtracking II — choosing the next element with a for-loop (combinations)

> At each level, loop over which element to add next, starting from a start index so combinations are not repeated in different orders. Pass i to allow reuse, i+1 to forbid it.

## Idea

✍️ Instead of a binary pick/skip per element, each call asks: "which element goes next?" and loops over candidates from `start` to the end.
✍️ Starting the loop at `start` (not 0) means elements are always added in index order, so [2, 3] and [3, 2] are never both generated.

## Template

```java
void dfs(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > remain) break;                 // sorted input → prune the rest
        path.add(c[i]);
        dfs(c, i, remain - c[i], path, res);      // i: c[i] may be reused; i+1: use once
        path.remove(path.size() - 1);
    }
}
```

## i versus i + 1

✍️ Recursing with `i` lets the same element be chosen again (Combination Sum, unlimited supply).
✍️ Recursing with `i + 1` uses each element at most once (Combination Sum II, subsets).
✍️ That one character is the whole difference between the two problems.

## Variations

- Combinations of k numbers from 1..n (LeetCode 77): stop when `path.size() == k`; prune when not enough numbers remain.
- Combination Sum III: k numbers from 1..9 summing to n.
- Letter combinations of a phone number: each level loops over the letters of one digit (no start index — each level is a different digit).

## Pitfalls

✍️ `break` on `c[i] > remain` is only valid when the input is **sorted**; otherwise use `continue` or no pruning.
✍️ Starting the loop at 0 generates permutations of the same combination.

## Complexity

Exponential in the worst case; for Combination Sum roughly O(n^(T/m)) where T is the target and m the smallest candidate. Pruning matters more than the formula.
