# Tracker export

Java reference solutions and theory from the DSA plan in the placement tracker.

## Problems

| Day | Problem | Difficulty | Siblings |
|---|---|---|---|
| 1 | [Running Sum of 1d Array](problems/day01-01-running-sum-of-1d-array/) | Easy | 3 |
| 1 | [Max Consecutive Ones](problems/day01-02-max-consecutive-ones/) | Easy | 3 |
| 1 | [Move Zeroes](problems/day01-03-move-zeroes/) | Easy | 3 |
| 1 | [Remove Duplicates from Sorted Array](problems/day01-04-remove-duplicates-from-sorted-array/) | Easy | 3 |
| 2 | [Two Sum](problems/day02-01-two-sum/) | Easy | 3 |
| 2 | [Valid Anagram](problems/day02-02-valid-anagram/) | Easy | 3 |
| 2 | [Majority Element](problems/day02-03-majority-element/) | Easy | 3 |
| 2 | [Longest Consecutive Sequence](problems/day02-04-longest-consecutive-sequence/) | Medium | 3 |
| 3 | [Two Sum II - Input Array Is Sorted](problems/day03-01-two-sum-ii-input-array-is-sorted/) | Medium | 3 |
| 3 | [Valid Palindrome](problems/day03-02-valid-palindrome/) | Easy | 3 |
| 3 | [3Sum](problems/day03-03-3sum/) | Medium | 3 |
| 3 | [Container With Most Water](problems/day03-04-container-with-most-water/) | Medium | 3 |
| 4 | [Range Sum Query - Immutable](problems/day04-01-range-sum-query-immutable/) | Easy | 3 |
| 4 | [Subarray Sum Equals K](problems/day04-02-subarray-sum-equals-k/) | Medium | 3 |
| 4 | [Maximum Subarray](problems/day04-03-maximum-subarray/) | Medium | 3 |
| 4 | [Best Time to Buy and Sell Stock](problems/day04-04-best-time-to-buy-and-sell-stock/) | Easy | 3 |
| 5 | [Maximum Average Subarray I](problems/day05-01-maximum-average-subarray-i/) | Easy | 3 |
| 5 | [Longest Substring Without Repeating Characters](problems/day05-02-longest-substring-without-repeating-characters/) | Medium | 3 |
| 5 | [Longest Repeating Character Replacement](problems/day05-03-longest-repeating-character-replacement/) | Medium | 3 |
| 5 | [Max Consecutive Ones III](problems/day05-04-max-consecutive-ones-iii/) | Medium | 3 |

## Theory

### arrays

- [Other in-place array tricks](theory/arrays/arr-in-place-tricks.md)
- [Read pointer and write pointer — in-place compaction](theory/arrays/arr-read-write-pointer.md)
- [Single pass with running state](theory/arrays/arr-single-pass-running-state.md)

### backtracking

- [Avoiding duplicate results in backtracking](theory/backtracking/bt-dedup-sorted-skip.md)
- [Backtracking II — choosing the next element with a for-loop (combinations)](theory/backtracking/bt-for-loop-choice.md)
- [Backtracking on a grid (Word Search)](theory/backtracking/bt-grid-backtracking.md)
- [Backtracking III — permutations with a used array](theory/backtracking/bt-permutations-used-array.md)
- [Backtracking I — pick or skip (subsets)](theory/backtracking/bt-pick-or-skip.md)
- [Pruning — cutting branches that cannot succeed](theory/backtracking/bt-pruning.md)

### binary-search

- [Binary search — the invariant that makes it correct](theory/binary-search/bs-classic-and-invariants.md)
- [lowerBound and upperBound — first ≥ and first >](theory/binary-search/bs-lower-upper-bound.md)
- [The "first true" template — one binary search for everything](theory/binary-search/bs-off-by-one-templates.md)
- [Binary search on the answer](theory/binary-search/bs-on-answer.md)
- [Peaks and unimodal arrays](theory/binary-search/bs-peak-and-unimodal.md)
- [Binary search on rotated sorted arrays](theory/binary-search/bs-rotated-arrays.md)

### binary-trees

- [Treating a tree as a graph — parent pointers](theory/binary-trees/tree-as-graph-parent-map.md)
- [BFS level order — processing a tree level by level](theory/binary-trees/tree-bfs-level-order.md)
- [Bottom-up recursion — returning answers from subtrees](theory/binary-trees/tree-bottom-up-return-values.md)
- [Building a tree from preorder and inorder](theory/binary-trees/tree-construction-from-traversals.md)
- [DFS traversals — preorder, inorder, postorder](theory/binary-trees/tree-dfs-traversals.md)
- [Return one thing, record another — the global answer pattern](theory/binary-trees/tree-global-answer-pattern.md)
- [Iterative traversals with an explicit stack](theory/binary-trees/tree-iterative-traversals.md)
- [Lowest common ancestor in a binary tree](theory/binary-trees/tree-lca.md)
- [Serialising and deserialising a tree (recognition level)](theory/binary-trees/tree-serialize.md)
- [Binary trees — terms and representation](theory/binary-trees/tree-terminology-and-representation.md)
- [Top-down recursion — passing information down](theory/binary-trees/tree-top-down-parameters.md)

### bits

- [Binary numbers and bitwise operators](theory/bits/bits-binary-and-operators.md)
- [Common bit tricks](theory/bits/bits-common-tricks.md)
- [Counting bits for every number — a bit DP](theory/bits/bits-counting-bits-dp.md)
- [XOR tricks](theory/bits/bits-xor-tricks.md)

### bst

- [Inorder of a BST is sorted](theory/bst/bst-inorder-sorted-property.md)
- [The BST invariant and validating it](theory/bst/bst-invariant-and-validation.md)
- [Using BST order — LCA and range queries](theory/bst/bst-lca-and-range.md)
- [BST search, insert and delete](theory/bst/bst-search-insert-delete.md)

### complexity

- [Amortised analysis — why "sometimes expensive" can still be O(1)](theory/complexity/cx-amortised-analysis.md)
- [Big-O — counting work the way interviewers do](theory/complexity/cx-big-o.md)
- [Reading n — converting constraints into a target complexity](theory/complexity/cx-constraints-to-target.md)
- [Complexity of recursive code](theory/complexity/cx-recursion-complexity.md)
- [Space complexity and "in-place"](theory/complexity/cx-space-and-in-place.md)

### cpp

- [Choosing between array, HashMap and TreeMap](theory/cpp/cpp-container-choice.md)
- [Integer overflow — int, long and where sums blow up](theory/cpp/cpp-integer-overflow.md)
- [The Arrays / Collections / Stream helpers worth knowing](theory/cpp/cpp-iterators-and-algorithms.md)
- [TreeMap and TreeSet — the ordered containers](theory/cpp/cpp-map-set-ordered.md)
- [Pairs and tuples in Java: int[], Map.Entry and records](theory/cpp/cpp-pair-and-tuple.md)
- [How Java passes arguments: references and copies](theory/cpp/cpp-pass-by-reference-and-copies.md)
- [PriorityQueue — Java's heap](theory/cpp/cpp-priority-queue.md)
- [Recursion depth and stack limits](theory/cpp/cpp-recursion-stack-limits.md)
- [Sorting and custom comparators](theory/cpp/cpp-sort-and-comparators.md)
- [Stack, queue and deque in Java](theory/cpp/cpp-stack-queue-deque.md)
- [Java String — characters, indexing and the costs that bite](theory/cpp/cpp-string.md)
- [HashMap and HashSet — API and gotchas](theory/cpp/cpp-unordered-map-set.md)
- [Arrays and ArrayList — the containers you will use in every problem](theory/cpp/cpp-vector.md)

### dp

- [0/1 knapsack — each item at most once](theory/dp/dp-0-1-knapsack.md)
- [1D DP on a line — take or skip, ways to reach](theory/dp/dp-1d-linear.md)
- [Bitmask DP (recognition level)](theory/dp/dp-bitmask.md)
- [Counting DP vs optimising DP — and loop order](theory/dp/dp-counting-vs-optimising.md)
- [Edit distance](theory/dp/dp-edit-distance.md)
- [Grid DP — paths moving right and down](theory/dp/dp-grid-paths.md)
- [Interval DP (recognition level)](theory/dp/dp-interval.md)
- [Two-string DP — longest common subsequence](theory/dp/dp-lcs-two-strings.md)
- [Longest increasing subsequence](theory/dp/dp-lis.md)
- [Memoisation vs tabulation](theory/dp/dp-memo-vs-tabulation.md)
- [Space optimisation — keeping only the rows you need](theory/dp/dp-space-optimisation.md)
- [Designing the DP state](theory/dp/dp-state-design.md)
- [State machine DP — the stock problems](theory/dp/dp-state-machine.md)
- [Partition DP on strings — word break](theory/dp/dp-string-partition.md)
- [Unbounded knapsack — coins you can reuse](theory/dp/dp-unbounded-knapsack.md)
- [What dynamic programming is](theory/dp/dp-what-dp-is.md)

### full-stack

- [Auth: sessions vs JWT](theory/full-stack/fs-auth-sessions-vs-jwt.md)
- [Frontend rendering & state](theory/full-stack/fs-frontend-rendering-and-state.md)
- [HTTP & REST](theory/full-stack/fs-http-and-rest.md)
- [ORM & data access](theory/full-stack/fs-orm-and-data-access.md)
- [Web security basics](theory/full-stack/fs-security-basics.md)

### graphs

- [Bellman–Ford and shortest paths with at most k edges](theory/graphs/graph-bellman-ford-and-k-stops.md)
- [Breadth-first search — shortest paths in unweighted graphs](theory/graphs/graph-bfs.md)
- [Bipartite check — two-colouring](theory/graphs/graph-bipartite-colouring.md)
- [Connected components](theory/graphs/graph-connected-components.md)
- [Cycle detection — undirected and directed](theory/graphs/graph-cycle-detection.md)
- [Depth-first search on graphs](theory/graphs/graph-dfs.md)
- [Dijkstra's algorithm — shortest paths with non-negative weights](theory/graphs/graph-dijkstra.md)
- [Union-find (disjoint set union)](theory/graphs/graph-dsu.md)
- [Floyd–Warshall — all-pairs shortest paths (recognition level)](theory/graphs/graph-floyd-warshall.md)
- [Grids as graphs — flood fill](theory/graphs/graph-grid-as-graph.md)
- [Implicit graphs — BFS over states](theory/graphs/graph-implicit-graphs.md)
- [Minimum spanning tree — Kruskal and Prim (recognition level)](theory/graphs/graph-mst.md)
- [Multi-source BFS](theory/graphs/graph-multi-source-bfs.md)
- [Representing graphs — edge lists, adjacency lists, matrices](theory/graphs/graph-representations.md)
- [Bridges and articulation points — Tarjan (recognition level)](theory/graphs/graph-tarjan-bridges.md)
- [Topological sort — ordering with dependencies](theory/graphs/graph-topological-sort.md)

### greedy

- [Greedy with running balance (gas station, parentheses with wildcards)](theory/greedy/gr-balance-counting.md)
- [Greedy reach — Jump Game I and II](theory/greedy/gr-reach-and-jumps.md)
- [Greedy algorithms and how to trust them](theory/greedy/gr-what-greedy-is-and-proofs.md)

### hashing

- [Boyer–Moore voting — the majority element in O(1) space](theory/hashing/hash-boyer-moore-voting.md)
- [Collisions — chaining vs open addressing](theory/hashing/hash-collisions.md)
- [Complement lookup — store what you have seen, look up what you need](theory/hashing/hash-complement-lookup.md)
- [Grouping by a derived key](theory/hashing/hash-derived-keys.md)
- [Frequency counting](theory/hashing/hash-frequency-counting.md)
- [Load factor, rehashing and reserve](theory/hashing/hash-load-factor-and-rehashing.md)
- [Hash set membership and the start-of-run trick](theory/hashing/hash-set-runs.md)
- [How a hash table works inside](theory/hashing/hash-table-internals.md)

### heaps

- [How a binary heap works](theory/heaps/heap-binary-heap-internals.md)
- [K-way merge with a heap](theory/heaps/heap-k-way-merge.md)
- [Top k with a heap of size k](theory/heaps/heap-top-k.md)
- [Two heaps — running median](theory/heaps/heap-two-heaps-median.md)
- [Heap vs quickselect vs sort for k-th element](theory/heaps/heap-vs-quickselect.md)

### intervals

- [Intervals II — sort by end, keep the earliest finisher](theory/intervals/gr-interval-scheduling.md)
- [Intervals I — sort by start and merge](theory/intervals/gr-interval-sort-and-merge.md)

### kadane

- [Kadane's algorithm — maximum subarray sum](theory/kadane/kad-kadane.md)
- [Maximum product subarray — tracking max and min together](theory/kadane/kad-max-product-variant.md)
- [Best partner to the left — min so far](theory/kadane/kad-min-so-far.md)

### linked-list

- [The dummy (sentinel) head](theory/linked-list/ll-dummy-head.md)
- [Fast and slow pointers](theory/linked-list/ll-fast-slow.md)
- [Floyd's cycle algorithm — finding where the cycle starts](theory/linked-list/ll-floyd-cycle-proof.md)
- [Two pointers with a k-node gap](theory/linked-list/ll-k-gap-pointers.md)
- [Merging, splitting and comparing lists](theory/linked-list/ll-merge-and-split.md)
- [Linked list nodes and pointer manipulation](theory/linked-list/ll-node-and-pointers.md)
- [Reversing a linked list](theory/linked-list/ll-reversal.md)

### math

- [GCD, LCM and modular arithmetic](theory/math/math-gcd-and-modular.md)
- [Primes and the sieve of Eratosthenes](theory/math/math-sieve-and-primes.md)

### matrix

- [In-place marking in matrices](theory/matrix/mat-in-place-marking.md)
- [Rotating a matrix — transpose then reverse](theory/matrix/mat-rotate-transpose.md)
- [Spiral order — shrinking boundaries](theory/matrix/mat-spiral-and-layers.md)
- [Matrix traversal and direction arrays](theory/matrix/mat-traversal-and-directions.md)

### meta

- [Analysing a problem before you think of an algorithm](theory/meta/meta-analyse-a-problem.md)
- [The bottleneck method — getting from brute force to optimal](theory/meta/meta-bottleneck-method.md)
- [Dry runs — tracing variables by hand](theory/meta/meta-dry-run.md)
- [The pattern decision tree — from keywords and constraints to a technique](theory/meta/meta-pattern-decision-tree.md)
- [Writing pseudocode — the 5-slot format](theory/meta/meta-pseudocode-format.md)

### oop

- [Abstraction, abstract classes and interfaces](theory/oop/oop-abstraction-interfaces.md)
- [Classes, objects and what they look like in memory](theory/oop/oop-classes-objects-memory.md)
- [Constructors and object cleanup](theory/oop/oop-constructors-destructors.md)
- [Encapsulation and access control](theory/oop/oop-encapsulation-access.md)

### prefix-sum

- [2D prefix sums — rectangle sums in O(1)](theory/prefix-sum/ps-2d-prefix-sum.md)
- [Prefix sums modulo k](theory/prefix-sum/ps-modular-prefix.md)
- [Prefix and suffix passes — everything except me](theory/prefix-sum/ps-prefix-suffix-passes.md)
- [Prefix sums — any range sum in O(1)](theory/prefix-sum/ps-prefix-sum-basics.md)
- [Prefix sum + hash map — counting subarrays with a given sum](theory/prefix-sum/ps-prefix-sum-hashmap.md)

### recursion

- [Divide and conquer](theory/recursion/rec-divide-and-conquer.md)
- [How recursion works — base case, call stack and the leap of faith](theory/recursion/rec-how-recursion-works.md)
- [The recursion tree — seeing the cost of recursion](theory/recursion/rec-recursion-tree-and-cost.md)

### sliding-window

- [Exactly k = at most k minus at most (k − 1)](theory/sliding-window/sw-at-most-k-trick.md)
- [Fixed-size sliding window](theory/sliding-window/sw-fixed-window.md)
- [Windows with a frequency map](theory/sliding-window/sw-frequency-map-window.md)
- [When a sliding window works — and when it breaks](theory/sliding-window/sw-monotonicity-requirement.md)
- [Variable-size sliding window — expand right, shrink left](theory/sliding-window/sw-variable-window.md)

### sorting

- [Counting sort and bucket ideas](theory/sorting/sort-counting-sort.md)
- [Dutch national flag — three-way partition in one pass](theory/sorting/sort-dutch-national-flag.md)
- [Merge sort](theory/sorting/sort-merge-sort.md)
- [Quick sort, partitioning and quickselect](theory/sorting/sort-quick-sort-and-pivots.md)
- [Stability and the n log n lower bound](theory/sorting/sort-stability-and-bounds.md)

### stack-queue

- [Designing with an auxiliary stack (Min Stack)](theory/stack-queue/stq-design-with-auxiliary.md)
- [Evaluating expressions with stacks](theory/stack-queue/stq-expression-evaluation.md)
- [Largest rectangle in a histogram](theory/stack-queue/stq-histogram-area.md)
- [Monotonic deque — maximum of every window](theory/stack-queue/stq-monotonic-deque.md)
- [Monotonic stack — next greater and previous smaller](theory/stack-queue/stq-monotonic-stack.md)
- [Queue from two stacks — amortised O(1)](theory/stack-queue/stq-queue-via-stacks-amortised.md)
- [Stacks — last in, first out, and bracket matching](theory/stack-queue/stq-stack-basics-and-matching.md)

### strings

- [Anagram windows — finding permutations inside a string](theory/strings/str-anagram-window.md)
- [Characters as numbers — counting, mapping and comparing](theory/strings/str-char-arithmetic-and-counting.md)
- [Expand around center — longest palindromic substring](theory/strings/str-expand-around-center.md)
- [KMP and the prefix function (recognition level)](theory/strings/str-kmp-prefix-function.md)
- [Palindrome checks](theory/strings/str-palindrome-checks.md)
- [Rolling hash (recognition level)](theory/strings/str-rolling-hash.md)
- [Splitting into words and reversing](theory/strings/str-tokenising-and-reversal.md)

### system-design

- [Availability vs consistency — CAP and PACELC](theory/system-design/sd-availability-and-consistency.md)
- [Caching strategies](theory/system-design/sd-caching-strategies.md)
- [Client–server basics and how systems scale](theory/system-design/sd-client-server-and-scaling.md)
- [Database replication and sharding](theory/system-design/sd-db-replication-and-sharding.md)
- [A framework for the design interview](theory/system-design/sd-design-framework.md)
- [Load balancing and proxies](theory/system-design/sd-load-balancing-and-proxies.md)
- [Rate limiting](theory/system-design/sd-rate-limiting.md)
- [SQL vs NoSQL](theory/system-design/sd-sql-vs-nosql.md)

### tries

- [Tries — prefix trees](theory/tries/trie-structure-and-ops.md)
- [Trie search with wildcards (DFS over children)](theory/tries/trie-wildcard-search-dfs.md)

### two-pointers

- [Fix one, two-pointer the rest (3Sum, 4Sum)](theory/two-pointers/tp-fix-one-k-sum.md)
- [Two pointers from opposite ends](theory/two-pointers/tp-opposite-ends.md)
- [Skipping duplicates in sorted scans](theory/two-pointers/tp-skip-duplicates.md)
- [Why moving a pointer is safe — the exchange argument](theory/two-pointers/tp-why-discarding-is-safe.md)
