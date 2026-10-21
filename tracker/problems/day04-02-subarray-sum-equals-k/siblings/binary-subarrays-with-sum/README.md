# Binary Subarrays With Sum

**LeetCode:** [930. Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/) (Medium)  
**Tier:** optional  
**How it maps from Subarray Sum Equals K:** Exactly Subarray Sum Equals K on a 0/1 array (the window alternative is atMost(goal) − atMost(goal−1)).

## Analyse

✍️ Count subarrays of a binary array with sum equal to goal.

## Brainstorm

✍️ Prefix + count map, identical template. Alternative: because values are ≥ 0, sliding windows work with the at-most trick ([[sw-at-most-k-trick#idea]]).

## Algorithm in words

✍️ Running sum; add cnt[run − goal]; record run.

## Pseudocode

```
cnt = {0:1}; run = 0; ans = 0
for x in a: run += x; ans += cnt[run-goal]; cnt[run]++
```

## Reference Java

```java
class Solution {
    public int numSubarraysWithSum(int[] a, int goal) {
        int[] cnt = new int[a.length + 1];       // prefix sums of a 0/1 array are in [0, n]
        cnt[0] = 1;
        int run = 0, ans = 0;
        for (int x : a) {
            run += x;
            if (run - goal >= 0) ans += cnt[run - goal];
            cnt[run]++;
        }
        return ans;
    }
}
```

## Quick theory

✍️ When prefix values are small and non-negative, an array replaces the hash map ([[cpp-container-choice#rule]]).
