# Find the Highest Altitude

**LeetCode:** [1732. Find the Highest Altitude](https://leetcode.com/problems/find-the-highest-altitude/) (Easy)  
**Tier:** optional  
**How it maps from Range Sum Query - Immutable:** The answer is just the maximum prefix sum (including the starting 0).

## Analyse

✍️ Start at altitude 0; gain[i] is the change; return the highest altitude reached.

## Brainstorm

✍️ Running sum + running max, starting the max at 0.

## Algorithm in words

✍️ Add each gain to the altitude; track the maximum.

## Pseudocode

```
alt = 0; best = 0
for g in gain: alt += g; best = max(best, alt)
```

## Reference Java

```java
class Solution {
    public int largestAltitude(int[] gain) {
        int alt = 0, best = 0;
        for (int g : gain) { alt += g; best = Math.max(best, alt); }
        return best;
    }
}
```

## Quick theory

✍️ The starting point (prefix of length 0) is a real candidate — the same reason the prefix array starts with 0.
