# Iterative traversals with an explicit stack

> Replace the call stack with your own: inorder pushes all left children then visits; preorder pops and pushes right before left.

## Iterative inorder

```java
List<Integer> inorder(TreeNode root) {
    List<Integer> out = new ArrayList<>(); Deque<TreeNode> st = new ArrayDeque<>(); TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }   // go as far left as possible
        cur = st.pop();
        out.add(cur.val);                                 // visit
        cur = cur.right;                                  // then the right subtree
    }
    return out;
}
```
✍️ The stack holds the nodes whose left subtree is being processed and whose own visit is still pending.

## Iterative preorder

✍️ Pop a node, visit it, push **right** then **left** (so left is popped first).

## Iterative postorder (recognition)

Do a modified preorder (node, right, left) and reverse the output → (left, right, node). Or use one stack with a "last visited" pointer.

## Why learn these

✍️ Interviewers ask "can you do it without recursion?" for inorder (LeetCode 94 follow-up). Also needed when recursion depth could overflow ([[cpp-recursion-stack-limits]]).
- BST iterator (LeetCode 173) is exactly the iterative inorder split into `next()` calls.
