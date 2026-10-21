# Pairs and tuples in Java: int[], Map.Entry and records

> Bundling values into int[] pairs, how to sort them, Map.Entry for key/value, and small records for named fields.

## pair

✍️ Java has no built-in `pair`. The lightweight idiom is a two-element array: `int[] p = {3, 5};` accessed as `p[0]`, `p[1]`.
✍️ Unlike C++ pairs, `int[]` does **not** compare lexicographically on its own — you must supply a comparator. To sort `int[][]` by first then second: `Arrays.sort(v, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);`
✍️ `List<int[]> v = new ArrayList<>(); v.add(new int[]{val, idx});` is the standard way to sort values while remembering original indices.

## Reading fields cleanly

✍️ Java has no structured bindings. Pull the fields into named locals: `int[] top = pq.poll(); int d = top[0], u = top[1];`
✍️ For a map, iterate entries: `for (Map.Entry<K,V> e : mp.entrySet()) { K key = e.getKey(); V val = e.getValue(); }`

## tuple

For three or more fields use a longer array (`int[] t = {d, r, c};`) or, when names help readability, a small `record`: `record Cell(int d, int r, int c) {}` then `new Cell(d, r, c)` and `cell.d()`. Records auto-generate `equals`/`hashCode`, so they also work as HashMap keys — useful for (distance, row, col) in Dijkstra on grids.
