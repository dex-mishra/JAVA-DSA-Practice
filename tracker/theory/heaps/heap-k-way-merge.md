# K-way merge with a heap

> Merge k sorted lists by keeping the current head of each list in a min-heap; repeatedly pop the smallest and push its successor. O(N log k).

## Idea

✍️ The next element of the merged output is the smallest among the k current heads. A min-heap of size k gives it in O(log k).
✍️ After popping a node, push its `next` (if any). The heap always holds at most one node per list.

## Template

```java
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq = new PriorityQueue<>(new Comparator<ListNode>() {
        public int compare(ListNode a, ListNode b) { return Integer.compare(a.val, b.val); }
    });                                                                   // min-heap
    for (ListNode l : lists) if (l != null) pq.offer(l);
    ListNode dummy = new ListNode(0); ListNode tail = dummy;
    while (!pq.isEmpty()) {
        ListNode x = pq.poll();
        tail.next = x; tail = x;
        if (x.next != null) pq.offer(x.next);
    }
    return dummy.next;
}
```

## Alternatives

✍️ Divide and conquer: merge lists pairwise (1+2, 3+4, …) then merge the results — also O(N log k), no heap.
- Merging lists one by one into a growing result is O(N·k) — the slow answer.
- Same idea: k-th smallest in a sorted matrix, smallest range covering k lists, merging k sorted arrays.

## Complexity

O(N log k) for N total nodes. O(k) heap space.
