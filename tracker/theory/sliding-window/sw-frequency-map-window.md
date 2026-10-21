# Windows with a frequency map

> Keep the counts of everything inside the window; update one count on each add and remove; validity is a question about those counts.

## Idea

✍️ The window's state is a count table: `cnt[c]` = occurrences of c inside `[l, r]`.
✍️ Add: `cnt[a[r]]++`. Remove: `cnt[a[l]]--` (and if you track distinct values, erase the key when it reaches 0).
✍️ Track an extra number alongside the table so validity is O(1): number of distinct keys, number of characters with count > 1, max count, or how many required characters are satisfied.

## Tracking distinct count correctly

```java
Map<Integer,Integer> cnt = new HashMap<>();
// add x
int cx = cnt.getOrDefault(x, 0); if (cx == 0) distinct++; cnt.put(x, cx + 1);
// remove y
int cy = cnt.get(y) - 1; cnt.put(y, cy); if (cy == 0) distinct--;   // or cnt.remove(y) and use cnt.size()
```
✍️ Never use `cnt.size()` as "distinct" unless you erase zero-count keys — and never read `cnt[x]` to check without meaning to insert ([[cpp-unordered-map-set#bracket-trap]]).

## The maxCount trick (character replacement)

✍️ For "replace at most k characters to make the window uniform", the window is valid when `len − maxCount ≤ k`, where maxCount is the highest count of any single character in the window.
✍️ Trick: maxCount never needs to **decrease**. The answer only improves when a new, higher maxCount appears, so a stale (too high) maxCount only keeps the window from shrinking — it never produces a wrong longer answer. This lets you use `if` instead of `while` and skip recomputing the max.
- If that feels too clever in an interview, recompute the max over 26 counts each step: O(26n), still fine.

## Complexity

O(n) window moves; each update O(1) with an array, O(1) average with a hash map.
