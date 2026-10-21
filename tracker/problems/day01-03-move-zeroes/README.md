# Move Zeroes

**LeetCode:** [283. Move Zeroes](https://leetcode.com/problems/move-zeroes/) (Easy)  
**Day:** 1  
**Pattern:** read-write-pointer  
**Role:** LEARN

## Understand

✍️ f(array, modified in place) → all non-zero elements first in their original order, then all zeros.
- n ≤ 10⁴. Must not copy the array.
- Example: [0,1,0,3,12] → [1,3,12,0,0].
>> detour cx-space-and-in-place#in-place | What "in place" allows and forbids | 2 min

## Analyse

✍️ By hand: I look at each non-zero and slide it to "the next free spot at the front". The free spot starts at 0 and moves one step each time I place something.
✍️ Hard part: doing it without a second array, and without disturbing the order of non-zeros.
✍️ Edges: no zeros (nothing moves), all zeros, a single element.

## Brainstorm: brute → optimal

✍️ **1. Brute A.** Copy non-zeros into a new array, pad with zeros, copy back. O(n) time but O(n) space — breaks "in place".
✍️ **1. Brute B.** When you see a 0, erase it and push a 0 at the end. Erase shifts the whole tail → O(n) per zero → O(n²).
✍️ ↳ Bottleneck of B: the same elements are shifted again and again.
✍️ ↳ Unlock: each kept element has a known final position = number of kept elements before it. Move it there **once**.
✍️ **2. Optimal.** Read pointer visits everything; write pointer = next free spot. Swap a non-zero into the write spot. O(n), O(1).

## Algorithm in words

✍️ 1. Set the write position to 0.
✍️ 2. For each read position from left to right: if the element is non-zero, swap it with the element at the write position and advance the write position.
✍️ 3. Zeros end up behind, because every swap pushes a zero (or the same element) backwards.

## Pseudocode

```
STATE   write = 0
LOOP    for read in 0..n-1
CHECK     if a[read] != 0
UPDATE      swap(a[write], a[read]); write = write + 1
RETURN  (array modified in place)
```

## Reference Java

```java
class Solution {
    public void moveZeroes(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] != 0) {
                int t = a[write]; a[write] = a[read]; a[read] = t;
                write++;
            }
        }
    }
}
```

## Dry run

| read | a[read] | action | array after | write |
|---|---|---|---|---|
| start | | | [0,1,0,3,12] | 0 |
| 0 | 0 | skip | [0,1,0,3,12] | 0 |
| 1 | 1 | swap(0,1) | [1,0,0,3,12] | 1 |
| 2 | 0 | skip | [1,0,0,3,12] | 1 |
| 3 | 3 | swap(1,3) | [1,3,0,0,12] | 2 |
| 4 | 12 | swap(2,4) | [1,3,12,0,0] | 3 |

## Edge cases and complexity

✍️ O(n) time (one pass), O(1) extra space.
✍️ Invariant: a[0..write−1] holds the non-zeros seen so far in order; a[write..read−1] are all zeros.
- When there are no zeros, `write == read` and every swap is with itself — harmless.

## Carry forward

✍️ "In place, keep order, remove/move some elements" → read/write pointer. The only problem-specific line is `keep(a[read])`.
✍️ Use **swap** when the removed elements must still be in the array; **copy** when what is left after `write` does not matter.

## Interview follow-ups

- *Minimise the number of writes.* Copy non-zeros forward, then fill the tail with zeros only where needed; or skip the swap when read == write.
- *Move all zeros to the front instead.* Walk from the right with the write pointer at n−1.
- *Partition evens before odds.* Same template with keep = "is even" (LeetCode 905).

## Siblings

- [Remove Element](siblings/remove-element/) (must)
- [Sort Array By Parity](siblings/sort-array-by-parity/) (optional)
- [Apply Operations to an Array](siblings/apply-operations-to-an-array/) (optional)
