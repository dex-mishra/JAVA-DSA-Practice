# Longest Repeating Character Replacement

**LeetCode:** [424. Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) (Medium)  
**Day:** 5  
**Pattern:** variable-window-budget  
**Role:** TWIST

## Understand

✍️ f(uppercase string s, k) → length of the longest substring that can be made all one letter by changing at most k characters.
- n ≤ 10⁵.
- "ABAB", k = 2 → 4. "AABABBA", k = 1 → 4 ("AABA" → "AAAA").

## Analyse

✍️ For a fixed window, the cheapest way to make it uniform is to keep its most frequent letter and change the rest. Changes needed = length − maxCount.
✍️ So a window is valid ⇔ len − maxCount ≤ k. That is a budget rule → variable window.
✍️ Hard part: maintaining maxCount as the window shrinks.
✍️ Edges: k = 0 (longest run of equal letters); k ≥ n (whole string).

## Brainstorm: brute → optimal

✍️ **1. Brute.** Every substring, compute counts, check len − max ≤ k. O(n²·26).
✍️ ↳ Bottleneck: retrying every start for each end.
✍️ ↳ The rule is monotone (a valid window's sub-windows are valid) → variable window.
✍️ **2. Window, recompute max.** Expand r; while len − max(cnt) > k, shrink. O(26n). Already fine.
✍️ **3. Optimal trick.** Keep maxCount as the highest count ever seen and do not decrease it on shrink. The answer only improves when maxCount increases, so a stale value never produces a wrong answer. O(n).

## Algorithm in words

✍️ 1. Count letters in the window [l, r]; maxCount = the largest count seen.
✍️ 2. For each r: add s[r], update maxCount.
✍️ 3. If the window needs more than k changes (len − maxCount > k), remove s[l] and move l right once.
✍️ 4. Record the window length.

## Pseudocode

```
STATE   cnt[26] = 0; l = 0; maxCount = 0; best = 0
LOOP    for r in 0..n-1
UPDATE    cnt[s[r]]++; maxCount = max(maxCount, cnt[s[r]])
CHECK     if (r - l + 1) - maxCount > k:
              cnt[s[l]]--; l++                    (one step is enough here)
UPDATE    best = max(best, r - l + 1)
RETURN  best
```

## Reference Java

```java
class Solution {
    public int characterReplacement(String s, int k) {
        int[] cnt = new int[26];
        int l = 0, maxCount = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            maxCount = Math.max(maxCount, ++cnt[s.charAt(r) - 'A']);
            if (r - l + 1 - maxCount > k) {
                cnt[s.charAt(l) - 'A']--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
```

## Dry run

"AABABBA", k = 1:
| r | ch | maxCount | len before | shrink? | len | best |
|---|---|---|---|---|---|---|
| 0 | A | 1 | 1 | no | 1 | 1 |
| 1 | A | 2 | 2 | no | 2 | 2 |
| 2 | B | 2 | 3 | no (3−2=1) | 3 | 3 |
| 3 | A | 3 | 4 | no | 4 | 4 |
| 4 | B | 3 | 5 | yes (5−3=2) | 4 | 4 |
| 5 | B | 3 | 5 | yes | 4 | 4 |
| 6 | A | 3 | 5 | yes | 4 | 4 |

## Edge cases and complexity

✍️ O(n) time, O(1) space.
✍️ With the `if` version the window never shrinks below the best length found; it slides. That is why `if` suffices here — in general use `while`.
- If the trick feels risky in an interview, use `while` with max over 26 counts: O(26n), clearly correct.

## Carry forward

✍️ "Change at most k things to make it uniform" → cost(window) = len − maxCount ≤ k.
✍️ Turn every "at most k operations" rule into a count you can maintain as the window moves.

## Interview follow-ups

- *Binary string, flip at most k to get all 1s* → Max Consecutive Ones III (next problem).
- *Two letters (T/F) and either can be the target* (LeetCode 2024): run the window for each target letter.
- *Why is the stale maxCount safe?* The recorded best only grows when maxCount grows, and maxCount is a true count at the moment it grew.

## Siblings

- [Maximize the Confusion of an Exam](siblings/maximize-the-confusion-of-an-exam/) (must)
- [Frequency of the Most Frequent Element](siblings/frequency-of-the-most-frequent-element/) (optional)
- [Get Equal Substrings Within Budget](siblings/get-equal-substrings-within-budget/) (optional)
