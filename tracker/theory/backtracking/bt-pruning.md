# Pruning — cutting branches that cannot succeed

> Check validity before recursing, use sortedness to break early, and maintain O(1) constraint checks so whole subtrees are skipped.

## Idea

✍️ Backtracking is exponential; the only way to make it fast is to stop exploring a branch as soon as it **cannot** lead to a valid answer.
✍️ Check before the recursive call, not at the leaf. A check at the leaf still pays for the whole subtree.

## Pruning tools

✍️ **Bounds**: remaining sum < 0, too many items, not enough items left (`n − i < k − path.size()`).
✍️ **Sorted input + break**: once `c[i] > remain`, every later candidate is larger too.
✍️ **Constraint counters**: generate parentheses only adds ")" if `close < open`, and "(" if `open < n` — invalid strings are never built.
✍️ **O(1) conflict checks with marker arrays**: N-Queens keeps `col[c]`, `diag[r − c + n]`, `anti[r + c]` so "is this square attacked?" is O(1) instead of scanning the board.

## N-Queens (recognition)

Place one queen per row. For row r, try each column c not attacked (three marker arrays), mark, recurse to r+1, unmark. n = 8 → 92 solutions; the pruning keeps it tiny compared with 8⁸ placements.
