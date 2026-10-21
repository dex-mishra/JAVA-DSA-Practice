# Arrays and ArrayList — the containers you will use in every problem

> Declaring, filling, accessing and passing arrays and ArrayLists; length vs size; the operations that are secretly O(n); and the array-vs-ArrayList decision rule.

## Declaring and filling

✍️ `int[] a = new int[n];` gives n zeros. `Arrays.fill(a, -1);` fills with −1. `int[] a = {3, 1, 4};` for a literal.
✍️ 2D: `int[][] g = new int[rows][cols];` (all zeros, rectangular).
✍️ `List<Integer> a = new ArrayList<>();` then `a.add(x)` appends (amortised O(1)), `a.remove(a.size() - 1)` removes the last (O(1)), `a.get(a.size() - 1)` reads the last.
✍️ `a.length` is a field on arrays (no parentheses); `list.size()` is a method on a List. Keep the two straight.

```java
int[] a = {3, 1, 4};
List<Integer> list = new ArrayList<>(List.of(3, 1, 4));
list.add(1);                   // [3,1,4,1]
int n = a.length;              // length is a field, not a call
for (int i = 0; i < n; i++) System.out.print(a[i]);
for (int x : a) System.out.print(x);  // reads a copy of each primitive
for (int i = 0; i < a.length; i++) a[i] *= 2;  // index loop to modify in place
```

## Costs of common operations

| Operation | Cost |
|---|---|
| `a[i]`, `list.get(i)`, `add`, `remove(size-1)` | O(1) (add amortised) |
| `list.add(i, x)`, `list.remove(i)` at position i | O(n − i) — shifts everything after i |
| `list.remove(0)` (remove front) | O(n) — use an `ArrayDeque` if you need this often |
| `Arrays.sort(a)` / `Collections.sort(list)` | O(n log n) |
| `Collections.reverse(list)` | O(n) |
| linear search `for (x : a)` | O(n) |
| copying `int[] b = Arrays.copyOf(a, a.length);` | O(n) |

## ArrayList growth and treeless appends

`ArrayList` is a backing `Object[]` that grows by about 1.5× when it fills (C++'s `vector` doubles, ~2×). Each `add` is amortised O(1); a known final size passed to `new ArrayList<>(capacity)` avoids regrowth. There is no C++-style `emplace_back`: `list.add(x)` always takes an already-constructed element, and for primitives autoboxing turns `int` into `Integer`. In DSA code the growth factor rarely matters — just know the append is amortised O(1).

## Passing to methods

✍️ Java passes everything by value, but for arrays and objects the value is a **reference**: `void f(int[] a)` hands the method the same array, so writes inside f are visible to the caller. There is no cheap/expensive copy choice as in C++ — no copy happens unless you call `clone()`/`Arrays.copyOf`.
✍️ Primitives (`int`, `long`) are copied, so a method cannot change the caller's `int`. To share a mutable counter across calls use a field or a one-element `int[]`. See [[cpp-pass-by-reference-and-copies]].

## Pitfalls

✍️ Out-of-bounds `a[i]` throws `ArrayIndexOutOfBoundsException` (it does not read garbage like C++). Still guard `i >= 0 && i < n` before touching neighbours (`a[i-1]`, `a[i+1]`) to avoid the throw.
✍️ Adding or removing from an `ArrayList` while a for-each iterates it throws `ConcurrentModificationException`. Collect into a second list, or iterate with an explicit `Iterator` and use `it.remove()`.
✍️ Array-vs-ArrayList decision rule (apply mechanically to every container you declare): use **`int[]`** iff the size is fixed up front (you know n) OR the LeetCode method signature takes or returns the array (it is sized once and indexed positionally) — this is the default and common case; use **`ArrayList<Integer>` (`List<Integer>`)** iff you build the value with `add` into an initially-empty container of unknown final length (a result list grown element by element) or need mid-list `add(i,…)`/`remove(i)`; for 2D use **`int[][]`** iff the grid is rectangular and sized up front else **`List<int[]>`** for ragged or grown rows; when a signature is `List<Integer>`/`List<List<Integer>>` but the body accumulates in an `int[]`, convert at the return boundary and do not change the declared signature.
- `list.clear()` sets size to 0 but keeps the backing capacity; it is O(n).
