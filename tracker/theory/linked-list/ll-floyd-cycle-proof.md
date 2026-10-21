# Floyd's cycle algorithm — finding where the cycle starts

> After slow and fast meet, a pointer from the head and a pointer from the meeting point, both moving one step, meet exactly at the cycle's entry. Here is why.

## The algorithm

✍️ Phase 1: run slow/fast until they meet (or fast ends → no cycle).
✍️ Phase 2: put one pointer at head, keep one at the meeting point, move **both one step** at a time. Where they meet is the cycle entry.

## Why it works

✍️ Let a = distance from head to entry, b = distance from entry to the meeting point, c = cycle length.
✍️ When they meet, slow travelled a + b; fast travelled a + b + k·c for some k ≥ 1. Fast travelled twice as far: 2(a + b) = a + b + k·c ⇒ **a = k·c − b**.
✍️ So walking a steps from the meeting point (which is b into the cycle) lands at b + a = k·c → exactly the entry. Walking a steps from head also lands at the entry. They meet there.

## Template

```java
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;
        }
    }
    return null;
}
```

## Where else

✍️ Find the duplicate number (LeetCode 287): treat `i → a[i]` as a linked list; the duplicate is the cycle entry. O(n) time, O(1) space, without modifying the array.
