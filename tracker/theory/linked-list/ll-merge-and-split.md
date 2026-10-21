# Merging, splitting and comparing lists

> Merge two sorted lists with a dummy head; split a list at its middle; combine split + reverse + compare for palindromes; merge sort for lists.

## Merge two sorted lists

```java
ListNode mergeTwoLists(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0); ListNode tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = a != null ? a : b;  // attach whatever remains (already sorted)
    return dummy.next;
}
```
✍️ No new nodes are created; existing nodes are re-linked. O(n + m) time, O(1) space.

## Split at the middle

✍️ Find the node **before** the second half with fast/slow (first-middle variant), then cut: `second = slow.next; slow.next = null;`
✍️ Cutting is essential for merge sort: without `slow.next = null` the first half still runs into the second.

## Palindrome list in O(1) space

✍️ 1. Find the middle. 2. Reverse the second half. 3. Compare the first half with the reversed second half node by node. 4. (Optional, polite) reverse back to restore the input.

## Merge sort on a list

Split at the middle, sort both halves recursively, merge with `mergeTwoLists`. O(n log n) time, O(log n) stack (LeetCode 148). This is the standard answer to "sort a linked list".
