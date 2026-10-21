# Majority Element II

**LeetCode:** [229. Majority Element II](https://leetcode.com/problems/majority-element-ii/) (Medium)  
**Tier:** must  
**How it maps from Majority Element:** More than n/3 → at most two survivors; keep two candidates and two counters, then verify.

## Analyse

✍️ Return all values appearing more than ⌊n/3⌋ times; O(1) space follow-up.
✍️ At most two such values can exist (three would need more than n elements).

## Brainstorm

✍️ Map → O(n) space. Voting with two candidates: a value different from **both** cancels one copy of each. Survivors are only candidates → count them again to verify.

## Algorithm in words

✍️ 1. Pass 1: if x matches a candidate, increment its count; else if a count is 0, adopt x there; else decrement both. 2. Pass 2: count both candidates; keep those > n/3.

## Pseudocode

```
c1, c2 = none; n1 = n2 = 0
for x in a:
    if x == c1: n1++
    elif x == c2: n2++
    elif n1 == 0: c1 = x; n1 = 1
    elif n2 == 0: c2 = x; n2 = 1
    else: n1--; n2--
verify counts of c1, c2 > n/3
```

## Reference Java

```java
class Solution {
    public List<Integer> majorityElement(int[] a) {
        int c1 = 0, c2 = 1, n1 = 0, n2 = 0;          // different initial candidates
        for (int x : a) {
            if (x == c1) n1++;
            else if (x == c2) n2++;
            else if (n1 == 0) { c1 = x; n1 = 1; }
            else if (n2 == 0) { c2 = x; n2 = 1; }
            else { n1--; n2--; }
        }
        n1 = 0; n2 = 0;
        for (int x : a) { if (x == c1) n1++; else if (x == c2) n2++; }
        List<Integer> out = new ArrayList<>();
        int n = a.length;
        if (n1 > n / 3) out.add(c1);
        if (n2 > n / 3) out.add(c2);
        return out;
    }
}
```

## Quick theory

✍️ Check "matches a candidate" **before** "a count is 0", or the same value can occupy both slots ([[hash-boyer-moore-voting#variations]]).
