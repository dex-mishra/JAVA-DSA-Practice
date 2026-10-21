# Boyer–Moore voting — the majority element in O(1) space

> Pair off different values against each other; the value that appears more than n/2 times always survives. One pass, two variables.

## Idea

✍️ Keep a `candidate` and a `count`. For each x: if count is 0, adopt x as the candidate. If x equals the candidate, count++; otherwise count--.
✍️ Each "count--" cancels one copy of the candidate against one different value. A value occurring more than n/2 times cannot be fully cancelled, because there are fewer than n/2 other values to cancel it with.

## Recognise it

✍️ "majority element", "appears more than ⌊n/2⌋ times", **plus** "O(1) space" or "can you do it without extra memory?".
✍️ A ban on extra space is itself the hint: frequency maps are out, so a counting/cancelling argument is in.

## Brute force → voting

Brute force: for each value count its occurrences with a scan. O(n²).
Better: frequency map, return the value with count > n/2. O(n) time, O(n) space.
>> detour cx-space-and-in-place#aux | What counts as "extra space" — and why a map is O(n) | 2 min
Also valid: sort, return the middle element `a[n/2]` (the majority must cover the middle). O(n log n), O(1).
✍️ To reach O(n) time *and* O(1) space you need to avoid storing counts for every value. Observation: you only care about **one** value, the one that survives cancellation.

## Why it works (proof sketch)

✍️ Think of each count-- as removing a pair of two different elements from the array. Removing a pair of different elements never changes which element is the majority of what is left (the majority loses at most one copy per pair, and so does the rest).
✍️ At the end, what remains is all copies of one value — the candidate. If a majority exists, it must be that value.
- If a majority is **not guaranteed**, do a second pass to count the candidate and verify count > n/2.

## Template

```java
int majorityElement(int[] a) {
    int cand = 0, cnt = 0;
    for (int x : a) {
        if (cnt == 0) cand = x;     // adopt BEFORE comparing
        cnt += (x == cand) ? 1 : -1;
    }
    return cand;                    // guaranteed majority; otherwise verify with a 2nd pass
}
```

## Variations

- More than n/3 times (LeetCode 229): at most two such values exist. Keep **two** candidates and two counts; a value different from both decrements both. Always verify with a second pass.
- General: more than n/k times → at most k−1 candidates (Misra–Gries).

## Pitfalls

✍️ Order inside the loop: check `cnt == 0` and adopt the new candidate **before** the comparison, otherwise the first element of a new block is counted against the old candidate.
✍️ The final candidate is only guaranteed correct when a majority exists. Without the guarantee, verify.

## Complexity

O(n) time, O(1) space. Verification pass (if needed) is another O(n).
