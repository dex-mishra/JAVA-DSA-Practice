# Counting sort and bucket ideas

> When values lie in a small range, count occurrences and rebuild the array in O(n + range). Bucket-by-frequency gives O(n) top-k.

## Idea

✍️ Values in [0, K): count each value, then write value v `count[v]` times in increasing v. O(n + K) time, O(K) space.
✍️ Only sensible when K is not much larger than n (letters, grades, ages, small ints).

## Buckets indexed by frequency

✍️ Top k frequent elements in O(n): frequencies are between 1 and n, so make `bucket[f]` = list of values with frequency f, then walk f from n down to 1 collecting values until you have k.
