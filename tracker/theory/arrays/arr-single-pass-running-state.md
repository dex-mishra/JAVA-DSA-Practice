# Single pass with running state

> Walk the array once, carrying a few variables that summarise everything seen so far — running sums, counters that reset, best-so-far.

## Idea

✍️ Instead of looking back over earlier elements, keep a small **summary** of them in variables and update it as you move right.
✍️ The summary must be enough to answer the question at the current position. Typical summaries: total so far, current streak length, best so far, minimum so far.
✍️ Each element is read once → O(n) time, O(1) extra space (unless the output is an array).

## Recognise it

✍️ "running / cumulative / so far / streak / consecutive" in the statement.
✍️ The answer at position i depends only on position i and something about the elements before it.
✍️ The brute force has an inner loop that goes **backwards** from i to recompute something about the prefix.

## Brute force → running state

Brute force: at each i, loop back over 0..i to compute the sum / count / max. O(n²).
✍️ Bottleneck: the backward loop recomputes a summary that differs from the previous one by **one element**.
✍️ Fix: keep the previous summary and update it with a[i] in O(1).
This is the simplest instance of the bottleneck method ([[meta-bottleneck-method#name-waste]]): "recomputing something that only changed a little".
>> detour meta-bottleneck-method#find-bottleneck | First time finding a bottleneck? This is the method every later problem uses | 4 min

## Template

```java
// running total (prefix sum written into a new array)
int[] out = new int[n];
int run = 0;
for (int i = 0; i < n; i++) { run += a[i]; out[i] = run; }

// streak that resets
int cur = 0, best = 0;
for (int x : a) {
    if (x == target) cur++;      // extend the streak
    else cur = 0;                // condition broken → reset
    best = Math.max(best, cur);  // record after updating
}
```

## Variations

- Streak of equal neighbours: compare `a[i]` with `a[i-1]` instead of a fixed target (LeetCode 1446).
- Strictly increasing run: `a[i] > a[i-1]` extends, else reset to 1 (LeetCode 674).
- Running sum that must stay positive: track the minimum prefix (LeetCode 1413).
- Running state that allows *k* violations → this becomes a sliding window ([[sw-variable-window]]).

## Pitfalls

✍️ Where you update `best` matters: updating only when the streak breaks misses a streak that runs to the end of the array. Update every iteration, or once more after the loop.
✍️ Reset value: a streak of "matching elements" resets to 0; a run of "increasing elements" resets to 1 (the current element alone is a run of length 1).

## Complexity

O(n) time, O(1) extra space. You cannot do better than O(n) because every element must be read at least once.
