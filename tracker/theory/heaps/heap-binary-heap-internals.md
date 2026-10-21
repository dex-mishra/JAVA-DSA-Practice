# How a binary heap works

> A complete binary tree stored in an array, where each parent is ≥ its children. Push sifts up, pop moves the last element to the root and sifts down. O(log n) each.

## Structure

✍️ A heap is a **complete** binary tree (filled level by level) stored in an array: node i has children `2i+1`, `2i+2` and parent `(i−1)/2`.
✍️ Max-heap property: every parent ≥ its children. So the maximum is always at index 0. (Siblings are not ordered — a heap is not sorted.)

## Operations

✍️ **Push**: put the new element at the end, then **sift up**: swap with the parent while it is bigger than the parent. At most height = O(log n) swaps.
✍️ **Pop**: move the last element to the root, remove the last slot, then **sift down**: swap with the larger child while smaller than it. O(log n).
✍️ **Top**: read index 0. O(1).

## Building a heap in O(n)

✍️ Sift down every non-leaf node from the last one up to the root. Most nodes are near the bottom and sift only a little, so the total is O(n), not O(n log n).
- `new PriorityQueue<>(Arrays.asList(boxed))` (heapify via the collection constructor) does this.

## What gets asked

- "What is the difference between a heap and a BST?" — a heap only guarantees the root is the max/min (O(1) top, O(log n) insert/pop, no ordered iteration, no search); a BST keeps full order (O(log n) search, ordered iteration).
- Heap sort: build a max-heap, repeatedly pop to the end. O(n log n), in place, not stable.
