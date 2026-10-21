# Best Sightseeing Pair

**LeetCode:** [1014. Best Sightseeing Pair](https://leetcode.com/problems/best-sightseeing-pair/) (Medium)  
**Tier:** optional  
**How it maps from Best Time to Buy and Sell Stock:** Score a[i] + i + a[j] − j splits into (a[i] + i) + (a[j] − j) → keep the best (a[i] + i) so far.

## Analyse

✍️ Maximise a[i] + a[j] + i − j over i < j.

## Brainstorm

✍️ Brute O(n²). Split the score into a part depending only on i and a part only on j; for each j the best i is the max of (a[i] + i) so far.

## Algorithm in words

✍️ Keep bestLeft = max(a[i] + i); at each j, candidate = bestLeft + a[j] − j; then update bestLeft with a[j] + j.

## Pseudocode

```
bestLeft = a[0] + 0; ans = 0
for j in 1..n-1: ans = max(ans, bestLeft + a[j] - j); bestLeft = max(bestLeft, a[j] + j)
```

## Reference Java

```java
class Solution {
    public int maxScoreSightseeingPair(int[] a) {
        int bestLeft = a[0], ans = 0;
        for (int j = 1; j < a.length; j++) {
            ans = Math.max(ans, bestLeft + a[j] - j);
            bestLeft = Math.max(bestLeft, a[j] + j);
        }
        return ans;
    }
}
```

## Quick theory

✍️ If a pair score separates into f(i) + g(j), keep the best f(i) so far ([[kad-min-so-far#variations]]).
