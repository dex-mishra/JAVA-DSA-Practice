# Prefix sum + hash map — counting subarrays with a given sum

> A subarray (i, j] sums to k exactly when pre[j] − pre[i] = k. Walk once with a running prefix sum and count how many earlier prefixes equal pre[j] − k, using a map seeded with {0: 1}.

## Idea

✍️ Every subarray is "a prefix minus a shorter prefix": `sum(a[i..j]) = pre[j+1] − pre[i]`.
✍️ Want `sum = k` → want an earlier prefix value equal to `pre[j+1] − k`. That is **complement lookup** ([[hash-complement-lookup]]) where the "elements" are prefix sums.
✍️ Keep a map `count[prefix value] = how many times this prefix value has appeared so far`. At each position, add `count[running − k]` to the answer, then record `running`.

## Recognise it

✍️ "number of subarrays with sum equal to k", "longest subarray with sum k", "subarray sum divisible by k", "equal number of 0s and 1s".
✍️ Values can be **negative** (or zero). That is the signal that a sliding window will not work ([[sw-monotonicity-requirement]]) and prefix + map is intended.

## Brute force → prefix + map

Brute force: all (i, j) with an inner sum loop. O(n³).
Better: fix i, extend j with a running sum. O(n²).
✍️ Bottleneck: for each end j, trying every start i to see whether `pre[j+1] − pre[i] = k`.
✍️ Job description: "search the earlier prefixes for the value `pre[j+1] − k`". Waste: searching for a known value → store prefix values in a map.

## Why the map starts with {0: 1}

✍️ The empty prefix (sum 0, before index 0) is a real prefix. Without it, subarrays that **start at index 0** are never counted.
✍️ Example: a = [3], k = 3. At j = 0, running = 3, need 3 − 3 = 0. Only the seed makes `count[0] = 1` → answer 1.

## Template

```java
int subarraySum(int[] a, int k) {
    Map<Long,Integer> cnt = new HashMap<>();
    cnt.put(0L, 1);                     // the empty prefix
    long run = 0;
    int ans = 0;
    for (int x : a) {
        run += x;
        ans += cnt.getOrDefault(run - k, 0);      // query first
        cnt.put(run, cnt.getOrDefault(run, 0) + 1); // then record
    }
    return ans;
}
```

## Variations

- **Longest** subarray with sum k: map stores prefix value → **first index** it appeared (only insert if absent, so the earliest index survives). Length = `j − first[run − k]`. Seed `{0: −1}`.
- Equal 0s and 1s (LeetCode 525): replace 0 with −1, then "longest subarray with sum 0".
- Divisible by k (LeetCode 974): key = `run % k` normalised to be non-negative; two prefixes with equal remainders bound a divisible subarray ([[ps-modular-prefix]]).
- Binary subarrays with sum (LeetCode 930): the same template; also solvable with at-most(k) − at-most(k−1) windows ([[sw-at-most-k-trick]]).

## Pitfalls

✍️ Missing the `{0: 1}` seed → misses subarrays starting at index 0.
✍️ Recording before querying → when k = 0, every position counts itself (a zero-length subarray).
✍️ Using a sliding window instead: it fails with negative numbers. Test `[1, −1, 1]`, k = 1 → answer 3.

## Complexity

O(n) time average, O(n) space for the map.
