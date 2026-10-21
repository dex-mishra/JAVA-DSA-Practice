# Binary search — the invariant that makes it correct

> Keep a range [lo, hi] that is guaranteed to contain the answer if it exists; halve it each step by comparing with the middle. O(log n).

## Idea

✍️ On sorted data, one comparison with the middle element tells you which half cannot contain the target. Discard that half.
✍️ Each step halves the range → about log₂ n steps. 10⁹ elements → ~30 steps.
✍️ Correctness rests on an **invariant**: "if the target exists, it is inside [lo, hi]". Every update must preserve it.

## Recognise it

✍️ Sorted array (or sorted rows) + find / insert position / first / last occurrence.
✍️ O(log n) required, or n up to 10⁹ with an O(1) check.
✍️ A **monotone** yes/no condition over indices or values: false false false true true true → find the first true. This is the general form ([[bs-off-by-one-templates#first-true]]).

## Template: exact match

```java
int search(int[] a, int target) {
    int lo = 0, hi = a.length - 1;               // closed range [lo, hi]
    while (lo <= hi) {                           // range non-empty
        int mid = lo + (hi - lo) / 2;            // no overflow
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;       // target is right of mid
        else hi = mid - 1;                       // target is left of mid
    }
    return -1;                                   // range empty → not present
}
```
✍️ Closed range `[lo, hi]` → loop `while (lo <= hi)` → updates `mid + 1` / `mid − 1`. Keep these three together; mixing conventions causes infinite loops.

## Why it always terminates

✍️ Each iteration either returns or sets `lo = mid + 1` or `hi = mid − 1`, so the range strictly shrinks. When `lo > hi`, it is empty and the loop stops.
- With `lo = mid` (no +1) and `mid` rounding down, a two-element range can loop forever. That is why the "first true" template uses a half-open range ([[bs-off-by-one-templates]]).

## Pitfalls

✍️ `mid = (lo + hi) / 2` overflows for large lo, hi. Use `lo + (hi − lo) / 2`.
✍️ `hi = n` vs `hi = n − 1` must match the loop condition (closed vs half-open).
✍️ Binary search on **unsorted** data gives garbage. Check the property that justifies the discard.

## Complexity

O(log n) time, O(1) space (iterative).
