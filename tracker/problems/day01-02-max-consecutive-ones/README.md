# Max Consecutive Ones

**LeetCode:** [485. Max Consecutive Ones](https://leetcode.com/problems/max-consecutive-ones/) (Easy)  
**Day:** 1  
**Pattern:** running-state-reset  
**Role:** APPLY

## Understand

✍️ f(binary array) → length of the longest block of consecutive 1s.
- n ≤ 10⁵ → need O(n) (or O(n log n)).
- Example: [1,1,0,1,1,1] → 3.

## Analyse

✍️ By hand: I count 1, 2 — hit a 0, reset to 0 — then 1, 2, 3. The answer is the biggest count I said.
✍️ Hard part: remembering the best while the current count keeps resetting.
✍️ Edges: all zeros → 0; all ones → n; the longest block at the very end.

## Brainstorm: brute → optimal

✍️ **1. Brute.** From every start i, count forward while 1s continue. O(n²) on an all-ones array.
✍️ ↳ Bottleneck: a block of length L is re-counted from each of its L positions.
✍️ ↳ Unlock: "recomputing something that only changed a little" — the streak ending at i is (streak ending at i−1) + 1, or 0.
✍️ **2. Optimal.** One pass with `cur` (streak ending here) and `best`. O(n), O(1).

## Algorithm in words

✍️ 1. Keep a current streak and a best streak, both 0.
✍️ 2. For each element: if it is 1, extend the current streak; otherwise reset it to 0.
✍️ 3. After each element, update best with the current streak.
✍️ 4. Return best.

## Pseudocode

```
STATE   cur = 0; best = 0
LOOP    for x in a
UPDATE    if x == 1: cur = cur + 1  else: cur = 0
          best = max(best, cur)          (every step, not only on a reset)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int findMaxConsecutiveOnes(int[] a) {
        int cur = 0, best = 0;
        for (int x : a) {
            cur = (x == 1) ? cur + 1 : 0;
            best = Math.max(best, cur);
        }
        return best;
    }
}
```

## Dry run

| x | cur | best |
|---|---|---|
| start | 0 | 0 |
| 1 | 1 | 1 |
| 1 | 2 | 2 |
| 0 | 0 | 2 |
| 1 | 1 | 2 |
| 1 | 2 | 2 |
| 1 | 3 | 3 |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ If `best` were updated only when a 0 appears, [1,1,1] would return 0. Update every step.
- All zeros → best stays 0.

## Carry forward

✍️ "Streak / consecutive" → current + best; reset on break; update best every iteration.
✍️ When the problem lets you break the rule up to k times, the streak becomes a **sliding window** (Day 5).

## Interview follow-ups

- *You may flip at most one 0.* (LeetCode 487) Track the streak before and after the last zero, or a window with ≤ 1 zero.
- *At most k flips.* Variable window with a zero budget ([[sw-variable-window#budget]]).
- *Data arrives as a stream.* The same two variables work — nothing needs to be stored.

## Siblings

- [Consecutive Characters](siblings/consecutive-characters/) (must)
- [Longest Continuous Increasing Subsequence](siblings/longest-continuous-increasing-subsequence/) (optional)
- [Length of the Longest Alphabetical Continuous Substring](siblings/length-of-the-longest-alphabetical-continuous-substring/) (optional)
