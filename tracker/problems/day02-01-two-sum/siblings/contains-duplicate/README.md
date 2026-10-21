# Contains Duplicate

**LeetCode:** [217. Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) (Easy)  
**Tier:** must  
**How it maps from Two Sum:** The complement of x is x itself — so a set (no index needed) answers "seen before?".

## Analyse

✍️ Return true if any value appears at least twice.
✍️ Brute: all pairs O(n²). Sort and compare neighbours: O(n log n), O(1) extra.

## Brainstorm

✍️ The question at each element is "have I seen this exact value?" → hash set. Check, then insert. O(n) time, O(n) space.

## Algorithm in words

✍️ Walk the array; if the value is already in the set, return true; otherwise insert it. Return false at the end.

## Pseudocode

```
seen = empty set
for x in a:
    if x in seen: return true
    seen.insert(x)
return false
```

## Reference Java

```java
class Solution {
    public boolean containsDuplicate(int[] a) {
        Set<Integer> seen = new HashSet<>();
        for (int x : a) {
            if (seen.contains(x)) return true;
            seen.add(x);
        }
        return false;
    }
}
```

## Quick theory

✍️ Set = map without values; use it when you only need membership ([[cpp-unordered-map-set#api]]).
- Trade-off talk: sorting gives O(1) extra space at O(n log n) time.
