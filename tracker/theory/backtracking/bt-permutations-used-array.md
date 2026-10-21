# Backtracking III — permutations with a used array

> At each position, try every element not yet used. A boolean used[] array (or swapping) tracks availability. n! results.

## Idea

✍️ A permutation fills positions one by one. Position k can take any element **not already used** in positions 0..k−1.
✍️ Keep `used[i]`; set it before recursing, clear it after (undo).

## Template

```java
void dfs(int[] a, boolean[] used, List<Integer> path, List<List<Integer>> res) {
    if (path.size() == a.length) { res.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < a.length; i++) {
        if (used[i]) continue;
        used[i] = true; path.add(a[i]);
        dfs(a, used, path, res);
        path.remove(path.size() - 1); used[i] = false;
    }
}
```
✍️ Unlike combinations, the loop starts at 0 every time: order matters, so [1, 2] and [2, 1] are different answers.

## With duplicate values (LeetCode 47)

✍️ Sort, and skip `a[i]` if `a[i] == a[i−1]` and `used[i−1]` is false. This forces equal values to be used in their original order, so each distinct permutation is produced once.

## Swap version

Fix position k by swapping each `a[i]` (i ≥ k) into it, recurse on k+1, swap back. No used array, O(1) extra space besides recursion. Harder to deduplicate.

## Complexity

O(n·n!) time, O(n) recursion depth.
