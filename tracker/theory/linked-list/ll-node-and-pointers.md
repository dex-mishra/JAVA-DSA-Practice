# Linked list nodes and pointer manipulation

> What a ListNode is, how next pointers chain nodes, traversal, and the rule for changing pointers without losing the rest of the list.

## The node

✍️ `struct ListNode { int val; ListNode* next; };` A list is a chain of nodes; the last node's `next` is `null`. You hold only `head`.
✍️ No random access: reaching the k-th node costs O(k). Inserting/removing **after a node you already hold** costs O(1).

## Traversal

```java
for (ListNode cur = head; cur != null; cur = cur.next) { /* use cur.val */ }
int length = 0; for (ListNode p = head; p != null; p = p.next) length++;
```
✍️ Always check `cur != null` before reading `cur.next` or `cur.val`. `cur.next.next` needs both `cur` and `cur.next` to be non-null.

## The golden rule of rewiring

✍️ Before overwriting a `next` pointer, save what it pointed to. Once a node's only reference is overwritten, the rest of the list is lost.
```java
ListNode nxt = cur.next;     // 1. save
cur.next = prev;             // 2. rewire
prev = cur; cur = nxt;       // 3. advance using the saved pointer
```
✍️ Draw boxes and arrows on paper for every pointer problem. Update the drawing line by line as you dry-run ([[meta-dry-run]]).

## Deleting a node

✍️ To delete node X you need the node **before** X: `prev.next = prev.next.next;`. If X can be the head, there is no "before" → use a dummy head ([[ll-dummy-head]]).
- LeetCode problems usually do not require `delete`/freeing memory; mention it in interviews.
