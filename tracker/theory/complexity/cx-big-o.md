# Big-O — counting work the way interviewers do

> What O(·) means, how to count operations from code, the dominant-term rule, and the common complexities ranked.

## What Big-O measures

✍️ Big-O describes how the running time **grows** as the input size n grows, ignoring constant factors and small terms.
✍️ It answers: "if I double n, roughly how much longer does this take?" O(n): twice as long. O(n²): four times. O(log n): one more step.
It does not tell you the exact time. An O(n) algorithm with a huge constant can be slower than O(n log n) on small inputs — but on n = 10⁵ the growth rate wins.

## Counting from code

✍️ A single loop over n elements doing O(1) work each → O(n).
✍️ Two nested loops over n → O(n²). A loop inside a loop where the inner runs `i` times → 1 + 2 + … + n = n(n+1)/2 → still O(n²).
✍️ A loop that halves (or doubles) a variable each step → O(log n).
✍️ Sequential blocks add: O(n) + O(n log n) = O(n log n) (keep the biggest).
✍️ Nested blocks multiply: a loop of n calling an O(log n) operation → O(n log n).
✍️ Library calls count: `Arrays.sort` is O(n log n); `HashMap` lookup is O(1) average; `TreeMap` lookup is O(log n); `s.substring(i, j)` is O(len); `vector.erase(begin())` is O(n).

## The common complexities, ranked

✍️ O(1) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²) < O(n³) < O(2ⁿ) < O(n!)

| n = | log n | n log n | n² | 2ⁿ |
|---|---|---|---|---|
| 10 | 3 | 33 | 100 | 1,024 |
| 1,000 | 10 | 10⁴ | 10⁶ | astronomical |
| 10⁵ | 17 | 1.7·10⁶ | 10¹⁰ (too slow) | — |

## The dominant-term rule

✍️ Drop constants and lower-order terms: 3n² + 5n + 100 → O(n²). 2n → O(n).
✍️ But keep **different variables** separate: two strings of lengths n and m compared character by character → O(n·m), not O(n²).
- "O(n + m)" is common for problems with two inputs; do not collapse it to O(n) unless one is bounded by the other.

## Hidden costs beginners miss

✍️ Passing a `vector` or `string` **by value** copies it: O(n) per call. In Java, arrays and objects are passed by reference (the reference is copied), so no deep copy happens.
✍️ String concatenation in a loop `s = s + c` is O(length) each time → O(n²) total. Use a `StringBuilder` and `append`.
✍️ Counting matches in a `List` by scanning is O(n), not O(1).
- Recursion's cost is (number of calls) × (work per call), not "one call" — see [[rec-recursion-tree-and-cost]].

## What interviewers probe

- "What is the time and space complexity?" — always give both, and say *why* in one line ("one pass, each element inserted and looked up once").
- "Is that average or worst case?" — hash maps are O(1) average, O(n) worst; quicksort is O(n log n) average, O(n²) worst.
- "Can you do better?" — first state what the constraints require; if you are already at the lower bound (you must read every element → Ω(n)), say so.
