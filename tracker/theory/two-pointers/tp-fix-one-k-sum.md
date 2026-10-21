# Fix one, two-pointer the rest (3Sum, 4Sum)

> Sort, loop over the first element, and solve the remaining 2-sum on the suffix with two pointers. Reduces k-sum from O(n^k) to O(n^(k-1)).

## Idea

✍️ 3Sum asks for `a[i] + a[j] + a[k] = 0`. Fix `a[i]`; now you need `a[j] + a[k] = −a[i]` on the part of the array after i. That is exactly a sorted pair-sum → two pointers.
✍️ One outer loop × an O(n) two-pointer scan = O(n²), down from O(n³).

## Recognise it

✍️ "triplets / quadruplets that sum to …", "closest sum of three", "count triangles", and the answer must contain **unique** triplets (sorting makes uniqueness easy).

## Brute force → fix one

Brute force: three nested loops, then deduplicate with a set of sorted triplets. O(n³) plus messy dedup.
✍️ Bottleneck: the innermost two loops search for a pair with a known sum — that is a 2-sum problem, solvable in O(n) on sorted data.
✍️ Fix: sort once (O(n log n)), then for each i, run two pointers on `i+1..n−1`.
Hash-based alternative: for each i, a hash-set 2-sum. Also O(n²), but deduplication is much harder. Sorting wins.

## Template

```java
List<List<Integer>> threeSum(int[] a) {
    Arrays.sort(a);
    int n = a.length;
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && a[i] == a[i-1]) continue;      // same first value → same triplets
        if (a[i] > 0) break;                        // smallest is positive → no zero sum
        int l = i + 1, r = n - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                res.add(Arrays.asList(a[i], a[l], a[r]));
                l++; r--;
                while (l < r && a[l] == a[l-1]) l++; // skip duplicate seconds
                while (l < r && a[r] == a[r+1]) r--; // skip duplicate thirds
            }
        }
    }
    return res;
}
```

## Variations

- 3Sum Closest (LeetCode 16): same scan, track the sum with the smallest `|s − target|`; no dedup needed.
- 4Sum (LeetCode 18): two outer loops + two pointers → O(n³); use `long` for the sum.
- Valid triangle number (LeetCode 611): fix the **largest** side as the outer loop (from the right), two pointers on the left part; when `a[l] + a[r] > a[k]`, all of `l..r−1` work with r → add `r − l`.

## Pitfalls

✍️ Dedup at three places: the fixed element (`a[i] == a[i−1]`, compare with the **previous**, not the next), and both pointers after a hit.
✍️ Skip `a[i] == a[i−1]` and not `a[i] == a[i+1]`: the second skips the first occurrence and loses triplets like [−1, −1, 2].
✍️ After a hit, move both pointers; moving one only finds the same sum again or nothing.

## Complexity

O(n²) time: O(n log n) sort + n outer iterations × O(n) scan. O(1) extra space besides the output (sorting in place; `Arrays.sort` uses O(log n) stack).
