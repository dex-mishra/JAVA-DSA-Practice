# Subarray Sums Divisible by K

**LeetCode:** [974. Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) (Medium)  
**Tier:** must  
**How it maps from Subarray Sum Equals K:** Same counting map, but keyed by the prefix sum's remainder mod k.

## Analyse

✍️ Count subarrays whose sum is divisible by k. Values can be negative.

## Brainstorm

✍️ sum(i..j) divisible ⇔ pre[j+1] ≡ pre[i] (mod k). Count equal remainders with an array of size k seeded with count[0] = 1. Normalise negative remainders.

## Algorithm in words

✍️ For each element: update the running remainder; add how many earlier prefixes had the same remainder; record it.

## Pseudocode

```
cnt[k] = 0; cnt[0] = 1; run = 0; ans = 0
for x in a:
    run = ((run + x) % k + k) % k
    ans += cnt[run]; cnt[run]++
```

## Reference Java

```java
class Solution {
    public int subarraysDivByK(int[] a, int k) {
        int[] cnt = new int[k];
        cnt[0] = 1;
        int run = 0, ans = 0;
        for (int x : a) {
            run = ((run + x) % k + k) % k;
            ans += cnt[run]++;
        }
        return ans;
    }
}
```

## Quick theory

✍️ Equal remainders bound a divisible subarray ([[ps-modular-prefix#idea]]); C++ `%` can be negative ([[ps-modular-prefix#negative-mod]]).
