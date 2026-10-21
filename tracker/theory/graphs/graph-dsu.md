# Union-find (disjoint set union)

> Each set is a tree with a root representative. find follows parents to the root (with path compression); union links roots (by size or rank). Nearly O(1) per operation.

## Idea

✍️ Maintain groups of elements that merge over time. Each element points to a parent; the root of the tree is the group's representative.
✍️ `find(x)` → the root of x's group. `unite(a, b)` → make one root the parent of the other. Two elements are connected iff `find(a) == find(b)`.

## Template

```java
class DSU {
    int[] p, sz;
    DSU(int n) {
        p = new int[n]; sz = new int[n];
        for (int i = 0; i < n; i++) { p[i] = i; sz[i] = 1; }
    }
    int find(int x) { return p[x] == x ? x : (p[x] = find(p[x])); }   // path compression
    boolean unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                 // already connected
        if (sz[a] < sz[b]) { int t = a; a = b; b = t; } // union by size: smaller under larger
        p[b] = a; sz[a] += sz[b];
        return true;
    }
}
```
✍️ `unite` returning false is how you detect a **redundant edge** (it would close a cycle).

## Why it is fast

✍️ Path compression flattens trees during `find`; union by size keeps them shallow. Together, the cost per operation is O(α(n)) — the inverse Ackermann function, ≤ 4 for any realistic n. Treat it as O(1).
- With neither optimisation, trees can become chains and operations O(n).

## Recognise it

✍️ "connected / same group" queries mixed with merges, "redundant connection", "number of provinces/components", "accounts merge", "smallest equivalent string", Kruskal's MST.
✍️ Edges arrive over time and you need connectivity after each one (a DFS would have to restart).

## Mapping problems onto DSU

- Accounts merge: union all emails of one account; group emails by root.
- Stones removed (same row or column): union a stone's row with its column (offset columns by 10⁴); answer = stones − components.
- Grids: index cells as `r·C + c` ([[mat-traversal-and-directions#flatten]]).

## Complexity

O(α(n)) amortised per operation, O(n) space.
