# Fast and slow pointers

> One pointer moves one step, the other two steps. When fast reaches the end, slow is at the middle; if there is a cycle, they meet inside it.

## Idea

✍️ `slow` moves 1 node per step, `fast` moves 2. After k steps, fast has travelled exactly twice as far as slow.
✍️ So when fast reaches the end (n nodes), slow has reached about n/2 → the **middle**, in one pass, without knowing the length.

## Template: middle node

```java
ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {  // fast can take two steps
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;                      // even length → the SECOND of the two middles
}
```
✍️ For the **first** middle of an even list (needed when splitting into halves for merge sort), use `while (fast.next && fast.next.next)` starting both at head.

## Template: cycle detection

```java
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) return true;    // compare after moving
    }
    return false;                         // fast fell off the end → no cycle
}
```
✍️ Why they must meet in a cycle: once both are inside, the gap between them shrinks by exactly 1 each step, so it reaches 0. Proof and entry point: [[ll-floyd-cycle-proof]].

## Recognise it

✍️ "middle of the list", "cycle", "O(1) memory" on a list, "happy number" (cycle in a sequence of numbers), "find the duplicate number" (array as a linked list of indices).

## Pitfalls

✍️ The loop condition `fast && fast.next` must check both, in that order, before `fast.next.next`.
✍️ Comparing `slow == fast` before moving makes them "meet" at the start.
