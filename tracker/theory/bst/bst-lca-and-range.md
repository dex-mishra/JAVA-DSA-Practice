# Using BST order — LCA and range queries

> In a BST, the LCA of p and q is the first node whose value lies between them. Range sums and trims prune entire subtrees by comparing with the bounds.

## LCA in a BST

✍️ Walk from the root: if both p and q are smaller, go left; if both larger, go right; otherwise this node **splits** them → it is the LCA.
```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;
    }
    return null;
}
```
✍️ O(h) time, O(1) space — no need to search both subtrees as in a general tree.

## Range pruning

✍️ Range sum of BST (LeetCode 938): if node < low, only the right subtree can contain values in range; if node > high, only the left. Skip the other side entirely.
- Trim a BST, count nodes in range, closest value: same pruning by comparison.
