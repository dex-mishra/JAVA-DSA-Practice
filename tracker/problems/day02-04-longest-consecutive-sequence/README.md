# Longest Consecutive Sequence

**LeetCode:** [128. Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) (Medium)  
**Day:** 2  
**Pattern:** set-start-of-run  
**Role:** DISGUISE

## Understand

✍️ f(unsorted array) → length of the longest set of values that form consecutive integers v, v+1, …, v+L−1 (positions do not matter).
- n ≤ 10⁵, must be O(n).
- [100, 4, 200, 1, 3, 2] → 4 (1, 2, 3, 4).

## Analyse

✍️ This is a DISGUISE: nothing says "hash set", but the O(n) requirement on unsorted data does.
✍️ By hand: I look at 4 and ask "is 5 there? is 3 there?". If I always start counting from the smallest number of a run, I count each run once.
✍️ Hard part: avoiding counting the same run many times.
✍️ Edges: empty array → 0; duplicates [1, 2, 0, 1] → 3; negatives.

## Brainstorm: brute → optimal

✍️ **1. Brute.** For each value v, check v+1, v+2, … by scanning the array each time. O(n³) worst.
✍️ **2. Better.** Sort, then scan counting runs and skipping duplicates. O(n log n) — fails the O(n) requirement.
✍️ **3. Better.** Put values in a set; for each value walk upward with O(1) lookups. O(n²) on input like 1..n (each run walked from every element).
✍️ ↳ Bottleneck: a run of length L is walked L times.
✍️ ↳ Unlock: every run has exactly one start — the value whose predecessor is missing. Walk only from starts.
✍️ **4. Optimal.** Set + start-of-run. Each value is part of exactly one walk → O(n).

## Algorithm in words

✍️ 1. Insert all values into a hash set.
✍️ 2. For each value v in the set: if v − 1 is also in the set, skip it (not a start).
✍️ 3. Otherwise walk v+1, v+2, … while present, counting the length.
✍️ 4. Keep the maximum length.

## Pseudocode

```
STATE   s = set(a); best = 0
LOOP    for v in s                       (the set, so duplicates are gone)
CHECK     if (v - 1) in s: continue      (not the start of a run)
UPDATE    len = 1
          while (v + len) in s: len++
          best = max(best, len)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int longestConsecutive(int[] a) {
        Set<Integer> s = new HashSet<>();
        for (int x : a) s.add(x);
        int best = 0;
        for (int v : s) {
            if (s.contains(v - 1)) continue;
            int len = 1;
            while (s.contains(v + len)) len++;
            best = Math.max(best, len);
        }
        return best;
    }
}
```

## Dry run

s = {100, 4, 200, 1, 3, 2}:
| v | v−1 present? | walk | best |
|---|---|---|---|
| 100 | no (99) | 100 → len 1 | 1 |
| 4 | yes (3) | skip | 1 |
| 200 | no | len 1 | 1 |
| 1 | no (0) | 1,2,3,4 → len 4 | 4 |
| 3 | yes | skip | 4 |
| 2 | yes | skip | 4 |

## Edge cases and complexity

✍️ O(n) average time: n inserts; each value is checked once as a possible start and visited at most once by a walk. O(n) space.
>> detour cx-amortised-analysis#counting-trick | Why the inner while loop does not make this O(n²) | 3 min
✍️ Empty input → the loop never runs → 0.
- `v + len` with v near INT_MAX could overflow in theory; LeetCode's range is ±10⁹, so it is safe.

## Carry forward

✍️ O(n) required + unsorted + "consecutive / sequence" → hash set, not sorting.
✍️ To count each group once, start only from its canonical first member.
✍️ A loop inside a loop can still be O(n) if each element is charged to one inner walk.

## Interview follow-ups

- *Return the sequence itself.* Remember the start of the best run.
- *Streaming input?* Union-find or a map of run boundaries (value → length of run ending/starting here), updating neighbours on insert.
- *Why not sort?* O(n log n) violates the requirement; mention it as the simpler fallback.

## Siblings

- [Longest Square Streak in an Array](siblings/longest-square-streak-in-an-array/) (must)
- [Intersection of Two Arrays](siblings/intersection-of-two-arrays/) (optional)
- [First Missing Positive](siblings/first-missing-positive/) (optional)
