# The bottleneck method — getting from brute force to optimal

> A repeatable way to improve a solution: write the brute force, find the single line doing the most wasted work, name why it is wasted, and pick the tool that removes exactly that waste.

## The idea

✍️ Optimal solutions are not invented; they are *derived*. You start from the dumbest correct solution and remove waste one step at a time.
✍️ At each step you ask the same question: **"What is the bottleneck, and why is it wasted work?"**
✍️ The answer to "why is it wasted" names the tool. "I keep searching for a value I could have remembered" → hash map. "I keep re-adding numbers I already added" → prefix sum or sliding window. "I check candidates in order when they are sorted" → binary search.

## Step 1: always write the brute force

✍️ The brute force is the solution that tries everything the problem allows. It is correct by construction.
Write it even when you think you know the optimal, because:
- It proves you understood the problem. If you cannot write the brute force, the optimal is guesswork.
- It gives you the baseline complexity, so you know what "better" means.
- In an interview, saying it out loud scores points and buys thinking time.
- In an OA, a brute force often passes 40–60% of the tests. A clever solution that does not work passes 0%.

✍️ Brute force shapes to recognise: all pairs (two nested loops, O(n²)), all subarrays (O(n²) or O(n³)), all subsets (O(2ⁿ)), all orderings (O(n!)), "try every possible answer" (O(range × check)).

## Step 2: find the bottleneck

✍️ The bottleneck is the innermost loop or the most repeated computation. Point at it with your pen.
Then describe, in plain words, what that inner loop is *doing*. Do not describe the code; describe the job:
- "For each element, it scans the rest of the array looking for one specific value."
- "For each start, it re-sums the subarray from scratch."
- "For each window, it recounts characters."
- "It tries capacities 1, 2, 3, … one by one."

✍️ The job description is the key output of this step. It nearly always contains the waste.

## Step 3: name why the work is wasted

✍️ Common kinds of waste and the tool that removes each:

| Waste (what the inner loop keeps doing) | Tool that removes it | Page |
|---|---|---|
| Searching for a value I have already seen | Hash map / set | [[hash-complement-lookup]] |
| Recounting the same elements | Frequency array / map | [[hash-frequency-counting]] |
| Re-summing overlapping ranges | Prefix sum | [[ps-prefix-sum-basics]] |
| Recomputing a window that only moved by one | Sliding window | [[sw-variable-window]] |
| Checking every candidate in a sorted space | Binary search | [[bs-classic-and-invariants]] |
| Checking every pair when sorted order tells me which side to move | Two pointers | [[tp-opposite-ends]] |
| Recomputing the same subproblem in recursion | Memoisation / DP | [[dp-what-dp-is]] |
| Scanning for the max/min of a changing set | Heap / monotonic deque | [[heap-top-k]] |
| Looking for the next greater/smaller element by scanning ahead | Monotonic stack | [[stq-monotonic-stack]] |

## Questions that unlock the next step

✍️ Ask these in order when you are stuck between brute force and something better:
✍️ 1. Am I searching for something I could have **remembered**?
✍️ 2. Am I **recomputing** something that only changed a little?
✍️ 3. Would **sorting** the input make the search trivial — and can I afford O(n log n)?
✍️ 4. Is the answer **monotone** (if x works, does x+1 work)? Then binary search the answer.
✍️ 5. Can I decide something **locally** and never revisit it? Then it might be greedy.
✍️ 6. Do I solve the **same smaller problem** many times? Then DP.
✍️ 7. Does each element only need its **nearest** bigger/smaller neighbour? Then a monotonic stack.

## Worked example: three steps on one problem

Problem: count subarrays whose sum equals `k` (LeetCode 560).

**Brute force.** Every start `i`, every end `j`, sum `a[i..j]` with a third loop. O(n³).
Bottleneck: the innermost loop re-sums `a[i..j]` even though we just computed `a[i..j-1]`.
Waste: recomputing a sum that only grew by one element.
Tool: keep a running sum as `j` moves → O(n²).

**Better.** Every start `i`, extend `j` with a running sum. O(n²).
Bottleneck: for each end `j`, we still try every start `i` to see if `sum(i..j) = k`.
Job description: "for each end, search for starts whose prefix sum equals `prefix[j] − k`".
Waste: *searching* for a value (`prefix[j] − k`) that we could have *remembered*. Unlock question 1.
Tool: a hash map from prefix-sum value to how many times it has appeared → O(n).

**Optimal.** One pass, running prefix sum, map lookup. O(n) time, O(n) space.

Notice that each step changed exactly one thing, and each change was named by the waste.

## When to stop optimising

✍️ Stop when the complexity matches what the constraints require ([[cx-constraints-to-target]]). Beyond that, extra cleverness only adds bugs.
- If the target is O(n log n) and you have O(n log n), code it.
- If you have reached O(n) time, the next question is usually space: can the map be replaced by two pointers or a few variables? Only ask it if the problem says "O(1) extra space" or the interviewer asks.
