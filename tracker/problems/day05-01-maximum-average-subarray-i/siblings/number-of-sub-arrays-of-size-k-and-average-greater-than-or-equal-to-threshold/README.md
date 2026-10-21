# Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold

**LeetCode:** [1343. Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold](https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/) (Medium)  
**Tier:** optional  
**How it maps from Maximum Average Subarray I:** Count fixed windows whose sum ≥ threshold × k.

## Analyse

✍️ Count windows of size k whose average is at least the threshold.

## Brainstorm

✍️ Compare sums with threshold·k (no division). Fixed window, O(n).

## Algorithm in words

✍️ Slide the window; count each full window that meets the target sum.

## Pseudocode

```
target = threshold * k; sum = 0; cnt = 0
for i: sum += a[i]; if i >= k: sum -= a[i-k]; if i >= k-1 and sum >= target: cnt++
```

## Reference Java

```java
class Solution {
    public int numOfSubarrays(int[] a, int k, int threshold) {
        long target = 1L * threshold * k, sum = 0;
        int cnt = 0;
        for (int i = 0; i < a.length; i++) {
            sum += a[i];
            if (i >= k) sum -= a[i - k];
            if (i >= k - 1 && sum >= target) cnt++;
        }
        return cnt;
    }
}
```

## Quick theory

✍️ Turn average comparisons into sum comparisons to stay in integers.
