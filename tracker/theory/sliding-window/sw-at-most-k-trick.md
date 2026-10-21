# Exactly k = at most k minus at most (k − 1)

> "Exactly k" conditions are not monotone, but "at most k" is. Count windows for at most k and at most k−1 and subtract.

## Idea

✍️ "Number of subarrays with exactly k distinct values" — shrinking can move a window from "too many" to "exactly k" to "too few", so one window cannot track it.
✍️ "At most k" is monotone. For each r, every start from l to r gives a valid window → add `r − l + 1`.
✍️ exactly(k) = atMost(k) − atMost(k − 1).

## Template

```java
long atMost(int[] a, int k) {
    Map<Integer,Integer> cnt = new HashMap<>();
    long res = 0; int l = 0, distinct = 0;
    for (int r = 0; r < a.length; r++) {
        int c = cnt.getOrDefault(a[r], 0);
        if (c == 0) distinct++;
        cnt.put(a[r], c + 1);
        while (distinct > k) { int cl = cnt.get(a[l]) - 1; cnt.put(a[l], cl); if (cl == 0) distinct--; l++; }
        res += r - l + 1;            // all windows ending at r with start in [l, r]
    }
    return res;
}
// exactly k: atMost(a, k) - atMost(a, k - 1)
```

## Where it appears

Subarrays with K different integers (LeetCode 992), binary subarrays with sum (LeetCode 930), count number of nice subarrays (LeetCode 1248).
