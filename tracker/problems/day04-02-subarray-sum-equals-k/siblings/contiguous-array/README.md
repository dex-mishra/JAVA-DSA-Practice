# Contiguous Array

**LeetCode:** [525. Contiguous Array](https://leetcode.com/problems/contiguous-array/) (Medium)  
**Tier:** optional  
**How it maps from Subarray Sum Equals K:** Turn 0 into −1; equal 0s and 1s means sum 0; find the longest such subarray with a first-index map.

## Analyse

✍️ Longest subarray of a binary array with equally many 0s and 1s.

## Brainstorm

✍️ Map 0 → −1. Then "equal counts" = "sum 0". Longest subarray with sum 0: two equal prefix sums; store the **first** index of each prefix value, seed {0: −1}.

## Algorithm in words

✍️ Running sum with ±1; if this sum was seen, length = i − first[sum]; otherwise record first[sum] = i.

## Pseudocode

```
first = {0: -1}; run = 0; best = 0
for i: run += (a[i] ? 1 : -1)
    if run in first: best = max(best, i - first[run])
    else: first[run] = i
```

## Reference Java

```java
class Solution {
    public int findMaxLength(int[] a) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);
        int run = 0, best = 0;
        for (int i = 0; i < a.length; i++) {
            run += a[i] != 0 ? 1 : -1;
            if (first.containsKey(run)) best = Math.max(best, i - first.get(run));
            else first.put(run, i);
        }
        return best;
    }
}
```

## Quick theory

✍️ "Longest" → store the **first** occurrence (never overwrite); "count" → store counts ([[ps-prefix-sum-hashmap#variations]]).
