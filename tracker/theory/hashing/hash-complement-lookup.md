# Complement lookup — store what you have seen, look up what you need

> For each element compute the partner it needs, ask a hash map whether that partner has already appeared, then record the element. Turns pair search from O(n²) into O(n).

## Idea

✍️ Pair problems ask: does some earlier element `y` satisfy a relation with the current `x` (e.g. `x + y = target`)?
✍️ Solve the relation for `y`: `y = target − x`. That `y` is the **complement**. Instead of searching for it, keep every element seen so far in a hash map and ask "is `y` there?" in O(1).
✍️ Reframe: you are not looking for pairs; you are walking once and asking each element "has your partner already walked past?"

## Recognise it

✍️ "two numbers that add up to / differ by / multiply to …", "pair with …", "exists i < j such that …".
✍️ Input is **not sorted** (if it is sorted and you need O(1) space, use two pointers instead: [[tp-opposite-ends]]).
✍️ Brute force is two nested loops over pairs.

## Brute force → complement lookup

Brute force: for every i, for every j > i, check `a[i] + a[j] == target`. O(n²).
✍️ Bottleneck: the inner loop. Its job: "for this `a[i]`, search the rest of the array for the value `target − a[i]`".
✍️ Waste: it searches for one specific, known value. A known value can be looked up in O(1) if it has been stored in a hash map.
Better (two-pass): put every value → index in a map, then for each i look up `target − a[i]` (but make sure it is not i itself).
✍️ Optimal (one-pass): look up first, insert after. Only earlier elements are in the map, so an element can never pair with itself, and the first pair found is returned immediately.
>> detour hash-table-internals#why-o1 | Why a hash-map lookup is O(1) — and when it is not | 3 min

## The order rule: check before insert

✍️ Always **query before inserting** the current element.
✍️ If you insert first, `x` can match itself when `target = 2x` (e.g. `[3, 2, 4]`, target 6 would wrongly return [0, 0]).
✍️ Querying first also handles genuine duplicates correctly: `[3, 3]`, target 6 → at i = 1, the map already holds the first 3 → returns [0, 1].

## Template

```java
int[] twoSum(int[] a, int target) {
    Map<Integer,Integer> seen = new HashMap<>();  // value to index
    for (int i = 0; i < a.length; i++) {
        int need = target - a[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(a[i], i);                    // insert AFTER the check
    }
    return new int[]{};
}
```

## Variations

- Count pairs instead of finding one: map stores value → **count**; add `count[need]` to the answer at each step (LeetCode 1512 counts equal pairs: need = x itself).
- "Two equal values within distance k": map stores value → **last index**; check `i − last[x] ≤ k` (LeetCode 219).
- Contains duplicate: complement is the value itself → a set is enough (LeetCode 217).
- Subarray sums: the "element" is a prefix sum and the complement is `prefix − k` ([[ps-prefix-sum-hashmap]]).
- Sorted input → two pointers, O(1) space ([[tp-opposite-ends]]).

## Pitfalls

✍️ Inserting before checking → self-pairing bug (see above).
✍️ Storing index when you need count (or vice versa). Decide what the map value is from what the question asks: indices → index; number of pairs → count.
✍️ `target − a[i]` can overflow in variants with large values; use `long`.

## Complexity

O(n) time average (one lookup and one insert per element). O(n) space for the map. The trade: brute force is O(n²) time and O(1) space.

## Interview follow-ups

- "The array is sorted — can you use O(1) space?" → two pointers from both ends.
- "Return all unique pairs" → sort + two pointers with duplicate skipping ([[tp-skip-duplicates]]).
- "What if the data is a stream you cannot store?" → in general impossible; with a bounded value range use a fixed-size presence array.
