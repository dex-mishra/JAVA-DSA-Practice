# Two Sum II - Input Array Is Sorted

**LeetCode:** [167. Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) (Medium)  
**Day:** 3  
**Pattern:** opposite-ends  
**Role:** LEARN

## Understand

✍️ f(sorted array a (1-indexed answer), target) → [i, j] with i < j and a[i] + a[j] = target. Exactly one answer. Must use O(1) extra space.
- n ≤ 3·10⁴.
- [2, 7, 11, 15], target 9 → [1, 2].

## Analyse

✍️ Same question as Two Sum, but sorted and with a space limit — the space limit rules out yesterday's map.
✍️ By hand: 2 + 15 = 17 is too big. Is 15 useful with anything? Its smallest partner is 2, already too big → 15 is useless. Drop it.
✍️ Hard part: trusting that dropping an element can never lose the answer.
✍️ Edges: negative numbers; the answer is the two end elements; equal values.

## Brainstorm: brute → optimal

✍️ **1. Brute.** All pairs. O(n²).
✍️ **2. Better.** For each i, binary search target − a[i] in a[i+1..]. O(n log n), O(1).
✍️ ↳ Bottleneck: each search restarts from scratch, but as a[i] grows its partner can only get smaller.
✍️ **3. Hash map.** O(n) time but O(n) space — breaks the requirement.
✍️ **4. Optimal.** l = 0, r = n−1. Sum too small → only a bigger left element can help → l++. Too big → r--. O(n), O(1).

## Algorithm in words

✍️ 1. Start with one pointer at each end.
✍️ 2. While they have not met, add the two values.
✍️ 3. Equal to target → return the 1-based indices.
✍️ 4. Smaller → move the left pointer right. Larger → move the right pointer left.

## Pseudocode

```
STATE   l = 0; r = n-1
LOOP    while l < r
CHECK     s = a[l] + a[r]
          if s == target: return [l+1, r+1]
UPDATE    if s < target: l++   else: r--
RETURN  []
```

## Reference Java

```java
class Solution {
    public int[] twoSum(int[] a, int target) {
        int l = 0, r = a.length - 1;
        while (l < r) {
            int s = a[l] + a[r];
            if (s == target) return new int[]{l + 1, r + 1};
            if (s < target) l++;
            else r--;
        }
        return new int[]{};
    }
}
```

## Dry run

[2, 3, 4], target 6:
| l | r | a[l]+a[r] | move |
|---|---|---|---|
| 0 | 2 | 6 | found → [1, 3] |
[1, 2, 7, 11], target 9:
| l | r | sum | move |
|---|---|---|---|
| 0 | 3 | 12 | r-- |
| 0 | 2 | 8 | l++ |
| 1 | 2 | 9 | found → [2, 3] |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ 1-based output — easy to forget.
- Sum of two values ≤ 1000 in magnitude here, so no overflow; use `long` in variants.

## Carry forward

✍️ Unsorted + indices → hash map. Sorted (or sortable when indices don't matter) + O(1) space → two pointers.
✍️ Every pointer move must be justified by "the discarded element cannot be in a valid answer".

## Interview follow-ups

- *Count all pairs with sum < target.* When a[l] + a[r] < target, all r − l pairs (l, l+1..r) qualify ([[tp-opposite-ends#variations]]).
- *Pair with the closest sum.* Track min |s − target| while moving the same way.
- *Why is binary search per element worse?* O(n log n) vs O(n); it ignores that the partner moves monotonically.

## Siblings

- [Squares of a Sorted Array](siblings/squares-of-a-sorted-array/) (must)
- [Reverse String](siblings/reverse-string/) (optional)
- [Count Pairs Whose Sum is Less than Target](siblings/count-pairs-whose-sum-is-less-than-target/) (optional)
