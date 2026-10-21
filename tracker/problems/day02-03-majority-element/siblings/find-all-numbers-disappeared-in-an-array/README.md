# Find All Numbers Disappeared in an Array

**LeetCode:** [448. Find All Numbers Disappeared in an Array](https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/) (Easy)  
**Tier:** optional  
**How it maps from Majority Element:** Values are 1..n, so the array itself can be the "seen" table — mark index v−1 negative.

## Analyse

✍️ Array of n values in [1, n]; return the values in [1, n] that never appear. Follow-up: no extra space.

## Brainstorm

✍️ Set of seen values → O(n) space. In place: for each value v, make a[|v|−1] negative. Indices still positive at the end were never marked.

## Algorithm in words

✍️ Mark; then collect i+1 for every positive a[i].

## Pseudocode

```
for x in a: i = |x| - 1; a[i] = -|a[i]|
for i in 0..n-1: if a[i] > 0: output i+1
```

## Reference Java

```java
class Solution {
    public List<Integer> findDisappearedNumbers(int[] a) {
        for (int x : a) { int i = Math.abs(x) - 1; a[i] = -Math.abs(a[i]); }
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < a.length; i++) if (a[i] > 0) out.add(i + 1);
        return out;
    }
}
```

## Quick theory

✍️ Values in 1..n → index-as-key marking ([[arr-in-place-tricks#index-as-key]]). Use `abs` because earlier marks made some values negative.
