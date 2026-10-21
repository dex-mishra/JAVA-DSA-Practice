# Longest Substring Without Repeating Characters

**LeetCode:** [3. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) (Medium)  
**Day:** 5  
**Pattern:** variable-window  
**Role:** APPLY

## Understand

✍️ f(string) → length of the longest substring (contiguous) with all characters distinct.
- Length ≤ 5·10⁴; letters, digits, symbols, spaces.
- "abcabcbb" → 3 ("abc"). "bbbbb" → 1. "pwwkew" → 3 ("wke").

## Analyse

✍️ By hand on "pwwkew": I grow "pw"; the next 'w' repeats, so I drop characters from the left until the old 'w' is gone → "w"; grow "wke"; next 'w' repeats → drop "wk" … → "ew".
✍️ Hard part: knowing how far to drop from the left.
✍️ Edges: empty string → 0; all identical; spaces count as characters.

## Brainstorm: brute → optimal

✍️ **1. Brute.** Every substring, check distinctness with a set. O(n³) or O(n²).
✍️ ↳ Bottleneck: for each end r, retrying every start from scratch.
✍️ ↳ Observation: if [l, r] has a repeat, every longer window [l, r+1] does too. So once a start is invalid for r, it stays invalid → the best start only moves right.
✍️ **2. Optimal (window + counts).** Expand r; while the new character's count > 1, remove s[l] and l++. Record r − l + 1. O(n).
✍️ **3. Variant.** Store each character's last index and jump l to max(l, last[c] + 1) — no inner loop.

## Algorithm in words

✍️ 1. Keep a count of characters in the window [l, r]; l starts at 0.
✍️ 2. For each r, add s[r] to the counts.
✍️ 3. While s[r] appears more than once, remove s[l] from the counts and move l right.
✍️ 4. The window is now valid; update the best length.

## Pseudocode

```
STATE   cnt[256] = 0; l = 0; best = 0
LOOP    for r in 0..n-1
UPDATE    cnt[s[r]]++
          while cnt[s[r]] > 1:          (only s[r] can be duplicated)
              cnt[s[l]]--; l++
CHECK     best = max(best, r - l + 1)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] cnt = new int[256];
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            cnt[s.charAt(r)]++;
            while (cnt[s.charAt(r)] > 1) {
                cnt[s.charAt(l)]--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Dry run

"pwwkew":
| r | s[r] | shrink? | window | best |
|---|---|---|---|---|
| 0 | p | no | p | 1 |
| 1 | w | no | pw | 2 |
| 2 | w | drop p, drop w | w | 2 |
| 3 | k | no | wk | 2 |
| 4 | e | no | wke | 3 |
| 5 | w | drop w | kew | 3 |

## Edge cases and complexity

✍️ O(n) time: r moves n times, l at most n times in total. O(1) space (256 counters).
✍️ Only the newly added character can create a duplicate, so the while condition checks `cnt[s[r]]`.
- Casting to `unsigned char` keeps the index non-negative for any byte.

## Carry forward

✍️ "Longest substring with a property that breaks by adding and heals by removing" → variable window.
✍️ Expand always; shrink while invalid; record after the shrink.
✍️ The window's state is a count table; validity is a question about it.

## Interview follow-ups

- *Avoid the inner loop.* last[c] = last index; l = max(l, last[c] + 1). Still O(n).
- *At most k distinct characters.* Track distinct count; shrink while distinct > k ([[sw-frequency-map-window#distinct]]).
- *Return the substring.* Remember l when best improves.

## Siblings

- [Fruit Into Baskets](siblings/fruit-into-baskets/) (must)
- [Minimum Window Substring](siblings/minimum-window-substring/) (optional)
- [Minimum Size Subarray Sum](siblings/minimum-size-subarray-sum/) (optional)
