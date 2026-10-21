# How Java passes arguments: references and copies

> What Java copies for primitives vs objects, why arrays and lists are shared and mutable, how to return an extra value, and lambdas capturing effectively-final variables.

## Primitives vs references

✍️ Java is always pass-by-value, but the "value" of an object variable is a **reference**.
✍️ `void f(int x)` — x is a copy. Changing x inside f does not affect the caller's variable.
✍️ `void f(int[] a)` / `void f(List<Integer> a)` — the reference is copied, but it points at the **same** array/list, so `a[0] = 9` or `a.add(9)` is visible to the caller. No deep copy happens unless you call `clone()`/`Arrays.copyOf`/`new ArrayList<>(a)`.
✍️ Reassigning the parameter itself (`a = new int[5];`) only rebinds the local copy and does NOT change what the caller sees.

## In recursion and backtracking

✍️ Pass the input array as-is (it is shared, no copy), and the "current path" as a single `List<Integer>` with add/remove-last (choose → recurse → undo). See [[bt-pick-or-skip#undo]].
✍️ Making a fresh copy of `path` on every call is correct but costs O(n) each time; acceptable for tiny n, wasteful otherwise — mutate one shared list and undo instead.
✍️ To "return" an extra value from a recursive helper, mutate a field or a one-element array (`int[] best = {0};`) since a plain `int` parameter cannot carry a value back out.

## Lambdas and closures

A Java lambda can read local variables only if they are **effectively final** (assigned once). It cannot reassign them. To mutate state from inside a lambda, close over an array or object field: `int[] count = {0}; list.forEach(x -> count[0]++);`. A recursive helper that needs to see itself and shared arrays is usually written as a private method rather than a lambda, because a lambda cannot refer to itself by name.
