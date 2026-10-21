# Java String — characters, indexing and the costs that bite

> Strings are immutable, char arithmetic, building with StringBuilder, substring cost and index convention, and conversions.

## Basics

✍️ A `String` is **immutable** — you cannot assign to `s.charAt(i)`. Read with `s.charAt(i)`, `s.length()`; to edit, copy to `char[] cs = s.toCharArray()` (write `cs[i]`, then `new String(cs)`) or use a `StringBuilder`.
✍️ Characters are small integers. `'a'` is 97, `'A'` is 65, `'0'` is 48. So `s.charAt(i) - 'a'` maps 'a'..'z' to 0..25, and `s.charAt(i) - '0'` maps '0'..'9' to 0..9.

```java
String s = "hello";
int[] cnt = new int[26];
for (char c : s.toCharArray()) cnt[c - 'a']++;   // frequency of each letter
char up = Character.toUpperCase(s.charAt(0));    // 'H'
boolean letter = Character.isLetter(c), digit = Character.isDigit(c), alnum = Character.isLetterOrDigit(c);
char low = Character.toLowerCase(c);
```

## Building strings efficiently

✍️ Use a `StringBuilder`: `sb.append(c);` is amortised O(1). Call `sb.toString()` once at the end.
✍️ `s = s + c;` builds a brand-new String each time because String is immutable → O(length) → O(n²) in a loop. Never concatenate in a loop.
✍️ Build forwards then `sb.reverse()` rather than inserting at the front (`sb.insert(0, …)` is O(n)).

## substring and comparisons

✍️ `s.substring(i, j)` returns the chars at [i, j) — the second argument is an **end index, not a length** (the opposite of C++'s `substr(pos, len)`). It allocates a new String → O(j − i). Calling it inside a loop over all positions is O(n²) or worse.
✍️ Compare with `a.equals(b)` (O(min length)); never use `==`, which compares references. A String's `hashCode()` is computed once and cached, so repeated map lookups don't re-hash.
- `s.indexOf(t)` is O(n·m) in the worst case — fine for small inputs, not for 10⁵.

## Conversions

- `String.valueOf(123)` / `Integer.toString(123)` → `"123"`; `Integer.parseInt("123")` → 123; `Long.parseLong` for long.
- `"x".repeat(n)` → n copies of "x"; `new String(charArray)` from a `char[]`.
- `s.split("\\s+")` splits on whitespace, or stream tokens via `new Scanner(s)` (see [[str-tokenising-and-reversal]]).

## Pitfalls

✍️ `char` arithmetic on uppercase vs lowercase: `'A' - 'a'` is negative. Normalise with `Character.toLowerCase` first when the problem ignores case.
- `Character.isLetter`/`toLowerCase` have `int` (code-point) overloads; for the full Unicode range iterate with `codePointAt`, but LeetCode inputs are ASCII, so the `char` versions are fine.
