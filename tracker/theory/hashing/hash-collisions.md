# Collisions — chaining vs open addressing

> Why collisions are unavoidable and the two standard ways of handling them, with their trade-offs.

## Why collisions are unavoidable

✍️ There are far more possible keys than buckets (pigeonhole principle), so some distinct keys must share a bucket. A hash table is designed to handle collisions, not avoid them.

## Separate chaining

✍️ Each bucket holds a linked list (or small vector) of all keys that hashed there. Insert = append to the bucket's list; lookup = scan that list.
✍️ Cost of an operation = O(1 + length of that bucket's list). With a good hash and load factor ≤ 1, the expected length is O(1).
This is what Java's `HashMap` uses (GCC/libstdc++).

## Open addressing

✍️ All keys live in the bucket array itself. On collision, **probe** for the next free slot: linear probing (i+1, i+2, …), quadratic probing, or double hashing.
- Faster in practice (cache-friendly, no pointers) but degrades badly as the table fills, and deletion needs "tombstones".
- Used by Python's `dict` and many high-performance hash maps.

## Comparison

| | Chaining | Open addressing |
|---|---|---|
| storage | bucket array + list nodes | one flat array |
| load factor > 1 | still works | impossible |
| cache behaviour | poorer (pointer chasing) | better |
| deletion | simple | needs tombstones |
