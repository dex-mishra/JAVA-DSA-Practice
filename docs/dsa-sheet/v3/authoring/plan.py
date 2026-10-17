"""Generates PLAN.json and MOCK-SCHEDULE.json for the v3 30-day beginner sheet."""
import json, random, datetime, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs/v3"
HERE = os.path.dirname(os.path.abspath(__file__))
OLD = json.load(open(os.path.join(HERE, "old_index_by_slug.json")))
OLD_SPEC = json.load(open(os.path.join(HERE, "old_spec.json")))

START = datetime.date(2026, 10, 18)

# day: (cluster, title, [ (role, lc_id, slug, title, difficulty, topic, pattern, [theory page ids]) ], skims)
D = {}
def day(n, cluster, title, problems, skims=()):
    D[n] = dict(cluster=cluster, title=title, problems=problems, skims=list(skims))

C1, C2, C3, C4, C5, C6, C7 = ("arrays-hashing", "search-strings", "linear-ds",
                             "recursion-greedy-heaps", "trees", "graphs", "dp")

day(1, C1, "Array traversal and in-place writes", [
 ("LEARN", 1480, "running-sum-of-1d-array", "Running Sum of 1d Array", "Easy", "arrays", "running-state", ["arr-single-pass-running-state", "cx-big-o", "cpp-vector"]),
 ("APPLY", 485, "max-consecutive-ones", "Max Consecutive Ones", "Easy", "arrays", "running-state-reset", ["arr-single-pass-running-state"]),
 ("LEARN", 283, "move-zeroes", "Move Zeroes", "Easy", "arrays", "read-write-pointer", ["arr-read-write-pointer", "cx-space-and-in-place"]),
 ("APPLY", 26, "remove-duplicates-from-sorted-array", "Remove Duplicates from Sorted Array", "Easy", "arrays", "read-write-pointer", ["arr-read-write-pointer"]),
])
day(2, C1, "Hashing: remember what you have seen", [
 ("LEARN", 1, "two-sum", "Two Sum", "Easy", "hashing", "hash-complement", ["hash-complement-lookup", "cpp-unordered-map-set"]),
 ("APPLY", 242, "valid-anagram", "Valid Anagram", "Easy", "hashing", "frequency-count", ["hash-frequency-counting", "cpp-container-choice"]),
 ("TWIST", 169, "majority-element", "Majority Element", "Easy", "hashing", "boyer-moore-voting", ["hash-frequency-counting", "hash-boyer-moore-voting"]),
 ("DISGUISE", 128, "longest-consecutive-sequence", "Longest Consecutive Sequence", "Medium", "hashing", "set-start-of-run", ["hash-set-runs"]),
])
day(3, C1, "Two pointers", [
 ("LEARN", 167, "two-sum-ii-input-array-is-sorted", "Two Sum II - Input Array Is Sorted", "Medium", "two-pointers", "opposite-ends", ["tp-opposite-ends", "tp-why-discarding-is-safe"]),
 ("APPLY", 125, "valid-palindrome", "Valid Palindrome", "Easy", "two-pointers", "opposite-ends", ["tp-opposite-ends", "cpp-string"]),
 ("TWIST", 15, "3sum", "3Sum", "Medium", "two-pointers", "fix-one-two-pointers", ["tp-fix-one-k-sum", "tp-skip-duplicates", "cpp-sort-and-comparators"]),
 ("DISGUISE", 11, "container-with-most-water", "Container With Most Water", "Medium", "two-pointers", "opposite-ends-greedy-shrink", ["tp-why-discarding-is-safe"]),
])
day(4, C1, "Prefix sums and Kadane", [
 ("LEARN", 303, "range-sum-query-immutable", "Range Sum Query - Immutable", "Easy", "prefix-sum", "prefix-sum", ["ps-prefix-sum-basics"]),
 ("TWIST", 560, "subarray-sum-equals-k", "Subarray Sum Equals K", "Medium", "prefix-sum", "prefix-sum-hashmap", ["ps-prefix-sum-hashmap", "sw-monotonicity-requirement"]),
 ("LEARN", 53, "maximum-subarray", "Maximum Subarray", "Medium", "kadane", "kadane", ["kad-kadane"]),
 ("APPLY", 121, "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy", "kadane", "min-so-far", ["kad-min-so-far"]),
])
day(5, C1, "Sliding window", [
 ("LEARN", 643, "maximum-average-subarray-i", "Maximum Average Subarray I", "Easy", "sliding-window", "fixed-window", ["sw-fixed-window"]),
 ("APPLY", 3, "longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "Medium", "sliding-window", "variable-window", ["sw-variable-window", "sw-frequency-map-window"]),
 ("TWIST", 424, "longest-repeating-character-replacement", "Longest Repeating Character Replacement", "Medium", "sliding-window", "variable-window-budget", ["sw-variable-window", "sw-frequency-map-window"]),
 ("DISGUISE", 1004, "max-consecutive-ones-iii", "Max Consecutive Ones III", "Medium", "sliding-window", "variable-window-budget", ["sw-variable-window"]),
])
day(6, C2, "Binary search on sorted data", [
 ("LEARN", 704, "binary-search", "Binary Search", "Easy", "binary-search", "classic-binary-search", ["bs-classic-and-invariants"]),
 ("APPLY", 35, "search-insert-position", "Search Insert Position", "Easy", "binary-search", "lower-bound", ["bs-lower-upper-bound"]),
 ("TWIST", 34, "find-first-and-last-position-of-element-in-sorted-array", "Find First and Last Position of Element in Sorted Array", "Medium", "binary-search", "lower-upper-bound", ["bs-lower-upper-bound", "bs-off-by-one-templates"]),
 ("DISGUISE", 33, "search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "Medium", "binary-search", "rotated-sorted", ["bs-rotated-arrays"]),
])
day(7, C2, "Binary search on the answer", [
 ("LEARN", 875, "koko-eating-bananas", "Koko Eating Bananas", "Medium", "binary-search", "bs-on-answer", ["bs-on-answer"]),
 ("APPLY", 1011, "capacity-to-ship-packages-within-d-days", "Capacity To Ship Packages Within D Days", "Medium", "binary-search", "bs-on-answer", ["bs-on-answer"]),
 ("APPLY", 1482, "minimum-number-of-days-to-make-m-bouquets", "Minimum Number of Days to Make m Bouquets", "Medium", "binary-search", "bs-on-answer", ["bs-on-answer"]),
 ("TWIST", 410, "split-array-largest-sum", "Split Array Largest Sum", "Hard", "binary-search", "bs-on-answer-minimax", ["bs-on-answer"]),
])
day(8, C2, "Strings", [
 ("LEARN", 14, "longest-common-prefix", "Longest Common Prefix", "Easy", "strings", "vertical-scan", ["str-char-arithmetic-and-counting"]),
 ("APPLY", 151, "reverse-words-in-a-string", "Reverse Words in a String", "Medium", "strings", "tokenise", ["str-tokenising-and-reversal"]),
 ("TWIST", 5, "longest-palindromic-substring", "Longest Palindromic Substring", "Medium", "strings", "expand-around-center", ["str-expand-around-center", "str-palindrome-checks"]),
 ("DISGUISE", 438, "find-all-anagrams-in-a-string", "Find All Anagrams in a String", "Medium", "strings", "anagram-window", ["str-anagram-window", "sw-fixed-window"]),
], skims=[(28, "find-the-index-of-the-first-occurrence-in-a-string", "Find the Index of the First Occurrence in a String", "Easy", "str-kmp-prefix-function")])
day(9, C2, "Sorting and matrices", [
 ("LEARN", 912, "sort-an-array", "Sort an Array", "Medium", "sorting", "merge-sort", ["sort-merge-sort", "rec-divide-and-conquer"]),
 ("APPLY", 75, "sort-colors", "Sort Colors", "Medium", "sorting", "dutch-national-flag", ["sort-dutch-national-flag"]),
 ("LEARN", 48, "rotate-image", "Rotate Image", "Medium", "matrix", "transpose-reverse", ["mat-rotate-transpose"]),
 ("APPLY", 54, "spiral-matrix", "Spiral Matrix", "Medium", "matrix", "layer-boundaries", ["mat-spiral-and-layers", "mat-traversal-and-directions"]),
])
day(10, C3, "Linked lists I", [
 ("LEARN", 206, "reverse-linked-list", "Reverse Linked List", "Easy", "linked-list", "pointer-reversal", ["ll-node-and-pointers", "ll-reversal"]),
 ("LEARN", 876, "middle-of-the-linked-list", "Middle of the Linked List", "Easy", "linked-list", "fast-slow", ["ll-fast-slow"]),
 ("APPLY", 21, "merge-two-sorted-lists", "Merge Two Sorted Lists", "Easy", "linked-list", "dummy-head-merge", ["ll-dummy-head", "ll-merge-and-split"]),
 ("TWIST", 19, "remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "Medium", "linked-list", "k-gap-pointers", ["ll-k-gap-pointers", "ll-dummy-head"]),
])
day(11, C3, "Linked lists II", [
 ("APPLY", 141, "linked-list-cycle", "Linked List Cycle", "Easy", "linked-list", "floyd-cycle", ["ll-fast-slow", "ll-floyd-cycle-proof"]),
 ("TWIST", 142, "linked-list-cycle-ii", "Linked List Cycle II", "Medium", "linked-list", "floyd-cycle-entry", ["ll-floyd-cycle-proof"]),
 ("APPLY", 2, "add-two-numbers", "Add Two Numbers", "Medium", "linked-list", "digit-carry", ["ll-dummy-head"]),
 ("DISGUISE", 234, "palindrome-linked-list", "Palindrome Linked List", "Easy", "linked-list", "split-reverse-compare", ["ll-fast-slow", "ll-reversal", "ll-merge-and-split"]),
])
day(12, C3, "Stacks and queues", [
 ("LEARN", 20, "valid-parentheses", "Valid Parentheses", "Easy", "stack-queue", "bracket-matching", ["stq-stack-basics-and-matching", "cpp-stack-queue-deque"]),
 ("APPLY", 155, "min-stack", "Min Stack", "Medium", "stack-queue", "auxiliary-stack", ["stq-design-with-auxiliary"]),
 ("APPLY", 150, "evaluate-reverse-polish-notation", "Evaluate Reverse Polish Notation", "Medium", "stack-queue", "expression-stack", ["stq-expression-evaluation"]),
 ("TWIST", 232, "implement-queue-using-stacks", "Implement Queue using Stacks", "Easy", "stack-queue", "two-stack-queue", ["stq-queue-via-stacks-amortised", "cx-amortised-analysis"]),
])
day(13, C3, "Monotonic stack and deque", [
 ("LEARN", 496, "next-greater-element-i", "Next Greater Element I", "Easy", "stack-queue", "monotonic-stack", ["stq-monotonic-stack"]),
 ("APPLY", 739, "daily-temperatures", "Daily Temperatures", "Medium", "stack-queue", "monotonic-stack", ["stq-monotonic-stack"]),
 ("TWIST", 84, "largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "Hard", "stack-queue", "previous-next-smaller", ["stq-histogram-area", "stq-monotonic-stack"]),
 ("DISGUISE", 239, "sliding-window-maximum", "Sliding Window Maximum", "Hard", "stack-queue", "monotonic-deque", ["stq-monotonic-deque", "sw-fixed-window"]),
])
day(14, C4, "Recursion and subsets", [
 ("LEARN", 50, "powx-n", "Pow(x, n)", "Medium", "recursion", "divide-and-conquer", ["rec-how-recursion-works", "rec-divide-and-conquer"]),
 ("LEARN", 78, "subsets", "Subsets", "Medium", "backtracking", "pick-or-skip", ["bt-pick-or-skip", "rec-recursion-tree-and-cost"]),
 ("APPLY", 22, "generate-parentheses", "Generate Parentheses", "Medium", "backtracking", "constrained-generation", ["bt-pruning", "bt-pick-or-skip"]),
 ("TWIST", 90, "subsets-ii", "Subsets II", "Medium", "backtracking", "dedup-sorted-skip", ["bt-dedup-sorted-skip"]),
])
day(15, C4, "Backtracking", [
 ("LEARN", 46, "permutations", "Permutations", "Medium", "backtracking", "permutations-used", ["bt-permutations-used-array"]),
 ("APPLY", 39, "combination-sum", "Combination Sum", "Medium", "backtracking", "for-loop-choice-reuse", ["bt-for-loop-choice", "bt-pruning"]),
 ("TWIST", 40, "combination-sum-ii", "Combination Sum II", "Medium", "backtracking", "for-loop-choice-dedup", ["bt-for-loop-choice", "bt-dedup-sorted-skip"]),
 ("DISGUISE", 79, "word-search", "Word Search", "Medium", "backtracking", "grid-backtracking", ["bt-grid-backtracking", "mat-traversal-and-directions"]),
], skims=[(51, "n-queens", "N-Queens", "Hard", "bt-pruning")])
day(16, C4, "Greedy and intervals", [
 ("LEARN", 55, "jump-game", "Jump Game", "Medium", "greedy", "max-reach", ["gr-what-greedy-is-and-proofs", "gr-reach-and-jumps"]),
 ("APPLY", 45, "jump-game-ii", "Jump Game II", "Medium", "greedy", "bfs-levels-greedy", ["gr-reach-and-jumps"]),
 ("LEARN", 56, "merge-intervals", "Merge Intervals", "Medium", "intervals", "sort-and-merge", ["gr-interval-sort-and-merge", "cpp-sort-and-comparators"]),
 ("TWIST", 435, "non-overlapping-intervals", "Non-overlapping Intervals", "Medium", "intervals", "earliest-end-greedy", ["gr-interval-scheduling"]),
])
day(17, C4, "Heaps", [
 ("LEARN", 215, "kth-largest-element-in-an-array", "Kth Largest Element in an Array", "Medium", "heaps", "size-k-heap", ["heap-binary-heap-internals", "heap-top-k", "cpp-priority-queue"]),
 ("APPLY", 347, "top-k-frequent-elements", "Top K Frequent Elements", "Medium", "heaps", "frequency-then-top-k", ["heap-top-k", "hash-frequency-counting"]),
 ("TWIST", 23, "merge-k-sorted-lists", "Merge k Sorted Lists", "Hard", "heaps", "k-way-merge", ["heap-k-way-merge"]),
 ("DISGUISE", 295, "find-median-from-data-stream", "Find Median from Data Stream", "Hard", "heaps", "two-heaps", ["heap-two-heaps-median"]),
])
day(18, C5, "Tree traversals", [
 ("LEARN", 94, "binary-tree-inorder-traversal", "Binary Tree Inorder Traversal", "Easy", "binary-trees", "dfs-traversal", ["tree-terminology-and-representation", "tree-dfs-traversals", "tree-iterative-traversals"]),
 ("LEARN", 102, "binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "Medium", "binary-trees", "bfs-levels", ["tree-bfs-level-order"]),
 ("APPLY", 199, "binary-tree-right-side-view", "Binary Tree Right Side View", "Medium", "binary-trees", "bfs-levels", ["tree-bfs-level-order"]),
 ("TWIST", 101, "symmetric-tree", "Symmetric Tree", "Easy", "binary-trees", "paired-recursion", ["tree-dfs-traversals"]),
])
day(19, C5, "Trees: bottom-up", [
 ("LEARN", 104, "maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "Easy", "binary-trees", "bottom-up", ["tree-bottom-up-return-values"]),
 ("APPLY", 543, "diameter-of-binary-tree", "Diameter of Binary Tree", "Easy", "binary-trees", "global-answer", ["tree-global-answer-pattern"]),
 ("APPLY", 110, "balanced-binary-tree", "Balanced Binary Tree", "Easy", "binary-trees", "bottom-up-sentinel", ["tree-bottom-up-return-values"]),
 ("TWIST", 124, "binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "Hard", "binary-trees", "global-answer", ["tree-global-answer-pattern"]),
])
day(20, C5, "Trees: paths, ancestors, construction", [
 ("LEARN", 236, "lowest-common-ancestor-of-a-binary-tree", "Lowest Common Ancestor of a Binary Tree", "Medium", "binary-trees", "lca", ["tree-lca"]),
 ("APPLY", 113, "path-sum-ii", "Path Sum II", "Medium", "binary-trees", "top-down-path", ["tree-top-down-parameters", "bt-pick-or-skip"]),
 ("TWIST", 105, "construct-binary-tree-from-preorder-and-inorder-traversal", "Construct Binary Tree from Preorder and Inorder Traversal", "Medium", "binary-trees", "construct-from-traversals", ["tree-construction-from-traversals"]),
 ("DISGUISE", 863, "all-nodes-distance-k-in-binary-tree", "All Nodes Distance K in Binary Tree", "Medium", "binary-trees", "tree-as-graph", ["tree-as-graph-parent-map", "graph-bfs"]),
], skims=[(297, "serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "Hard", "tree-serialize")])
day(21, C5, "Binary search trees", [
 ("LEARN", 98, "validate-binary-search-tree", "Validate Binary Search Tree", "Medium", "bst", "bst-bounds", ["bst-invariant-and-validation"]),
 ("APPLY", 230, "kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "Medium", "bst", "inorder-sorted", ["bst-inorder-sorted-property"]),
 ("APPLY", 235, "lowest-common-ancestor-of-a-binary-search-tree", "Lowest Common Ancestor of a Binary Search Tree", "Medium", "bst", "bst-split-point", ["bst-lca-and-range"]),
 ("TWIST", 450, "delete-node-in-a-bst", "Delete Node in a BST", "Medium", "bst", "bst-delete", ["bst-search-insert-delete"]),
])
day(22, C6, "Graphs on grids", [
 ("LEARN", 200, "number-of-islands", "Number of Islands", "Medium", "graphs", "grid-flood-fill", ["graph-grid-as-graph", "graph-dfs", "graph-connected-components"]),
 ("APPLY", 695, "max-area-of-island", "Max Area of Island", "Medium", "graphs", "grid-flood-fill", ["graph-grid-as-graph"]),
 ("LEARN", 994, "rotting-oranges", "Rotting Oranges", "Medium", "graphs", "multi-source-bfs", ["graph-bfs", "graph-multi-source-bfs"]),
 ("TWIST", 130, "surrounded-regions", "Surrounded Regions", "Medium", "graphs", "border-flood-fill", ["graph-grid-as-graph"]),
])
day(23, C6, "Graphs: components, colouring, ordering", [
 ("LEARN", 547, "number-of-provinces", "Number of Provinces", "Medium", "graphs", "components", ["graph-representations", "graph-connected-components"]),
 ("APPLY", 785, "is-graph-bipartite", "Is Graph Bipartite?", "Medium", "graphs", "two-colouring", ["graph-bipartite-colouring"]),
 ("LEARN", 207, "course-schedule", "Course Schedule", "Medium", "graphs", "topological-sort", ["graph-topological-sort", "graph-cycle-detection"]),
 ("APPLY", 210, "course-schedule-ii", "Course Schedule II", "Medium", "graphs", "topological-sort", ["graph-topological-sort"]),
])
day(24, C6, "Shortest paths and union-find", [
 ("LEARN", 743, "network-delay-time", "Network Delay Time", "Medium", "graphs", "dijkstra", ["graph-dijkstra"]),
 ("TWIST", 1631, "path-with-minimum-effort", "Path With Minimum Effort", "Medium", "graphs", "dijkstra-minimax", ["graph-dijkstra", "graph-grid-as-graph"]),
 ("TWIST", 787, "cheapest-flights-within-k-stops", "Cheapest Flights Within K Stops", "Medium", "graphs", "bellman-ford-k", ["graph-bellman-ford-and-k-stops"]),
 ("LEARN", 684, "redundant-connection", "Redundant Connection", "Medium", "graphs", "union-find", ["graph-dsu"]),
], skims=[(1584, "min-cost-to-connect-all-points", "Min Cost to Connect All Points", "Medium", "graph-mst"),
          (1192, "critical-connections-in-a-network", "Critical Connections in a Network", "Hard", "graph-tarjan-bridges"),
          (127, "word-ladder", "Word Ladder", "Hard", "graph-implicit-graphs")])
day(25, C7, "DP: one dimension", [
 ("LEARN", 70, "climbing-stairs", "Climbing Stairs", "Easy", "dp", "dp-1d", ["dp-what-dp-is", "dp-memo-vs-tabulation", "dp-1d-linear"]),
 ("APPLY", 198, "house-robber", "House Robber", "Medium", "dp", "take-or-skip-dp", ["dp-1d-linear", "dp-state-design"]),
 ("TWIST", 213, "house-robber-ii", "House Robber II", "Medium", "dp", "circular-split", ["dp-1d-linear"]),
 ("DISGUISE", 91, "decode-ways", "Decode Ways", "Medium", "dp", "counting-dp", ["dp-1d-linear", "dp-counting-vs-optimising"]),
])
day(26, C7, "DP: grids", [
 ("LEARN", 62, "unique-paths", "Unique Paths", "Medium", "dp", "grid-dp", ["dp-grid-paths"]),
 ("APPLY", 63, "unique-paths-ii", "Unique Paths II", "Medium", "dp", "grid-dp", ["dp-grid-paths"]),
 ("APPLY", 64, "minimum-path-sum", "Minimum Path Sum", "Medium", "dp", "grid-dp", ["dp-grid-paths", "dp-space-optimisation"]),
 ("TWIST", 221, "maximal-square", "Maximal Square", "Medium", "dp", "grid-dp-min-of-three", ["dp-grid-paths", "dp-state-design"]),
])
day(27, C7, "DP: knapsack", [
 ("LEARN", 416, "partition-equal-subset-sum", "Partition Equal Subset Sum", "Medium", "dp", "0-1-knapsack", ["dp-0-1-knapsack"]),
 ("TWIST", 494, "target-sum", "Target Sum", "Medium", "dp", "0-1-knapsack-count", ["dp-0-1-knapsack", "dp-counting-vs-optimising"]),
 ("LEARN", 322, "coin-change", "Coin Change", "Medium", "dp", "unbounded-knapsack", ["dp-unbounded-knapsack"]),
 ("APPLY", 518, "coin-change-ii", "Coin Change II", "Medium", "dp", "unbounded-knapsack-count", ["dp-unbounded-knapsack", "dp-counting-vs-optimising"]),
], skims=[(698, "partition-to-k-equal-sum-subsets", "Partition to K Equal Sum Subsets", "Medium", "dp-bitmask")])
day(28, C7, "DP: subsequences", [
 ("LEARN", 300, "longest-increasing-subsequence", "Longest Increasing Subsequence", "Medium", "dp", "lis", ["dp-lis"]),
 ("APPLY", 1048, "longest-string-chain", "Longest String Chain", "Medium", "dp", "lis-variant", ["dp-lis", "cpp-sort-and-comparators"]),
 ("LEARN", 1143, "longest-common-subsequence", "Longest Common Subsequence", "Medium", "dp", "lcs", ["dp-lcs-two-strings"]),
 ("DISGUISE", 516, "longest-palindromic-subsequence", "Longest Palindromic Subsequence", "Medium", "dp", "lcs-with-reverse", ["dp-lcs-two-strings"]),
])
day(29, C7, "DP: strings and state machines", [
 ("LEARN", 72, "edit-distance", "Edit Distance", "Medium", "dp", "edit-distance", ["dp-edit-distance"]),
 ("APPLY", 139, "word-break", "Word Break", "Medium", "dp", "string-partition", ["dp-string-partition"]),
 ("LEARN", 309, "best-time-to-buy-and-sell-stock-with-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "Medium", "dp", "state-machine", ["dp-state-machine"]),
 ("APPLY", 714, "best-time-to-buy-and-sell-stock-with-transaction-fee", "Best Time to Buy and Sell Stock with Transaction Fee", "Medium", "dp", "state-machine", ["dp-state-machine"]),
], skims=[(312, "burst-balloons", "Burst Balloons", "Hard", "dp-interval")])
day(30, C7, "Tries and bits", [
 ("LEARN", 208, "implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "Medium", "tries", "trie", ["trie-structure-and-ops"]),
 ("APPLY", 211, "design-add-and-search-words-data-structure", "Design Add and Search Words Data Structure", "Medium", "tries", "trie-wildcard-dfs", ["trie-wildcard-search-dfs"]),
 ("LEARN", 136, "single-number", "Single Number", "Easy", "bits", "xor-cancellation", ["bits-binary-and-operators", "bits-xor-tricks"]),
 ("APPLY", 338, "counting-bits", "Counting Bits", "Easy", "bits", "bits-dp", ["bits-common-tricks", "bits-counting-bits-dp"]),
])

CLUSTERS = {
 C1: "Arrays & hashing", C2: "Search, strings & sorting", C3: "Linked lists & stacks",
 C4: "Recursion, backtracking, greedy & heaps", C5: "Trees", C6: "Graphs", C7: "Dynamic programming & tries/bits",
}

READY_DAYS = {1, 2, 3, 4, 5}

days = []
all_ids = set()
for n in range(1, 31):
    d = D[n]
    probs = []
    for i, (role, lcid, slug, title, diff, topic, pattern, theory) in enumerate(d["problems"], 1):
        assert slug not in all_ids, slug
        all_ids.add(slug)
        old = OLD.get(slug, {})
        probs.append(dict(
            id=slug, ord=i, role=role, title=title,
            lc=dict(id=str(lcid), slug=slug, url=f"https://leetcode.com/problems/{slug}/", difficulty=diff),
            topic=topic, pattern=pattern, theory=theory,
            companies=old.get("companies", []), campus_oa=old.get("campus_oa", "HIGH"),
            tuf=dict(article=old.get("tuf_article"), practice=old.get("tuf_practice"), youtube=old.get("tuf_youtube"))
                if old.get("tuf_article") or old.get("tuf_youtube") else None,
            legacy_id=old.get("id"),
            content="ready" if n in READY_DAYS else "pending",
        ))
    skims = [dict(id=s, lc=dict(id=str(l), slug=s, url=f"https://leetcode.com/problems/{s}/", difficulty=df), title=t, theory=[pg])
             for (l, s, t, df, pg) in d["skims"]]
    for s in skims:
        assert s["id"] not in all_ids, s["id"]
        all_ids.add(s["id"])
    date = START + datetime.timedelta(days=n - 1)
    days.append(dict(day=n, date=date.isoformat(), weekday=date.strftime("%a"), cluster=d["cluster"],
                     title=d["title"], problems=probs, skims=skims,
                     content="ready" if n in READY_DAYS else "pending"))

# ------------------------------------------------------------ mock schedule
rng = random.Random(20261018)  # fixed seed: the schedule is generated once and frozen
mock_days = [rng.choice([6, 7])]
while True:
    nxt = mock_days[-1] + rng.randint(3, 6)
    if nxt > 27:
        break
    mock_days.append(nxt)
mocks = []
for i, md in enumerate(mock_days, 1):
    date = START + datetime.timedelta(days=md - 1)
    mocks.append(dict(id=f"mock-{i:02d}", day=md, date=date.isoformat(), weekday=date.strftime("%a"),
                      covers_days=list(range(1, md)), kind="regular", duration_min=90,
                      content="ready" if i == 1 else "pending"))
date = START + datetime.timedelta(days=29)
mocks.append(dict(id="mock-grand", day=30, date=date.isoformat(), weekday=date.strftime("%a"),
                  covers_days=list(range(1, 30)), kind="grand", duration_min=120, content="pending"))

schedule = dict(
    version=3,
    generated_once=True,
    seed=20261018,
    rules=dict(
        first_mock_day=[6, 7], gap_days=[3, 6], last_regular_mock_by_day=27, grand_mock_day=30,
        covers="every plan day strictly before the mock day, whether or not it is completed",
        unlock_time_window_ist=["09:00", "17:00"], unlock_time_granularity_min=15,
        start_window_hours=3,
        reveal="the exact unlock time is drawn on the mock morning and emailed at 08:45 IST; the date is public from day 1",
        missed="not started within start_window_hours of unlock -> recorded as missed; the mock stays available as a practice attempt, unscored",
        plan_day_load_on_mock_day="3 problems: the DISGUISE (or last-ord) problem moves to the revision queue",
    ),
    mocks=mocks,
)

plan = dict(
    version=3,
    title="30-day beginner DSA plan",
    start_date=START.isoformat(),
    end_date=(START + datetime.timedelta(days=29)).isoformat(),
    placement_day="2026-12-01",
    post_plan=dict(start="2026-11-17", end="2026-11-30",
                   focus=["CS core intensive (OOP 2d, DBMS 4d, OS 4d, CN 3d)", "daily mock OA", "stretch: hard problems on patterns already learned", "verbal explanation practice"]),
    problem_count=sum(len(d["problems"]) for d in days),
    skim_count=sum(len(d["skims"]) for d in days),
    clusters=[dict(key=k, title=v, days=[d["day"] for d in days if d["cluster"] == k]) for k, v in CLUSTERS.items()],
    roles=dict(
        LEARN=dict(meaning="First contact with a pattern. Read the full Note-this pipeline (and the linked theory) BEFORE coding, then close it and code from an empty file.", weight=10),
        APPLY=dict(meaning="Same pattern, new wording. Attempt cold with the stuck ladder. Pipeline stays covered until you have tried.", weight=10),
        TWIST=dict(meaning="The pattern plus one modification. Attempt cold; the brainstorm stage names the modification once you reveal it.", weight=10),
        DISGUISE=dict(meaning="The pattern hidden inside a story. Clearing it is the proof that the pattern transfers.", weight=10),
    ),
    daily_blocks=[
        dict(key="resolves", title="Due re-solves", minutes=20, note="cold re-solve of problems due at +2/+7/+14 days, oldest first; max 2 per day"),
        dict(key="must_sibling", title="Yesterday's must-study siblings", minutes=30, note="one per problem solved yesterday; read the mini-pipeline, write the pseudocode on paper"),
        dict(key="micro", title="Micro-theory and pattern card", minutes=10),
        dict(key="problems", title="Today's 4 problems", minutes=150, note="paper: analyse -> brainstorm -> algorithm -> pseudocode; then code; then Note-this card"),
        dict(key="drill", title="Recognition drill", minutes=10, note="5 unseen statements: name the pattern and one-line approach, no code"),
        dict(key="cs_core", title="CS core card", minutes=20),
    ],
    floor=["resolves", "the day's first LEARN problem"],
    never_miss_twice="a missed day is allowed; on the next day the floor is mandatory before anything else",
    cut_order=[
        dict(step=1, action="drop optional siblings (they stay browsable, never scheduled)"),
        dict(step=2, action="DISGUISE problem moves to the revision queue with a due date 7 days out"),
        dict(step=3, action="TWIST problem is downgraded to SKIM: reveal the pipeline, write the pseudocode on paper, do not code"),
    ],
    carry_over="unfinished LEARN and APPLY problems from past days appear in a capped 'carried over' list (max 4) above today's problems; days never move and the plan is never redrawn",
    calibration=dict(day=7, rule="if the measured median pace over days 1-7 is below 4 problems/day, cut-order step 2 applies permanently to days 8-30. This is the only allowed recalibration."),
    change_budget="design changes only in the Sunday 20-minute review, at most one per week",
    stuck_ladder=[
        dict(from_min=0, to_min=10, do="Fill the analysis box on paper and write the dumbest correct (brute force) solution. Most 'stuck' is a skipped brute force."),
        dict(from_min=10, to_min=20, do="Read the constraints and turn n into a target complexity. Point at the line of your brute force that does the most repeated work and name WHY it is wasted."),
        dict(from_min=20, to_min=30, do="Read the theory section linked on this rung. Reveal only the Analyse stage. Close it and try again."),
        dict(from_min=30, to_min=40, do="Reveal the Brainstorm stage (brute -> optimal). Close it, write the algorithm in words and the pseudocode yourself, then code."),
        dict(from_min=40, to_min=999, do="Reveal everything (or watch the linked video). Then close every tab and code it from an empty file. Mark it revisit with confidence <= 3 - it comes back as a re-solve."),
    ],
    ai_protocol=OLD_SPEC["ai_protocol"],
    tag_seed=OLD_SPEC["user_field_schema"]["tags"]["seed"] + ["no-pseudocode", "recognised-in-drill"],
    statuses=["todo", "solved", "revisit", "skimmed"],
    days=days,
)

os.makedirs(OUT, exist_ok=True)
json.dump(plan, open(os.path.join(OUT, "PLAN.json"), "w"), indent=1, ensure_ascii=False)
json.dump(schedule, open(os.path.join(OUT, "MOCK-SCHEDULE.json"), "w"), indent=1, ensure_ascii=False)
print("problems", plan["problem_count"], "skims", plan["skim_count"])
for m in mocks:
    print(m["id"], "day", m["day"], m["date"], m["weekday"])
theory_needed = sorted({t for d in days for p in d["problems"] for t in p["theory"]} | {t for d in days for s in d["skims"] for t in s["theory"]})
json.dump(theory_needed, open(os.path.join(HERE, "theory_needed.json"), "w"))
print("theory pages referenced by plan:", len(theory_needed))
legacy = {p["legacy_id"]: p["id"] for d in days for p in d["problems"] if p["legacy_id"]}
print("legacy ids mapped:", len(legacy))
