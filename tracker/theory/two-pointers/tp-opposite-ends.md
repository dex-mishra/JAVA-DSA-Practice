# Two pointers from opposite ends

> Put one pointer at each end of a sorted array (or a string), and move whichever pointer the comparison tells you to. Each step discards one candidate forever, so the scan is O(n).

## Idea

✍️ Start `l = 0`, `r = n − 1`. Look at the pair `(a[l], a[r])`. Based on a comparison, move `l` right or `r` left — never both blindly.
✍️ Each move rules out every pair that involves the pointer you moved past. Since the pointers move towards each other and meet after at most n steps, the whole search is O(n).
✍️ The pattern works when the input has an **order** that tells you which direction improves the answer — sorted arrays, or symmetric structures like palindromes.

## Recognise it

✍️ Input is **sorted** (or you are allowed to sort it) and you look for a pair with a target sum / difference / closest sum.
✍️ Symmetry: palindrome checks, reversing in place, comparing the string with its mirror.
✍️ "O(1) extra space" on a sorted pair problem (where a hash map would otherwise work).

## Brute force → two pointers

Brute force on sorted input: all pairs, O(n²) — ignores sortedness.
Better: for each i, binary search for `target − a[i]`. O(n log n). Uses sortedness once per element.
✍️ Bottleneck: each binary search starts from scratch, although the partner of a larger `a[i]` must be **smaller** than the partner of a smaller `a[i]`.
✍️ Fix: as `l` moves right, the matching partner moves left — so `r` only ever moves left. One combined walk, O(n).

## Template: pair sum on sorted array

```java
int l = 0, r = n - 1;
while (l < r) {
    long s = (long) a[l] + a[r];
    if (s == target) return new int[]{l, r};
    if (s < target) l++;       // need a bigger sum: only moving l right can increase it
    else r--;                  // need a smaller sum: only moving r left can decrease it
}
return new int[]{-1, -1};
```

## Template: symmetric check

```java
int l = 0, r = s.length() - 1;
while (l < r) {
    if (s.charAt(l) != s.charAt(r)) return false;
    l++; r--;
}
return true;
```
✍️ Skipping characters (non-alphanumeric) uses inner `while` loops that **also** check `l < r`, so they cannot run past each other ([[str-palindrome-checks]]).

## Variations

- Squares of a sorted array (LeetCode 977): the largest square is at one of the two ends → fill the output from the back.
- Count pairs with sum < target (LeetCode 2824): when `a[l] + a[r] < target`, **all** pairs (l, l+1..r) qualify → add `r − l`, then l++.
- Boats to save people (LeetCode 881): pair the heaviest with the lightest if they fit.
- Container with most water: the comparison is on heights, and the "why it is safe" argument is the exchange argument in [[tp-why-discarding-is-safe]].
- Three or four numbers: fix one, two-pointer the rest ([[tp-fix-one-k-sum]]).

## Pitfalls

✍️ Loop condition `l < r` (not `≤`) when a pair needs two distinct indices.
✍️ Two pointers on **unsorted** data is wrong: the move rule depends on sortedness. Either sort (if indices do not matter) or use a hash map.
✍️ If you sort, original indices are lost. Two Sum (unsorted, return indices) is a hash map problem; Two Sum II (sorted) is a two-pointer problem.

## Complexity

O(n) time (each step moves one pointer, at most n steps). O(1) extra space. Add O(n log n) if you sort first.

## Interview follow-ups

- "Why can you discard that pair?" — be ready with the one-line argument from [[tp-why-discarding-is-safe#argument]].
- "What if there are many valid pairs and you need all of them?" — on a hit, move both pointers and skip duplicates.
