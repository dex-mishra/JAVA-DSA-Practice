# 3Sum Closest

**LeetCode:** [16. 3Sum Closest](https://leetcode.com/problems/3sum-closest/) (Medium)  
**Tier:** must  
**How it maps from 3Sum:** Same sorted scan, but instead of an exact hit you track the sum nearest the target.

## Analyse

✍️ Return the sum of three numbers closest to target (one answer).

## Brainstorm

✍️ Brute O(n³). Sort + fix i + two pointers: the pointer moves are the same (too small → l++, too big → r−−); record whichever sum has the smallest |s − target|. No dedup needed.

## Algorithm in words

✍️ Sort; for each i, scan with l and r, updating the best sum; return early on an exact match.

## Pseudocode

```
sort a; best = a[0]+a[1]+a[2]
for i: l = i+1; r = n-1
    while l < r:
        s = a[i]+a[l]+a[r]
        if |s-t| < |best-t|: best = s
        if s < t: l++ elif s > t: r-- else: return s
return best
```

## Reference Java

```java
class Solution {
    public int threeSumClosest(int[] a, int t) {
        Arrays.sort(a);
        int n = a.length, best = a[0] + a[1] + a[2];
        for (int i = 0; i + 2 < n; i++) {
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (Math.abs(s - t) < Math.abs(best - t)) best = s;
                if (s < t) l++;
                else if (s > t) r--;
                else return s;
            }
        }
        return best;
    }
}
```

## Quick theory

✍️ "Closest" versions keep the pointer logic and add a running best ([[tp-fix-one-k-sum#variations]]).
