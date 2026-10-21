# Avoiding duplicate results in backtracking

> Sort the input; at one recursion level, skip a value equal to the one just tried. Produces each distinct subset or combination exactly once.

## Idea

✍️ With input [1, 2, 2], choosing "the first 2" or "the second 2" as the next element gives the same subsets. Duplicates come from trying **equal values at the same level** of the recursion.
✍️ Sort so equal values are adjacent; in the for-loop, skip `a[i]` if `i > start && a[i] == a[i−1]`.

## Template

```java
void dfs(int[] a, int start, List<Integer> path, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));                   // every node is a subset
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue;  // same value already tried at this level
        path.add(a[i]);
        dfs(a, i + 1, path, res);
        path.remove(path.size() - 1);
    }
}
```

## Why `i > start` and not `i > 0`

✍️ `i > start` only blocks equal values at the **same level**. Going deeper (the next level) with the second 2 is still allowed, which is how [2, 2] gets generated.
✍️ `i > 0` would also block it at deeper levels and lose valid answers like [1, 2, 2].

## Pitfalls

✍️ Forgetting to sort first — the skip only works when duplicates are adjacent.
- Using a `Set<List<Integer>>` to dedup at the end is correct but slower and hides the reasoning.
