# 3Sum

**LeetCode:** [15. 3Sum](https://leetcode.com/problems/3sum/) (Medium)  
**Day:** 3  
**Pattern:** fix-one-two-pointers  
**Role:** TWIST

## Understand

✍️ f(array) → all **unique** triplets [x, y, z] (values, not indices) with x + y + z = 0.
- n ≤ 3000 → O(n²) = 9·10⁶ is fine, O(n³) = 2.7·10¹⁰ is not.
- [−1, 0, 1, 2, −1, −4] → [[−1, −1, 2], [−1, 0, 1]].

## Analyse

✍️ Target: O(n²). Values are returned, not indices → sorting is allowed.
✍️ By hand: if I fix −1, I need two numbers summing to +1 — that is Two Sum II on the rest of the array.
✍️ Hard part: **unique** triplets. The input [−1, −1, 2] could produce [−1, −1, 2] twice from different −1s.
✍️ Edges: all zeros [0, 0, 0, 0] → one triplet; fewer than 3 elements; no solution.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Three loops + a set of sorted triplets. O(n³) + dedup overhead.
✍️ ↳ Bottleneck: the inner two loops search for a pair with sum −a[i] — a 2-sum problem.
✍️ **2. Hash per i.** For each i, a hash-set two-sum on the rest. O(n²), but dedup is messy.
✍️ **3. Optimal.** Sort once. For each i: two pointers on i+1..n−1 looking for −a[i]. Dedup by skipping equal values (they are adjacent after sorting). O(n²), O(1) extra.

## Algorithm in words

✍️ 1. Sort the array.
✍️ 2. For each index i: skip it if a[i] equals a[i−1] (same first value → same triplets). Stop if a[i] > 0.
✍️ 3. Set l = i+1, r = n−1. While l < r: compute the sum. Too small → l++. Too big → r--.
✍️ 4. On a hit: record it, move both pointers, and skip over equal values on both sides.

## Pseudocode

```
STATE   sort(a); res = []
LOOP    for i in 0..n-3
CHECK     if i > 0 and a[i] == a[i-1]: continue      ← dedup 1
          if a[i] > 0: break
          l = i+1; r = n-1
          while l < r:
              s = a[i] + a[l] + a[r]
              if s < 0: l++
              elif s > 0: r--
              else:
UPDATE            res.add([a[i], a[l], a[r]]); l++; r--
                  while l < r and a[l] == a[l-1]: l++   ← dedup 2
                  while l < r and a[r] == a[r+1]: r--   ← dedup 3
RETURN  res
```

## Reference Java

```java
class Solution {
    public List<List<Integer>> threeSum(int[] a) {
        Arrays.sort(a);
        int n = a.length;
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i + 2 < n; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            if (a[i] > 0) break;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    res.add(Arrays.asList(a[i], a[l], a[r]));
                    l++; r--;
                    while (l < r && a[l] == a[l - 1]) l++;
                    while (l < r && a[r] == a[r + 1]) r--;
                }
            }
        }
        return res;
    }
}
```

## Dry run

Sorted: [−4, −1, −1, 0, 1, 2]
| i | a[i] | l, r | sum | action |
|---|---|---|---|---|
| 0 | −4 | 1,5 | −3 | l++ … all sums < 0 → none |
| 1 | −1 | 2,5 | 0 | record [−1,−1,2]; l=3, r=4 |
| 1 | −1 | 3,4 | 0 | record [−1,0,1]; l=4, r=3 → stop |
| 2 | −1 | | | equals a[1] → skip |
| 3 | 0 | 4,5 | 3 | r-- → l == r stop |

## Edge cases and complexity

✍️ O(n²) time, O(1) extra (besides output and the sort).
✍️ Skipping on `a[i] == a[i+1]` (instead of `a[i−1]`) would skip the **first** −1 and lose [−1, −1, 2].
- [0, 0, 0, 0]: i = 0 finds [0, 0, 0]; the inner skips and i = 1.. are duplicates.

## Carry forward

✍️ k-sum → sort + fix k−2 elements + two pointers → O(n^(k−1)).
✍️ "Unique combinations of values" → sort, then skip equal neighbours instead of using a set.
✍️ Fixing one element turns an unfamiliar problem into a familiar one — a general strategy.

## Interview follow-ups

- *3Sum Closest* — same scan, track the best |sum − target|.
- *4Sum* — two outer loops + two pointers, `long` sums.
- *Count triplets with sum < target* — when the sum is small enough, add r − l at once.
- *Can it be done in better than O(n²)?* Not in general (3SUM is believed to need ~n²); say so.

## Siblings

- [3Sum Closest](siblings/3sum-closest/) (must)
- [4Sum](siblings/4sum/) (optional)
- [Valid Triangle Number](siblings/valid-triangle-number/) (optional)
