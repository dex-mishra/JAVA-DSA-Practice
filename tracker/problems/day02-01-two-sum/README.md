# Two Sum

**LeetCode:** [1. Two Sum](https://leetcode.com/problems/two-sum/) (Easy)  
**Day:** 2  
**Pattern:** hash-complement  
**Role:** LEARN

## Understand

✍️ f(unsorted array a, target) → indices [i, j], i ≠ j, with a[i] + a[j] = target. Exactly one answer exists.
- n ≤ 10⁴ (so O(n²) actually passes — but the follow-up asks for better than O(n²), and interviews always do).
- Values up to ±10⁹.

## Analyse

✍️ Target complexity: O(n) or O(n log n).
✍️ By hand on [2, 7, 11, 15], target 9: at 2 I think "I need a 7" and my eyes scan for 7. That scan is the expensive part.
✍️ Hard part: finding the partner without scanning, while still returning **original indices** (so sorting is awkward).
✍️ Edges: [3, 3] target 6 (equal values); [3, 2, 4] target 6 (3 must not pair with itself).

## Brainstorm: brute → optimal

✍️ **1. Brute.** All pairs i < j. O(n²) time, O(1) space.
✍️ ↳ Bottleneck: the inner loop. Its job: "search the array for the value target − a[i]".
✍️ ↳ Unlock: "Am I searching for something I could have remembered?" — yes, a specific known value.
✍️ **2. Better (sort + two pointers).** O(n log n), but sorting loses the original indices; you must sort (value, index) pairs. Workable, more code.
✍️ **3. Better (two-pass hash).** Put every value → index in a map, then look up target − a[i] for each i, making sure the index found is not i. O(n).
✍️ **4. Optimal (one-pass hash).** Look up first, insert after. Only earlier elements are in the map → no self-pairing check needed, and you stop at the first hit. O(n) time, O(n) space.
>> detour hash-table-internals#why-o1 | Why the map lookup is O(1) — and when it is not | 3 min

## Algorithm in words

✍️ 1. Create an empty map from value to index.
✍️ 2. Walk the array. For element x at index i, compute need = target − x.
✍️ 3. If need is in the map, return [map[need], i].
✍️ 4. Otherwise store x → i and continue.

## Pseudocode

```
STATE   seen = map value → index (empty)
LOOP    for i in 0..n-1, x = a[i]
CHECK     need = target - x
          if need in seen: return [seen[need], i]
UPDATE    seen[x] = i                  ← after the check
RETURN  []                             (unreachable: an answer is guaranteed)
```

## Reference Java

```java
class Solution {
    public int[] twoSum(int[] a, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value to index
        for (int i = 0; i < a.length; i++) {
            int need = target - a[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(a[i], i);
        }
        return new int[]{};
    }
}
```

## Dry run

Input [3, 2, 4], target 6:
| i | x | need | in seen? | seen after |
|---|---|---|---|---|
| start | | | | {} |
| 0 | 3 | 3 | no (3 is not inserted yet) | {3:0} |
| 1 | 2 | 4 | no | {3:0, 2:1} |
| 2 | 4 | 2 | yes → return [1, 2] | |
If we had inserted before checking, i = 0 would have found 3 and returned [0, 0].

## Edge cases and complexity

✍️ O(n) average time, O(n) space. Brute force is the classic O(n²) time / O(1) space trade-off.
✍️ Duplicates [3, 3]: at i = 1, need 3 is already in the map from i = 0 → [0, 1]. Correct because we check before inserting.
- Overflow check: values and target are within ±10⁹, so `target − a[i]` is within ±2·10⁹ — just inside int's limit of ≈ 2.147·10⁹. Fine here, but in variants with larger values use `long need` ([[cpp-integer-overflow#ranges]]).

## Carry forward

✍️ Pair search on **unsorted** data → store what you have seen, look up what you need.
✍️ Always **check, then insert** when an element must not pair with itself.
✍️ The map's value is whatever the question asks for: index here, count when counting pairs, last index when distance matters.

## Interview follow-ups

- *The array is sorted; O(1) space?* Two pointers from both ends (tomorrow, [[tp-opposite-ends]]).
- *Return all pairs / count pairs.* Store counts; add count[need] at each step.
- *Three numbers summing to target?* Sort + fix one + two pointers (tomorrow's 3Sum).
- *What if the input does not fit in memory?* Sort externally and two-pointer, or hash-partition the data into chunks by value.

## Siblings

- [Contains Duplicate](siblings/contains-duplicate/) (must)
- [Number of Good Pairs](siblings/number-of-good-pairs/) (optional)
- [Contains Duplicate II](siblings/contains-duplicate-ii/) (optional)
