# Subarray Sum Equals K

**LeetCode:** [560. Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (Medium)  
**Day:** 4  
**Pattern:** prefix-sum-hashmap  
**Role:** TWIST

## Understand

✍️ f(array of ints, possibly negative; k) → number of contiguous subarrays whose sum is exactly k.
- n ≤ 2·10⁴, values in [−1000, 1000], k in [−10⁷, 10⁷].
- [1, 1, 1], k = 2 → 2. [1, 2, 3], k = 3 → 2 ([1,2] and [3]).

## Analyse

✍️ "Subarray sum" + negatives → not a window. "Count" + "exactly k" → think prefix sums.
✍️ By hand: sum(i..j) = pre[j+1] − pre[i]. For a fixed end, I want starts whose prefix equals (current prefix − k).
✍️ Hard part: counting **all** such starts quickly, and not missing subarrays that start at 0.
✍️ Edges: k = 0; negative values; a single element equal to k.

## Brainstorm: brute → optimal

✍️ **1. Brute.** All (i, j) with an inner sum loop. O(n³).
✍️ **2. Better.** Fix i, extend j with a running sum. O(n²) — 4·10⁸, too slow in practice.
✍️ ↳ Bottleneck: for each end, trying every start.
✍️ ↳ Job description: "count earlier prefix sums equal to run − k". Unlock: searching for a known value → store prefix sums in a map with their counts.
✍️ **3. Optimal.** One pass; `cnt[prefix] = how many times seen`; add cnt[run − k] at each step. O(n) time, O(n) space.

## Algorithm in words

✍️ 1. Keep a running prefix sum, starting at 0, and a map of prefix counts containing {0: 1}.
✍️ 2. For each element, add it to the running sum.
✍️ 3. Add the number of earlier prefixes equal to (running − k) to the answer.
✍️ 4. Record the current running sum in the map.

## Pseudocode

```
STATE   cnt = map {0: 1}; run = 0; ans = 0
LOOP    for x in a
UPDATE    run += x
CHECK     ans += cnt[run - k]        (query first, using find)
UPDATE    cnt[run] += 1              (record after)
RETURN  ans
```

## Reference Java

```java
class Solution {
    public int subarraySum(int[] a, int k) {
        Map<Long, Integer> cnt = new HashMap<>();
        cnt.put(0L, 1);
        long run = 0;
        int ans = 0;
        for (int x : a) {
            run += x;
            ans += cnt.getOrDefault(run - k, 0);
            cnt.put(run, cnt.getOrDefault(run, 0) + 1);
        }
        return ans;
    }
}
```

## Dry run

a = [1, 2, 3], k = 3:
| x | run | need = run−k | cnt[need] | ans | cnt after |
|---|---|---|---|---|---|
| start | 0 | | | 0 | {0:1} |
| 1 | 1 | −2 | 0 | 0 | {0:1, 1:1} |
| 2 | 3 | 0 | 1 | 1 | {0:1, 1:1, 3:1} |
| 3 | 6 | 3 | 1 | 2 | {…, 6:1} |

## Edge cases and complexity

✍️ O(n) average time, O(n) space.
✍️ Without the {0: 1} seed, [3] with k = 3 returns 0.
✍️ Recording before querying with k = 0 counts each position as a zero-length subarray.

## Carry forward

✍️ Subarray sum = k (or divisible by k, or balanced counts) → prefix sum + hash map.
✍️ It is Two Sum where the "values" are prefix sums: store what you have seen, look up run − k.
✍️ Negatives allowed → do not use a sliding window.

## Interview follow-ups

- *Longest subarray with sum k.* Map prefix → first index, seed {0: −1} ([[ps-prefix-sum-hashmap#variations]]).
- *Sum divisible by k.* Key by `run mod k`, normalised ([[ps-modular-prefix]]).
- *All values positive?* Then a sliding window also works in O(1) space.

## Siblings

- [Subarray Sums Divisible by K](siblings/subarray-sums-divisible-by-k/) (must)
- [Contiguous Array](siblings/contiguous-array/) (optional)
- [Binary Subarrays With Sum](siblings/binary-subarrays-with-sum/) (optional)
