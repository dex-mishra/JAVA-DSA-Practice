# Valid Triangle Number

**LeetCode:** [611. Valid Triangle Number](https://leetcode.com/problems/valid-triangle-number/) (Medium)  
**Tier:** optional  
**How it maps from 3Sum:** Fix the largest side; on the rest, two pointers count a block of valid pairs at once.

## Analyse

✍️ Count triples that can form a triangle: for sorted a ≤ b ≤ c, need a + b > c.

## Brainstorm

✍️ Sort. For each c = a[k] (from the right), l = 0, r = k−1: if a[l] + a[r] > a[k], every l' in [l, r−1] also works with r → add r − l, r−−; else l++. O(n²).

## Algorithm in words

✍️ Fix the largest side, count pairs on its left with the block trick.

## Pseudocode

```
sort a; cnt = 0
for k from n-1 down to 2:
    l = 0; r = k-1
    while l < r:
        if a[l] + a[r] > a[k]: cnt += r - l; r--
        else: l++
```

## Reference Java

```java
class Solution {
    public int triangleNumber(int[] a) {
        Arrays.sort(a);
        int cnt = 0;
        for (int k = a.length - 1; k >= 2; k--) {
            int l = 0, r = k - 1;
            while (l < r) {
                if (a[l] + a[r] > a[k]) { cnt += r - l; r--; }
                else l++;
            }
        }
        return cnt;
    }
}
```

## Quick theory

✍️ Fixing the **largest** element makes the condition a single inequality — choose what to fix so the rest is a known 2-pointer problem.
