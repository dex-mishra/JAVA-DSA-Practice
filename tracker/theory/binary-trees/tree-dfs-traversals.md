# DFS traversals — preorder, inorder, postorder

> Three orders that differ only in when the node itself is processed relative to its subtrees. Which one you need depends on whether the node's answer needs its children's answers.

## The three orders

✍️ **Preorder**: node, left, right. Process a node before its children → top-down information (depth so far, path so far).
✍️ **Inorder**: left, node, right. For a BST this visits values in **sorted** order ([[bst-inorder-sorted-property]]).
✍️ **Postorder**: left, right, node. Process a node after its children → bottom-up answers (heights, sizes, sums).

```java
void dfs(TreeNode root, List<Integer> out) {
    if (root == null) return;
    // out.add(root.val);   ← preorder
    dfs(root.left, out);
    out.add(root.val);             // ← inorder
    dfs(root.right, out);
    // out.add(root.val);   ← postorder
}
```

## Which order do I need?

✍️ Does the node need information from its **parent** (depth, running sum, allowed range)? → preorder / pass it down as a parameter ([[tree-top-down-parameters]]).
✍️ Does the node need its **children's** results (height, balanced?, max path)? → postorder / return values up ([[tree-bottom-up-return-values]]).
✍️ BST and you need sorted order → inorder.

## Paired recursion (Symmetric Tree, Same Tree)

✍️ Some problems compare two trees (or two subtrees) at once: recurse on **pairs** of nodes.
```java
boolean mirror(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;   // both null → true; one null → false
    return a.val == b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
}
boolean isSymmetric(TreeNode root) { return root == null || mirror(root.left, root.right); }
```
✍️ Same Tree compares (left, left) and (right, right); Symmetric compares (left, right) and (right, left).

## Complexity

O(n) time (each node visited once), O(h) recursion stack, where h is the height (O(log n) balanced, O(n) skewed).
