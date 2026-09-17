---
phase: P1
title: Breadth Pass
days: 4-13
problems: 157
generated: 2026-09-17
---

# P1 — Breadth Pass

**Days 4–13** &nbsp;·&nbsp; **157 problems** &nbsp;·&nbsp; Full theory plus the pattern-defining core of ten topics. Enough to sit an OA without freezing.

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

### Recursion and backtracking

[Striver: Recursion](https://www.youtube.com/watch?v=yVdKa8dnKiE)

<!-- theory-id:t-recursion -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A recursive function solves a problem by calling itself on a smaller
instance until it reaches a case small enough to answer directly. Two components are
mandatory: a **base case** that returns without recursing, and a **recursive step** that
strictly reduces the problem toward that base case. Omit either and you get infinite
recursion and a stack overflow.

**Backtracking** is recursion with undo. You make a choice, recurse, and then reverse the
choice so the next branch starts from a clean state. It is how you enumerate every subset,
permutation, or valid configuration.

**The standard skeleton.**
```cpp
void backtrack(State& s, Result& res) {
    if (isComplete(s)) { res.push_back(s); return; }
    for (auto& choice : optionsFrom(s)) {
        if (!isValid(choice, s)) continue;    // prune
        apply(choice, s);
        backtrack(s, res);
        undo(choice, s);                      // the backtrack
    }
}
```

**The four patterns that cover almost everything.**

*Subsets / include-exclude.* At each index, take it or leave it. 2ⁿ leaves.
```cpp
void dfs(int i, vector<int>& a, vector<int>& cur, vector<vector<int>>& res) {
    if (i == (int)a.size()) { res.push_back(cur); return; }
    cur.push_back(a[i]); dfs(i+1, a, cur, res); cur.pop_back();   // include
    dfs(i+1, a, cur, res);                                        // exclude
}
```

*Permutations.* At each position, try every unused element. n! leaves.

*Combination sum.* Choose elements toward a target, with `i` in the recursive call
permitting reuse and `i + 1` forbidding it. That one character is the entire difference
between Combination Sum I and II.

*Grid / constraint search.* Word Search, N-Queens, Sudoku. Mark the cell or row as used,
recurse, unmark.

**Handling duplicates.** Sort the input first, then within a loop skip an element equal to
its predecessor: `if (i > start && a[i] == a[i-1]) continue;`. The condition is `i > start`
and not `i > 0` — duplicates are skipped among *siblings* in the recursion tree, never
between an ancestor and its descendant.

**Cost.** Recursive cost is (number of calls) × (work per call), and stack space is
proportional to maximum depth.

| Pattern | Calls | Typical total |
|---|---|---|
| subsets | 2ⁿ | O(n · 2ⁿ) with the copy |
| permutations | n! | O(n · n!) |
| combination sum | depends on pruning | exponential |
| N-Queens | pruned heavily | O(n!) upper bound |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Pruning is what makes exponential search tractable.** N-Queens has n! naive placements
but the constraint check eliminates branches early, so the effective tree is far smaller.
Two rules: validate *before* recursing rather than at the leaf, and sort the input where it
enables an early `break` — in Combination Sum, sorting lets you stop the loop entirely once
`a[i] > target`, which is frequently the difference between accepting and timing out.

**Making validity checks O(1).** In N-Queens, rescanning the board is O(n) per check. Keep
three boolean arrays instead: one for columns, one for the `i + j` diagonal, and one for
the `i - j + n` anti-diagonal. Every cell on a diagonal shares those sums, so the check
becomes three array reads. The same trick gives Sudoku row, column and box bitmasks.

**Passing state by reference versus by value.** Passing `cur` by value copies it at every
call, adding O(n) per node and turning O(2ⁿ) into O(n · 2ⁿ) in *allocation* as well as
time. Pass by reference and undo. The only unavoidable copy is when you push a completed
result.

**Recursion to iteration.** Any recursion can be converted using an explicit stack, which
is sometimes required: C++ default stack is around 1 MB, so a recursion depth of 10⁵ with a
few local variables per frame will overflow. Deep DFS on a 1000×1000 grid is the classic
case where recursion fails and BFS or an explicit stack is needed.

**Tail recursion** — where the recursive call is the last operation — can in principle be
optimised into a loop by the compiler, but C++ does not guarantee this and it is disabled at
`-O0`. Never rely on it.

**Memoisation is the bridge to DP.** When the recursion tree contains repeated identical
subproblems, caching results by state converts exponential to polynomial. Naive Fibonacci is
O(2ⁿ); with a memo it is O(n). The test for applicability is *overlapping subproblems*:
subsets and permutations have none — every leaf is distinct — so memoisation does not help
there, which is why they stay exponential.

**Counting versus enumerating.** If the question asks *how many* rather than *which*, you
usually do not need backtracking at all. Count Good Numbers is answered with modular
exponentiation in O(log n); enumerating the strings would be impossible. Reading "count"
versus "return all" changes the entire approach.

**Subsequences versus subarrays versus subsets.** A subarray is contiguous. A subsequence
preserves order but not contiguity. A subset ignores order. Conflating them is a frequent
misreading — 2ⁿ subsequences but only n(n+1)/2 subarrays.

**The grilling chain.**

- *Complexity of generating all subsets?* — O(2ⁿ) leaves, O(n · 2ⁿ) with the copies.
- *How do you avoid duplicate results with duplicate input?* — Sort, then skip siblings;
  explain why the condition is `i > start`.
- *Make the N-Queens validity check O(1).* — Column and two diagonal marker arrays.
- *Your recursion is 10⁵ deep. What happens?* — Stack overflow; convert to an explicit
  stack or BFS.
- *When does memoisation help and when does it not?* — Only with overlapping subproblems;
  enumeration problems have none.
- *Why is passing the current path by value a problem?* — An O(n) copy at every node.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Backtracking**

You are finding your way through a maze with a piece of chalk. At each junction you mark
the path you took and walk on. If you hit a dead end you walk back, rub out the mark, and
take a different turn.

The rubbing out is the crucial part. Without it, the next attempt inherits a trail of
decisions you have already abandoned.

**The base case**

Russian nesting dolls. You open one, and inside is a smaller one, and you open that. The
whole process only ends because eventually there is a doll that does not open.

A recursion without a base case is a set of dolls that never gets smaller.

**Pruning**

You are looking for a friend's room in a hostel and you know they live on an upper floor.
You do not search the ground floor at all.

Pruning is refusing to walk down corridors you can already prove are empty — and in an
exponential search, most corridors are.

**Memoisation**

Someone asks you to add the same long column of figures four times over. The second time,
you do not add it again — you read off the answer you wrote down.

That only helps because the same question came up more than once. If every question were
different, keeping notes would just be extra work.

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

## Problems

### Day 4

*14 problems — 8 core, 5 drill, 1 skim.*

#### `[CORE]` 1. Remove Duplicates from Sorted Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 26

<!-- id:arrays-remove-duplicates-from-sorted-array | order:1 | day:4 | pattern:two-pointer-write | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/remove-duplicates-in-place-from-sorted-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=37E9ckMDdTk&t=1887)

**Asked by:** Amazon, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-pointer-write`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Sorted input means duplicates are adjacent, so you never need to search for them. A read pointer scans and a write pointer trails, and the gap between them is exactly the number of duplicates removed so far.

**Trick.** Write pointer starts at 1. Advance the read pointer over everything; write only when a[read] differs from a[write-1]. Return the write index as the new length.

**Edge cases that bite.**

- Empty array must return 0 before the loop touches a[0].
- All identical returns 1, with the write pointer never advancing.
- Elements past the returned length are allowed to be anything - do not waste time clearing.

**Complexity.** `O(n)` time, `O(1)` space — one pass, two indices. In-place modification is the point - copying to a new array would be O(n) space and is what the problem forbids.

**Same pattern.** [Remove Duplicates from Sorted Array II](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/), [Move Zeroes](https://leetcode.com/problems/move-zeroes/), [Remove Element](https://leetcode.com/problems/remove-element/), [Sort Colors](https://leetcode.com/problems/sort-colors/)

**Interview follow-ups.**

- **Q.** At most two duplicates allowed.
  <br>**A.** Compare against a[write-2] instead of a[write-1]. The generalisation to k duplicates is a[write-k], which is the whole family in one line.
- **Q.** The array is unsorted.
  <br>**A.** Adjacency no longer holds, so you need a hash set and O(n) space, or an O(n log n) sort first. The sortedness was doing all the work.

</details>

#### `[CORE]` 2. Merge Sorted Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 88

<!-- id:arrays-merge-sorted-array | order:3 | day:4 | pattern:merge-from-back | template:T-SORT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/merge-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/merge-two-sorted-arrays-without-extra-space/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=n7uwj04E0I4)

**Asked by:** Amazon, Microsoft, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `merge-from-back`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Merging forward requires somewhere to put displaced elements, which costs O(n) space. Merging BACKWARD does not, because the tail of nums1 is guaranteed empty - the free space is exactly where the largest elements belong.

**Trick.** Three pointers starting at the ends: i at m-1, j at n-1, k at m+n-1. Write the larger of the two candidates to position k and step backward.

**Edge cases that bite.**

- When nums1 is exhausted first, the remaining nums2 elements must still be copied. When nums2 is exhausted first, nothing needs doing - those elements are already in place.
- m = 0 means the whole answer is nums2.
- Duplicates between the arrays are kept, not deduplicated.

**Complexity.** `O(m + n)` time, `O(1)` space — each element is written exactly once, and the write happens into space that already exists. Forward merging into a temporary is the same time but O(m+n) space.

**Same pattern.** [Sort an Array](https://leetcode.com/problems/sort-an-array/), [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Intersection of Two Arrays II](https://leetcode.com/problems/intersection-of-two-arrays-ii/)

**Interview follow-ups.**

- **Q.** Merge k sorted arrays instead of two.
  <br>**A.** A min-heap holding one head per array gives O(N log k). Pairwise merging in a tournament gives the same bound without a heap.
- **Q.** Why does backward merging avoid the extra space?
  <br>**A.** The free slots are at the end and the largest elements belong at the end, so every write lands in space that is guaranteed unused. Forward merging would overwrite unread input.

</details>

#### `[CORE]` 3. Best Time to Buy and Sell Stock &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 121

<!-- id:arrays-best-time-to-buy-and-sell-stock | order:5 | day:4 | pattern:running-minimum | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/stock-buy-and-sell/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=excAOvwF_Wk)

**Asked by:** Amazon, Microsoft, Google, Goldman Sachs, Morgan Stanley &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `running-minimum`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You do not need to consider pairs. Walking left to right, the best sale on day i is always against the cheapest day seen so far - so one running minimum replaces the entire inner loop.

**Trick.** Track minPrice and best simultaneously in one pass: update best with price - minPrice first, then update minPrice. Order does not actually matter here since a same-day transaction yields zero.

**Edge cases that bite.**

- Strictly decreasing prices yield 0, not a negative - you are allowed to not trade.
- Single day returns 0.
- Buy must precede sell, which is exactly what the left-to-right pass enforces.

**Complexity.** `O(n)` time, `O(1)` space — one pass holding two scalars. The O(n^2) pairwise version is the brute force this replaces. Note this is also Kadane's on the array of daily differences.

**Same pattern.** [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/), [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/), [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/)

**Interview follow-ups.**

- **Q.** Unlimited transactions allowed.
  <br>**A.** Sum every positive daily difference. Any profitable multi-day hold decomposes into profitable single-day holds, so greedy is exact here.
- **Q.** At most k transactions.
  <br>**A.** A state machine DP over (day, transactions used, holding or not). O(n*k) and it is the general form that LC 121, 122 and 123 are all special cases of.
- **Q.** Why is this the same as Kadane's?
  <br>**A.** Maximum profit equals the maximum sum subarray of consecutive daily price differences. Seeing that equivalence is worth more than either solution alone.

</details>

#### `[CORE]` 4. 3Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 15

<!-- id:arrays-3sum | order:8 | day:4 | pattern:sort-two-pointer | template:T-TP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/3sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/3-sum-find-triplets-that-add-up-to-a-zero/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=DhFh8Kw7ymk)

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

#### `[CORE]` 5. Next Permutation &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 31

<!-- id:arrays-next-permutation | order:9 | day:4 | pattern:suffix-pivot-reverse | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/next-permutation/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=JDOXKqF60RQ)

**Asked by:** Google, Facebook, Amazon, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `suffix-pivot-reverse`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The suffix of any array is already the largest arrangement of its elements when it is non-increasing. So the next permutation must change the first position where that breaks - scanning from the right finds it in one pass.

**Trick.** Three steps. Find the rightmost i with a[i] < a[i+1]. Find the rightmost j > i with a[j] > a[i] and swap. Then REVERSE the suffix after i - reverse, not sort, because it was already non-increasing.

**Edge cases that bite.**

- Fully non-increasing input has no pivot - reverse the whole array to get the smallest permutation, which the algorithm does naturally when i falls to -1.
- Duplicates work unchanged; the strict inequalities handle them.
- Must be done in place with O(1) space, which rules out generating permutations.

**Complexity.** `O(n)` time, `O(1)` space — three linear passes - find pivot, find successor, reverse suffix. Generating permutations until you find the next would be O(n!).

**Same pattern.** [Permutations](https://leetcode.com/problems/permutations/), [Rotate Array](https://leetcode.com/problems/rotate-array/), [Reverse String](https://leetcode.com/problems/reverse-string/)

**Interview follow-ups.**

- **Q.** Previous permutation instead.
  <br>**A.** Mirror every comparison: find the rightmost i with a[i] > a[i+1], swap with the rightmost smaller element, reverse the suffix.
- **Q.** Why reverse and not sort the suffix?
  <br>**A.** The suffix is guaranteed non-increasing by the way the pivot was found, so reversing it produces sorted ascending order in O(n) rather than O(n log n).

</details>

#### `[CORE]` 6. Jump Game II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 45

<!-- id:arrays-jump-game-ii | order:10 | day:4 | pattern:bfs-levels-greedy | template:T-GREEDY-04 -->

[Solve on LeetCode](https://leetcode.com/problems/jump-game-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/jump-game-2) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7SBVnw7GSTk)

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

#### `[CORE]` 7. Rotate Image &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 48

<!-- id:arrays-rotate-image | order:11 | day:4 | pattern:transpose-reverse | template:T-SORT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/rotate-image/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/rotate-image-by-90-degree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Z0R2u6gd3GU)

**Asked by:** Amazon, Microsoft, Apple, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `transpose-reverse`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A 90-degree clockwise rotation decomposes into two operations you already know: transpose (reflect across the main diagonal), then reverse each row. Neither needs extra space, and together they are trivially correct.

**Trick.** Transpose by swapping a[i][j] with a[j][i] for j > i only - looping over all pairs swaps everything back. Then reverse each row.

**Edge cases that bite.**

- The transpose loop must start at j = i + 1, or every swap is undone.
- 1x1 matrix is a no-op.
- Anticlockwise is transpose then reverse COLUMNS, or reverse rows then transpose.

**Complexity.** `O(n²)` time, `O(1)` space — every cell is touched a constant number of times and nothing is allocated. Copying to a new matrix is the same time but O(n^2) space, which the problem forbids.

**Same pattern.** [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/), [Transpose Matrix](https://leetcode.com/problems/transpose-matrix/), [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/)

**Interview follow-ups.**

- **Q.** Rotate anticlockwise.
  <br>**A.** Transpose then reverse each column - or equivalently reverse rows first, then transpose. Deriving it rather than memorising it is the point.
- **Q.** Rotate a rectangular matrix.
  <br>**A.** The result has swapped dimensions, so it cannot be done in place at all. The decomposition still holds, just into a new m x n matrix.
- **Q.** The four-way cyclic swap alternative.
  <br>**A.** Rotate each concentric ring by moving four cells at a time. Same complexity, one pass, but far more index arithmetic to get wrong.

</details>

#### `[CORE]` 8. Maximum Subarray &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 53

<!-- id:arrays-maximum-subarray | order:12 | day:4 | pattern:kadane | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-subarray/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=AHZpyENo7k4)

**Asked by:** Amazon, Microsoft, Google, LinkedIn, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `kadane`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** At each index there are only two possibilities for the best subarray ending there: it extends the best one ending at the previous index, or it starts fresh. That binary choice is the entire algorithm, and it is 1D DP with the state rolled into one variable.

**Trick.** cur = max(a[i], cur + a[i]), then best = max(best, cur). Initialise BOTH to a[0], not to 0 - initialising best to 0 silently permits the empty subarray.

**Edge cases that bite.**

- All-negative arrays must return the largest single element. This is the test that catches a zero-initialised best.
- Single element returns itself.
- Overflow - sums of 1e5 values at 1e4 each fit in int, but check the constraints.

**Complexity.** `O(n)` time, `O(1)` space — one pass, two scalars. The divide-and-conquer solution is O(n log n) and is worth knowing because it is what the follow-up asks for.

**Same pattern.** [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/), [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/), [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/), [Maximum Sum Circular Subarray](https://leetcode.com/problems/maximum-sum-circular-subarray/)

**Interview follow-ups.**

- **Q.** Return the indices of the subarray, not just the sum.
  <br>**A.** Record a start index that resets whenever `cur` restarts from a[i], and capture both endpoints whenever `best` improves.
- **Q.** Solve it with divide and conquer.
  <br>**A.** Split in half; the answer is the best in the left, the best in the right, or the best crossing subarray computed by expanding outward from the midpoint. O(n log n) - worse, but it is the intended follow-up.
- **Q.** The array is circular.
  <br>**A.** Either the answer is a normal maximum subarray, or it wraps - in which case it is the total minus the MINIMUM subarray. Guard the all-negative case, where the second branch gives an empty subarray.

</details>

#### `[DRILL]` 9. Search Insert Position &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 35

<!-- id:arrays-search-insert-position | order:2 | day:4 | pattern:lower-bound | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/search-insert-position/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/search-insert-position/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=6zhGS79oQ4k)

**Asked by:** Amazon, Google, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lower-bound`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is lower_bound wearing a different name: the insert position of x is exactly the first index whose value is at least x. Recognising that means you write a boundary search rather than an exact-match search with patched-up edge cases.

**Trick.** Half-open binary search with r = n, not n-1. When the loop ends, l is simultaneously the found index and the insert position, with no post-processing.

**Edge cases that bite.**

- Target larger than everything returns n, which the half-open form gives for free.
- Target smaller than everything returns 0.
- Duplicates - the problem does not specify which index, but lower_bound gives the first.

**Complexity.** `O(log n)` time, `O(1)` space — the search space halves each iteration. Iterative, so no stack cost.

**Same pattern.** [Binary Search](https://leetcode.com/problems/binary-search/), [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/), [Kth Missing Positive Number](https://leetcode.com/problems/kth-missing-positive-number/)

**Interview follow-ups.**

- **Q.** Return the last valid position instead of the first.
  <br>**A.** upper_bound - change the comparison from >= to >. The pair of them is how you count occurrences and find first/last occurrence.
- **Q.** Why r = n rather than n - 1?
  <br>**A.** Because the answer can be n itself when the target exceeds every element. A closed interval cannot represent that position.

</details>

#### `[DRILL]` 10. Pascal's Triangle &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 118

<!-- id:arrays-pascals-triangle | order:4 | day:4 | pattern:dp-row-build | template:T-DP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/pascals-triangle/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/program-to-generate-pascals-triangle) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=bR7mQgwQ_o8)

**Asked by:** Amazon, Adobe, Apple &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dp-row-build`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each row is built from the one above it, which makes this the gentlest possible introduction to bottom-up DP: state is a row, transition is a sum of two neighbours.

**Trick.** Row i has i+1 entries, with ones at both ends. For interior j, row[j] = prev[j-1] + prev[j]. Build the row pre-sized to avoid push_back branching.

**Edge cases that bite.**

- numRows = 1 returns [[1]] - the loop must handle a row with no interior.
- First and last of every row are 1 and must be set before the interior loop.
- Row indices are 0-based here; getting that wrong shifts the whole triangle.

**Complexity.** `O(n²)` time, `O(n²)` space — the output itself has n(n+1)/2 entries, so the space is unavoidable. If only one row were required, nCr computed iteratively would be O(n) time and O(n) space.

**Same pattern.** [Pascal's Triangle II](https://leetcode.com/problems/pascals-triangle-ii/), [Unique Paths](https://leetcode.com/problems/unique-paths/), [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/)

**Interview follow-ups.**

- **Q.** Return only the kth row, in O(k) space.
  <br>**A.** Build in place from right to left so you never overwrite a value you still need, or compute nCr iteratively as C(n,r) = C(n,r-1) * (n-r+1) / r.
- **Q.** Why iteratively rather than the factorial formula?
  <br>**A.** Factorials overflow almost immediately. The iterative form keeps intermediate values small and every division exact.

</details>

#### `[DRILL]` 11. Move Zeroes &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 283

<!-- id:arrays-move-zeroes | order:6 | day:4 | pattern:two-pointer-write | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/move-zeroes/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/move-all-zeros-to-the-end-of-the-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=wvcQg43_V8U&t=1633)

**Asked by:** Facebook, Amazon, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-pointer-write`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is a stable partition with 'is non-zero' as the predicate. The stability requirement is what rules out the converging two-pointer swap and forces the read/write form.

**Trick.** Write pointer marks where the next non-zero belongs. Copy every non-zero forward, then fill the remainder with zeros. Two clean passes beat one clever swap.

**Edge cases that bite.**

- No zeros at all - the write pointer keeps pace with the read pointer, no work done.
- All zeros - the write pointer never advances and the fill pass does everything.
- Relative order of non-zeros MUST be preserved, which is the whole constraint.

**Complexity.** `O(n)` time, `O(1)` space — two linear passes, no extra storage. The single-pass swap variant does the same work with more swaps and no asymptotic gain.

**Same pattern.** [Remove Element](https://leetcode.com/problems/remove-element/), [Sort Array By Parity](https://leetcode.com/problems/sort-array-by-parity/), [Sort Colors](https://leetcode.com/problems/sort-colors/), [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)

**Interview follow-ups.**

- **Q.** Move zeroes to the front instead.
  <br>**A.** Run the same algorithm from the right end. The direction of the pass is the only change.
- **Q.** Minimise the number of writes.
  <br>**A.** Swap only when the read and write pointers differ, which skips the no-op self-assignments in arrays with few zeros.

</details>

#### `[DRILL]` 12. Spiral Matrix &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 54

<!-- id:arrays-spiral-matrix | order:13 | day:4 | pattern:boundary-shrink | template:T-SORT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/spiral-matrix/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/spiral-traversal-of-matrix/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3Zv-s9UUrFM)

**Asked by:** Amazon, Microsoft, Google, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `boundary-shrink`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** There is no clever insight here and pretending otherwise wastes time. It is four boundary pointers and disciplined bookkeeping - the skill being tested is whether you can write fiddly index code correctly the first time.

**Trick.** Keep top, bottom, left, right. Traverse right along top then top++, down the right then right--, and so on. Before the two reverse traversals, re-check `top <= bottom` and `left <= right` or a single remaining row or column is emitted twice.

**Edge cases that bite.**

- Single row or single column - this is exactly what the mid-loop guards catch.
- Non-square matrices are the common failure.
- Stop when the output has m*n entries, or when the boundaries cross.

**Complexity.** `O(m·n)` time, `O(1) excluding output` space — every cell is visited exactly once and the boundaries only shrink.

**Same pattern.** [Spiral Matrix II](https://leetcode.com/problems/spiral-matrix-ii/), [Rotate Image](https://leetcode.com/problems/rotate-image/), [Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)

**Interview follow-ups.**

- **Q.** Generate an n x n spiral rather than reading one.
  <br>**A.** LC 59 - identical boundary logic, writing values 1..n^2 instead of reading.
- **Q.** Why do the reverse traversals need an extra guard?
  <br>**A.** After the two forward traversals the boundaries may already have crossed. Without the check, a single leftover row is read left-to-right and then again right-to-left.

</details>

#### `[DRILL]` 13. Jump Game &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 55

<!-- id:arrays-jump-game | order:14 | day:4 | pattern:reachability-greedy | template:T-GREEDY-04 -->

[Solve on LeetCode](https://leetcode.com/problems/jump-game/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/Greedy/jump-game-i) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tZAa_jJ3SwQ)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `reachability-greedy`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You never need to know HOW to reach an index, only whether it is reachable. That collapses a search over paths into a single running maximum of the furthest reachable position.

**Trick.** Walk left to right maintaining `reach`. If ever i > reach you are standing beyond everything reachable, so return false. Otherwise update reach = max(reach, i + a[i]).

**Edge cases that bite.**

- A zero at the final index is harmless - you only need to arrive there, not jump onward.
- Single element is trivially true.
- The check `i > reach` must come BEFORE updating reach, or an unreachable index updates the frontier.

**Complexity.** `O(n)` time, `O(1)` space — one pass, one scalar. The DP version marking reachability per index is O(n^2) and is the solution this replaces.

**Same pattern.** [Jump Game II](https://leetcode.com/problems/jump-game-ii/), [Jump Game III](https://leetcode.com/problems/jump-game-iii/), [Gas Station](https://leetcode.com/problems/gas-station/)

**Interview follow-ups.**

- **Q.** Work backwards instead.
  <br>**A.** Track the leftmost index from which the end is reachable; move it left whenever i + a[i] >= lastGood. Equivalent, and some find it easier to justify.
- **Q.** Jumps may go in both directions.
  <br>**A.** That is LC 1306 and it stops being greedy - it becomes BFS or DFS over a graph, because reachability is no longer monotone in the index.

</details>

#### `[SKIM]` 14. Max Consecutive Ones &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 485

<!-- id:arrays-max-consecutive-ones | order:7 | day:4 | pattern:running-streak | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/max-consecutive-ones/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/count-maximum-consecutive-ones-in-the-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=bYWLJb3vCWY&t=1124)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `running-streak`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A run length is just a counter that resets. There is no window and no data structure here - the value of this problem is that it is the base case of Max Consecutive Ones III, which is a genuine sliding window.

**Trick.** Increment on 1, reset to 0 on anything else, and take the maximum after every increment rather than at the reset, or a trailing run is missed.

**Edge cases that bite.**

- All ones - the maximum must be taken inside the loop, not after a reset that never comes.
- Empty array returns 0.
- A run ending exactly at the last index must still be counted.

**Complexity.** `O(n)` time, `O(1)` space — single pass, two counters.

**Same pattern.** [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/), [Longest Subarray of 1's After Deleting One Element](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/), [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/)

**Interview follow-ups.**

- **Q.** You may flip at most k zeros.
  <br>**A.** Now it is a sliding window: expand right, shrink left while the window holds more than k zeros. That is LC 1004 and it is the version that actually matters.
- **Q.** You must delete exactly one element.
  <br>**A.** LC 1493 - the same window with k = 1, minus one from the answer because a deletion is mandatory.

</details>

### Day 4 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **A read pointer and a write pointer beat a second array.** Whenever elements must be removed or reordered in place, one pointer scans and another marks where the next kept element belongs. The gap between them is exactly what has been discarded.
  <br>↳ *Remove Duplicates from Sorted Array* — the write index trailing the read index by the number of duplicates seen; *Move Zeroes* — copying every non-zero forward, then filling the tail with zeros
- **Sortedness turns a search into an adjacency check.** In a sorted array, anything you would otherwise search for is next to you. Duplicate detection, nearest-neighbour questions and merging all collapse to comparing neighbours.
  <br>↳ *Remove Duplicates from Sorted Array* — comparing a[read] against the last written value rather than scanning for a match; *Merge Sorted Array* — comparing only the two current tails, since everything behind them is already ordered
- **Write into free space from the end when merging in place.** Merging forward needs somewhere to put displaced elements. Merging backward does not, when the free space happens to sit where the largest elements belong.
  <br>↳ *Merge Sorted Array* — three pointers walking backwards so every write lands in guaranteed-empty tail space
- **A running extreme replaces an inner loop.** If the best answer at index i depends only on some aggregate of everything before it, carry that aggregate forward in a scalar. The nested loop disappears.
  <br>↳ *Best Time to Buy and Sell Stock* — tracking the minimum price seen so far instead of trying every earlier buy day; *Jump Game* — tracking the furthest reachable index rather than searching for a route; *Max Consecutive Ones* — a run counter that resets, instead of measuring every run separately
- **Extend or restart is the whole of Kadane.** The best subarray ending at i either extends the best one ending at i-1 or begins fresh at i. It can never extend a suboptimal predecessor, because swapping in the optimal one would improve it.
  <br>↳ *Maximum Subarray* — cur = max(a[i], cur + a[i]), with best initialised to a[0] rather than 0; *Best Time to Buy and Sell Stock* — the same recurrence applied to consecutive price differences
- **Decompose a hard rearrangement into reversals.** Rotations and word reversals both follow from reverse(reverse(A) + reverse(B)) = B + A. Two or three reversals achieve in O(1) space what naive shifting does in O(n) space.
  <br>↳ *Rotate Image* — transpose then reverse each row, which is a 90 degree rotation; *Next Permutation* — reversing the non-increasing suffix rather than sorting it
- **Scan from the right when the answer depends on the suffix.** A suffix that is already maximal tells you the change must happen before it. Scanning right to left finds that boundary in one pass.
  <br>↳ *Next Permutation* — finding the rightmost i with a[i] < a[i+1], which is where the suffix stops being maximal

### Day 5

*14 problems — 8 core, 6 drill, 0 skim.*

#### `[CORE]` 1. Merge Intervals &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 56

<!-- id:arrays-merge-intervals | order:15 | day:5 | pattern:sort-by-start-merge | template:T-GREEDY-02 -->

[Solve on LeetCode](https://leetcode.com/problems/merge-intervals/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=IexN60k62jo)

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

#### `[CORE]` 2. Set Matrix Zeroes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 73

<!-- id:arrays-set-matrix-zeroes | order:17 | day:5 | pattern:in-place-markers | template:T-SORT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/set-matrix-zeroes/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/set-matrix-zero/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=N0MgLvceX7M)

**Asked by:** Amazon, Microsoft, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `in-place-markers`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The obvious solution needs O(m+n) space for row and column flags. The O(1) solution notices that the first row and first column are themselves m+n cells that can serve as that flag storage - they just need special handling because they overlap at (0,0).

**Trick.** Use one extra boolean for whether column 0 must be zeroed, since a[0][0] can only encode one of the two overlapping facts. Mark, then apply from the bottom-right backwards so markers are read before being overwritten.

**Edge cases that bite.**

- The cell (0,0) is shared between the row-0 and column-0 markers - hence the extra flag.
- Applying top-left first destroys markers before they are read; iterate in reverse.
- A matrix that is already all zeros is handled naturally.

**Complexity.** `O(m·n)` time, `O(1)` space — two passes over the matrix with a single extra boolean. The O(m+n) flag-array solution is the expected first answer; this is the follow-up.

**Same pattern.** [Rotate Image](https://leetcode.com/problems/rotate-image/), [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/), [Game of Life](https://leetcode.com/problems/game-of-life/)

**Interview follow-ups.**

- **Q.** Why can't a[0][0] hold both markers?
  <br>**A.** It sits in both row 0 and column 0, so zeroing it would be ambiguous. One extra variable breaks the tie.
- **Q.** Game of Life with the same constraint.
  <br>**A.** Encode both old and new state in one integer using two bits, then shift at the end. The same idea - reuse existing storage rather than allocating.

</details>

#### `[CORE]` 3. Sort Colors &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 75

<!-- id:arrays-sort-colors | order:18 | day:5 | pattern:dutch-national-flag | template:T-SORT-07 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-colors/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sort-an-array-of-0s-1s-and-2s/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tp8JIuCXBaU)

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

#### `[CORE]` 4. Longest Consecutive Sequence &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 128

<!-- id:arrays-longest-consecutive-sequence | order:20 | day:5 | pattern:set-sequence-heads | template:T-HASH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-consecutive-sequence/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/longest-consecutive-sequence-in-an-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=oO5uLE7EUlM)

**Asked by:** Google, Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `set-sequence-heads`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Sorting gives O(n log n) and is the obvious answer. The O(n) solution needs one observation: only start counting a run from a value that has no predecessor in the set. That makes the apparently nested loop linear overall.

**Trick.** Put everything in a hash set. For each x, skip unless x-1 is absent. When it is absent, x is a sequence head, so walk forward counting while x+1, x+2 ... exist.

**Edge cases that bite.**

- Duplicates must not inflate the count - the set removes them automatically.
- Empty input returns 0.
- Negative numbers are fine; nothing here assumes positivity.

**Complexity.** `O(n)` time, `O(n)` space — each value is visited at most twice overall - once as a head candidate and once inside exactly one run - so the inner while contributes O(n) in total, not O(n) per element.

**Same pattern.** [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/), [Missing Number](https://leetcode.com/problems/missing-number/), [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/)

**Interview follow-ups.**

- **Q.** Why is the nested loop not O(n²)?
  <br>**A.** The inner walk only runs for sequence heads, and each element belongs to exactly one sequence. So across all heads the inner loop performs n steps in total.
- **Q.** Do it in O(1) extra space.
  <br>**A.** Sort in place and scan adjacent elements, skipping duplicates. O(n log n) time but no extra memory - the standard trade.
- **Q.** Union-Find alternative.
  <br>**A.** Union each value with x+1 when present, then take the largest component. Same bound, more machinery, but it generalises to streaming insertions.

</details>

#### `[CORE]` 5. Maximum Product Subarray &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 152

<!-- id:arrays-maximum-product-subarray | order:21 | day:5 | pattern:track-min-and-max | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-product-subarray/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-product-subarray-in-an-array/)

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

#### `[CORE]` 6. Non-overlapping Intervals &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 435

<!-- id:arrays-non-overlapping-intervals | order:25 | day:5 | pattern:sort-by-end-schedule | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/non-overlapping-intervals/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/non-overlapping-intervals) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=HDHQ8lAWakY)

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

#### `[CORE]` 7. Subarray Sum Equals K &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 560

<!-- id:arrays-subarray-sum-equals-k | order:26 | day:5 | pattern:prefix-sum-hashmap | template:T-HASH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/subarray-sum-equals-k/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/count-subarray-sum-equals-k/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xvNwoz-ufXA)

**Asked by:** Facebook, Amazon, Google, Microsoft, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `prefix-sum-hashmap`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Negative values are present in the constraints, which immediately rules out a sliding window - extending the window can decrease the sum, so shrinking is not a valid correction. Prefix sums with a hash map is the technique that survives negatives.

**Trick.** A subarray (j, i] sums to k exactly when P(j) = P(i) - k. Keep a map from prefix value to how many times it has occurred, seeded with {0: 1} for the empty prefix, and add the lookup result to the answer at each step.

**Edge cases that bite.**

- Seeding the map with {0, 1} is mandatory - without it every subarray starting at index 0 is missed.
- Prefix sums overflow int at 1e5 values of 1e9 - use long long.
- Count occurrences, not just presence; the same prefix value can recur many times.

**Complexity.** `O(n)` time, `O(n)` space — one pass with O(1) average map operations. The O(n^2) nested-loop version is the brute force. Space is the map holding up to n distinct prefixes.

**Same pattern.** [Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/), [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/), [Contiguous Array](https://leetcode.com/problems/contiguous-array/), [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/)

**Interview follow-ups.**

- **Q.** Why not a sliding window?
  <br>**A.** Sliding windows need monotone contributions. With negatives, adding an element can lower the sum, so the shrink rule is unsound and windows miss valid answers.
- **Q.** Count subarrays with sum divisible by k.
  <br>**A.** Same structure keyed on prefix sum mod k, with care to normalise negative remainders by adding k before taking the modulus.
- **Q.** Longest such subarray rather than the count.
  <br>**A.** Store the FIRST index at which each prefix value occurred, not a count, and take i - j.

</details>

#### `[CORE]` 8. Max Consecutive Ones III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1004

<!-- id:arrays-max-consecutive-ones-iii | order:27 | day:5 | pattern:variable-window | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/max-consecutive-ones-iii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/max-consecutive-ones-iii) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3E4JBHSLpYk)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `variable-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Reframe 'flip at most k zeros' as 'longest window containing at most k zeros'. That removes the flipping entirely and turns it into a standard variable-size window with a single counter.

**Trick.** Expand right always, incrementing a zero counter. While the counter exceeds k, advance left, decrementing when the departing element is a zero. The answer is the largest window seen.

**Edge cases that bite.**

- k = 0 degrades correctly to the plain longest-run problem.
- All zeros with k >= n returns n.
- The window is never shrunk below validity, so the answer is taken after the shrink loop.

**Complexity.** `O(n)` time, `O(1)` space — each index enters and leaves the window exactly once, so the nested while contributes O(n) in total. One counter, no map needed since there are only two symbols.

**Same pattern.** [Max Consecutive Ones](https://leetcode.com/problems/max-consecutive-ones/), [Longest Subarray of 1's After Deleting One Element](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/), [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/), [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/)

**Interview follow-ups.**

- **Q.** You must delete exactly one element.
  <br>**A.** LC 1493 - same window with k = 1, then subtract one because the deletion is compulsory.
- **Q.** The non-shrinking window variant.
  <br>**A.** Some implementations never shrink, only slide, keeping the window at its maximum size. It works because the answer only needs the largest window ever achieved, and it removes the inner loop entirely.

</details>

#### `[DRILL]` 9. Insert Interval &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 57

<!-- id:arrays-insert-interval | order:16 | day:5 | pattern:three-phase-sweep | template:T-GREEDY-02 -->

[Solve on LeetCode](https://leetcode.com/problems/insert-interval/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/insert-new-interval) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xxRE-46OCC8)

**Asked by:** Google, Facebook, Amazon, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `three-phase-sweep`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The input is already sorted, so sorting again wastes the free information. The list splits cleanly into three regions - before, overlapping, after - and each is handled by its own loop.

**Trick.** Phase 1: emit every interval ending before the new one starts. Phase 2: absorb every overlapping interval into the new one by taking min of starts and max of ends, then emit it. Phase 3: emit the rest unchanged.

**Edge cases that bite.**

- The new interval may overlap nothing and belong at either end.
- It may swallow every existing interval.
- Empty input returns just the new interval.

**Complexity.** `O(n)` time, `O(1) excluding output` space — one pass over the sorted input with no sort. Sorting first would be O(n log n) and throws away the precondition.

**Same pattern.** [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/), [My Calendar I](https://leetcode.com/problems/my-calendar-i/)

**Interview follow-ups.**

- **Q.** Many insertions rather than one.
  <br>**A.** Repeated O(n) insertion is O(n*k). Better to collect them all and merge once, or keep the set in a std::map keyed by start for O(log n) insertion.
- **Q.** Why three loops instead of one with branches?
  <br>**A.** Each region has a different rule and no interleaving. Three simple loops are easier to prove correct than one loop with three-way branching.

</details>

#### `[DRILL]` 10. Best Time to Buy and Sell Stock II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 122

<!-- id:arrays-best-time-to-buy-and-sell-stock-ii | order:19 | day:5 | pattern:greedy-positive-deltas | template:T-DP-05 -->

[Solve on LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/buy-and-sell-stock-ii-dp-36/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nGJmxkUJQGs)

**Asked by:** Amazon, Microsoft, Bloomberg, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `greedy-positive-deltas`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** With unlimited transactions, any profitable multi-day hold decomposes into a sequence of profitable single-day holds, and any unprofitable day can simply be skipped. So the answer is the sum of every positive daily difference.

**Trick.** Sum max(0, p[i] - p[i-1]). No state machine, no DP - just one pass. The decomposition argument is what makes the greedy exact rather than approximate.

**Edge cases that bite.**

- Monotonically decreasing prices yield 0.
- Buying and selling on the same day contributes nothing, which is why max(0, ...) is safe.
- No transaction-count limit is what permits this; add one and greedy breaks immediately.

**Complexity.** `O(n)` time, `O(1)` space — single pass with an accumulator. The DP formulation gives the same answer in O(n) but with two states - unnecessary here, essential once a limit appears.

**Same pattern.** [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/), [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/), [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

**Interview follow-ups.**

- **Q.** Add a transaction fee.
  <br>**A.** Greedy breaks - you can no longer treat each day independently, because the fee makes short holds unprofitable. Switch to the two-state DP (holding / not holding).
- **Q.** At most two transactions.
  <br>**A.** LC 123. Track four states: after first buy, first sell, second buy, second sell. The generalisation to k is LC 188.
- **Q.** Prove the decomposition.
  <br>**A.** A hold from day i to day j yields p[j] - p[i], which telescopes to the sum of consecutive differences. Dropping the negative terms can only increase the total.

</details>

#### `[DRILL]` 11. Find Minimum in Rotated Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 153

<!-- id:arrays-find-minimum-in-rotated-sorted-array | order:22 | day:5 | pattern:rotated-binary-search | template:T-BS-03 -->

[Solve on LeetCode](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nhEMDKMB44g)

**Asked by:** Amazon, Microsoft, Goldman Sachs, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `rotated-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The minimum is the single point where the descending step occurs. Comparing the midpoint against the RIGHT endpoint tells you which half contains that break - comparing against the left endpoint does not work reliably.

**Trick.** While l < r: if a[m] > a[r] the break is right of m, so l = m + 1; otherwise the minimum is at m or left of it, so r = m. Never m - 1, or you can skip the answer.

**Edge cases that bite.**

- An unrotated array returns a[0], which the a[m] <= a[r] branch handles.
- Two elements is the tightest case - check it by hand.
- With duplicates this degrades to O(n), which is LC 154.

**Complexity.** `O(log n)` time, `O(1)` space — each iteration halves the range. Note this cannot be O(log n) with duplicates, because a[l] == a[m] == a[r] carries no information.

**Same pattern.** [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/), [Find Minimum in Rotated Sorted Array II](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array-ii/), [Find Peak Element](https://leetcode.com/problems/find-peak-element/)

**Interview follow-ups.**

- **Q.** Why compare against a[r] and not a[l]?
  <br>**A.** In an unrotated array a[m] > a[l] holds for the left half too, so the left comparison cannot distinguish rotated from unrotated. The right comparison can.
- **Q.** How many times was the array rotated?
  <br>**A.** The index of the minimum is exactly the rotation count - same algorithm, return the index.
- **Q.** With duplicates.
  <br>**A.** When a[m] == a[r] you cannot tell which side holds the break, so decrement r by one and accept O(n) worst case.

</details>

#### `[DRILL]` 12. Rotate Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 189

<!-- id:arrays-rotate-array | order:23 | day:5 | pattern:triple-reverse | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/rotate-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/left-rotate-the-array-by-one/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=wvcQg43_V8U&t=61)

**Asked by:** Amazon, Microsoft, Apple, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `triple-reverse`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rotating by k is the same as reversing the whole array and then un-reversing the two pieces. Three reversals, no extra memory - and the derivation is more valuable than the trick itself.

**Trick.** k %= n first, always. Then reverse(0, n-1), reverse(0, k-1), reverse(k, n-1).

**Edge cases that bite.**

- k larger than n - without k %= n you reverse ranges out of bounds.
- k = 0 or k = n is a no-op after the modulo.
- The modulo must come before any use of k, including in the first reverse.

**Complexity.** `O(n)` time, `O(1)` space — three linear reversals, each touching every element once. Using a temporary array is O(n) time but O(n) space, which the follow-up forbids.

**Same pattern.** [Reverse String](https://leetcode.com/problems/reverse-string/), [Next Permutation](https://leetcode.com/problems/next-permutation/), [Rotate List](https://leetcode.com/problems/rotate-list/)

**Interview follow-ups.**

- **Q.** The cyclic-replacement alternative.
  <br>**A.** Move each element directly to its destination, following cycles. The number of cycles is gcd(n, k), so you need an outer loop over starting points. One pass, but much easier to get wrong.
- **Q.** Rotate left instead of right.
  <br>**A.** Left rotation by k is right rotation by n - k. One line of adjustment.

</details>

#### `[DRILL]` 13. Majority Element II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 229

<!-- id:arrays-majority-element-ii | order:24 | day:5 | pattern:extended-boyer-moore | template:T-ARR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/majority-element-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/majority-elementsn-3-times-find-the-elements-that-appears-more-than-n-3-times-in-the-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=vwZj1K0e9U8)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `extended-boyer-moore`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** At most two values can each appear more than n/3 times, because three such values would need more than n elements. That bound is what makes a constant-space solution possible at all - you only ever need two candidates.

**Trick.** Run two independent Boyer-Moore counters. The order of the branches matters: check 'matches candidate 1', then 'matches candidate 2', then 'counter 1 is zero', then 'counter 2 is zero', then decrement both. A verification pass at the end is mandatory.

**Edge cases that bite.**

- The verification pass is NOT optional here - unlike n/2, existence is not guaranteed.
- The two candidates must be initialised to distinct sentinel values, or an early element fills both slots.
- Strictly more than n/3, so exactly n/3 does not qualify.

**Complexity.** `O(n)` time, `O(1)` space — two passes, four scalars. A hash map solution is also O(n) time but O(n) space, which the follow-up rules out.

**Same pattern.** [Majority Element](https://leetcode.com/problems/majority-element/), [Single Number](https://leetcode.com/problems/single-number/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

**Interview follow-ups.**

- **Q.** Generalise to more than n/k times.
  <br>**A.** At most k-1 such values exist, so keep k-1 candidates and counters. The verification pass stays mandatory. This is the Misra-Gries algorithm.
- **Q.** Why must the branch order be exactly that?
  <br>**A.** If you check for a zero counter before checking equality with the other candidate, a value equal to candidate 2 can overwrite candidate 1 when counter 1 happens to be zero, losing a genuine majority.

</details>

#### `[DRILL]` 14. Count Number of Nice Subarrays &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1248

<!-- id:arrays-count-number-of-nice-subarrays | order:28 | day:5 | pattern:at-most-k-difference | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/count-number-of-nice-subarrays/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/count-number-of-nice-subarrays) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=j_QOv9OT9Og)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `at-most-k-difference`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting subarrays with EXACTLY k odd numbers is awkward directly, but atMost(k) - atMost(k-1) gives it immediately - and atMost is a routine sliding window. This decomposition is worth more than the problem.

**Trick.** Write a helper counting subarrays with at most k odd numbers by accumulating (r - l + 1) at each right endpoint, then return atMost(k) - atMost(k-1).

**Edge cases that bite.**

- k = 0 must be handled - atMost(-1) is 0 by definition, so guard the helper.
- Accumulating r - l + 1 counts every valid subarray ending at r, not just the longest.
- The prefix-sum-on-odd-counts alternative also works and is worth knowing.

**Complexity.** `O(n)` time, `O(1)` space — two linear passes, each a single window. The prefix-count map alternative is also O(n) but uses O(n) space.

**Same pattern.** [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/), [Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/), [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)

**Interview follow-ups.**

- **Q.** Solve it with prefix sums instead.
  <br>**A.** Map the array to 1 for odd and 0 for even, then it is exactly Subarray Sum Equals K. Same problem in different clothing - noticing that is the real lesson.
- **Q.** Why does atMost(k) - atMost(k-1) give exactly k?
  <br>**A.** Every subarray with at most k is counted in the first term; those with at most k-1 are counted in both and cancel. What remains has exactly k.

</details>

### Day 5 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The sort key IS the interval algorithm.** Sort by START to merge overlapping intervals. Sort by END to schedule the maximum number of non-overlapping ones. Choosing the wrong key gives a plausible-looking wrong answer.
  <br>↳ *Merge Intervals* — sorting by start so each interval need only be compared with the previous output; *Non-overlapping Intervals* — sorting by end, because the earliest finisher leaves the most room; *Insert Interval* — exploiting the already-sorted input to avoid sorting at all
- **Negatives forbid a sliding window.** A window needs extending to move the aggregate one way only, so that shrinking is a valid correction. Negative values break that, and prefix sums with a hash map are the replacement.
  <br>↳ *Subarray Sum Equals K* — prefix sums keyed in a map, seeded with {0,1}, because the constraints permit negative values; *Max Consecutive Ones III* — a window IS valid here, because zeros only ever increase the count being bounded
- **Count subarrays by their right endpoint.** For a valid window [l, r], every subarray ending at r and starting at or after l is also valid. Adding r - l + 1 counts them all without enumerating any.
  <br>↳ *Count Number of Nice Subarrays* — accumulating r - l + 1 inside the atMost helper; *Subarray Sum Equals K* — counting prefix occurrences rather than subarrays directly
- **exactly(k) = atMost(k) - atMost(k-1).** Exact-count constraints rarely admit a clean window, but at-most constraints always do. The difference of two at-most counts gives the exact one for free.
  <br>↳ *Count Number of Nice Subarrays* — two calls to an atMost helper, subtracted
- **Reuse the input as marker storage for O(1) space.** When the problem forbids extra memory, look for cells whose values you no longer need. The first row and column, or a sign bit, can carry the flags.
  <br>↳ *Set Matrix Zeroes* — using row 0 and column 0 as the zero flags, plus one extra boolean for their overlap at (0,0)
- **Carry both extremes when a negative can flip them.** Under multiplication the smallest running value becomes the largest when multiplied by a negative. Tracking only the maximum discards the route to the real answer.
  <br>↳ *Maximum Product Subarray* — tracking curMax and curMin together and swapping them on a negative
- **Start only from the heads of a run.** An apparently nested loop is linear when the inner loop can only start at elements with no predecessor, because each element then belongs to exactly one run.
  <br>↳ *Longest Consecutive Sequence* — counting a run only from values x for which x-1 is absent from the set
- **Three-way partition in one pass.** With exactly three classes, three pointers suffice. The subtlety is that swapping with the high pointer brings in an unexamined value, so the middle pointer must not advance.
  <br>↳ *Sort Colors* — low, mid and high, with mid held still after the 2-swap

#### From yesterday

- **A read pointer and a write pointer beat a second array.** Whenever elements must be removed or reordered in place, one pointer scans and another marks where the next kept element belongs. ↳ *Remove Duplicates from Sorted Array* — the write index trailing the read index by the number of duplicates seen
- **Sortedness turns a search into an adjacency check.** In a sorted array, anything you would otherwise search for is next to you. ↳ *Remove Duplicates from Sorted Array* — comparing a[read] against the last written value rather than scanning for a match
- **Write into free space from the end when merging in place.** Merging forward needs somewhere to put displaced elements. ↳ *Merge Sorted Array* — three pointers walking backwards so every write lands in guaranteed-empty tail space
- **A running extreme replaces an inner loop.** If the best answer at index i depends only on some aggregate of everything before it, carry that aggregate forward in a scalar. ↳ *Best Time to Buy and Sell Stock* — tracking the minimum price seen so far instead of trying every earlier buy day
- **Extend or restart is the whole of Kadane.** The best subarray ending at i either extends the best one ending at i-1 or begins fresh at i. ↳ *Maximum Subarray* — cur = max(a[i], cur + a[i]), with best initialised to a[0] rather than 0
- **Decompose a hard rearrangement into reversals.** Rotations and word reversals both follow from reverse(reverse(A) + reverse(B)) = B + A. ↳ *Rotate Image* — transpose then reverse each row, which is a 90 degree rotation
- **Scan from the right when the answer depends on the suffix.** A suffix that is already maximal tells you the change must happen before it. ↳ *Next Permutation* — finding the rightmost i with a[i] < a[i+1], which is where the suffix stops being maximal

### Day 6

*16 problems — 9 core, 6 drill, 1 skim.*

#### `[CORE]` 1. Binary Search &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 704

<!-- id:binary-search-binary-search | order:29 | day:6 | pattern:exact-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-search/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/binary-search-explained/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=MHf6awe89xw)

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

#### `[CORE]` 2. Search in Rotated Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 33

<!-- id:binary-search-search-in-rotated-sorted-array | order:31 | day:6 | pattern:rotated-binary-search | template:T-BS-03 -->

[Solve on LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=r3pMQ8-Ad5s)

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

#### `[CORE]` 3. Find First and Last Position of Element in Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 34

<!-- id:binary-search-find-first-and-last-position-of-element-in-sorted-array | order:32 | day:6 | pattern:boundary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/last-occurrence-in-a-sorted-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=hjR1IYVx9lY)

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

<!-- id:binary-search-find-peak-element | order:35 | day:6 | pattern:slope-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/find-peak-element/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/peak-element-in-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=cXxmbemS6XM)

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

#### `[CORE]` 5. Search a 2D Matrix II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 240

<!-- id:binary-search-search-a-2d-matrix-ii | order:36 | day:6 | pattern:staircase-search | template:T-BS-04 -->

[Solve on LeetCode](https://leetcode.com/problems/search-a-2d-matrix-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/search-in-a-row-and-column-wise-sorted-matrix/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9ZbB397jU4k)

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

#### `[CORE]` 6. Single Element in a Sorted Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 540

<!-- id:binary-search-single-element-in-a-sorted-array | order:37 | day:6 | pattern:parity-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/single-element-in-a-sorted-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/search-single-element-in-a-sorted-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=AZOmHuHadxQ)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `parity-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Before the unique element, every pair starts at an even index. After it, every pair starts at an odd index. That parity flip is a monotone predicate, which is exactly what binary search needs - the sortedness is almost incidental.

**Trick.** Force m to be even with `m -= m & 1`. If a[m] == a[m+1] the unique element is to the right, so l = m + 2; otherwise r = m. The pairing is what you binary search on.

**Edge cases that bite.**

- m must be even before the comparison, or the pairing logic inverts.
- l = m + 2, not m + 1 - you are skipping a complete pair.
- Single-element array returns it immediately.

**Complexity.** `O(log n)` time, `O(1)` space — each step discards half the pairs. XOR-ing the whole array is O(n) and also O(1) space, so the log bound is the only reason to prefer this.

**Same pattern.** [Single Number](https://leetcode.com/problems/single-number/), [Find Peak Element](https://leetcode.com/problems/find-peak-element/), [First Bad Version](https://leetcode.com/problems/first-bad-version/)

**Interview follow-ups.**

- **Q.** Why not just XOR everything?
  <br>**A.** That is O(n). The array being sorted is the extra information that permits O(log n), and ignoring it is the mistake the problem is testing for.
- **Q.** The index-XOR trick.
  <br>**A.** `m ^ 1` gives m's pair partner regardless of m's parity - a neater way to express the same comparison without forcing evenness.

</details>

#### `[CORE]` 7. Koko Eating Bananas &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 875

<!-- id:binary-search-koko-eating-bananas | order:38 | day:6 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/koko-eating-bananas/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/binary-search/koko-eating-bananas/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=qyfekrNni90)

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

#### `[CORE]` 8. Median of Two Sorted Arrays &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 4

<!-- id:binary-search-median-of-two-sorted-arrays | order:43 | day:6 | pattern:partition-binary-search | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/median-of-two-sorted-arrays/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NTop3VTjmxk)

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

#### `[CORE]` 9. Split Array Largest Sum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 410

<!-- id:binary-search-split-array-largest-sum | order:44 | day:6 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/split-array-largest-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/split-array-largest-sum/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=thUd_WJn6wk)

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

#### `[DRILL]` 10. Kth Missing Positive Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1539

<!-- id:binary-search-kth-missing-positive-number | order:30 | day:6 | pattern:count-missing-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/kth-missing-positive-number/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/kth-missing-positive-number/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=uZ0N_hZpyps)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `count-missing-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** At index i the count of missing positives below a[i] is a[i] - (i + 1). That expression is monotonically non-decreasing, which is exactly the precondition binary search needs - so a linear scan becomes logarithmic.

**Trick.** Binary search for the first index where a[i] - (i + 1) >= k. The answer is then l + k, where l is that index. Deriving that final formula on paper beats memorising it.

**Edge cases that bite.**

- The answer may exceed every array element, which l + k handles without a special case.
- k missing before the first element - the search returns l = 0 and the formula still works.
- The array is strictly increasing by constraint, which is what makes the count monotone.

**Complexity.** `O(log n)` time, `O(1)` space — one binary search over the index space. The linear scan is O(n) and is the expected first answer before the follow-up.

**Same pattern.** [Missing Number](https://leetcode.com/problems/missing-number/), [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/), [Search Insert Position](https://leetcode.com/problems/search-insert-position/)

**Interview follow-ups.**

- **Q.** Derive the final formula.
  <br>**A.** After the search, l elements are present below the answer, so the answer is the kth missing counted from 1 with l present numbers interleaved: l + k.
- **Q.** The array is not sorted.
  <br>**A.** Binary search is unavailable. Use a hash set and scan upward, or sort first at O(n log n).

</details>

#### `[DRILL]` 11. Search a 2D Matrix &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 74

<!-- id:binary-search-search-a-2d-matrix | order:33 | day:6 | pattern:flattened-2d-search | template:T-BS-04 -->

[Solve on LeetCode](https://leetcode.com/problems/search-a-2d-matrix/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/search-in-a-sorted-2d-matrix/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ZYpYur0znng)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `flattened-2d-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** When each row begins after the previous row ends, the matrix is already one sorted sequence. The only work is the index arithmetic that maps a flat position back to a row and column.

**Trick.** Treat indices 0 to m*n-1 as one array and read g[mid / n][mid % n]. Division gives the row, modulo gives the column.

**Edge cases that bite.**

- Use n (the column count) in both the division and the modulo - using m is the standard slip.
- m*n can overflow int for very large matrices; the constraints here keep it safe.
- Empty matrix or empty first row must be rejected before computing n.

**Complexity.** `O(log(m·n))` time, `O(1)` space — one binary search over m*n candidates. Searching for the row first and then within it is O(log m + log n), which is the same bound.

**Same pattern.** [Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/), [Binary Search](https://leetcode.com/problems/binary-search/), [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/)

**Interview follow-ups.**

- **Q.** Rows are sorted but do not chain across rows.
  <br>**A.** The flattening breaks. Use the staircase walk from the top-right corner, O(m + n) - that is LC 240.
- **Q.** Two separate binary searches instead.
  <br>**A.** Binary search the first column to find the candidate row, then search within it. Same complexity, and arguably clearer than the index arithmetic.

</details>

#### `[DRILL]` 12. Search in Rotated Sorted Array II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 81

<!-- id:binary-search-search-in-rotated-sorted-array-ii | order:34 | day:6 | pattern:rotated-with-duplicates | template:T-BS-03 -->

[Solve on LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/search-element-in-rotated-sorted-array-ii) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=w2G2W8l__pc)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `rotated-with-duplicates`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The point of this problem is that duplicates break the O(log n) guarantee, and knowing WHY is more valuable than the code. When a[l] == a[m] == a[r] the array carries no information about which side holds the break.

**Trick.** Add one branch to the LC 33 solution: when a[l] == a[m] && a[m] == a[r], do l++ and r-- and continue. Everything else is unchanged.

**Edge cases that bite.**

- [1,1,1,0,1] is the canonical case that defeats naive half-identification.
- Shrinking by one on each side is the only safe move - you cannot discard a half.
- Worst case is O(n) and this must be stated, not hidden.

**Complexity.** `O(log n) average, O(n) worst` time, `O(1)` space — the ambiguous case degrades to linear scanning. An adversary can make every element equal except the target, forcing n comparisons - the bound is provably unavoidable.

**Same pattern.** [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/), [Find Minimum in Rotated Sorted Array II](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array-ii/), [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

**Interview follow-ups.**

- **Q.** Prove O(n) is unavoidable.
  <br>**A.** Given [1,1,...,1] with one element changed, any algorithm examining fewer than n elements can be defeated by an adversary placing the different value at an unexamined index.
- **Q.** Does the same degradation hit Find Minimum with duplicates?
  <br>**A.** Yes - LC 154, same reason and same fix.

</details>

#### `[DRILL]` 13. Capacity To Ship Packages Within D Days &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1011

<!-- id:binary-search-capacity-to-ship-packages-within-d-days | order:39 | day:6 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/capacity-to-ship-packages-within-d-days/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=MG-Ac4TAvTY)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `binary-search-on-answer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Identical in shape to Koko, with a greedy feasibility check instead of an arithmetic one. Seeing two superficially different problems collapse to the same template is the point of doing both.

**Trick.** Search capacity in [max(weights), sum(weights)]. feasible(cap) greedily fills days: add weights until the next would exceed cap, then start a new day. Count days and compare to d.

**Edge cases that bite.**

- lo must be max(weights), not 1 - a capacity below the heaviest package can never ship it.
- hi = sum(weights) ships everything in one day and is always feasible.
- Package order is fixed, which is what makes the greedy fill correct.

**Complexity.** `O(n log(sum of weights))` time, `O(1)` space — about 30 iterations of an O(n) greedy check. The greedy is exact because packages cannot be reordered - each day simply takes as much as it can.

**Same pattern.** [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/), [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/), [Minimized Maximum of Products Distributed to Any Store](https://leetcode.com/problems/minimized-maximum-of-products-distributed-to-any-store/)

**Interview follow-ups.**

- **Q.** Why is the greedy fill optimal?
  <br>**A.** Leaving capacity unused on a day can never reduce the total number of days, since the packages are in fixed order and must be shipped contiguously.
- **Q.** Packages may be reordered.
  <br>**A.** The problem becomes bin packing, which is NP-hard. The fixed order is what keeps this tractable - noticing that is worth saying aloud.

</details>

#### `[DRILL]` 14. Find the Smallest Divisor Given a Threshold &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1283

<!-- id:binary-search-find-the-smallest-divisor-given-a-threshold | order:40 | day:6 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/find-the-smallest-divisor-given-a-threshold/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=UvBKTVaG6U8)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `binary-search-on-answer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Third instance of the same template, and by now you should recognise it from the phrasing alone: 'smallest divisor such that the sum is at most threshold'. Larger divisors give smaller sums, so feasibility is monotone.

**Trick.** Search divisor in [1, max(nums)]. feasible(d) sums ceil(a[i] / d) and compares to the threshold. Integer ceiling again: (a[i] + d - 1) / d.

**Edge cases that bite.**

- lo = 1, since divisor zero is undefined.
- hi = max(nums) makes every term 1, giving a sum of n, which the constraints guarantee is within the threshold.
- Sums fit in int here, but checking the constraints is the habit.

**Complexity.** `O(n log(max value))` time, `O(1)` space — logarithmic search over the value range with a linear feasibility check.

**Same pattern.** [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/), [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/), [Minimum Number of Days to Make m Bouquets](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/)

**Interview follow-ups.**

- **Q.** Name the three parts of any answer-space search.
  <br>**A.** The monotone predicate, the lower bound, and the upper bound. Getting the bounds wrong is the usual failure, not the loop.
- **Q.** Maximise rather than minimise.
  <br>**A.** Flip the predicate and the branch assignments. The template is otherwise unchanged.

</details>

#### `[DRILL]` 15. Minimum Number of Days to Make m Bouquets &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1482

<!-- id:binary-search-minimum-number-of-days-to-make-m-bouquets | order:41 | day:6 | pattern:binary-search-on-answer | template:T-BS-02 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/minimum-days-to-make-m-bouquets/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=TXAuxeYBTdg)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `binary-search-on-answer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The feasibility check here is a run-length scan rather than arithmetic, which is the only thing distinguishing it from Koko. Waiting longer never reduces the number of bouquets you can make, so the predicate is monotone in days.

**Trick.** Search days in [min(bloom), max(bloom)]. feasible(d) walks the array counting consecutive flowers with bloomDay <= d, converting each run of length k into k / group bouquets and resetting the run on any later-blooming flower.

**Edge cases that bite.**

- If m * k > n, no arrangement can ever work - return -1 before searching.
- Adjacency is required, so the run counter must reset, not merely pause.
- m * k overflows int when both are large - use long long for that check.

**Complexity.** `O(n log(max bloom day))` time, `O(1)` space — logarithmic search with a linear run-length check.

**Same pattern.** [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/), [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/), [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/)

**Interview follow-ups.**

- **Q.** Why check m * k > n first?
  <br>**A.** It is the only case where the answer does not exist, and detecting it up front keeps the search bounds valid.
- **Q.** Flowers need not be adjacent.
  <br>**A.** Then it is simply the m*k-th smallest bloom day - sort or use nth_element. The adjacency constraint is what forces the scan.

</details>

#### `[SKIM]` 16. Find a Peak Element II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1901

<!-- id:binary-search-find-a-peak-element-ii | order:42 | day:6 | pattern:2d-slope-search | template:T-BS-04 -->

[Solve on LeetCode](https://leetcode.com/problems/find-a-peak-element-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-peak-element-2d-matrix) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nGGp5XBzC4g)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `2d-slope-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The 1D containment invariant lifts to two dimensions if you binary search columns and collapse each candidate column to its maximum element. That maximum is already the largest in its column, so only its horizontal neighbours can beat it.

**Trick.** Binary search on the column index. In the middle column find the row-wise maximum, then compare it against its left and right neighbours to decide which half of the columns to keep.

**Edge cases that bite.**

- Taking the column maximum is essential - an arbitrary element gives no guarantee vertically.
- Boundary columns count as peaks under the -infinity convention.
- Neighbours are only the four orthogonal cells, not diagonals.

**Complexity.** `O(m log n)` time, `O(1)` space — log n column halvings, each scanning a column of m elements. Scanning the whole matrix is O(m*n).

**Same pattern.** [Find Peak Element](https://leetcode.com/problems/find-peak-element/), [Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/)

**Interview follow-ups.**

- **Q.** Why the column maximum specifically?
  <br>**A.** It dominates vertically by construction, so if it also beats both horizontal neighbours it is a peak. If not, a larger neighbour guarantees a peak exists on that side.
- **Q.** Binary search rows instead.
  <br>**A.** Symmetric, giving O(n log m). Choose whichever dimension is smaller to search.

</details>

### Day 6 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Compute the midpoint as l + (r - l) / 2.** (l + r) / 2 overflows when both bounds are large. The alternative is algebraically identical and cannot overflow - this defect shipped in Java's standard library for nine years.
  <br>↳ *Binary Search* — the midpoint expression itself; *Median of Two Sorted Arrays* — the same form applied to the partition index
- **Pick one interval convention and never mix them.** Half-open [l, r) with `while (l < r)` makes boundary searches nearly bug-free, because termination gives l == r which is directly the answer. Closed [l, r] suits exact-match searches.
  <br>↳ *Search Insert Position* — r = n rather than n-1, so the answer can legitimately be n; *Find First and Last Position of Element in Sorted Array* — two half-open boundary searches rather than a hit plus expansion
- **Search the answer space when the array is not what is sorted.** 'Minimum X such that a condition holds' is the signature. Feasibility must be monotone in X, and then the same loop applies with a predicate in place of a comparison.
  <br>↳ *Koko Eating Bananas* — searching eating speed, with feasibility as total hours <= h; *Capacity To Ship Packages Within D Days* — searching capacity, with a greedy day count as the predicate; *Split Array Largest Sum* — searching the largest allowed part sum; *Find the Smallest Divisor Given a Threshold* — searching the divisor; *Minimum Number of Days to Make m Bouquets* — searching days, with a run-length scan as the predicate
- **Getting lo and hi right is where answer-space searches fail.** hi must be feasible and lo must be at or below the true answer. The loop is rarely the bug; the bounds almost always are.
  <br>↳ *Capacity To Ship Packages Within D Days* — lo = max(weights), since no smaller capacity can carry the heaviest package; *Split Array Largest Sum* — lo = max(nums) and hi = sum(nums)
- **One half of a rotated array is always sorted.** A single rotation creates exactly one break point, so any split leaves at least one ordered half. Identify it, then test whether the target lies within its range.
  <br>↳ *Search in Rotated Sorted Array* — comparing a[l] with a[m] to identify the sorted half, then range-testing the target; *Find Minimum in Rotated Sorted Array* — comparing a[m] with a[r], which distinguishes rotated from unrotated where the left comparison cannot
- **Duplicates destroy the logarithmic guarantee.** When a[l] == a[m] == a[r] the array carries no information about which side holds the break, so the only safe move is to shrink both ends by one. The worst case becomes linear and this is provably unavoidable.
  <br>↳ *Search in Rotated Sorted Array II* — the extra branch shrinking both ends, and the O(n) worst case it implies
- **Binary search needs monotonicity, not order.** The real precondition is that the current range provably contains the answer and that one half can be discarded. A sorted array is only the most familiar instance of that.
  <br>↳ *Find Peak Element* — discarding a half of an unsorted array using the rising-slope invariant; *Single Element in a Sorted Array* — binary searching on pair parity rather than on value
- **Some 2D problems are 1D in disguise.** A matrix whose rows chain end to start is one sorted sequence; index it with mid / n and mid % n. A matrix sorted only within rows and columns needs a corner walk instead.
  <br>↳ *Search a 2D Matrix* — flattening to a single binary search over m*n; *Search a 2D Matrix II* — the staircase from the top-right, eliminating a row or column per step

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass

### Day 7

*18 problems — 5 core, 7 drill, 6 skim.*

#### `[CORE]` 1. Valid Parentheses &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 20

<!-- id:strings-valid-parentheses | order:47 | day:7 | pattern:bracket-stack | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-parentheses/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-for-balanced-parentheses/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xwjS0iZhw4I)

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

#### `[CORE]` 2. Longest Substring Without Repeating Characters &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 3

<!-- id:strings-longest-substring-without-repeating-characters | order:54 | day:7 | pattern:variable-window | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-substring-without-repeating-characters/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=-zSxTJkcdAo)

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

#### `[CORE]` 3. Longest Palindromic Substring &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 5

<!-- id:strings-longest-palindromic-substring | order:55 | day:7 | pattern:expand-around-centre | template:T-STR-02 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-palindromic-substring/)

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

#### `[CORE]` 4. Generate Parentheses &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 22

<!-- id:strings-generate-parentheses | order:57 | day:7 | pattern:backtracking-with-invariant | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/generate-parentheses/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/generate-parenthesis)

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

#### `[CORE]` 5. Longest Repeating Character Replacement &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 424

<!-- id:strings-longest-repeating-character-replacement | order:60 | day:7 | pattern:window-with-max-frequency | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-repeating-character-replacement/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/longest-repeating-character-replacement) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_eNhaDCr6P0)

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

#### `[DRILL]` 6. Roman to Integer &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 13

<!-- id:strings-roman-to-integer | order:45 | day:7 | pattern:lookahead-subtraction | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/roman-to-integer/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/roman-numerals-to-integer)

**Asked by:** Amazon, Microsoft, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lookahead-subtraction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Roman numerals are additive except when a smaller symbol precedes a larger one, which signals subtraction. So one lookahead comparison replaces the entire table of special cases like IV, IX, XL.

**Trick.** Walk left to right. If value(s[i]) < value(s[i+1]), subtract it; otherwise add it. Six subtractive pairs collapse into that single rule.

**Edge cases that bite.**

- The last character has no successor - guard the lookahead or handle it after the loop.
- Only I, X and C can be subtractive, but the general rule handles that automatically.
- Input is guaranteed valid, so malformed numerals need no rejection.

**Complexity.** `O(n)` time, `O(1)` space — one pass over at most 15 characters with a fixed-size lookup table.

**Same pattern.** [Integer to Roman](https://leetcode.com/problems/integer-to-roman/), [String to Integer (atoi)](https://leetcode.com/problems/string-to-integer-atoi/), [Excel Sheet Column Number](https://leetcode.com/problems/excel-sheet-column-number/)

**Interview follow-ups.**

- **Q.** Integer to Roman.
  <br>**A.** Greedy: a descending table of values including the subtractive pairs (900, 400, 90, 40, 9, 4), repeatedly taking the largest that fits.
- **Q.** Validate a Roman numeral.
  <br>**A.** Now the special cases matter - a regular expression, or explicit rules about repetition limits and which subtractions are legal.

</details>

#### `[DRILL]` 7. Valid Palindrome &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 125

<!-- id:strings-valid-palindrome | order:48 | day:7 | pattern:two-pointer-skip | template:T-TP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-palindrome/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-the-given-string-is-palindrome-or-not/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=twuC1F6gLI8)

**Asked by:** Facebook, Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-pointer-skip`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The palindrome check is trivial; the problem is really about careful character filtering. Doing the filtering inline with two pointers avoids building a cleaned copy and keeps the space constant.

**Trick.** Pointers from both ends. Advance each past any non-alphanumeric character, then compare the lowercased values. Skip inside the outer loop, not in a preprocessing pass.

**Edge cases that bite.**

- A string of only punctuation is a valid palindrome - the pointers cross immediately.
- The skip loops need their own bounds checks or they run past the ends.
- Digits count as alphanumeric and must be compared, not skipped.

**Complexity.** `O(n)` time, `O(1)` space — each pointer moves monotonically inward, so together they traverse the string once. Building a filtered copy first is the same time but O(n) space.

**Same pattern.** [Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/), [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/), [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/), [Reverse String](https://leetcode.com/problems/reverse-string/)

**Interview follow-ups.**

- **Q.** One deletion is allowed.
  <br>**A.** LC 680 - on the first mismatch, try skipping the left character or the right, and check whether either remainder is a palindrome. O(n) still, because only one mismatch is ever explored.
- **Q.** At most k deletions.
  <br>**A.** Becomes DP - the longest palindromic subsequence of length at least n - k. No longer a two-pointer problem.

</details>

#### `[DRILL]` 8. Isomorphic Strings &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 205

<!-- id:strings-isomorphic-strings | order:49 | day:7 | pattern:bijection-check | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/isomorphic-strings/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/isomorphic-string)

**Asked by:** Amazon, Google, LinkedIn &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bijection-check`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A mapping is not enough - you need a BIJECTION. Checking only s-to-t accepts ('badc','baba'), because two source characters may map onto one target. Both directions must be verified.

**Trick.** Two arrays of size 256 storing last-seen positions, or two maps checked together. On each character pair, verify that the existing mapping in each direction is consistent before recording it.

**Edge cases that bite.**

- ('badc','baba') is the case that defeats one-directional checking.
- Different lengths fail immediately.
- The position-array trick uses i+1 as the stored value so that 0 means 'unseen'.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two fixed-size tables, so constant space for a bounded alphabet.

**Same pattern.** [Word Pattern](https://leetcode.com/problems/word-pattern/), [Valid Anagram](https://leetcode.com/problems/valid-anagram/), [Group Anagrams](https://leetcode.com/problems/group-anagrams/)

**Interview follow-ups.**

- **Q.** Word Pattern.
  <br>**A.** LC 290 - exactly the same bijection check with words as the second alphabet instead of characters.
- **Q.** Why is one direction insufficient?
  <br>**A.** It permits a many-to-one mapping. Isomorphism requires structure preservation in both directions, which is precisely a bijection.

</details>

#### `[DRILL]` 9. String to Integer (atoi) &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 8

<!-- id:strings-string-to-integer-atoi | order:56 | day:7 | pattern:spec-parsing | template:T-MATH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/string-to-integer-atoi/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/recursive-implementation-of-atoi)

**Asked by:** Amazon, Microsoft, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `spec-parsing`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** There is no algorithm here. This is a specification-following exercise, and it is asked precisely to see whether you enumerate the requirements before coding rather than patching failures one test at a time.

**Trick.** Four ordered phases: skip leading whitespace, read at most one sign, consume digits, stop at the first non-digit. Check overflow BEFORE each multiply, exactly as in Reverse Integer.

**Edge cases that bite.**

- '   -42' has leading spaces; '+-12' is invalid after the first sign; 'words123' yields 0.
- Overflow must clamp to INT_MAX or INT_MIN, not wrap.
- Whitespace is only skipped at the start; internal spaces terminate parsing.
- The empty string and a lone sign both yield 0.

**Complexity.** `O(n)` time, `O(1)` space — one pass with a handful of scalars. The difficulty is entirely in the case analysis.

**Same pattern.** [Reverse Integer](https://leetcode.com/problems/reverse-integer/), [Valid Number](https://leetcode.com/problems/valid-number/), [Add Strings](https://leetcode.com/problems/add-strings/), [Multiply Strings](https://leetcode.com/problems/multiply-strings/)

**Interview follow-ups.**

- **Q.** Detect overflow without a 64-bit type.
  <br>**A.** Before res = res*10 + d, test res > INT_MAX/10, or res == INT_MAX/10 && d > 7. The 7 comes from INT_MAX's last digit.
- **Q.** Why clamp instead of wrapping?
  <br>**A.** The specification says so, and signed overflow is undefined behaviour in C++, so wrapping is not even reliably reproducible.

</details>

#### `[DRILL]` 10. Reverse Words in a String &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 151

<!-- id:strings-reverse-words-in-a-string | order:59 | day:7 | pattern:reverse-then-fix | template:T-STR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/reverse-words-in-a-string/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/reverse-words-in-a-string/)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `reverse-then-fix`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Reversing the entire string puts the words in the right order but each word backwards. Reversing each word individually then fixes them - the same decomposition as rotating an array, and it generalises.

**Trick.** Reverse the whole string, then walk it reversing each word in place while simultaneously compacting: skip extra spaces and write words back with exactly one separator.

**Edge cases that bite.**

- Leading, trailing and repeated internal spaces must all collapse to single separators.
- A string of only spaces returns empty.
- In-place compaction needs a write pointer trailing the read pointer.

**Complexity.** `O(n)` time, `O(1) in C++ where the string is mutable` space — two passes - one full reversal and one word-wise pass that also compacts. Splitting into a vector of words and rejoining is simpler but O(n) extra space.

**Same pattern.** [Reverse String](https://leetcode.com/problems/reverse-string/), [Reverse Words in a String III](https://leetcode.com/problems/reverse-words-in-a-string-iii/), [Rotate Array](https://leetcode.com/problems/rotate-array/)

**Interview follow-ups.**

- **Q.** Reverse the characters of each word but keep word order.
  <br>**A.** LC 557 - just the second pass, without the full reversal.
- **Q.** Why is this the same idea as rotating an array?
  <br>**A.** Both use the identity reverse(reverse(A) + reverse(B)) = B + A. Rotation applies it once; this applies it per word.

</details>

#### `[DRILL]` 11. Sort Characters By Frequency &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 451

<!-- id:strings-sort-characters-by-frequency | order:61 | day:7 | pattern:count-then-sort | template:T-SORT-05 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-characters-by-frequency/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sort-characters-by-frequency)

**Asked by:** Amazon, Google, Bloomberg &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `count-then-sort`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Count, then order by count. The only real decision is whether to sort the distinct characters (O(k log k)) or bucket them by frequency (O(n)), and the bounded alphabet makes the choice obvious once you notice it.

**Trick.** Count into a fixed array, then either sort the (char, count) pairs by count descending, or bucket by frequency and read from the highest bucket down.

**Edge cases that bite.**

- Ties may be output in any order here - do not over-engineer stability.
- Build the output with reserve() or repeated append is O(n^2).
- Case-sensitive: 'A' and 'a' are distinct characters.

**Complexity.** `O(n + k log k), or O(n) with bucketing` time, `O(n)` space — counting is linear; sorting only the distinct characters is cheap since k is bounded. Bucket sort by frequency removes the log entirely because frequencies are bounded by n.

**Same pattern.** [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/), [Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/), [Relative Sort Array](https://leetcode.com/problems/relative-sort-array/), [Reorganize String](https://leetcode.com/problems/reorganize-string/)

**Interview follow-ups.**

- **Q.** Make it O(n).
  <br>**A.** Bucket sort: frequencies lie in [1, n], so index an array of buckets by frequency and read downward. Same instinct as counting sort.
- **Q.** Rearrange so no two adjacent characters are equal.
  <br>**A.** LC 767 - greedy with a max-heap, placing the most frequent remaining character that differs from the last placed. Impossible when one character exceeds (n+1)/2.

</details>

#### `[DRILL]` 12. Minimum Add to Make Parentheses Valid &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 921

<!-- id:strings-minimum-add-to-make-parentheses-valid | order:62 | day:7 | pattern:balance-counter | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/minimum-number-of-bracket-reversals-needed-to-make-an-expression-balanced)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `balance-counter`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** With a single bracket type you never need a stack, only its size. One counter tracks unmatched openers and another counts closers that arrived with nothing to match.

**Trick.** Walk the string. On '(' increment open. On ')' decrement open if positive, otherwise increment the needed-openers count. The answer is the sum of both at the end.

**Edge cases that bite.**

- A ')' arriving on zero open brackets requires an inserted '(' - it is not simply ignored.
- Leftover open brackets at the end each need a ')'.
- The empty string needs 0.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two integers. A stack would store openers you never inspect individually.

**Same pattern.** [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Minimum Remove to Make Valid Parentheses](https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/), [Longest Valid Parentheses](https://leetcode.com/problems/longest-valid-parentheses/), [Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/)

**Interview follow-ups.**

- **Q.** Return the corrected string rather than the count.
  <br>**A.** LC 1249 - mark unmatched indices using a stack of positions, then build the string skipping them. Here the stack is genuinely needed, because you need to know WHERE.
- **Q.** Validate with a wildcard '*' that can be either bracket or empty.
  <br>**A.** LC 678 - track a RANGE of possible open counts, [lo, hi], rather than a single value.

</details>

#### `[SKIM]` 13. Longest Common Prefix &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 14

<!-- id:strings-longest-common-prefix | order:46 | day:7 | pattern:vertical-scan | template:T-STR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-common-prefix/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/longest-common-prefix)

**Asked by:** Amazon, Google, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `vertical-scan`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Scanning vertically - character position across all strings simultaneously - lets you stop at the first mismatch, which is usually far sooner than comparing strings pairwise.

**Trick.** For position i, check that every string has that position and that every character matches the first string's. Return the prefix of that length on the first failure.

**Edge cases that bite.**

- Empty input returns an empty string.
- A string shorter than the prefix so far terminates the scan - check length before indexing.
- A single string is entirely its own prefix.

**Complexity.** `O(S) where S is the total characters` time, `O(1)` space — in the worst case every character of every string is examined, but the early exit makes it much faster in practice. Sorting and comparing only the first and last is O(S log n).

**Same pattern.** [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/), [Isomorphic Strings](https://leetcode.com/problems/isomorphic-strings/), [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/)

**Interview follow-ups.**

- **Q.** Sort-based alternative.
  <br>**A.** Sort the array; the common prefix of the whole set equals that of the first and last strings. O(S log n) but only two strings compared.
- **Q.** Many queries against a fixed dictionary.
  <br>**A.** Build a trie and walk down while each node has exactly one child and is not a word end.

</details>

#### `[SKIM]` 14. Rotate String &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 796

<!-- id:strings-rotate-string | order:50 | day:7 | pattern:concatenation-trick | template:T-STR-03 -->

[Solve on LeetCode](https://leetcode.com/problems/rotate-string/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-one-string-is-rotation-of-another)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `concatenation-trick`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Every rotation of s appears as a substring of s+s. That single observation replaces a loop over all n rotations with one substring search.

**Trick.** Check the lengths match, then test whether goal is a substring of s + s.

**Edge cases that bite.**

- Unequal lengths must be rejected first, or the containment test gives a false positive for a shorter goal.
- Empty strings are rotations of each other.
- s + s contains every rotation exactly once, plus s itself twice.

**Complexity.** `O(n²) with naive find, O(n) with KMP` time, `O(n)` space — the doubled string is O(n) space; the search dominates the time. With KMP the whole thing is linear.

**Same pattern.** [Repeated Substring Pattern](https://leetcode.com/problems/repeated-substring-pattern/), [Find the Index of the First Occurrence in a String](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/), [Rotate Array](https://leetcode.com/problems/rotate-array/)

**Interview follow-ups.**

- **Q.** Make it O(n).
  <br>**A.** Use KMP for the substring search instead of the library find, which is naive O(n*m) in libstdc++.
- **Q.** Why does s + s contain every rotation?
  <br>**A.** Rotating by k gives s[k:] + s[:k], which appears in s+s starting at index k. So all n rotations are substrings of the doubled string.

</details>

#### `[SKIM]` 15. Remove Outermost Parentheses &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1021

<!-- id:strings-remove-outermost-parentheses | order:51 | day:7 | pattern:depth-counter | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-outermost-parentheses/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/remove-outermost-parentheses)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `depth-counter`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You do not need a stack at all, only its depth. A counter tracks nesting level, and the outermost brackets are exactly those at depth 0 going in and depth 1 coming out.

**Trick.** Increment on open, decrement on close. Append the character only when the depth before an open is non-zero, or after a close leaves the depth non-zero.

**Edge cases that bite.**

- Order matters: for an open, append before incrementing; for a close, decrement before appending.
- The input is guaranteed valid, so the counter never goes negative.
- Concatenating repeatedly into a string is O(n^2) - reserve capacity.

**Complexity.** `O(n)` time, `O(1) excluding output` space — one pass with a single integer. A stack would also work but stores information you never read back.

**Same pattern.** [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Maximum Nesting Depth of the Parentheses](https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/), [Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/)

**Interview follow-ups.**

- **Q.** When is a counter enough and when do you need a stack?
  <br>**A.** A counter suffices with exactly one bracket type. With several, you must remember WHICH bracket is open, and only a stack does that.

</details>

#### `[SKIM]` 16. Maximum Nesting Depth of the Parentheses &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1614

<!-- id:strings-maximum-nesting-depth-of-the-parentheses | order:52 | day:7 | pattern:depth-counter | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-nesting-depth-of-parenthesis)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `depth-counter`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Same counter as the previous problem, reporting the maximum rather than filtering. Solving these back to back is the point - it makes the shared idea impossible to miss.

**Trick.** Increment on open and take the maximum immediately; decrement on close. Non-bracket characters are ignored entirely.

**Edge cases that bite.**

- The maximum must be taken at the increment, not after the loop.
- Digits and operators are present and irrelevant.
- Valid input guaranteed, so no negative-depth check is needed.

**Complexity.** `O(n)` time, `O(1)` space — single pass, two integers.

**Same pattern.** [Remove Outermost Parentheses](https://leetcode.com/problems/remove-outermost-parentheses/), [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/)

**Interview follow-ups.**

- **Q.** Input may be invalid.
  <br>**A.** Track whether the depth ever goes negative and whether it ends at zero. Both must hold.

</details>

#### `[SKIM]` 17. Largest Odd Number in String &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1903

<!-- id:strings-largest-odd-number-in-string | order:53 | day:7 | pattern:suffix-scan | template:T-STR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/largest-odd-number-in-string/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/largest-odd-number-in-a-string)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `suffix-scan`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A number is odd exactly when its last digit is odd, and a prefix is always at least as large as any shorter prefix. So scan from the right for the first odd digit and return everything up to it.

**Trick.** Walk from the last index backwards; the first odd digit found ends the answer. Return substr(0, i+1), or empty if none exists.

**Edge cases that bite.**

- No odd digit anywhere means an empty string, not '0'.
- The whole string may be the answer when it already ends in an odd digit.
- Leading zeros are permitted in the output by the problem statement.

**Complexity.** `O(n)` time, `O(1) excluding output` space — one backwards pass. The value is arbitrarily large so it cannot be parsed into an integer - the string is the only representation available.

**Same pattern.** [Largest Number](https://leetcode.com/problems/largest-number/), [Remove K Digits](https://leetcode.com/problems/remove-k-digits/), [Maximum Swap](https://leetcode.com/problems/maximum-swap/)

**Interview follow-ups.**

- **Q.** Why must you scan from the right?
  <br>**A.** Longer prefixes are always larger numerically, so the answer is the longest valid prefix. Finding it means locating the rightmost odd digit.

</details>

#### `[SKIM]` 18. Count and Say &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 38

<!-- id:strings-count-and-say | order:58 | day:7 | pattern:run-length-iteration | template:T-STR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/count-and-say/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/count-and-say)

**Asked by:** Facebook, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `run-length-iteration`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each term is the run-length encoding of the previous one. There is no closed form and no shortcut - the value is in writing a clean run-length encoder without off-by-one errors.

**Trick.** For each term, walk the previous string counting consecutive equal characters, appending count then character. Reserve capacity, since the strings grow quickly.

**Edge cases that bite.**

- The final run must be emitted after the loop ends, or the last group is dropped.
- n = 1 returns '1' with no iteration.
- Counts can exceed 9 in principle, though not for small n - the code should still append the number as a string.

**Complexity.** `O(n · L) where L is the final length` time, `O(L)` space — n iterations, each linear in the current string. Length grows by roughly a factor of 1.3 per term (Conway's constant).

**Same pattern.** [String Compression](https://leetcode.com/problems/string-compression/), [String Compression](https://leetcode.com/problems/string-compression/), [Remove All Adjacent Duplicates In String](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/)

**Interview follow-ups.**

- **Q.** In-place run-length compression.
  <br>**A.** LC 443 - read and write pointers over the same array, since the compressed form is never longer than the original.
- **Q.** Why does the length grow by ~1.3 per step?
  <br>**A.** Conway's constant, the largest root of a degree-71 polynomial. Worth knowing as trivia, never worth deriving in an interview.

</details>

### Day 7 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **substr copies, so it is never free.** std::string::substr is O(len) and allocates. Placed inside two nested loops it turns an apparently quadratic algorithm into a cubic one, with no visible sign in the loop structure.
  <br>↳ *Longest Palindromic Substring* — tracking a start index and a length rather than building substrings during expansion
- **A fixed alphabet means an array, and genuinely O(1) space.** int cnt[26] or cnt[128] beats a hash map on constant factor and cache behaviour, and the space claim is real rather than hand-waved, because the alphabet size is a constant.
  <br>↳ *Longest Repeating Character Replacement* — a 26-slot frequency array inside the window; *Sort Characters By Frequency* — counting before ordering; *Longest Substring Without Repeating Characters* — int last[128] holding last-seen indices
- **A palindrome is defined by its centre, and there are 2n-1 of them.** n single characters and n-1 gaps. Expanding from each is O(n^2) time and O(1) space, and forgetting the gaps silently finds only odd-length palindromes.
  <br>↳ *Longest Palindromic Substring* — calling expand(i, i) and expand(i, i+1) at every index
- **Nesting means a stack, one bracket type means a counter.** A counter suffices when there is only one kind of bracket, because you never need to know WHICH bracket is open. Several types force a stack.
  <br>↳ *Valid Parentheses* — a stack, because three bracket types must be matched by kind; *Minimum Add to Make Parentheses Valid* — two counters, because there is only one type; *Maximum Nesting Depth of the Parentheses* — a single depth counter; *Remove Outermost Parentheses* — the same counter, used to decide what to emit
- **Prune during construction rather than filtering afterwards.** Enforcing validity as you build eliminates entire invalid subtrees. Generating everything and filtering does exponentially more work for the same output.
  <br>↳ *Generate Parentheses* — adding ')' only while close < open, so every leaf reached is valid
- **A mapping is not a bijection.** Checking one direction permits many-to-one mappings. Structure-preserving equivalence requires verifying both directions, and ('badc','baba') is the case that exposes it.
  <br>↳ *Isomorphic Strings* — two mapping tables checked together rather than one
- **The stale maximum in a window can be safe.** In Longest Repeating Character Replacement, maxFrequency need never be decreased on shrink. A stale value can extend the apparent validity but can never produce a window longer than one genuinely achievable.
  <br>↳ *Longest Repeating Character Replacement* — never recomputing maxFreq inside the shrink loop

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise

### Day 8

*14 problems — 8 core, 5 drill, 1 skim.*

#### `[CORE]` 1. Reverse Linked List &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 206

<!-- id:linked-list-reverse-linked-list | order:63 | day:8 | pattern:iterative-reversal | template:T-LL-01 -->

[Solve on LeetCode](https://leetcode.com/problems/reverse-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/reverse-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=D2vI2DNJGd8)

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

#### `[CORE]` 2. Linked List Cycle &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 141

<!-- id:linked-list-linked-list-cycle | order:64 | day:8 | pattern:fast-slow-pointers | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/linked-list-cycle/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/detect-a-cycle-in-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=wiOo4DC5GGA)

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

#### `[CORE]` 3. Linked List Cycle II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 142

<!-- id:linked-list-linked-list-cycle-ii | order:65 | day:8 | pattern:floyd-entry-point | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/linked-list-cycle-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/starting-point-of-loop-in-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=2Kd0KKmmHFc)

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

#### `[CORE]` 4. Palindrome Linked List &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 234

<!-- id:linked-list-palindrome-linked-list | order:67 | day:8 | pattern:reverse-half-compare | template:T-LL-01 -->

[Solve on LeetCode](https://leetcode.com/problems/palindrome-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-given-linked-list-is-plaindrome/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=lRY_G-u_8jk)

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

#### `[CORE]` 5. Add Two Numbers &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 2

<!-- id:linked-list-add-two-numbers | order:69 | day:8 | pattern:digit-carry-traversal | template:T-LL-02 -->

[Solve on LeetCode](https://leetcode.com/problems/add-two-numbers/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/add-two-numbers-represented-as-linked-lists/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=LBVsXSMOIk4)

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

#### `[CORE]` 6. Remove Nth Node From End of List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 19

<!-- id:linked-list-remove-nth-node-from-end-of-list | order:70 | day:8 | pattern:runner-offset | template:T-LL-03 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/remove-n-th-node-from-the-end-of-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3kMKYQ2wNIU)

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

#### `[CORE]` 7. Sort List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 148

<!-- id:linked-list-sort-list | order:74 | day:8 | pattern:merge-sort-on-list | template:T-SORT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/linked-list/sort-a-linked-list) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=8ocB7a_c-Cc)

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

#### `[CORE]` 8. Copy List with Random Pointer &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 138

<!-- id:linked-list-copy-list-with-random-pointer | order:76 | day:8 | pattern:interleave-and-split | template:T-LL-02 -->

[Solve on LeetCode](https://leetcode.com/problems/copy-list-with-random-pointer/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/clone-linked-list-with-random-and-next-pointer/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=q570bKdrnlw)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `interleave-and-split`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The obvious solution maps old nodes to new ones in a hash map, which is O(n) space. The O(1) solution interleaves the copies into the original list, so each node's copy is simply node->next - the list itself becomes the map.

**Trick.** Three passes. First, insert each copy immediately after its original. Second, set copy->random = original->random->next. Third, unweave the two lists, restoring the original.

**Edge cases that bite.**

- A null random pointer must not be dereferenced in pass two.
- The original list must be restored in pass three, not just the copy extracted.
- An empty list returns null before any pass runs.

**Complexity.** `O(n)` time, `O(1) excluding the output` space — three linear passes with no auxiliary structure. The hash-map version is one pass but O(n) space, and this problem exists to rule it out.

**Same pattern.** [Clone Graph](https://leetcode.com/problems/clone-graph/), [Flatten a Multilevel Doubly Linked List](https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/), [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/)

**Interview follow-ups.**

- **Q.** Why does interleaving work as a map?
  <br>**A.** Because copy(x) is always at x->next by construction, so looking up any original's copy is a single dereference - exactly what the hash map provided.
- **Q.** Clone an arbitrary graph.
  <br>**A.** LC 133 - interleaving does not generalise, so you do need a map from original to copy, built during a DFS or BFS.

</details>

#### `[DRILL]` 9. Middle of the Linked List &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 876

<!-- id:linked-list-middle-of-the-linked-list | order:66 | day:8 | pattern:fast-slow-pointers | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/middle-of-the-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-middle-element-in-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7LjQ57RqgEc)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `fast-slow-pointers`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** When fast has covered the whole list, slow has covered half of it. The only real decision is which middle you want for even lengths, and that is set by the loop condition - decide deliberately rather than by accident.

**Trick.** `while (fast && fast->next)` lands slow on the SECOND middle. `while (fast->next && fast->next->next)` lands it on the first.

**Edge cases that bite.**

- Even-length lists have two middles and different problems want different ones.
- Single node returns itself.
- Counting the length first and walking n/2 works too but needs two passes.

**Complexity.** `O(n)` time, `O(1)` space — one pass, and slow travels exactly half the distance fast does.

**Same pattern.** [Delete the Middle Node of a Linked List](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/), [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/), [Sort List](https://leetcode.com/problems/sort-list/), [Reorder List](https://leetcode.com/problems/reorder-list/)

**Interview follow-ups.**

- **Q.** Delete the middle node.
  <br>**A.** LC 2095 - you need the node BEFORE the middle, so keep a prev pointer or start fast one step ahead.
- **Q.** Which middle does a palindrome check want?
  <br>**A.** Either works, provided the reversal of the second half is consistent with the choice. Being explicit about it avoids an off-by-one.

</details>

#### `[DRILL]` 10. Intersection of Two Linked Lists &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 160

<!-- id:linked-list-intersection-of-two-linked-lists | order:68 | day:8 | pattern:two-pointer-switch | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/intersection-of-two-linked-lists/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-intersection-of-two-linked-lists/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=0DYoPz2Tpt4)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-pointer-switch`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Walk pointer A through list A then list B, and pointer B through B then A. Both travel exactly lenA + lenB before stopping, so they arrive at the intersection at the same moment - or at nullptr together if there is none.

**Trick.** `a = a ? a->next : headB; b = b ? b->next : headA;` until a == b. No length computation and no extra structure.

**Edge cases that bite.**

- No intersection means both become nullptr simultaneously and the loop ends - so the null case is handled by the same code path.
- The switch must happen on null, not on the last node, or the lists never align.
- Intersection is by node identity, not by value.

**Complexity.** `O(m + n)` time, `O(1)` space — each pointer traverses both lists once. The length-difference solution is the same bound but needs two extra passes to measure.

**Same pattern.** [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/), [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/), [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

**Interview follow-ups.**

- **Q.** Why does the switch equalise the distance?
  <br>**A.** Each pointer covers lenA + lenB in total regardless of starting side, so after that many steps they are at the same offset from the end - which is where the shared tail begins.
- **Q.** The length-difference alternative.
  <br>**A.** Measure both lengths, advance the longer list's pointer by the difference, then walk together. More intuitive, three passes instead of one.

</details>

#### `[DRILL]` 11. Delete the Middle Node of a Linked List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 2095

<!-- id:linked-list-delete-the-middle-node-of-a-linked-list | order:71 | day:8 | pattern:runner-with-prev | template:T-TP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/linked-list/delete-the-middle-node-of-the-linked-list) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ePpV-_pfOeI)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `runner-with-prev`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Finding the middle is routine; deleting it requires its predecessor, which a plain fast/slow walk does not give you. Offsetting fast by one step at the start solves it without a separate prev pointer.

**Trick.** Start fast at head->next->next so that slow stops one short of the middle, then unlink with slow->next = slow->next->next.

**Edge cases that bite.**

- A single node has no middle to keep - return nullptr.
- Two nodes delete the second one.
- Leaking the removed node matters in C++ - delete it if you own the memory.

**Complexity.** `O(n)` time, `O(1)` space — one pass at half speed. Counting the length first is two passes for the same result.

**Same pattern.** [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/), [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/), [Delete Node in a Linked List](https://leetcode.com/problems/delete-node-in-a-linked-list/)

**Interview follow-ups.**

- **Q.** Which middle does the problem want?
  <br>**A.** The n/2-th using 0-based indexing, which is the second middle for even lengths. Confirm this from the examples before coding, not after failing a test.

</details>

#### `[DRILL]` 12. Odd Even Linked List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 328

<!-- id:linked-list-odd-even-linked-list | order:73 | day:8 | pattern:two-list-weave | template:T-LL-02 -->

[Solve on LeetCode](https://leetcode.com/problems/odd-even-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/segregate-even-and-odd-nodes-in-linkedlist) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=qf6qp7GzD5Q)

**Asked by:** Amazon, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-list-weave`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Build two separate chains as you walk - one of odd positions, one of even - and splice them at the end. Trying to rearrange in place with a single pointer is far harder and buys nothing.

**Trick.** Keep odd and even heads. Advance with odd->next = even->next, then even->next = odd->next. Save evenHead at the start so you can attach it after the odd chain.

**Edge cases that bite.**

- evenHead must be captured before any rewiring, or you lose the even chain entirely.
- The loop guard is `even && even->next`.
- Fewer than three nodes needs no work.

**Complexity.** `O(n)` time, `O(1)` space — one pass, rewiring each pointer once. No nodes are allocated - only existing links change.

**Same pattern.** [Partition List](https://leetcode.com/problems/partition-list/), [Reorder List](https://leetcode.com/problems/reorder-list/), [Split Linked List in Parts](https://leetcode.com/problems/split-linked-list-in-parts/)

**Interview follow-ups.**

- **Q.** Group by value parity instead of position.
  <br>**A.** Same two-chain structure, different predicate. LC 86, Partition List, is the version keyed on a pivot value.
- **Q.** Is the relative order preserved within each group?
  <br>**A.** Yes, because each chain is built by appending in traversal order. That stability is often required and is worth pointing out.

</details>

#### `[DRILL]` 13. Rotate List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 61

<!-- id:linked-list-rotate-list | order:75 | day:8 | pattern:close-and-cut | template:T-LL-03 -->

[Solve on LeetCode](https://leetcode.com/problems/rotate-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/rotate-a-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=uT7YI7XbTY8)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `close-and-cut`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rather than rotating repeatedly, close the list into a ring, then walk to the correct position and cut it open again. One traversal to measure, one to cut.

**Trick.** Walk to the tail counting the length, connect tail->next = head to form a ring, then advance (length - k % length) steps from the head and break the link there.

**Edge cases that bite.**

- k may exceed the length - take k % length before doing anything.
- k % length == 0 means no rotation; the ring must still be broken correctly.
- Empty or single-node lists return unchanged.

**Complexity.** `O(n)` time, `O(1)` space — two passes, or one if you combine the counting with reaching the tail. Rotating one step at a time k times would be O(n*k).

**Same pattern.** [Rotate Array](https://leetcode.com/problems/rotate-array/), [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/), [Split Linked List in Parts](https://leetcode.com/problems/split-linked-list-in-parts/)

**Interview follow-ups.**

- **Q.** Rotate left instead of right.
  <br>**A.** Left by k is right by length - k. The ring makes both trivial once it exists.
- **Q.** Why form a ring at all?
  <br>**A.** It removes the need to track a separate new-tail pointer while walking, and makes the cut a single assignment.

</details>

#### `[SKIM]` 14. Delete Node in a Linked List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 237

<!-- id:linked-list-delete-node-in-a-linked-list | order:72 | day:8 | pattern:value-copy-delete | template:T-LL-02 -->

[Solve on LeetCode](https://leetcode.com/problems/delete-node-in-a-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/delete-last-node-of-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=VaECK03Dz-g)

**Asked by:** Amazon, Microsoft, Apple, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `value-copy-delete`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You are given only the node to delete, with no access to its predecessor, so you cannot unlink it. The trick is to stop thinking about deleting the node and instead overwrite it with its successor's value, then delete the successor.

**Trick.** node->val = node->next->val; node->next = node->next->next. You have effectively deleted the node's identity rather than the node itself.

**Edge cases that bite.**

- This fails on the tail, which is why the problem guarantees the node is not last.
- The successor node leaks unless explicitly freed.
- Other pointers held to the successor node become dangling.

**Complexity.** `O(1)` time, `O(1)` space — constant work regardless of list length, because no traversal happens at all.

**Same pattern.** [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/), [Remove Linked List Elements](https://leetcode.com/problems/remove-linked-list-elements/), [Delete the Middle Node of a Linked List](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/)

**Interview follow-ups.**

- **Q.** Why can this not work for the tail?
  <br>**A.** There is no successor to copy from, and you cannot reach the predecessor to null its pointer. A sentinel tail node is the usual workaround in real systems.
- **Q.** What breaks if someone else holds a pointer to the next node?
  <br>**A.** It now points at a node that has been logically removed. This is exactly why real APIs give you the predecessor or an iterator rather than the node.

</details>

### Day 8 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Save the next pointer before you destroy it.** Every list rewiring needs three pointers in a fixed order, because assigning cur->next discards the only route to the remainder of the list.
  <br>↳ *Reverse Linked List* — saving nxt before setting cur->next = prev; *Copy List with Random Pointer* — unweaving the interleaved lists without losing either chain
- **A dummy head removes the head special case.** Any operation that might remove or replace the first node becomes uniform when a sentinel precedes it. This one habit eliminates a whole class of bugs.
  <br>↳ *Remove Nth Node From End of List* — starting both pointers at the dummy so slow lands on the predecessor; *Add Two Numbers* — building the result after a dummy so the first node needs no special case
- **Two pointers at different speeds expose structure.** A gap of k finds the kth from the end. A speed ratio of two finds the middle, and detects cycles because on a loop the faster pointer must eventually lap the slower.
  <br>↳ *Linked List Cycle* — slow and fast meeting if and only if a cycle exists; *Middle of the Linked List* — slow landing at the halfway point when fast reaches the end; *Remove Nth Node From End of List* — a fixed gap of n between the pointers; *Delete the Middle Node of a Linked List* — offsetting fast so slow stops at the predecessor
- **Floyd's reset finds the cycle entry.** After the pointers meet, moving one back to the head and advancing both at equal speed brings them together exactly at the entry. The proof turns on the tail length k and the cycle length c.
  <br>↳ *Linked List Cycle II* — the second phase resetting slow to head; *happy-number* — the same structure applied to a value-to-value chain rather than nodes
- **Compose known techniques rather than inventing new ones.** Hard list problems are usually two easy ones stacked. Recognising the composition is faster than solving from first principles.
  <br>↳ *Palindrome Linked List* — find the middle, reverse the second half, compare, then restore; *Sort List* — split with fast/slow, then merge sort; *Rotate List* — close the list into a ring, walk, then cut
- **Let the structure itself be the map.** Interleaving copies into the original list means each node's copy is simply node->next, which removes the O(n) hash map entirely.
  <br>↳ *Copy List with Random Pointer* — three passes - interleave, wire the random pointers, unweave
- **Equalise two traversals instead of measuring them.** Switching each pointer to the other list on reaching the end makes both travel lenA + lenB, so they align without any length computation.
  <br>↳ *Intersection of Two Linked Lists* — the pointer switch, which also handles the no-intersection case by making both null together

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe

### Day 9

*13 problems — 8 core, 5 drill, 0 skim.*

#### `[CORE]` 1. Subsets &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 78

<!-- id:recursion-subsets | order:77 | day:9 | pattern:include-exclude | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/subsets/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/bit-manipulation/power-set-bit-manipulation) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=LqKaUv1G3_I)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `include-exclude`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Every element is either in or out, independently. That gives 2^n subsets and a two-branch recursion whose shape you will reuse for every subsequence problem for the rest of your life.

**Trick.** At index i, push a[i] and recurse, then pop and recurse without it. Alternatively iterate masks 0 to 2^n - 1 and read the bits - the bitmask form is shorter and worth knowing.

**Edge cases that bite.**

- The empty subset is a valid answer and must be emitted.
- Pass the current path by REFERENCE and undo, or every node copies it.
- n <= 20 in the constraints is the signal that exponential is intended.

**Complexity.** `O(n · 2ⁿ)` time, `O(n) excluding output` space — 2^n leaves, each costing O(n) to copy into the result. The recursion depth is n.

**Same pattern.** [Subsets II](https://leetcode.com/problems/subsets-ii/), [Combination Sum](https://leetcode.com/problems/combination-sum/), [Permutations](https://leetcode.com/problems/permutations/), [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/)

**Interview follow-ups.**

- **Q.** Write the bitmask version.
  <br>**A.** for (mask = 0; mask < (1<<n); mask++) collect elements where mask has bit i set. Same complexity, no recursion, and it makes the 2^n structure explicit.
- **Q.** With duplicates in the input.
  <br>**A.** Sort first, then skip a[i] == a[i-1] among siblings using `if (i > start) continue`. The condition is i > start, not i > 0.

</details>

#### `[CORE]` 2. Subsets II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 90

<!-- id:recursion-subsets-ii | order:78 | day:9 | pattern:include-exclude-dedup | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/subsets-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/subset-ii-print-all-the-unique-subsets/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=RIn3gOkbhQE)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `include-exclude-dedup`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Duplicates in the input produce duplicate subsets. Sorting groups equal values together so that skipping repeated SIBLINGS in the recursion tree removes duplicates without any set or post-filtering.

**Trick.** Sort. In the loop from `start`, skip when `i > start && a[i] == a[i-1]`. The condition is i > start and not i > 0, because equal values are allowed along a path - just not as alternative choices at the same level.

**Edge cases that bite.**

- `i > 0` instead of `i > start` wrongly discards subsets containing repeated values.
- Without sorting, equal values are not adjacent and the skip fails.
- The empty subset is still required.

**Complexity.** `O(n · 2ⁿ)` time, `O(n) excluding output` space — the same bound as Subsets in the worst case of all-distinct input; duplicates only reduce the output size.

**Same pattern.** [Subsets](https://leetcode.com/problems/subsets/), [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/), [Permutations II](https://leetcode.com/problems/permutations-ii/), [3Sum](https://leetcode.com/problems/3sum/)

**Interview follow-ups.**

- **Q.** Explain i > start precisely.
  <br>**A.** At a given recursion level, choosing the second of two equal values produces exactly the subtree the first already produced. Along a path, however, both copies may legitimately be taken - so the skip must apply only to siblings.
- **Q.** Count distinct subsets without generating them.
  <br>**A.** Multiply (count of each distinct value + 1) together. Pure combinatorics, no recursion.

</details>

#### `[CORE]` 3. Combination Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 39

<!-- id:recursion-combination-sum | order:79 | day:9 | pattern:unbounded-combination | template:T-BT-03 -->

[Solve on LeetCode](https://leetcode.com/problems/combination-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/combination-sum-1/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=OyZFFqQtu98)

**Asked by:** Amazon, Facebook, Google, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `unbounded-combination`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Elements may be reused, so the recursive call passes `i` rather than `i + 1`. That one character is the entire difference between this problem and Combination Sum II, and seeing it explicitly is worth more than either solution.

**Trick.** Sort the candidates so you can `break` as soon as a[i] > target. That prune is frequently the difference between accepting and timing out.

**Edge cases that bite.**

- Passing i + 1 instead of i silently forbids reuse and produces the wrong answer.
- Starting the loop at `start` rather than 0 is what prevents permuted duplicates.
- All candidates are positive, which is what guarantees termination.

**Complexity.** `O(n^(target/min))` time, `O(target/min) depth` space — the branching factor is the candidate count and the depth is bounded by target divided by the smallest candidate. Sorting enables the break, which prunes heavily in practice.

**Same pattern.** [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/), [Combination Sum III](https://leetcode.com/problems/combination-sum-iii/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/), [Coin Change](https://leetcode.com/problems/coin-change/)

**Interview follow-ups.**

- **Q.** What if candidates could be negative?
  <br>**A.** Termination is lost - you could add and subtract forever. The positivity constraint is doing real work here.
- **Q.** Count the combinations rather than listing them.
  <br>**A.** That is unbounded knapsack DP in O(n · target), vastly faster. LC 518 is the coin version. Reading 'count' versus 'return all' changes the entire approach.

</details>

#### `[CORE]` 4. Combination Sum II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 40

<!-- id:recursion-combination-sum-ii | order:80 | day:9 | pattern:bounded-combination-dedup | template:T-BT-03 -->

[Solve on LeetCode](https://leetcode.com/problems/combination-sum-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/combination-sum-ii-find-all-unique-combinations/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=G1fRTGRxXU8)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bounded-combination-dedup`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each element may be used at most once, and the input contains duplicates. So you need both changes at once: `i + 1` in the recursive call to forbid reuse, and the sibling skip to suppress duplicate combinations.

**Trick.** Sort. Loop from start, skip when `i > start && a[i] == a[i-1]`, recurse with `i + 1`, and break when a[i] > target.

**Edge cases that bite.**

- Both the i + 1 and the sibling skip are required - omitting either gives wrong output.
- Duplicates in the input are the entire difficulty; without them this is trivial.
- The same value may appear twice in a combination if it appears twice in the input.

**Complexity.** `O(2ⁿ)` time, `O(n) depth` space — each element is taken or skipped once, giving at most 2^n paths, heavily pruned by the sorted break.

**Same pattern.** [Combination Sum](https://leetcode.com/problems/combination-sum/), [Subsets II](https://leetcode.com/problems/subsets-ii/), [3Sum](https://leetcode.com/problems/3sum/), [4Sum](https://leetcode.com/problems/4sum/)

**Interview follow-ups.**

- **Q.** Why does the same skip rule work here as in Subsets II?
  <br>**A.** The structure is identical - both enumerate choices at each level, and equal siblings generate identical subtrees.
- **Q.** Combination Sum III, with a fixed count.
  <br>**A.** Add a depth parameter and require exactly k elements drawn from 1..9. Same skeleton, two termination conditions instead of one.

</details>

#### `[CORE]` 5. Permutations &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 46

<!-- id:recursion-permutations | order:82 | day:9 | pattern:swap-permutation | template:T-BT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/permutations/)

**Asked by:** Amazon, Google, Facebook, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `swap-permutation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** At each position, try every element not yet used. The swap-based formulation achieves this without a separate used[] array by exchanging the candidate into the current position and restoring it afterwards.

**Trick.** For index i, loop j from i to n-1, swap(a[i], a[j]), recurse on i+1, then swap back. The restoring swap is the backtrack and omitting it corrupts everything downstream.

**Edge cases that bite.**

- The loop must start at i, not i + 1, or the element already in place is never used.
- n! grows brutally - 10! is 3.6 million, 12! is half a billion.
- With duplicates, the swap formulation cannot dedupe cleanly - use used[] and sorting.

**Complexity.** `O(n · n!)` time, `O(n) depth` space — n! leaves, each costing O(n) to copy. The swap version avoids the O(n) used-array bookkeeping per node.

**Same pattern.** [Permutations II](https://leetcode.com/problems/permutations-ii/), [Next Permutation](https://leetcode.com/problems/next-permutation/), [Subsets](https://leetcode.com/problems/subsets/), [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/)

**Interview follow-ups.**

- **Q.** With duplicates.
  <br>**A.** Sort and use a used[] array with the rule `if (used[i] || (i > 0 && a[i] == a[i-1] && !used[i-1])) continue;`. Swapping breaks the sorted order and makes the skip unsound.
- **Q.** Generate the kth permutation directly.
  <br>**A.** Factorial number system - divide k by (n-1)! to pick each successive element. O(n^2) with no enumeration at all.

</details>

#### `[CORE]` 6. Word Search &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 79

<!-- id:recursion-word-search | order:84 | day:9 | pattern:grid-backtracking | template:T-BT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/word-search/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/word-search-leetcode/)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `grid-backtracking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** DFS from every cell, marking visited cells in place and restoring them on the way out. Marking in the grid itself rather than in a separate visited array keeps the space O(1) beyond recursion.

**Trick.** Overwrite the cell with a sentinel such as '#' before recursing, and restore the original character afterwards. Check the character match before recursing, not after.

**Edge cases that bite.**

- The restore on failure is mandatory - without it, later starting cells see a corrupted grid.
- Bounds and character mismatch must both be checked before any recursion.
- The same cell may not be reused within one path but may be reused across different starting points.

**Complexity.** `O(m·n·4^L)` time, `O(L) depth` space — every cell is a potential start, and from each the search branches up to four ways for the word length L. In practice the character check prunes almost immediately.

**Same pattern.** [Word Search II](https://leetcode.com/problems/word-search-ii/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [N-Queens](https://leetcode.com/problems/n-queens/), [Unique Paths III](https://leetcode.com/problems/unique-paths-iii/)

**Interview follow-ups.**

- **Q.** Search for many words at once.
  <br>**A.** LC 212 - build a trie of the words and DFS the grid once against it, pruning whenever the current prefix leaves the trie. Vastly better than running this once per word.
- **Q.** Why mark in place rather than use a visited array?
  <br>**A.** It is O(1) extra space and one assignment. The only cost is mutating the input, which must be restored - and in a threaded context would be unsafe.

</details>

#### `[CORE]` 7. N-Queens &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 51

<!-- id:recursion-n-queens | order:85 | day:9 | pattern:constraint-backtracking | template:T-BT-05 -->

[Solve on LeetCode](https://leetcode.com/problems/n-queens/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/n-queen-problem-return-all-distinct-solutions-to-the-n-queens-puzzle/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=i05Ju7AftcM)

**Asked by:** Amazon, Google, Facebook, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `constraint-backtracking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Place one queen per row, so the only choice per level is the column. The real skill is making the validity test O(1) with three marker arrays instead of rescanning the board.

**Trick.** Keep boolean arrays for columns, for the i+j diagonal, and for the i-j+n anti-diagonal. Every cell on a diagonal shares those sums, so conflict detection is three array reads.

**Edge cases that bite.**

- The anti-diagonal index i-j can be negative - offset by n.
- Restoring all three markers on backtrack is required.
- n = 2 and n = 3 have no solutions; n = 1 has one.

**Complexity.** `O(n!)` time, `O(n²) for the board` space — the first row has n choices, the next at most n-1 and so on, but constraint pruning cuts the real tree far below n!. The O(1) validity check is what makes it fast in practice.

**Same pattern.** [N-Queens II](https://leetcode.com/problems/n-queens-ii/), [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/), [Word Search](https://leetcode.com/problems/word-search/), [Permutations](https://leetcode.com/problems/permutations/)

**Interview follow-ups.**

- **Q.** Count solutions without building boards.
  <br>**A.** LC 52 - drop the board entirely and return a count. Bitmask versions represent all three constraint sets in three integers and are dramatically faster.
- **Q.** Why is placing one queen per row sufficient?
  <br>**A.** Two queens in the same row always conflict, so any solution has exactly one per row. Encoding that structurally removes an entire constraint for free.

</details>

#### `[CORE]` 8. Sudoku Solver &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 37

<!-- id:recursion-sudoku-solver | order:86 | day:9 | pattern:constraint-backtracking | template:T-BT-05 -->

[Solve on LeetCode](https://leetcode.com/problems/sudoku-solver/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sudoku-solver/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=FWAIf_EVUKE)

**Asked by:** Amazon, Google, Facebook, Uber &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `constraint-backtracking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Find an empty cell, try each digit that does not conflict, recurse, and undo on failure. The naive version rescans row, column and box for every candidate; the fast version maintains three constraint tables and checks in O(1).

**Trick.** Maintain rowUsed[9][10], colUsed[9][10] and boxUsed[9][10], with the box index computed as (i/3)*3 + j/3. Return true immediately on success so the search stops.

**Edge cases that bite.**

- Box index arithmetic (i/3)*3 + j/3 is the usual slip.
- Returning true must propagate all the way up or the solved board is overwritten by further search.
- All three tables must be cleared on backtrack.

**Complexity.** `O(9^m) where m is the number of blanks` time, `O(1) for a fixed 9x9 board` space — each blank has at most nine candidates. Constraint propagation prunes so aggressively that real puzzles solve almost instantly despite the bound.

**Same pattern.** [Valid Sudoku](https://leetcode.com/problems/valid-sudoku/), [N-Queens](https://leetcode.com/problems/n-queens/), [Word Search](https://leetcode.com/problems/word-search/)

**Interview follow-ups.**

- **Q.** Choose the most-constrained cell first.
  <br>**A.** Instead of the first empty cell, pick the one with fewest legal candidates. This minimum-remaining-values heuristic cuts the tree dramatically.
- **Q.** Use bitmasks for the constraint sets.
  <br>**A.** One 9-bit integer per row, column and box. Candidate generation becomes a single AND, and iterating candidates uses x & -x.

</details>

#### `[DRILL]` 9. Combination Sum III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 216

<!-- id:recursion-combination-sum-iii | order:81 | day:9 | pattern:fixed-size-combination | template:T-BT-03 -->

[Solve on LeetCode](https://leetcode.com/problems/combination-sum-iii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/combination-sum-iii)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `fixed-size-combination`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two constraints must be satisfied simultaneously - exactly k numbers and exactly sum n - so the base case is a conjunction. The bounded candidate set 1..9 makes the search tiny regardless.

**Trick.** Recurse with both remaining count and remaining sum. Succeed only when both hit zero; prune whenever either goes negative or the remaining candidates cannot reach the target.

**Edge cases that bite.**

- Checking only the sum, or only the count, accepts wrong answers.
- Numbers are 1 to 9 and each is used at most once, so at most 9 levels.
- k > 9 or n > 45 is impossible and can be rejected immediately.

**Complexity.** `O(C(9,k) · k)` time, `O(k) depth` space — the candidate set is fixed at nine values, so the search space is bounded by a constant regardless of n.

**Same pattern.** [Combination Sum](https://leetcode.com/problems/combination-sum/), [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/), [Subsets](https://leetcode.com/problems/subsets/), [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/)

**Interview follow-ups.**

- **Q.** Add a stronger prune.
  <br>**A.** The k smallest remaining candidates give a minimum achievable sum, and the k largest a maximum. If n falls outside that window, return immediately.
- **Q.** Why is this so much cheaper than Combination Sum?
  <br>**A.** The candidate set is bounded by a constant and reuse is forbidden, so the tree has at most 2^9 nodes.

</details>

#### `[DRILL]` 10. Letter Combinations of a Phone Number &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 17

<!-- id:recursion-letter-combinations-of-a-phone-number | order:83 | day:9 | pattern:cartesian-product | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/letter-combinations-of-a-phone-number)

**Asked by:** Amazon, Facebook, Google, Uber, Dropbox &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `cartesian-product`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is a Cartesian product across the digit positions, so the recursion has one level per digit and a branching factor equal to that digit's letter count. There is no pruning because every combination is valid.

**Trick.** Index into a fixed mapping array and recurse one digit at a time, appending and then popping a character. Iterative BFS-style building works equally well.

**Edge cases that bite.**

- Empty input returns an empty list, not a list containing an empty string.
- Digits 7 and 9 have four letters, which affects the count but not the structure.
- Digits 0 and 1 do not appear by constraint.

**Complexity.** `O(4ⁿ · n)` time, `O(n) depth` space — at most 4 letters per digit over n digits, with O(n) to copy each completed string.

**Same pattern.** [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/), [Subsets](https://leetcode.com/problems/subsets/), [Permutations](https://leetcode.com/problems/permutations/), [Combination Sum](https://leetcode.com/problems/combination-sum/)

**Interview follow-ups.**

- **Q.** Build it iteratively.
  <br>**A.** Start with a list containing the empty string and, for each digit, replace the list with every existing prefix extended by every letter. Clearer to some, same complexity.
- **Q.** Why is there no pruning here?
  <br>**A.** Every combination is valid by definition, so there is nothing to reject. Contrast with Generate Parentheses, where pruning eliminates exponentially many invalid branches.

</details>

#### `[DRILL]` 11. Pow(x, n) &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 50

<!-- id:recursion-powx-n | order:87 | day:9 | pattern:binary-exponentiation | template:T-MATH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/powx-n/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/implement-powxn-x-raised-to-the-power-n/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=l0YC3876qxg)

**Asked by:** Amazon, Facebook, Google, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `binary-exponentiation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Repeated multiplication is O(n) and times out for n up to 2^31. Squaring the base and halving the exponent is O(log n), and the same identity underlies modular exponentiation everywhere in competitive programming.

**Trick.** While n > 0: if n is odd multiply the result by the base, then square the base and halve n. Handle negative n by inverting the base and negating n - in long long, because -INT_MIN overflows.

**Edge cases that bite.**

- n = INT_MIN cannot be negated in int - promote to long long before negating.
- x = 0 with negative n is undefined; the constraints exclude it.
- Floating-point error accumulates, so the expected answer has a tolerance.

**Complexity.** `O(log n)` time, `O(1) iterative, O(log n) recursive` space — the exponent halves each iteration, so about 31 iterations for a 32-bit exponent.

**Same pattern.** [Sqrt(x)](https://leetcode.com/problems/sqrtx/), [Count Good Numbers](https://leetcode.com/problems/count-good-numbers/), [Super Pow](https://leetcode.com/problems/super-pow/), [Reverse Integer](https://leetcode.com/problems/reverse-integer/)

**Interview follow-ups.**

- **Q.** Why does -INT_MIN overflow?
  <br>**A.** Two's complement has one more negative value than positive, so INT_MIN has no positive counterpart. Promote to long long before negating.
- **Q.** Modular exponentiation.
  <br>**A.** Same loop with `% mod` after each multiply. This is how modular inverses are computed via Fermat's little theorem, and it is far more commonly needed than the float version.

</details>

#### `[DRILL]` 12. Target Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 494

<!-- id:recursion-target-sum | order:88 | day:9 | pattern:subset-partition-dp | template:T-DP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/target-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/target-sum-dp-21/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=b3GD8263-PQ)

**Asked by:** Facebook, Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `subset-partition-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Assigning + or - to each number looks like pure enumeration at 2^n, but it is really a subset-sum problem: if P is the set given +, then sum(P) = (total + target) / 2. That reframing turns exponential search into a knapsack DP.

**Trick.** Check that (total + target) is non-negative and even, then count subsets summing to half of it with a 1D DP iterated downward over the capacity.

**Edge cases that bite.**

- (total + target) odd, or |target| > total, means zero ways - return before the DP.
- Zeros in the array double the count for each, which the DP handles naturally but enumeration must not miss.
- The capacity loop must run DOWNWARD for 0/1 usage.

**Complexity.** `O(n · sum)` time, `O(sum)` space — the DP table has n items by sum capacities, rolled to one row. The brute force is O(2^n), which is 2^20 at the constraint limit - passable but far slower.

**Same pattern.** [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Last Stone Weight II](https://leetcode.com/problems/last-stone-weight-ii/), [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/)

**Interview follow-ups.**

- **Q.** Derive the transformation.
  <br>**A.** Let P be the plus set and N the minus set. sum(P) - sum(N) = target and sum(P) + sum(N) = total, so sum(P) = (total + target) / 2.
- **Q.** Why must the loop run downward?
  <br>**A.** Upward would allow each number to be used more than once, which is the unbounded knapsack. Direction is the only difference between the two.

</details>

#### `[DRILL]` 13. Count Good Numbers &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1922

<!-- id:recursion-count-good-numbers | order:157 | day:9 | pattern:binary-exponentiation | template:T-MATH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/count-good-numbers/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/count-good-numbers)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `binary-exponentiation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** n reaches 1e15, so nothing can be enumerated. Even positions have 5 choices and odd positions have 4, so the answer is 5^ceil(n/2) * 4^floor(n/2) - a pure counting problem solved with modular exponentiation.

**Trick.** Count the even and odd positions separately, then combine with binary exponentiation modulo 1e9+7. Everything must be long long, including the intermediate multiply.

**Edge cases that bite.**

- a * a in the exponentiation overflows unless both are long long and reduced each step.
- n = 1 gives 5 - a single even position.
- The modulus is 1e9+7, whose square fits in 64 bits, which is why it was chosen.

**Complexity.** `O(log n)` time, `O(1)` space — two modular exponentiations, each halving the exponent. Any enumeration is impossible at n = 1e15.

**Same pattern.** [Pow(x, n)](https://leetcode.com/problems/powx-n/), [Count Primes](https://leetcode.com/problems/count-primes/), [Factorial Trailing Zeroes](https://leetcode.com/problems/factorial-trailing-zeroes/)

**Interview follow-ups.**

- **Q.** Derive the counts.
  <br>**A.** Even indices take digits 0,2,4,6,8 - five options. Odd indices take primes 2,3,5,7 - four. Positions are independent, so the counts multiply.
- **Q.** Why does 'answer modulo 1e9+7' signal a counting problem?
  <br>**A.** The modulus exists because the true answer is astronomically large. That only happens when you are counting configurations rather than constructing one.

</details>

### Day 9 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Include or exclude gives 2^n, choose-one-of-many gives n!.** The shape of the choice at each level determines the complexity class. Recognising which you are in tells you the bound before you write a line.
  <br>↳ *Subsets* — two branches per index, giving 2^n leaves; *Permutations* — n choices at the first level, n-1 at the next, giving n!; *Letter Combinations of a Phone Number* — a Cartesian product with branching set by each digit
- **Sort, then skip equal siblings to dedupe.** Equal values at the same recursion level generate identical subtrees. Skipping them with `i > start && a[i] == a[i-1]` removes duplicates without a set. The condition is i > start, not i > 0, because equal values may legitimately appear along a single path.
  <br>↳ *Subsets II* — the sibling skip after sorting; *Combination Sum II* — the same skip, combined with i + 1 to forbid reuse
- **`i` versus `i + 1` is the whole reuse question.** Passing the current index permits an element to be used again; passing the next forbids it. One character separates two otherwise identical problems.
  <br>↳ *Combination Sum* — recursing with i, since candidates may be reused; *Combination Sum II* — recursing with i + 1, since each element is used at most once
- **Prune before recursing, not at the leaf.** Validity checks placed before the recursive call eliminate entire subtrees. Sorting often enables an even stronger `break`, which is frequently the difference between accepting and timing out.
  <br>↳ *Combination Sum* — breaking as soon as a[i] > target, which requires the sorted input; *N-Queens* — three marker arrays making the conflict test O(1) instead of an O(n) board scan; *Sudoku Solver* — row, column and box tables checked before placing a digit
- **Mark in place and restore on the way out.** Grid searches need no visited array - overwrite the cell with a sentinel and put it back when the branch fails. The restore is the backtrack, and omitting it corrupts every later attempt.
  <br>↳ *Word Search* — writing '#' into the grid before recursing and restoring afterwards
- **'Count' and 'return all' are different problems.** Enumeration is exponential; counting is often polynomial or logarithmic. Reading which is asked changes the entire approach before any code is written.
  <br>↳ *Count Good Numbers* — modular exponentiation in O(log n), where enumeration is impossible at n = 1e15; *Target Sum* — reframing +/- assignment as subset-sum DP rather than enumerating 2^n sign choices
- **Halve the exponent instead of decrementing it.** Squaring the base while halving the exponent turns O(n) multiplication into O(log n). The same identity underlies modular inverses via Fermat's little theorem.
  <br>↳ *Pow(x, n)* — the squaring loop, with the negative exponent handled in long long because -INT_MIN overflows; *Count Good Numbers* — two modular exponentiations combined

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones; Let the structure itself be the map; Equalise two traversals instead of measuring them

### Day 10

*16 problems — 5 core, 3 drill, 8 skim.*

#### `[CORE]` 1. Number of 1 Bits &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 191

<!-- id:bit-manipulation-number-of-1-bits | order:89 | day:10 | pattern:brian-kernighan | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/number-of-1-bits/)

**Asked by:** Amazon, Microsoft, Apple &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `brian-kernighan`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Checking all 32 positions works and is O(32). Brian Kernighan's trick - `x &= x - 1` clears the lowest set bit - makes it O(popcount), which matters when most bits are zero.

**Trick.** Loop `while (x) { x &= x - 1; count++; }`. Subtracting one flips the lowest set bit to zero and everything below it to one; the AND then clears exactly that bit.

**Edge cases that bite.**

- Use unsigned, or a negative input right-shifts arithmetically and loops forever in the shift-based version.
- x = 0 returns 0 without entering the loop.
- __builtin_popcount compiles to a single instruction on supporting hardware.

**Complexity.** `O(number of set bits)` time, `O(1)` space — each iteration removes exactly one set bit, so the loop runs popcount times rather than 32.

**Same pattern.** [Counting Bits](https://leetcode.com/problems/counting-bits/), [Power of Two](https://leetcode.com/problems/power-of-two/), [Reverse Bits](https://leetcode.com/problems/reverse-bits/), [Minimum Bit Flips to Convert Number](https://leetcode.com/problems/minimum-bit-flips-to-convert-number/)

**Interview follow-ups.**

- **Q.** Prove why x & (x-1) clears the lowest set bit.
  <br>**A.** x-1 turns the lowest 1 into 0 and all trailing 0s into 1s, leaving higher bits unchanged. ANDing therefore clears that bit and preserves everything above it.
- **Q.** Count set bits for every number from 0 to n.
  <br>**A.** LC 338 - dp[i] = dp[i >> 1] + (i & 1), or dp[i] = dp[i & (i-1)] + 1. O(n) total rather than O(n log n).

</details>

#### `[CORE]` 2. Counting Bits &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 338

<!-- id:bit-manipulation-counting-bits | order:90 | day:10 | pattern:dp-on-bits | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/counting-bits/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dp-on-bits`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting each number independently is O(n log n). The DP observation is that i's bit count is i-without-its-lowest-bit plus one, or equivalently i-shifted-right plus its last bit - either gives O(n) total.

**Trick.** dp[i] = dp[i >> 1] + (i & 1). Right-shifting drops the last bit, whose value you add back directly. dp[i] = dp[i & (i-1)] + 1 is the equivalent Kernighan form.

**Edge cases that bite.**

- dp[0] = 0 seeds the recurrence.
- The result array has n+1 entries, not n.
- Both recurrences read a strictly smaller index, so a single forward pass is valid.

**Complexity.** `O(n)` time, `O(n) for the output` space — one constant-time transition per number. Calling popcount n times is O(n log n) or O(n) with hardware support, but the DP is the intended answer.

**Same pattern.** [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/), [Power of Two](https://leetcode.com/problems/power-of-two/), [Single Number](https://leetcode.com/problems/single-number/)

**Interview follow-ups.**

- **Q.** Derive both recurrences.
  <br>**A.** i >> 1 removes the last bit, so add it back with i & 1. i & (i-1) removes the LOWEST SET bit, so add exactly one. Different decompositions, same result.
- **Q.** Do it without any DP array.
  <br>**A.** Not possible in O(n) - the output itself is the array. The DP is free given that the output must be materialised anyway.

</details>

#### `[CORE]` 3. Divide Two Integers &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 29

<!-- id:bit-manipulation-divide-two-integers | order:95 | day:10 | pattern:doubling-subtraction | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/divide-two-integers/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/divide-two-integers-without-using-multiplication-division-and-mod-operator) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=pBD4B1tzgVc)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `doubling-subtraction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Repeated subtraction is O(quotient) and times out. Doubling the divisor while it still fits - the same idea as binary exponentiation - makes it O(log n). The overflow cases are the real difficulty.

**Trick.** Work in long long and in the negative domain, since INT_MIN has no positive counterpart. Shift the divisor left while it fits, subtract, and accumulate the corresponding power of two.

**Edge cases that bite.**

- INT_MIN / -1 overflows and must be special-cased to INT_MAX.
- abs(INT_MIN) is undefined behaviour - never call it.
- Truncation is toward zero, so the sign must be applied after the magnitude is computed.
- Divisor of 1 or -1 should be handled directly.

**Complexity.** `O(log² n) naive, O(log n) careful` time, `O(1)` space — each outer step at least halves the remaining dividend. Recomputing the shift from scratch each time gives the squared bound; carrying it forward avoids that.

**Same pattern.** [Pow(x, n)](https://leetcode.com/problems/powx-n/), [Reverse Integer](https://leetcode.com/problems/reverse-integer/), [Sqrt(x)](https://leetcode.com/problems/sqrtx/)

**Interview follow-ups.**

- **Q.** Why work in the negative domain?
  <br>**A.** INT_MIN can be represented but its negation cannot. Negating both operands to negative means every intermediate value is representable.
- **Q.** Which single input overflows the result?
  <br>**A.** INT_MIN / -1 = 2147483648, one past INT_MAX. It is the only such case and must return INT_MAX by specification.

</details>

#### `[CORE]` 4. Count Primes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 204

<!-- id:bit-manipulation-count-primes | order:96 | day:10 | pattern:sieve-of-eratosthenes | template:T-MATH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/count-primes/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sieve-of-eratosthenes) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=g5Fuxn_AvSk)

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

<!-- id:bit-manipulation-maximum-xor-of-two-numbers-in-an-array | order:97 | day:10 | pattern:binary-trie | template:T-TRIE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-xor-of-two-numbers-in-an-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=EIhAwfHubE8)

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

#### `[DRILL]` 6. Reverse Bits &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 190

<!-- id:bit-manipulation-reverse-bits | order:91 | day:10 | pattern:bit-shift-accumulate | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/reverse-bits/)

**Asked by:** Amazon, Apple, Airbnb &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bit-shift-accumulate`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Shift out of the source and into the result 32 times. It is the same structure as reversing decimal digits, with base 2 instead of base 10 - which is the general lesson about digit extraction.

**Trick.** res = (res << 1) | (n & 1), then n >>= 1, repeated exactly 32 times. Not while n is non-zero - leading zeros of the input are trailing bits of the output and must be shifted in.

**Edge cases that bite.**

- Looping while n != 0 drops trailing zeros in the result - always loop exactly 32 times.
- Use uint32_t; right-shifting a negative signed int is implementation-defined.
- The follow-up about repeated calls is the real question.

**Complexity.** `O(32)` time, `O(1)` space — a fixed 32 iterations regardless of input, so effectively constant.

**Same pattern.** [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/), [Reverse Integer](https://leetcode.com/problems/reverse-integer/), [Counting Bits](https://leetcode.com/problems/counting-bits/)

**Interview follow-ups.**

- **Q.** The function is called many times. Optimise it.
  <br>**A.** Cache reversals of each byte in a 256-entry table, then reverse a 32-bit word with four lookups and three shifts. Classic space-for-time trade.
- **Q.** Do it in O(log 32) with no loop.
  <br>**A.** Divide-and-conquer bit swaps: swap adjacent bits, then pairs, then nibbles, then bytes, then halves. Five masked operations total.

</details>

#### `[DRILL]` 7. Power of Two &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 231

<!-- id:bit-manipulation-power-of-two | order:92 | day:10 | pattern:single-bit-check | template:T-BIT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/power-of-two/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-a-number-is-power-of-2-or-not) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nttpF8kwgd4)

**Asked by:** Amazon, Google, Apple &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `single-bit-check`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A power of two has exactly one set bit, so `x & (x - 1)` must be zero. The positivity guard is not optional - it is what excludes zero and negative numbers, which also satisfy the bit test.

**Trick.** `return x > 0 && (x & (x - 1)) == 0;`. Both halves are load-bearing.

**Edge cases that bite.**

- x = 0 passes the bit test but is not a power of two - hence x > 0.
- Negative powers of two in two's complement also pass the bit test.
- x = 1 is 2^0 and must return true.

**Complexity.** `O(1)` time, `O(1)` space — two operations, no loop. The repeated-division approach is O(log n) and unnecessary.

**Same pattern.** [Power of Three](https://leetcode.com/problems/power-of-three/), [Power of Four](https://leetcode.com/problems/power-of-four/), [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/), [Counting Bits](https://leetcode.com/problems/counting-bits/)

**Interview follow-ups.**

- **Q.** Power of four.
  <br>**A.** Also a single set bit, but at an even position - add a mask test against 0x55555555. Alternatively (x - 1) % 3 == 0 for powers of two.
- **Q.** Power of three without loops or recursion.
  <br>**A.** 3^19 = 1162261467 is the largest power of three in an int, so test divisibility into it. The trick only works because 3 is prime.

</details>

#### `[DRILL]` 8. Assign Cookies &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 455

<!-- id:greedy-assign-cookies | order:142 | day:10 | pattern:two-pointer-greedy | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/assign-cookies/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/assign-cookies) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=DIX2p7vb9co)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-pointer-greedy`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Satisfy the least greedy child with the smallest adequate cookie. Spending a large cookie on a small appetite wastes capacity that a greedier child could have used - that exchange argument is why the greedy is exact.

**Trick.** Sort both arrays, then walk two pointers. Advance the cookie pointer always; advance the child pointer only on a successful assignment.

**Edge cases that bite.**

- More children than cookies, or vice versa - the loop guard handles both.
- A cookie too small for the current child is too small for every later one, so it is discarded permanently.
- Empty input on either side gives 0.

**Complexity.** `O(n log n + m log m)` time, `O(1)` space — the two sorts dominate; the sweep is linear. Without sorting there is no basis for the greedy choice.

**Same pattern.** [Maximum Units on a Truck](https://leetcode.com/problems/maximum-units-on-a-truck/), [Boats to Save People](https://leetcode.com/problems/boats-to-save-people/), [Minimum Number of Moves to Seat Everyone](https://leetcode.com/problems/minimum-number-of-moves-to-seat-everyone/)

**Interview follow-ups.**

- **Q.** Prove the exchange argument.
  <br>**A.** If an optimal solution gives child c a cookie larger than needed while a smaller adequate one is unused, swapping them keeps the solution valid and frees the larger cookie. Repeating this reaches the greedy solution without loss.
- **Q.** Maximise total satisfaction rather than the count.
  <br>**A.** Greedy fails; it becomes an assignment problem solvable by min-cost matching.

</details>

#### `[SKIM]` 9. Power of Three &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 326

<!-- id:bit-manipulation-power-of-three | order:93 | day:10 | pattern:divisibility-trick | template:T-MATH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/power-of-three/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `divisibility-trick`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Bit tricks do not apply to non-binary bases, so the shortcut here is number-theoretic: since 3 is prime, every power of three divides the largest power of three that fits in an int, and nothing else does.

**Trick.** 3^19 = 1162261467 is the largest power of three below INT_MAX, so return `n > 0 && 1162261467 % n == 0`.

**Edge cases that bite.**

- n must be positive, or the modulo is meaningless.
- This relies on 3 being prime; it would not work for base 4 or 6.
- The loop-based version dividing by 3 repeatedly is perfectly acceptable and clearer.

**Complexity.** `O(1)` time, `O(1)` space — a single modulo. The iterative division version is O(log n), which is also fine.

**Same pattern.** [Power of Two](https://leetcode.com/problems/power-of-two/), [Power of Four](https://leetcode.com/problems/power-of-four/), [Ugly Number](https://leetcode.com/problems/ugly-number/)

**Interview follow-ups.**

- **Q.** Why does the divisibility trick require a prime base?
  <br>**A.** The divisors of p^k for prime p are exactly p^0..p^k. For a composite base the divisors include products of its factors, so non-powers would pass.
- **Q.** Why not log(n)/log(3) and check for an integer?
  <br>**A.** Floating-point rounding makes it unreliable at the boundaries - it misclassifies some genuine powers.

</details>

#### `[SKIM]` 10. Minimum Bit Flips to Convert Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 2220

<!-- id:bit-manipulation-minimum-bit-flips-to-convert-number | order:94 | day:10 | pattern:xor-then-popcount | template:T-BIT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-bit-flips-to-convert-number/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/count-number-of-bits-to-be-flipped-to-convert-a-to-b) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=OOdrmcfZXd8)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `xor-then-popcount`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** XOR sets a bit exactly where the two numbers differ, so the number of flips needed is simply the population count of the XOR. Two operations, no loop over positions.

**Trick.** `return __builtin_popcount(start ^ goal);` - or Brian Kernighan's loop if built-ins are disallowed.

**Edge cases that bite.**

- Identical inputs give XOR zero and therefore zero flips.
- Works for any bit width; use popcountll for 64-bit.
- Negative values work on the bit pattern, though the constraints here are positive.

**Complexity.** `O(1)` time, `O(1)` space — one XOR and one population count, both constant-time on fixed-width integers.

**Same pattern.** [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/), [Hamming Distance](https://leetcode.com/problems/hamming-distance/), [Counting Bits](https://leetcode.com/problems/counting-bits/), [Single Number](https://leetcode.com/problems/single-number/)

**Interview follow-ups.**

- **Q.** This is Hamming distance.
  <br>**A.** LC 461 is literally the same problem under a different name. Recognising renamed problems quickly is worth practising.
- **Q.** Total Hamming distance across all pairs in an array.
  <br>**A.** LC 477 - for each bit position count how many numbers have it set, say k of n; that position contributes k * (n - k). O(32n) rather than O(n^2).

</details>

#### `[SKIM]` 11. Lemonade Change &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 860

<!-- id:greedy-lemonade-change | order:143 | day:10 | pattern:greedy-denomination | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/lemonade-change/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/Greedy/lemonade-change) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=n_tmibEhO6Q)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `greedy-denomination`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** When giving change for a twenty, prefer a ten plus a five over three fives. Fives are more flexible - they can pay change for tens as well - so spending the inflexible note first preserves options.

**Trick.** Count fives and tens only; twenties are never given as change. For a twenty, try 10+5 first and fall back to 5+5+5.

**Edge cases that bite.**

- The order of the two options for a twenty is the whole problem.
- The first customer paying anything other than five fails immediately.
- Twenties never re-enter circulation.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two counters.

**Same pattern.** [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Gas Station](https://leetcode.com/problems/gas-station/), [Maximum Units on a Truck](https://leetcode.com/problems/maximum-units-on-a-truck/)

**Interview follow-ups.**

- **Q.** Why prefer 10+5?
  <br>**A.** A five can serve as change for both a ten and a twenty, while a ten only helps with a twenty. Spending the less versatile note first is the greedy invariant.
- **Q.** Arbitrary denominations.
  <br>**A.** Greedy fails in general - it becomes the coin change problem, which needs DP.

</details>

#### `[SKIM]` 12. Array Partition &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 561

<!-- id:greedy-array-partition | order:144 | day:10 | pattern:sort-and-pair | template:T-SORT-06 -->

[Solve on LeetCode](https://leetcode.com/problems/array-partition/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `sort-and-pair`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** To maximise the sum of pair minimums, pair each element with its nearest neighbour in sorted order. Pairing distant elements wastes the larger one, since only the smaller of each pair counts.

**Trick.** Sort, then sum every element at an even index. No explicit pairing is needed.

**Edge cases that bite.**

- The array length is guaranteed even.
- Negative numbers work unchanged.
- Values are bounded at 1e4, so counting sort gives O(n) if you want it.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates; the sum is linear. With bounded values, counting sort makes it O(n + k).

**Same pattern.** [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Minimum Absolute Difference](https://leetcode.com/problems/minimum-absolute-difference/), [Maximum Length of Pair Chain](https://leetcode.com/problems/maximum-length-of-pair-chain/)

**Interview follow-ups.**

- **Q.** Prove pairing adjacent elements is optimal.
  <br>**A.** If a < b < c < d are paired as (a,c) and (b,d), the sum is a + b. Repairing as (a,b) and (c,d) gives a + c, which is larger. So any non-adjacent pairing can be improved.
- **Q.** Make it O(n).
  <br>**A.** Counting sort, since values lie in [-1e4, 1e4].

</details>

#### `[SKIM]` 13. Maximum Units on a Truck &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1710

<!-- id:greedy-maximum-units-on-a-truck | order:145 | day:10 | pattern:sort-by-value-density | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-units-on-a-truck/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `sort-by-value-density`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is fractional knapsack with unit-sized items: take the highest-value boxes first. It is greedy and exact precisely because boxes are interchangeable within a type and can be taken partially in count.

**Trick.** Sort descending by units per box, then take boxes until the truck is full.

**Edge cases that bite.**

- The last type is usually taken partially - take min(remaining, available).
- Truck size may exceed the total boxes.
- Sorting ascending and iterating backwards is equivalent.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates. This is the greedy that works BECAUSE the items are divisible by count - 0/1 knapsack with indivisible items would need DP.

**Same pattern.** [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Boats to Save People](https://leetcode.com/problems/boats-to-save-people/), [Two City Scheduling](https://leetcode.com/problems/two-city-scheduling/)

**Interview follow-ups.**

- **Q.** Why is 0/1 knapsack not greedy?
  <br>**A.** Indivisible items break the exchange argument - taking the highest-density item may exclude a combination that fills the capacity better. Divisibility restores it.
- **Q.** Boxes have both weight and volume limits.
  <br>**A.** Two constraints make it multidimensional knapsack, which is NP-hard.

</details>

#### `[SKIM]` 14. Minimum Number of Moves to Seat Everyone &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 2037

<!-- id:greedy-minimum-number-of-moves-to-seat-everyone | order:146 | day:10 | pattern:sort-and-match | template:T-SORT-06 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-number-of-moves-to-seat-everyone/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `sort-and-match`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Matching the ith smallest student to the ith smallest seat minimises the total distance. Any crossing assignment can be uncrossed without increasing the cost, which is a standard rearrangement argument.

**Trick.** Sort both arrays and sum the absolute differences at matching indices.

**Edge cases that bite.**

- The arrays are guaranteed equal length.
- Positions may coincide, contributing zero.
- Values are bounded at 100, so counting sort applies.

**Complexity.** `O(n log n)` time, `O(1)` space — two sorts and a linear sum.

**Same pattern.** [Array Partition](https://leetcode.com/problems/array-partition/), [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Minimum Absolute Difference](https://leetcode.com/problems/minimum-absolute-difference/)

**Interview follow-ups.**

- **Q.** Prove sorted matching is optimal.
  <br>**A.** If a < b are matched to y > x, then |a-y| + |b-x| >= |a-x| + |b-y|. So uncrossing never increases the total, and the fully sorted matching is reached by repeated uncrossing.
- **Q.** Minimise the MAXIMUM move instead.
  <br>**A.** Still sorted matching, but take the maximum rather than the sum - the same pairing is optimal for both objectives.

</details>

#### `[SKIM]` 15. Longest Palindrome &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 409

<!-- id:greedy-longest-palindrome | order:147 | day:10 | pattern:parity-counting | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-palindrome/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `parity-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A palindrome uses characters in pairs, with at most one odd character allowed in the centre. So the answer is the sum of the even parts of every count, plus one if any count was odd.

**Trick.** Sum (count / 2) * 2 across all characters, then add 1 if any count was odd. No construction is needed.

**Edge cases that bite.**

- Only ONE odd-count character may sit in the centre, regardless of how many exist.
- Case-sensitive - 'A' and 'a' are different characters.
- A string of all distinct characters gives 1.

**Complexity.** `O(n)` time, `O(1)` space — one counting pass over a fixed alphabet.

**Same pattern.** [Valid Anagram](https://leetcode.com/problems/valid-anagram/), [Valid Anagram](https://leetcode.com/problems/valid-anagram/), [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)

**Interview follow-ups.**

- **Q.** Why can only one odd character be used?
  <br>**A.** Every character except the exact centre must have a mirror. A second unmatched character has nowhere to sit.
- **Q.** Construct the palindrome rather than measure it.
  <br>**A.** Build half from the paired characters, place the odd one in the middle, then mirror.

</details>

#### `[SKIM]` 16. Maximize Sum Of Array After K Negations &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1005

<!-- id:greedy-maximize-sum-of-array-after-k-negations | order:148 | day:10 | pattern:greedy-with-parity | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximize-sum-of-array-after-k-negations/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `greedy-with-parity`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Flip the most negative values first, since each flip gains twice their magnitude. Once no negatives remain, any leftover flips should be spent repeatedly on the smallest absolute value - and only their parity matters.

**Trick.** Sort ascending, flip negatives while k remains. Then if k is still positive and odd, subtract twice the minimum absolute value from the total.

**Edge cases that bite.**

- Leftover k with even parity costs nothing - flipping twice restores the value.
- The minimum absolute value must be recomputed AFTER the flips.
- k may exceed the number of negatives.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates. A counting sort over the bounded value range would make it linear.

**Same pattern.** [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Maximize Sum Of Array After K Negations](https://leetcode.com/problems/maximize-sum-of-array-after-k-negations/), [Array Partition](https://leetcode.com/problems/array-partition/)

**Interview follow-ups.**

- **Q.** Why does only the parity of leftover k matter?
  <br>**A.** Flipping the same element twice returns it to its original value, so any even remainder is a no-op. Only one net flip can remain.
- **Q.** Why the smallest absolute value?
  <br>**A.** The forced flip costs twice that value, so you minimise the loss by choosing the smallest.

</details>

### Day 10 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **XOR annihilates pairs.** x ^ x = 0 and x ^ 0 = x, and XOR is commutative and associative, so order never matters. An array of pairs plus one loner XORs down to the loner.
  <br>↳ *Minimum Bit Flips to Convert Number* — XOR marking exactly the differing bit positions
- **x & (x-1) clears the lowest set bit.** Subtracting one turns the lowest 1 into 0 and everything below into 1s, so the AND clears that bit and preserves the rest. Iterating it counts set bits in O(popcount) rather than O(32).
  <br>↳ *Number of 1 Bits* — Brian Kernighan's loop; *Power of Two* — a single application testing for exactly one set bit; *Counting Bits* — dp[i] = dp[i & (i-1)] + 1 as one of the two recurrences
- **A forbidden operation points at doubling.** When multiplication or division is banned, the substitute is shifting and adding - the same halving structure as binary exponentiation, applied to a different operator.
  <br>↳ *Divide Two Integers* — shifting the divisor left while it fits, then subtracting
- **INT_MIN has no positive counterpart.** Two's complement holds one more negative value than positive, so negating INT_MIN overflows and abs(INT_MIN) is undefined. Work in the negative domain or promote to long long.
  <br>↳ *Divide Two Integers* — the INT_MIN / -1 case, and computing entirely in negatives; *Pow(x, n)* — promoting the exponent before negating it
- **Invert the work when testing each item is too slow.** Instead of asking whether each number has a property, mark the numbers that do. The sieve marks multiples rather than testing primality, which is nearly linear instead of O(n sqrt n).
  <br>↳ *Count Primes* — marking multiples from i*i, since smaller multiples already carry a lower factor
- **A trie can index bits, not just characters.** Inserting numbers as 32-bit paths and walking greedily toward the opposite bit works because a higher bit outweighs every lower bit combined.
  <br>↳ *Maximum XOR of Two Numbers in an Array* — the binary trie and the greedy opposite-bit descent
- **Exchange arguments are how greedy is justified.** Take any optimal solution, show the greedy choice can be swapped in without making it worse, and repeat. Without that argument you have a guess, not an algorithm.
  <br>↳ *Assign Cookies* — swapping an oversized cookie for the smallest adequate one; *Array Partition* — uncrossing a non-adjacent pairing to show adjacent pairing dominates; *Minimum Number of Moves to Seat Everyone* — uncrossing crossed assignments
- **Spend the least flexible resource first.** When resources differ in what they can substitute for, preserving the versatile ones keeps future options open.
  <br>↳ *Lemonade Change* — giving 10+5 before 5+5+5, because fives serve more situations; *Maximum Units on a Truck* — taking the highest-value boxes first, which works only because the count is divisible
- **Only parity survives a repeated reversible operation.** Applying the same flip twice restores the original, so any even remainder of a budget is a no-op and only the odd case costs anything.
  <br>↳ *Maximize Sum Of Array After K Negations* — spending leftover flips on the smallest absolute value, and only when k is odd
- **Count pairs, then allow one leftover.** Symmetric structures consume elements two at a time, with at most one unmatched element allowed at the centre.
  <br>↳ *Longest Palindrome* — summing the even part of every count and adding one if any count was odd

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones; Let the structure itself be the map; Equalise two traversals instead of measuring them
- **recursion** — Include or exclude gives 2^n, choose-one-of-many gives n!; Sort, then skip equal siblings to dedupe; `i` versus `i + 1` is the whole reuse question; Prune before recursing, not at the leaf; Mark in place and restore on the way out; 'Count' and 'return all' are different problems; Halve the exponent instead of decrementing it

### Day 11

*17 problems — 8 core, 6 drill, 3 skim.*

#### `[CORE]` 1. Min Stack &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 155

<!-- id:stack-queue-min-stack | order:98 | day:11 | pattern:auxiliary-min-stack | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/min-stack/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/implement-min-stack-o2n-and-on-space-complexity/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NdDIaH91P0g)

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

#### `[CORE]` 2. Next Greater Element I &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 496

<!-- id:stack-queue-next-greater-element-i | order:101 | day:11 | pattern:monotonic-stack | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/next-greater-element-i/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/next-greater-element-using-stack/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=e7XQLtOQM3I)

**Asked by:** Amazon, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `monotonic-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is the gateway to the entire monotonic stack family. Once an element has a smaller element to its right, that smaller one can never be anyone's answer - so it can be discarded permanently, which is what makes the pass linear.

**Trick.** Walk nums2 keeping a decreasing stack. Anything the current value exceeds is popped, and the current value is its next greater. Record results in a map, then read off for nums1.

**Edge cases that bite.**

- Elements left on the stack at the end have no greater element - default to -1.
- nums1 is a subset of nums2, so a map lookup is needed rather than index alignment.
- Values are distinct here, which removes tie handling.

**Complexity.** `O(n + m)` time, `O(n)` space — each element is pushed and popped once, so the inner while contributes O(n) in total. The nested-loop version is O(n*m).

**Same pattern.** [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Online Stock Span](https://leetcode.com/problems/online-stock-span/)

**Interview follow-ups.**

- **Q.** Why is the inner while not making this quadratic?
  <br>**A.** Each index enters the stack once and leaves once, so total pops across the whole run are bounded by n regardless of how many occur on any single step.
- **Q.** Next SMALLER element.
  <br>**A.** Flip the comparison and the stack becomes increasing. That one character switches the entire family.

</details>

#### `[CORE]` 3. Daily Temperatures &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 739

<!-- id:stack-queue-daily-temperatures | order:103 | day:11 | pattern:monotonic-stack | template:T-STK-01 -->

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

#### `[CORE]` 4. Asteroid Collision &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 735

<!-- id:stack-queue-asteroid-collision | order:105 | day:11 | pattern:stack-simulation | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/asteroid-collision/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/asteroid-collision) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_eYGqw_VDR4)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `stack-simulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Only a right-moving asteroid already on the stack can collide with an incoming left-moving one. Every other pairing is safe, and that single observation reduces the whole simulation to one stack pass.

**Trick.** Push positives unconditionally. For a negative, loop while the top is positive and smaller in magnitude, popping. Then handle the three outcomes: equal magnitudes destroy both, a larger top survives and the incoming is destroyed, or the stack is clear and it is pushed.

**Edge cases that bite.**

- Equal magnitudes destroy BOTH - pop the top and do not push the incoming.
- Two negatives never collide, nor do two positives.
- A negative arriving on an empty stack survives permanently.
- The alive flag pattern is cleaner than deeply nested branches.

**Complexity.** `O(n)` time, `O(n)` space — each asteroid is pushed and popped at most once. The naive repeated-scan simulation is O(n^2).

**Same pattern.** [Remove All Adjacent Duplicates In String](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/), [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Remove K Digits](https://leetcode.com/problems/remove-k-digits/), [Car Fleet](https://leetcode.com/problems/car-fleet/)

**Interview follow-ups.**

- **Q.** Asteroids of equal size pass through instead of destroying each other.
  <br>**A.** The equality branch becomes a no-op push rather than a mutual destruction - a one-line change, which is the point of isolating the three cases.
- **Q.** Why can two negatives never collide?
  <br>**A.** They move in the same direction at the same speed, so the gap between them is constant.

</details>

#### `[CORE]` 5. Remove K Digits &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 402

<!-- id:stack-queue-remove-k-digits | order:106 | day:11 | pattern:greedy-monotonic-stack | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-k-digits/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/remove-k-digits) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=jmbuRzYPGrg)

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

#### `[CORE]` 6. Sum of Subarray Minimums &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 907

<!-- id:stack-queue-sum-of-subarray-minimums | order:107 | day:11 | pattern:contribution-counting | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sum-of-subarray-minimums/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sum-of-subarray-minimums) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=v0e8p9JCgRc)

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

#### `[CORE]` 7. Largest Rectangle in Histogram &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 84

<!-- id:stack-queue-largest-rectangle-in-histogram | order:109 | day:11 | pattern:monotonic-stack-boundaries | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/area-of-largest-rectangle-in-histogram/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Bzat9vgD0fs)

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

#### `[CORE]` 8. Sliding Window Maximum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 239

<!-- id:stack-queue-sliding-window-maximum | order:110 | day:11 | pattern:monotonic-deque | template:T-STK-02 -->

[Solve on LeetCode](https://leetcode.com/problems/sliding-window-maximum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sliding-window-maximum/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=NwBvene4Imo)

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

#### `[DRILL]` 9. Implement Queue using Stacks &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 232

<!-- id:stack-queue-implement-queue-using-stacks | order:99 | day:11 | pattern:two-stack-amortised | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/implement-queue-using-stacks/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/implement-queue-using-stack/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tqQ5fTamIN4)

**Asked by:** Amazon, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-stack-amortised`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** One stack reverses order; two stacks reverse it twice, restoring FIFO. The transfer must happen only when the output stack is empty, which is what makes the amortised cost constant rather than linear.

**Trick.** Push onto the input stack. On pop or peek, if output is empty, drain input into output entirely, then operate on output. Never transfer partially.

**Edge cases that bite.**

- Transferring when output is non-empty destroys the ordering.
- empty() must check both stacks.
- A single pop can be O(n); only the amortised cost is O(1).

**Complexity.** `O(1) amortised per operation` time, `O(n)` space — each element is pushed and popped at most twice across both stacks, so n operations cost O(n) in total. A single operation can still be O(n).

**Same pattern.** [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/), [Min Stack](https://leetcode.com/problems/min-stack/), [Design Circular Queue](https://leetcode.com/problems/design-circular-queue/)

**Interview follow-ups.**

- **Q.** Is pop worst-case O(1)?
  <br>**A.** No - the transfer makes one pop O(n). Amortised O(1) is the honest claim, and the distinction is what the question is testing.
- **Q.** Stack using queues.
  <br>**A.** LC 225 - either make push O(n) by rotating the queue after each insert, or make pop O(n). You cannot have both at O(1) with queues.

</details>

#### `[DRILL]` 10. Next Greater Element II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 503

<!-- id:stack-queue-next-greater-element-ii | order:102 | day:11 | pattern:circular-monotonic-stack | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/next-greater-element-ii/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/next-greater-element-2) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7PrncD7v9YQ)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `circular-monotonic-stack`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Circularity is handled by pretending the array is twice as long. Iterating 2n times with index i % n lets the wrap-around candidates be considered without physically duplicating anything.

**Trick.** Loop i from 0 to 2n-1, using a[i % n]. Only record answers during the first pass, or during the second - but push indices throughout so wrapped candidates are available.

**Edge cases that bite.**

- Only write results for indices below n, or the second pass overwrites correct answers.
- Indices stored on the stack must be modulo n.
- All-equal arrays leave every answer at -1, since 'greater' is strict.

**Complexity.** `O(n)` time, `O(n)` space — 2n iterations with each index pushed and popped at most once, so still linear.

**Same pattern.** [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/), [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/)

**Interview follow-ups.**

- **Q.** Why 2n and not 3n?
  <br>**A.** Every element can see all n-1 others within one full wrap, so two passes suffice. A third adds nothing.
- **Q.** Circular subarray maximum sum.
  <br>**A.** Different technique - either a normal Kadane, or total minus the minimum subarray. The doubling trick is not the universal answer to circularity.

</details>

#### `[DRILL]` 11. Online Stock Span &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 901

<!-- id:stack-queue-online-stock-span | order:104 | day:11 | pattern:monotonic-stack-span | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/online-stock-span/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/stock-span-problem) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=eay-zoSRkVc)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `monotonic-stack-span`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Spans compose: when you pop an element, you inherit its span rather than recounting. That inheritance is what keeps the amortised cost constant even though a single call may pop many entries.

**Trick.** Stack of (price, span) pairs. While the top price is at most the new price, pop and add its span to the current one. Push the accumulated pair.

**Edge cases that bite.**

- Prices equal to the current one count toward the span - use <=, not <.
- The span includes today, so it starts at 1.
- A monotonically decreasing price sequence gives every span as 1.

**Complexity.** `O(1) amortised per call` time, `O(n)` space — each price is pushed once and popped once across the lifetime of the object, so n calls cost O(n) in total.

**Same pattern.** [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/), [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/), [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/)

**Interview follow-ups.**

- **Q.** Why can you add the popped span instead of recounting?
  <br>**A.** The popped element already spans a contiguous block of smaller-or-equal prices, and that entire block is also smaller than the current price by transitivity.
- **Q.** Support removing the most recent price.
  <br>**A.** Needs an undo log of what each push popped, so the stack can be restored - a persistent structure rather than a plain stack.

</details>

#### `[DRILL]` 12. Sum of Subarray Ranges &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 2104

<!-- id:stack-queue-sum-of-subarray-ranges | order:108 | day:11 | pattern:contribution-counting | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sum-of-subarray-ranges/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/sum-of-subarray-ranges) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=gIrMptNPf5M)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `contribution-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Range equals maximum minus minimum, and summation is linear, so the total equals the sum of all subarray maxima minus the sum of all subarray minima. Two runs of the previous problem, one with the comparison flipped.

**Trick.** Write one contribution-counting routine parameterised by the comparator, then call it twice and subtract.

**Edge cases that bite.**

- The O(n^2) brute force actually passes here given small constraints - but the O(n) solution is the point of the exercise.
- Duplicate handling must be consistent between the two runs.
- Sums overflow int - use long long throughout.

**Complexity.** `O(n)` time, `O(n)` space — four monotonic stack passes in total, all linear. The brute force is O(n^2).

**Same pattern.** [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)

**Interview follow-ups.**

- **Q.** Why does linearity let you split the sum?
  <br>**A.** Sum over subarrays of (max - min) equals sum of maxes minus sum of mins, because summation distributes over subtraction. Many aggregate problems decompose this way.
- **Q.** Sum of subarray medians.
  <br>**A.** Does not decompose - medians are not linear. This is exactly the boundary where the trick stops working.

</details>

#### `[DRILL]` 13. Remove All Adjacent Duplicates In String &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1047

<!-- id:stack-queue-remove-all-adjacent-duplicates-in-string | order:111 | day:11 | pattern:stack-cancellation | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `stack-cancellation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Removing a pair can create a new adjacent pair, so repeated scanning is O(n^2). A stack handles the cascade naturally: the element you just pushed is exactly the one the next character must be compared against.

**Trick.** Use the output string itself as the stack. If the last character equals the incoming one, pop it; otherwise push. One pass, no separate container.

**Edge cases that bite.**

- The cascade is the point - 'abbaca' becomes 'ca' only because removing 'bb' exposes 'aa'.
- An empty result is valid.
- Building into the result string directly avoids a final reversal.

**Complexity.** `O(n)` time, `O(n) for the output` space — each character is pushed and popped at most once. The repeated-scan approach is O(n^2).

**Same pattern.** [Remove All Adjacent Duplicates in String II](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string-ii/), [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/), [Backspace String Compare](https://leetcode.com/problems/backspace-string-compare/)

**Interview follow-ups.**

- **Q.** Remove groups of exactly k adjacent duplicates.
  <br>**A.** LC 1209 - stack of (character, count) pairs, popping when the count reaches k. Same idea with a counter attached.
- **Q.** Why can't you just scan repeatedly?
  <br>**A.** Each pass may remove only one pair while exposing another, so you can need O(n) passes of O(n) work.

</details>

#### `[DRILL]` 14. Backspace String Compare &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 844

<!-- id:stack-queue-backspace-string-compare | order:112 | day:11 | pattern:stack-or-reverse-scan | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/backspace-string-compare/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `stack-or-reverse-scan`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Building both strings with stacks is the obvious O(n) solution. The interesting version is O(1) space, which requires scanning from the RIGHT - because a backspace affects what came before it, which is only knowable in advance when moving backwards.

**Trick.** Two pointers from the ends. At each, skip backwards counting '#' and consuming that many real characters, then compare the surviving characters.

**Edge cases that bite.**

- More backspaces than characters is valid and consumes nothing further.
- Both pointers may run off the start simultaneously, which means equality.
- One string exhausting before the other means inequality.

**Complexity.** `O(n + m)` time, `O(1) with the reverse scan` space — each character is examined once per pointer. The stack solution is the same time but O(n) space, which the follow-up rules out.

**Same pattern.** [Remove All Adjacent Duplicates In String](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/), [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/)

**Interview follow-ups.**

- **Q.** Why must the O(1) solution scan from the right?
  <br>**A.** A backspace deletes the character before it, so moving left to right you cannot know whether a character survives until you have read further. From the right, the backspaces are already known.
- **Q.** Return the resulting string instead of comparing.
  <br>**A.** Then O(n) space is unavoidable, because the output itself is that large.

</details>

#### `[SKIM]` 15. Implement Stack using Queues &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 225

<!-- id:stack-queue-implement-stack-using-queues | order:100 | day:11 | pattern:queue-rotation | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/implement-stack-using-queues/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/implement-stack-using-single-queue) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=tqQ5fTamIN4)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `queue-rotation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A queue gives FIFO, so producing LIFO requires moving the cost somewhere. Rotating the queue after each push puts the newest element at the front, making push O(n) and everything else O(1).

**Trick.** Push, then dequeue and re-enqueue the preceding size-1 elements. One queue suffices; the two-queue version is no better.

**Edge cases that bite.**

- Rotate size-1 times, not size times.
- A single queue is enough - two is a common over-complication.
- Unlike the queue-from-stacks case, the cost here is not amortisable away.

**Complexity.** `O(n) push, O(1) pop and top` time, `O(n)` space — the rotation touches every existing element on each push. The reverse trade - O(1) push and O(n) pop - is equally valid.

**Same pattern.** [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/), [Min Stack](https://leetcode.com/problems/min-stack/), [Design Circular Queue](https://leetcode.com/problems/design-circular-queue/)

**Interview follow-ups.**

- **Q.** Why can't this be O(1) amortised like the stack version?
  <br>**A.** Stacks reverse order, so two reversals restore it and each element moves a bounded number of times. A queue preserves order, so every push must re-establish LIFO from scratch.

</details>

#### `[SKIM]` 16. Baseball Game &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 682

<!-- id:stack-queue-baseball-game | order:113 | day:11 | pattern:stack-simulation | template:T-STK-03 -->

[Solve on LeetCode](https://leetcode.com/problems/baseball-game/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `stack-simulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A pure stack simulation with four operation types. There is no algorithmic content - it exists to check that you can translate a specification into code without mis-ordering the operand handling.

**Trick.** Push integers. 'D' pushes twice the top, 'C' pops, '+' pushes the sum of the top two - which requires peeking two deep without permanently removing either.

**Edge cases that bite.**

- '+' must not consume its operands - pop, read, push back, or index the underlying vector.
- Using a vector rather than std::stack makes two-deep access trivial.
- The input is guaranteed valid, so no underflow checks are needed.

**Complexity.** `O(n)` time, `O(n)` space — one pass with constant work per operation.

**Same pattern.** [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/), [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Min Stack](https://leetcode.com/problems/min-stack/)

**Interview follow-ups.**

- **Q.** Evaluate Reverse Polish Notation.
  <br>**A.** LC 150 - the same stack shape with genuine arithmetic operators. Watch the operand order for subtraction and division: the second popped value is the left operand.

</details>

#### `[SKIM]` 17. Find the Town Judge &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 997

<!-- id:stack-queue-find-the-town-judge | order:114 | day:11 | pattern:indegree-outdegree | template:T-GRAPH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/find-the-town-judge/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `indegree-outdegree`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Trust is a directed graph, and the judge is the unique node with in-degree n-1 and out-degree 0. Framing it that way replaces any search with two counting arrays.

**Trick.** A single balance array: trusting someone decrements your score, being trusted increments theirs. The judge is the unique node with balance exactly n-1.

**Edge cases that bite.**

- n = 1 with no trust relationships makes person 1 the judge.
- No valid judge returns -1.
- The judge must trust nobody, which the decrement enforces automatically.

**Complexity.** `O(n + e)` time, `O(n)` space — one pass over the edges and one over the nodes. No graph traversal is needed at all.

**Same pattern.** [Find Center of Star Graph](https://leetcode.com/problems/find-center-of-star-graph/), [Course Schedule](https://leetcode.com/problems/course-schedule/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/)

**Interview follow-ups.**

- **Q.** Why does a single balance array suffice?
  <br>**A.** Only the judge can reach n-1, since anyone who trusts someone loses a point and can reach at most n-2. So the combined score uniquely identifies them.
- **Q.** Find the centre of a star graph.
  <br>**A.** LC 1791 - the centre appears in both of the first two edges, so it is O(1) with no counting at all.

</details>

### Day 11 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **A monotonic stack discards permanently irrelevant elements.** Once an element has a larger element after it, it can never be anyone's next-greater. Popping it is not a loss - and because each index is pushed and popped once, the pass is linear despite the inner while.
  <br>↳ *Next Greater Element I* — the decreasing stack and the amortised argument; *Daily Temperatures* — the same stack, storing indices because the answer is a distance; *Next Greater Element II* — iterating 2n times with i % n to handle circularity
- **Store indices, not values.** Distances, widths and spans are all unrecoverable from values alone. Storing indices costs nothing and keeps every variant available.
  <br>↳ *Daily Temperatures* — i - stackTop giving the waiting time; *Largest Rectangle in Histogram* — the width between the previous smaller and the current index; *Sliding Window Maximum* — indices so that out-of-window eviction is possible
- **Count contributions instead of enumerating subarrays.** An element is the minimum of exactly left * right subarrays, where left and right are distances to the previous and next smaller elements. Summing contributions is O(n) where enumeration is O(n^2).
  <br>↳ *Sum of Subarray Minimums* — the two boundary passes and the product formula; *Sum of Subarray Ranges* — the same computation run for maxima and subtracted
- **A sentinel drains the stack for you.** Appending a value that pops everything removes the separate cleanup loop and the special cases that come with it.
  <br>↳ *Largest Rectangle in Histogram* — the trailing zero height that forces every bar to be popped
- **A monotonic deque beats a heap for window extremes.** A heap cannot cheaply remove elements leaving the window. A deque can, because anything smaller than a later arrival is permanently irrelevant.
  <br>↳ *Sliding Window Maximum* — front eviction by index, back eviction by dominance, O(n) rather than O(n log k)
- **Amortised is not worst case, and say so.** Transferring between two stacks makes a single pop O(n) while keeping n operations at O(n) overall. Claiming plain O(1) is wrong.
  <br>↳ *Implement Queue using Stacks* — draining input into output only when output is empty; *Online Stock Span* — inheriting a popped element's span rather than recounting
- **Greedy removal with a monotonic stack.** To minimise a number, remove any digit followed by a smaller one, because that lowers a more significant place. The increasing stack performs exactly those removals.
  <br>↳ *Remove K Digits* — popping while the top exceeds the incoming digit and removals remain

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones; Let the structure itself be the map; Equalise two traversals instead of measuring them
- **recursion** — Include or exclude gives 2^n, choose-one-of-many gives n!; Sort, then skip equal siblings to dedupe; `i` versus `i + 1` is the whole reuse question; Prune before recursing, not at the leaf; Mark in place and restore on the way out; 'Count' and 'return all' are different problems; Halve the exponent instead of decrementing it
- **bit-manipulation** — XOR annihilates pairs; x & (x-1) clears the lowest set bit; A forbidden operation points at doubling; INT_MIN has no positive counterpart; Invert the work when testing each item is too slow; A trie can index bits, not just characters
- **greedy** — Exchange arguments are how greedy is justified; Spend the least flexible resource first; Only parity survives a repeated reversible operation; Count pairs, then allow one leftover

### Day 12

*15 problems — 5 core, 8 drill, 2 skim.*

#### `[CORE]` 1. Fruit Into Baskets &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 904

<!-- id:sliding-window-fruit-into-baskets | order:124 | day:12 | pattern:at-most-k-distinct | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/fruit-into-baskets/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/fruit-into-baskets) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=e3bs0uA1NhQ)

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

#### `[CORE]` 2. Binary Subarrays With Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 930

<!-- id:sliding-window-binary-subarrays-with-sum | order:125 | day:12 | pattern:at-most-k-difference | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-subarrays-with-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/binary-subarray-with-sum) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=XnMdNUkX6VM)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `at-most-k-difference`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting subarrays with sum EXACTLY goal is awkward with a window, because the shrink condition is ambiguous when zeros are present. atMost(goal) - atMost(goal-1) sidesteps it entirely and is the reusable idea here.

**Trick.** Write one helper counting subarrays with sum at most k by accumulating (r - l + 1) at each right endpoint, then subtract the two calls.

**Edge cases that bite.**

- goal = 0 requires atMost(-1) to return 0 - guard the helper.
- Zeros are what make the direct window ambiguous, since they extend a window without changing its sum.
- The prefix-count map alternative is equally valid and worth knowing.

**Complexity.** `O(n)` time, `O(1)` space — two linear passes. The prefix-sum map solution is also O(n) but uses O(n) space.

**Same pattern.** [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/), [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/), [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/)

**Interview follow-ups.**

- **Q.** Why is the direct window ambiguous?
  <br>**A.** With a run of zeros, many left positions give the same sum, so 'shrink while too large' does not identify a unique window and counting becomes error-prone.
- **Q.** Solve it with prefix sums.
  <br>**A.** It is exactly Subarray Sum Equals K on a 0/1 array. Recognising that two problems are the same is worth more than either solution.

</details>

#### `[CORE]` 3. Subarrays with K Different Integers &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 992

<!-- id:sliding-window-subarrays-with-k-different-integers | order:126 | day:12 | pattern:at-most-k-difference | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/subarrays-with-k-different-integers/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/subarray-with-k-different-integers) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=7wYGbV_LsX4)

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

#### `[CORE]` 4. Maximum Points You Can Obtain from Cards &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1423

<!-- id:sliding-window-maximum-points-you-can-obtain-from-cards | order:128 | day:12 | pattern:complement-window | template:T-SW-02 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-point-you-can-obtain-from-cards) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=pBWCOCS636U)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `complement-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Choosing k cards from the two ends is the same as LEAVING a contiguous window of n-k cards in the middle. Maximising what you take equals minimising what you leave, and the complement is a fixed-size window.

**Trick.** Compute the total, then find the minimum sum of any window of size n-k. The answer is total minus that minimum.

**Edge cases that bite.**

- k = n means taking everything; the complement window has size zero.
- The direct approach - sliding a prefix/suffix split - also works and is equally valid.
- Sums fit in int here but long long costs nothing.

**Complexity.** `O(n)` time, `O(1)` space — one pass for the total and one for the minimum window. Enumerating all 2^k choices of ends is exponential; even the prefix/suffix version is O(k).

**Same pattern.** [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/), [Defuse the Bomb](https://leetcode.com/problems/defuse-the-bomb/), [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)

**Interview follow-ups.**

- **Q.** Solve it without the complement.
  <br>**A.** Take k from the front, then repeatedly swap one front card for one back card, tracking the best. O(k) and arguably more direct.
- **Q.** Why is the complement a contiguous window?
  <br>**A.** Taking cards only from the ends means what remains is always an unbroken middle segment - which is exactly a window.

</details>

#### `[CORE]` 5. Frequency of the Most Frequent Element &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1838

<!-- id:sliding-window-frequency-of-the-most-frequent-element | order:129 | day:12 | pattern:sort-plus-window | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/frequency-of-the-most-frequent-element/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/find-the-highest-lowest-frequency-element/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `sort-plus-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You would always raise smaller elements up to a larger one, never the reverse - so sorting first makes the target the window's right end. The cost of levelling a window is then (windowLength * target) minus the window's sum, which is a prefix-sum computation.

**Trick.** Sort, then slide a window. Shrink while `(long long)a[r] * (r - l + 1) - windowSum > k`. The multiplication overflows int, so cast.

**Edge cases that bite.**

- a[r] * windowLength overflows int at 1e5 elements of 1e5 - cast to long long.
- k operations are total, not per element.
- The answer is the window length, not the value.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates; the window pass is linear. Without sorting there is no way to identify the target cheaply.

**Same pattern.** [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/), [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/), [Minimum Operations to Reduce X to Zero](https://leetcode.com/problems/minimum-operations-to-reduce-x-to-zero/)

**Interview follow-ups.**

- **Q.** Why sort first?
  <br>**A.** Raising a larger element to match a smaller one is never useful, so the target of any optimal window is its maximum. Sorting puts that at the right edge, making the cost formula closed-form.
- **Q.** Binary search alternative.
  <br>**A.** The answer is monotone - if a frequency f is achievable, so is f-1 - so you can binary search the answer and check feasibility with a fixed window. Same bound, different route.

</details>

#### `[DRILL]` 6. Maximum Average Subarray I &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 643

<!-- id:sliding-window-maximum-average-subarray-i | order:115 | day:12 | pattern:fixed-window | template:T-SW-02 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-average-subarray-i/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `fixed-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A fixed-size window needs no shrink loop at all - each step adds the entering element and removes the leaving one. This is the simplest possible window and the right place to internalise that structure.

**Trick.** Build the first window explicitly, then slide with sum += a[r] - a[r-k]. Compare sums rather than averages to avoid floating-point comparison entirely.

**Edge cases that bite.**

- Divide only once at the end - comparing averages in a loop invites precision errors.
- k equal to n means a single window.
- Sums of 1e5 values at 1e4 fit in int, but long long costs nothing.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two operations per step. Recomputing each window's sum is O(n*k).

**Same pattern.** [Defuse the Bomb](https://leetcode.com/problems/defuse-the-bomb/), [Maximum Points You Can Obtain from Cards](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/), [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)

**Interview follow-ups.**

- **Q.** Why compare sums rather than averages?
  <br>**A.** All windows share the divisor k, so the ordering is identical and integer comparison is exact. Dividing early introduces rounding for no benefit.
- **Q.** Maximum average of any subarray of length AT LEAST k.
  <br>**A.** LC 644 - binary search on the answer, checking feasibility with a prefix-sum sweep. Much harder, and a good example of how 'at least' changes everything.

</details>

#### `[DRILL]` 7. Squares of a Sorted Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 977

<!-- id:sliding-window-squares-of-a-sorted-array | order:117 | day:12 | pattern:opposing-pointers | template:T-TP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/squares-of-a-sorted-array/)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `opposing-pointers`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Squaring destroys the sort order because negatives become large. But the LARGEST square is always at one end or the other, so filling the output from the back with two converging pointers restores order in one pass.

**Trick.** Pointers at both ends, write position at the end of the output. Compare absolute values and write the larger square, moving that pointer inward.

**Edge cases that bite.**

- All negatives means the output is the reversed squares.
- Compare absolute values, or compare squares directly - either works, squares avoid abs().
- Fill the output backwards; filling forwards requires knowing the smallest first, which is in the middle.

**Complexity.** `O(n)` time, `O(n) for the output` space — each pointer moves inward once. Squaring then sorting is O(n log n) and throws away the input's sortedness.

**Same pattern.** [Sort Colors](https://leetcode.com/problems/sort-colors/), [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/), [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/)

**Interview follow-ups.**

- **Q.** Why fill backwards?
  <br>**A.** The maximum square is at a known position - one of the two ends - while the minimum is somewhere in the middle and would have to be searched for.
- **Q.** Do it in O(1) extra space.
  <br>**A.** Not possible in general, since the output must be a new array. If in-place modification were allowed you could partition at zero and merge in place.

</details>

#### `[DRILL]` 8. Is Subsequence &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 392

<!-- id:sliding-window-is-subsequence | order:118 | day:12 | pattern:greedy-two-pointer | template:T-TP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/is-subsequence/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `greedy-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Greedily matching the earliest possible occurrence of each character is optimal - taking a later match can never help, since it only shrinks what remains. That exchange argument is why a single pass suffices.

**Trick.** One pointer per string. Advance the s-pointer only on a match, always advance the t-pointer. Success is the s-pointer reaching the end.

**Edge cases that bite.**

- Empty s is a subsequence of anything.
- s longer than t can be rejected immediately.
- The follow-up about many queries is the real question here.

**Complexity.** `O(n + m)` time, `O(1)` space — each pointer advances monotonically. The DP formulation is O(n*m) and unnecessary for a single query.

**Same pattern.** [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Number of Matching Subsequences](https://leetcode.com/problems/number-of-matching-subsequences/), [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/), [Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/)

**Interview follow-ups.**

- **Q.** Billions of queries against the same t.
  <br>**A.** Precompute, for each position in t and each letter, the next occurrence of that letter. Each query then costs O(|s| log |t|) or O(|s|) depending on the index structure.
- **Q.** Prove the greedy match is optimal.
  <br>**A.** If a solution matches s[i] at position p, any earlier valid position p' < p leaves a superset of t available for the rest of s. So taking the earliest is never worse.

</details>

#### `[DRILL]` 9. Valid Palindrome II &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 680

<!-- id:sliding-window-valid-palindrome-ii | order:119 | day:12 | pattern:two-pointer-one-skip | template:T-TP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-palindrome-ii/)

**Asked by:** Facebook, Amazon &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `two-pointer-one-skip`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** On the first mismatch there are exactly two possibilities - delete the left character or the right - and each can be checked in linear time. Because only one deletion is allowed, the branching happens at most once, so the whole thing stays O(n).

**Trick.** Walk inward until a mismatch. Then test whether either s[l+1..r] or s[l..r-1] is a plain palindrome. No recursion or backtracking needed.

**Edge cases that bite.**

- Already a palindrome returns true without any deletion.
- The branch happens at most once - that is what bounds the complexity.
- Single character and empty strings are palindromes.

**Complexity.** `O(n)` time, `O(1)` space — one inward scan plus at most two linear verification scans. Allowing k deletions would make the branching exponential and force a DP.

**Same pattern.** [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/), [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/), [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/), [Is Subsequence](https://leetcode.com/problems/is-subsequence/)

**Interview follow-ups.**

- **Q.** At most k deletions.
  <br>**A.** The branching becomes exponential, so switch to DP: the answer is yes when the longest palindromic subsequence has length at least n - k.
- **Q.** Why does the branch occur only once?
  <br>**A.** The deletion budget is one. After spending it, the remainder must match exactly, so no further branching is possible.

</details>

#### `[DRILL]` 10. Contains Duplicate II &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 219

<!-- id:sliding-window-contains-duplicate-ii | order:120 | day:12 | pattern:windowed-set | template:T-SW-01 -->

[Solve on LeetCode](https://leetcode.com/problems/contains-duplicate-ii/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `windowed-set`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A plain seen-set answers 'is there a duplicate anywhere'. Bounding the distance turns it into a windowed set - evict elements as they fall out of range, so membership implicitly means 'within k'.

**Trick.** Maintain an unordered_set of the last k elements. Before inserting index i, erase index i-k-1 if it exists. Any successful membership test is then automatically within range.

**Edge cases that bite.**

- k = 0 can never satisfy the distance condition.
- Eviction must happen before the membership test, or a stale element gives a false positive.
- k larger than n degrades to plain Contains Duplicate.

**Complexity.** `O(n)` time, `O(min(n, k))` space — one pass with O(1) average set operations, and the set never exceeds k elements. The last-index map alternative is O(n) space but avoids eviction logic.

**Same pattern.** [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/), [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), [Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/)

**Interview follow-ups.**

- **Q.** Bound the VALUE difference too.
  <br>**A.** LC 220 - a set alone is insufficient; you need an ordered structure to find the nearest value, or bucketing by value range for O(n).
- **Q.** The last-index map alternative.
  <br>**A.** Store value to most recent index and compare i - lastIndex <= k. No eviction needed, but O(n) space rather than O(k).

</details>

#### `[DRILL]` 11. 3Sum Closest &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 16

<!-- id:sliding-window-3sum-closest | order:122 | day:12 | pattern:sort-two-pointer | template:T-TP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/3sum-closest/)

**Asked by:** Amazon, Facebook, Google, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Structurally identical to 3Sum, but because you can never exit early on an exact match, the sweep always runs to completion. Tracking the best difference replaces the equality test.

**Trick.** Sort, fix an anchor, converge two pointers. Update the best whenever the absolute difference improves, and move the pointer in the direction that reduces the gap.

**Edge cases that bite.**

- An exact match can be returned immediately as an optimisation.
- Sums overflow int with large values - accumulate in long long.
- Duplicate skipping is optional here since only one answer is returned.

**Complexity.** `O(n²)` time, `O(1)` space — sort plus a nested sweep, each anchor's inner pass being linear.

**Same pattern.** [3Sum](https://leetcode.com/problems/3sum/), [4Sum](https://leetcode.com/problems/4sum/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

**Interview follow-ups.**

- **Q.** Why can't you skip duplicates aggressively?
  <br>**A.** You can, and it is a safe optimisation - but unlike 3Sum it is not required for correctness, since only the closest value is reported.
- **Q.** k-Sum closest.
  <br>**A.** The same recursive reduction as kSum, with the closest-tracking pushed into the two-pointer base case.

</details>

#### `[DRILL]` 12. 4Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 18

<!-- id:sliding-window-4sum | order:123 | day:12 | pattern:sort-two-pointer | template:T-TP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/4sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/4-sum-find-quads-that-add-up-to-a-target-value/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=eD95WRfh81c)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two nested anchors reduce this to Two Sum on the remainder. The real content is overflow - four values near 1e9 sum past int - and deduplication at three separate levels rather than two.

**Trick.** Sort, two nested loops with duplicate skips at both levels, then converging pointers. Accumulate the sum in long long from the first addition.

**Edge cases that bite.**

- Sums overflow int; cast before adding, not after.
- Duplicate skips are needed at both anchor levels AND at both pointers.
- Pruning on the smallest and largest possible remaining sums cuts a lot of work.

**Complexity.** `O(n³)` time, `O(1) excluding output` space — two nested anchors with a linear inner sweep. The general kSum reduction gives O(n^(k-1)).

**Same pattern.** [3Sum](https://leetcode.com/problems/3sum/), [Two Sum](https://leetcode.com/problems/two-sum/), [3Sum Closest](https://leetcode.com/problems/3sum-closest/)

**Interview follow-ups.**

- **Q.** Write a general kSum.
  <br>**A.** Recurse: for k > 2, loop an anchor and recurse on k-1; at k = 2 use two pointers. Clean, and it makes the O(n^(k-1)) bound obvious.
- **Q.** 4Sum II, with four separate arrays.
  <br>**A.** LC 454 - hash the pairwise sums of the first two arrays, then look up complements from the other two. O(n^2) rather than O(n^3), because the arrays are independent.

</details>

#### `[DRILL]` 13. Number of Substrings Containing All Three Characters &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1358

<!-- id:sliding-window-number-of-substrings-containing-all-three-characters | order:127 | day:12 | pattern:last-occurrence-counting | template:T-SW-03 -->

[Solve on LeetCode](https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/number-of-substring-containing-all-three-characters) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=xtqN4qlgr8s)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `last-occurrence-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rather than maintaining a window, track the last index at which each of a, b and c appeared. Every substring ending at i and starting at or before the minimum of those three contains all of them.

**Trick.** Keep last[3]. At each i, add `min(last[0], last[1], last[2]) + 1` to the answer, which counts all valid starting positions at once.

**Edge cases that bite.**

- Initialise last[] to -1 so the +1 makes the contribution zero before all three appear.
- The answer can exceed int for long strings - use long long.
- Only three characters appear, by constraint.

**Complexity.** `O(n)` time, `O(1)` space — one pass with three scalars. The standard sliding window also works in O(n); this variant is shorter and avoids the map entirely.

**Same pattern.** [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/), [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/), [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

**Interview follow-ups.**

- **Q.** Solve it with a conventional window instead.
  <br>**A.** Shrink from the left while all three remain present, and add (l + 1) at each step. Equivalent, and it generalises to larger alphabets more naturally.
- **Q.** Generalise to an arbitrary required set.
  <br>**A.** The last-occurrence trick needs the minimum over the whole required set, which is O(k) per step unless you maintain it - at which point the window is cleaner.

</details>

#### `[SKIM]` 14. Defuse the Bomb &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1652

<!-- id:sliding-window-defuse-the-bomb | order:116 | day:12 | pattern:circular-fixed-window | template:T-SW-02 -->

[Solve on LeetCode](https://leetcode.com/problems/defuse-the-bomb/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `circular-fixed-window`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A fixed window on a circular array. The modulo handles the wrap, and a negative k simply means the window sits behind each index rather than ahead of it.

**Trick.** Handle k = 0 by returning zeros. Otherwise build one window and slide it, indexing with (i % n + n) % n so negative offsets behave.

**Edge cases that bite.**

- k = 0 returns an all-zero array, not the input.
- Negative k reads backwards - the same loop with a shifted start.
- The double modulo is needed because C++ % of a negative value is negative.

**Complexity.** `O(n)` time, `O(n) for the output` space — a constant-size window slid n times. The naive nested version is O(n*k).

**Same pattern.** [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/), [Maximum Points You Can Obtain from Cards](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/), [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/)

**Interview follow-ups.**

- **Q.** Why the double modulo?
  <br>**A.** In C++, -1 % 5 is -1, not 4. Adding n before the second modulo normalises it into range - the same fix used in hash functions with negative keys.

</details>

#### `[SKIM]` 15. Repeated DNA Sequences &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 187

<!-- id:sliding-window-repeated-dna-sequences | order:121 | day:12 | pattern:fixed-window-hashing | template:T-STR-03 -->

[Solve on LeetCode](https://leetcode.com/problems/repeated-dna-sequences/)

**Asked by:** Amazon, Google, LinkedIn &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `fixed-window-hashing`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A fixed window of 10 characters plus a hash set of what has been seen. The interesting part is the follow-up: each nucleotide needs only 2 bits, so a 10-length window fits in 20 bits and can be rolled in O(1) as an integer.

**Trick.** Map A, C, G, T to 0-3. Roll a 20-bit integer with `code = ((code << 2) | v) & 0xFFFFF`. Count occurrences and report anything seen exactly twice, to avoid duplicate output.

**Edge cases that bite.**

- Report on the SECOND occurrence only, or a sequence appearing three times is emitted twice.
- Strings shorter than 10 return empty.
- The mask 0xFFFFF keeps exactly 20 bits.

**Complexity.** `O(n)` time, `O(n)` space — one pass with constant-time rolling and hashing. Storing substrings directly is O(10n) space and slower to hash.

**Same pattern.** [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/), [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

**Interview follow-ups.**

- **Q.** Why 2 bits per character?
  <br>**A.** There are exactly four nucleotides, so two bits encode each. Ten characters therefore fit in 20 bits, well inside an int.
- **Q.** Generalise to length L over an arbitrary alphabet.
  <br>**A.** Polynomial rolling hash with a large prime modulus, verifying hits to guard against collisions.

</details>

### Day 12 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Fixed windows slide, variable windows shrink.** A fixed-size window adds one and removes one per step with no inner loop. A variable window extends always and shrinks conditionally, and is linear because the left pointer never retreats.
  <br>↳ *Maximum Average Subarray I* — sum += a[r] - a[r-k], with no shrink loop; *Maximum Points You Can Obtain from Cards* — a fixed complement window of size n-k; *Frequency of the Most Frequent Element* — a variable window with a cost condition
- **Erase zero-count keys or size() lies.** unordered_map::size() counts keys, not non-zero values. A key left at zero keeps inflating the distinct count and the window stops shrinking correctly.
  <br>↳ *Fruit Into Baskets* — erasing the key when its count reaches zero during the shrink; *Subarrays with K Different Integers* — the same erasure inside the atMost helper
- **The complement is often the easier window.** Choosing from both ends is the same as leaving a contiguous middle. Maximising what you take equals minimising what you leave.
  <br>↳ *Maximum Points You Can Obtain from Cards* — minimising the sum of the untaken window of size n-k
- **Opposing pointers need a justified move rule.** On sorted input, one direction provably increases the quantity and the other decreases it, which is what makes converging valid. On unsorted input the move must be justified some other way.
  <br>↳ *Squares of a Sorted Array* — the largest square is at one end, so fill the output backwards; *3Sum Closest* — moving the pointer that reduces the gap; *4Sum* — two nested anchors with a converging inner sweep
- **Sort first when the target of a window is its extreme.** If you would only ever raise smaller values to match a larger one, sorting puts that target at the window's edge and makes the cost a closed-form prefix computation.
  <br>↳ *Frequency of the Most Frequent Element* — cost = a[r] * windowLength - windowSum, cast to long long to avoid overflow
- **Greedy earliest match is optimal for subsequences.** Matching a character at the earliest possible position leaves a superset of the input available for everything that follows, so it is never worse.
  <br>↳ *Is Subsequence* — advancing the pattern pointer only on a match
- **Bound the branching to keep a check linear.** One permitted deletion means the search branches at most once, so two linear verifications suffice. A budget of k would make it exponential and force a DP.
  <br>↳ *Valid Palindrome II* — testing both skip options after the first mismatch

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones; Let the structure itself be the map; Equalise two traversals instead of measuring them
- **recursion** — Include or exclude gives 2^n, choose-one-of-many gives n!; Sort, then skip equal siblings to dedupe; `i` versus `i + 1` is the whole reuse question; Prune before recursing, not at the leaf; Mark in place and restore on the way out; 'Count' and 'return all' are different problems; Halve the exponent instead of decrementing it
- **bit-manipulation** — XOR annihilates pairs; x & (x-1) clears the lowest set bit; A forbidden operation points at doubling; INT_MIN has no positive counterpart; Invert the work when testing each item is too slow; A trie can index bits, not just characters
- **stack-queue** — A monotonic stack discards permanently irrelevant elements; Store indices, not values; Count contributions instead of enumerating subarrays; A sentinel drains the stack for you; A monotonic deque beats a heap for window extremes; Amortised is not worst case, and say so; Greedy removal with a monotonic stack
- **greedy** — Exchange arguments are how greedy is justified; Spend the least flexible resource first; Only parity survives a repeated reversible operation; Count pairs, then allow one leftover

### Day 13

*20 problems — 9 core, 7 drill, 4 skim.*

#### `[CORE]` 1. Kth Largest Element in an Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 215

<!-- id:heaps-kth-largest-element-in-an-array | order:130 | day:13 | pattern:size-k-heap | template:T-HEAP-01 -->

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

<!-- id:heaps-top-k-frequent-elements | order:134 | day:13 | pattern:count-then-select | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/top-k-frequent-elements)

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

#### `[CORE]` 3. Ugly Number II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 264

<!-- id:heaps-ugly-number-ii | order:135 | day:13 | pattern:three-pointer-merge | template:T-HEAP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/ugly-number-ii/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `three-pointer-merge`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The nth ugly number cannot be found by testing candidates - they thin out too fast. Instead GENERATE them: every ugly number is a previous one multiplied by 2, 3 or 5, so the sequence is a three-way merge of itself.

**Trick.** Three pointers into the sequence being built, each tracking the next multiple of 2, 3 and 5. Take the minimum and advance EVERY pointer that produced it, which is how duplicates are avoided.

**Edge cases that bite.**

- Advancing only one pointer on a tie produces duplicates - 6 is both 2*3 and 3*2.
- The first ugly number is 1.
- Values fit in int for n = 1690, which is the constraint limit.

**Complexity.** `O(n)` time, `O(n)` space — one constant-time step per generated number. The heap version is O(n log n) and needs a set to deduplicate - the pointer version avoids both.

**Same pattern.** [Super Ugly Number](https://leetcode.com/problems/super-ugly-number/), [Ugly Number](https://leetcode.com/problems/ugly-number/), [Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/), [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)

**Interview follow-ups.**

- **Q.** Why advance every matching pointer?
  <br>**A.** Because the same value can be produced by several factors. Advancing only one leaves the others pointing at a value already emitted.
- **Q.** Arbitrary set of primes.
  <br>**A.** LC 313 - k pointers instead of three, or a min-heap when k is large enough that scanning the pointers dominates.

</details>

#### `[CORE]` 4. Task Scheduler &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 621

<!-- id:heaps-task-scheduler | order:137 | day:13 | pattern:greedy-slot-filling | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/task-scheduler/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/task-scheduler)

**Asked by:** Amazon, Facebook, Google, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `greedy-slot-filling`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The heap simulation works, but there is a closed form: the most frequent task builds a skeleton of (maxFreq - 1) blocks each of length (n + 1), and every other task fills the idle slots. Deriving that formula is a far stronger answer than simulating.

**Trick.** answer = max(taskCount, (maxFreq - 1) * (n + 1) + countOfTasksWithMaxFreq). The max() handles the case where there are so many distinct tasks that no idling is ever needed.

**Edge cases that bite.**

- When enough distinct tasks exist, the answer is simply the task count - hence the max().
- Several tasks may share the maximum frequency; all of them occupy the final block.
- n = 0 means no cooldown, so the answer is the task count.

**Complexity.** `O(n)` time, `O(1) with a 26-slot counter` space — one counting pass and a formula. The heap simulation is O(total time * log 26), which is correct but slower and harder to reason about.

**Same pattern.** [Reorganize String](https://leetcode.com/problems/reorganize-string/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/), [Hand of Straights](https://leetcode.com/problems/hand-of-straights/)

**Interview follow-ups.**

- **Q.** Derive the formula.
  <br>**A.** Lay out the most frequent task maxFreq times, separated by n slots: that is (maxFreq - 1) * (n + 1) time, plus one slot for each task tied at maxFreq in the final block. Other tasks fill idle slots without extending the total.
- **Q.** Return the actual schedule, not just its length.
  <br>**A.** Now you need the heap simulation - the formula gives the length but not the ordering.
- **Q.** Why the max() with task count?
  <br>**A.** With many distinct tasks the idle slots are all filled and the schedule is fully packed, so the total is just the number of tasks.

</details>

#### `[CORE]` 5. Find Median from Data Stream &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 295

<!-- id:heaps-find-median-from-data-stream | order:141 | day:13 | pattern:two-heaps | template:T-HEAP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/find-median-from-data-stream/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-median-from-data-stream)

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

#### `[CORE]` 6. Minimum Number of Arrows to Burst Balloons &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 452

<!-- id:greedy-minimum-number-of-arrows-to-burst-balloons | order:149 | day:13 | pattern:sort-by-end-schedule | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `sort-by-end-schedule`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Identical to interval scheduling. Shooting at the earliest END point bursts every balloon that overlaps there and leaves the most room for the rest - so sort by end, not by start.

**Trick.** Sort by end. Keep the position of the last arrow; when a balloon starts after it, fire a new arrow at that balloon's end.

**Edge cases that bite.**

- Touching balloons at a shared coordinate are burst by one arrow - use > not >= for the new-arrow test.
- Coordinates reach INT_MAX, so sorting by end must not compute differences.
- A single balloon needs one arrow.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates; the sweep is linear. This is the same algorithm as Non-overlapping Intervals, counting kept groups rather than removed ones.

**Same pattern.** [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/), [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Maximum Length of Pair Chain](https://leetcode.com/problems/maximum-length-of-pair-chain/), [Insert Interval](https://leetcode.com/problems/insert-interval/)

**Interview follow-ups.**

- **Q.** Why does sorting by end work here?
  <br>**A.** The earliest-ending balloon must be burst by some arrow, and placing that arrow at its end point maximises what else it can catch. Exchange argument as usual.
- **Q.** Why must you avoid subtracting coordinates in the comparator?
  <br>**A.** Coordinates span the full int range, so a - b overflows. Compare directly with <.

</details>

#### `[CORE]` 7. Valid Parenthesis String &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 678

<!-- id:greedy-valid-parenthesis-string | order:151 | day:13 | pattern:range-tracking | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-parenthesis-string/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/valid-paranthesis-checker) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=cHT6sG_hUZI)

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

#### `[CORE]` 8. Queue Reconstruction by Height &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 406

<!-- id:greedy-queue-reconstruction-by-height | order:152 | day:13 | pattern:insert-by-priority | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/queue-reconstruction-by-height/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `insert-by-priority`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Place the tallest people first. Once they are positioned, inserting a shorter person anywhere cannot disturb their counts, because shorter people are invisible to them. That independence is what makes the greedy sound.

**Trick.** Sort by height descending, then by count ascending. Insert each person at the index equal to their count.

**Edge cases that bite.**

- The secondary sort must be ascending by count, or equal-height people are placed wrongly.
- Vector insertion is O(n), giving O(n^2) overall - acceptable at these constraints.
- The count refers only to people of greater or equal height.

**Complexity.** `O(n²)` time, `O(n)` space — n insertions into a vector, each O(n) for the shift. A balanced BST or Fenwick tree with order statistics reduces it to O(n log n).

**Same pattern.** [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/), [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)

**Interview follow-ups.**

- **Q.** Why is the insertion safe?
  <br>**A.** Everyone already placed is taller or equal, so a shorter person inserted before them does not change their count. Their positions may shift, but their counts do not.
- **Q.** Make it O(n log n).
  <br>**A.** Use an order-statistic tree or a Fenwick tree over empty slots to find the kth free position in O(log n) instead of shifting.

</details>

#### `[CORE]` 9. Split Array into Consecutive Subsequences &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 659

<!-- id:greedy-split-array-into-consecutive-subsequences | order:156 | day:13 | pattern:greedy-two-counters | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/split-array-into-consecutive-subsequences/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `greedy-two-counters`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Prefer extending an existing run over starting a new one, because a run of length 1 or 2 is invalid and must eventually be extended anyway. Two counters - available values and runs ending here - express that without any search.

**Trick.** Count frequencies. Keep a map of runs ending at each value. For each x in order, extend a run ending at x-1 if one exists; otherwise start a new run needing x+1 and x+2, failing if either is unavailable.

**Edge cases that bite.**

- Runs must be length 3 or more, which is why starting a run consumes three values at once.
- Extending must be preferred over starting, or you strand short runs.
- Values must be processed in ascending order.

**Complexity.** `O(n)` time, `O(n)` space — one pass over the sorted values with constant-time map operations.

**Same pattern.** [Hand of Straights](https://leetcode.com/problems/hand-of-straights/), [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/), [Task Scheduler](https://leetcode.com/problems/task-scheduler/)

**Interview follow-ups.**

- **Q.** Why prefer extending?
  <br>**A.** A run you decline to extend must later reach length 3 on its own, consuming values that the existing run would have used anyway. Extending is never worse.
- **Q.** Hand of Straights, where all groups have a fixed size.
  <br>**A.** LC 846 - simpler, because the group length is known, so the smallest card's group is fully determined.

</details>

#### `[DRILL]` 10. Kth Largest Element in a Stream &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 703

<!-- id:heaps-kth-largest-element-in-a-stream | order:131 | day:13 | pattern:size-k-heap | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/kth-largest-element-in-a-stream/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/kth-largest-element-in-a-stream-of-running-integers)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `size-k-heap`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The streaming version of the previous problem, and it makes the size-k heap's advantage concrete: quickselect cannot apply because there is no complete array to partition.

**Trick.** Keep a min-heap capped at k. Every add pushes and pops down to size k, then returns the root. Seed it with the initial array the same way.

**Edge cases that bite.**

- The initial array may be shorter than k - the heap simply fills up over time.
- Pop after pushing, not before, or you evict the wrong element.
- Duplicates are retained; they count toward k.

**Complexity.** `O(log k) per add` time, `O(k)` space — each insertion is one push and at most one pop on a heap of size k.

**Same pattern.** [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/), [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

**Interview follow-ups.**

- **Q.** Why can't quickselect be used here?
  <br>**A.** It requires the full array in memory to partition, and it destroys the ordering. A stream offers neither.
- **Q.** Kth SMALLEST in a stream.
  <br>**A.** Symmetric - a max-heap of size k.

</details>

#### `[DRILL]` 11. Super Ugly Number &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 313

<!-- id:heaps-super-ugly-number | order:136 | day:13 | pattern:k-pointer-merge | template:T-HEAP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/super-ugly-number/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `k-pointer-merge`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The generalisation of Ugly Number II from three factors to k. The structure is unchanged; only the number of pointers grows, and at some k a heap becomes cheaper than scanning them all.

**Trick.** Keep one pointer per prime. Each step scans the k candidates for the minimum, emits it, and advances every pointer that produced it.

**Edge cases that bite.**

- Duplicate handling is identical - advance all matching pointers.
- Intermediate products can overflow int; use long long for the candidates.
- k can reach 100, at which point the O(n*k) scan is still fine but a heap is competitive.

**Complexity.** `O(n·k)` time, `O(n + k)` space — each of n numbers requires scanning k pointers. A min-heap makes it O(n log k), which wins for large k.

**Same pattern.** [Ugly Number II](https://leetcode.com/problems/ugly-number-ii/), [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/), [Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/)

**Interview follow-ups.**

- **Q.** When does the heap become worthwhile?
  <br>**A.** When log k is smaller than k - in practice around k = 20 or more. Below that the linear scan has a better constant.
- **Q.** Why not generate and sort?
  <br>**A.** The products explode combinatorially; you cannot bound how many to generate without already knowing the nth value.

</details>

#### `[DRILL]` 12. Hand of Straights &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 846

<!-- id:heaps-hand-of-straights | order:138 | day:13 | pattern:greedy-consume-smallest | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/hand-of-straights/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/hands-of-straights)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `greedy-consume-smallest`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The smallest remaining card MUST begin a group - nothing smaller exists to precede it. That forced choice makes the greedy exact, and it removes any need to search over groupings.

**Trick.** Count into an ordered map. Repeatedly take the smallest key, and consume one of each of the next groupSize consecutive values, failing if any is missing.

**Edge cases that bite.**

- n % groupSize != 0 means failure - check before doing any work.
- Erase keys when their count reaches zero, or the smallest key is stale.
- Counts can exceed one, so consume exactly one per group rather than clearing.

**Complexity.** `O(n log n)` time, `O(n)` space — each card is consumed once, with O(log n) map operations. The greedy is exact because the smallest card's group is forced.

**Same pattern.** [Split Array into Consecutive Subsequences](https://leetcode.com/problems/split-array-into-consecutive-subsequences/), [Task Scheduler](https://leetcode.com/problems/task-scheduler/), [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/)

**Interview follow-ups.**

- **Q.** Prove the greedy.
  <br>**A.** The smallest remaining card has no possible predecessor, so it must be the first element of its group. Its group is then fully determined, leaving a strictly smaller instance.
- **Q.** Split Array into Consecutive Subsequences.
  <br>**A.** LC 659 - similar but groups may be longer than the minimum, so a greedy with two counters (available and ending-here) is needed instead.

</details>

#### `[DRILL]` 13. Design Twitter &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 355

<!-- id:heaps-design-twitter | order:139 | day:13 | pattern:k-way-merge-design | template:T-HEAP-03 -->

[Solve on LeetCode](https://leetcode.com/problems/design-twitter/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/design-twitter)

**Asked by:** Amazon, Twitter, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `k-way-merge-design`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A design problem whose core is a k-way merge: each user's feed is the merge of their own and their followees' tweet lists, and you only need the ten newest. Storing tweets newest-first makes each list a sorted sequence.

**Trick.** Per-user vector of (timestamp, tweetId) and a set of followees. getNewsFeed pushes the head of each relevant list into a heap and pops ten times, refilling from the same list each time.

**Edge cases that bite.**

- A user follows themselves implicitly for feed purposes - handle it or add them to the set.
- Unfollowing yourself must not be permitted.
- Only the last ten tweets per user are ever needed, which bounds the work.

**Complexity.** `O(f log f + 10 log f) per feed` time, `O(total tweets)` space — the heap holds one entry per followed user, so operations are logarithmic in the follow count rather than the tweet count.

**Same pattern.** [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/), [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/), [LRU Cache](https://leetcode.com/problems/lru-cache/)

**Interview follow-ups.**

- **Q.** Millions of followees.
  <br>**A.** Fan-out-on-write instead: push each tweet into followers' precomputed feeds at post time. Trades write cost for read cost, which is what real systems do.
- **Q.** Why is a global timestamp needed?
  <br>**A.** Tweets must be merged in chronological order across users, and per-user indices are not comparable.

</details>

#### `[DRILL]` 14. Maximum Length of Pair Chain &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 646

<!-- id:greedy-maximum-length-of-pair-chain | order:150 | day:13 | pattern:sort-by-end-schedule | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-length-of-pair-chain/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `sort-by-end-schedule`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A third instance of interval scheduling in the same day, which is the point - once you recognise 'longest chain of non-overlapping things' you should reach for sort-by-end without rereading the statement.

**Trick.** Sort by the second element. Track the last chosen end; extend the chain whenever the current pair starts strictly after it.

**Edge cases that bite.**

- Pairs must be strictly increasing, so use > not >=.
- Pairs may be given in any order and are not pre-sorted.
- A single pair gives a chain of 1.

**Complexity.** `O(n log n)` time, `O(1)` space — sort plus a linear sweep. The DP alternative - longest chain by compatibility - is O(n^2) and unnecessary.

**Same pattern.** [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/), [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/), [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/)

**Interview follow-ups.**

- **Q.** Pairs have weights and you want maximum total weight.
  <br>**A.** Greedy fails. Sort by end and use DP with binary search for the latest compatible predecessor - O(n log n). That is LC 1235.
- **Q.** How is this related to LIS?
  <br>**A.** It is LIS with a compatibility relation instead of a numeric one. The greedy works here because the relation is an interval ordering, which LIS in general is not.

</details>

#### `[DRILL]` 15. Wiggle Subsequence &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 376

<!-- id:greedy-wiggle-subsequence | order:153 | day:13 | pattern:direction-counting | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/wiggle-subsequence/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `direction-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You only need to count direction CHANGES. Any monotone run contributes exactly one element to the subsequence, so tracking the previous direction is enough - no DP table is required.

**Trick.** Keep up and down counters. On a rise, up = down + 1; on a fall, down = up + 1. Equal adjacent values change nothing. The answer is max(up, down).

**Edge cases that bite.**

- Equal adjacent elements must not count as a direction change.
- Single element gives 1.
- An entirely monotone array also gives a wiggle length of 2, not 1.

**Complexity.** `O(n)` time, `O(1)` space — one pass with two counters. The O(n^2) DP over all previous indices is what this replaces.

**Same pattern.** [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/), [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/), [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/)

**Interview follow-ups.**

- **Q.** Why is taking the extreme of each run optimal?
  <br>**A.** Within a monotone run, only the last element can extend the wiggle in the next direction. Taking any earlier one is never better and sometimes worse.
- **Q.** Return the actual subsequence.
  <br>**A.** Record indices whenever a counter increments; those are the turning points.

</details>

#### `[DRILL]` 16. Valid Triangle Number &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 611

<!-- id:greedy-valid-triangle-number | order:154 | day:13 | pattern:sort-two-pointer | template:T-TP-02 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-triangle-number/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `sort-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Only one of the three triangle inequalities needs checking once the sides are sorted: if a <= b <= c, then a + b > c implies the other two automatically. That reduces three conditions to one and makes a two-pointer sweep possible.

**Trick.** Sort. Fix the largest side c from the right, then converge two pointers over the prefix. When a[l] + a[r] > c, ALL pairs between l and r also work, so add r - l and decrement r.

**Edge cases that bite.**

- Adding r - l in one step is what makes it O(n^2) rather than O(n^3).
- Zeros cannot form triangles - the strict inequality handles them.
- Duplicate side lengths are counted as distinct triples.

**Complexity.** `O(n²)` time, `O(1)` space — n choices of the largest side, each with a linear inner sweep. Checking all triples is O(n^3).

**Same pattern.** [3Sum](https://leetcode.com/problems/3sum/), [3Sum Closest](https://leetcode.com/problems/3sum-closest/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

**Interview follow-ups.**

- **Q.** Why does sorting reduce three inequalities to one?
  <br>**A.** With a <= b <= c, both a + c > b and b + c > a hold trivially since c is the largest. Only a + b > c is in doubt.
- **Q.** Why can you add r - l at once?
  <br>**A.** The array is sorted, so if a[l] + a[r] > c then a[i] + a[r] > c for every i between l and r. All those pairs are valid in one step.

</details>

#### `[SKIM]` 17. Last Stone Weight &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1046

<!-- id:heaps-last-stone-weight | order:132 | day:13 | pattern:max-heap-simulation | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/last-stone-weight/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `max-heap-simulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A direct simulation where the only requirement is repeatedly extracting the two largest elements - which is precisely what a max-heap provides in O(log n).

**Trick.** Push everything into a max-heap. While more than one remains, pop two and push back the difference if it is non-zero.

**Edge cases that bite.**

- Equal stones destroy each other completely - push nothing back.
- An empty heap at the end means 0.
- A single stone is returned unchanged.

**Complexity.** `O(n log n)` time, `O(n)` space — n insertions and at most n extractions, each O(log n). Sorting after every collision would be O(n^2 log n).

**Same pattern.** [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/), [Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/), [Task Scheduler](https://leetcode.com/problems/task-scheduler/)

**Interview follow-ups.**

- **Q.** Last Stone Weight II - minimise the final stone.
  <br>**A.** Completely different. Partition the stones into two groups with sums as close as possible, which is subset-sum DP. Same story, different problem.
- **Q.** Why a heap rather than sorting once?
  <br>**A.** The pushed-back difference must be reinserted in order, and repeated sorting is far more expensive than a heap's O(log n) insert.

</details>

#### `[SKIM]` 18. The K Weakest Rows in a Matrix &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1337

<!-- id:heaps-the-k-weakest-rows-in-a-matrix | order:133 | day:13 | pattern:size-k-heap | template:T-HEAP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/the-k-weakest-rows-in-a-matrix/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `size-k-heap`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each row is sorted, so its soldier count is a binary search rather than a scan. Combine that with a size-k heap on (strength, index) pairs and neither dimension is handled naively.

**Trick.** Binary search each row for the first zero to get its count in O(log n), then keep a max-heap of size k on (count, index) so ties break by index.

**Edge cases that bite.**

- Ties must break by row index, which a pair comparison gives for free.
- A row may be all ones or all zeros - the binary search must handle both bounds.
- k is at most the number of rows.

**Complexity.** `O(m log n + m log k)` time, `O(k)` space — one binary search per row plus heap operations bounded by k. Counting each row linearly would be O(m*n).

**Same pattern.** [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/), [Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/)

**Interview follow-ups.**

- **Q.** Why does a pair comparison break ties correctly?
  <br>**A.** std::pair compares lexicographically, so equal counts fall back to the index - exactly the required ordering.
- **Q.** Rows are not sorted.
  <br>**A.** Binary search is unavailable; counting becomes O(n) per row for O(m*n) total.

</details>

#### `[SKIM]` 19. Rank Transform of an Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1331

<!-- id:heaps-rank-transform-of-an-array | order:140 | day:13 | pattern:coordinate-compression | template:T-SORT-05 -->

[Solve on LeetCode](https://leetcode.com/problems/rank-transform-of-an-array/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `coordinate-compression`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is coordinate compression, a preprocessing step used constantly in segment-tree and DP problems. Map each distinct value to its position in the sorted order of distinct values.

**Trick.** Copy, sort, unique-erase to get distinct values, then rank each original element with lower_bound. Ranks are 1-indexed here.

**Edge cases that bite.**

- Duplicates must receive the SAME rank, which is why the dedup step matters.
- Empty input returns empty.
- Ranks start at 1, not 0.

**Complexity.** `O(n log n)` time, `O(n)` space — the sort dominates, with an O(log n) lookup per element. A map from value to rank is an equivalent formulation.

**Same pattern.** [Relative Sort Array](https://leetcode.com/problems/relative-sort-array/), [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/), [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/)

**Interview follow-ups.**

- **Q.** Where is coordinate compression actually needed?
  <br>**A.** Whenever values are huge but few - segment trees or Fenwick trees indexed by value, sweep lines over coordinates, and DP keyed on values. It converts a 1e9 range into an n-sized one.
- **Q.** Do it without sorting.
  <br>**A.** Not in better than O(n log n) in general, since producing ranks is equivalent to sorting.

</details>

#### `[SKIM]` 20. Dota2 Senate &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 649

<!-- id:greedy-dota2-senate | order:155 | day:13 | pattern:round-robin-queues | template:T-GREEDY-01 -->

[Solve on LeetCode](https://leetcode.com/problems/dota2-senate/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `round-robin-queues`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each senator should ban the nearest opposing senator who would otherwise act next. Two queues of indices make 'who acts next' explicit, and re-queuing the winner at index + n simulates the next round without rebuilding anything.

**Trick.** Two queues of indices, one per party. Repeatedly pop both fronts; the smaller index wins and is pushed back at index + n. Whichever queue empties first loses.

**Edge cases that bite.**

- The winner must be re-queued at index + n to represent the next round.
- One queue emptying ends the simulation immediately.
- A single senator wins by default.

**Complexity.** `O(n)` time, `O(n)` space — each senator is banned at most once, so the total number of comparisons is bounded by n.

**Same pattern.** [Task Scheduler](https://leetcode.com/problems/task-scheduler/), [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/), [Hand of Straights](https://leetcode.com/problems/hand-of-straights/)

**Interview follow-ups.**

- **Q.** Why ban the nearest opponent?
  <br>**A.** Banning anyone further away leaves a closer opponent free to act first and ban you instead. The nearest is the only one that can hurt you this round.
- **Q.** Three parties instead of two.
  <br>**A.** The greedy breaks down - with three, banning the nearest may help the third party more than yourself. It becomes a game-theory problem.

</details>

### Day 13 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **For the k largest, use a min-heap.** The inversion is deliberate: you repeatedly discard the WORST of your current best k, and a min-heap keeps that at the root for O(log k) eviction.
  <br>↳ *Kth Largest Element in an Array* — a size-k min-heap, versus quickselect at O(n) average; *Kth Largest Element in a Stream* — the same heap, where quickselect is unavailable because there is no array to partition; *The K Weakest Rows in a Matrix* — a size-k heap over (count, index) pairs
- **A bounded value range removes the log factor.** Frequencies are bounded by n, so bucketing by frequency is O(n) where a heap is O(n log k). Same instinct as counting sort, and it recurs constantly.
  <br>↳ *Top K Frequent Elements* — bucket sort by frequency rather than a heap; *Rank Transform of an Array* — coordinate compression, which is the same idea used as preprocessing
- **Two heaps facing inward give order statistics.** A max-heap of the lower half and a min-heap of the upper half put the median at their tops. The push-then-transfer-then-rebalance sequence is what guarantees the ordering invariant.
  <br>↳ *Find Median from Data Stream* — three unconditional operations per insertion, with no case analysis
- **Generate rather than test when candidates thin out.** The nth ugly number cannot be found by testing numbers. Generating the sequence as a merge of itself is O(n), and advancing every pointer that produced the minimum is what avoids duplicates.
  <br>↳ *Ugly Number II* — three pointers, all advanced on a tie; *Super Ugly Number* — the same structure generalised to k primes
- **A closed form can beat a simulation.** Deriving the structure of the optimal schedule gives the answer directly, and explains why the simulation works.
  <br>↳ *Task Scheduler* — (maxFreq - 1) * (n + 1) + countAtMaxFreq, with a max() against the task count
- **Sort by end to schedule, by start to merge.** The earliest-finishing interval leaves the most room, which is why scheduling sorts by end. Merging needs positional adjacency, which is why it sorts by start.
  <br>↳ *Minimum Number of Arrows to Burst Balloons* — sorting by end and firing at each chosen end; *Maximum Length of Pair Chain* — the same schedule, counting the chain rather than the arrows
- **Track a range when a choice is undetermined.** A wildcard makes a single counter insufficient, but the set of reachable counts stays an interval. Carrying lo and hi handles the nondeterminism in one pass.
  <br>↳ *Valid Parenthesis String* — lo clamped at zero, failing when hi goes negative
- **Place the constrained items first.** Positioning the tallest people first makes later insertions invisible to them, so counts stay valid. Ordering the work by who constrains whom is the general pattern.
  <br>↳ *Queue Reconstruction by Height* — sorting by height descending, count ascending, then inserting at the count index
- **A forced first move makes greedy exact.** When the smallest remaining element has no possible predecessor, its group is determined, leaving a strictly smaller instance of the same problem.
  <br>↳ *Hand of Straights* — the smallest card necessarily starting a group; *Split Array into Consecutive Subsequences* — preferring to extend an existing run over starting a new one
- **Sorting can collapse several conditions into one.** With sides sorted, two of the three triangle inequalities hold automatically, leaving a single condition and enabling a two-pointer sweep.
  <br>↳ *Valid Triangle Number* — fixing the largest side and adding r - l valid pairs at once
- **Count direction changes rather than building a subsequence.** Within a monotone run only the final element can extend the alternation, so two counters replace an O(n^2) DP.
  <br>↳ *Wiggle Subsequence* — up = down + 1 on a rise, down = up + 1 on a fall

#### Carried forward

- **arrays** — A read pointer and a write pointer beat a second array; Sortedness turns a search into an adjacency check; Write into free space from the end when merging in place; A running extreme replaces an inner loop; Extend or restart is the whole of Kadane; Decompose a hard rearrangement into reversals; Scan from the right when the answer depends on the suffix; The sort key IS the interval algorithm; Negatives forbid a sliding window; Count subarrays by their right endpoint; exactly(k) = atMost(k) - atMost(k-1); Reuse the input as marker storage for O(1) space; Carry both extremes when a negative can flip them; Start only from the heads of a run; Three-way partition in one pass
- **binary-search** — Compute the midpoint as l + (r - l) / 2; Pick one interval convention and never mix them; Search the answer space when the array is not what is sorted; Getting lo and hi right is where answer-space searches fail; One half of a rotated array is always sorted; Duplicates destroy the logarithmic guarantee; Binary search needs monotonicity, not order; Some 2D problems are 1D in disguise
- **strings** — substr copies, so it is never free; A fixed alphabet means an array, and genuinely O(1) space; A palindrome is defined by its centre, and there are 2n-1 of them; Nesting means a stack, one bracket type means a counter; Prune during construction rather than filtering afterwards; A mapping is not a bijection; The stale maximum in a window can be safe
- **linked-list** — Save the next pointer before you destroy it; A dummy head removes the head special case; Two pointers at different speeds expose structure; Floyd's reset finds the cycle entry; Compose known techniques rather than inventing new ones; Let the structure itself be the map; Equalise two traversals instead of measuring them
- **recursion** — Include or exclude gives 2^n, choose-one-of-many gives n!; Sort, then skip equal siblings to dedupe; `i` versus `i + 1` is the whole reuse question; Prune before recursing, not at the leaf; Mark in place and restore on the way out; 'Count' and 'return all' are different problems; Halve the exponent instead of decrementing it
- **bit-manipulation** — XOR annihilates pairs; x & (x-1) clears the lowest set bit; A forbidden operation points at doubling; INT_MIN has no positive counterpart; Invert the work when testing each item is too slow; A trie can index bits, not just characters
- **stack-queue** — A monotonic stack discards permanently irrelevant elements; Store indices, not values; Count contributions instead of enumerating subarrays; A sentinel drains the stack for you; A monotonic deque beats a heap for window extremes; Amortised is not worst case, and say so; Greedy removal with a monotonic stack
- **sliding-window** — Fixed windows slide, variable windows shrink; Erase zero-count keys or size() lies; The complement is often the easier window; Opposing pointers need a justified move rule; Sort first when the target of a window is its extreme; Greedy earliest match is optimal for subsequences; Bound the branching to keep a check linear
- **greedy** — Exchange arguments are how greedy is justified; Spend the least flexible resource first; Only parity survives a repeated reversible operation; Count pairs, then allow one leftover; Sort by end to schedule, by start to merge; Track a range when a choice is undetermined; Place the constrained items first; A forced first move makes greedy exact; Sorting can collapse several conditions into one; Count direction changes rather than building a subsequence
