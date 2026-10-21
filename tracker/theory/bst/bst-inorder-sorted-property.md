# Inorder of a BST is sorted

> Inorder traversal of a BST visits values in increasing order — k-th smallest, validation, two-sum on a BST and conversion to a sorted list all follow.

## Idea

✍️ Inorder = left, node, right. In a BST, left < node < right, so inorder lists values in sorted order.
✍️ k-th smallest: run inorder and stop at the k-th visited node. Iterative inorder lets you stop early cleanly.

## Template: k-th smallest

```java
int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> st = new ArrayDeque<>(); TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }
        cur = st.pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}
```

## Interview follow-up

"What if the BST is modified often and you query k-th smallest often?" → store subtree sizes in each node; then go left/right by comparing k with the left size, O(h) per query.

## Complexity

O(h + k) time, O(h) space.
