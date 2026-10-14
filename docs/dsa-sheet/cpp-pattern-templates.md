---
title: C++ Pattern Templates
count: 76
generated: 2026-09-17
---

# C++ Pattern Templates

**76 templates.** Every problem in the sheet names one of these in its `template:` field. Learn the template once and the problems that cite it become parameter changes rather than new problems.

> Templates are written to be typed from memory, not copy-pasted. If you cannot reproduce one on an empty file, you have read it rather than learnt it.

## Index

**hashing** — [`T-HASH-01`](#t-hash-01) Complement lookup · [`T-HASH-02`](#t-hash-02) Seen-set with early exit · [`T-HASH-03`](#t-hash-03) Frequency count over a fixed alphabet · [`T-HASH-04`](#t-hash-04) Prefix sum plus hash map

**arrays** — [`T-PS-01`](#t-ps-01) Prefix sums · [`T-PS-02`](#t-ps-02) Difference array · [`T-ARR-01`](#t-arr-01) Boyer-Moore voting

**sorting** — [`T-SORT-01`](#t-sort-01) Merge sort with a counting hook · [`T-SORT-02`](#t-sort-02) Two-pointer partition · [`T-SORT-03`](#t-sort-03) Selection by restricted operation · [`T-SORT-04`](#t-sort-04) Group by an invariant · [`T-SORT-05`](#t-sort-05) Rank map plus comparator · [`T-SORT-06`](#t-sort-06) Sort then adjacent scan · [`T-SORT-07`](#t-sort-07) Dutch National Flag · [`T-SORT-08`](#t-sort-08) Quickselect

**binary-search** — [`T-BS-01`](#t-bs-01) Binary search on an index · [`T-BS-02`](#t-bs-02) Binary search on the answer · [`T-BS-03`](#t-bs-03) Rotated sorted array · [`T-BS-04`](#t-bs-04) Binary search on a 2D matrix

**two-pointers** — [`T-TP-01`](#t-tp-01) Opposing two pointers · [`T-TP-02`](#t-tp-02) k-Sum by sort plus two pointers · [`T-TP-03`](#t-tp-03) Fast and slow pointers

**sliding-window** — [`T-SW-01`](#t-sw-01) Variable-size sliding window · [`T-SW-02`](#t-sw-02) Fixed-size sliding window · [`T-SW-03`](#t-sw-03) Window with a counter, at most K distinct

**linked-list** — [`T-LL-01`](#t-ll-01) Iterative reversal · [`T-LL-02`](#t-ll-02) Dummy head · [`T-LL-03`](#t-ll-03) Runner offset by k

**stack-queue** — [`T-STK-01`](#t-stk-01) Monotonic stack · [`T-STK-02`](#t-stk-02) Monotonic deque · [`T-STK-03`](#t-stk-03) Bracket matching

**heaps** — [`T-HEAP-01`](#t-heap-01) Size-k heap · [`T-HEAP-02`](#t-heap-02) Two heaps for a running median · [`T-HEAP-03`](#t-heap-03) k-way merge

**recursion** — [`T-BT-01`](#t-bt-01) Subsets / include-exclude · [`T-BT-02`](#t-bt-02) Permutations · [`T-BT-03`](#t-bt-03) Combination sum · [`T-BT-04`](#t-bt-04) Grid backtracking · [`T-BT-05`](#t-bt-05) Constraint backtracking

**bit-manipulation** — [`T-BIT-01`](#t-bit-01) XOR cancellation · [`T-BIT-02`](#t-bit-02) Bit tricks worth memorising

**strings** — [`T-STR-01`](#t-str-01) KMP prefix function · [`T-STR-02`](#t-str-02) Expand around centre · [`T-STR-03`](#t-str-03) Rolling hash (Rabin-Karp)

**greedy** — [`T-GREEDY-01`](#t-greedy-01) Interval scheduling · [`T-GREEDY-02`](#t-greedy-02) Interval merging · [`T-GREEDY-03`](#t-greedy-03) Sweep line / difference array · [`T-GREEDY-04`](#t-greedy-04) Reachability greedy

**binary-trees** — [`T-TREE-01`](#t-tree-01) DFS traversals · [`T-TREE-02`](#t-tree-02) BFS level order · [`T-TREE-03`](#t-tree-03) Bottom-up return value · [`T-TREE-04`](#t-tree-04) Construct from traversals

**bst** — [`T-BST-01`](#t-bst-01) BST search and modify

**graphs** — [`T-GRAPH-01`](#t-graph-01) Grid DFS / flood fill · [`T-GRAPH-02`](#t-graph-02) BFS shortest path on unweighted graphs · [`T-GRAPH-03`](#t-graph-03) Topological sort (Kahn) · [`T-GRAPH-04`](#t-graph-04) Dijkstra · [`T-GRAPH-05`](#t-graph-05) Disjoint Set Union · [`T-GRAPH-06`](#t-graph-06) Kruskal MST · [`T-GRAPH-07`](#t-graph-07) Cycle detection in a directed graph (colours)

**dp** — [`T-DP-01`](#t-dp-01) 1D DP · [`T-DP-02`](#t-dp-02) 2D grid DP · [`T-DP-03`](#t-dp-03) Knapsack / subset sum · [`T-DP-04`](#t-dp-04) DP on two strings · [`T-DP-05`](#t-dp-05) DP on stocks (state machine) · [`T-DP-06`](#t-dp-06) LIS · [`T-DP-07`](#t-dp-07) Interval / MCM partition DP · [`T-DP-08`](#t-dp-08) Game DP (minimax over a range) · [`T-DP-09`](#t-dp-09) DP with binary search on a sorted dimension

**tries** — [`T-TRIE-01`](#t-trie-01) Trie

**math** — [`T-MATH-01`](#t-math-01) Digit extraction · [`T-MATH-02`](#t-math-02) Floyd cycle detection on values · [`T-MATH-03`](#t-math-03) Sieve and factor counting · [`T-MATH-04`](#t-math-04) Binary exponentiation · [`T-MATH-05`](#t-math-05) Block counting · [`T-MATH-06`](#t-math-06) Inclusion-exclusion with clamping

## hashing

### T-HASH-01

**Complement lookup**

*When:* Find a pair satisfying an arithmetic relation in one pass.

```cpp
// Query BEFORE inserting, or an element pairs with itself.
vector<int> twoSum(vector<int>& a, int target) {
    unordered_map<int,int> seen;                 // value -> index
    for (int i = 0; i < (int)a.size(); i++) {
        auto it = seen.find(target - a[i]);
        if (it != seen.end()) return {it->second, i};
        seen[a[i]] = i;
    }
    return {};
}
```

- Generalises to any invertible relation, not just sums.
- If the array is sorted, two pointers beat this on space.

### T-HASH-02

**Seen-set with early exit**

*When:* Detect whether any element repeats, or whether a value has occurred.

```cpp
bool hasDuplicate(vector<int>& a) {
    unordered_set<int> seen;
    for (int x : a) {
        if (!seen.insert(x).second) return true;  // insert returns {it, inserted?}
        // .second is false when x was already present - one call, not two
    }
    return false;
}
```

- `insert().second` avoids the separate count() lookup.

### T-HASH-03

**Frequency count over a fixed alphabet**

*When:* Compare or match multisets of characters; count occurrences in a bounded range.

```cpp
bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;
    for (char c : t) if (--cnt[c - 'a'] < 0) return false;
    return true;                                  // sizes equal + none negative => all zero
}
```

- An array beats unordered_map on constant factor and cache behaviour.
- Space is genuinely O(1) only because the alphabet is fixed.

### T-HASH-04

**Prefix sum plus hash map**

*When:* Count or find subarrays whose aggregate equals a target, when values may be negative.

```cpp
// Subarray (j, i] sums to k  <=>  P(i) - P(j) = k  <=>  P(j) = P(i) - k
int countSubarraysWithSum(vector<int>& a, int k) {
    unordered_map<long long,int> cnt{{0, 1}};     // the empty prefix, seen once - REQUIRED
    long long sum = 0; int res = 0;
    for (int x : a) {
        sum += x;
        auto it = cnt.find(sum - k);
        if (it != cnt.end()) res += it->second;
        cnt[sum]++;
    }
    return res;
}
```

- Works for any invertible aggregate: XOR is its own inverse, counts mod m also work.
- Products do NOT work - zero has no inverse.
- Use this instead of sliding window whenever negatives are possible.

## arrays

### T-PS-01

**Prefix sums**

*When:* Range sum queries, subarray aggregates, running totals.

```cpp
vector<long long> buildPrefix(vector<int>& a) {
    vector<long long> p(a.size() + 1, 0);
    for (int i = 0; i < (int)a.size(); i++) p[i+1] = p[i] + a[i];
    return p;                                     // sum of a[l..r] == p[r+1] - p[l]
}
// 2D: P[i][j] = sum of the rectangle from (0,0) to (i-1,j-1)
// rect(r1,c1,r2,c2) = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
```

- Size n+1 with p[0] = 0 removes every boundary special case.
- Use long long - sums of 1e5 values at 1e9 each overflow int.
- The 2D formula is inclusion-exclusion; the final +P[r1][c1] adds back the double-subtracted corner.

### T-PS-02

**Difference array**

*When:* Many range updates followed by one read pass.

```cpp
// Add v to a[l..r] in O(1) per update
void rangeAdd(vector<long long>& d, int l, int r, long long v) { d[l] += v; d[r+1] -= v; }
vector<long long> finalise(vector<long long>& d, int n) {
    vector<long long> a(n);
    long long run = 0;
    for (int i = 0; i < n; i++) { run += d[i]; a[i] = run; }
    return a;
}
```

- O(1) per update and one O(n) pass at the end, versus O(n) per update naively.
- Size the difference array n+1 so `d[r+1]` never goes out of bounds.

### T-ARR-01

**Boyer-Moore voting**

*When:* Find an element appearing more than n/k times, in O(1) space.

```cpp
// More than n/2: one candidate, one counter.
int majorityElement(vector<int>& a) {
    int cand = a[0], cnt = 0;
    for (int x : a) {
        if (cnt == 0) cand = x;
        cnt += (x == cand) ? 1 : -1;
    }
    return cand;                              // verify with a second pass if not guaranteed
}
// More than n/3: at most two can exist -> two candidates, two counters.
// Branch order matters: match c1, match c2, cnt1==0, cnt2==0, else decrement both.
```

- Each decrement pairs one majority occurrence against one non-majority occurrence; the majority cannot be exhausted.
- For n/k, keep k-1 candidates (Misra-Gries). A verification pass is mandatory unless existence is guaranteed.

## sorting

### T-SORT-01

**Merge sort with a counting hook**

*When:* Guaranteed O(n log n) sort; counting cross-half pairs for free.

```cpp
long long cnt = 0;
void merge(vector<int>& a, int l, int m, int r) {
    // optional counting pass - runs before the merge because the predicate differs
    int j = m + 1;
    for (int i = l; i <= m; i++) {
        while (j <= r && (long long)a[i] > 2LL * a[j]) j++;
        cnt += j - (m + 1);                       // Reverse Pairs; drop for a plain sort
    }
    vector<int> tmp; tmp.reserve(r - l + 1);
    int i = l; j = m + 1;
    while (i <= m && j <= r) tmp.push_back(a[i] <= a[j] ? a[i++] : a[j++]);
    //                                          ^^ <= preserves stability
    while (i <= m) tmp.push_back(a[i++]);
    while (j <= r) tmp.push_back(a[j++]);
    for (int k = l; k <= r; k++) a[k] = tmp[k - l];
}
void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m); mergeSort(a, m + 1, r); merge(a, l, m, r);
}
```

- For inversions, count inside the merge loop instead: cnt += m - i + 1 when a[j] < a[i].
- Stable. O(n) auxiliary space.

### T-SORT-02

**Two-pointer partition**

*When:* Split an array by a binary predicate in place, O(n) time O(1) space.

```cpp
void partitionByPredicate(vector<int>& a) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        while (l < r && isLeftClass(a[l])) l++;   // e.g. a[l] % 2 == 0
        while (l < r && !isLeftClass(a[r])) r--;
        if (l < r) swap(a[l++], a[r--]);
    }
}
```

- Destroys relative order. If stability is required this approach is invalid.
- Three classes instead of two -> Dutch National Flag, T-SORT-07.

### T-SORT-03

**Selection by restricted operation**

*When:* Sort when only a limited operation (prefix reversal, adjacent swap) is permitted.

```cpp
// Pancake sort: two flips place one element.
vector<int> pancakeSort(vector<int>& a) {
    vector<int> ops;
    for (int sz = a.size(); sz > 1; sz--) {
        int mx = max_element(a.begin(), a.begin() + sz) - a.begin();
        if (mx == sz - 1) continue;               // already placed - do not waste flips
        if (mx != 0) { reverse(a.begin(), a.begin() + mx + 1); ops.push_back(mx + 1); }
        reverse(a.begin(), a.begin() + sz);       ops.push_back(sz);
    }
    return ops;
}
```

- Ask which algorithm needs only the operations that remain, rather than adapting a favourite.

### T-SORT-04

**Group by an invariant**

*When:* Elements fall into classes defined by a computed key; solve each class independently.

```cpp
// Matrix diagonals share i - j
vector<vector<int>> sortDiagonally(vector<vector<int>> g) {
    int m = g.size(), n = g[0].size();
    map<int, vector<int>> b;
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) b[i - j].push_back(g[i][j]);
    for (auto& [k, v] : b) sort(v.rbegin(), v.rend());   // reversed so we can pop_back
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
        g[i][j] = b[i - j].back(); b[i - j].pop_back();
    }
    return g;
}
```

- Anti-diagonals use i + j. The algorithm is about the key, not the geometry.

### T-SORT-05

**Rank map plus comparator**

*When:* Ordering is defined by external data rather than by the values themselves.

```cpp
vector<int> relativeSort(vector<int>& a, vector<int>& order) {
    unordered_map<int,int> rank;
    for (int i = 0; i < (int)order.size(); i++) rank[order[i]] = i;
    sort(a.begin(), a.end(), [&](int x, int y) {
        int rx = rank.count(x) ? rank[x] : INT_MAX;      // absent -> sorts last
        int ry = rank.count(y) ? rank[y] : INT_MAX;
        return rx != ry ? rx < ry : x < y;                // tiebreak ascending
    });
    return a;
}
```

- The comparator must be a strict weak ordering. Never return <=.
- If values are bounded, counting sort gives O(n + k) instead.

### T-SORT-06

**Sort then adjacent scan**

*When:* Minimum gaps, closest pairs, duplicate detection.

```cpp
// The minimum difference is always between adjacent elements after sorting.
int minAbsDifference(vector<int> a) {
    sort(a.begin(), a.end());
    int best = INT_MAX;
    for (int i = 1; i < (int)a.size(); i++) best = min(best, a[i] - a[i-1]);
    return best;
}
```

- Proof: for non-adjacent i < j, any k between gives a[k] - a[i] <= a[j] - a[i].

### T-SORT-07

**Dutch National Flag**

*When:* Partition into exactly three classes in one pass, O(1) space.

```cpp
void sortColors(vector<int>& a) {
    int low = 0, mid = 0, high = (int)a.size() - 1;
    while (mid <= high) {
        if      (a[mid] == 0) swap(a[low++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else                  swap(a[mid], a[high--]);   // do NOT advance mid here
    }
}
```

- Invariant: [0,low) are 0s, [low,mid) are 1s, (high,end) are 2s.
- mid does not advance on the 2-swap because the incoming value is unexamined.

### T-SORT-08

**Quickselect**

*When:* k-th largest or smallest without a full sort. O(n) average.

```cpp
int quickselect(vector<int>& a, int l, int r, int k) {   // k is an index into a
    if (l == r) return a[l];
    swap(a[l + rand() % (r - l + 1)], a[r]);              // randomise or risk O(n^2)
    int pivot = a[r], i = l - 1;
    for (int j = l; j < r; j++) if (a[j] < pivot) swap(a[++i], a[j]);
    swap(a[i + 1], a[r]);
    int p = i + 1;
    if (k == p) return a[p];
    return k < p ? quickselect(a, l, p - 1, k) : quickselect(a, p + 1, r, k);
}
// Library equivalent: nth_element(a.begin(), a.begin() + k, a.end());
```

- Recurse into ONE side only - that is what makes it O(n) rather than O(n log n).
- A size-k heap is O(n log k) and is the right answer when data does not fit in memory.

## binary-search

### T-BS-01

**Binary search on an index**

*When:* Find an element, or the boundary of a monotone predicate, in a sorted array.

```cpp
int lowerBound(vector<int>& a, int x) {           // first index with a[i] >= x
    int l = 0, r = a.size();                      // note: r = n, half-open
    while (l < r) {
        int m = l + (r - l) / 2;                  // NEVER (l+r)/2 - overflow
        if (a[m] >= x) r = m; else l = m + 1;
    }
    return l;                                     // == n when no such index
}
int upperBound(vector<int>& a, int x) {           // first index with a[i] > x
    int l = 0, r = a.size();
    while (l < r) { int m = l + (r - l) / 2; if (a[m] > x) r = m; else l = m + 1; }
    return l;
}
```

- Count of x = upperBound(x) - lowerBound(x).
- Half-open [l, r) removes almost every off-by-one.

### T-BS-02

**Binary search on the answer**

*When:* Minimise/maximise a value where feasibility is monotone. The tell: 'minimum X such that...'

```cpp
// feasible(v) must be monotone: false...false true...true
bool feasible(long long v, vector<int>& a, int limit);

long long minimumFeasible(vector<int>& a, int limit, long long lo, long long hi) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (feasible(mid, a, limit)) hi = mid;    // mid works - try smaller
        else                         lo = mid + 1;
    }
    return lo;
}
// Koko: feasible(speed) = sum(ceil(p/speed)) <= h,  lo = 1, hi = max(piles)
// Ship:  feasible(cap)   = greedy day count <= days, lo = max(w), hi = sum(w)
```

- Search the ANSWER space, not the array. n can be 1e9; the answer range is what is bounded.
- Get lo and hi right: lo must be feasible-or-below, hi must be feasible.

### T-BS-03

**Rotated sorted array**

*When:* Search or find the minimum in a sorted array rotated an unknown amount.

```cpp
int searchRotated(vector<int>& a, int target) {
    int l = 0, r = a.size() - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (a[m] == target) return m;
        if (a[l] <= a[m]) {                       // left half is sorted
            if (a[l] <= target && target < a[m]) r = m - 1; else l = m + 1;
        } else {                                  // right half is sorted
            if (a[m] < target && target <= a[r]) l = m + 1; else r = m - 1;
        }
    }
    return -1;
}
```

- One half is always sorted. Identify it, then test whether the target lies inside it.
- With duplicates, a[l]==a[m]==a[r] is ambiguous: shrink both ends and accept O(n) worst case.

### T-BS-04

**Binary search on a 2D matrix**

*When:* Row-sorted and column-sorted matrices.

```cpp
// Fully sorted when flattened: treat as a 1D array of size m*n
bool searchMatrix(vector<vector<int>>& g, int target) {
    int m = g.size(), n = g[0].size(), l = 0, r = m * n - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        int v = g[mid / n][mid % n];              // the index arithmetic is the whole trick
        if (v == target) return true;
        v < target ? l = mid + 1 : r = mid - 1;
    }
    return false;
}
// Rows AND columns sorted but not globally: staircase from top-right, O(m + n)
bool searchMatrixII(vector<vector<int>>& g, int target) {
    int i = 0, j = g[0].size() - 1;
    while (i < (int)g.size() && j >= 0) {
        if (g[i][j] == target) return true;
        g[i][j] > target ? j-- : i++;             // each step eliminates a row or column
    }
    return false;
}
```

- Start at a corner where one direction increases and the other decreases.

## two-pointers

### T-TP-01

**Opposing two pointers**

*When:* Sorted array: find pairs, maximise an area, or converge on a condition.

```cpp
vector<int> twoSumSorted(vector<int>& a, int target) {
    int l = 0, r = a.size() - 1;
    while (l < r) {
        long long s = (long long)a[l] + a[r];
        if (s == target) return {l, r};
        s < target ? l++ : r--;                   // the sorted order is what justifies this
    }
    return {};
}
```

- Only valid when moving a pointer changes the quantity monotonically.
- O(1) space beats hashing when the input is already sorted.

### T-TP-02

**k-Sum by sort plus two pointers**

*When:* Find all unique triplets/quadruplets summing to a target.

```cpp
vector<vector<int>> threeSum(vector<int>& a) {
    sort(a.begin(), a.end());
    vector<vector<int>> res;
    int n = a.size();
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && a[i] == a[i-1]) continue;             // skip duplicate anchors
        int l = i + 1, r = n - 1;
        while (l < r) {
            long long s = (long long)a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                res.push_back({a[i], a[l], a[r]});
                while (l < r && a[l] == a[l+1]) l++;        // skip duplicate pair members
                while (l < r && a[r] == a[r-1]) r--;
                l++; r--;
            }
        }
    }
    return res;
}
```

- Sorting is what makes deduplication a skip rather than a set.
- 4Sum adds one more outer loop; kSum generalises recursively to O(n^(k-1)).

### T-TP-03

**Fast and slow pointers**

*When:* Cycle detection, finding the middle, or any value-points-to-value chain.

```cpp
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
ListNode* cycleStart(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {                        // Floyd: reset one to head,
            slow = head;                           // advance both one step at a time
            while (slow != fast) { slow = slow->next; fast = fast->next; }
            return slow;
        }
    }
    return nullptr;
}
```

- Why the reset works: meeting point is k steps into the cycle, head is k steps from entry.
- Applies to arrays whose values are indices - Find the Duplicate Number, Happy Number.

## sliding-window

### T-SW-01

**Variable-size sliding window**

*When:* Longest/shortest subarray satisfying a constraint, with non-negative contributions.

```cpp
int longestValidWindow(vector<int>& a, int limit) {
    int l = 0, best = 0;
    long long cur = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        cur += a[r];                              // extend
        while (cur > limit) cur -= a[l++];        // shrink until valid again
        best = max(best, r - l + 1);
    }
    return best;
}
```

- Requires monotonicity: extending must move the quantity one way only.
- Negatives break it - use prefix sums plus a hash map (T-HASH-04) instead.
- Each index enters and leaves once, so it is O(n) despite the inner while.

### T-SW-02

**Fixed-size sliding window**

*When:* Best window of exactly size k.

```cpp
double maxAverage(vector<int>& a, int k) {
    long long sum = 0;
    for (int i = 0; i < k; i++) sum += a[i];
    long long best = sum;
    for (int r = k; r < (int)a.size(); r++) {
        sum += a[r] - a[r - k];                   // add entering, remove leaving
        best = max(best, sum);
    }
    return (double)best / k;
}
```

- No shrink loop - the window size is constant, so it is one add and one remove.

### T-SW-03

**Window with a counter, at most K distinct**

*When:* Constraints on the multiset inside the window.

```cpp
int atMostKDistinct(string s, int k) {
    unordered_map<char,int> cnt;
    int l = 0, res = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        cnt[s[r]]++;
        while ((int)cnt.size() > k)
            if (--cnt[s[l++]] == 0) cnt.erase(s[l-1]);     // erase, or size() lies
        res += r - l + 1;                                  // all windows ending at r
    }
    return res;
}
// EXACTLY k  =  atMost(k) - atMost(k-1)     <- the trick worth memorising
```

- Erasing the zero-count key is mandatory; otherwise cnt.size() overcounts.
- `res += r - l + 1` counts every valid subarray ending at r, not just the longest.

## linked-list

### T-LL-01

**Iterative reversal**

*When:* Reverse a list, or a segment of one.

```cpp
ListNode* reverse(ListNode* head) {
    ListNode *prev = nullptr, *cur = head;
    while (cur) {
        ListNode* nxt = cur->next;                // save before you destroy it
        cur->next = prev;
        prev = cur; cur = nxt;
    }
    return prev;                                  // prev is the new head
}
```

- Three pointers, in that order. Losing `nxt` is the universal first bug.

### T-LL-02

**Dummy head**

*When:* Any operation that might remove or replace the first node.

```cpp
ListNode* removeElements(ListNode* head, int val) {
    ListNode dummy(0); dummy.next = head;         // removes the head special case
    ListNode* cur = &dummy;
    while (cur->next) {
        if (cur->next->val == val) cur->next = cur->next->next;
        else cur = cur->next;
    }
    return dummy.next;
}
```

- Use a dummy whenever the head itself may change. It eliminates a whole class of bugs.

### T-LL-03

**Runner offset by k**

*When:* Nth node from the end; splitting a list at a proportion.

```cpp
ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0); dummy.next = head;
    ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; i++) fast = fast->next;    // open a gap of n
    while (fast->next) { fast = fast->next; slow = slow->next; }
    slow->next = slow->next->next;
    return dummy.next;
}
```

- Starting both at the dummy makes slow land on the PREDECESSOR, which is what you need.

## stack-queue

### T-STK-01

**Monotonic stack**

*When:* Next/previous greater or smaller element; spans; histogram areas.

```cpp
// Next greater element to the right. Stack holds INDICES, decreasing by value.
vector<int> nextGreater(vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    stack<int> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }
        st.push(i);
    }
    return res;
}
// Largest rectangle in histogram - the canonical application
int largestRectangle(vector<int>& h) {
    h.push_back(0);                               // sentinel forces the stack to drain
    stack<int> st; int best = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[st.top()] >= h[i]) {
            int height = h[st.top()]; st.pop();
            int left = st.empty() ? -1 : st.top();
            best = max(best, height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}
```

- Store indices, not values - you almost always need the distance.
- Decreasing stack -> next greater. Increasing stack -> next smaller.
- A sentinel at the end avoids a separate drain loop.
- Circular variants: iterate 2n times using i % n.

### T-STK-02

**Monotonic deque**

*When:* Maximum or minimum of every sliding window, in O(n).

```cpp
vector<int> maxSlidingWindow(vector<int>& a, int k) {
    deque<int> dq;                                // indices, values decreasing
    vector<int> res;
    for (int i = 0; i < (int)a.size(); i++) {
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front();   // out of window
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();   // dominated
        dq.push_back(i);
        if (i >= k - 1) res.push_back(a[dq.front()]);
    }
    return res;
}
```

- Each index is pushed and popped once, so O(n) despite the nested whiles.
- A heap gives O(n log k); the deque is strictly better here.

### T-STK-03

**Bracket matching**

*When:* Balanced parentheses, expression parsing, nesting depth.

```cpp
bool isValid(string s) {
    stack<char> st;
    unordered_map<char,char> pair{{')','('},{']','['},{'}','{'}};
    for (char c : s) {
        if (pair.count(c)) {
            if (st.empty() || st.top() != pair[c]) return false;
            st.pop();
        } else st.push(c);
    }
    return st.empty();                            // leftovers mean unclosed brackets
}
```

- Forgetting the final emptiness test is the classic bug: "(((" would pass.

## heaps

### T-HEAP-01

**Size-k heap**

*When:* k largest/smallest from a large or streaming input.

```cpp
// k LARGEST -> keep a MIN heap of size k (the smallest of the winners sits on top)
int kthLargest(vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int x : a) {
        pq.push(x);
        if ((int)pq.size() > k) pq.pop();         // evict the smallest
    }
    return pq.top();
}
```

- The heap is INVERTED relative to intuition: k largest needs a min-heap.
- O(n log k) time, O(k) space. Correct when data does not fit in memory.
- If it does fit, nth_element is O(n) average and faster.

### T-HEAP-02

**Two heaps for a running median**

*When:* Median or balanced split of a stream.

```cpp
class MedianFinder {
    priority_queue<int> lo;                                   // max-heap, lower half
    priority_queue<int, vector<int>, greater<int>> hi;        // min-heap, upper half
public:
    void addNum(int x) {
        lo.push(x);
        hi.push(lo.top()); lo.pop();              // funnel through to keep order correct
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double findMedian() {
        return lo.size() > hi.size() ? lo.top() : (lo.top() + hi.top()) / 2.0;
    }
};
```

- Invariant: lo.size() == hi.size() or lo.size() == hi.size() + 1.
- The push-then-transfer dance is what guarantees every element in lo <= every in hi.

### T-HEAP-03

**k-way merge**

*When:* Merge k sorted sequences; smallest range; k smallest pairs.

```cpp
ListNode* mergeKLists(vector<ListNode*>& lists) {
    auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };  // min-heap
    priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
    for (auto l : lists) if (l) pq.push(l);
    ListNode dummy, *tail = &dummy;
    while (!pq.empty()) {
        ListNode* n = pq.top(); pq.pop();
        tail->next = n; tail = n;
        if (n->next) pq.push(n->next);            // refill from the same list
    }
    return dummy.next;
}
```

- O(N log k) where N is total elements. The heap holds one head per list.
- This is also how external sorting merges its on-disk runs.

## recursion

### T-BT-01

**Subsets / include-exclude**

*When:* Enumerate all subsets or subsequences.

```cpp
void dfs(int i, vector<int>& a, vector<int>& cur, vector<vector<int>>& res) {
    if (i == (int)a.size()) { res.push_back(cur); return; }
    cur.push_back(a[i]); dfs(i + 1, a, cur, res); cur.pop_back();   // include
    dfs(i + 1, a, cur, res);                                        // exclude
}
// With duplicates: sort first, then skip
void dfs2(int start, vector<int>& a, vector<int>& cur, vector<vector<int>>& res) {
    res.push_back(cur);
    for (int i = start; i < (int)a.size(); i++) {
        if (i > start && a[i] == a[i-1]) continue;   // skip duplicates at THIS level
        cur.push_back(a[i]); dfs2(i + 1, a, cur, res); cur.pop_back();
    }
}
```

- O(2^n) subsets, each costing O(n) to copy -> O(n * 2^n).
- `i > start` not `i > 0`: duplicates are only skipped among siblings, not ancestors.

### T-BT-02

**Permutations**

*When:* Enumerate all orderings.

```cpp
void permute(int i, vector<int>& a, vector<vector<int>>& res) {
    if (i == (int)a.size()) { res.push_back(a); return; }
    for (int j = i; j < (int)a.size(); j++) {
        swap(a[i], a[j]);
        permute(i + 1, a, res);
        swap(a[i], a[j]);                         // undo - this is the backtrack
    }
}
// With duplicates: use a used[] array plus sorting, not swapping
```

- Swap-based permutation is O(1) space beyond recursion but cannot dedupe easily.
- For duplicates, sort and use `if (used[i] || (i>0 && a[i]==a[i-1] && !used[i-1])) continue;`

### T-BT-03

**Combination sum**

*When:* Choose elements (with or without reuse) hitting a target.

```cpp
void dfs(int start, int target, vector<int>& a, vector<int>& cur,
         vector<vector<int>>& res) {
    if (target == 0) { res.push_back(cur); return; }
    if (target < 0)  return;                      // prune
    for (int i = start; i < (int)a.size(); i++) {
        if (a[i] > target) break;                 // requires a sorted array - strong prune
        cur.push_back(a[i]);
        dfs(i, target - a[i], a, cur, res);       // `i` allows reuse; `i+1` forbids it
        cur.pop_back();
    }
}
```

- The single difference between Combination Sum I and II is `i` versus `i + 1`.
- Sorting enables the `break`, which is the difference between passing and TLE.

### T-BT-04

**Grid backtracking**

*When:* Word search, rat in a maze, island paths with revisits allowed.

```cpp
bool dfs(vector<vector<char>>& g, int i, int j, string& w, int k) {
    if (k == (int)w.size()) return true;
    if (i < 0 || j < 0 || i >= (int)g.size() || j >= (int)g[0].size()) return false;
    if (g[i][j] != w[k]) return false;
    char tmp = g[i][j]; g[i][j] = '#';            // mark visited IN PLACE
    static const int d[] = {0, 1, 0, -1, 0};
    for (int t = 0; t < 4; t++)
        if (dfs(g, i + d[t], j + d[t+1], w, k + 1)) { g[i][j] = tmp; return true; }
    g[i][j] = tmp;                                // restore - this is the backtrack
    return false;
}
```

- Marking in place avoids a separate visited array and is O(1) extra space.
- The `{0,1,0,-1,0}` direction trick gives all four neighbours from one array.

### T-BT-05

**Constraint backtracking**

*When:* N-Queens, Sudoku, graph colouring - place, validate, recurse, undo.

```cpp
bool solve(vector<vector<char>>& b) {
    for (int i = 0; i < 9; i++)
      for (int j = 0; j < 9; j++)
        if (b[i][j] == '.') {
            for (char c = '1'; c <= '9'; c++)
                if (valid(b, i, j, c)) {
                    b[i][j] = c;
                    if (solve(b)) return true;
                    b[i][j] = '.';                // undo
                }
            return false;                         // no digit fits - dead end
        }
    return true;                                  // no empty cell left - solved
}
```

- Keep O(1) validity sets (row/col/box bitmasks) instead of rescanning - huge speedup.
- Return true immediately on success; do not keep searching.

## bit-manipulation

### T-BIT-01

**XOR cancellation**

*When:* Find the unpaired element; missing number; constant-space counting.

```cpp
int singleNumber(vector<int>& a) {
    int x = 0;
    for (int v : a) x ^= v;                       // x^x = 0, x^0 = x
    return x;
}
int missingNumber(vector<int>& a) {
    int x = a.size();
    for (int i = 0; i < (int)a.size(); i++) x ^= i ^ a[i];   // indices cancel values
    return x;
}
```

- Commutative and associative, so order never matters.
- Breaks when duplicates appear three times - use bit counting mod 3 instead.

### T-BIT-02

**Bit tricks worth memorising**

*When:* Set, clear, test, count, isolate.

```cpp
bool isSet (int x, int i) { return (x >> i) & 1; }
int  setBit(int x, int i) { return x |  (1 << i); }
int  clrBit(int x, int i) { return x & ~(1 << i); }
int  tglBit(int x, int i) { return x ^  (1 << i); }

int  lowestSetBit (int x) { return x & -x;      }    // isolates the rightmost 1
int  clearLowest  (int x) { return x & (x - 1); }    // Brian Kernighan step
bool isPowerOfTwo (int x) { return x > 0 && (x & (x - 1)) == 0; }
int  countBits    (int x) { int c = 0; while (x) { x &= x - 1; c++; } return c; }
// or: __builtin_popcount(x) / __builtin_popcountll(x)

// enumerate every subset of an n-element set
for (int mask = 0; mask < (1 << n); mask++)
    for (int i = 0; i < n; i++)
        if (mask & (1 << i)) { /* i is in this subset */ }
```

- Use 1LL << i when i can reach 31 or beyond - 1 << 31 overflows int.
- x & -x relies on two's complement and is the basis of Fenwick trees.

## strings

### T-STR-01

**KMP prefix function**

*When:* Substring search in O(n+m); shortest repeating unit; palindrome prefix.

```cpp
vector<int> buildLPS(const string& p) {           // lps[i] = longest proper prefix = suffix
    vector<int> lps(p.size(), 0);
    for (int i = 1, len = 0; i < (int)p.size(); ) {
        if (p[i] == p[len]) lps[i++] = ++len;
        else if (len)       len = lps[len-1];     // fall back, do NOT restart
        else                lps[i++] = 0;
    }
    return lps;
}
```

- The fallback `len = lps[len-1]` is what keeps it O(n) instead of O(nm).
- n - lps[n-1] is the shortest repeating unit length - solves Repeated Substring Pattern.

### T-STR-02

**Expand around centre**

*When:* Longest palindromic substring; counting palindromic substrings.

```cpp
int countPalindromes(const string& s) {
    int n = s.size(), total = 0;
    auto expand = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) { total++; l--; r++; }
    };
    for (int i = 0; i < n; i++) { expand(i, i); expand(i, i + 1); }  // odd, then even
    return total;
}
```

- 2n-1 centres: n single characters plus n-1 gaps. Forgetting the even case is the usual bug.
- O(n^2) time, O(1) space - beats the O(n^2) space DP. Manacher is O(n) but rarely required.

### T-STR-03

**Rolling hash (Rabin-Karp)**

*When:* Substring search, duplicate substring detection, repeated DNA sequences.

```cpp
// h = (h * p + c) mod m ; slide by removing the leading term
long long BASE = 131, MOD = 1e9 + 7;
vector<int> rabinKarp(const string& s, const string& pat) {
    int n = s.size(), m = pat.size();
    if (m > n) return {};
    long long ph = 0, sh = 0, pw = 1;
    for (int i = 0; i < m; i++) {
        ph = (ph * BASE + pat[i]) % MOD;
        sh = (sh * BASE + s[i])   % MOD;
        if (i) pw = pw * BASE % MOD;              // BASE^(m-1)
    }
    vector<int> hits;
    for (int i = 0; ; i++) {
        if (ph == sh && s.compare(i, m, pat) == 0) hits.push_back(i);   // verify!
        if (i + m >= n) break;
        sh = ((sh - s[i] * pw % MOD + MOD * MOD) % MOD * BASE + s[i+m]) % MOD;
    }
    return hits;
}
```

- ALWAYS verify a hash hit with a real comparison - collisions exist.
- Use two independent moduli when verification is too expensive.

## greedy

### T-GREEDY-01

**Interval scheduling**

*When:* Maximum non-overlapping intervals; minimum removals; arrow shots.

```cpp
// Sort by END. Taking the earliest-ending interval always leaves the most room.
int maxNonOverlapping(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b){ return a[1] < b[1]; });
    int count = 0; long long end = LLONG_MIN;
    for (auto& i : iv) if (i[0] >= end) { count++; end = i[1]; }
    return count;
}
```

- Sort by END for scheduling. Sort by START for merging. Choosing the key IS the algorithm.
- Exchange argument proves it: swapping in the earliest-ending interval never hurts.

### T-GREEDY-02

**Interval merging**

*When:* Merge overlapping intervals; insert an interval; find free gaps.

```cpp
vector<vector<int>> merge(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end());                   // by START
    vector<vector<int>> res;
    for (auto& i : iv)
        if (!res.empty() && i[0] <= res.back()[1]) res.back()[1] = max(res.back()[1], i[1]);
        else res.push_back(i);
    return res;
}
```

- `max` on the merge is required - a later interval may be fully contained.
- Use `<` instead of `<=` if touching intervals should NOT merge.

### T-GREEDY-03

**Sweep line / difference array**

*When:* Minimum platforms, car pooling, meeting rooms, range updates.

```cpp
bool carPooling(vector<vector<int>>& trips, int capacity) {
    map<int,int> delta;                           // ordered by position
    for (auto& t : trips) { delta[t[1]] += t[0]; delta[t[2]] -= t[0]; }
    int cur = 0;
    for (auto& [pos, d] : delta) { cur += d; if (cur > capacity) return false; }
    return true;
}
```

- Convert each interval into +1 at the start and -1 at the end, then prefix-sum.
- O(n log n) with a map, or O(range) with an array when coordinates are bounded.

### T-GREEDY-04

**Reachability greedy**

*When:* Jump game, gas station, minimum refuelling.

```cpp
bool canJump(vector<int>& a) {
    int reach = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (i > reach) return false;              // unreachable gap
        reach = max(reach, i + a[i]);
    }
    return true;
}
int jumpII(vector<int>& a) {                      // fewest jumps - BFS by levels
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i + 1 < (int)a.size(); i++) {
        farthest = max(farthest, i + a[i]);
        if (i == curEnd) { jumps++; curEnd = farthest; }   // level boundary
    }
    return jumps;
}
```

- Jump II is implicit BFS: curEnd marks the end of the current level.

## binary-trees

### T-TREE-01

**DFS traversals**

*When:* Preorder, inorder, postorder - recursive and iterative.

```cpp
void inorder(TreeNode* r, vector<int>& out) {
    if (!r) return;
    inorder(r->left, out); out.push_back(r->val); inorder(r->right, out);
}
// Iterative inorder - the one interviewers ask for
vector<int> inorderIterative(TreeNode* root) {
    vector<int> out; stack<TreeNode*> st; TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }   // dive left
        cur = st.top(); st.pop();
        out.push_back(cur->val);
        cur = cur->right;
    }
    return out;
}
```

- Inorder on a BST yields sorted order - that single fact solves a dozen problems.
- Iterative postorder: do preorder as root-right-left, then reverse.

### T-TREE-02

**BFS level order**

*When:* Anything phrased per level: views, widths, zigzag, minimum depth.

```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> res;
    if (!root) return res;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = q.size();                        // FIX the size before the loop
        vector<int> level;
        for (int i = 0; i < sz; i++) {
            TreeNode* n = q.front(); q.pop();
            level.push_back(n->val);
            if (n->left)  q.push(n->left);
            if (n->right) q.push(n->right);
        }
        res.push_back(level);
    }
    return res;
}
```

- Capturing `q.size()` before the inner loop is what separates the levels.
- Right view = last of each level. Left view = first. Zigzag = reverse alternate levels.

### T-TREE-03

**Bottom-up return value**

*When:* Height, balance, diameter, max path sum - compute a child value, update a global.

```cpp
int best = INT_MIN;
int dfs(TreeNode* r) {                            // returns: best DOWNWARD path from r
    if (!r) return 0;
    int l = max(0, dfs(r->left));                 // clamp at 0 - a negative branch is skipped
    int rt = max(0, dfs(r->right));
    best = max(best, r->val + l + rt);            // THROUGH r: both children, not returnable
    return r->val + max(l, rt);                   // UP from r: only one child
}
```

- The split between 'answer through this node' and 'value returned upward' is the pattern.
- Diameter, max path sum and balanced-check are all this template with different bodies.

### T-TREE-04

**Construct from traversals**

*When:* Rebuild a tree from preorder+inorder or inorder+postorder.

```cpp
unordered_map<int,int> pos;                       // value -> index in inorder
TreeNode* build(vector<int>& pre, int& p, int l, int r) {
    if (l > r) return nullptr;
    TreeNode* root = new TreeNode(pre[p++]);      // preorder gives the root
    int m = pos[root->val];                       // inorder splits the children
    root->left  = build(pre, p, l, m - 1);
    root->right = build(pre, p, m + 1, r);
    return root;
}
```

- The hash map turns the O(n) index search into O(1), making the whole build O(n).
- Postorder version: consume from the END and build RIGHT before LEFT.

## bst

### T-BST-01

**BST search and modify**

*When:* Insert, delete, validate, kth smallest - exploit the ordering invariant.

```cpp
bool validate(TreeNode* r, long lo, long hi) {    // bounds, not just parent comparison
    if (!r) return true;
    if (r->val <= lo || r->val >= hi) return false;
    return validate(r->left, lo, r->val) && validate(r->right, r->val, hi);
}
TreeNode* deleteNode(TreeNode* r, int key) {
    if (!r) return nullptr;
    if (key < r->val) r->left  = deleteNode(r->left,  key);
    else if (key > r->val) r->right = deleteNode(r->right, key);
    else {
        if (!r->left)  return r->right;
        if (!r->right) return r->left;
        TreeNode* s = r->right;                   // inorder successor
        while (s->left) s = s->left;
        r->val = s->val;
        r->right = deleteNode(r->right, s->val);
    }
    return r;
}
```

- Validation needs a RANGE, not a parent comparison - that is the classic wrong answer.
- Use `long` bounds, or a node holding INT_MIN breaks it.
- kth smallest = inorder traversal with an early stop at k.

## graphs

### T-GRAPH-01

**Grid DFS / flood fill**

*When:* Islands, regions, enclaves, connected areas in a matrix.

```cpp
int dfs(vector<vector<char>>& g, int i, int j) {
    if (i < 0 || j < 0 || i >= (int)g.size() || j >= (int)g[0].size() || g[i][j] != '1')
        return 0;
    g[i][j] = '0';                                // sink it - doubles as the visited mark
    return 1 + dfs(g,i+1,j) + dfs(g,i-1,j) + dfs(g,i,j+1) + dfs(g,i,j-1);
}
int numIslands(vector<vector<char>>& g) {
    int n = 0;
    for (int i = 0; i < (int)g.size(); i++)
      for (int j = 0; j < (int)g[0].size(); j++)
        if (g[i][j] == '1') { dfs(g, i, j); n++; }
    return n;
}
```

- O(m*n): every cell is visited once.
- Recursion can overflow on a 1000x1000 all-land grid - use an explicit stack or BFS.
- Boundary-first DFS solves Surrounded Regions and Number of Enclaves.

### T-GRAPH-02

**BFS shortest path on unweighted graphs**

*When:* Fewest steps, minimum moves, multi-source spread.

```cpp
int shortestPath(vector<vector<int>>& adj, int src, int dst) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q; q.push(src); dist[src] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == dst) return dist[u];
        for (int v : adj[u])
            if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return -1;
}
// MULTI-SOURCE: push every source at distance 0 before the loop starts.
// Rotting Oranges, 01-Matrix, As Far From Land As Possible are all this.
```

- BFS gives shortest path ONLY when every edge has the same weight.
- Mark visited when ENQUEUING, not when dequeuing, or nodes enter the queue repeatedly.

### T-GRAPH-03

**Topological sort (Kahn)**

*When:* Ordering with prerequisites; cycle detection in a directed graph.

```cpp
vector<int> topoSort(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};   // short => cycle
}
```

- The length check IS the cycle detection - no separate pass needed.
- Use a priority_queue instead for the lexicographically smallest valid order.
- Course Schedule I asks only whether order.size() == n.

### T-GRAPH-04

**Dijkstra**

*When:* Shortest path with non-negative weights.

```cpp
vector<long long> dijkstra(int n, vector<vector<pair<int,int>>>& adj, int src) {
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>,
                   greater<>> pq;                 // min-heap on distance
    dist[src] = 0; pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;                // stale entry - skip
        for (auto [v, w] : adj[u])
            if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }
    }
    return dist;
}
```

- O((V + E) log V). The stale-entry check replaces a decrease-key operation.
- FAILS on negative weights - use Bellman-Ford, O(V*E), which also detects negative cycles.
- Variants only change the relaxation: max-probability, minimum-effort, k-stops.

### T-GRAPH-05

**Disjoint Set Union**

*When:* Connected components, cycle detection in undirected graphs, Kruskal's MST.

```cpp
struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }   // path compression
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                 // already joined => this edge is a cycle
        if (r[a] < r[b]) swap(a, b);
        p[b] = a;
        if (r[a] == r[b]) r[a]++;                 // union by rank
        return true;
    }
};
```

- Path compression plus union by rank gives O(alpha(n)) per operation - effectively O(1).
- `unite` returning false is the cycle test used by Redundant Connection and Kruskal.
- For grids, map (i,j) to i*cols + j.

### T-GRAPH-06

**Kruskal MST**

*When:* Minimum spanning tree / minimum cost to connect everything.

```cpp
long long kruskal(int n, vector<array<int,3>>& edges) {   // {w, u, v}
    sort(edges.begin(), edges.end());
    DSU d(n);
    long long cost = 0; int used = 0;
    for (auto& [w, u, v] : edges)
        if (d.unite(u, v)) { cost += w; if (++used == n - 1) break; }
    return used == n - 1 ? cost : -1;             // -1 => graph is disconnected
}
```

- O(E log E), dominated by the sort.
- Prim's is O(E log V) with a heap and is better on dense graphs.

### T-GRAPH-07

**Cycle detection in a directed graph (colours)**

*When:* Detect cycles, find safe states, validate a DAG via DFS.

```cpp
// 0 = unvisited, 1 = in current path, 2 = fully done
bool hasCycle(int u, vector<vector<int>>& adj, vector<int>& col) {
    col[u] = 1;
    for (int v : adj[u]) {
        if (col[v] == 1) return true;             // back edge into the current path
        if (col[v] == 0 && hasCycle(v, adj, col)) return true;
    }
    col[u] = 2;
    return false;
}
```

- Colour 1 versus 2 is the crux: a visited node is only a cycle if it is on the CURRENT path.
- For undirected graphs, track the parent instead and ignore the edge back to it.

## dp

### T-DP-01

**1D DP**

*When:* Climbing stairs, house robber, decode ways - state depends on a few previous indices.

```cpp
int rob(vector<int>& a) {
    int prev2 = 0, prev1 = 0;                     // rolled - O(1) space
    for (int x : a) {
        int cur = max(prev1, prev2 + x);          // skip this house, or take it
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
}
```

- Define the state in words first: 'best total considering the first i houses'.
- If only the last k states are read, roll the array down to k variables.

### T-DP-02

**2D grid DP**

*When:* Unique paths, minimum path sum, maximal square.

```cpp
int minPathSum(vector<vector<int>>& g) {
    int m = g.size(), n = g[0].size();
    vector<int> dp(n, INT_MAX);
    dp[0] = 0;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++) {
            if (j > 0) dp[j] = min(dp[j], dp[j-1]);   // from the left
            dp[j] += g[i][j];                          // dp[j] still holds the row above
        }
    return dp[n-1];
}
```

- A single rolling row is enough whenever transitions read only up and left.
- Obstacles set the cell to 0 or infinity rather than needing a branch.

### T-DP-03

**Knapsack / subset sum**

*When:* Partition, target sum, coin change, ones-and-zeroes.

```cpp
// 0/1 knapsack - iterate capacity DOWNWARD so each item is used once
bool canPartition(vector<int>& a, int target) {
    vector<bool> dp(target + 1, false);
    dp[0] = true;
    for (int x : a)
        for (int c = target; c >= x; c--)         // DOWNWARD
            dp[c] = dp[c] || dp[c - x];
    return dp[target];
}
// UNBOUNDED (unlimited reuse) - iterate UPWARD
int coinChange(vector<int>& coins, int amt) {
    vector<int> dp(amt + 1, INT_MAX);
    dp[0] = 0;
    for (int c : coins)
        for (int v = c; v <= amt; v++)            // UPWARD
            if (dp[v-c] != INT_MAX) dp[v] = min(dp[v], dp[v-c] + 1);
    return dp[amt] == INT_MAX ? -1 : dp[amt];
}
```

- Loop DIRECTION is the entire difference between 0/1 and unbounded. Nothing else changes.
- Combinations vs permutations: coin loop outside = combinations, inside = permutations.

### T-DP-04

**DP on two strings**

*When:* LCS, edit distance, distinct subsequences, wildcard matching.

```cpp
int lcs(string& a, string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a[i-1] == b[j-1]) ? dp[i-1][j-1] + 1
                                          : max(dp[i-1][j], dp[i][j-1]);
    return dp[n][m];
}
```

- dp[i][j] = answer for the first i of a and first j of b. 1-indexed avoids edge cases.
- Edit distance: same shape, min of three predecessors plus one.
- Longest palindromic subsequence = LCS of s and reverse(s).

### T-DP-05

**DP on stocks (state machine)**

*When:* Buy/sell with transaction limits, cooldowns, or fees.

```cpp
// At most k transactions
int maxProfit(int k, vector<int>& p) {
    vector<int> buy(k + 1, INT_MIN), sell(k + 1, 0);
    for (int price : p)
        for (int t = 1; t <= k; t++) {
            buy[t]  = max(buy[t],  sell[t-1] - price);   // hold after t-1 completed sells
            sell[t] = max(sell[t], buy[t] + price);
        }
    return sell[k];
}
```

- Model it as states (holding / not holding) and transitions, not as a search.
- Cooldown adds a third state. A fee is subtracted at the sell transition.
- Unlimited transactions collapse to summing every positive daily difference.

### T-DP-06

**LIS**

*When:* Longest increasing subsequence, and everything that reduces to it.

```cpp
// O(n log n): tails[i] = smallest possible tail of an increasing subsequence of length i+1
int lengthOfLIS(vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
```

- `tails` is NOT the actual subsequence - only its length is meaningful.
- upper_bound instead of lower_bound gives the longest NON-DECREASING version.
- Russian Doll Envelopes: sort by width ascending, height DESCENDING, then LIS on height.

### T-DP-07

**Interval / MCM partition DP**

*When:* Burst balloons, matrix chain, min cost to cut a stick, palindrome partitioning II.

```cpp
int solve(int i, int j, vector<int>& a, vector<vector<int>>& memo) {
    if (i > j) return 0;
    if (memo[i][j] != -1) return memo[i][j];
    int best = INT_MAX;
    for (int k = i; k <= j; k++)                  // k = the LAST operation, not the first
        best = min(best, solve(i, k-1, a, memo) + solve(k+1, j, a, memo) + cost(i, j, k));
    return memo[i][j] = best;
}
```

- O(n^3): n^2 states, each O(n) to fill. Constraints near n <= 500 are the signal.
- For Burst Balloons, think of k as the LAST balloon burst in the range - that makes the neighbours well defined.

### T-DP-08

**Game DP (minimax over a range)**

*When:* Two players alternate optimally; stone games, prediction games.

```cpp
// dp[i][j] = best score DIFFERENCE the current player can force on a[i..j]
int solve(int i, int j, vector<int>& a, vector<vector<int>>& memo) {
    if (i > j) return 0;
    if (memo[i][j] != INT_MIN) return memo[i][j];
    int takeLeft  = a[i] - solve(i + 1, j, a, memo);   // subtract: opponent's turn next
    int takeRight = a[j] - solve(i, j - 1, a, memo);
    return memo[i][j] = max(takeLeft, takeRight);
}
// Player 1 wins iff solve(0, n-1) >= 0
```

- Store the DIFFERENCE, not two separate scores - it halves the state and removes the whose-turn dimension.
- The minus sign is the whole trick: the opponent plays optimally against you.

### T-DP-09

**DP with binary search on a sorted dimension**

*When:* Weighted interval scheduling, longest chains with a predecessor lookup.

```cpp
// Jobs sorted by end time. dp[i] = best profit considering the first i jobs.
int jobScheduling(vector<array<int,3>>& jobs) {     // {end, start, profit}
    sort(jobs.begin(), jobs.end());
    int n = jobs.size();
    vector<int> dp(n + 1, 0), ends(n);
    for (int i = 0; i < n; i++) ends[i] = jobs[i][0];
    for (int i = 0; i < n; i++) {
        // latest job ending at or before this job's start
        int p = upper_bound(ends.begin(), ends.begin() + i, jobs[i][1]) - ends.begin();
        dp[i + 1] = max(dp[i], dp[p] + jobs[i][2]);  // skip, or take
    }
    return dp[n];
}
```

- Sorting by END is what makes the predecessor a prefix, so binary search applies.
- O(n log n) instead of the O(n^2) scan for a compatible predecessor.

## tries

### T-TRIE-01

**Trie**

*When:* Prefix search, autocomplete, word dictionaries, maximum XOR.

```cpp
struct Trie {
    Trie* ch[26] = {};
    bool end = false;
    void insert(const string& w) {
        Trie* n = this;
        for (char c : w) {
            if (!n->ch[c-'a']) n->ch[c-'a'] = new Trie();
            n = n->ch[c-'a'];
        }
        n->end = true;
    }
    bool search(const string& w, bool prefixOnly = false) {
        Trie* n = this;
        for (char c : w) { if (!n->ch[c-'a']) return false; n = n->ch[c-'a']; }
        return prefixOnly || n->end;
    }
};
```

- Insert and search are O(L) in the word length, independent of dictionary size.
- Space is O(total characters * 26); a map<char,Trie*> is leaner for sparse alphabets.
- A BINARY trie over 32 bits solves Maximum XOR by greedily taking the opposite bit.

## math

### T-MATH-01

**Digit extraction**

*When:* Reverse, sum digits, count digits, palindrome checks without strings.

```cpp
int reverseSafe(int x) {
    int rev = 0;
    while (x) {
        int d = x % 10; x /= 10;
        if (rev > INT_MAX/10 || (rev == INT_MAX/10 && d > 7)) return 0;      // overflow
        if (rev < INT_MIN/10 || (rev == INT_MIN/10 && d < -8)) return 0;
        rev = rev * 10 + d;
    }
    return rev;
}
```

- Check BEFORE the multiply - after it, the behaviour is already undefined.
- 7 and 8 come from the last digits of INT_MAX and INT_MIN.

### T-MATH-02

**Floyd cycle detection on values**

*When:* Happy Number, Find the Duplicate - when a value maps to exactly one successor.

```cpp
bool isHappy(int n) {
    auto next = [](int x) { int s = 0; while (x) { s += (x%10)*(x%10); x /= 10; } return s; };
    int slow = n, fast = next(n);
    while (fast != 1 && slow != fast) { slow = next(slow); fast = next(next(fast)); }
    return fast == 1;
}
```

- Any deterministic single-successor function forms a rho shape: a tail into a cycle.
- O(1) space, versus O(k) for a seen-set.

### T-MATH-03

**Sieve and factor counting**

*When:* All primes up to n; counting a prime factor across a factorial.

```cpp
vector<bool> sieve(int n) {
    vector<bool> p(n + 1, true); p[0] = p[1] = false;
    for (long long i = 2; i * i <= n; i++)
        if (p[i]) for (long long j = i * i; j <= n; j += i) p[j] = false;   // start at i*i
    return p;
}
int trailingZeroes(int n) {                       // Legendre: count factors of 5
    int c = 0;
    while (n) { n /= 5; c += n; }
    return c;
}
```

- Sieve is O(n log log n). Starting at i*i is safe because smaller multiples are already marked.
- Use `n /= 5` iteratively, never pow(5,i) - that overflows and carries float error.

### T-MATH-04

**Binary exponentiation**

*When:* a^b mod m for huge b; modular inverse when m is prime.

```cpp
long long power(long long a, long long b, long long mod) {
    long long res = 1; a %= mod;
    while (b > 0) {
        if (b & 1) res = res * a % mod;
        a = a * a % mod;
        b >>= 1;
    }
    return res;
}
long long modInverse(long long a, long long p) { return power(a, p - 2, p); }  // p prime
```

- O(log b). The inverse identity is Fermat's little theorem: a^(p-1) = 1 mod p.
- 10^9+7 is chosen because it is prime, fits in 32 bits, and its square fits in 64.

### T-MATH-05

**Block counting**

*When:* Locate the nth item in a huge implicit sequence without building it.

```cpp
// Digits: 9 one-digit numbers, 90 two-digit, 900 three-digit...
int findNthDigit(int n) {
    long long len = 1, count = 9, start = 1;
    while (n > len * count) { n -= len * count; len++; count *= 10; start *= 10; }
    start += (n - 1) / len;                       // which number
    string s = to_string(start);
    return s[(n - 1) % len] - '0';                // which digit inside it
}
```

- Use `n-1` consistently once inside the block so division and modulo both land right.

### T-MATH-06

**Inclusion-exclusion with clamping**

*When:* Overlapping areas, counting multiples, union sizes.

```cpp
long long totalArea(int ax1,int ay1,int ax2,int ay2, int bx1,int by1,int bx2,int by2) {
    long long A = (long long)(ax2-ax1) * (ay2-ay1);
    long long B = (long long)(bx2-bx1) * (by2-by1);
    long long w = max(0, min(ax2,bx2) - max(ax1,bx1));    // clamp encodes "disjoint"
    long long h = max(0, min(ay2,by2) - max(ay1,by1));
    return A + B - w * h;
}
```

- Clamping at zero replaces an explicit disjointness branch.
- Beyond two sets, inclusion-exclusion is exponential - switch to a sweep line.
