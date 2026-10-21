# When a sliding window works — and when it breaks

> Windows need a monotone condition: shrinking a valid window keeps it valid. Negative numbers in sum problems break this, which is why prefix sums are needed there.

## The rule

✍️ A variable window is correct only if: **extending a window can only make it "more" of something, and shrinking can only make it "less"** — so validity changes in one direction as l or r moves.
✍️ With all values ≥ 0: adding an element never decreases the sum; removing never increases it. Sum conditions are monotone → windows work.
✍️ With negative values: adding an element can decrease the sum. A too-large window might become valid by growing. The pointer logic "shrink when too big" is no longer safe.

## The counterexample to remember

✍️ `a = [1, −1, 1]`, k = 1. Subarrays with sum 1: [1], [1, −1, 1], [1] → **3**. A window that shrinks whenever the sum exceeds k never considers the full array correctly and misses cases. Prefix sum + map counts all 3.

## Decision

✍️ Sum / count condition and all values non-negative → sliding window.
✍️ Exact sum or values may be negative → prefix sum + hash map.
✍️ Count / distinct conditions on characters → sliding window (counts are never negative).
