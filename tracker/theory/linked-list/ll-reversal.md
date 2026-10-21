# Reversing a linked list

> Walk the list with prev, cur and next, flipping each pointer to point backwards. Iterative O(1) space; recursive version for understanding.

## Idea

✍️ Reversing = making every `next` point to the previous node. Keep `prev` (already-reversed part), `cur` (node being flipped), and save `nxt` before flipping.
✍️ When `cur` becomes null, `prev` is the new head.

## Template (iterative)

```java
ListNode reverseList(ListNode head) {
    ListNode prev = null; ListNode cur = head;
    while (cur != null) {
        ListNode nxt = cur.next;     // save
        cur.next = prev;             // flip
        prev = cur;                  // advance prev
        cur = nxt;                   // advance cur
    }
    return prev;
}
```
✍️ Four lines in the loop, always in this order: **save, flip, move prev, move cur**.

## Recursive version

```java
ListNode reverseList(ListNode head) {
    if (head == null || head.next == null) return head;  // empty or one node
    ListNode newHead = reverseList(head.next);           // reverse the rest
    head.next.next = head;                               // the node after head now points back
    head.next = null;
    return newHead;
}
```
✍️ Leap of faith ([[rec-how-recursion-works#leap-of-faith]]): trust that the call reverses everything after head; then only fix the link between head and its old successor.
- Recursion uses O(n) stack; the iterative version uses O(1).

## Variations

- Reverse a sub-range [left, right] (LeetCode 92): walk to the node before `left`, reverse `right − left + 1` nodes, reconnect both ends.
- Reverse in groups of k (LeetCode 25): repeatedly reverse k nodes if k remain.
- Palindrome list: reverse the second half and compare ([[ll-merge-and-split#palindrome]]).

## Complexity

O(n) time, O(1) space (iterative), O(n) stack (recursive).
