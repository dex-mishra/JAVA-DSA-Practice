# Majority Element

**LeetCode:** [169. Majority Element](https://leetcode.com/problems/majority-element/) (Easy)  
**Day:** 2  
**Pattern:** boyer-moore-voting  
**Role:** TWIST

## Understand

✍️ f(array) → the value that appears more than ⌊n/2⌋ times (guaranteed to exist).
- n ≤ 5·10⁴. Follow-up: O(n) time and O(1) space.

## Analyse

✍️ First solve it with what you know today (a frequency map). Then the follow-up removes the map — that is the TWIST.
✍️ By hand on [2,2,1,1,1,2,2]: imagine pairing each 1 with a 2 and throwing both away. 2s are left over. The majority always survives this.
✍️ Edges: n = 1; majority at the very end.

## Brainstorm: brute → optimal

✍️ **1. Brute.** For each value count it with a scan. O(n²).
✍️ **2. Better (frequency map).** Count all, return the one with count > n/2. O(n) time, O(n) space.
>> detour cx-space-and-in-place#aux | What counts as extra space — and why the map is O(n) | 2 min
✍️ **3. Better (sort).** The majority must cover the middle index → return a[n/2]. O(n log n), O(1).
✍️ ↳ Bottleneck for O(1) space: storing a count for **every** value, when only one value matters.
✍️ ↳ Unlock: "a forbidden data structure is a hint" — no map means a counting/cancelling argument.
✍️ **4. Optimal (Boyer–Moore).** One candidate + one counter; equal → +1, different → −1, counter 0 → adopt the new value. O(n), O(1).

## Algorithm in words

✍️ 1. Start with no candidate and count 0.
✍️ 2. For each value: if the count is 0, make this value the candidate.
✍️ 3. If the value equals the candidate, increase the count; otherwise decrease it.
✍️ 4. The candidate at the end is the majority.

## Pseudocode

```
STATE   cand = none; cnt = 0
LOOP    for x in a
UPDATE    if cnt == 0: cand = x          (adopt FIRST)
          cnt += (x == cand) ? +1 : -1
RETURN  cand
```

## Reference Java

```java
class Solution {
    public int majorityElement(int[] a) {
        int cand = 0, cnt = 0;
        for (int x : a) {
            if (cnt == 0) cand = x;
            cnt += (x == cand) ? 1 : -1;
        }
        return cand;
    }
}
```

## Dry run

[2, 2, 1, 1, 1, 2, 2]:
| x | cand (after) | cnt (after) |
|---|---|---|
| 2 | 2 | 1 |
| 2 | 2 | 2 |
| 1 | 2 | 1 |
| 1 | 2 | 0 |
| 1 | 1 | 1 |
| 2 | 1 | 0 |
| 2 | 2 | 1 |
Answer 2.

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ The result is guaranteed only because a majority is guaranteed. Without the guarantee, verify with a second counting pass.

## Carry forward

✍️ Always solve it the "known" way first (frequency map), then remove the expensive part.
✍️ "O(1) extra space" on a counting problem → think cancellation (Boyer–Moore), XOR, or arithmetic — never a smarter map.
✍️ Majority > n/k → at most k−1 candidates.

## Interview follow-ups

- *Elements appearing more than n/3 times* (LeetCode 229): two candidates, two counters, verify at the end.
- *No majority guaranteed?* Second pass to count the candidate.
- *Why does sorting work?* A value covering more than half the positions must cover index n/2.

## Siblings

- [Majority Element II](siblings/majority-element-ii/) (must)
- [Find All Numbers Disappeared in an Array](siblings/find-all-numbers-disappeared-in-an-array/) (optional)
- [Sort Array by Increasing Frequency](siblings/sort-array-by-increasing-frequency/) (optional)
