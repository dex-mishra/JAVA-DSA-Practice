# Greedy reach — Jump Game I and II

> Track the farthest index reachable so far; for minimum jumps, treat each jump as a BFS level whose range is [current end + 1, farthest].

## Can you reach the end?

✍️ Walk i from left to right while `i <= reach`; update `reach = max(reach, i + a[i])`. If you ever stand at an index beyond `reach`, it is unreachable → false.
```java
boolean canJump(int[] a) {
    int reach = 0;
    for (int i = 0; i < a.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + a[i]);
    }
    return true;
}
```
✍️ Why greedy works: every index ≤ reach is reachable (you can stop anywhere along a jump), so only the maximum reach matters.

## Minimum number of jumps

✍️ Think BFS levels: indices reachable with 1 jump form a range, with 2 jumps the next range, and so on. Track `end` (last index of the current level) and `far` (farthest reachable from this level).
```java
int jump(int[] a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i < a.length - 1; i++) {        // stop before the last index
        far = Math.max(far, i + a[i]);
        if (i == end) { jumps++; end = far; }       // finished this level → one more jump
    }
    return jumps;
}
```
✍️ Loop to `n − 2`: when you are already at the last index you do not jump again.

## Complexity

Both O(n) time, O(1) space. A DP solution (min jumps to reach each index) is O(n²) — the greedy is the expected answer.
