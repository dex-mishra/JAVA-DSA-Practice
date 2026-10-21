# Other in-place array tricks

> Reversal for rotations, using indices as hash keys, and sign marking — the O(1)-space tricks interviewers ask for as follow-ups.

## Rotation by triple reversal

✍️ Rotate right by k: reverse the whole array, reverse the first k, reverse the rest. O(n) time, O(1) space. (Take k %= n first.)
```
[1,2,3,4,5], k=2 → reverse all [5,4,3,2,1] → reverse first 2 [4,5,3,2,1] → reverse rest [4,5,1,2,3]
```

## Index as a hash key

✍️ When values are in the range 1..n, the array itself can act as a "seen" set: for value v, mark position v−1.
✍️ Marking without losing information: make `a[v-1]` negative (the absolute value still holds the original number).
Used in: find all numbers disappeared (LeetCode 448), find duplicate, first missing positive (LeetCode 41, with cyclic placement).

## Cyclic placement

For values 1..n: repeatedly swap `a[i]` into position `a[i]-1` until the right value sits at i or the target already holds it. Each swap places one value permanently → O(n) total. After that, the first index i with `a[i] != i+1` gives the missing number.
