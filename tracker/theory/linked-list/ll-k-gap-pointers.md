# Two pointers with a k-node gap

> Advance a lead pointer k steps, then move both together; when the lead hits the end, the trailing pointer is k from the end. Removes the n-th node from the end in one pass.

## Idea

✍️ You cannot index from the end of a singly linked list. But if two pointers are always exactly k nodes apart, then when the front one reaches the end, the back one is k nodes before the end.
✍️ To delete the n-th from the end you need the node **before** it, so start both at a dummy and give the gap n + 1.

## Template

```java
ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head);
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i <= n; i++) fast = fast.next;    // gap of n+1
    while (fast != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;                       // slow is just before the target
    return dummy.next;
}
```

## Pitfalls

✍️ Without the dummy, removing the head (n = length) crashes or needs a special case.
✍️ Off-by-one in the gap: draw a 3-node list and n = 1 and check where slow stops.
- Two-pass alternative: count length L, then delete the (L − n)-th from the start. Correct and acceptable; the one-pass version is the follow-up.
