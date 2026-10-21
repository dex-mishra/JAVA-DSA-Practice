# Maximum Difference Between Increasing Elements

**LeetCode:** [2016. Maximum Difference Between Increasing Elements](https://leetcode.com/problems/maximum-difference-between-increasing-elements/) (Easy)  
**Tier:** optional  
**How it maps from Best Time to Buy and Sell Stock:** Exactly the stock problem, except "no profit" returns −1 and the difference must be strictly positive.

## Analyse

✍️ Max a[j] − a[i] with i < j and a[i] < a[j]; −1 if none.

## Brainstorm

✍️ Min so far; only count strictly positive differences.

## Algorithm in words

✍️ Track the minimum; when a[j] > min, update the answer; then fold a[j] into the minimum.

## Pseudocode

```
mn = a[0]; ans = -1
for j in 1..n-1: if a[j] > mn: ans = max(ans, a[j]-mn); mn = min(mn, a[j])
```

## Reference Java

```java
class Solution {
    public int maximumDifference(int[] a) {
        int mn = a[0], ans = -1;
        for (int j = 1; j < a.length; j++) {
            if (a[j] > mn) ans = Math.max(ans, a[j] - mn);
            mn = Math.min(mn, a[j]);
        }
        return ans;
    }
}
```

## Quick theory

✍️ Read the "no answer" convention carefully: 0 vs −1 changes the initialisation.
