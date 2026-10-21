# Top k with a heap of size k

> To keep the k largest, use a MIN-heap of size k: its top is the smallest of the k largest, and anything smaller than it can be discarded. O(n log k).

## Idea

✍️ For the k **largest**, keep a **min**-heap of at most k elements. When it exceeds k, pop the smallest. At the end it holds exactly the k largest, and its top is the k-th largest.
✍️ The heap's top is the "entry bar": any new element smaller than it cannot be among the k largest.
✍️ For the k smallest, mirror it: a max-heap of size k.

## Recognise it

✍️ "k-th largest / smallest", "top k frequent", "k closest points", "k most …", streams where k is small compared with n.

## Brute force → heap

Brute force: sort everything and take the top k. O(n log n).
✍️ Bottleneck: fully sorting n elements when only the order of the top k matters.
✍️ Fix: maintain only the k best seen so far. Each element costs O(log k) → O(n log k), and O(k) memory (works on a stream).

## Template

```java
int findKthLargest(int[] a, int k) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();    // min-heap
    for (int x : a) {
        pq.offer(x);
        if (pq.size() > k) pq.poll();                     // drop the smallest
    }
    return pq.peek();                                     // smallest of the k largest
}
```

## Top k frequent

✍️ Count frequencies with a map ([[hash-frequency-counting]]), then push `(count, value)` pairs into a min-heap of size k keyed by count.
✍️ O(n) alternative: bucket by frequency (frequencies are 1..n) and read buckets from high to low ([[sort-counting-sort#buckets]]).

## Complexity

O(n log k) time, O(k) space. Quickselect gives O(n) average ([[heap-vs-quickselect]]).
