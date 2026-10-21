# Recursion depth and stack limits

> How deep recursion can go on the JVM before StackOverflowError, which problems hit the limit, and how to convert to iteration.

## The limits

✍️ Each call uses a frame on the JVM thread stack. The default stack allows roughly ~10⁴–10⁵ frames of simple recursive methods, depending on frame size and the `-Xss` setting.
✍️ LeetCode is generous; recursion depth 10⁴–10⁵ usually works. Some OA platforms have smaller stacks.
- Overflowing the stack throws `StackOverflowError` (an `Error`, not a normal `Exception`) with a long self-similar stack trace on large tests of a recursive DFS — that is the tell-tale sign.

## When it is risky

✍️ DFS on a linked-list-shaped tree, a path graph, or a grid of 10⁶ cells → depth can equal n.
✍️ Fix: use an explicit `Deque<Integer>` as a stack (iterative DFS) or BFS. See [[tree-iterative-traversals]] and [[graph-dfs#iterative]].
- A heavy recursion can also be run on a thread created with a larger stack size (`new Thread(null, task, "name", 1 << 26)`), but converting to iteration is the portable fix.
