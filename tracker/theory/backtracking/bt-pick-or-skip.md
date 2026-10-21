# Backtracking I — pick or skip (subsets)

> At index i, either include a[i] in the current choice or not, and recurse to i+1. Every leaf is one subset. Choose → recurse → undo.

## Idea

✍️ Each element has two options: in or out. Walking the elements in order and branching on that choice visits all 2ⁿ subsets exactly once.
✍️ Keep one shared `path` vector. Before recursing on "pick", push the element; after returning, pop it (**undo**), so the next branch sees the path as it was.

## Recognise it

✍️ "all subsets / power set", "all combinations", "generate all strings that …", n ≤ ~20.
✍️ Any problem where each item is independently included or excluded, and you must list (not count) the results.

## Template

```java
List<List<Integer>> res = new ArrayList<>(); List<Integer> path = new ArrayList<>();
void dfs(int[] a, int i) {
    if (i == a.length) { res.add(new ArrayList<>(path)); return; }  // one complete decision
    path.add(a[i]);                // choose: pick a[i]
    dfs(a, i + 1);
    path.remove(path.size() - 1);  // undo
    dfs(a, i + 1);                 // skip a[i]
}
```

## Why "undo" is needed

✍️ `path` is shared by all calls (passed by reference / global). After exploring the "pick" branch, the element must be removed, or it would still be in `path` while exploring "skip" and every later branch.
✍️ Rule of thumb: **every change made before a recursive call is reversed right after it.**

## Variations

- Iterative version: start with `{[]}`, for each element duplicate every existing subset and append the element.
- Bitmask version: subset k ↔ the bits of k for k in 0..2ⁿ−1 ([[bits-common-tricks]]).
- Generate parentheses (LeetCode 22): choices "(" and ")" with constraints open ≤ n and close ≤ open ([[bt-pruning]]).
- Duplicates in the input → sort, then skip equal elements at the same level ([[bt-dedup-sorted-skip]]).
- Path sum II on trees: the same choose → recurse → undo on a root-to-leaf path.

## Complexity

O(n·2ⁿ) time (2ⁿ leaves, each copied in O(n)), O(n) recursion depth plus the output.
