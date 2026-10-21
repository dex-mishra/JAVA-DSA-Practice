# BST search, insert and delete

> Search and insert follow one path down by comparing values. Delete has three cases: leaf, one child, two children (replace with the inorder successor).

## Search and insert

✍️ Search: go left if target < node, right if >, stop when equal or null. O(h).
✍️ Insert: search for the value; the null position where the search ends is where the new node goes.

## Delete — three cases

✍️ Find the node. Then:
✍️ 1. **No children**: remove it (return null to the parent).
✍️ 2. **One child**: replace the node with that child.
✍️ 3. **Two children**: find the **inorder successor** (smallest value in the right subtree), copy its value into the node, then delete the successor from the right subtree (it has at most one child).
```java
TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = deleteNode(root.left, key);
    else if (key > root.val) root.right = deleteNode(root.right, key);
    else {
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        TreeNode s = root.right;
        while (s.left != null) s = s.left;           // inorder successor
        root.val = s.val;
        root.right = deleteNode(root.right, s.val);
    }
    return root;
}
```
✍️ The function **returns the new root of the subtree** and the parent reassigns its child pointer — this handles all three cases without tracking the parent.

## Complexity

O(h): O(log n) balanced, O(n) for a skewed BST. Self-balancing trees (AVL, red-black — what Java's `TreeMap` uses) keep h = O(log n).
