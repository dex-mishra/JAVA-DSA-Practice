# Get Equal Substrings Within Budget

**LeetCode:** [1208. Get Equal Substrings Within Budget](https://leetcode.com/problems/get-equal-substrings-within-budget/) (Medium)  
**Tier:** optional  
**How it maps from Longest Repeating Character Replacement:** Cost per position = |s[i] − t[i]|; longest window whose total cost ≤ maxCost.

## Analyse

✍️ Changing s[i] to t[i] costs |s[i] − t[i]|. Longest substring you can make equal within the budget.

## Brainstorm

✍️ Costs are non-negative → window sums are monotone → longest window with sum ≤ maxCost. O(n).

## Algorithm in words

✍️ Expand adding the cost; shrink while the total exceeds the budget; record.

## Pseudocode

```
for r: cost += |s[r]-t[r]|; while cost > maxCost: cost -= |s[l]-t[l]|; l++
    best = max(best, r-l+1)
```

## Reference Java

```java
class Solution {
    public int equalSubstring(String s, String t, int maxCost) {
        int l = 0, cost = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            cost += Math.abs(s.charAt(r) - t.charAt(r));
            while (cost > maxCost) { cost -= Math.abs(s.charAt(l) - t.charAt(l)); l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Quick theory

✍️ Convert the input into a per-position cost array, then it is a plain "sum ≤ budget" window.
