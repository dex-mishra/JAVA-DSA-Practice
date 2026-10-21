# Building a tree from preorder and inorder

> Preorder's first element is the root; its position in inorder splits the left and right subtrees. Recurse with index ranges and a value → index map.

## Idea

✍️ preorder = [root, ...left subtree..., ...right subtree...]. inorder = [...left..., root, ...right...].
✍️ The root is `preorder[0]`. Find it in inorder at index m: everything left of m is the left subtree (size `m − inL`), everything right is the right subtree.
✍️ Recurse on the matching slices. Use a hash map value → inorder index so finding the root is O(1).

## Template

```java
Map<Integer,Integer> pos = new HashMap<>(); int pre = 0;  // pre = next preorder index to use
TreeNode build(int[] P, int inL, int inR) {          // builds from inorder[inL..inR]
    if (inL > inR) return null;
    int v = P[pre++];
    TreeNode node = new TreeNode(v);
    int m = pos.get(v);
    node.left = build(P, inL, m - 1);                // left FIRST: preorder lists left before right
    node.right = build(P, m + 1, inR);
    return node;
}
TreeNode buildTree(int[] P, int[] I) {
    pos.clear(); pre = 0;
    for (int i = 0; i < I.length; i++) pos.put(I[i], i);
    return build(P, 0, I.length - 1);
}
```

## Pitfalls

✍️ Building the right subtree before the left breaks the shared `pre` index.
✍️ Using `find` in the inorder array instead of a map → O(n²).
✍️ Requires unique values (stated in the problem).

## Variations

- Inorder + postorder: the root is the **last** postorder element; build **right before left** while walking postorder backwards.
- Preorder alone is enough for a BST (bounds tell you where the left subtree ends).
