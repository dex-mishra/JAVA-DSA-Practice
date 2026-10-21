# Skipping duplicates in sorted scans

> The three dedup idioms — compare with the previous element at a loop start, skip runs after a hit, and the i > start rule in backtracking.

## Why sorting makes dedup easy

✍️ After sorting, equal values sit next to each other. "Have I used this value in this role already?" becomes "is it equal to the element just before it?" — an O(1) check, no set needed.

## The idioms

✍️ **Outer loop:** `if (i > 0 && a[i] == a[i-1]) continue;` — process only the first occurrence of each value in this role.
✍️ **After a two-pointer hit:** `l++; r--; while (l < r && a[l] == a[l-1]) l++; while (l < r && a[r] == a[r+1]) r--;`
✍️ **Backtracking level:** `if (j > start && a[j] == a[j-1]) continue;` — at one recursion level, try each distinct value once ([[bt-dedup-sorted-skip]]).

## Pitfalls

✍️ The guard `i > 0` / `j > start` is what allows the **first** occurrence through. Without it you either index −1 or skip valid choices.
- Dedup on the *answer* with `Set<List<Integer>>` works but costs O(log) per insert and hides logic errors; interviewers prefer the in-scan skip.
