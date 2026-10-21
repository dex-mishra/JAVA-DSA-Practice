# Running Sum of 1d Array

**LeetCode:** [1480. Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/) (Easy)  
**Day:** 1  
**Pattern:** running-state  
**Role:** LEARN

## Understand

✍️ f(array a of n ints) → array out where out[i] = a[0] + a[1] + … + a[i].
- Constraints: n ≤ 1000, values between −10⁶ and 10⁶. Even O(n²) passes, but the point is to see the O(n) idea.
- Example: [1, 2, 3, 4] → [1, 3, 6, 10].

## Analyse

✍️ By hand on [3, 1, 2]: out[0] = 3. For out[1] I wrote 3 + 1 — but I did not re-add 3, I took out[0] and added 1. For out[2] I took out[1] = 4 and added 2 → 6.
✍️ Hard part: none really — the trap is writing two loops because the definition "sum of a[0..i]" sounds like a loop.
✍️ Edges: one element → itself. Negatives are fine.

## Brainstorm: brute → optimal

✍️ **1. Brute.** For each i, loop j from 0 to i and add a[j]. O(n²) time, O(1) extra.
✍️ ↳ Bottleneck: the inner loop re-adds a[0..i−1], which the previous iteration already added.
✍️ ↳ Unlock question: "Am I recomputing something that only changed a little?" ([[meta-bottleneck-method#unlock-questions]]) — yes, by exactly one element.
>> detour meta-bottleneck-method#unlock-questions | The seven unlock questions — you will reuse them all month | 2 min
✍️ **2. Optimal.** Keep the previous total and add a[i]. O(n) time.
✍️ (Bonus: write into `a` itself — `a[i] += a[i−1]` — for O(1) extra space.)

## Algorithm in words

✍️ 1. Start a running total at 0.
✍️ 2. For each element from left to right, add it to the running total.
✍️ 3. Write the running total into the output at that position.
✍️ 4. Return the output.

## Pseudocode

```
STATE   run = 0;  out = array of size n
LOOP    for i in 0..n-1
UPDATE    run = run + a[i]
          out[i] = run
RETURN  out
```

## Reference Java

```java
class Solution {
    public int[] runningSum(int[] a) {
        int[] out = new int[a.length];
        int run = 0;
        for (int i = 0; i < a.length; i++) {
            run += a[i];
            out[i] = run;
        }
        return out;
    }
}
```

## Dry run

| i | a[i] | run (after) | out |
|---|---|---|---|
| start | – | 0 | [_, _, _] |
| 0 | 3 | 3 | [3, _, _] |
| 1 | 1 | 4 | [3, 4, _] |
| 2 | 2 | 6 | [3, 4, 6] |

## Edge cases and complexity

✍️ Time O(n): one loop, O(1) work inside. Space O(n) for the output (O(1) extra if you overwrite the input).
- Overflow: 1000 × 10⁶ = 10⁹ fits in int. In general prefix sums need `long` ([[cpp-integer-overflow#where]]).
- One element → [a[0]].

## Carry forward

✍️ "Answer at i depends on the answer at i−1" → keep it in a variable, do not loop back.
✍️ This output array is called a **prefix sum array**. On Day 4 it answers any range sum in O(1).

## Interview follow-ups

- *Can you do it in O(1) extra space?* Overwrite: `for i in 1..n−1: a[i] += a[i−1]`.
- *Now answer many "sum from l to r" queries.* Build the prefix array once with a leading 0, answer `pre[r+1] − pre[l]` ([[ps-prefix-sum-basics#template]]).

## Siblings

- [Find Pivot Index](siblings/find-pivot-index/) (must)
- [Left and Right Sum Differences](siblings/left-and-right-sum-differences/) (optional)
- [Minimum Value to Get Positive Step by Step Sum](siblings/minimum-value-to-get-positive-step-by-step-sum/) (optional)
