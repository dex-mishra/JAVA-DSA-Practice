# TreeMap and TreeSet — the ordered containers

> Balanced-tree containers with O(log n) operations, sorted iteration, ceiling/floor/higher/lower navigation, and how duplicates are handled.

## What they are

✍️ `TreeMap` and `TreeSet` keep keys **sorted** (internally a red-black tree, the same structure C++'s `map`/`set` use). Every put/contains/remove is O(log n).
✍️ Use them when you need order: smallest/largest key, iterate in sorted order, "first key ≥ x".

## API

```java
TreeSet<Integer> s = new TreeSet<>(List.of(5, 1, 9));
s.first();                 // 1  (smallest)
s.last();                  // 9  (largest)
Integer c = s.ceiling(4);  // first element >= 4 → 5
Integer h = s.higher(5);   // first element  > 5 → 9
Integer f = s.floor(4);    // last element  <= 4 → 1
s.remove(5);               // by value
// TreeSet does not allow duplicates; to count copies use a TreeMap<Integer,Integer>:
TreeMap<Integer,Integer> ms = new TreeMap<>();
ms.merge(3, 1, Integer::sum);                     // add one 3
if (ms.merge(3, -1, Integer::sum) == 0) ms.remove(3);  // remove ONE copy of 3
```
✍️ `ceiling(x)` = first ≥ x, `higher(x)` = first > x, `floor(x)` = last ≤ x, `lower(x)` = last < x. All return `null` when nothing qualifies, and all are O(log n) because they walk the tree (not a linear scan).

## When to reach for them

✍️ Sliding window that needs the min and max of the window with deletions → `TreeMap<Integer,Integer>` as a multiset (or a monotonic deque, [[stq-monotonic-deque]]).
✍️ "Find the closest value to x seen so far" → `TreeSet` + `ceiling`/`floor`.
- Counting with sorted output → `TreeMap<Integer,Integer>`.
