# Choosing between array, HashMap and TreeMap

> A decision rule for picking the counting/lookup container, with speed, order and key-type trade-offs.

## The rule

✍️ Keys are small integers in a known range (letters, digits, values ≤ 10⁶) → **plain array** (`int[] cnt = new int[26]`, `int[] cnt = new int[maxV + 1]`). Fastest, O(1) true worst case.
✍️ Keys are arbitrary (large ints, strings), order does not matter → **HashMap / HashSet**. O(1) average, O(log n) worst once a hot bucket treeifies.
✍️ You need sorted order, min/max, or ceiling/floor → **TreeMap / TreeSet**. O(log n).
✍️ Keys are composite (a pair of ints) and you do not want to hand-roll a hash → use a key type with content-based `equals`/`hashCode` (a `List<Integer>` or a small `record`), or encode the pair into a `long`.

## Side by side

| | int[] | HashMap | TreeMap |
|---|---|---|---|
| lookup | O(1) | O(1) avg, O(log n) worst | O(log n) |
| ordered iteration | yes (by index) | no | yes |
| memory | size of range | ~3–5× entries | ~3× entries |
| key types | small ints | hashable | comparable |

## Example: Valid Anagram

✍️ Lowercase letters only → `int[] cnt = new int[26]`: increment for s, decrement for t, check all zero.
- If the problem allowed Unicode, the range would not be small → `HashMap<Character,Integer>` (the official follow-up of LeetCode 242).
