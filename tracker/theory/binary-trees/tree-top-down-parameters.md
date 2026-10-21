# Top-down recursion — passing information down

> Pass what the node needs from above (running sum, depth, current path, allowed range) as parameters. Root-to-leaf path problems use choose → recurse → undo on a path vector.

## Idea

✍️ Some answers depend on the path from the root: "does any root-to-leaf path sum to target?", "list all such paths", "max depth seen", "valid BST range".
✍️ Carry that information as a **parameter** that changes on the way down. The base case usually checks it at a leaf.

## Template: all root-to-leaf paths with sum

```java
void dfs(TreeNode n, int remain, List<Integer> path, List<List<Integer>> res) {
    if (n == null) return;
    path.add(n.val);                                             // choose
    remain -= n.val;
    if (n.left == null && n.right == null && remain == 0) res.add(new ArrayList<>(path));   // check at a LEAF
    dfs(n.left, remain, path, res);
    dfs(n.right, remain, path, res);
    path.remove(path.size() - 1);                               // undo
}
```
✍️ `remain` is passed by value (each call has its own copy, nothing to undo); `path` is shared by reference and must be undone.

## Pitfalls

✍️ Checking the sum at `null` instead of at a leaf counts a node with one child as a path end.
✍️ Forgetting to undo the last `path.remove` → paths accumulate nodes from other branches.

## Variations

- Path sum III (any downward path): prefix sums along the root path + hash map, with undo of the map count on the way back ([[ps-prefix-sum-hashmap]]).
- Count good nodes: pass the maximum seen so far.
- Sum root-to-leaf numbers: pass `cur * 10 + val`.
