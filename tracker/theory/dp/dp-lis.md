# Longest increasing subsequence

> dp[i] = length of the longest increasing subsequence ending at i = 1 + max dp[j] over j < i with a[j] < a[i]. O(n²); patience sorting with binary search gives O(n log n).

## Idea

✍️ Subsequence = any elements in order, not necessarily adjacent. The next element must be larger than the previous one, so the state must know where the subsequence **ends**: `dp[i]` = LIS ending exactly at index i.
✍️ `dp[i] = 1 + max(dp[j])` over j < i with `a[j] < a[i]` (or 1 if none). Answer = max over all dp[i].

## Template O(n²)

```java
int lengthOfLIS(int[] a) {
    int n = a.length, best = 0;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        best = Math.max(best, dp[i]);
    }
    return best;
}
```

## O(n log n): tails array

✍️ Keep `tails[k]` = the smallest possible last element of an increasing subsequence of length k+1. It is always sorted.
✍️ For each x: find the first tail ≥ x (binary search for the insertion point). If none, append x (a longer subsequence); otherwise replace it with x (same length, smaller ending — better for the future).
```java
List<Integer> tails = new ArrayList<>();
for (int x : a) {
    int pos = Collections.binarySearch(tails, x);
    if (pos < 0) pos = -(pos + 1);                 // insertion point = first tail >= x
    if (pos == tails.size()) tails.add(x); else tails.set(pos, x);
}
return tails.size();
```
✍️ `tails` is **not** an actual subsequence — only its length is meaningful.
- Non-decreasing (allow equal): search for the first tail > x instead.

## Variations

- Longest string chain (LeetCode 1048): sort words by length; `dp[word] = 1 + max dp[word with one letter removed]` using a hash map — LIS on a DAG of words.
- Number of LIS (LeetCode 673): also keep `count[i]`.
- Russian doll envelopes: sort by width ascending and height **descending** for equal widths, then LIS on heights (n log n).
- Largest divisible subset: LIS with "divides" instead of "<", plus reconstruction.

## Complexity

O(n²) / O(n) for the DP; O(n log n) / O(n) for tails.
