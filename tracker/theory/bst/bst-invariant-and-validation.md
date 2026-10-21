# The BST invariant and validating it

> Every node's value is greater than everything in its left subtree and less than everything in its right subtree — not just its children. Validate by passing a (low, high) range down.

## The invariant

✍️ For every node: **all** values in the left subtree < node < **all** values in the right subtree.
✍️ Checking only `left.val < node.val < right.val` is wrong: a grandchild can violate the rule (5 → left 3 → right 6 passes the child check but 6 > 5 is in 5's left subtree).

## Validate with a range

```java
boolean valid(TreeNode n, long lo, long hi) {      // all values must be in (lo, hi)
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}
boolean isValidBST(TreeNode root) { return valid(root, Long.MIN_VALUE, Long.MAX_VALUE); }
```
✍️ Going left tightens the upper bound to the node's value; going right tightens the lower bound.
✍️ Use `long` bounds: node values can be INT_MIN / INT_MAX.

## The inorder way

✍️ A tree is a BST iff its inorder traversal is **strictly increasing**. Keep the previous value seen and compare ([[bst-inorder-sorted-property]]).
