# Sort Array by Increasing Frequency

**LeetCode:** [1636. Sort Array by Increasing Frequency](https://leetcode.com/problems/sort-array-by-increasing-frequency/) (Easy)  
**Tier:** optional  
**How it maps from Majority Element:** Count frequencies, then sort with a comparator that reads the counts.

## Analyse

✍️ Sort by frequency ascending; ties by value descending.

## Brainstorm

✍️ Frequency map, then `sort` with a two-key comparator. O(n log n).

## Algorithm in words

✍️ Count; sort with (freq ascending, value descending).

## Pseudocode

```
cnt = frequency map
sort a by (cnt[x] asc, x desc)
```

## Reference Java

```java
class Solution {
    public int[] frequencySort(int[] a) {
        final Map<Integer, Integer> cnt = new HashMap<>();
        for (int x : a) cnt.put(x, cnt.getOrDefault(x, 0) + 1);
        Integer[] b = new Integer[a.length];
        for (int i = 0; i < a.length; i++) b[i] = a[i];
        Arrays.sort(b, new Comparator<Integer>() {
            public int compare(Integer x, Integer y) {
                if (!cnt.get(x).equals(cnt.get(y))) return cnt.get(x) - cnt.get(y);
                return y - x;
            }
        });
        for (int i = 0; i < a.length; i++) a[i] = b[i];
        return a;
    }
}
```

## Quick theory

✍️ Two-key comparators: compare the first key, fall back to the second; never use `<=` ([[cpp-sort-and-comparators#strict]]).
