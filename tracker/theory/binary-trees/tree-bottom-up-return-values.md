# Bottom-up recursion — returning answers from subtrees

> Define what the function returns for a subtree, get it for both children, combine into the answer for the current node. Height, size, balanced, sums.

## Idea

✍️ Write one sentence: "`f(node)` returns ___ for the subtree rooted at node". Base case: `f(null)`. Recursive case: combine `f(node.left)` and `f(node.right)` with the node itself.
✍️ This is postorder: children first, then the node.

## Template

```java
// f(node) = number of nodes on the longest path from node down to a leaf
int maxDepth(TreeNode node) {
    if (node == null) return 0;                            // empty subtree
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
```

## Returning a sentinel for "invalid"

✍️ Balanced tree check: return the height if the subtree is balanced, **−1** if it is not. One pass instead of computing heights again at every node.
```java
int h(TreeNode n) {
    if (n == null) return 0;
    int l = h(n.left);  if (l < 0) return -1;
    int r = h(n.right); if (r < 0) return -1;
    if (Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
}
boolean isBalanced(TreeNode root) { return h(root) >= 0; }
```
✍️ The naive version calls `height()` from every node → O(n²) on a chain. The sentinel version is O(n).

## Recognise it

✍️ The answer for a node depends on answers for its children: height, size, sum, min/max value, "is this subtree a BST/balanced/symmetric", count of good nodes below.

## Complexity

O(n) time, O(h) stack.
