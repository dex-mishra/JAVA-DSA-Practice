# Apply Operations to an Array

**LeetCode:** [2460. Apply Operations to an Array](https://leetcode.com/problems/apply-operations-to-an-array/) (Easy)  
**Tier:** optional  
**How it maps from Move Zeroes:** A simulation pass, then exactly Move Zeroes.

## Analyse

✍️ For i = 0..n−2: if a[i] == a[i+1], double a[i] and set a[i+1] = 0. Then shift all zeros to the end.

## Brainstorm

✍️ Two passes: the simulation (O(n)), then the read/write pointer (O(n)).

## Algorithm in words

✍️ Run the merge rule left to right; then move non-zeros to the front keeping order.

## Pseudocode

```
for i in 0..n-2: if a[i] == a[i+1]: a[i] *= 2; a[i+1] = 0
write = 0; for read: if a[read] != 0: swap(a[write++], a[read])
```

## Reference Java

```java
class Solution {
    public int[] applyOperations(int[] a) {
        int n = a.length;
        for (int i = 0; i + 1 < n; i++)
            if (a[i] == a[i + 1]) { a[i] *= 2; a[i + 1] = 0; }
        int write = 0;
        for (int read = 0; read < n; read++)
            if (a[read] != 0) { int t = a[write]; a[write] = a[read]; a[read] = t; write++; }
        return a;
    }
}
```

## Quick theory

✍️ OA problems often chain an easy simulation with a known pattern; spot the known part and reuse its template.
