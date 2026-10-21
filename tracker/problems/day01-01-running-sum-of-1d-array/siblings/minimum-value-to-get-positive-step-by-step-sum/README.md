# Minimum Value to Get Positive Step by Step Sum

**LeetCode:** [1413. Minimum Value to Get Positive Step by Step Sum](https://leetcode.com/problems/minimum-value-to-get-positive-step-by-step-sum/) (Easy)  
**Tier:** optional  
**How it maps from Running Sum of 1d Array:** Running sum again; the answer depends on the lowest point the running sum ever reaches.

## Analyse

✍️ Choose the smallest positive start value so that start + running sum is ≥ 1 at every step.

## Brainstorm

✍️ Brute: try start = 1, 2, 3, … and simulate → O(n · answer).
✍️ Observation: only the **minimum** prefix sum matters. Need start + minPrefix ≥ 1 → start = max(1, 1 − minPrefix). O(n).

## Algorithm in words

✍️ Track the running sum and its minimum; answer = max(1, 1 − minimum).

## Pseudocode

```
run = 0; low = 0
for x in a: run += x; low = min(low, run)
return 1 - low          (low ≤ 0, so this is ≥ 1)
```

## Reference Java

```java
class Solution {
    public int minStartValue(int[] a) {
        int run = 0, low = 0;
        for (int x : a) { run += x; low = Math.min(low, run); }
        return 1 - low;
    }
}
```

## Quick theory

✍️ "Must stay positive / never drop below" → track the minimum of the running sum, not every step.
