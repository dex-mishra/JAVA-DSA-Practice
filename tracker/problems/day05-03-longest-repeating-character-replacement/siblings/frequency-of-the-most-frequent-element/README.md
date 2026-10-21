# Frequency of the Most Frequent Element

**LeetCode:** [1838. Frequency of the Most Frequent Element](https://leetcode.com/problems/frequency-of-the-most-frequent-element/) (Medium)  
**Tier:** optional  
**How it maps from Longest Repeating Character Replacement:** Sort, then a window is valid if raising everyone to the window's max costs ≤ k.

## Analyse

✍️ You may increment elements (total at most k increments). Maximise the frequency of some value.

## Brainstorm

✍️ Sort. Making a window all equal to its largest element a[r] costs a[r]·len − sum(window). That cost only grows as the window grows → monotone → variable window with a running sum. O(n log n).

## Algorithm in words

✍️ Sort; expand r adding a[r] to sum; while a[r]·len − sum > k, remove a[l]; record len.

## Pseudocode

```
sort a; l = 0; sum = 0
for r: sum += a[r]
    while a[r]*(r-l+1) - sum > k: sum -= a[l++]
    best = max(best, r-l+1)
```

## Reference Java

```java
class Solution {
    public int maxFrequency(int[] a, int k) {
        Arrays.sort(a);
        long sum = 0;
        int l = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            sum += a[r];
            while ((long) a[r] * (r - l + 1) - sum > k) sum -= a[l++];
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Quick theory

✍️ Sorting can create the monotonicity a window needs; the budget here is "increments used".
