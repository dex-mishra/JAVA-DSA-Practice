# Two heaps — running median

> A max-heap holds the smaller half, a min-heap the larger half; keep their sizes within one. The median is read from the tops in O(1); each insert is O(log n).

## Idea

✍️ Split all numbers seen so far into a **lower half** (max-heap `lo`) and an **upper half** (min-heap `hi`), with every element of lo ≤ every element of hi.
✍️ Keep sizes balanced: `lo.size() == hi.size()` or `lo.size() == hi.size() + 1`. Then the median is `lo.peek()` (odd count) or the average of both tops (even).

## Template

```java
class MedianFinder {
    private PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
    private PriorityQueue<Integer> hi = new PriorityQueue<>();                            // min-heap
    public void addNum(int x) {
        lo.offer(x);
        hi.offer(lo.poll());                                  // move the largest of lo to hi
        if (hi.size() > lo.size()) lo.offer(hi.poll());       // rebalance
    }
    public double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return (lo.peek() + (double) hi.peek()) / 2.0;
    }
}
```
✍️ The "push to lo, move top to hi, rebalance" dance guarantees both the ordering and the size invariant with no case analysis.

## Where else

Sliding window median (needs deletion → two multisets), IPO (LeetCode 502: a max-heap of affordable profits), scheduling with "best available now" choices.

## Complexity

addNum O(log n), findMedian O(1), O(n) space.
