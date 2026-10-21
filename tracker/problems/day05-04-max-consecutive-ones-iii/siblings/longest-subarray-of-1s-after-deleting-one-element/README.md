# Longest Subarray of 1's After Deleting One Element

**LeetCode:** [1493. Longest Subarray of 1's After Deleting One Element](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/) (Medium)  
**Tier:** must  
**How it maps from Max Consecutive Ones III:** Window with at most one zero; the answer is window length − 1 because one element must be deleted.

## Analyse

✍️ Delete exactly one element; longest run of 1s afterwards. All ones → n − 1.

## Brainstorm

✍️ Same as Max Consecutive Ones III with k = 1, but the deleted element is not counted → record r − l (not r − l + 1).

## Algorithm in words

✍️ Budget window with ≤ 1 zero; best = max(best, r − l).

## Pseudocode

```
for r: zeros += (a[r]==0); while zeros > 1: zeros -= (a[l++]==0)
    best = max(best, r - l)
```

## Reference Java

```java
class Solution {
    public int longestSubarray(int[] a) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            if (a[r] == 0) zeros++;
            while (zeros > 1) { if (a[l++] == 0) zeros--; }
            best = Math.max(best, r - l);
        }
        return best;
    }
}
```

## Quick theory

✍️ Read what is counted in the answer — here the deleted element is excluded ([[sw-variable-window#budget]]).
