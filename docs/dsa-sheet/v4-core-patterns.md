---
phase: V4
title: Core Patterns
days: 22-29
problems: 40
generated: 2026-09-17
---

# V4 — Core Patterns

**Days 22–29** &nbsp;·&nbsp; **40 problems** &nbsp;·&nbsp; The remaining high-yield patterns across arrays, binary search, strings, linked lists, stacks, windows, heaps, greedy and bits.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Arrays, prefix sums and intervals

[Striver: Arrays](https://www.youtube.com/watch?v=n60Dn0UsbEk)

<!-- theory-id:t-arrays -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** An array is a contiguous block of memory holding elements of one type, so
element i sits at `base + i * sizeof(T)` and is reachable in O(1). Contiguity is the whole
story: it gives random access and excellent cache behaviour, and it makes insertion in the
middle O(n) because everything after the insertion point must shift.

**The techniques that live on arrays.**

*Prefix sums.* Precompute `P[i] = a[0] + ... + a[i-1]`. Then the sum of any range
`a[l..r]` is `P[r+1] - P[l]` in O(1), after O(n) setup. This converts repeated range
queries from O(n) each into O(1) each.

```cpp
vector<long long> P(n + 1, 0);
for (int i = 0; i < n; i++) P[i+1] = P[i] + a[i];
long long rangeSum = P[r+1] - P[l];
```

Sizing at n+1 with `P[0] = 0` removes every boundary special case. Use `long long`:
10⁵ values of 10⁹ overflow `int`.

*Difference arrays.* The mirror image. To apply many range updates and read once, record
`d[l] += v` and `d[r+1] -= v` per update in O(1), then prefix-sum `d` once at the end.

*Kadane's algorithm.* Maximum subarray sum in one pass. At each index, either extend the
current subarray or start fresh — whichever is larger.

```cpp
int maxSubArray(vector<int>& a) {
    int cur = a[0], best = a[0];
    for (int i = 1; i < (int)a.size(); i++) {
        cur = max(a[i], cur + a[i]);          // start fresh, or extend
        best = max(best, cur);
    }
    return best;
}
```

*Intervals.* Two rules cover almost everything. **Sort by start** to merge overlapping
intervals. **Sort by end** to schedule the maximum number of non-overlapping intervals.
Which key you sort by is the algorithm.

*Matrix manipulation.* Rotation by 90° is transpose then reverse each row. Spiral
traversal is four boundary pointers shrinking inward. Setting rows and columns to zero in
O(1) space uses the first row and column as marker storage.

**Complexity of the common operations.**

| Operation | Cost |
|---|---|
| index access | O(1) |
| append (amortised) | O(1) |
| insert/erase in the middle | O(n) |
| search unsorted | O(n) |
| search sorted | O(log n) |
| range sum with prefix array | O(1) after O(n) build |
| range update with difference array | O(1) per update, O(n) finalise |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why prefix sums work and when they do not.** The requirement is an *invertible*
aggregate: to recover the contribution of a range from two endpoints you must be able to
subtract. Sums qualify. XOR qualifies, being its own inverse. Counts modulo m qualify.
Products do **not**, because a zero anywhere destroys invertibility. Minimum and maximum
do not either, which is why range-min queries need a sparse table or segment tree rather
than a prefix array.

**Prefix sums with a hash map.** Counting subarrays whose sum is k reduces to counting
pairs (j, i) with `P(i) - P(j) = k`, i.e. `P(j) = P(i) - k`. A map from prefix value to
occurrence count answers each query in O(1), giving O(n) overall. Seeding the map with
`{0: 1}` for the empty prefix is mandatory — without it, every subarray starting at index
0 is missed.

This is the correct technique whenever values may be negative. A sliding window is invalid
there, because the window technique requires that extending moves the aggregate
monotonically so that shrinking is a valid correction; with negatives it does not.

**Kadane's correctness.** Let `cur(i)` be the maximum sum of a subarray ending exactly at
i. Then `cur(i) = max(a[i], cur(i-1) + a[i])`: either the optimal subarray ending at i is
just `a[i]`, or it extends the optimal one ending at i-1. It cannot extend a *suboptimal*
one, because replacing it with the optimal would improve the total. The global answer is
`max over i of cur(i)`. Note this is really 1D dynamic programming with a rolled state.

For all-negative arrays, initialising `best` to `0` is wrong and returns 0; initialise to
`a[0]`.

**Boyer-Moore voting.** For a value occurring more than n/2 times, pair each occurrence of
it against one occurrence of anything else. Since its count exceeds n/2, the other elements
cannot exhaust it, so at least one occurrence survives. The counter implements this pairing.
The generalisation to "more than n/k times" keeps k-1 candidates, because at most k-1 such
values can exist. A verification pass is mandatory when existence is not guaranteed.

**Longest Consecutive Sequence in O(n).** The sort-based solution is O(n log n). The linear
one puts everything in a hash set, then starts a count only at values `x` for which `x-1`
is absent — those are sequence heads. Every element is visited at most twice overall, once
as a candidate head and once during exactly one run, so the nested loop is O(n) despite
appearances.

**Dutch National Flag.** Three-way partitioning in one pass with three pointers. The
invariant is that `[0, low)` holds 0s, `[low, mid)` holds 1s, and `(high, end]` holds 2s.
The subtlety is that on a swap with `high`, `mid` must **not** advance, because the value
swapped in from the right has not been examined.

**Next Permutation.** Scan from the right for the first index i with `a[i] < a[i+1]` — the
suffix after it is non-increasing and therefore maximal. Swap `a[i]` with the smallest
element to its right that still exceeds it, then reverse the suffix to make it minimal.
Reversing, not sorting, is correct precisely because the suffix was already non-increasing.

**Rotation in O(1) space.** Reverse the whole array, then reverse the first k, then reverse
the rest. Each reversal is O(n) so the total is O(n) with no extra memory. The juggling
algorithm using GCD cycles achieves the same bound with one pass but is much easier to get
wrong.

**The grilling chain.**

- *Range sum queries with updates in between?* — A prefix array is now O(n) per update.
  Use a Fenwick tree for O(log n) both ways.
- *Why does Kadane fail on all-negative input with `best = 0`?* — It permits the empty
  subarray, which the problem usually forbids.
- *Maximum product subarray instead of sum?* — Track both maximum and minimum, because a
  negative times the running minimum can become the new maximum.
- *Count subarrays with sum k where values may be negative.* — Prefix sums with a hash map,
  and state why sliding window is invalid.
- *Rotate a matrix without extra space.* — Transpose then reverse rows; or four-way cyclic
  swap of each ring.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Prefix sums**

You write down your running total spend at the end of each day, not each day's spend.
Someone asks what you spent between the 8th and the 15th. You do not re-add anything —
you subtract the total on the 7th from the total on the 15th.

One subtraction, regardless of how many days are in between. That is the whole idea.

**Kadane's algorithm**

You are walking along a road picking up and dropping money, and you may start and stop
wherever you like. At each step you ask one question: is what I am carrying still helping
me, or would I be better off dropping it and starting fresh here?

The moment your running total goes negative, carrying it forward is worse than starting
over. So you drop it.

**Why sort by end for scheduling**

You want to attend the most events in one day. Picking the event that finishes earliest
always leaves the largest possible window for everything after it.

Picking by start time is what feels natural and is wrong — a talk starting at 9am and
running until 6pm starts earliest and costs you the entire day.

**Difference arrays**

Instead of noting attendance for every student every hour, the warden notes only when
someone enters and when someone leaves.

To know how many people are in the hostel at any moment you add up the entries and
subtract the exits up to that point. Recording changes rather than states is far cheaper
when the changes are rare.

</details>

### Binary search

[Striver: BS-1](https://www.youtube.com/watch?v=MHf6awe89xw)

<!-- theory-id:t-binary-search -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Binary search repeatedly halves a search space by testing its midpoint and
discarding the half that cannot contain the answer. Each test eliminates half the
remaining candidates, so n candidates are resolved in log₂n tests: a billion in thirty.

Its precondition is not "the array is sorted" but something more general: **the search
space must be monotone with respect to the predicate being tested.** A sorted array is
just the most common instance of that.

**Three forms you must know cold.**

*Exact match.*
```cpp
int search(vector<int>& a, int t) {
    int l = 0, r = a.size() - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;               // never (l+r)/2
        if (a[m] == t) return m;
        a[m] < t ? l = m + 1 : r = m - 1;
    }
    return -1;
}
```

*Boundary search — lower and upper bound.* Half-open `[l, r)` removes most off-by-ones.
```cpp
int lowerBound(vector<int>& a, int x) {        // first index with a[i] >= x
    int l = 0, r = a.size();
    while (l < r) { int m = l + (r-l)/2; if (a[m] >= x) r = m; else l = m + 1; }
    return l;
}
```
`upperBound` is the same with `>` instead of `>=`. The count of x is
`upperBound(x) - lowerBound(x)`, and first/last occurrence follow immediately.

*Binary search on the answer.* When the array is not what is sorted, but feasibility is
monotone in some candidate value.
```cpp
long long minimumFeasible(long long lo, long long hi) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (feasible(mid)) hi = mid;           // works — try smaller
        else               lo = mid + 1;
    }
    return lo;
}
```
Koko Eating Bananas: `feasible(speed)` is "total hours at this speed ≤ h", monotone
because a higher speed never takes longer. Capacity to Ship Packages, Split Array Largest
Sum, Aggressive Cows and Minimum Days to Make Bouquets are all this template with a
different `feasible`.

**Rotated arrays.** After rotation the array is not sorted, but **one half of any split is
always sorted**. Identify which by comparing `a[l]` with `a[m]`, then test whether the
target lies inside that sorted half; if it does, search there, otherwise search the other.

**2D matrices.** If rows are sorted and each row starts after the previous ends, the matrix
is one sorted array — index it as `g[mid / n][mid % n]` and run a standard search in
O(log(mn)). If rows and columns are individually sorted but not globally, start at the
top-right corner: moving left decreases, moving down increases, so each step eliminates a
full row or column in O(m + n).

**Complexity.** O(log n) time and O(1) space iteratively; O(log n) stack recursively.
Binary search on the answer is O(log(range) × cost of `feasible`).

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**The overflow bug.** `(l + r) / 2` overflows signed int when both bounds are large.
`l + (r - l) / 2` is algebraically identical and cannot overflow. This defect shipped in
Java's standard library binary search for nine years and in JDK's `Arrays.binarySearch`
specifically — it is a standard interview probe.

**Why half-open intervals reduce bugs.** With `[l, r)` the loop condition is `l < r`, the
invariant is "the answer lies in `[l, r)`", and termination gives `l == r` which is
directly the answer. With closed `[l, r]` you need `l <= r`, and `r = m - 1` versus
`r = m` is a live decision at every branch. Pick one convention and never mix them.

**Monotonicity is the real precondition.** `feasible` must be a step function: false for
everything below a threshold and true for everything above, or the reverse. If it
oscillates, binary search returns an arbitrary boundary rather than the answer. Before
writing the loop, state the predicate in words and convince yourself it never flips back.

**Choosing `lo` and `hi` for answer-space search.** `hi` must be feasible (otherwise no
answer exists in range) and `lo` must be at or below the true answer. For Koko, `lo = 1`
and `hi = max(piles)` — eating the largest pile per hour always finishes in `n` hours,
which is within any valid `h ≥ n`. Getting these bounds wrong is the most common failure,
not the loop itself.

**Rotated arrays with duplicates.** When `a[l] == a[m] == a[r]`, neither half can be
identified as sorted — consider `[1,1,1,0,1]`. The only correct action is to shrink both
ends by one and continue, which degrades the worst case to O(n). This is unavoidable: an
adversary can hide the single distinguishing element anywhere.

**Find Peak Element in O(log n) on unsorted input.** This surprises people. Compare `a[m]`
with `a[m+1]`. If `a[m] < a[m+1]`, a peak must exist to the right — the sequence is rising
and must eventually fall or hit the boundary, which counts as a peak under the standard
`a[-1] = a[n] = -∞` convention. So you can always discard half even though the array has no
global order. The invariant is that the current range always contains a peak.

**Median of Two Sorted Arrays in O(log(min(m,n))).** Binary search on the *partition point*
of the smaller array. Choose `i` elements from A and `j = (m+n+1)/2 - i` from B. The
partition is correct when `A[i-1] <= B[j]` and `B[j-1] <= A[i]`. Use ±∞ sentinels for the
out-of-range cases. Searching the smaller array bounds the complexity and avoids invalid `j`.

**Kth element of two sorted arrays** is the same partition idea with `i + j = k`.

**Where binary search cannot be applied.** It needs O(1) access to the midpoint, so on a
linked list it degenerates to O(n) traversal per step, giving O(n log n) — worse than a
linear scan. The presence of random access is part of the precondition.

**The grilling chain.**

- *Why `l + (r-l)/2`?* — Overflow avoidance; cite the Java bug.
- *How do you know the answer space is monotone?* — State the predicate and argue it never
  flips back.
- *Rotated array with duplicates — still O(log n)?* — No, O(n) worst case, and explain why.
- *Find a peak in an unsorted array in O(log n).* — The rising-slope invariant.
- *Binary search on a linked list?* — O(n log n), worse than linear; explain the access cost.
- *First and last occurrence in one pass?* — Two boundary searches, or one search plus two
  linear expansions, which is O(n) if all elements are equal.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Binary search**

You are looking for a name in a printed telephone directory. You do not start at page one.
You open the middle, see whether your name comes before or after, and throw away half the
book. Then you do it again.

Twenty or thirty openings and you have found one name among a million.

**Binary search on the answer**

You are buying a hostel water heater and want the smallest one that still gives everyone a
hot shower. You cannot compute the right size directly, but given any size you can check
whether it suffices.

So you guess the middle of the range and test it. Works? Try smaller. Fails? Try bigger.
You are searching the space of possible *answers*, not a list of heaters.

**Why one half of a rotated array is always sorted**

Take a sorted deck of cards and cut it once, moving the top portion to the bottom. There is
now exactly one place where the order breaks.

Cut the deck anywhere and look at the two halves: the break can only be in one of them. The
other half is still perfectly in order.

</details>

### Strings

[Striver: Strings](https://www.youtube.com/watch?v=NPy8P_2xi0U)

<!-- theory-id:t-strings -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A string is an array of characters, so every array technique applies —
two pointers, sliding windows, prefix structures, hashing. What is different is the small,
fixed alphabet, which makes counting arrays (`int cnt[26]`) both faster and genuinely O(1)
space, and the fact that substring operations copy.

**The recurring techniques.**

*Frequency counting.* Anagrams, permutations, character matching. Use `int cnt[26]` for
lowercase Latin and `int cnt[128]` for ASCII — both beat a hash map on constant factor and
cache behaviour.

*Two pointers.* Palindrome checks from both ends; reversal in place; comparing with skips.

*Sliding window.* Longest substring without repeats, longest with at most k distinct,
minimum window containing a target multiset. Strings are where sliding windows appear most.

*Expand around centre.* For palindromic substrings there are 2n−1 centres — n characters
and n−1 gaps between them. Expanding from each is O(n²) time and O(1) space, which beats
the O(n²)-space DP.

```cpp
int countPalindromes(const string& s) {
    int n = s.size(), total = 0;
    auto expand = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) { total++; l--; r++; }
    };
    for (int i = 0; i < n; i++) { expand(i, i); expand(i, i + 1); }
    return total;
}
```
Forgetting the even-length case (`expand(i, i+1)`) is the standard bug.

*Stack-based parsing.* Balanced brackets, nesting depth, expression evaluation, decoding.

**String building.** Repeated concatenation in a loop is O(n²) because each `+=` may
reallocate and copy. Reserve capacity up front, or build into a `vector<char>` and convert
once.

**Useful library calls.**
```cpp
s.substr(i, len);                 // O(len) — it COPIES
s.find(sub);                      // O(n*m) naive in libstdc++
stoi(s);  to_string(x);
isalnum(c); isdigit(c); tolower(c);
reverse(s.begin(), s.end());
sort(s.begin(), s.end());         // canonical form for anagram grouping
```

**Complexity of the standard operations.**

| Operation | Cost |
|---|---|
| index access | O(1) |
| `substr(i, len)` | O(len), allocates |
| concatenation | O(n + m) |
| comparison | O(min(n, m)) |
| `find` (naive) | O(n·m) |
| `find` (KMP) | O(n + m) |
| sort characters | O(n log n) |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**The hidden O(n³).** Two nested loops over indices with a `substr` inside is not O(n²):
```cpp
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++)
        check(s.substr(i, j - i + 1));      // this copy is O(j - i)
```
The copy makes it O(n³). Work with index pairs and compare in place, or use rolling hashes.

**KMP and the prefix function.** Naive search restarts at the next index after a mismatch,
re-examining characters already known to match, giving O(n·m). KMP precomputes
`lps[i]` = the length of the longest proper prefix of the pattern that is also a suffix of
`pattern[0..i]`. On a mismatch it shifts the pattern by `i - lps[i-1]` instead of 1, never
re-examining a text character, giving O(n + m).

```cpp
vector<int> buildLPS(const string& p) {
    vector<int> lps(p.size(), 0);
    for (int i = 1, len = 0; i < (int)p.size(); ) {
        if (p[i] == p[len]) lps[i++] = ++len;
        else if (len)       len = lps[len - 1];     // fall back, do NOT restart
        else                lps[i++] = 0;
    }
    return lps;
}
```
The `len = lps[len-1]` fallback is what preserves linearity. A useful corollary:
`n - lps[n-1]` is the length of the shortest repeating unit, which solves Repeated
Substring Pattern in one line.

**Rolling hashes and Rabin-Karp.** Treat the string as a number in base p modulo m:
`h = (h·p + c) mod m`. Sliding the window one position right costs O(1) — remove the
leading term, multiply, add the new character. Expected O(n + m) search. Always verify a
hash match with a real comparison, because collisions exist: by the birthday bound, 10⁵
hashes under a single 10⁹ modulus collide with probability around 0.5%. Two independent
moduli reduce that to negligible.

**Why sorting is a valid anagram canonical form, and when counting beats it.** Sorting maps
every anagram class to one representative in O(L log L) per word. Counting into a 26-length
signature does the same in O(L). For grouping many long words, counting wins; for short
words the constant factor makes sorting competitive.

**Longest Palindromic Substring.** Expand-around-centre is O(n²)/O(1). Manacher's algorithm
achieves O(n) by reusing previously computed palindrome radii through a mirror index, but it
is rarely required in interviews — knowing it exists and being able to name its bound is
usually sufficient.

**`atoi` and the parsing checklist.** String-to-integer conversion is a specification
problem rather than an algorithmic one: leading whitespace, an optional single sign, digits
until the first non-digit, clamping to `INT_MAX`/`INT_MIN` on overflow, and returning 0 for
input with no valid prefix. Detect overflow before the multiply, exactly as in Reverse
Integer.

**Unicode.** Every `cnt[26]` argument silently assumes a fixed small alphabet. With UTF-8, a
character may span multiple bytes, `s.size()` returns bytes rather than characters, and
reversing byte-wise corrupts the text. Asking about the character set is a legitimate and
well-regarded clarifying question.

**The grilling chain.**

- *Your solution looks O(n²) but uses `substr` — what is the real complexity?* — O(n³).
- *Search for a pattern in O(n + m).* — KMP; explain the lps fallback.
- *Why must a rolling-hash match be verified?* — Collisions; cite the birthday bound.
- *Longest palindromic substring in O(n)?* — Manacher; state the bound and the mirror idea.
- *What breaks with Unicode?* — Fixed-alphabet counting, byte-vs-character length, reversal.
- *Check if two strings are anagrams in O(1) space.* — A 26-length counter is O(1) only
  because the alphabet is fixed; say so explicitly.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Why substr is expensive**

Asking for a substring is not like pointing at a paragraph in a book. It is like
photocopying that paragraph onto a fresh sheet.

Point at it a thousand times and nothing happens. Photocopy it a thousand times and you
have spent the afternoon at the machine.

**The KMP prefix function**

You are matching a long password against a list, character by character, and you fail on
the ninth character. The naive reaction is to go back to the start and try again from the
second character.

But you already know what the first eight characters were. If the password's own beginning
reappears inside those eight, you can jump straight there instead of re-reading. The lps
table is just a note of where those internal repeats are.

**Expand around centre**

A palindrome is symmetric about its middle, like a rangoli pattern. So to find one, stand
at every possible centre and walk outwards in both directions until the pattern breaks.

The only catch is that the centre can be a single character, or the gap between two. Miss
the gaps and you find every odd-length palindrome and no even-length one.

</details>

### Linked lists

[Striver: LinkedList](https://www.youtube.com/watch?v=Nq7ok-OyEpg)

<!-- theory-id:t-linked-list -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A linked list stores each element in its own node alongside a pointer to
the next. Nodes are scattered in memory rather than contiguous, which is the source of
every trade-off: insertion and deletion at a known position are O(1) because only pointers
change, but accessing element i is O(n) because you must walk there, and cache behaviour is
poor because consecutive nodes are not adjacent in memory.

```cpp
struct ListNode { int val; ListNode* next; ListNode(int v) : val(v), next(nullptr) {} };
```

A doubly linked list adds a `prev` pointer, which makes backward traversal and O(1)
deletion-given-a-node possible at the cost of one extra pointer per node.

**The techniques.**

*Iterative reversal.* Three pointers, and the order matters.
```cpp
ListNode* reverse(ListNode* head) {
    ListNode *prev = nullptr, *cur = head;
    while (cur) {
        ListNode* nxt = cur->next;        // save before you destroy it
        cur->next = prev;
        prev = cur; cur = nxt;
    }
    return prev;
}
```

*Dummy head.* Any operation that might remove or replace the first node becomes uniform if
you prepend a sentinel.
```cpp
ListNode dummy(0); dummy.next = head;
// ... operate on dummy.next throughout ...
return dummy.next;
```
This single habit eliminates most head-edge-case bugs.

*Fast and slow pointers.* Advance one pointer by one and another by two.
- They meet if and only if there is a cycle.
- When fast reaches the end, slow is at the middle.
- Offsetting fast by k first puts slow k from the end.

*Floyd's cycle detection with entry point.* After the pointers meet, reset one to the head
and advance both one step at a time; they meet again exactly at the cycle entry.

**Common operations and their costs.**

| Operation | Singly linked | Array |
|---|---|---|
| access index i | O(n) | O(1) |
| insert/delete at head | O(1) | O(n) |
| insert/delete at tail | O(n), or O(1) with a tail pointer | O(1) amortised |
| insert/delete given a node pointer | O(1) | O(n) |
| search | O(n) | O(n) |
| memory overhead | one pointer per element | none |

**Sorting a linked list.** Merge sort is the right answer: it needs no random access, and
relinking rather than copying makes it O(1) extra space beyond recursion. Quick sort needs
O(n) to find a pivot and partitions awkwardly.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why Floyd's reset finds the cycle entry.** Let the tail before the cycle have length `k`
and the cycle have length `c`. When slow enters the cycle it has travelled `k`; fast has
travelled `2k`, so fast is `k` steps into the cycle. They meet after slow travels a further
`c - (k mod c)` steps, so the meeting point is `k mod c` steps *before* the entry, going
forward. A pointer starting at the head needs `k` steps to reach the entry; a pointer at
the meeting point also needs `k` steps (it travels `k mod c` to the entry, plus whole
loops). Hence both arrive together. This proof is a frequent follow-up.

**The cycle length** is found by holding one pointer at the meeting point and advancing the
other until they coincide again, counting steps.

**Why fast/slow finds the middle, and which middle.** With `while (fast && fast->next)`,
slow lands on the *second* middle for even lengths. With `while (fast->next && fast->next->next)`,
it lands on the first. Problems differ on which they want — Delete the Middle Node and
Palindrome Linked List disagree — so decide deliberately rather than by accident.

**Reversing in groups of k.** Count k nodes ahead first; if fewer than k remain, leave them
as they are (per the usual specification). Reverse the block, then connect the previous
block's tail to the new head and recurse or iterate onward. The bookkeeping — not the
reversal — is what makes this a Hard problem.

**Palindrome check in O(1) space.** Find the middle, reverse the second half in place,
compare the halves, then reverse it back to leave the input unmodified. An interviewer will
usually ask whether you restored the list; saying "yes, and here is where" is the mark of
a careful answer.

**Copy List with Random Pointer without a hash map.** The O(n) space solution maps old
nodes to new ones. The O(1) extra space solution interleaves: create each copy immediately
after its original, so `copy = original->next`; then set `copy->random = original->random->next`
in a second pass; then separate the two lists in a third. Three passes, no map.

**Merging k sorted lists.** A min-heap holding one head per list gives O(N log k). Pairwise
merging in a tournament gives the same bound without a heap. Sequentially merging one list
at a time is O(N·k) and is the answer to avoid.

**Intersection of two lists.** Walk pointer A through list A then list B, and pointer B
through B then A. Both travel `lenA + lenB` before meeting, so they arrive at the
intersection simultaneously — or at `nullptr` together if there is none. No length
computation needed.

**Deleting a node given only that node.** You cannot unlink it, because you have no access
to its predecessor. Instead copy the *next* node's value into this one and unlink the next.
This fails on the tail, which is why the problem guarantees the node is not last.

**The grilling chain.**

- *Prove Floyd's reset finds the cycle entry.* — The `k` and `k mod c` argument above.
- *Which middle does your pointer land on for even length?* — Depends on the loop condition;
  name it.
- *Copy a random-pointer list in O(1) extra space.* — The interleaving trick, three passes.
- *Sort a linked list — which algorithm and why?* — Merge sort; no random access needed.
- *Why is a linked list slower than an array in practice despite equal asymptotics?* — Cache
  locality; each node dereference is a potential cache miss.
- *When would you actually choose a linked list?* — O(1) splice given an iterator, and
  reference stability under insertion, which is why LRU caches pair `list` with `unordered_map`.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Linked list versus array**

An array is a row of seats in a cinema — seat 47 is exactly where you expect it, and you
walk straight there. But to squeeze someone into the middle, everyone after them shifts
along.

A linked list is a treasure hunt where each clue points to the next location. Inserting a
new stop is trivial: rewrite one clue. But to reach the forty-seventh stop you must visit
the other forty-six.

**The dummy head**

Writing a form, you leave a blank line at the top before the first real entry. Now
"delete the first entry" and "delete the fifth entry" are the same operation — both mean
"remove the line after some line".

Without that blank, the first entry is a special case forever.

**Fast and slow pointers**

Two people run laps on a track, one twice as fast as the other. On a straight road the fast
one simply disappears ahead. On a circular track, the fast one eventually laps the slow one
and they meet.

So if they ever meet, the track was a loop.

</details>

### Stacks, queues and monotonic structures

[Striver: Stack & Queue](https://www.youtube.com/watch?v=GYptUgnIM_I)

<!-- theory-id:t-stack-queue -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What they are.** A stack is last-in-first-out: the only accessible element is the most
recently added. A queue is first-in-first-out: the only accessible element is the oldest.
Both restrict access deliberately, and that restriction is what makes them useful — it
matches the structure of certain problems exactly.

**When each applies.**
- **Stack** — anything involving nesting, matching, or "the most recent unresolved thing":
  brackets, expression parsing, undo histories, DFS, and the entire monotonic-stack family.
- **Queue** — anything processed in arrival order: BFS, level-order traversal, scheduling,
  and sliding windows via a deque.

**Bracket matching**, the canonical stack problem:
```cpp
bool isValid(string s) {
    stack<char> st;
    unordered_map<char,char> match{{')','('},{']','['},{'}','{'}};
    for (char c : s) {
        if (match.count(c)) {
            if (st.empty() || st.top() != match[c]) return false;
            st.pop();
        } else st.push(c);
    }
    return st.empty();                     // leftovers mean unclosed brackets
}
```
Forgetting the final emptiness check is the standard bug — `"((("` would pass.

**Monotonic stack.** A stack whose contents are kept sorted, achieved by popping anything
that violates the order before pushing. It answers "next greater", "previous smaller",
"span" and histogram questions in O(n).

```cpp
vector<int> nextGreater(vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    stack<int> st;                          // holds INDICES, values decreasing
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }
        st.push(i);
    }
    return res;
}
```
A **decreasing** stack answers next-greater. An **increasing** stack answers next-smaller.
Store indices, not values — you nearly always need the distance.

**Monotonic deque.** For the maximum of every window of size k, maintain a deque of indices
whose values decrease. Evict from the front when an index falls out of the window, and from
the back when a new value dominates. Each index is pushed and popped once, giving O(n) where
a heap gives O(n log k).

**Complexity.**

| Structure | push | pop | top/front | notes |
|---|---|---|---|---|
| `stack` | O(1) | O(1) | O(1) | adaptor over `deque` |
| `queue` | O(1) | O(1) | O(1) | adaptor over `deque` |
| `deque` | O(1) both ends | O(1) both ends | O(1) | also O(1) indexed access |
| monotonic stack pass | — | — | — | O(n) total, amortised |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why a monotonic stack pass is O(n) despite the inner `while`.** Every index is pushed
exactly once and popped at most once. The inner loop's total iterations across the whole
run are therefore bounded by n, regardless of how many it performs on any single step. This
amortised argument is the expected justification — saying "it looks like O(n²) but is not"
without the argument does not count.

**Largest Rectangle in Histogram.** For each bar, the largest rectangle with that bar as its
height extends left to the previous smaller bar and right to the next smaller bar. A single
increasing monotonic stack computes both boundaries in one pass: when a bar is popped, the
element now on top is its previous-smaller and the current index is its next-smaller.
Appending a sentinel `0` forces the stack to drain, removing the need for a separate
cleanup loop.

Maximal Rectangle in a binary matrix is this run once per row, treating consecutive ones
above each row as histogram heights — O(m·n).

**Sum of Subarray Minimums.** Rather than enumerating subarrays, count each element's
*contribution*: element `a[i]` is the minimum of exactly `left × right` subarrays, where
`left` is the distance to the previous smaller element and `right` to the next smaller. The
total is `Σ a[i] · left · right`. Handling duplicates requires strict comparison on one side
and non-strict on the other, or identical subarrays get counted twice. Sum of Subarray
Ranges is the same computation run for maxima and minima and subtracted.

**Implementing a queue with two stacks.** Push onto an input stack. On pop, if the output
stack is empty, drain the input stack into it — this reverses the order — then pop from
output. Each element moves between stacks at most once, so operations are O(1) amortised
even though an individual pop can be O(n).

**Min Stack in O(1).** Keep a second stack of minima, pushing the new minimum on every
push. The O(1)-space variant stores `2*x - min` as an encoded value when a new minimum
arrives, recovering the previous minimum on pop — clever, but overflow-prone and usually
worth mentioning rather than implementing.

**LRU cache.** `unordered_map` from key to a `list` iterator, plus a `list` maintaining
recency order. The map gives O(1) lookup; the list gives O(1) splice to the front and O(1)
eviction from the back. This pairing works specifically because `list` iterators remain
valid across insertions and erasures elsewhere — a `vector` would invalidate them.

**Expression evaluation.** Infix to postfix uses a stack of operators, popping while the
top has greater or equal precedence. Evaluating postfix uses a stack of operands. The two
together are the shunting-yard algorithm, and they underlie every calculator problem.

**The grilling chain.**

- *Why is the monotonic stack pass O(n)?* — Each index pushed and popped once; amortised.
- *Increasing or decreasing stack for next-greater?* — Decreasing; explain what the pop
  condition means.
- *Largest rectangle — what do the stack neighbours represent?* — Previous smaller and next
  smaller boundaries.
- *Sum of subarray minimums without enumerating subarrays.* — Contribution counting, and
  how duplicates are handled.
- *Queue from two stacks — is pop really O(1)?* — Amortised O(1); a single pop can be O(n).
- *Why does an LRU cache use `list` rather than `vector`?* — Iterator stability and O(1)
  splice.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Stack versus queue**

A stack is a pile of plates in the mess. You take the one on top — the last one put down.

A queue is the line for those plates. The person who joined first is served first.

Neither is better; they model different situations. Undoing your last action is a stack.
Being served fairly is a queue.

**Monotonic stack**

You are standing in a queue of people of different heights, looking backwards for the first
person taller than you.

Anyone shorter than you, standing between you and that person, is irrelevant — they block
nobody's view, because you are taller than them. So they can be discarded permanently.

What remains is always a queue of increasing heights, and that is the monotonic stack.

**Why the monotonic pass is linear**

Each person joins the queue once and leaves once. It does not matter that on a single step
several people leave at the same time — across the whole day, the number of departures can
never exceed the number of arrivals.

</details>

### Sliding window and two pointers

[Striver: Sliding Window](https://www.youtube.com/watch?v=9kdHxplyl5I)

<!-- theory-id:t-sliding-window -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Two pointers maintain a range over a sequence and move them according to a
rule, so that the range is examined once rather than re-scanned. It converts the O(n²)
"try every subarray" brute force into O(n).

**Three distinct shapes, often confused.**

*Opposing pointers.* One at each end, converging. Requires the input sorted, or some
symmetry. Used for pair sums, container-with-most-water, palindrome checks.
```cpp
int l = 0, r = n - 1;
while (l < r) {
    long long s = a[l] + a[r];
    if (s == target) return {l, r};
    s < target ? l++ : r--;            // the sorted order justifies the move
}
```

*Fixed-size window.* The window is always exactly k wide, so each step adds one element and
removes one. No shrink loop.
```cpp
long long sum = 0;
for (int i = 0; i < k; i++) sum += a[i];
long long best = sum;
for (int r = k; r < n; r++) { sum += a[r] - a[r-k]; best = max(best, sum); }
```

*Variable-size window.* Extend the right edge always; shrink from the left while the window
is invalid. Each index enters and leaves once, so it is O(n) despite the nested loop.
```cpp
int l = 0; long long cur = 0; int best = 0;
for (int r = 0; r < n; r++) {
    cur += a[r];                       // extend
    while (cur > limit) cur -= a[l++]; // shrink until valid
    best = max(best, r - l + 1);
}
```

**The at-most-K trick.** Problems asking for *exactly* K of something are usually much
harder directly. But `exactly(K) = atMost(K) - atMost(K-1)`, and `atMost` is a
straightforward variable window. Subarrays with K Different Integers, Binary Subarrays With
Sum and Count Number of Nice Subarrays are all solved this way.

**Counting windows rather than measuring them.** Inside a valid window ending at `r`, the
number of valid subarrays ending at `r` is `r - l + 1`. Accumulating that counts all of
them without enumerating any.

**Complexity.** All three shapes are O(n) time and O(1) space, or O(k) when a frequency map
of the window is needed.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**The precondition, stated precisely.** A variable-size window is valid only when extending
the window moves the quantity **monotonically** in one direction, so that shrinking is a
sound corrective action. With non-negative values, adding an element can only increase the
sum, so "too big → shrink" always converges. **With negative values this fails**: adding an
element might decrease the sum, so shrinking may be the wrong move and the window can miss
the answer entirely.

This is the single most important distinction in the topic. Subarray Sum Equals K has
negative values in its constraints, which is precisely why it requires prefix sums with a
hash map and not a sliding window — and interviewers ask exactly this.

**Why the nested `while` is still O(n).** The left pointer never moves backward. Across the
entire run it advances at most n times in total, regardless of how many iterations it
performs on any single step. This amortised argument is the expected justification.

**Minimum Window Substring.** Maintain a frequency map of the target and a counter of how
many distinct required characters are currently satisfied. Expand right until all are
satisfied, then contract left while the window remains valid, recording the best. The
subtlety is the satisfaction counter: increment it only when a character's count reaches
exactly its requirement, not on every occurrence, or the counter overcounts duplicates.

**Longest Repeating Character Replacement.** The window is valid when
`windowLength - maxFrequency ≤ k`. The surprising detail is that `maxFrequency` need never
be decreased when shrinking: the answer can only improve when a larger `maxFrequency`
appears, so a stale value causes no incorrect acceptance. This makes the solution a single
pass with no inner recomputation, and explaining why it is safe is a strong answer.

**Sliding Window Maximum.** A frequency map does not give maxima cheaply. A monotonic deque
of indices with decreasing values does: evict from the front when the index leaves the
window, from the back when a new value dominates. O(n) versus O(n log k) for a heap.

**Two pointers on unsorted input.** Generally invalid — the move rule has no justification.
The exception is when the quantity is monotone for another reason, such as Container With
Most Water, where moving the shorter wall is provably safe because keeping it can never
yield a larger area.

**3Sum and kSum.** Sort, fix an anchor, then run opposing pointers on the remainder. The
O(n²) result beats the O(n³) triple loop. Deduplication is handled by skipping equal
neighbours at both the anchor and the pointer level — sorting is what makes that a skip
rather than a set.

**Fast and slow pointers** are a fourth two-pointer shape entirely, used for cycle detection
rather than range maintenance. Do not conflate them with windows.

**The grilling chain.**

- *When is a sliding window invalid?* — Non-monotone contributions, i.e. negative values;
  name prefix sums as the alternative.
- *Why is the inner `while` not making this O(n²)?* — The left pointer's total movement is
  bounded by n.
- *Count subarrays with exactly K distinct.* — `atMost(K) - atMost(K-1)`.
- *Longest Repeating Character Replacement — why need you not shrink `maxFrequency`?* — A
  stale value never permits an incorrect larger answer.
- *Maximum of every window of size k.* — Monotonic deque, O(n); contrast with a heap.
- *Two pointers on unsorted input?* — Only when the move rule is independently justified.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**The variable-size window**

You are filling a bucket from a tap while it leaks from the bottom. You keep adding water
from the right; if it gets too full you let some out from the left until it is fine again.

You never pour water back in from the left. That is why, however many times you open the
bottom tap, the total amount that leaves is bounded by the total you put in.

**Why negatives break it**

Now imagine some of the things you add to the bucket actually make the level go *down*.
Now, when the bucket is too full, letting water out from the bottom might not be the fix —
adding more from the top might be.

The rule "too full, drain from the left" is no longer sound, and the whole technique
collapses.

**Opposing pointers**

Two people search a sorted shelf of books from opposite ends for a pair whose page counts
add to a thousand. If their current pair is too small, only the person at the thin end can
help by moving up. If it is too big, only the other can help by moving down.

Neither ever needs to backtrack, because the shelf is in order.

</details>

### Heaps and priority queues

[Striver: Heaps](https://www.youtube.com/watch?v=1BGTHdcaQWo)

<!-- theory-id:t-heaps -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A binary heap is a complete binary tree stored in an array, satisfying the
heap property: every parent is ≤ (min-heap) or ≥ (max-heap) both its children. It gives
O(1) access to the extreme element and O(log n) insertion and removal, which is exactly the
combination you need when you repeatedly want "the largest thing remaining".

It is **not** a sorted structure. The root is the extreme; everything else is only partially
ordered. Iterating a heap does not give sorted order.

**Array representation.** For a node at index `i`: left child `2i+1`, right child `2i+2`,
parent `(i-1)/2`. This is why the tree must be *complete* — completeness is what makes the
array have no gaps.

**The two operations.**
- *Sift up* (after inserting at the end): swap with the parent while the heap property is
  violated. O(log n).
- *Sift down* (after moving the last element to the root on removal): swap with the smaller
  or larger child while violated. O(log n).

**In C++.**
```cpp
priority_queue<int> maxHeap;                                  // largest on top
priority_queue<int, vector<int>, greater<int>> minHeap;       // smallest on top
priority_queue<pair<int,int>> pq;                             // orders by .first then .second

auto cmp = [](const Task& a, const Task& b){ return a.cost > b.cost; };   // note: >
priority_queue<Task, vector<Task>, decltype(cmp)> pq(cmp);                // gives a MIN-heap
```
The comparator is **inverted** relative to `sort`: passing `greater` yields a min-heap,
because the comparator describes what sinks rather than what rises. This catches everyone
at least once.

**The three patterns.**

*Size-k heap.* For the k largest, keep a **min**-heap of size k: push everything, pop
whenever the size exceeds k, and the root is the kth largest. O(n log k) time, O(k) space.
The inversion is deliberate — the smallest of the current winners sits on top, ready to be
evicted.

*Two heaps for a running median.* A max-heap for the lower half and a min-heap for the
upper, kept balanced within one element. The median is the root of the larger heap, or the
mean of both roots.

*k-way merge.* Push the head of each of k sorted sequences; pop the smallest and push its
successor. O(N log k).

**Complexity.**

| Operation | Cost |
|---|---|
| `top()` | O(1) |
| `push` | O(log n) |
| `pop` | O(log n) |
| build from n elements (heapify) | **O(n)** |
| heap sort | O(n log n), O(1) space |
| find an arbitrary element | O(n) — it is not a search structure |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why building a heap is O(n), not O(n log n).** Inserting n elements one at a time is
O(n log n). But bottom-up heapify — sifting down from the last internal node backwards — is
O(n). The reason is that most nodes are near the bottom and sift down very little: at height
h there are at most n/2^(h+1) nodes, each costing O(h), so the total is
`n · Σ h/2^(h+1)`, and that sum converges to a constant. This is a standard follow-up and
the convergence argument is the expected answer.

**Why k largest uses a min-heap.** You want to cheaply discard the *worst* of your current
best k. A min-heap keeps that worst element at the root, so eviction is O(log k). A max-heap
would keep the best at the root, and finding the worst would be O(k).

**Heap versus quickselect for kth largest.** `nth_element` (quickselect) is O(n) average and
strictly better when all data fits in memory. The size-k heap is O(n log k) but uses only
O(k) space and works on a stream that cannot be stored. State which constraint applies —
that is the question being tested.

**Heap versus sorting.** For k ≪ n, O(n log k) beats O(n log n) meaningfully. For k close
to n, just sort. For k = 1, a single linear scan.

**Two heaps: the balancing dance.** Naively pushing to whichever heap "looks right" breaks
the invariant that every element in the lower half is ≤ every element in the upper half.
The reliable method is to always push to one heap, immediately transfer its root to the
other, then rebalance sizes. Three operations, no case analysis, always correct.

**Lazy deletion.** `priority_queue` has no decrease-key and no removal of arbitrary
elements. Dijkstra handles this by pushing duplicates and skipping stale entries with
`if (d > dist[u]) continue;`. The alternative — an indexed heap supporting decrease-key — is
rarely worth implementing. For sliding-window medians, deletion is handled with a
"to-delete" map and lazy eviction from the tops.

**Task Scheduler.** The greedy heap solution repeatedly schedules the most frequent
remaining task. But there is also a closed form: `max(n, (maxFreq - 1) * (k + 1) + countOfMaxFreq)`.
Deriving the formula — the most frequent task forms a skeleton of slots that everything
else fills — is a stronger answer than the simulation.

**Top K Frequent Elements in O(n).** Counting is O(n) and a size-k heap over distinct values
is O(m log k). But bucket sort by frequency is O(n): frequencies are bounded by n, so index
an array of buckets by frequency and read down from the top. Recognising the bounded range
is the same instinct as counting sort.

**The grilling chain.**

- *Why is heapify O(n) when insertion is O(log n)?* — The height-weighted sum converges.
- *k largest — min-heap or max-heap, and why?* — Min-heap, because you evict the worst.
- *Heap or quickselect for kth largest?* — Depends on whether the data fits in memory.
- *How do you decrease-key in `priority_queue`?* — You cannot; push a duplicate and skip
  stale entries.
- *Top K Frequent in O(n).* — Bucket by frequency; frequencies are bounded by n.
- *Is a heap sorted?* — No. Only the root is positioned; iteration order is meaningless.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**What a heap actually maintains**

Think of a hospital waiting room where the most urgent patient is always seen next. Nobody
maintains a full ranking of everyone in the room — that would be pointless work, since most
people's relative order never matters.

All that is maintained is enough structure to know who is most urgent right now, and to
re-establish that quickly after they leave.

**Why k largest uses a min-heap**

You are running a scholarship with ten places and applications keep arriving. You keep a
list of your current top ten, and you keep it sorted worst-first.

When a new application arrives you only need to compare it against the weakest of your
current ten. If it beats them, they are out. Keeping the weakest at your fingertips is
exactly what the min-heap does.

**The running median with two heaps**

Split a queue of people by height into a shorter half and a taller half, and keep the two
groups equal in size. The tallest of the short group and the shortest of the tall group
stand facing each other in the middle.

Whoever is in the middle is the median. When a new person joins, you put them in one group
and pass someone across if the groups become uneven.

</details>

### Greedy algorithms

[Striver: Greedy](https://www.youtube.com/watch?v=uOmisMzHYhE)

<!-- theory-id:t-greedy -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A greedy algorithm builds a solution by repeatedly taking the option that
looks best right now, never reconsidering. It is the fastest family of algorithms when it
works — usually O(n log n), dominated by a sort — and silently wrong when it does not.

The hard part is never the implementation. It is knowing whether greedy is valid at all.

**When greedy is valid.** Two properties must hold.

1. **Greedy choice property.** A globally optimal solution can be reached by making the
   locally optimal choice at each step. Proved by an *exchange argument*: take any optimal
   solution, show you can swap in the greedy choice without making it worse.
2. **Optimal substructure.** After making that choice, the remaining problem is a smaller
   instance of the same problem.

If the second holds but the first does not, you need dynamic programming instead. Coin
Change with arbitrary denominations is the standard counterexample: greedy fails on coins
`{1, 3, 4}` with target 6 — it takes 4+1+1 for three coins, where 3+3 needs two.

**The recurring patterns.**

*Interval scheduling.* **Sort by end time**, then take every interval starting after the
last one taken. Maximises the count of non-overlapping intervals. The exchange argument:
the earliest-finishing interval leaves the most room for everything else, so swapping it in
never hurts.

*Interval merging.* **Sort by start time**, then extend or append. Different problem,
different sort key — and choosing the key *is* the algorithm.

*Sweep line.* Convert each interval into `+1` at its start and `−1` at its end, sort by
position, and prefix-sum. Answers "maximum simultaneous overlap" — minimum platforms,
meeting rooms, car pooling.

*Reachability.* Jump Game tracks the furthest reachable index; Jump Game II adds level
boundaries and is implicit BFS.

*Exchange/ratio greedy.* Fractional knapsack sorts by value-per-unit-weight. Note that the
0/1 version — where items cannot be split — is **not** greedy; it is DP.

**Complexity.** Almost always O(n log n) from the sort, with an O(n) pass afterwards.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**The exchange argument, done properly.** To prove interval scheduling: let `G` be the
greedy solution and `O` an optimal one, and let `i` be the first index where they differ.
Greedy chose the interval with the earliest end time among those compatible so far, so
`end(G[i]) ≤ end(O[i])`. Replacing `O[i]` with `G[i]` keeps the solution valid — every
later interval in `O` started after `end(O[i])` and therefore after `end(G[i])` too — and
does not change its size. Repeating this transforms `O` into `G` without loss, so `G` is
optimal. Being able to produce this argument, not just the code, is what an interviewer is
checking.

**Sort by end or by start?** Scheduling maximises a *count*, so you want to free up the
timeline as early as possible: sort by end. Merging combines *overlaps*, so you need
intervals in positional order: sort by start. Minimum arrows to burst balloons is
scheduling in disguise — sort by end. Non-overlapping Intervals asks for the minimum
removals, which is `n` minus the scheduling answer.

**Where greedy fails, and how to notice.** Greedy fails when a locally worse choice enables
a much better future. The tells:
- The problem asks for an exact optimum over choices that interact (0/1 knapsack).
- Constraints are small (`n ≤ 100`), which suggests an O(n²) or O(n³) DP is intended.
- You can construct a small counterexample by hand — always try, before committing.

**Jump Game II as BFS.** Tracking `curEnd` and `farthest` is exactly a breadth-first search
over levels, where each level is the set of indices reachable in the same number of jumps.
Incrementing the jump counter at `i == curEnd` is crossing a level boundary. Recognising
the equivalence explains why the greedy is optimal: BFS finds shortest paths.

**Candy.** Two passes — left to right enforcing "higher rating than left neighbour means
more sweets", then right to left doing the same for the right neighbour, taking the maximum.
A single pass cannot satisfy both constraints; the two-pass structure is the insight and it
recurs whenever constraints point in opposing directions.

**Gas Station.** If the total gas is at least the total cost, a solution exists. Moreover
if the running tank goes negative at station `i`, no station from the current start through
`i` can be a valid start, so the next candidate is `i + 1`. This gives O(n) with a single
pass, and both claims need justifying when asked.

**Queue Reconstruction by Height.** Sort by height descending and count ascending, then
insert each person at index equal to their count. It works because taller people are already
placed, so inserting a shorter person cannot disturb anyone's count. Explaining *why* the
insertion is safe is the whole answer.

**Dijkstra as a greedy algorithm.** It is greedy — always finalise the nearest unfinalised
node — and its correctness proof is an exchange argument requiring non-negative weights.
With a negative edge, a longer path could later become shorter and the greedy commitment is
wrong. This is precisely why Dijkstra fails on negative weights.

**The grilling chain.**

- *Prove your greedy is optimal.* — Exchange argument, stated concretely.
- *Sort by start or by end, and why?* — Merging versus scheduling.
- *Give a case where greedy fails for coin change.* — `{1,3,4}` and target 6.
- *Why is 0/1 knapsack not greedy but fractional is?* — Splitting restores the greedy choice
  property.
- *Why does Dijkstra need non-negative weights?* — The greedy commitment to a finalised
  distance breaks otherwise.
- *Minimum platforms — how do you get O(n log n)?* — Sweep line over sorted arrival and
  departure events.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Greedy, and why it sometimes fails**

You are driving and always take the road that looks fastest at each junction. Often you
arrive quickly. But sometimes the fast road leads to a dead end, and the slow-looking turn
two junctions back was the one that mattered.

Greedy algorithms never look back. That is what makes them fast, and it is exactly what
makes them wrong when an early sacrifice would have paid off later.

**Why scheduling sorts by end time**

You want to attend as many talks as possible in one day. Pick the talk that *finishes*
earliest, not the one that starts earliest.

A talk from 9am to 6pm starts first and costs you the whole day. A talk from 10am to 10:30
starts later but leaves the rest of the day free. Finishing early is what buys you room.

**The sweep line**

To find the busiest moment in a hostel, you do not check the whole building every minute.
You note the time each person enters and each person leaves, then walk through those events
in order, keeping a running count.

The peak of that count is your answer, and you only ever looked at arrivals and departures.

**The two-pass trick in Candy**

Two rules must hold at once: you must have more sweets than the child on your left if you
scored higher, and more than the child on your right likewise.

You cannot satisfy both while walking in one direction, because you cannot see the future.
So you walk left to right satisfying one rule, then right to left satisfying the other, and
take whichever is larger at each child.

</details>

### Bit manipulation

[Striver: Bit Manipulation](https://www.youtube.com/watch?v=5rtVTYAk9KQ)

<!-- theory-id:t-bit -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Integers are stored in binary, and bitwise operators let you work on those
bits directly. This matters for three reasons: some problems have O(1)-space solutions only
through bit tricks, subsets of an n-element set map naturally onto the 2ⁿ integers, and
bitwise operations are among the cheapest instructions a processor executes.

**The operators.**

| Op | Meaning | Example |
|---|---|---|
| `&` | AND — 1 when both are 1 | `6 & 3 = 2` (110 & 011 = 010) |
| `\|` | OR — 1 when either is 1 | `6 \| 3 = 7` |
| `^` | XOR — 1 when they differ | `6 ^ 3 = 5` |
| `~` | NOT — flips every bit | `~5 = -6` (two's complement) |
| `<<` | left shift — multiply by 2ᵏ | `1 << 3 = 8` |
| `>>` | right shift — divide by 2ᵏ | `8 >> 2 = 2` |

**XOR's two properties** are the basis of a whole family of problems: `x ^ x = 0` and
`x ^ 0 = x`. It is also commutative and associative, so order never matters. XOR an array
containing pairs plus one loner and the pairs annihilate, leaving the loner.

**The idioms worth memorising.**
```cpp
bool isSet (int x, int i) { return (x >> i) & 1; }
int  setBit(int x, int i) { return x |  (1 << i); }
int  clrBit(int x, int i) { return x & ~(1 << i); }
int  tglBit(int x, int i) { return x ^  (1 << i); }

int  lowestSetBit(int x)  { return x & -x;      }   // isolates the rightmost 1
int  clearLowest (int x)  { return x & (x - 1); }   // Brian Kernighan's step
bool isPowerOfTwo(int x)  { return x > 0 && (x & (x - 1)) == 0; }
int  countBits   (int x)  { int c = 0; while (x) { x &= x - 1; c++; } return c; }
// or __builtin_popcount(x) / __builtin_popcountll(x)
```

**Subset enumeration.** Each of the 2ⁿ integers below `1 << n` encodes one subset, with bit
i set meaning element i is included.
```cpp
for (int mask = 0; mask < (1 << n); mask++)
    for (int i = 0; i < n; i++)
        if (mask & (1 << i)) { /* element i is in this subset */ }
```
This is why constraints of `n ≤ 20` signal a bitmask solution: 2²⁰ is about a million.

**Two's complement.** Negative numbers are stored as the bitwise complement plus one, so
`-x == ~x + 1`. This is what makes `x & -x` isolate the rightmost set bit, and it is why
`~5` is `-6` rather than some large positive number.

**Complexity.** All bitwise operations are O(1) on a fixed-width integer. Counting set bits
naively is O(32); Brian Kernighan's loop is O(number of set bits).

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why `x & -x` isolates the lowest set bit.** In two's complement, `-x = ~x + 1`. Flipping
all bits turns the lowest set bit's trailing zeros into ones and the bit itself into zero;
adding one carries through those ones, restoring the bit and zeroing everything below it.
Above that position the bits remain complementary, so the AND kills them. Only the lowest
set bit survives. This is the basis of Fenwick tree indexing.

**Why `x & (x-1)` clears the lowest set bit.** Subtracting one turns the lowest set bit
into zero and everything below into ones; the AND therefore clears that bit and preserves
everything above. Iterating this counts set bits in O(popcount) rather than O(32) — Brian
Kernighan's algorithm.

**Single Number generalisations.**
- *Every element twice except one:* XOR everything.
- *Every element three times except one:* XOR no longer cancels. Count set bits at each of
  the 32 positions across all numbers; positions where the count is not divisible by 3
  belong to the unique element. O(32n) time, O(1) space.
- *Two elements once, the rest twice:* XOR everything to get `a ^ b`. Any set bit in that
  result is a position where `a` and `b` differ — isolate the lowest with `x & -x`,
  partition the array by that bit, and XOR each partition separately.

**Undefined behaviour to avoid.** Shifting by more than the bit width, or by a negative
amount, is undefined. `1 << 31` overflows a signed 32-bit int — use `1LL << 31` or an
unsigned type. Right-shifting a negative signed value is implementation-defined (in
practice arithmetic shift, preserving the sign), which is why `reverse-bits` and
`counting-bits` should use `unsigned`.

**Division without `/`.** Repeatedly subtract the largest doubled multiple of the divisor
that still fits, accumulating the corresponding power of two. O(log n). The trap is
`INT_MIN / -1`, which overflows: `INT_MIN` has no positive counterpart, so the standard fix
is to work entirely in the negative domain or promote to `long long`.

**Maximum XOR of two numbers in an array.** The O(n²) pairwise scan is the obvious answer.
The O(n·32) solution builds a binary trie over the 32-bit representations and, for each
number, walks the trie greedily preferring the *opposite* bit at every level — because
setting a higher bit always beats anything achievable below it. Recognising that a trie can
index bits rather than characters is the insight.

**Counting Bits for 0..n in O(n).** `dp[i] = dp[i >> 1] + (i & 1)` — the bit count of i is
the count of i without its lowest bit, plus that bit. Alternatively
`dp[i] = dp[i & (i-1)] + 1`. Either is one line and O(n) total, versus O(n log n) for
counting each independently.

**Bitmask DP.** With `n ≤ 20`, a subset of items fits in one integer, so DP state can be
`dp[mask][...]`. Travelling Salesman, Partition to K Equal Sum Subsets and Shortest Path
Visiting All Nodes are all this. The complexity is typically O(2ⁿ · n) or O(2ⁿ · n²).

**The grilling chain.**

- *Prove `x & -x` isolates the lowest set bit.* — The two's complement argument above.
- *Count set bits faster than O(32).* — Brian Kernighan, O(popcount); or `__builtin_popcount`
  which compiles to a single instruction on supporting hardware.
- *Every element appears three times except one — XOR fails, now what?* — Bit counting mod 3.
- *Divide without using division.* — Doubling subtraction; mention the `INT_MIN / -1` overflow.
- *Why does `1 << 31` misbehave?* — Signed overflow; use `1LL` or unsigned.
- *Maximum XOR pair in better than O(n²).* — Binary trie, greedy opposite-bit walk.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**XOR cancellation**

Everyone entering a room flips the light switch. Two people arrive, the light is back to
where it started. Three people and it has changed.

So at the end of the day, the state of the switch tells you whether an odd or even number
of people passed through — and if everyone came in pairs except one person, the switch
tells you someone was alone.

**Bitmasks as subsets**

You have five switches on a wall and want to describe which are on. You do not need a list
— you just read them left to right as a five-digit pattern of ons and offs.

There are exactly 32 such patterns, and counting from 0 to 31 in binary walks through every
one of them. That is why bitmask solutions and 2ⁿ always appear together.

**Isolating the lowest set bit**

Think of a row of counters where you are looking for the rightmost one that is raised.
Two's complement negation is a mechanical trick that flips everything to the left of it and
leaves it standing alone.

You do not need to search for it. The arithmetic finds it in one step.

</details>

## Problems

### Day 22

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. 3Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 15

<!-- id:arrays-3sum | order:1 | day:22 | pattern:sort-two-pointer | template:T-TP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/3sum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/3-sum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=DhFh8Kw7ymk)

**Asked by:** Amazon, Facebook, Google, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Fixing one element reduces the problem to Two Sum on the remainder. Sorting first is what makes both the two-pointer sweep and the deduplication possible - without it you need a set of sorted triplets, which is slower and uglier.

**Trick.** Sort, then for each anchor i run opposing pointers over (i, n). Skip duplicate anchors with `if (i > 0 && a[i] == a[i-1]) continue`, and after recording a hit, skip equal neighbours on both pointers before moving them.

**Edge cases that bite.**

- Duplicate triplets are the actual difficulty, not finding them. Skip at both the anchor and the pointer level.
- Sum overflows int when values are near 1e9 - accumulate in long long.
- Fewer than three elements returns empty.

**Complexity.** `O(n²)` time, `O(1) excluding output` space — the sort is O(n log n) and the nested sweep is O(n²), which dominates. Each anchor's inner sweep is linear because the pointers only converge.

**Same pattern.** [Two Sum](https://leetcode.com/problems/two-sum/), [4Sum](https://leetcode.com/problems/4sum/), [3Sum Closest](https://leetcode.com/problems/3sum-closest/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

**Interview follow-ups.**

- **Q.** 4Sum.
  <br>**A.** One more outer loop, O(n^3). kSum generalises recursively to O(n^(k-1)) with the two-pointer base case at k = 2.
- **Q.** Closest sum to a target rather than exactly zero.
  <br>**A.** Same sweep, but track the minimum absolute difference instead of testing equality. You can never skip on equality, so the early exit disappears.
- **Q.** Why not a hash set of triplets?
  <br>**A.** It works but costs O(n) space and requires canonicalising each triplet by sorting it. Sorting once up front makes dedup a pointer skip instead.

</details>

#### `[CORE]` 2. Jump Game II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 45

<!-- id:arrays-jump-game-ii | order:2 | day:22 | pattern:bfs-levels-greedy | template:T-GREEDY-04 -->

[Solve on LeetCode](https://leetcode.com/problems/jump-game-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/jump-game-ii?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7SBVnw7GSTk)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-levels-greedy`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is breadth-first search wearing greedy clothing. The indices reachable in exactly j jumps form a contiguous level, and crossing from one level to the next is where the jump counter increments.

**Trick.** Track curEnd (the last index of the current level) and farthest (the furthest reachable from anywhere in this level). When i reaches curEnd, increment jumps and set curEnd = farthest.

**Edge cases that bite.**

- Loop to n-2, not n-1, or you count an extra jump on arrival at the final index.
- Single-element array needs 0 jumps.
- The problem guarantees reachability here - Jump Game I is the version that does not.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two scalars. The DP formulation is O(n^2); recognising the level structure is what removes the inner loop.

**Same pattern.** [Jump Game](https://leetcode.com/problems/jump-game/), [Jump Game III](https://leetcode.com/problems/jump-game-iii/), [Minimum Number of Refueling Stops](https://leetcode.com/problems/minimum-number-of-refueling-stops/)

**Interview follow-ups.**

- **Q.** Prove the greedy is optimal.
  <br>**A.** Because it is BFS: each level is the exact set of indices at a given distance, and BFS visits nodes in non-decreasing distance order, so the first time you reach the end is the minimum.
- **Q.** Return the actual sequence of jumps.
  <br>**A.** Record, at each level boundary, the index that achieved `farthest`. Backtrack through those at the end.

</details>

#### `[CORE]` 3. Maximum Product Subarray &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 152

<!-- id:arrays-maximum-product-subarray | order:3 | day:22 | pattern:track-min-and-max | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-product-subarray/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/maximum-product-subarray-in-an-array?tab=editorial)

**Asked by:** Amazon, LinkedIn, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `track-min-and-max`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Kadane's fails here because a negative number is not simply bad - multiplying by it turns the smallest running product into the largest. So you must carry both extremes forward, not just the maximum.

**Trick.** Track curMax and curMin together. On a negative value, swap them before updating, because multiplication flips their roles. Each is then max/min of (x, curMax*x, curMin*x).

**Edge cases that bite.**

- Zeros reset both running products to the element itself, which the max(x, ...) form handles without a special case.
- A single negative element is the answer when it is the only element.
- Overflow - products of 32-bit values need long long, or the constraints must bound it.

**Complexity.** `O(n)` time, `O(1)` space — one pass with three scalars. The O(n^2) all-subarrays version is what this replaces.

**Same pattern.** [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/), [Subarray Product Less Than K](https://leetcode.com/problems/subarray-product-less-than-k/), [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/)

**Interview follow-ups.**

- **Q.** Why does tracking only the maximum fail?
  <br>**A.** Because the optimal product ending at i may come from the most negative product ending at i-1 multiplied by a negative a[i]. Discarding the minimum discards that route.
- **Q.** Prefix-product alternative.
  <br>**A.** Scan left to right and right to left taking running products, resetting on zeros, and take the overall maximum. It works because a subarray with an even number of negatives is always bounded by one end or the other.

</details>

#### `[CORE]` 4. Merge Intervals &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 56

<!-- id:arrays-merge-intervals | order:4 | day:22 | pattern:sort-by-start-merge | template:T-GREEDY-02 -->

[Solve on LeetCode](https://leetcode.com/problems/merge-intervals/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/merge-intervals?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=IexN60k62jo)

**Asked by:** Amazon, Facebook, Google, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-by-start-merge`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Once intervals are sorted by start, any interval can only overlap the one immediately before it in the output. That reduces an all-pairs overlap problem to a single linear sweep.

**Trick.** Sort by start. For each interval, either extend the last output interval's end with max(), or append a new one. The max() is essential - a later interval may be entirely contained within the current one.

**Edge cases that bite.**

- Fully contained intervals - without max() you shrink the end and lose coverage.
- Touching intervals [1,3] and [3,5] merge under <=; use < if touching should not merge.
- Single interval returns itself; empty input returns empty.

**Complexity.** `O(n log n)` time, `O(1) excluding output` space — the sort dominates; the sweep is linear. Sorting by start is what makes one comparison per interval sufficient.

**Same pattern.** [Insert Interval](https://leetcode.com/problems/insert-interval/), [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/), [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/), [My Calendar I](https://leetcode.com/problems/my-calendar-i/)

**Interview follow-ups.**

- **Q.** Insert one interval into an already-sorted list.
  <br>**A.** LC 57 - O(n) without sorting. Emit everything ending before the new one, merge the overlapping run, then emit the rest.
- **Q.** Find the free gaps rather than the merged intervals.
  <br>**A.** Merge first, then the gaps are the spaces between consecutive merged intervals.
- **Q.** Why sort by start rather than end?
  <br>**A.** Merging needs positional adjacency. Sorting by end is for scheduling - maximising a count of non-overlapping intervals - which is a different problem.

</details>

#### `[CORE]` 5. Non-overlapping Intervals &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 435

<!-- id:arrays-non-overlapping-intervals | order:5 | day:22 | pattern:sort-by-end-schedule | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/non-overlapping-intervals/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/non-overlapping-intervals?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=HDHQ8lAWakY)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-by-end-schedule`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Minimum removals equals n minus the maximum number of intervals you can keep, so this is classic interval scheduling inverted. Scheduling means sorting by END - keeping the earliest-finishing interval always leaves the most room.

**Trick.** Sort by end. Keep a running `lastEnd`; take an interval when its start is at least lastEnd, otherwise count it as removed. Do not update lastEnd on a removal.

**Edge cases that bite.**

- Touching intervals [1,2] and [2,3] do not overlap, so use >= not >.
- Empty or single interval returns 0.
- Sorting by start gives a wrong answer here - a long early interval blocks everything.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates; the sweep is linear. The DP alternative - longest chain by compatibility - is O(n^2) and unnecessary.

**Same pattern.** [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/), [Maximum Length of Pair Chain](https://leetcode.com/problems/maximum-length-of-pair-chain/), [Insert Interval](https://leetcode.com/problems/insert-interval/)

**Interview follow-ups.**

- **Q.** Prove sorting by end is optimal.
  <br>**A.** Exchange argument: let G be greedy and O optimal, differing first at index i. Greedy chose the earliest-ending compatible interval, so end(G[i]) <= end(O[i]). Swapping G[i] into O keeps it valid and the same size, so greedy is optimal.
- **Q.** Minimum arrows to burst balloons.
  <br>**A.** Identical algorithm - count the intervals you keep rather than those you remove. LC 452.
- **Q.** Intervals have weights and you want maximum total weight.
  <br>**A.** Greedy fails. Sort by end and use DP with binary search for the latest compatible predecessor - O(n log n). That is LC 1235.

</details>

### Day 22 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The sort key IS the interval algorithm.** Sort by START to merge overlapping intervals. Sort by END to schedule the maximum number of non-overlapping ones. Choosing the wrong key gives a plausible-looking wrong answer.
  <br>↳ *Merge Intervals* — sorting by start so each interval need only be compared with the previous output; *Non-overlapping Intervals* — sorting by end, because the earliest finisher leaves the most room
- **Carry both extremes when a negative can flip them.** Under multiplication the smallest running value becomes the largest when multiplied by a negative. Tracking only the maximum discards the route to the real answer.
  <br>↳ *Maximum Product Subarray* — tracking curMax and curMin together and swapping them on a negative

### Day 23

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Sort Colors &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 75

<!-- id:arrays-sort-colors | order:6 | day:23 | pattern:dutch-national-flag | template:T-SORT-07 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-colors/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/sort-an-array-of-0's-1's-and-2's?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tp8JIuCXBaU)

**Asked by:** Amazon, Microsoft, Facebook, Adobe, Apple &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dutch-national-flag`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting occurrences and rewriting is two passes and is perfectly correct. The problem wants one pass, which forces three-way partitioning - and Dutch National Flag is the canonical answer.

**Trick.** Three pointers. low marks the end of the 0s, high the start of the 2s, mid scans. On a 0, swap with low and advance both. On a 1, just advance mid. On a 2, swap with high and DECREMENT high WITHOUT advancing mid.

**Edge cases that bite.**

- mid must not advance after the 2-swap, because the value swapped in from high is unexamined. This is the single bug everyone writes.
- The loop condition is mid <= high, not mid < high.
- Already-sorted input does no swaps.

**Complexity.** `O(n)` time, `O(1)` space — each element is examined once and mid never retreats, so the pass is linear. Counting sort is also O(n) but requires two passes.

**Same pattern.** [Sort Array By Parity](https://leetcode.com/problems/sort-array-by-parity/), [Move Zeroes](https://leetcode.com/problems/move-zeroes/), [Partition List](https://leetcode.com/problems/partition-list/), [Wiggle Sort II](https://leetcode.com/problems/wiggle-sort-ii/)

**Interview follow-ups.**

- **Q.** Generalise to k colours.
  <br>**A.** Dutch National Flag only handles three. For k, counting sort is O(n + k) in two passes; one-pass k-way partitioning is not possible in O(1) space.
- **Q.** Prove the invariant.
  <br>**A.** [0, low) is all 0s, [low, mid) is all 1s, (high, n) is all 2s, and [mid, high] is unexamined. Every branch preserves this, and the loop ends when the unexamined region is empty.

</details>

#### `[CORE]` 2. Binary Search &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 704

<!-- id:binary-search-binary-search | order:7 | day:23 | pattern:exact-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-search/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/search-x-in-sorted-array?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=MHf6awe89xw)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `exact-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Every other binary search problem is a variation on this loop, so write it once, correctly, and never think about the boilerplate again. The two things that matter are the overflow-safe midpoint and picking one interval convention and keeping it.

**Trick.** m = l + (r - l) / 2, never (l + r) / 2. Use closed [l, r] with `while (l <= r)` for exact match, and half-open [l, r) with `while (l < r)` for boundary searches.

**Edge cases that bite.**

- (l + r) overflows int when both are near INT_MAX - this shipped broken in Java for nine years.
- Single element and empty array must both terminate.
- Mixing the two interval conventions is how infinite loops happen.

**Complexity.** `O(log n)` time, `O(1)` space — the range halves every iteration, so log2(n) iterations. Iterative form uses no stack.

**Same pattern.** [Search Insert Position](https://leetcode.com/problems/search-insert-position/), [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/), [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/)

**Interview follow-ups.**

- **Q.** Write lower_bound and upper_bound.
  <br>**A.** Half-open, r = n. lower_bound uses >=, upper_bound uses >. Count of x is the difference, which also gives first and last occurrence.
- **Q.** Binary search on a linked list?
  <br>**A.** O(n) to reach each midpoint makes it O(n log n) - worse than a linear scan. Random access is part of the precondition, not an incidental convenience.

</details>

#### `[CORE]` 3. Find First and Last Position of Element in Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 34

<!-- id:binary-search-find-first-and-last-position-of-element-in-sorted-array | order:8 | day:23 | pattern:boundary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/first-and-last-occurrence?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=hjR1IYVx9lY)

**Asked by:** Amazon, Facebook, LinkedIn, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `boundary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Do not find the element and then expand outward - with all-equal input that is O(n). Run two independent boundary searches instead, one for the first index >= target and one for the first index > target.

**Trick.** first = lowerBound(target). If first == n or a[first] != target, return {-1,-1}. Otherwise last = upperBound(target) - 1. Two calls to the same half-open template.

**Edge cases that bite.**

- Target absent entirely - the lower bound check catches it before the upper bound runs.
- All elements equal to the target returns {0, n-1}, and is the case that kills the expand-outward approach.
- Target larger than everything makes lowerBound return n; test that before indexing.

**Complexity.** `O(log n)` time, `O(1)` space — two independent binary searches, each halving the range. The expand-from-a-hit approach is O(log n + k) where k is the number of occurrences, which is O(n) in the worst case.

**Same pattern.** [Search Insert Position](https://leetcode.com/problems/search-insert-position/), [Binary Search](https://leetcode.com/problems/binary-search/), [Kth Missing Positive Number](https://leetcode.com/problems/kth-missing-positive-number/)

**Interview follow-ups.**

- **Q.** Count occurrences without finding the positions.
  <br>**A.** upperBound(x) - lowerBound(x) directly. Same two searches, no index handling.
- **Q.** Why not find any occurrence and expand?
  <br>**A.** With an array of identical values, expansion visits every element, making it O(n). Two boundary searches stay logarithmic regardless.

</details>

#### `[CORE]` 4. Find Peak Element &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 162

<!-- id:binary-search-find-peak-element | order:9 | day:23 | pattern:slope-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/find-peak-element/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/find-peak-element?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=cXxmbemS6XM)

**Asked by:** Google, Facebook, Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `slope-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Binary search on an unsorted array looks impossible, but the invariant is not order - it is that the current range always CONTAINS a peak. If a[m] < a[m+1] the sequence is rising, so it must eventually fall or hit the boundary, and either way a peak lies to the right.

**Trick.** Compare a[m] with a[m+1]. Rising means l = m + 1, falling means r = m. Half-open, so the loop cannot skip the answer.

**Edge cases that bite.**

- The convention a[-1] = a[n] = -infinity is what makes boundary elements valid peaks.
- Adjacent elements are guaranteed unequal by the constraints - without that the argument fails.
- Any peak is acceptable, not the global maximum.

**Complexity.** `O(log n)` time, `O(1)` space — half the range is discarded each step even though the array has no global order, because the containment invariant is preserved by both branches.

**Same pattern.** [Find a Peak Element II](https://leetcode.com/problems/find-a-peak-element-ii/), [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/), [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)

**Interview follow-ups.**

- **Q.** Justify discarding a half on unsorted data.
  <br>**A.** If a[m] < a[m+1], the subarray [m+1, n) starts on a rise. It either keeps rising to the boundary - a peak by the infinity convention - or falls somewhere, producing a peak. So a peak is guaranteed in that half.
- **Q.** 2D version.
  <br>**A.** LC 1901. Binary search on columns; in each candidate column take the row-wise maximum and compare against its horizontal neighbours. O(m log n).
- **Q.** What if adjacent elements may be equal?
  <br>**A.** The comparison no longer determines a direction and the guarantee collapses - it becomes O(n) in the worst case.

</details>

#### `[CORE]` 5. Koko Eating Bananas &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 875

<!-- id:binary-search-koko-eating-bananas | order:10 | day:23 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/koko-eating-bananas/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/koko-eating-bananas?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=qyfekrNni90)

**Asked by:** Facebook, Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `binary-search-on-answer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The array is not what you search. The ANSWER - eating speed - is what has a monotone property: any speed that works means every faster speed also works. Recognising 'minimum X such that a condition holds' as the signature of answer-space search is the lesson.

**Trick.** Binary search speed in [1, max(piles)]. feasible(k) computes total hours as the sum of ceil(p / k) and tests it against h. Use (p + k - 1) / k for the ceiling, never floating point.

**Edge cases that bite.**

- Hours summed across 1e4 piles of 1e9 overflow int - accumulate in long long.
- lo = 1, not 0 - speed zero never finishes.
- hi = max(piles) is always feasible when h >= n, which the constraints guarantee.
- Integer ceiling division: (p + k - 1) / k. `ceil(p * 1.0 / k)` introduces float error.

**Complexity.** `O(n log(max pile))` time, `O(1)` space — log(max) iterations of the search, each running an O(n) feasibility check. The value range is 1e9, so about 30 iterations.

**Same pattern.** [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/), [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/), [Find the Smallest Divisor Given a Threshold](https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/), [Minimum Number of Days to Make m Bouquets](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/)

**Interview follow-ups.**

- **Q.** How do you know feasibility is monotone?
  <br>**A.** Eating faster never takes more hours, so once a speed suffices every larger speed does too. State this before writing the loop - it is the correctness argument.
- **Q.** How do you choose lo and hi?
  <br>**A.** lo must be at or below the answer, hi must be feasible. Here hi = max(piles) finishes in exactly n hours, which is within any valid h.
- **Q.** Minimise the maximum rather than the total.
  <br>**A.** Split Array Largest Sum - same template, feasibility becomes a greedy partition count.

</details>

### Day 23 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Three-way partition in one pass.** With exactly three classes, three pointers suffice. The subtlety is that swapping with the high pointer brings in an unexamined value, so the middle pointer must not advance.
  <br>↳ *Sort Colors* — low, mid and high, with mid held still after the 2-swap
- **Compute the midpoint as l + (r - l) / 2.** (l + r) / 2 overflows when both bounds are large. The alternative is algebraically identical and cannot overflow - this defect shipped in Java's standard library for nine years.
  <br>↳ *Binary Search* — the midpoint expression itself; *Median of Two Sorted Arrays* — the same form applied to the partition index
- **Pick one interval convention and never mix them.** Half-open [l, r) with `while (l < r)` makes boundary searches nearly bug-free, because termination gives l == r which is directly the answer. Closed [l, r] suits exact-match searches.
  <br>↳ *Find First and Last Position of Element in Sorted Array* — two half-open boundary searches rather than a hit plus expansion
- **Search the answer space when the array is not what is sorted.** 'Minimum X such that a condition holds' is the signature. Feasibility must be monotone in X, and then the same loop applies with a predicate in place of a comparison.
  <br>↳ *Koko Eating Bananas* — searching eating speed, with feasibility as total hours <= h; *Split Array Largest Sum* — searching the largest allowed part sum
- **Binary search needs monotonicity, not order.** The real precondition is that the current range provably contains the answer and that one half can be discarded. A sorted array is only the most familiar instance of that.
  <br>↳ *Find Peak Element* — discarding a half of an unsorted array using the rising-slope invariant

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass

### Day 24

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Median of Two Sorted Arrays &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 4

<!-- id:binary-search-median-of-two-sorted-arrays | order:11 | day:24 | pattern:partition-binary-search | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/median-of-two-sorted-arrays/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/median-of-2-sorted-arrays?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NTop3VTjmxk)

**Asked by:** Google, Amazon, Microsoft, Adobe, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `partition-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Do not merge. The median is defined by a PARTITION: choose i elements from A and j = (m+n+1)/2 - i from B so that everything on the left is at most everything on the right. Binary searching i finds that partition in logarithmic time.

**Trick.** Binary search on the smaller array. The partition is correct when A[i-1] <= B[j] and B[j-1] <= A[i]. Use ±infinity sentinels when i or j hits a boundary, which removes every edge case.

**Edge cases that bite.**

- Always search the SMALLER array, or j can fall outside B's range.
- Use LLONG_MIN and LLONG_MAX sentinels rather than branching on i == 0 or i == m.
- Odd total length takes max of the left side; even takes the mean of the two middles.
- Either array may be empty.

**Complexity.** `O(log(min(m,n)))` time, `O(1)` space — binary search over the partition index of the smaller array. Merging is O(m+n) and is the answer the problem explicitly rules out.

**Same pattern.** [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/), [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/), [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/)

**Interview follow-ups.**

- **Q.** Kth element of two sorted arrays.
  <br>**A.** Same partition with i + j = k instead of the half-length. The median is the special case k = (m+n+1)/2.
- **Q.** Why search the smaller array?
  <br>**A.** It bounds the complexity by log(min(m,n)), and it guarantees j stays within B's valid range, which is what makes the sentinel handling sound.
- **Q.** Extend to k sorted arrays.
  <br>**A.** The partition argument does not generalise cleanly. Use a min-heap k-way merge, or binary search on the value rather than the index.

</details>

#### `[CORE]` 2. Search a 2D Matrix II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 240

<!-- id:binary-search-search-a-2d-matrix-ii | order:12 | day:24 | pattern:staircase-search | template:T-BS-04 -->

[Solve on LeetCode](https://leetcode.com/problems/search-a-2d-matrix-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/search-in-2d-matrix-ii?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9ZbB397jU4k)

**Asked by:** Amazon, Google, Facebook, Apple &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `staircase-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rows and columns are individually sorted but the matrix is not globally sorted, so flattening fails. Starting at a corner where one direction increases and the other decreases turns each comparison into the elimination of an entire row or column.

**Trick.** Start at the top-right. Larger than the target means the whole column is too big, so go left. Smaller means the whole row is too small, so go down. Bottom-left works equally well; the other two corners do not.

**Edge cases that bite.**

- Top-left and bottom-right are useless starting points - both neighbours move the same direction, so no elimination is possible.
- Loop bounds must allow i to reach m and j to fall below 0.
- Empty matrix must be rejected first.

**Complexity.** `O(m + n)` time, `O(1)` space — each step removes one full row or column, and there are m + n of them. Binary searching every row is O(m log n), which is worse whenever n is not much larger than m.

**Same pattern.** [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/), [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/), [Count Negative Numbers in a Sorted Matrix](https://leetcode.com/problems/count-negative-numbers-in-a-sorted-matrix/)

**Interview follow-ups.**

- **Q.** Why not binary search each row?
  <br>**A.** O(m log n) versus O(m + n). The staircase wins unless the matrix is extremely wide.
- **Q.** kth smallest in such a matrix.
  <br>**A.** Binary search on the VALUE range, counting elements <= mid with a staircase walk in O(m + n) per check. Total O((m+n) log(range)) - LC 378.

</details>

#### `[CORE]` 3. Search in Rotated Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 33

<!-- id:binary-search-search-in-rotated-sorted-array | order:13 | day:24 | pattern:rotated-binary-search | template:T-BS-03 -->

[Solve on LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/search-in-rotated-sorted-array-i?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=r3pMQ8-Ad5s)

**Asked by:** Amazon, Facebook, Microsoft, Google, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `rotated-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A rotated sorted array has exactly one break point, so for any midpoint, at least one half is still perfectly sorted. Identify which, then decide whether the target lies inside that sorted half - if it does, search there, otherwise search the other.

**Trick.** Compare a[l] with a[m] to identify the sorted half. Then use a RANGE test on that half, not a single comparison: `a[l] <= target && target < a[m]`.

**Edge cases that bite.**

- Use <= when comparing a[l] and a[m], or a two-element range misidentifies the sorted half.
- The range test must be half-open on the correct side to avoid re-testing a[m].
- With duplicates the identification fails and the worst case becomes O(n) - LC 81.

**Complexity.** `O(log n)` time, `O(1)` space — one half is discarded per iteration, exactly as in plain binary search. Finding the pivot first and then searching is two passes of O(log n) - same bound, more code.

**Same pattern.** [Search in Rotated Sorted Array II](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/), [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/), [Find Peak Element](https://leetcode.com/problems/find-peak-element/)

**Interview follow-ups.**

- **Q.** With duplicates.
  <br>**A.** When a[l] == a[m] == a[r] neither half is identifiable - consider [1,1,1,0,1]. Shrink both ends by one and accept O(n) worst case. It is provably unavoidable.
- **Q.** Find the pivot first, then search.
  <br>**A.** Locate the minimum with one binary search, then run a standard search on the correct segment. Two O(log n) passes - easier to reason about, slightly more code.

</details>

#### `[CORE]` 4. Split Array Largest Sum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 410

<!-- id:binary-search-split-array-largest-sum | order:14 | day:24 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/split-array-largest-sum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/split-array---largest-sum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=thUd_WJn6wk)

**Asked by:** Google, Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `binary-search-on-answer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Minimising a maximum is the clearest possible signal for answer-space binary search. Feasibility - can the array be split into at most k parts with no part exceeding X - is monotone in X, and checking it is a single greedy pass.

**Trick.** Search X in [max(nums), sum(nums)]. feasible(X) greedily accumulates until adding the next element would exceed X, then starts a new part. Compare the part count to k.

**Edge cases that bite.**

- lo = max(nums) - any smaller cap cannot hold the largest single element.
- hi = sum(nums) is one part and always feasible.
- Sums overflow int at 1000 values of 1e6 - use long long.
- Aggressive Cows and Book Allocation are the same problem with different words.

**Complexity.** `O(n log(sum))` time, `O(1)` space — about 30-40 iterations of an O(n) greedy check. The interval DP alternative is O(n^2 * k), which is what this replaces.

**Same pattern.** [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/), [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/), [Magnetic Force Between Two Balls](https://leetcode.com/problems/magnetic-force-between-two-balls/), [Minimized Maximum of Products Distributed to Any Store](https://leetcode.com/problems/minimized-maximum-of-products-distributed-to-any-store/)

**Interview follow-ups.**

- **Q.** Why is the greedy feasibility check correct?
  <br>**A.** Filling each part as full as possible never increases the part count, because deferring an element to a later part can only add parts, never remove them.
- **Q.** Solve it with DP instead.
  <br>**A.** dp[i][j] = minimum possible largest sum splitting the first i elements into j parts. O(n^2 * k) - correct, but far slower and worth naming as the contrast.
- **Q.** Aggressive Cows is the maximin version.
  <br>**A.** Maximise the minimum gap rather than minimise the maximum sum. Same template, flipped predicate - LC 1552.

</details>

#### `[CORE]` 5. Generate Parentheses &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 22

<!-- id:strings-generate-parentheses | order:15 | day:24 | pattern:backtracking-with-invariant | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/generate-parentheses/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/generate-parentheses?tab=editorial)

**Asked by:** Amazon, Google, Facebook, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `backtracking-with-invariant`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Generating all 2^(2n) strings and filtering is wasteful. Enforcing validity DURING construction - never close more than you have opened - prunes every invalid branch before it is built, so every leaf reached is a valid answer.

**Trick.** Two counters. Add '(' while open < n. Add ')' while close < open. The second condition is the entire validity invariant, expressed as a pruning rule.

**Edge cases that bite.**

- The condition is close < open, not close < n - that is what forbids ')(' prefixes.
- n = 0 returns a single empty string.
- Recursion depth is exactly 2n, so the stack is shallow.

**Complexity.** `O(4ⁿ / √n)` time, `O(n) excluding output` space — the number of valid strings is the nth Catalan number, which is asymptotically 4^n / (n^1.5 * sqrt(pi)). Every leaf is a valid answer, so no work is wasted.

**Same pattern.** [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/), [Subsets](https://leetcode.com/problems/subsets/), [Combination Sum](https://leetcode.com/problems/combination-sum/)

**Interview follow-ups.**

- **Q.** Why is the count Catalan?
  <br>**A.** Valid bracket sequences are in bijection with balanced paths that never dip below zero, which is the standard Catalan interpretation.
- **Q.** Generate them iteratively.
  <br>**A.** Build up by n using the Catalan recurrence: every valid string of length 2n is '(' + A + ')' + B for valid A and B of smaller sizes.
- **Q.** Why prune instead of filter?
  <br>**A.** Filtering generates 2^(2n) candidates of which only Catalan(n) are valid - exponentially more work for the same output.

</details>

### Day 24 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Getting lo and hi right is where answer-space searches fail.** hi must be feasible and lo must be at or below the true answer. The loop is rarely the bug; the bounds almost always are.
  <br>↳ *Split Array Largest Sum* — lo = max(nums) and hi = sum(nums)
- **One half of a rotated array is always sorted.** A single rotation creates exactly one break point, so any split leaves at least one ordered half. Identify it, then test whether the target lies within its range.
  <br>↳ *Search in Rotated Sorted Array* — comparing a[l] with a[m] to identify the sorted half, then range-testing the target
- **Some 2D problems are 1D in disguise.** A matrix whose rows chain end to start is one sorted sequence; index it with mid / n and mid % n. A matrix sorted only within rows and columns needs a corner walk instead.
  <br>↳ *Search a 2D Matrix II* — the staircase from the top-right, eliminating a row or column per step
- **Prune during construction rather than filtering afterwards.** Enforcing validity as you build eliminates entire invalid subtrees. Generating everything and filtering does exponentially more work for the same output.
  <br>↳ *Generate Parentheses* — adding ')' only while close < open, so every leaf reached is valid

#### From yesterday

- **Compute the midpoint as l + (r - l) / 2.** (l + r) / 2 overflows when both bounds are large. ↳ *Binary Search* — the midpoint expression itself
- **Pick one interval convention and never mix them.** Half-open [l, r) with `while (l < r)` makes boundary searches nearly bug-free, because termination gives l == r which is directly the answer. ↳ *Find First and Last Position of Element in Sorted Array* — two half-open boundary searches rather than a hit plus expansion
- **Search the answer space when the array is not what is sorted.** 'Minimum X such that a condition holds' is the signature. ↳ *Koko Eating Bananas* — searching eating speed, with feasibility as total hours <= h
- **Binary search needs monotonicity, not order.** The real precondition is that the current range provably contains the answer and that one half can be discarded. ↳ *Find Peak Element* — discarding a half of an unsorted array using the rising-slope invariant

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass

### Day 25

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Longest Palindromic Substring &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 5

<!-- id:strings-longest-palindromic-substring | order:16 | day:25 | pattern:expand-around-centre | template:T-STR-02 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-palindromic-substring/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/longest-palindromic-substring?tab=editorial)

**Asked by:** Amazon, Microsoft, Google, Adobe, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `expand-around-centre`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A palindrome is defined by its centre, and there are only 2n-1 centres - n characters and n-1 gaps between them. Expanding outward from each is O(n^2) time but O(1) space, which beats the O(n^2)-space DP.

**Trick.** For each index, expand for the odd case (i, i) and the even case (i, i+1). Missing the even case silently finds only odd-length palindromes.

**Edge cases that bite.**

- Even-length palindromes like 'abba' are found only by the (i, i+1) expansion.
- Single character is a palindrome of length 1.
- Track the start index and length rather than building substrings during expansion.

**Complexity.** `O(n²)` time, `O(1)` space — 2n-1 centres, each expanding at most n/2 steps. The DP solution is the same time but O(n^2) space; Manacher's is O(n) but rarely required.

**Same pattern.** [Palindromic Substrings](https://leetcode.com/problems/palindromic-substrings/), [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/), [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/), [Shortest Palindrome](https://leetcode.com/problems/shortest-palindrome/)

**Interview follow-ups.**

- **Q.** Do it in O(n).
  <br>**A.** Manacher's algorithm reuses previously computed radii by mirroring around the current palindrome's centre. Knowing it exists and naming the bound is usually sufficient.
- **Q.** Count all palindromic substrings instead.
  <br>**A.** LC 647 - identical expansion, incrementing a counter at every successful step rather than tracking a maximum.
- **Q.** Longest palindromic SUBSEQUENCE.
  <br>**A.** Entirely different - it is the LCS of s and reverse(s), O(n^2) DP. Subsequences need not be contiguous.

</details>

#### `[CORE]` 2. Longest Repeating Character Replacement &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 424

<!-- id:strings-longest-repeating-character-replacement | order:17 | day:25 | pattern:window-with-max-frequency | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-repeating-character-replacement/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/longest-repeating-character-replacement?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_eNhaDCr6P0)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `window-with-max-frequency`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A window is valid when windowLength - maxFrequency <= k, because the characters that are not the most frequent are exactly the ones you must replace. The surprising part is that maxFrequency never needs to be decreased when the window shrinks.

**Trick.** Track a frequency array and a running maxFreq that is only ever increased. Shrink while (r - l + 1) - maxFreq > k. A stale maxFreq can never cause an incorrect acceptance.

**Edge cases that bite.**

- Not recomputing maxFreq on shrink is correct but counter-intuitive - be ready to justify it.
- k = 0 degrades to the longest run of a single character.
- Uppercase letters only, so int cnt[26] suffices.

**Complexity.** `O(n)` time, `O(1)` space — one pass with a 26-slot counter. Recomputing maxFreq inside the shrink loop would be O(26n), still linear but unnecessary.

**Same pattern.** [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/), [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/), [Permutation in String](https://leetcode.com/problems/permutation-in-string/)

**Interview follow-ups.**

- **Q.** Why is a stale maxFreq safe?
  <br>**A.** The answer only improves when a larger maxFreq appears. A stale, too-large value can make the window seem valid for longer, but it can never produce a window longer than the best genuinely achievable one, because that would require a real maxFreq at least as large.
- **Q.** Return the actual substring.
  <br>**A.** Record the left index whenever the window length improves.

</details>

#### `[CORE]` 3. Longest Substring Without Repeating Characters &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 3

<!-- id:strings-longest-substring-without-repeating-characters | order:18 | day:25 | pattern:variable-window | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-substring-without-repeating-characters/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/longest-substring-without-repeating-characters?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=-zSxTJkcdAo)

**Asked by:** Amazon, Google, Facebook, Microsoft, Bloomberg, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `variable-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The canonical sliding window. The window is valid while it holds no duplicate, and the corrective move on a duplicate is to advance the left edge past the previous occurrence - not by one, which would be O(n^2) in the worst case.

**Trick.** Store last-seen index per character. On seeing a repeat inside the window, jump l = max(l, lastSeen[c] + 1). The max() is essential - a stale occurrence outside the window must not drag l backwards.

**Edge cases that bite.**

- Without max(), 'abba' gives a wrong answer: the second 'a' pulls l back behind 'b'.
- Empty string returns 0.
- Use int last[128] for ASCII rather than a hash map - faster and O(1) space.

**Complexity.** `O(n)` time, `O(1) for a fixed alphabet` space — each index is visited once by each pointer and l never retreats. The O(n^2) all-substrings check is what this replaces.

**Same pattern.** [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/), [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/), [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/), [Permutation in String](https://leetcode.com/problems/permutation-in-string/)

**Interview follow-ups.**

- **Q.** Why is the max() necessary?
  <br>**A.** lastSeen may point to an occurrence already left behind. Without max, l jumps backwards, re-admitting characters that were correctly excluded.
- **Q.** At most k distinct characters instead of zero repeats.
  <br>**A.** A frequency map plus a shrink condition on map size. LC 340, the premium version, but Fruit Into Baskets is the free k = 2 case.
- **Q.** Return the substring rather than its length.
  <br>**A.** Record the left index whenever the best length improves.

</details>

#### `[CORE]` 4. Valid Parentheses &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 20

<!-- id:strings-valid-parentheses | order:19 | day:25 | pattern:bracket-stack | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-parentheses/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/balanced-paranthesis?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xwjS0iZhw4I)

**Asked by:** Amazon, Google, Facebook, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bracket-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Nesting means the most recently opened bracket must close first, which is precisely a stack's contract. Any problem describing nesting is a stack problem before you have read the second paragraph.

**Trick.** Push openers. On a closer, fail if the stack is empty or the top does not match. After the loop, the stack MUST be empty - forgetting that check lets '(((' pass.

**Edge cases that bite.**

- Unclosed brackets - caught only by the final emptiness test.
- A closer arriving on an empty stack must fail, not be ignored.
- Odd-length input can be rejected immediately as a micro-optimisation.

**Complexity.** `O(n)` time, `O(n)` space — one pass, with the stack holding at most n openers. No cleverness reduces the space, since fully nested input genuinely requires remembering every opener.

**Same pattern.** [Minimum Remove to Make Valid Parentheses](https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/), [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/), [Longest Valid Parentheses](https://leetcode.com/problems/longest-valid-parentheses/), [Minimum Add to Make Parentheses Valid](https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/)

**Interview follow-ups.**

- **Q.** Only one bracket type.
  <br>**A.** A counter suffices - increment on open, decrement on close, fail if it goes negative. O(1) space. Multiple types are what force the stack.
- **Q.** Return the longest valid substring.
  <br>**A.** LC 32 - a stack of INDICES, or a two-pass counter sweep from both directions. Genuinely harder than the validity check.

</details>

#### `[CORE]` 5. Add Two Numbers &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 2

<!-- id:linked-list-add-two-numbers | order:20 | day:25 | pattern:digit-carry-traversal | template:T-LL-02 -->

[Solve on LeetCode](https://leetcode.com/problems/add-two-numbers/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/add-two-numbers-in-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=LBVsXSMOIk4)

**Asked by:** Amazon, Microsoft, Facebook, Adobe, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `digit-carry-traversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The digits are stored least-significant-first, which is exactly the order addition needs. A dummy head removes the special case of creating the first result node, and handling the carry after the loop removes the special case of a final carry.

**Trick.** Loop while either list remains OR the carry is non-zero. Inside, sum the two values plus carry, append sum % 10, and set carry = sum / 10.

**Edge cases that bite.**

- A final carry creates an extra node - 5 + 5 = [0,1]. Including `|| carry` in the loop condition handles it.
- Lists of different lengths - treat a missing node as 0.
- Empty lists - the dummy head means the result is correctly null-ish.

**Complexity.** `O(max(m, n))` time, `O(max(m, n)) for the output` space — one pass over the longer list. No extra space beyond the result, which is unavoidable.

**Same pattern.** [Add Two Numbers II](https://leetcode.com/problems/add-two-numbers-ii/), [Plus One](https://leetcode.com/problems/plus-one/), [Add Strings](https://leetcode.com/problems/add-strings/), [Multiply Strings](https://leetcode.com/problems/multiply-strings/)

**Interview follow-ups.**

- **Q.** Digits stored most-significant-first.
  <br>**A.** LC 445 - either reverse both lists, add, and reverse the result, or push onto two stacks and build the answer from the front. The stack version avoids mutating the input.
- **Q.** Why include `|| carry` in the loop condition?
  <br>**A.** Otherwise a carry generated by the last pair of digits is dropped, and 5 + 5 returns [0] instead of [0,1].

</details>

### Day 25 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **substr copies, so it is never free.** std::string::substr is O(len) and allocates. Placed inside two nested loops it turns an apparently quadratic algorithm into a cubic one, with no visible sign in the loop structure.
  <br>↳ *Longest Palindromic Substring* — tracking a start index and a length rather than building substrings during expansion
- **A fixed alphabet means an array, and genuinely O(1) space.** int cnt[26] or cnt[128] beats a hash map on constant factor and cache behaviour, and the space claim is real rather than hand-waved, because the alphabet size is a constant.
  <br>↳ *Longest Repeating Character Replacement* — a 26-slot frequency array inside the window; *Longest Substring Without Repeating Characters* — int last[128] holding last-seen indices
- **A palindrome is defined by its centre, and there are 2n-1 of them.** n single characters and n-1 gaps. Expanding from each is O(n^2) time and O(1) space, and forgetting the gaps silently finds only odd-length palindromes.
  <br>↳ *Longest Palindromic Substring* — calling expand(i, i) and expand(i, i+1) at every index
- **Nesting means a stack, one bracket type means a counter.** A counter suffices when there is only one kind of bracket, because you never need to know WHICH bracket is open. Several types force a stack.
  <br>↳ *Valid Parentheses* — a stack, because three bracket types must be matched by kind
- **The stale maximum in a window can be safe.** In Longest Repeating Character Replacement, maxFrequency need never be decreased on shrink. A stale value can extend the apparent validity but can never produce a window longer than one genuinely achievable.
  <br>↳ *Longest Repeating Character Replacement* — never recomputing maxFreq inside the shrink loop
- **A dummy head removes the head special case.** Any operation that might remove or replace the first node becomes uniform when a sentinel precedes it. This one habit eliminates a whole class of bugs.
  <br>↳ *Remove Nth Node From End of List* — starting both pointers at the dummy so slow lands on the predecessor; *Add Two Numbers* — building the result after a dummy so the first node needs no special case

#### From yesterday

- **Prune during construction rather than filtering afterwards.** Enforcing validity as you build eliminates entire invalid subtrees. ↳ *Generate Parentheses* — adding ')' only while close < open, so every leaf reached is valid

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise

### Day 26

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Linked List Cycle &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 141

<!-- id:linked-list-linked-list-cycle | order:21 | day:26 | pattern:fast-slow-pointers | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/linked-list-cycle/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/detect-a-loop-in-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=wiOo4DC5GGA)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `fast-slow-pointers`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** On a straight path a faster runner simply disappears ahead. On a circular one they must eventually lap the slower runner. So meeting is equivalent to the existence of a cycle - and it needs no memory at all.

**Trick.** slow advances one, fast advances two. Guard with `while (fast && fast->next)` because fast dereferences two links per step.

**Edge cases that bite.**

- The guard must check both fast and fast->next, or you dereference null on even-length acyclic lists.
- A single node pointing to itself is a cycle.
- Empty list has no cycle.

**Complexity.** `O(n)` time, `O(1)` space — fast closes the gap by one node per step inside the cycle, so they meet within cycle-length steps of slow entering it. A hash set of visited nodes is also O(n) time but O(n) space.

**Same pattern.** [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/), [Happy Number](https://leetcode.com/problems/happy-number/), [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/), [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/)

**Interview follow-ups.**

- **Q.** Why must they meet rather than pass each other?
  <br>**A.** Inside the cycle the gap shrinks by exactly one each step, so it reaches zero - it can never jump from one to minus one.
- **Q.** Find the cycle's length.
  <br>**A.** Hold one pointer at the meeting point and advance the other until they coincide again, counting steps.
- **Q.** Find where the cycle begins.
  <br>**A.** LC 142 - reset one pointer to the head and advance both one step at a time.

</details>

#### `[CORE]` 2. Linked List Cycle II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 142

<!-- id:linked-list-linked-list-cycle-ii | order:22 | day:26 | pattern:floyd-entry-point | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/linked-list-cycle-ii/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/find-the-starting-point-in-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=2Kd0KKmmHFc)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `floyd-entry-point`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** After the pointers meet, resetting one to the head and advancing both at the same speed brings them together exactly at the cycle entry. The proof is short and interviewers ask for it, so learn it rather than the code.

**Trick.** Detect the meeting as in LC 141, then set slow = head and advance both one step at a time until they are equal. That node is the entry.

**Edge cases that bite.**

- The reset must happen at the meeting point, not after any further movement.
- No cycle means returning nullptr - handle it before the second phase.
- The entry may be the head itself, which the algorithm handles naturally.

**Complexity.** `O(n)` time, `O(1)` space — two linear phases. The hash-set solution is simpler but O(n) space, and this problem exists specifically to rule it out.

**Same pattern.** [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/), [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/), [Happy Number](https://leetcode.com/problems/happy-number/)

**Interview follow-ups.**

- **Q.** Prove the reset works.
  <br>**A.** Let k be the tail length and c the cycle length. When slow enters the cycle it has walked k and fast has walked 2k, so fast is k into the cycle. They meet k mod c before the entry. A pointer from the head needs k steps to the entry; the meeting pointer needs k too, walking k mod c plus whole loops. They arrive together.
- **Q.** Apply it to an array.
  <br>**A.** LC 287: with values in [1,n] treat a[i] as a next-pointer. The duplicate is the cycle entry. That disguise is the single highest-leverage one in DSA.

</details>

#### `[CORE]` 3. Palindrome Linked List &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 234

<!-- id:linked-list-palindrome-linked-list | order:23 | day:26 | pattern:reverse-half-compare | template:T-LL-01 -->

[Solve on LeetCode](https://leetcode.com/problems/palindrome-linked-list/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/check-if-ll-is-palindrome-or-not?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=lRY_G-u_8jk)

**Asked by:** Amazon, Facebook, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `reverse-half-compare`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Copying values into an array makes this trivial but costs O(n) space. The O(1) solution composes two techniques you already have - find the middle with fast/slow, then reverse the second half in place and walk the two halves together.

**Trick.** Find the middle, reverse from there, compare until the reversed half runs out, then reverse it back so the caller's list is unmodified.

**Edge cases that bite.**

- Restoring the list afterwards is what separates a careful answer from a passing one.
- Odd length leaves a middle node that belongs to neither half and is skipped.
- Empty and single-node lists are palindromes.

**Complexity.** `O(n)` time, `O(1)` space — three linear phases - find middle, reverse, compare. The array-copy solution is the same time but O(n) space.

**Same pattern.** [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/), [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/), [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/), [Reorder List](https://leetcode.com/problems/reorder-list/)

**Interview follow-ups.**

- **Q.** Did you restore the input?
  <br>**A.** Say yes and point at the line. Mutating a caller's structure without restoring it is a genuine defect, not a stylistic quibble.
- **Q.** Why compare until the reversed half ends rather than the first?
  <br>**A.** The first half may be one node longer when the length is odd. Terminating on the shorter side skips the unpaired middle automatically.

</details>

#### `[CORE]` 4. Remove Nth Node From End of List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 19

<!-- id:linked-list-remove-nth-node-from-end-of-list | order:24 | day:26 | pattern:runner-offset | template:T-LL-03 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/remove-nth-node-from-the-back-of-the-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3kMKYQ2wNIU)

**Asked by:** Amazon, Facebook, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `runner-offset`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You cannot index backwards in a singly linked list, but you can open a fixed gap between two pointers and walk them together. When the leader hits the end, the follower is exactly n from it.

**Trick.** Start BOTH pointers at a dummy head, advance fast by n, then advance both until fast->next is null. Slow now sits on the node BEFORE the target, which is what you need to unlink it.

**Edge cases that bite.**

- Removing the head itself is why the dummy exists - without it, n == length is a special case.
- Starting both at the dummy rather than the head is what makes slow land on the predecessor.
- n is guaranteed valid, so no bounds check is needed.

**Complexity.** `O(n)` time, `O(1)` space — one pass. The two-pass version measuring the length first is equally O(n) and arguably clearer - say which you chose and why.

**Same pattern.** [Delete the Middle Node of a Linked List](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/), [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/), [Rotate List](https://leetcode.com/problems/rotate-list/), [Delete Node in a Linked List](https://leetcode.com/problems/delete-node-in-a-linked-list/)

**Interview follow-ups.**

- **Q.** Do it in two passes.
  <br>**A.** Measure the length, then walk length - n steps. Simpler to reason about; the one-pass version is what the follow-up asks for.
- **Q.** Why start at the dummy rather than the head?
  <br>**A.** It shifts slow back by one so it lands on the predecessor instead of the target, and it makes removing the head identical to removing anything else.

</details>

#### `[CORE]` 5. Reverse Linked List &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 206

<!-- id:linked-list-reverse-linked-list | order:25 | day:26 | pattern:iterative-reversal | template:T-LL-01 -->

[Solve on LeetCode](https://leetcode.com/problems/reverse-linked-list/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/reverse-a-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=D2vI2DNJGd8)

**Asked by:** Amazon, Microsoft, Google, Facebook, Apple, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `iterative-reversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Three pointers and a strict order of operations. Every harder list problem - reverse in groups, palindrome check, reorder - contains this loop, so getting it automatic pays for itself many times over.

**Trick.** Save next BEFORE rewiring, because cur->next is about to be destroyed. Then point cur at prev, and advance both. Return prev, not cur - cur ends at nullptr.

**Edge cases that bite.**

- Empty list returns nullptr; the loop simply does not execute.
- Single node returns itself.
- Returning cur instead of prev is the classic slip - cur is null when the loop exits.

**Complexity.** `O(n)` time, `O(1)` space — one pass rewiring each pointer once. The recursive version is also O(n) time but O(n) stack, which matters at 1e5 nodes.

**Same pattern.** [Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii/), [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/), [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/), [Reorder List](https://leetcode.com/problems/reorder-list/)

**Interview follow-ups.**

- **Q.** Write it recursively.
  <br>**A.** Recurse to the end, then on the way back set head->next->next = head and head->next = nullptr. Elegant, but O(n) stack - say so.
- **Q.** Reverse only positions m to n.
  <br>**A.** LC 92 - use a dummy head, walk to m-1, then splice nodes to the front of the sublist one at a time. The dummy is what removes the m = 1 special case.

</details>

### Day 26 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Save the next pointer before you destroy it.** Every list rewiring needs three pointers in a fixed order, because assigning cur->next discards the only route to the remainder of the list.
  <br>↳ *Reverse Linked List* — saving nxt before setting cur->next = prev
- **Two pointers at different speeds expose structure.** A gap of k finds the kth from the end. A speed ratio of two finds the middle, and detects cycles because on a loop the faster pointer must eventually lap the slower.
  <br>↳ *Linked List Cycle* — slow and fast meeting if and only if a cycle exists; *Remove Nth Node From End of List* — a fixed gap of n between the pointers
- **Floyd's reset finds the cycle entry.** After the pointers meet, moving one back to the head and advancing both at equal speed brings them together exactly at the entry. The proof turns on the tail length k and the cycle length c.
  <br>↳ *Linked List Cycle II* — the second phase resetting slow to head
- **Compose known techniques rather than inventing new ones.** Hard list problems are usually two easy ones stacked. Recognising the composition is faster than solving from first principles.
  <br>↳ *Palindrome Linked List* — find the middle, reverse the second half, compare, then restore; *Sort List* — split with fast/slow, then merge sort

#### From yesterday

- **A dummy head removes the head special case.** Any operation that might remove or replace the first node becomes uniform when a sentinel precedes it. ↳ *Remove Nth Node From End of List* — starting both pointers at the dummy so slow lands on the predecessor

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; The stale maximum in a window can be safe

### Day 27

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Sort List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 148

<!-- id:linked-list-sort-list | order:26 | day:27 | pattern:merge-sort-on-list | template:T-SORT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-list/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/sort-ll?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=8ocB7a_c-Cc)

**Asked by:** Amazon, Microsoft, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `merge-sort-on-list`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Merge sort is the right algorithm for a linked list specifically because it never needs random access, and because merging relinks nodes rather than copying them - giving O(1) auxiliary space beyond the recursion stack.

**Trick.** Split with fast/slow, cutting the list by setting prev->next = nullptr. Recurse on both halves, then merge with a dummy head.

**Edge cases that bite.**

- The split MUST sever the first half, or the recursion never terminates.
- A single node or empty list is the base case.
- Recursion depth is O(log n), which is safe; a bottom-up iterative merge gives true O(1) space.

**Complexity.** `O(n log n)` time, `O(log n) for the recursion` space — log n levels of recursion with O(n) merging each. Quick sort on a list needs O(n) to find a pivot and partitions awkwardly, which is why it is not used here.

**Same pattern.** [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/), [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/), [Sort an Array](https://leetcode.com/problems/sort-an-array/), [Insertion Sort List](https://leetcode.com/problems/insertion-sort-list/)

**Interview follow-ups.**

- **Q.** Achieve genuine O(1) space.
  <br>**A.** Bottom-up merge sort: merge sublists of size 1, then 2, then 4, iterating rather than recursing. No stack at all.
- **Q.** Why not quick sort?
  <br>**A.** Pivot selection is O(n) without random access, and partitioning a list requires rebuilding chains. Merge sort's split is O(n) but its merge is natural for linked structures.

</details>

#### `[CORE]` 2. Daily Temperatures &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 739

<!-- id:stack-queue-daily-temperatures | order:27 | day:27 | pattern:monotonic-stack | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/daily-temperatures/)

**Asked by:** Amazon, Google, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `monotonic-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Identical to Next Greater Element, but the answer is a DISTANCE rather than a value - which is precisely why the stack must hold indices. This is the problem that teaches you never to store values in a monotonic stack.

**Trick.** Decreasing stack of indices. When the current temperature exceeds the one at the stack top, the answer for that index is i - stackTop.

**Edge cases that bite.**

- Store indices, not temperatures, or the distance is unrecoverable.
- Indices never popped keep their default answer of 0.
- Equal temperatures do not count as warmer - use strict comparison.

**Complexity.** `O(n)` time, `O(n)` space — each index is pushed and popped once. The pairwise scan is O(n^2) and is what this replaces.

**Same pattern.** [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/), [Online Stock Span](https://leetcode.com/problems/online-stock-span/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/)

**Interview follow-ups.**

- **Q.** Solve it right to left instead.
  <br>**A.** Walk backwards with an increasing stack, popping anything not warmer. Equivalent, and some find the direction more intuitive.
- **Q.** The temperature range is bounded at 30 to 100.
  <br>**A.** That permits an O(n * 71) solution tracking the next occurrence of each temperature - worse in theory, but it shows you noticed the constraint.

</details>

#### `[CORE]` 3. Largest Rectangle in Histogram &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 84

<!-- id:stack-queue-largest-rectangle-in-histogram | order:28 | day:27 | pattern:monotonic-stack-boundaries | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/largest-rectangle-in-a-histogram?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Bzat9vgD0fs)

**Asked by:** Amazon, Google, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `monotonic-stack-boundaries`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** For each bar, the widest rectangle of that height extends left to the previous shorter bar and right to the next shorter one. A single increasing stack produces both boundaries in one pass - when a bar is popped, the new top is its left boundary and the current index is its right.

**Trick.** Append a sentinel height of 0 to force the stack to drain. Width is i - stackTopAfterPop - 1, which correctly handles the case where the stack empties.

**Edge cases that bite.**

- Without the sentinel you need a separate drain loop after the main pass.
- When the stack empties after a pop, the left boundary is -1, so width is simply i.
- Equal heights can use either comparison; the maximum is unaffected.

**Complexity.** `O(n)` time, `O(n)` space — each bar is pushed and popped once. The O(n^2) approach expanding from each bar is what this replaces.

**Same pattern.** [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/), [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/), [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)

**Interview follow-ups.**

- **Q.** Maximal rectangle in a binary matrix.
  <br>**A.** LC 85 - run this once per row, treating consecutive ones above each row as histogram heights. O(m*n) total.
- **Q.** Why does the popped element's width extend past the current top?
  <br>**A.** Everything between them was taller and already popped, so the popped bar's height is valid across that whole span.
- **Q.** Divide and conquer alternative.
  <br>**A.** Recurse on the minimum bar, O(n log n) average but O(n^2) worst on sorted input. The stack is strictly better.

</details>

#### `[CORE]` 4. Min Stack &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 155

<!-- id:stack-queue-min-stack | order:29 | day:27 | pattern:auxiliary-min-stack | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/min-stack/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/implement-min-stack?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NdDIaH91P0g)

**Asked by:** Amazon, Google, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `auxiliary-min-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** getMin must be O(1), which rules out scanning. The fix is to remember, alongside every element, what the minimum was at the moment it was pushed - so popping automatically restores the previous minimum.

**Trick.** Push min(x, currentMin) onto a second stack on every push, and pop both together. No conditional logic and no risk of losing a minimum.

**Edge cases that bite.**

- Duplicate minimums must be pushed every time, or popping one loses the other.
- getMin on an empty stack is undefined - the problem guarantees valid calls.
- Pushing the min unconditionally is simpler and safer than pushing only on improvement.

**Complexity.** `O(1) per operation` time, `O(n)` space — every operation is a constant number of stack operations. The auxiliary stack doubles memory, which the O(1)-space variant avoids at the cost of overflow risk.

**Same pattern.** [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/), [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/), [Maximum Frequency Stack](https://leetcode.com/problems/maximum-frequency-stack/), [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)

**Interview follow-ups.**

- **Q.** Do it without the second stack.
  <br>**A.** Store 2*x - min when a new minimum arrives, and recover the previous minimum on pop. It works but can overflow, so it is worth naming rather than implementing.
- **Q.** A max stack with the same guarantees.
  <br>**A.** Symmetric. A stack supporting both min and max needs two auxiliary stacks or one of pairs.
- **Q.** popMax in O(log n).
  <br>**A.** Requires an ordered structure alongside the stack - a multiset plus a doubly linked list. That is LC 716.

</details>

#### `[CORE]` 5. Remove K Digits &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 402

<!-- id:stack-queue-remove-k-digits | order:30 | day:27 | pattern:greedy-monotonic-stack | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-k-digits/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/remove-k-digits?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=jmbuRzYPGrg)

**Asked by:** Google, Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `greedy-monotonic-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** To make a number as small as possible, remove a digit whenever it is followed by a smaller one - that swap lowers a more significant place. A monotonic increasing stack performs exactly those removals greedily.

**Trick.** Maintain an increasing stack, popping while the top exceeds the incoming digit and removals remain. If k is still positive at the end, drop from the back. Strip leading zeros last.

**Edge cases that bite.**

- Leftover k after the pass means the digits were already increasing - remove from the END.
- Leading zeros must be stripped, and an empty result becomes '0'.
- k equal to the length returns '0'.

**Complexity.** `O(n)` time, `O(n)` space — each digit is pushed and popped once. The combinatorial choice of which k digits to remove is exponential, which is what the greedy replaces.

**Same pattern.** [Monotone Increasing Digits](https://leetcode.com/problems/monotone-increasing-digits/), [Remove Duplicate Letters](https://leetcode.com/problems/remove-duplicate-letters/), [Largest Number](https://leetcode.com/problems/largest-number/), [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/)

**Interview follow-ups.**

- **Q.** Prove the greedy is correct.
  <br>**A.** If d[i] > d[i+1], removing d[i] reduces the digit at the most significant differing position, which dominates every lower place. So it is never worse to remove it.
- **Q.** Maximise the number instead.
  <br>**A.** Flip the stack direction to decreasing. Same algorithm.
- **Q.** Remove duplicate letters keeping lexicographic minimality.
  <br>**A.** LC 316 - same monotonic stack, plus a last-occurrence table so you never pop a letter that will not reappear.

</details>

### Day 27 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **A monotonic stack discards permanently irrelevant elements.** Once an element has a larger element after it, it can never be anyone's next-greater. Popping it is not a loss - and because each index is pushed and popped once, the pass is linear despite the inner while.
  <br>↳ *Daily Temperatures* — the same stack, storing indices because the answer is a distance
- **Store indices, not values.** Distances, widths and spans are all unrecoverable from values alone. Storing indices costs nothing and keeps every variant available.
  <br>↳ *Daily Temperatures* — i - stackTop giving the waiting time; *Largest Rectangle in Histogram* — the width between the previous smaller and the current index; *Sliding Window Maximum* — indices so that out-of-window eviction is possible
- **A sentinel drains the stack for you.** Appending a value that pops everything removes the separate cleanup loop and the special cases that come with it.
  <br>↳ *Largest Rectangle in Histogram* — the trailing zero height that forces every bar to be popped
- **Greedy removal with a monotonic stack.** To minimise a number, remove any digit followed by a smaller one, because that lowers a more significant place. The increasing stack performs exactly those removals.
  <br>↳ *Remove K Digits* — popping while the top exceeds the incoming digit and removals remain

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones

### Day 28

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Sliding Window Maximum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 239

<!-- id:stack-queue-sliding-window-maximum | order:31 | day:28 | pattern:monotonic-deque | template:T-STK-02 -->

[Solve on LeetCode](https://leetcode.com/problems/sliding-window-maximum/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/sliding-window-maximum?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NwBvene4Imo)

**Asked by:** Amazon, Google, Facebook, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `monotonic-deque`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A heap gives O(n log k) but cannot cheaply remove elements leaving the window. A monotonic deque can, because any element smaller than a later arrival is permanently irrelevant and can be discarded immediately.

**Trick.** Deque of indices with decreasing values. Evict from the front when the index falls out of the window; evict from the back while the new value dominates. The front is always the window maximum.

**Edge cases that bite.**

- Store indices so the out-of-window check is possible.
- Front eviction must come before back eviction to keep the window valid.
- Start recording answers only once i >= k-1.

**Complexity.** `O(n)` time, `O(k)` space — each index is pushed and popped exactly once, so the two inner whiles contribute O(n) in total. The heap solution is O(n log k) with lazy deletion.

**Same pattern.** [Min Stack](https://leetcode.com/problems/min-stack/), [Maximum Frequency Stack](https://leetcode.com/problems/maximum-frequency-stack/), [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)

**Interview follow-ups.**

- **Q.** Why is a smaller earlier element permanently irrelevant?
  <br>**A.** It leaves the window no later than the larger newer one, and it is smaller, so it can never be the maximum while the newer element is present.
- **Q.** Sliding window MEDIAN.
  <br>**A.** The deque trick does not apply - medians need order statistics. Use two heaps with lazy deletion, or a multiset with an iterator to the middle. LC 480.
- **Q.** Sliding window minimum.
  <br>**A.** Flip the comparison. The deque becomes increasing.

</details>

#### `[CORE]` 2. Sum of Subarray Minimums &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 907

<!-- id:stack-queue-sum-of-subarray-minimums | order:32 | day:28 | pattern:contribution-counting | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sum-of-subarray-minimums/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/sum-of-subarray-minimums?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=v0e8p9JCgRc)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `contribution-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Do not enumerate subarrays. Count each element's CONTRIBUTION: a[i] is the minimum of exactly left * right subarrays, where left is the distance to the previous smaller element and right the distance to the next smaller. That reframing is the whole problem.

**Trick.** Two monotonic stack passes give previous-smaller and next-smaller boundaries. Answer is the sum of a[i] * left * right, taken modulo 1e9+7.

**Edge cases that bite.**

- Duplicates must use strict comparison on one side and non-strict on the other, or identical subarrays are counted twice.
- Products overflow int - accumulate in long long and reduce modulo at each step.
- Elements with no smaller neighbour extend to the array boundary.

**Complexity.** `O(n)` time, `O(n)` space — two linear stack passes. Enumerating all subarrays is O(n^2) and exceeds the limits.

**Same pattern.** [Sum of Subarray Ranges](https://leetcode.com/problems/sum-of-subarray-ranges/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/), [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)

**Interview follow-ups.**

- **Q.** Explain the duplicate handling.
  <br>**A.** If both sides used strict comparison, a subarray whose minimum appears twice would be counted for each occurrence. Making one side non-strict assigns it to exactly one.
- **Q.** Sum of subarray ranges.
  <br>**A.** LC 2104 - run the same computation for maxima and subtract the minima total. Two applications of one idea.

</details>

#### `[CORE]` 3. Fruit Into Baskets &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 904

<!-- id:sliding-window-fruit-into-baskets | order:33 | day:28 | pattern:at-most-k-distinct | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/fruit-into-baskets/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/fruit-into-baskets?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=e3bs0uA1NhQ)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `at-most-k-distinct`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** 'Two baskets' is 'at most two distinct values in the window' wearing a story. Stripping the narrative to the constraint is the actual skill - and once stripped, it is a textbook variable window with a frequency map.

**Trick.** Expand right, incrementing the count for the new fruit. While the map holds more than two keys, advance left and ERASE any key whose count reaches zero - otherwise map.size() is wrong.

**Edge cases that bite.**

- Erasing zero-count keys is mandatory; without it the size check never triggers correctly.
- Fewer than three distinct fruits overall means the answer is the whole array.
- The answer is a count of fruits, which is the window length.

**Complexity.** `O(n)` time, `O(1) since at most three keys are ever held` space — each index enters and leaves once. The map holds at most k+1 entries, so its operations are effectively constant.

**Same pattern.** [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/), [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/), [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/)

**Interview follow-ups.**

- **Q.** Generalise to k baskets.
  <br>**A.** Replace 2 with k. That is LC 340, which is premium - this problem is the free instance of it.
- **Q.** Why must zero-count keys be erased?
  <br>**A.** unordered_map::size() counts keys, not non-zero values. A key left at zero keeps inflating the distinct count and the window never shrinks correctly.

</details>

#### `[CORE]` 4. Subarrays with K Different Integers &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 992

<!-- id:sliding-window-subarrays-with-k-different-integers | order:34 | day:28 | pattern:at-most-k-difference | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/subarrays-with-k-different-integers/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/subarrays-with-k-different-integers?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7wYGbV_LsX4)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `at-most-k-difference`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The definitive example of the atMost decomposition. A window for exactly k distinct values has no valid shrink rule, but atMost(k) is routine - and exactly(k) is the difference of two such counts.

**Trick.** atMost(k) counts subarrays with at most k distinct values by accumulating (r - l + 1). Return atMost(k) - atMost(k-1).

**Edge cases that bite.**

- Erase zero-count keys or the distinct count is wrong.
- k = 1 still needs atMost(0), which must return 0.
- Accumulating (r - l + 1) counts every valid subarray ending at r, not just the longest.

**Complexity.** `O(n)` time, `O(k)` space — two linear passes, each with a map bounded by k+1 entries.

**Same pattern.** [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/), [Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/), [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/), [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

**Interview follow-ups.**

- **Q.** Prove the subtraction is correct.
  <br>**A.** Every subarray with at most k distinct values is counted once in the first term. Those with at most k-1 appear in both terms and cancel. What survives has exactly k.
- **Q.** Why does accumulating (r - l + 1) count correctly?
  <br>**A.** For a valid window [l, r], every subarray ending at r and starting at or after l is also valid, because removing elements from the left cannot increase the distinct count.

</details>

#### `[CORE]` 5. Find Median from Data Stream &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 295

<!-- id:heaps-find-median-from-data-stream | order:35 | day:28 | pattern:two-heaps | template:T-HEAP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/find-median-from-data-stream/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/find-median-from-data-stream?tab=editorial)

**Asked by:** Amazon, Google, Facebook, Microsoft, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-heaps`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Split the data into a lower half and an upper half, each kept as a heap facing inward. The median then sits at the tops. The difficulty is not the idea but keeping the invariant that every element in the lower half is at most every element in the upper.

**Trick.** Always push to the max-heap, immediately move its top to the min-heap, then rebalance sizes if the min-heap has grown larger. Three unconditional operations, no case analysis.

**Edge cases that bite.**

- Naively pushing to whichever heap 'looks right' breaks the ordering invariant.
- Odd totals leave the extra element in the max-heap by convention.
- Use double division for the even case, or integer division truncates.

**Complexity.** `O(log n) per insertion, O(1) per query` time, `O(n)` space — each insertion performs a constant number of heap operations. A sorted container with insertion is O(n) per add.

**Same pattern.** [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/), [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/), [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)

**Interview follow-ups.**

- **Q.** Numbers are all in 0-100.
  <br>**A.** A 101-slot count array plus a running total gives O(1) insertion and O(100) median - counting sort again.
- **Q.** 99% of values are in a narrow range.
  <br>**A.** Bucket the common range and keep overflow lists for outliers.
- **Q.** Sliding window median.
  <br>**A.** LC 480 - two heaps plus lazy deletion via a to-remove map, or a multiset with an iterator kept at the middle. Removal is what makes it substantially harder.

</details>

### Day 28 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Count contributions instead of enumerating subarrays.** An element is the minimum of exactly left * right subarrays, where left and right are distances to the previous and next smaller elements. Summing contributions is O(n) where enumeration is O(n^2).
  <br>↳ *Sum of Subarray Minimums* — the two boundary passes and the product formula
- **A monotonic deque beats a heap for window extremes.** A heap cannot cheaply remove elements leaving the window. A deque can, because anything smaller than a later arrival is permanently irrelevant.
  <br>↳ *Sliding Window Maximum* — front eviction by index, back eviction by dominance, O(n) rather than O(n log k)
- **Erase zero-count keys or size() lies.** unordered_map::size() counts keys, not non-zero values. A key left at zero keeps inflating the distinct count and the window stops shrinking correctly.
  <br>↳ *Fruit Into Baskets* — erasing the key when its count reaches zero during the shrink; *Subarrays with K Different Integers* — the same erasure inside the atMost helper
- **Two heaps facing inward give order statistics.** A max-heap of the lower half and a min-heap of the upper half put the median at their tops. The push-then-transfer-then-rebalance sequence is what guarantees the ordering invariant.
  <br>↳ *Find Median from Data Stream* — three unconditional operations per insertion, with no case analysis

#### From yesterday

- **A monotonic stack discards permanently irrelevant elements.** Once an element has a larger element after it, it can never be anyone's next-greater. ↳ *Daily Temperatures* — the same stack, storing indices because the answer is a distance
- **Store indices, not values.** Distances, widths and spans are all unrecoverable from values alone. ↳ *Daily Temperatures* — i - stackTop giving the waiting time
- **A sentinel drains the stack for you.** Appending a value that pops everything removes the separate cleanup loop and the special cases that come with it. ↳ *Largest Rectangle in Histogram* — the trailing zero height that forces every bar to be popped
- **Greedy removal with a monotonic stack.** To minimise a number, remove any digit followed by a smaller one, because that lowers a more significant place. ↳ *Remove K Digits* — popping while the top exceeds the incoming digit and removals remain

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones

### Day 29

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Kth Largest Element in an Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 215

<!-- id:heaps-kth-largest-element-in-an-array | order:36 | day:29 | pattern:size-k-heap | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/kth-largest-element-in-an-array/)

**Asked by:** Amazon, Facebook, Google, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `size-k-heap`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Sorting is O(n log n) and answers far more than was asked. The two better options are a size-k MIN-heap at O(n log k), and quickselect at O(n) average - and knowing when each is correct is the actual question.

**Trick.** For the k LARGEST, keep a MIN-heap of size k. The inversion is deliberate: the weakest of your current winners sits on top, ready to be evicted in O(log k).

**Edge cases that bite.**

- k is 1-indexed; k = 1 is the maximum.
- Duplicates count toward k - the 2nd largest of [3,3,1] is 3.
- Pop only when the size EXCEEDS k, not when it equals k.

**Complexity.** `O(n log k) with the heap, O(n) average with quickselect` time, `O(k) or O(1)` space — each of n elements costs O(log k) to insert and possibly evict. Quickselect recurses into only one partition, giving T(n) = T(n/2) + O(n) = O(n).

**Same pattern.** [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/), [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/), [Sort an Array](https://leetcode.com/problems/sort-an-array/)

**Interview follow-ups.**

- **Q.** Why a min-heap for the k largest?
  <br>**A.** You repeatedly need to discard the WORST of your current best k. A min-heap keeps that at the root; a max-heap would make finding it O(k).
- **Q.** Data does not fit in memory.
  <br>**A.** Quickselect needs random access to the whole array, so it is unavailable. The size-k heap streams and uses only O(k) space - that constraint is what decides between them.
- **Q.** Worst-case O(n).
  <br>**A.** Median-of-medians pivot selection makes quickselect worst-case linear, at the cost of a large constant that makes it slower in practice.

</details>

#### `[CORE]` 2. Top K Frequent Elements &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 347

<!-- id:heaps-top-k-frequent-elements | order:37 | day:29 | pattern:count-then-select | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/top-k-frequent-elements?tab=editorial)

**Asked by:** Amazon, Facebook, Google, Microsoft, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `count-then-select`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Count first, then select. The heap gives O(n log k), but frequencies are bounded by n, which means bucket sort gives O(n) - the same instinct as counting sort, and the follow-up the question is really after.

**Trick.** Bucket by frequency: an array of n+1 vectors indexed by count, filled from the frequency map, then read from the highest index down until k elements are collected.

**Edge cases that bite.**

- Bucket array needs n+1 slots, since a frequency can equal n.
- Ties may be returned in any order here.
- Stop as soon as k elements are collected, not after draining every bucket.

**Complexity.** `O(n) with bucketing, O(n log k) with a heap` time, `O(n)` space — counting is linear and bucketing is linear because the frequency range is bounded. The heap version pays a log factor to avoid the extra array.

**Same pattern.** [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/), [Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/), [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/), [Task Scheduler](https://leetcode.com/problems/task-scheduler/)

**Interview follow-ups.**

- **Q.** Make it O(n).
  <br>**A.** Bucket sort by frequency. The bound on frequencies is the constraint that makes it possible - the same reasoning as counting sort.
- **Q.** Top K Frequent WORDS with lexicographic tie-breaking.
  <br>**A.** LC 692 - a heap with a custom comparator, since bucketing alone cannot order ties.
- **Q.** Quickselect alternative.
  <br>**A.** Partition the (value, count) pairs on count. O(n) average, O(1) extra space beyond the map.

</details>

#### `[CORE]` 3. Valid Parenthesis String &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 678

<!-- id:greedy-valid-parenthesis-string | order:38 | day:29 | pattern:range-tracking | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-parenthesis-string/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/valid-paranthesis-checker?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=cHT6sG_hUZI)

**Asked by:** Facebook, Amazon, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `range-tracking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The wildcard makes the open-bracket count uncertain, so track a RANGE of possible counts rather than a single number. That range idea generalises to many problems with non-deterministic choices.

**Trick.** Keep lo and hi, the minimum and maximum possible open counts. '(' increments both, ')' decrements both, '*' decrements lo and increments hi. Clamp lo at 0 and fail if hi goes negative.

**Edge cases that bite.**

- Clamping lo at zero is essential - a negative minimum is meaningless, since '*' could have been empty.
- hi < 0 means even treating every '*' as '(' cannot balance - fail immediately.
- Success requires lo == 0 at the end, not merely lo <= 0.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two counters. The DP formulation is O(n^2) and the two-pass greedy is an equivalent alternative.

**Same pattern.** [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Minimum Add to Make Parentheses Valid](https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/), [Longest Valid Parentheses](https://leetcode.com/problems/longest-valid-parentheses/), [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)

**Interview follow-ups.**

- **Q.** Why clamp lo at zero?
  <br>**A.** lo counts the minimum possible open brackets. It cannot be negative, because any '*' that would have driven it negative can simply be treated as empty instead.
- **Q.** Two-pass alternative.
  <br>**A.** Scan left to right treating '*' as '(' and checking the count never goes negative, then right to left treating '*' as ')'. Both passes passing implies validity.

</details>

#### `[CORE]` 4. Count Primes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 204

<!-- id:bit-manipulation-count-primes | order:39 | day:29 | pattern:sieve-of-eratosthenes | template:T-MATH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/count-primes/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/count-primes-in-range-l-to-r?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=g5Fuxn_AvSk)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sieve-of-eratosthenes`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Testing each number for primality is O(n sqrt n). The sieve inverts the work - instead of asking whether each number is prime, it marks the multiples of each prime - giving O(n log log n), which is very nearly linear.

**Trick.** Start the inner loop at i*i, not 2i: every smaller multiple of i has a factor below i and was already marked. Outer loop only while i*i <= n.

**Edge cases that bite.**

- 0 and 1 are not prime and must be marked false explicitly.
- i*i overflows int for large n - use long long in the loop bounds.
- The answer counts primes strictly less than n, not up to and including it.

**Complexity.** `O(n log log n)` time, `O(n)` space — the inner loop runs n/p times per prime p, and the sum of 1/p over primes up to n is ln ln n by Mertens' theorem.

**Same pattern.** [Ugly Number](https://leetcode.com/problems/ugly-number/), [Factorial Trailing Zeroes](https://leetcode.com/problems/factorial-trailing-zeroes/), [Perfect Squares](https://leetcode.com/problems/perfect-squares/)

**Interview follow-ups.**

- **Q.** Why start at i*i?
  <br>**A.** Any multiple k*i with k < i has the smaller factor k, so it was crossed out when the sieve processed k. Starting earlier is correct but wasteful.
- **Q.** Make it O(n).
  <br>**A.** The linear sieve marks each composite exactly once by its smallest prime factor, and gives you that factor for free - which makes later factorisations O(log n).
- **Q.** Halve the memory.
  <br>**A.** Skip even numbers entirely and index only odds, or use a bitset instead of vector<bool> - though vector<bool> is already bit-packed in libstdc++.

</details>

#### `[CORE]` 5. Maximum XOR of Two Numbers in an Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 421

<!-- id:bit-manipulation-maximum-xor-of-two-numbers-in-an-array | order:40 | day:29 | pattern:binary-trie | template:T-TRIE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/maximum-xor-of-two-numbers-in-an-array?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=EIhAwfHubE8)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `binary-trie`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The O(n^2) pairwise scan is obvious. The insight that makes it O(32n) is that a trie can index BITS rather than characters - insert every number as a 32-bit path, then for each number walk greedily preferring the opposite bit at every level.

**Trick.** Greedy works because a higher bit outweighs every lower bit combined: setting bit k gains 2^k, while all bits below sum to 2^k - 1. So take the opposite branch whenever it exists.

**Edge cases that bite.**

- Insert all numbers before querying, or you miss pairs.
- Fixed 32-bit depth regardless of the values.
- Fall back to the same branch when the opposite child is absent.

**Complexity.** `O(32n)` time, `O(32n)` space — each number is inserted and queried in 32 steps. The trie holds at most 32n nodes.

**Same pattern.** [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/), [Single Number III](https://leetcode.com/problems/single-number-iii/), [Counting Bits](https://leetcode.com/problems/counting-bits/)

**Interview follow-ups.**

- **Q.** Why is the greedy bit choice optimal?
  <br>**A.** 2^k > 2^k - 1 = sum of all lower bits, so securing a higher bit always beats any combination of lower ones. Greedy from the top is therefore exact.
- **Q.** Prefix-mask alternative without a trie.
  <br>**A.** Build the answer bit by bit from the top, keeping a hash set of prefixes at each level and testing whether the desired complement exists. Same bound, no trie structure.

</details>

### Day 29 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Invert the work when testing each item is too slow.** Instead of asking whether each number has a property, mark the numbers that do. The sieve marks multiples rather than testing primality, which is nearly linear instead of O(n sqrt n).
  <br>↳ *Count Primes* — marking multiples from i*i, since smaller multiples already carry a lower factor
- **A trie can index bits, not just characters.** Inserting numbers as 32-bit paths and walking greedily toward the opposite bit works because a higher bit outweighs every lower bit combined.
  <br>↳ *Maximum XOR of Two Numbers in an Array* — the binary trie and the greedy opposite-bit descent
- **For the k largest, use a min-heap.** The inversion is deliberate: you repeatedly discard the WORST of your current best k, and a min-heap keeps that at the root for O(log k) eviction.
  <br>↳ *Kth Largest Element in an Array* — a size-k min-heap, versus quickselect at O(n) average
- **A bounded value range removes the log factor.** Frequencies are bounded by n, so bucketing by frequency is O(n) where a heap is O(n log k). Same instinct as counting sort, and it recurs constantly.
  <br>↳ *Top K Frequent Elements* — bucket sort by frequency rather than a heap
- **Track a range when a choice is undetermined.** A wildcard makes a single counter insufficient, but the set of reachable counts stays an interval. Carrying lo and hi handles the nondeterminism in one pass.
  <br>↳ *Valid Parenthesis String* — lo clamped at zero, failing when hi goes negative

#### From yesterday

- **Two heaps facing inward give order statistics.** A max-heap of the lower half and a min-heap of the upper half put the median at their tops. ↳ *Find Median from Data Stream* — three unconditional operations per insertion, with no case analysis

#### Carried forward

- **arrays** — The sort key IS the interval algorithm; Carry both extremes when a negative can flip them; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones
- **stack-queue** — A monotonic stack discards permanently irrelevant elements; Store indices, not values; Count contributions instead of enumerating subarrays; A sentinel drains the stack for you; A monotonic deque beats a heap for window extremes; Greedy removal with a monotonic stack
- **sliding-window** — Erase zero-count keys or size() lies
