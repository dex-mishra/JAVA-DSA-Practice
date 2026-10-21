# Longest Square Streak in an Array

**LeetCode:** [2501. Longest Square Streak in an Array](https://leetcode.com/problems/longest-square-streak-in-an-array/) (Medium)  
**Tier:** must  
**How it maps from Longest Consecutive Sequence:** "Next element" is v² instead of v+1; same set lookups, walking from each value.

## Analyse

✍️ Longest subsequence that, after sorting, has each element equal to the square of the previous; length ≥ 2, else −1.

## Brainstorm

✍️ Put values in a set. From each v, walk v → v² → v⁴ while present. Values ≤ 10⁵ so a chain has at most ~5 steps → O(n · 5). (Start-of-run trick optional here because chains are tiny.)

## Algorithm in words

✍️ For each value, follow squares through the set counting the chain; track the max; return −1 if < 2.

## Pseudocode

```
s = set(a); best = 0
for v in s:
    len = 0; x = v
    while x in s: len++; x = x*x   (long, stop if x > 1e5)
    best = max(best, len)
return best >= 2 ? best : -1
```

## Reference Java

```java
class Solution {
    public int longestSquareStreak(int[] a) {
        Set<Long> s = new HashSet<>();
        for (int x : a) s.add((long) x);
        int best = 0;
        for (long v : s) {
            int len = 0;
            long x = v;
            while (x <= 100000 && s.contains(x)) { len++; x = x * x; }
            best = Math.max(best, len);
        }
        return best >= 2 ? best : -1;
    }
}
```

## Quick theory

✍️ The "successor" can be any function (v+1, v², 2v); set membership makes each step O(1) ([[hash-set-runs#idea]]).
✍️ Squaring overflows int fast → `long` and a bound check ([[cpp-integer-overflow#where]]).
