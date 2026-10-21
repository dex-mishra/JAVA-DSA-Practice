# Heap vs quickselect vs sort for k-th element

> When to choose each approach for k-th largest, and what to say about their worst cases.

## Comparison

| Method | Time | Space | Notes |
|---|---|---|---|
| sort | O(n log n) | O(1)–O(n) | simplest, fine for n ≤ 10⁵ |
| min-heap of size k | O(n log k) | O(k) | works on streams |
| quickselect | O(n) avg, O(n²) worst | O(1) | modifies the array; randomise the pivot |
| counting/buckets | O(n + range) | O(range) | only for small value ranges |

## What to say in an interview

✍️ Start with sorting, then offer the heap (better when k ≪ n or data streams in), then quickselect for O(n) average, mentioning the worst case and the random pivot fix.
