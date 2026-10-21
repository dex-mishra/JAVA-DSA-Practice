# Writing pseudocode — the 5-slot format

> A fixed layout (state, loop, check, update, return) that turns an idea into pseudocode you can translate to C++ line by line, so you never face a blank page.

## Algorithm in words first, then pseudocode

✍️ Brainstorming produces an *idea*. An idea is not yet an algorithm. Write it as numbered English steps first ("algorithm in words"), then convert those steps into pseudocode.
The two steps exist because they catch different mistakes:
- Algorithm-in-words catches **logic** gaps: "wait, what do I do when the map already has the key?"
- Pseudocode catches **mechanics** gaps: initial values, loop bounds, the order of two lines.

✍️ If you cannot write the algorithm in 3–7 numbered sentences, the idea is not finished. Go back to brainstorming, not forward to code.

## The five slots

✍️ Every iterative solution in this plan fits five slots. Write them in this order:

```
STATE    what I keep between iterations, with initial values
LOOP     what I walk over (and in what order)
CHECK    the question I ask at each step
UPDATE   how the state changes (and in what order relative to CHECK)
RETURN   what I output, and what if the loop never triggered
```

✍️ The most common bug is the **order of CHECK and UPDATE**. Two Sum checks before inserting; a running maximum updates then compares. Decide it consciously and write it down.

## The recursive version

✍️ For recursion and backtracking use these slots instead:

```
FUNCTION   name(parameters) → what it returns, in one sentence
BASE       when to stop, and what to return there
CHOICES    what options exist at this call
RECURSE    the call(s) for each choice, and what changes in the arguments
COMBINE    how results of the calls become this call's answer (or: undo the choice)
```

The sentence after FUNCTION is the most important line you will write. "`depth(node)` returns the number of nodes on the longest downward path from `node`." Once that sentence is true, the recursive case almost writes itself (see [[rec-how-recursion-works#leap-of-faith]]).

## Style rules that make translation mechanical

✍️ One line of pseudocode → at most one or two lines of C++.
✍️ Use real variable names you will use in code (`seen`, `best`, `left`), not `x` and `y`.
✍️ Write the data structure type next to state: `seen = map value → index`.
- Use `←` or `=` for assignment, `==` for comparison — never mix them up on paper.
- Indent loop bodies. On paper, a vertical line down the left of a loop body helps.
- Do not write Java syntax (`var`, generics angle-brackets, semicolons). It slows you down and hides logic errors behind syntax.

## Example: Two Sum in five slots

```
STATE   seen = map  value → index      (empty)
LOOP    for i from 0 to n-1, x = a[i]
CHECK     need = target - x
          if need is in seen → return [seen[need], i]
UPDATE    seen[x] = i                   (AFTER the check, so x never pairs with itself)
RETURN  (problem guarantees an answer) → return []
```

Translation to Java is now mechanical: one `HashMap<Integer,Integer>`, one `for`, one `if (seen.containsKey(need))`, one assignment.
