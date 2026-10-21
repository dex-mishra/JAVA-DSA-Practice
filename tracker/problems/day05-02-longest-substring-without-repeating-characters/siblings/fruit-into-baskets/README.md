# Fruit Into Baskets

**LeetCode:** [904. Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) (Medium)  
**Tier:** must  
**How it maps from Longest Substring Without Repeating Characters:** Longest window with at most 2 distinct values — the rule changes from "no repeats" to "≤ 2 kinds".

## Analyse

✍️ Longest contiguous run containing at most two distinct fruit types.

## Brainstorm

✍️ Variable window with a count map and a distinct counter; shrink while distinct > 2. O(n).

## Algorithm in words

✍️ Add fruit[r] (if its count was 0, distinct++); while distinct > 2 remove fruit[l] (if count becomes 0, distinct−−); record.

## Pseudocode

```
for r: if cnt[f[r]]++ == 0: d++
    while d > 2: if --cnt[f[l]] == 0: d--; l++
    best = max(best, r-l+1)
```

## Reference Java

```java
class Solution {
    public int totalFruit(int[] f) {
        Map<Integer, Integer> cnt = new HashMap<>();
        int l = 0, d = 0, best = 0;
        for (int r = 0; r < f.length; r++) {
            int c = cnt.getOrDefault(f[r], 0);
            if (c == 0) d++;
            cnt.put(f[r], c + 1);
            while (d > 2) {
                int cl = cnt.get(f[l]) - 1;
                cnt.put(f[l], cl);
                if (cl == 0) d--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Quick theory

✍️ "At most k distinct" → distinct counter updated on 0↔1 transitions ([[sw-frequency-map-window#distinct]]).
