# Dutch national flag — three-way partition in one pass

> Three pointers split the array into < pivot, = pivot, unknown, > pivot regions; one pass sorts 0s, 1s and 2s in place.

## Idea

✍️ Maintain four regions: `[0, low)` = 0s, `[low, mid)` = 1s, `[mid, high]` = unknown, `(high, n−1]` = 2s.
✍️ Look at `a[mid]`: 0 → swap into the low region, advance low and mid. 1 → advance mid. 2 → swap with `a[high]`, shrink high, but **do not** advance mid (the swapped-in element is still unknown).

## Template

```java
void sortColors(int[] a) {
    int low = 0, mid = 0, high = a.length - 1;
    while (mid <= high) {
        if (a[mid] == 0) { int t = a[low]; a[low++] = a[mid]; a[mid++] = t; }
        else if (a[mid] == 1) mid++;
        else { int t = a[mid]; a[mid] = a[high]; a[high--] = t; }   // mid stays: new a[mid] is unchecked
    }
}
```

## Pitfalls

✍️ Advancing `mid` after swapping with `high` skips an unchecked element — the classic bug.
✍️ Loop condition `mid <= high` (the unknown region is closed on both ends).
- Simpler two-pass alternative: count 0s, 1s and 2s, then overwrite. Also O(n), but the interviewer usually asks for one pass.

## Complexity

O(n) time, one pass, O(1) space.
