# Return one thing, record another — the global answer pattern

> When the best answer can bend through a node (diameter, max path sum), the function returns the best straight downward path, while a global variable records the best bent path through each node.

## Idea

✍️ A path that **passes through** a node uses both its left and right arms. But a parent can only extend a path that goes **straight down** one side.
✍️ So the recursive function returns the best straight-down path (one arm), and at every node it updates a global best with the bent path (left arm + node + right arm).
✍️ Two different quantities: **what you return** (useful to the parent) ≠ **what you record** (the answer).

## Example: diameter

```java
int best = 0;
int depth(TreeNode n) {                      // returns: NODES on the longest downward path from n
    if (n == null) return 0;
    int L = depth(n.left), R = depth(n.right);
    best = Math.max(best, L + R);            // L nodes down-left = L edges from n; so L + R = edges of the bent path
    return 1 + Math.max(L, R);               // straight path offered to the parent
}
int diameterOfBinaryTree(TreeNode root) { best = 0; depth(root); return best; }
```

## Example: maximum path sum

```java
int best = Integer.MIN_VALUE;
int gain(TreeNode n) {                        // best sum of a downward path starting at n
    if (n == null) return 0;
    int L = Math.max(0, gain(n.left));        // a negative arm is better left out
    int R = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + L + R);     // bent path through n
    return n.val + Math.max(L, R);            // one arm only for the parent
}
```
✍️ `max(0, …)` drops arms that would reduce the sum. `best` starts at INT_MIN because all values may be negative.

## Pitfalls

✍️ Returning `L + R + node` to the parent — a parent cannot use a bent path (it would visit the node twice).
✍️ Global variable not reset between test cases (LeetCode reuses the object) — reset it in the main function.
