# 4Sum

**LeetCode:** [18. 4Sum](https://leetcode.com/problems/4sum/) (Medium)  
**Tier:** optional  
**How it maps from 3Sum:** One more fixed loop; dedup at both fixed levels; `long` sums.

## Analyse

✍️ All unique quadruplets summing to target; values up to 10⁹ → sums overflow int.

## Brainstorm

✍️ Sort; fix i and j (both with dedup); two pointers for the last two. O(n³).

## Algorithm in words

✍️ Two outer loops with "skip equal to previous at this level", inner two-pointer scan with dedup after hits.

## Pseudocode

```
for i: skip dup; for j > i: skip dup (j > i+1)
    l = j+1; r = n-1; two-pointer on long sum
```

## Reference Java

```java
class Solution {
    public List<List<Integer>> fourSum(int[] a, int target) {
        Arrays.sort(a);
        int n = a.length;
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            for (int j = i + 1; j < n; j++) {
                if (j > i + 1 && a[j] == a[j - 1]) continue;
                int l = j + 1, r = n - 1;
                while (l < r) {
                    long s = (long) a[i] + a[j] + a[l] + a[r];
                    if (s < target) l++;
                    else if (s > target) r--;
                    else {
                        res.add(Arrays.asList(a[i], a[j], a[l], a[r]));
                        l++; r--;
                        while (l < r && a[l] == a[l - 1]) l++;
                        while (l < r && a[r] == a[r + 1]) r--;
                    }
                }
            }
        }
        return res;
    }
}
```

## Quick theory

✍️ Dedup guard at a nested level is `j > i + 1`, the start of that level ([[tp-skip-duplicates#pitfalls]]).
