# Space complexity and "in-place"

> Auxiliary vs total space, what "O(1) extra space" and "in-place" really allow, and how recursion uses space.

## Auxiliary vs total space

✍️ **Auxiliary space** = extra memory your algorithm allocates, not counting the input. When an interviewer says "space complexity", they almost always mean auxiliary.
✍️ The output array usually does not count either ("O(1) extra space, not counting the output").
✍️ A hash map holding up to n keys → O(n). A fixed array of 26 counters → O(1) (it does not grow with n).

## What "in-place" means

✍️ In-place = modify the input array itself using O(1) extra variables, instead of building a new array.
- Typical in-place tools: a write pointer ([[arr-read-write-pointer]]), swapping, reversing segments, using the sign or value of elements as markers.
- In-place is a constraint, not a style: only do it when asked or when memory is tight, because it destroys the input.

## Recursion uses stack space

✍️ Each active recursive call keeps a stack frame. Space = maximum recursion **depth** × frame size.
✍️ Recursing on a balanced tree → O(log n) depth. On a skewed tree or a linked list → O(n) depth.
- Deep recursion (≈ 10⁵ levels) can overflow the stack on some judges; prefer iteration then. See [[cpp-recursion-stack-limits]].

## The time–space trade

✍️ Most optimisations in this plan trade space for time: a hash map (O(n) space) turns O(n²) into O(n).
- When asked "can you do it in O(1) space?", the answer usually uses sortedness (two pointers), a voting argument (Boyer–Moore), arithmetic (XOR, sums), or in-place marking.
