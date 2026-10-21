# BFS level order — processing a tree level by level

> A queue visits nodes in order of depth. Reading q.size() at the start of each round gives exactly one level, which solves level lists, right side view, averages and zigzags.

## Idea

✍️ A queue processes nodes first-in first-out. Push the root; repeatedly pop a node and push its children. Nodes come out in order of depth.
✍️ To know where one level ends: at the start of each round, `sz = q.size()` is the number of nodes on the current level. Pop exactly `sz` nodes in that round.

## Template

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> q = new ArrayDeque<>(); q.offer(root);
    while (!q.isEmpty()) {
        int sz = q.size();                    // freeze the level size BEFORE pushing children
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < sz; i++) {
            TreeNode x = q.poll();
            level.add(x.val);
            if (x.left != null) q.offer(x.left);
            if (x.right != null) q.offer(x.right);
        }
        res.add(level);
    }
    return res;
}
```

## Variations

- Right side view (LeetCode 199): the last node of each level (`i == sz − 1`).
- Average of levels, largest value per level: aggregate inside the round.
- Zigzag (LeetCode 103): reverse every other level.
- Minimum depth: return the level number at the first leaf found — BFS finds the shallowest first.
- Right side view by DFS: visit right before left, record the first node seen at each new depth.

## Pitfalls

✍️ Using `q.size()` in the for-loop condition (`i < q.size()`) — it grows as children are pushed. Store it in `sz` first.
✍️ Pushing `null` children; check before pushing.

## Complexity

O(n) time, O(w) space where w is the maximum width (up to n/2 for a perfect tree).
