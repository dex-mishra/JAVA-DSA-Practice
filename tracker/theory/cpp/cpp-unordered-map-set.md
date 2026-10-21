# HashMap and HashSet — API and gotchas

> Inserting, looking up, counting and erasing in hash containers, the getOrDefault/merge idioms, and the bucket/treeify internals.

## The API you need

✍️ `Map<Integer,Integer> mp = new HashMap<>();` key → value. `Set<Integer> st = new HashSet<>();` keys only.
✍️ Insert/update: `mp.put(key, value);` Counting: `mp.merge(key, 1, Integer::sum);` (creates the key at 1 if missing, else adds 1).
✍️ Membership: `mp.containsKey(key)` returns true/false. `st.contains(x)`.
>> detour hash-table-internals#picture | How HashMap finds a key without searching | 3 min
✍️ Read without inserting: `int v = mp.getOrDefault(key, 0);` — never auto-unbox a bare `mp.get(key)` into `int`, as a missing key returns `null` and throws NullPointerException.
✍️ Erase: `mp.remove(key);` Size: `mp.size()`.

```java
Map<Integer,Integer> freq = new HashMap<>();
for (int x : a) freq.merge(x, 1, Integer::sum);          // frequency count
if (freq.containsKey(7)) System.out.print(freq.get(7));  // safe read: key exists
for (Map.Entry<Integer,Integer> e : freq.entrySet()) { /* order is arbitrary */ }
```

## No insert-on-read, but watch null and autoboxing

✍️ Java has no C++-style `mp[key]` that silently inserts a key on a read. But `mp.get(key)` returns `null` for a missing key, and auto-unboxing that `Integer` into an `int` throws NullPointerException — the Java version of the same class of silent bug.
✍️ Rule: use `containsKey`/`getOrDefault` to *ask*; use `put`/`merge` to *write*. `getOrDefault(key, 0)` gives you the "missing counts as 0" behaviour without an NPE and without inserting anything.
✍️ This matters for logic that counts distinct keys (e.g. "at most k distinct characters" windows): read with `getOrDefault`, and only `put`/`merge` when you really mean to add the key.

## Costs

| Operation | Average | Worst |
|---|---|---|
| put, get, containsKey, merge, remove | O(1) | O(n) |
| iterate all | O(n + buckets) | — |
✍️ A `HashMap` is a bucket array; a key lands in `hash(key) & (buckets-1)`. When one bucket collects 8 or more colliding entries (and the table is ≥ 64) that bucket **treeifies** into a red-black tree, so even a bad bucket degrades to O(log n), not O(n).
✍️ Order of iteration is arbitrary and can change after a resize. Never rely on it. If you need sorted keys, use `TreeMap` ([[cpp-map-set-ordered]]).

## What can be a key

✍️ Boxed primitives (`Integer`, `Long`, `Character`) and `String` work out of the box because they override `equals`/`hashCode`. An `int[]` does NOT — arrays use identity hashCode, so two arrays with equal contents are different keys. Use a `List<Integer>` (its `equals`/`hashCode` are content-based), encode the pair into a `long` (`key = (long)a * BIG + b`), a `String`, or a small `record`.
- For ordered key comparison use `TreeMap<K,V>` with a key type that is `Comparable` (or a `Comparator`).

## Performance tips

- `new HashMap<>(expectedSize)` (or load-factor-aware sizing) before inserting many keys avoids repeated resizing/rehashing (see [[hash-load-factor-and-rehashing]]).
- On adversarial judges, crafted keys can force collisions into one bucket; the treeify-at-8 behaviour caps that at O(log n). LeetCode and campus OAs basically never do this.
- For keys in a small dense range (letters, values 0..10⁵), a plain `int[]` is several times faster than any map ([[cpp-container-choice]]).
