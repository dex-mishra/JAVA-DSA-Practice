# K Radius Subarray Averages

**LeetCode:** [2090. K Radius Subarray Averages](https://leetcode.com/problems/k-radius-subarray-averages/) (Medium)  
**Tier:** optional  
**How it maps from Maximum Average Subarray I:** Window of size 2k+1 centred at i; the answer is written at the centre, not the right end.

## Analyse

✍️ avg[i] = integer average of a[i−k..i+k], or −1 if that range leaves the array.

## Brainstorm

✍️ Fixed window of size w = 2k+1 with a long sum; when the window [i−w+1, i] is full, write sum / w at position i−k.

## Algorithm in words

✍️ Initialise all answers to −1; slide; assign at the centre.

## Pseudocode

```
w = 2k+1; sum = 0; out = [-1]*n
for i: sum += a[i]; if i >= w: sum -= a[i-w]; if i >= w-1: out[i-k] = sum / w
```

## Reference Java

```java
class Solution {
    public int[] getAverages(int[] a, int k) {
        int n = a.length;
        int w = 2 * k + 1;
        long sum = 0;
        int[] out = new int[n];
        Arrays.fill(out, -1);
        for (int i = 0; i < n; i++) {
            sum += a[i];
            if (i >= w) sum -= a[i - w];
            if (i >= w - 1) out[i - k] = (int)(sum / w);
        }
        return out;
    }
}
```

## Quick theory

✍️ Sums of 10⁵ values up to 10⁵ reach 10¹⁰ → long ([[cpp-integer-overflow#where]]).
