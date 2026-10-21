# Load factor, rehashing and reserve

> How the table grows to keep buckets short, why that keeps inserts O(1) amortised, and how reserve avoids the cost.

## Load factor

✍️ Load factor α = (number of keys) / (number of buckets). It is the average bucket length.
✍️ `HashMap` keeps α ≤ `max_load_factor()` (default 1.0). When an insert would exceed it, the table **rehashes**.

## Rehashing

✍️ Rehash = allocate a bigger bucket array (roughly double), and re-insert every key into its new bucket. One rehash costs O(n).
✍️ Because the size doubles, rehashes happen after 1, 2, 4, 8, … inserts. Total rehash work over n inserts < 2n → **O(1) amortised per insert** (same argument as [[cx-amortised-analysis#vector]]).

## reserve

✍️ `mp.reserve(n)` allocates enough buckets for n keys up front, so no rehash happens during the n inserts. Use it when you know the final size; it can make hash-heavy solutions noticeably faster.
- Iterators are invalidated by a rehash: never hold an iterator across inserts.
