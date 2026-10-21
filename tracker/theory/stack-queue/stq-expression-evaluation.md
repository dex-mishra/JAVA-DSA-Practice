# Evaluating expressions with stacks

> Reverse Polish notation is evaluated with one operand stack; infix expressions use a stack of partial results and signs.

## Reverse Polish notation

✍️ Read tokens left to right. Number → push. Operator → pop the **right** operand first, then the left, apply, push the result.
```java
int evalRPN(String[] t) {
    Deque<Long> st = new ArrayDeque<>();
    for (String tok : t) {
        if (tok.equals("+") || tok.equals("-") || tok.equals("*") || tok.equals("/")) {
            long b = st.pop();
            long a = st.pop();
            if (tok.equals("+")) st.push(a + b);
            else if (tok.equals("-")) st.push(a - b);
            else if (tok.equals("*")) st.push(a * b);
            else st.push(a / b);                 // Java division truncates toward zero, as required
        } else st.push(Long.parseLong(tok));
    }
    return st.peek().intValue();
}
```
✍️ Order matters for − and /: the first pop is the **right** operand.

## Infix with + − and parentheses (recognition)

Basic Calculator (LeetCode 224): keep `result`, `sign`, and a stack. On '(' push the current result and sign, reset; on ')' pop and combine. With * and / (LeetCode 227): push numbers with their sign, and immediately combine with the top for * and /; sum the stack at the end.

## Pitfalls

✍️ "-3" is a number, not an operator: check whole-token equality, not the first character.
- Intermediate products can exceed int; use `long`.
