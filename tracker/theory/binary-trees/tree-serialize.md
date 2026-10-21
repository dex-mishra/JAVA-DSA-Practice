# Serialising and deserialising a tree (recognition level)

> Write a preorder traversal with explicit null markers; read it back with the same recursion. The null markers make the shape unambiguous.

## Idea

✍️ Preorder alone cannot describe a tree's shape, but preorder **with nulls** can: "1,2,#,#,3,4,#,#,5,#,#".
✍️ Deserialise by reading tokens in the same order: a token is a node (then build its left, then its right) or '#' (return null).

## Code (for reference)

```java
void ser(TreeNode n, StringBuilder s) {
    if (n == null) { s.append("#,"); return; }
    s.append(n.val).append(",");
    ser(n.left, s); ser(n.right, s);
}
TreeNode des(Deque<String> tokens) {
    String t = tokens.poll();
    if (t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left = des(tokens); n.right = des(tokens);
    return n;
}
```

## Note

✍️ BFS with nulls (LeetCode's own format) also works. Both are O(n).
