# Lowest common ancestor in a binary tree

> Return the node if it is p or q; otherwise ask both subtrees. If both return non-null, this node is the LCA; else pass up whichever is non-null.

## Idea

✍️ Define `f(node)` = "p or q if one of them is in this subtree, or the LCA if both are, else null".
✍️ If node is p or q, return node (an ancestor of the other, or the meeting point higher up).
✍️ Otherwise: if the left and right subtrees both return something, p and q are on different sides → node is the LCA. If only one side returns something, pass it up.

## Template

```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode L = lowestCommonAncestor(root.left, p, q);
    TreeNode R = lowestCommonAncestor(root.right, p, q);
    if (L != null && R != null) return root;   // split point
    return L != null ? L : R;
}
```

## Why returning early at p is correct

✍️ If q is below p, the LCA is p itself, and we never need to look below p. If q is elsewhere, the split happens at some ancestor of p, which sees p returned from one side and q from the other.
- This relies on both p and q existing in the tree (LeetCode guarantees it). Otherwise you must confirm both were found.

## Complexity

O(n) time, O(h) stack. For a BST, use the values to go straight down in O(h) ([[bst-lca-and-range]]).
