# The dummy (sentinel) head

> A fake node placed before the real head so that inserting or deleting at the front is no longer a special case. Return dummy.next.

## Idea

✍️ Many list operations treat the head differently ("if we delete the head, return head.next, else …"). A dummy node before the head makes the head an ordinary node with a predecessor.
✍️ Build the answer after `dummy`, and return `dummy.next` at the end.

## Recognise it

✍️ Building a new list (merging, adding numbers digit by digit, partitioning).
✍️ Deleting nodes where the head itself might be deleted (remove n-th from end, remove elements, delete duplicates).

## Template

```java
ListNode dummy = new ListNode(0);   // sentinel; garbage-collected, no manual delete
ListNode tail = dummy;              // last node of the list being built
// ... repeatedly: tail.next = someNode; tail = tail.next;
return dummy.next;
```

## Example: digit-by-digit addition

```java
ListNode addTwoNumbers(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0); ListNode tail = dummy; int carry = 0;
    while (a != null || b != null || carry != 0) {  // carry keeps the loop alive for the final digit
        int s = carry + (a != null ? a.val : 0) + (b != null ? b.val : 0);
        carry = s / 10;
        tail.next = new ListNode(s % 10); tail = tail.next;
        if (a != null) a = a.next;
        if (b != null) b = b.next;
    }
    return dummy.next;
}
```

## Pitfalls

✍️ Returning `dummy` (or `&dummy`) instead of `dummy.next`.
✍️ Forgetting `tail = tail.next` after attaching → every new node overwrites the same link.
