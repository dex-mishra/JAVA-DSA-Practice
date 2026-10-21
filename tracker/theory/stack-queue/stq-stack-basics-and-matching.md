# Stacks — last in, first out, and bracket matching

> A stack remembers unfinished things in reverse order, so the most recent opener is matched first. Valid parentheses, undo, nested structures.

## Idea

✍️ A stack is the right structure whenever "the most recent unfinished thing must be finished first" — nested brackets, function calls, undo history, backtracking paths.
✍️ Bracket matching: push every opener; on a closer, the top of the stack must be its matching opener — pop it. At the end the stack must be empty.

## Recognise it

✍️ "valid parentheses / balanced", "nested", "remove adjacent duplicates", "backspace", "simplify path", "decode string k[...]".
✍️ Processing something left to right where a later element **cancels** or **completes** an earlier one.

## Template

```java
boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') { st.push(c); continue; }
        if (st.isEmpty()) return false;                     // closer with nothing open
        char o = st.pop();
        if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
    }
    return st.isEmpty();                                    // every opener closed
}
```
✍️ Three failure cases: closer on an empty stack, mismatched pair, openers left at the end.

## Variations

- Only one bracket type → a counter instead of a stack (balance ≥ 0 always, = 0 at the end).
- Remove all adjacent duplicates (LeetCode 1047): push a char, pop if it equals the top.
- Backspace string compare (LeetCode 844): '#' pops; or two pointers from the back for O(1) space.
- Decode string (LeetCode 394): two stacks (counts and partial strings).

## Complexity

O(n) time, O(n) space for the stack.
