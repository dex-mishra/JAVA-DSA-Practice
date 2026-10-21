# Treating a tree as a graph — parent pointers

> Record each node's parent with one DFS, then BFS from the target in three directions (left, right, parent) to find nodes at distance k.

## Idea

✍️ Tree edges only point down. "Distance k from a node" needs to go **up** too. Add the missing direction: a map `parent[node]`.
✍️ Then the tree is an undirected graph; BFS from the target for k levels, with a visited set so you never walk back.

## Template

```java
Map<TreeNode, TreeNode> par = new HashMap<>();
void mark(TreeNode n, TreeNode p) {
    if (n == null) return; par.put(n, p); mark(n.left, n); mark(n.right, n);
}
List<Integer> distanceK(TreeNode root, TreeNode target, int k) {
    mark(root, null);
    Deque<TreeNode> q = new ArrayDeque<>(); q.offer(target);
    Set<TreeNode> seen = new HashSet<>(); seen.add(target);
    for (int d = 0; d < k && !q.isEmpty(); d++) {
        for (int sz = q.size(); sz > 0; sz--) {
            TreeNode x = q.poll();
            for (TreeNode y : new TreeNode[]{x.left, x.right, par.get(x)})
                if (y != null && !seen.contains(y)) { seen.add(y); q.offer(y); }
        }
    }
    List<Integer> out = new ArrayList<>();
    while (!q.isEmpty()) out.add(q.poll().val);
    return out;
}
```

## Where else

Burning tree / time to infect the whole tree (LeetCode 2385), nodes at distance k, closest leaf.
