# The pattern decision tree — from keywords and constraints to a technique

> The master map to read before every mock OA: which words, constraints and shapes in a problem point to which pattern, with the page to read for each.

## Start from the constraints

✍️ n ≤ 12 → permutations/backtracking ([[bt-permutations-used-array]]). n ≤ 20 → subsets/bitmask ([[bt-pick-or-skip]], [[dp-bitmask]]).
✍️ n ≤ 500 → O(n³) ok: interval DP, Floyd–Warshall, triple loops.
✍️ n ≤ 5000 → O(n²) ok: 2D DP (LCS, edit distance), all pairs.
✍️ n ≤ 2·10⁵ → O(n log n) or O(n): sorting, heaps, binary search, two pointers, hashing, windows, prefix sums, greedy.
✍️ Answer range up to 10⁹ with a yes/no check → binary search on the answer ([[bs-on-answer]]).

## Then the shape of the input

✍️ **Sorted array** → binary search ([[bs-classic-and-invariants]]) or two pointers ([[tp-opposite-ends]]).
✍️ **Unsorted array, find pairs/complements** → hash map ([[hash-complement-lookup]]).
✍️ **Contiguous subarray / substring** → sliding window if all values ≥ 0 or the condition is monotone ([[sw-variable-window]]); prefix sum + hash map if negatives or exact sums ([[ps-prefix-sum-hashmap]]); Kadane for max sum ([[kad-kadane]]).
✍️ **Linked list** → dummy head, fast/slow pointers, reversal ([[ll-fast-slow]]).
✍️ **Tree** → DFS returning values bottom-up ([[tree-bottom-up-return-values]]) or BFS by levels ([[tree-bfs-level-order]]).
✍️ **Grid** → treat cells as graph nodes: DFS/BFS ([[graph-grid-as-graph]]); shortest steps → BFS; paths counting/min cost moving right/down → grid DP ([[dp-grid-paths]]).
✍️ **Pairs of (a, b) dependencies** → graph; ordering → topological sort ([[graph-topological-sort]]).
✍️ **Intervals** → sort by start (merging) or by end (max non-overlapping) ([[gr-interval-sort-and-merge]]).
✍️ **Strings, dictionary of words, prefixes** → trie ([[trie-structure-and-ops]]).

## Then the words in the question

✍️ "k-th largest / top k / k closest" → heap of size k ([[heap-top-k]]).
✍️ "next greater / previous smaller / span" → monotonic stack ([[stq-monotonic-stack]]).
✍️ "max/min in every window of size k" → monotonic deque ([[stq-monotonic-deque]]).
✍️ "all combinations / all subsets / all permutations / generate all" → backtracking.
✍️ "number of ways", "minimum cost", "is it possible" with choices at each step → DP ([[dp-what-dp-is]]).
✍️ "minimum number of steps / moves" in an unweighted space → BFS ([[graph-bfs]]).
✍️ "shortest path with weights" → Dijkstra ([[graph-dijkstra]]); with at most k edges → Bellman–Ford ([[graph-bellman-ford-and-k-stops]]).
✍️ "connected / same group / merge accounts / redundant edge" → union-find ([[graph-dsu]]).
✍️ "majority / appears more than n/2" → Boyer–Moore ([[hash-boyer-moore-voting]]).
✍️ "every element appears twice except one" → XOR ([[bits-xor-tricks]]).
✍️ "minimise the maximum" / "maximise the minimum" → binary search on the answer.
✍️ "longest/shortest substring with at most/at least …" → variable sliding window.

## If nothing matches

✍️ Write the brute force, then run the unlock questions in [[meta-bottleneck-method#unlock-questions]].
- Look for a hidden sorted order: can you sort without breaking the problem? (Intervals, meetings, pairs.)
- Look for a hidden graph: are there "things" and "relations between things"?
- Look for a hidden prefix: does "something about the first i elements" help answer about element i?
