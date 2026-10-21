# Intersection of Two Arrays

**LeetCode:** [349. Intersection of Two Arrays](https://leetcode.com/problems/intersection-of-two-arrays/) (Easy)  
**Tier:** optional  
**How it maps from Longest Consecutive Sequence:** Set membership across two inputs; a second set removes duplicates from the answer.

## Analyse

✍️ Distinct values present in both arrays.

## Brainstorm

✍️ Set of the first array; for each value of the second that is in the set, output it once (erase it from the set after use).

## Algorithm in words

✍️ Build a set from a; scan b; output and erase on a hit.

## Pseudocode

```
s = set(a); out = []
for x in b: if x in s: out.append(x); s.remove(x)
```

## Reference Java

```java
class Solution {
    public int[] intersection(int[] a, int[] b) {
        Set<Integer> s = new HashSet<>();
        for (int x : a) s.add(x);
        List<Integer> out = new ArrayList<>();
        for (int x : b) if (s.remove(x)) out.add(x);   // remove returns true if it was there
        int[] res = new int[out.size()];
        for (int i = 0; i < res.length; i++) res[i] = out.get(i);
        return res;
    }
}
```

## Quick theory

✍️ `erase(key)` returns how many were removed — a neat "was it there?" check.
