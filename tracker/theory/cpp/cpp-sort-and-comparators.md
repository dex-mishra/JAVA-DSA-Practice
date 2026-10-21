# Sorting and custom comparators

> Sorting arrays and lists, sorting by a key with a Comparator, lambdas, stability, and the comparator-overflow trap.

## Basics

✍️ `Arrays.sort(a);` sorts an `int[]` ascending, O(n log n). `Collections.sort(list);` for a `List`.
✍️ Descending for primitives needs a boxed array + comparator: `Integer[] b = …; Arrays.sort(b, Collections.reverseOrder());` (there is no descending overload for `int[]`). For a list: `list.sort(Collections.reverseOrder());`
✍️ Part of an array: `Arrays.sort(a, l, r);` sorts indices [l, r).

## Custom comparators

✍️ A `Comparator<T>` returns a negative number if x should come before y, zero if equal, positive if after.

```java
// intervals (int[]) by start
Arrays.sort(iv, (x, y) -> Integer.compare(x[0], y[0]));
// by end, then by start
Arrays.sort(iv, (x, y) -> x[1] != y[1] ? Integer.compare(x[1], y[1]) : Integer.compare(x[0], y[0]));
// or build it with the Comparator combinators
Arrays.sort(iv, Comparator.<int[]>comparingInt(x -> x[1]).thenComparingInt(x -> x[0]));
// strings by length
words.sort(Comparator.comparingInt(String::length));
```

## The comparator-overflow trap

✍️ A comparator must be a total order: consistent and transitive. Returning `a - b` for `int` values can **overflow** when they are far apart (e.g. a very negative b), producing the wrong sign and a `java.lang.IllegalArgumentException: Comparison method violates its general contract!` or a wrong order.
✍️ Use `Integer.compare(a, b)` (or `Long.compare`) instead of `a - b` so the comparison can never overflow.

## Stability

✍️ `Arrays.sort` on **objects** and `Collections.sort`/`list.sort` are **stable** (merge sort) — equal elements keep their relative order. `Arrays.sort` on a **primitive** `int[]` uses a dual-pivot quicksort and is **not** stable (but stability is meaningless for bare ints anyway).
- When you sort by one key after another and the earlier order matters (e.g. "by frequency, ties in original order"), rely on the stable object sort, or encode the tie-break into the comparator.

## Sorting indices instead of values

When you need the original positions after sorting, box the indices so you can use a comparator:
```java
Integer[] idx = new Integer[n];
for (int i = 0; i < n; i++) idx[i] = i;          // 0,1,2,...,n-1
Arrays.sort(idx, (i, j) -> Integer.compare(a[i], a[j]));
```
The lambda reads the effectively-final array `a` to compare by value while keeping the original index in `idx`.
