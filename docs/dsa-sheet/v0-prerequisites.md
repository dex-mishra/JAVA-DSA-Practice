---
phase: V0
title: Prerequisites
days: 1-3
problems: 20
generated: 2026-09-17
---

# V0 — Prerequisites

**Days 1–3** &nbsp;·&nbsp; **20 problems** &nbsp;·&nbsp; The smallest set that makes trees, graphs and DP tractable: hashing, sorting, recursion, and the array patterns DP is built on.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Time & Space Complexity

[Striver video](https://www.youtube.com/watch?v=FPu9Uld7W-E)

<!-- theory-id:t-complexity -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**Definition.** Time complexity describes how the number of operations an algorithm
performs grows as a function of its input size, n. Space complexity describes the same
for memory. Neither measures seconds or bytes on a particular machine; both describe
the growth curve, which is machine-independent.

**Asymptotic notation.**

- **O(f(n))** — upper bound. The algorithm takes at most this, up to a constant factor.
- **Ω(f(n))** — lower bound. It takes at least this.
- **Θ(f(n))** — tight bound. Both of the above.

In practice "complexity" means O, and lower-order terms and constant factors are
discarded: `3n² + 500n + 9000` is O(n²), because at n = 10⁶ the quadratic term is six
orders of magnitude larger than the rest.

**How to compute it.** Count how many times each statement executes as a function of n.

- Nested loops **multiply**: an n-loop inside an n-loop is O(n²).
- Sequential loops **add**, and the larger dominates: O(n) + O(m) = O(n + m).
- A loop that **halves** its range runs log₂n times. n = 10⁹ gives about 30 iterations.
- A loop where `i *= 2` also runs log n times.
- `for (i = 1; i*i <= n; i++)` runs √n times.
- Recursion costs **(number of calls) × (work per call)**. Naive Fibonacci branches twice
  per call, giving ~2ⁿ calls of O(1) work, so O(2ⁿ). Merge sort has log n levels of O(n)
  work, so O(n log n).

**The common classes, in order.**
O(1) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²) < O(n³) < O(2ⁿ) < O(n!)

**Reference examples.**

```cpp
for (int i = 0; i < n; i++) work();                      // O(n)
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++) work();                  // O(n^2)  (n(n+1)/2 iterations)
for (int i = 1; i < n; i *= 2)
    for (int j = 0; j < n; j++) work();                  // O(n log n)
for (int i = 1; i < n; i *= 2) work();                   // O(log n)
for (int i = 1; i * i <= n; i++) work();                 // O(sqrt n)
int f(int n){ return n<=1 ? n : f(n-1)+f(n-2); }         // O(2^n)
```

**Space complexity.** A fixed number of scalar variables is O(1). A `vector<int>` of
size n is O(n). A 2D DP table of size n×m is O(n·m). Recursion consumes stack space
proportional to its maximum depth, so a recursion of depth n is O(n) auxiliary space
even if it allocates nothing.

**Choosing a target from the constraints.** A judge executes roughly 10⁸ simple
operations per second, with a typical limit of 1-2 seconds.

| n up to | Acceptable complexity | Typical technique |
|---|---|---|
| 10-12 | O(n!) | permutations |
| 20-25 | O(2ⁿ) | subsets, bitmask DP |
| 100 | O(n⁴) | Floyd-Warshall |
| 500 | O(n³) | interval / MCM DP |
| 5,000 | O(n²) | 2D DP |
| 10⁵ | O(n log n) | sort, heap, binary search, monotonic stack |
| 10⁶ | O(n) | single pass, prefix sums, sliding window |
| 10⁹ | O(log n) or O(1) | binary search on the answer, closed-form maths |

Worked example: O(n²) at n = 10⁵ is 10¹⁰ operations, which at 10⁸ ops/second is 100
seconds against a 1-2 second limit. The solution is not marginally slow; it is roughly
fifty times over budget.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Amortised versus worst-case.** These are distinct claims and interviewers separate them.

`vector::push_back` is O(1) *amortised*. The container doubles its capacity when full,
so n insertions cost at most 1 + 2 + 4 + ... + n < 2n element copies in total, giving
O(1) per operation on average. A single insertion that triggers reallocation is O(n).
If a question demands a guaranteed worst-case O(1) insert, the correct answer is that
`vector` does not provide one.

Note the dependence on the growth factor: growing by a **constant** amount rather than a
constant **factor** gives Θ(n²) total copies, not Θ(n).

**Average versus worst case.** `unordered_map` operations are O(1) expected and O(n)
worst case, the latter occurring when all keys hash to one bucket. This is not
hypothetical: C++'s default hash for integers is close to the identity function, so
adversarial input can force the degenerate case. Competitive submissions defend against
this with a hash seeded from a clock value.

**Lower bounds.** Some bounds are provable, not merely observed.

- **Comparison sorting is Ω(n log n).** A comparison-based sort is a decision tree; there
  are n! possible output orderings, so the tree has n! leaves and therefore height at
  least log₂(n!) ≈ n log n − 1.44n. Any comparison sort must make that many comparisons
  in the worst case.
- Counting sort and radix sort achieve O(n + k) because they do not compare elements;
  they index by value. The lower bound does not apply to them.
- **Reading the input is Ω(n)** whenever the answer depends on every element. The
  adversary argument: if the algorithm does not inspect element i, the adversary changes
  it, and the output must change but cannot. Sub-linear algorithms therefore require
  structure — a sorted array, or a precomputed index.

**Master theorem**, for recurrences of the form T(n) = a·T(n/b) + O(n^d):

- if d > log_b(a) → Θ(n^d)
- if d = log_b(a) → Θ(n^d log n)
- if d < log_b(a) → Θ(n^(log_b a))

Merge sort is T(n) = 2T(n/2) + O(n): a = 2, b = 2, d = 1, log₂2 = 1 = d, so Θ(n log n).
Binary search is T(n) = T(n/2) + O(1): a = 1, b = 2, d = 0, log₂1 = 0 = d, so Θ(log n).

**Hidden costs that change the stated complexity.**

- `std::string::substr(i, len)` is O(len); it constructs a new string. A substring
  operation inside two nested loops yields O(n³), not O(n²).
- `vector::insert` and `erase` at any position other than the end are O(n).
- Passing a container by value copies it: O(n) per call. Pass by `const&`.
- `std::map` iteration is O(n) but with poor cache locality, since nodes are scattered;
  `vector` iteration of the same length can be an order of magnitude faster in wall time
  at identical asymptotic complexity.

**Overflow as a correctness issue, not a performance one.** `int` holds up to about
2.1×10⁹. `n*(n-1)/2` at n = 10⁵ is 5×10⁹ and overflows silently, producing a wrong
answer rather than an error. `(l + r) / 2` in binary search overflows when both bounds
are large; `l + (r - l) / 2` does not. This defect existed in Java's standard library
binary search for nine years.

**The grilling chain.**

- *What is the complexity?* — State time and space separately, and define n.
- *Why n log n and not n?* — Because the solution sorts, and comparison sorting is
  Ω(n log n).
- *Can sorting ever be faster?* — Yes, without comparisons: counting or radix sort,
  when keys are bounded integers.
- *Is your hash-based solution really O(n)?* — O(n) expected; O(n²) worst case.
- *You claimed O(1) space but recursed to depth n.* — Then it is O(n) auxiliary space.
  True O(1) requires an iterative formulation.
- *Can you beat O(n)?* — Not when the answer depends on every element, by the adversary
  argument above.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Why constants and lower-order terms are dropped**

Think about the time it takes you to travel from Kharagpur to Delhi. The flight is two
hours; the auto to the airport is twenty minutes. If someone asks how long the journey
takes, you say "about two hours". The auto ride is real, but it does not change the
answer to the question being asked.

Now make the flight a month long. The auto ride has not changed at all, but it now
rounds to nothing. That is what happens to `500n` when `n²` grows — it is still there,
it just stops mattering.

**Why O(log n) is so small**

Take an A4 sheet and tear it in half, then in half again. After about thirty tears you
are down to a single molecule — and you have only torn thirty times.

Halving destroys size at a rate that feels unreasonable. That is the whole of binary
search: a billion-element array is thirty halvings from a single element.

**Amortised cost**

You buy a monthly bus pass for ₹900. On the day you buy it you spent ₹900 on one
journey, which looks terrible. Over thirty journeys, it works out to ₹30 each.

Nobody says your bus fare is ₹900. They say it is ₹30. That is amortised cost — the
expensive day is real, but it is paid for by all the cheap days around it.

**Why recursion costs space even when it allocates nothing**

You are on a phone call. Someone calls, so you put the first person on hold. A third
calls, so you hold the second. Now three conversations are open at once and you are
holding all of them in your head, even though you are only speaking to one.

Every recursive call is a held conversation. Ten thousand of them and you run out of
room to hold any more — that is a stack overflow.

</details>

### C++ STL — containers and algorithms

[Striver video](https://www.youtube.com/watch?v=RRVYpIET_RU)

<!-- theory-id:t-stl -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** The Standard Template Library provides generic containers, iterators and
algorithms. In a DSA context it removes the need to hand-roll a dynamic array, a balanced
tree or a hash table for every problem, and using it is expected rather than discouraged.

**The containers.**

- **`vector<T>`** — dynamic array. Contiguous memory, O(1) indexed access, amortised O(1)
  append at the back. The default choice for a sequence.
- **`deque<T>`** — double-ended queue. O(1) insertion and removal at both ends, O(1)
  indexed access, implemented as a sequence of fixed-size blocks.
- **`list<T>`** — doubly linked list. O(1) insert and erase given an iterator, but O(n)
  access and poor cache behaviour. Rarely the right answer.
- **`set<T>` / `map<K,V>`** — ordered associative containers backed by a red-black tree.
  All operations O(log n). Iteration yields sorted order. Support `lower_bound` and
  `upper_bound` on keys.
- **`multiset` / `multimap`** — as above, but duplicate keys are permitted.
- **`unordered_set` / `unordered_map`** — hash tables. O(1) average for insert, erase and
  lookup; O(n) worst case. No ordering guarantee.
- **`priority_queue<T>`** — binary heap. `top()` is O(1), `push` and `pop` are O(log n).
  Max-heap by default; a min-heap is
  `priority_queue<int, vector<int>, greater<int>>`.
- **`stack<T>` / `queue<T>`** — container adaptors over `deque`, exposing only LIFO or
  FIFO operations.

**Basic usage.**

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> v = {3, 1, 2};
v.push_back(4);                       // {3,1,2,4}
sort(v.begin(), v.end());             // {1,2,3,4}
v.erase(v.begin() + 1);               // {1,3,4}  — O(n)

map<string,int> freq;
freq["apple"]++;                      // absent key is value-initialised to 0, then ++
for (auto &[k, val] : freq) { }       // iterates in sorted key order

unordered_map<int,int> seen;
if (seen.count(x)) { }                // O(1) average membership test

set<int> s = {5, 1, 3};               // stored as {1,3,5}
auto it = s.lower_bound(2);           // → 3.  Use s.lower_bound, not std::lower_bound

priority_queue<int> maxHeap;
priority_queue<int, vector<int>, greater<int>> minHeap;

deque<int> dq;
dq.push_front(1); dq.push_back(2);    // O(1) at both ends
```

**The algorithms worth knowing by heart.**

```cpp
sort(v.begin(), v.end());
sort(v.begin(), v.end(), greater<int>());                 // descending
sort(v.begin(), v.end(), [](auto& a, auto& b){ return a.second < b.second; });
stable_sort(v.begin(), v.end());                          // preserves equal-element order
nth_element(v.begin(), v.begin() + k, v.end());           // k-th element in place, O(n) avg

reverse(v.begin(), v.end());
*max_element(v.begin(), v.end());
accumulate(v.begin(), v.end(), 0LL);                      // note the 0LL
count(v.begin(), v.end(), x);

lower_bound(v.begin(), v.end(), x) - v.begin();           // first index with v[i] >= x
upper_bound(v.begin(), v.end(), x) - v.begin();           // first index with v[i] >  x
v.erase(unique(v.begin(), v.end()), v.end());             // dedupe a SORTED vector
next_permutation(v.begin(), v.end());

__builtin_popcount(x);   __builtin_popcountll(x);   __gcd(a, b);
```

**Building the two most important containers from scratch.** Interviewers ask for these.

```cpp
// Dynamic array — what vector does internally
struct Vec {
    int *a = nullptr; int sz = 0, cap = 0;
    void push_back(int x) {
        if (sz == cap) {
            cap = cap ? cap * 2 : 1;               // geometric growth
            int *b = new int[cap];
            for (int i = 0; i < sz; i++) b[i] = a[i];
            delete[] a; a = b;
        }
        a[sz++] = x;
    }
    int& operator[](int i) { return a[i]; }
};

// Hash map with separate chaining — what unordered_map does internally
struct HashMap {
    static const int B = 100003;                   // prime bucket count
    vector<vector<pair<int,int>>> t{B};
    int h(int k) { return ((k % B) + B) % B; }     // the +B handles negative keys
    void put(int k, int v) {
        for (auto &p : t[h(k)]) if (p.first == k) { p.second = v; return; }
        t[h(k)].push_back({k, v});
    }
    int get(int k) {
        for (auto &p : t[h(k)]) if (p.first == k) return p.second;
        return -1;
    }
};
```

**Complexity summary.**

| Container | Access | Insert | Erase | Search | Ordered | Structure |
|---|---|---|---|---|---|---|
| `vector` | O(1) | O(1)* back, O(n) mid | O(n) | O(n); O(log n) if sorted | insertion | dynamic array |
| `deque` | O(1) | O(1) both ends | O(n) mid | O(n) | insertion | blocked arrays |
| `list` | O(n) | O(1) at iterator | O(1) at iterator | O(n) | insertion | doubly linked list |
| `set` / `map` | — | O(log n) | O(log n) | O(log n) | sorted | red-black tree |
| `unordered_*` | — | O(1) avg, O(n) worst | O(1) avg | O(1) avg | none | hash table |
| `priority_queue` | O(1) top | O(log n) | O(log n) | — | partial | binary heap |
| `stack` / `queue` | O(1) | O(1) | O(1) | — | — | adaptor over `deque` |

\* amortised.

**Selection rule.** Default to `unordered_map` or `unordered_set`. Move to `map` or `set`
when you require sorted iteration, `lower_bound` on keys, or a guaranteed worst case.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why `push_back` is amortised O(1).** Capacity grows by a constant *factor*, so n
appends trigger reallocations at sizes 1, 2, 4, ..., n, copying 1 + 2 + 4 + ... + n < 2n
elements in total. Per operation that is O(1). Growing by a constant *amount* instead
would reallocate every c appends and copy Θ(n²) elements overall. The growth factor is
implementation-defined — typically 2 in libstdc++ and 1.5 in MSVC; 1.5 permits reuse of
previously freed blocks.

**How `set` and `map` maintain O(log n).** They are red-black trees, a self-balancing
BST with five invariants, the operative one being that every root-to-leaf path contains
the same number of black nodes. This bounds the longest path at twice the shortest, so
height is O(log n). Insert and erase restore the invariants with O(1) rotations and
O(log n) recolourings.

**How `unordered_map` degrades.** Elements are distributed into buckets by
`hash(key) % bucket_count`. When many keys land in one bucket, lookup walks a chain and
becomes O(n). This is reachable in practice because libstdc++'s `std::hash<int>` is the
identity function, so an adversary need only supply keys that are multiples of the bucket
count. The standard mitigation is a custom hash mixing in a time-based seed:

```cpp
struct Hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t S =
            chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + S);
    }
};
unordered_map<long long, int, Hash> safe;
```

**Load factor and rehashing.** `max_load_factor()` defaults to 1.0. When
`size() / bucket_count()` exceeds it, the table rehashes: bucket count grows to the next
prime and every element is reinserted. That single insert is O(n); amortised it remains
O(1). `reserve(n)` performs the growth once up front and is free performance on large
inputs.

**Iterator invalidation rules.** These are exam questions and real bug sources.

- `vector`: any reallocation invalidates *all* iterators, pointers and references.
  `insert` and `erase` invalidate everything from the modification point onward.
- `deque`: insertion at either end invalidates all iterators but *not* references to
  existing elements. Insertion in the middle invalidates everything.
- `list`, `set`, `map`: erasing invalidates only the iterator to the erased element.
  Insertion invalidates nothing. This is the property that makes LRU cache implementations
  use `list` plus `unordered_map`.
- `unordered_map`: rehashing invalidates all iterators but not references.

The idiom for erasing while iterating a vector or list is `it = v.erase(it);`, since
`erase` returns the iterator following the removed element.

**Comparator requirements.** A comparator passed to `sort`, `set` or `priority_queue`
must implement a *strict weak ordering*: irreflexive (`comp(a,a)` is false), asymmetric,
transitive, and with transitive equivalence. Returning `<=` violates irreflexivity, which
is undefined behaviour — in libstdc++ this causes `std::sort` to read past the end of the
range and segfault on inputs above the insertion-sort threshold of 16 elements.

Note also that `priority_queue`'s comparator is inverted relative to intuition: passing
`greater<int>` produces a *min*-heap, because the comparator defines what sinks rather
than what rises.

**Costs that are easy to miss.**

- `substr(i, len)` is O(len) and allocates. Inside two nested loops this silently makes an
  apparently O(n²) algorithm O(n³).
- `unordered_map` has no default hash for `std::pair`. Either use `map`, or encode the
  pair as `(long long)a * K + b`.
- `accumulate(v.begin(), v.end(), 0)` deduces `int` from the initial value and overflows;
  `0LL` fixes it.
- `unique` removes only *consecutive* duplicates; it requires a prior sort.
- `multiset::erase(value)` removes every matching element. To remove one, use
  `ms.erase(ms.find(value))`. This is a frequent source of sliding-window corruption.
- `map::operator[]` inserts a default-constructed value when the key is absent, so it
  cannot be used for a read-only membership test and is unavailable on a `const map`.

**The grilling chain.**

- *Why is `push_back` O(1)?* — Amortised, via geometric growth.
- *`map` or `unordered_map` here?* — Answer with the requirement, not a preference:
  sorted iteration or `lower_bound` forces `map`; otherwise `unordered_map`.
- *When does `unordered_map` become O(n), and can you prevent it?* — Bucket collisions;
  prevent with a seeded custom hash.
- *How does `set` stay balanced?* — Red-black invariants and rotations.
- *Implement a hash map; what is your collision strategy?* — Chaining versus open
  addressing, plus load factor and rehashing policy.
- *Find the k largest of a stream of 10⁹ integers.* — A min-heap of size k, O(n log k)
  time and O(k) space. Sorting is not available because the data does not fit in memory.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Why doubling the capacity matters**

You are moving into a hostel room and you keep buying shelves one at a time. Every time
a shelf fills you buy one more shelf and move everything across — which means you are
shifting your whole collection every few books.

Instead, each time you run out you buy as many shelves as you already have. You shift
everything far less often, and by the end the total shifting works out to about twice
your collection, no matter how large it grew.

**What a hash bucket is**

A hostel key board has a hook for every room number. To fetch the key for room 214 you
walk straight to hook 214 — you never search.

Now suppose the board only has 100 hooks for 500 rooms, so rooms 14, 114, 214 all share
hook 14. You still go straight to the hook, but now you flick through a few keys hanging
on it. That short flick is a collision, and it is fine — until every room in the hostel
ends up on the same hook.

**Why `map` is a tree and `unordered_map` is not**

A dictionary is ordered. You can find "serendipity", and you can also answer "what words
come just after it" — the order is part of the value you get.

A cloakroom is not ordered. You hand over a ticket and get your bag back instantly, but
you cannot ask which bag came next. Faster for the one thing it does, useless for
everything else.

**Iterator invalidation**

You are reading a list of names off a page while someone rewrites the page onto a larger
sheet. Your finger is still pointing at where line four *used to be*. The name is fine;
your finger is not.

That is a dangling iterator after a vector reallocates.

</details>

### Sorting algorithms

[Striver: Sorting I](https://www.youtube.com/watch?v=HGk_ypEuS2k) &nbsp;·&nbsp; [Striver: Merge Sort](https://www.youtube.com/watch?v=ogjf7ORKfd8) &nbsp;·&nbsp; [Striver: Quick Sort](https://www.youtube.com/watch?v=WIrA4YexLRQ)

<!-- theory-id:t-sorting -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Sorting arranges elements into a defined order. Its importance in DSA is
mostly indirect: a sorted sequence enables binary search, two-pointer sweeps, greedy
interval algorithms, and O(1) duplicate detection between adjacent elements. Most of the
time you sort not because sorted output is required, but because sorting converts an
O(n²) problem into an O(n log n) one.

**The quadratic algorithms.**

*Selection sort.* Repeatedly select the minimum of the unsorted suffix and swap it into
place. On `[64,25,12,22,11]`: minimum 11 swaps to the front giving `[11,25,12,22,64]`;
then minimum of the remainder, 12, swaps with 25 giving `[11,12,25,22,64]`; and so on.
It performs exactly n(n−1)/2 comparisons regardless of input, but at most n−1 swaps,
which makes it the choice when writes are far more expensive than reads.

*Bubble sort.* Repeatedly compare adjacent pairs and swap when out of order; after pass i
the largest i elements are in final position. With a flag that detects a pass with no
swaps, it is O(n) on already-sorted input.

*Insertion sort.* Maintain a sorted prefix and insert each new element into it by
shifting larger elements right. On `[5,2,4,6,1]`: 2 shifts past 5 giving `[2,5,4,6,1]`;
4 shifts past 5 giving `[2,4,5,6,1]`; and so on. It is O(n) on nearly-sorted input and
has a very small constant factor, so it is genuinely the fastest option for small n —
which is why `std::sort` falls back to it below roughly 16 elements.

**The O(n log n) algorithms.**

*Merge sort.* Divide the array in half, sort each half recursively, then merge the two
sorted halves in linear time. On `[38,27,43,3]`: split to `[38,27]` and `[43,3]`, sort to
`[27,38]` and `[3,43]`, merge to `[3,27,38,43]`. There are log n levels and O(n) work per
level, so O(n log n) in all cases. It is stable and requires O(n) auxiliary space.

*Quick sort.* Choose a pivot and partition the array so that smaller elements precede it
and larger elements follow; the pivot is then in its final position. Recurse on both
sides. Average O(n log n), worst O(n²) when the pivot is consistently extreme — which
occurs on already-sorted input with a first- or last-element pivot. In-place, not stable.

*Heap sort.* Build a max-heap in O(n), then repeatedly swap the root to the end and
sift down. O(n log n) in all cases, O(1) space, not stable.

**Implementations.**

```cpp
// Insertion sort
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) a[j + 1] = a[j--];
        a[j + 1] = key;
    }
}

// Merge sort — stable, guaranteed O(n log n), O(n) auxiliary
void merge(vector<int>& a, int l, int m, int r) {
    vector<int> tmp; tmp.reserve(r - l + 1);
    int i = l, j = m + 1;
    while (i <= m && j <= r) tmp.push_back(a[i] <= a[j] ? a[i++] : a[j++]);
    //                                          ^^ <= is what preserves stability
    while (i <= m) tmp.push_back(a[i++]);
    while (j <= r) tmp.push_back(a[j++]);
    for (int k = l; k <= r; k++) a[k] = tmp[k - l];
}
void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m); mergeSort(a, m + 1, r); merge(a, l, m, r);
}

// Quick sort — Lomuto partition, randomised pivot
int partition(vector<int>& a, int l, int r) {
    swap(a[l + rand() % (r - l + 1)], a[r]);        // randomise to avoid the O(n^2) case
    int pivot = a[r], i = l - 1;
    for (int j = l; j < r; j++)
        if (a[j] < pivot) swap(a[++i], a[j]);
    swap(a[i + 1], a[r]);
    return i + 1;
}
void quickSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int p = partition(a, l, r);
    quickSort(a, l, p - 1); quickSort(a, p + 1, r);
}
```

**Non-comparison sorts.** Counting sort tallies occurrences of each value into an array
indexed by value, then reads it back, achieving O(n + k) for keys in range k. Radix sort
applies a stable counting sort per digit, giving O(d·(n + k)). Both require bounded
integer-like keys.

**Comparison table.**

| Algorithm | Best | Average | Worst | Space | Stable | In-place |
|---|---|---|---|---|---|---|
| Selection | O(n²) | O(n²) | O(n²) | O(1) | no | yes |
| Bubble | O(n)* | O(n²) | O(n²) | O(1) | yes | yes |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | yes | yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | yes | no |
| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) | no | yes |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | no | yes |
| Counting | O(n+k) | O(n+k) | O(n+k) | O(k) | yes | no |

\* with the early-exit flag.

**Stability** means equal elements retain their relative input order. It is what allows
multi-key sorting by sorting on the least significant key first.

**Library usage.** `std::sort` is O(n log n) and not stable; `std::stable_sort` is stable
and may allocate; `std::partial_sort` orders only the first k in O(n log k);
`std::nth_element` places the k-th element correctly in O(n) average.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why comparison sorting cannot beat Ω(n log n).** Model any comparison sort as a decision
tree: internal nodes are comparisons, leaves are output permutations. There are n!
permutations, so the tree has at least n! leaves, and a binary tree with L leaves has
height at least log₂L. Therefore the worst-case number of comparisons is at least
log₂(n!) = n log₂n − n log₂e + O(log n) ≈ n log n. Counting and radix sort evade this by
never comparing elements; they index by value, which is outside the model.

**What `std::sort` actually is.** Introsort — a hybrid of three algorithms:

1. Quick sort with median-of-three pivot selection, until
2. recursion depth exceeds 2⌊log₂n⌋, at which point it switches to heap sort to enforce
   the O(n log n) worst case, and
3. partitions below roughly 16 elements are left unsorted during recursion and finished
   with a single insertion-sort pass over the whole array at the end.

This combination gives quick sort's cache behaviour and constant factor with heap sort's
worst-case guarantee.

**Why quick sort is usually faster than merge sort despite the worse bound.** Quick sort
partitions contiguous memory in place, so it is cache-friendly and performs no allocation;
merge sort writes every element to an auxiliary buffer at every level, roughly doubling
memory traffic. In practice quick sort is two to three times faster on arrays. Merge sort
wins when stability is required, when a hard worst-case guarantee is required, or when
the data is a linked list.

**Partition schemes.** Lomuto uses a single forward scan and is easier to write, but
performs Θ(n²) swaps when all elements are equal. Hoare uses two pointers converging from
both ends, does roughly three times fewer swaps, and handles equal elements gracefully —
but it does not place the pivot at its final index, so the recursion must be
`quickSort(l, p)` and `quickSort(p+1, r)`, not `p-1`. Three-way partitioning (the Dutch
National Flag scheme) is the correct choice when the input has many duplicates, since it
groups all pivot-equal elements and excludes them from both recursive calls.

**Quickselect.** Partitioning solves selection as well as sorting: after a partition, the
pivot's index tells you whether the k-th element lies left, right, or is the pivot itself.
Recursing into only one side gives T(n) = T(n/2) + O(n) = O(n) average. The worst case is
O(n²), removable by the median-of-medians pivot at the cost of a large constant. This is
`std::nth_element`, and it is the correct answer whenever a question asks for the k-th
largest rather than a full ordering.

**Counting the merge.** Because merge sort's combine step compares elements across the two
halves exactly once each, any predicate over cross-half pairs can be counted during the
merge at no asymptotic cost. When `a[i] > a[j]` with i in the left half, all remaining
`m - i + 1` left elements also exceed `a[j]`, giving inversion counting in O(n log n).
Reverse Pairs applies the same idea with a separate counting pass before merging, because
the `2·a[j]` condition is not the same as the merge condition.

**Stability and how to fake it.** Quick sort cannot be made stable in place, because
partitioning swaps non-adjacent elements. The standard workaround is to sort pairs of
(value, original index) and break ties on the index — which costs O(n) extra space, at
which point merge sort is preferable anyway.

**External sorting.** When data exceeds memory, read chunks that fit, sort each in memory,
write the sorted runs to disk, then perform a k-way merge using a min-heap of size k over
the run heads. Total I/O is O(n log_k(n/M)) passes for memory size M. This is how database
engines sort.

**The grilling chain.**

- *Which algorithm does `std::sort` use?* — Introsort; explain all three phases.
- *Merge sort has a better worst case. Why is quick sort the default?* — Cache locality,
  in-place operation, smaller constant.
- *Sort a linked list.* — Merge sort: no random access needed, and relinking gives O(1)
  extra space. Quick sort requires O(n) pivot selection and awkward partitioning.
- *Make quick sort stable.* — Not possible in place; explain the index-tagging workaround
  and why merge sort is then the better answer.
- *Values are bounded by 1000.* — Counting sort, O(n + k). Note that the constraint was
  the hint.
- *Sort 0s, 1s and 2s in one pass and O(1) space.* — Dutch National Flag with three
  pointers. Counting sort takes two passes and is the answer most candidates give.
- *k-th largest element.* — `nth_element` / quickselect at O(n) average, or a size-k heap
  at O(n log k); a full sort is wasteful.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Insertion sort**

It is exactly how you arrange a hand of playing cards. You pick up each new card and
slide it leftwards past the cards that are bigger until it sits in the right place. You
never rearrange the whole hand — only the part you have already picked up.

And if the cards were nearly in order to begin with, each one slides almost nowhere,
which is precisely why insertion sort is O(n) on nearly-sorted data.

**Merge sort**

Two people each take half a stack of answer scripts and sort their own half by roll
number. Then they place both sorted halves side by side and repeatedly take whichever
top script has the smaller number.

Neither person ever looks at the whole pile, and the final combining pass touches each
script exactly once. Splitting is easy; the intelligence is all in the combining.

**Why quick sort collapses on sorted input**

You want to split a queue of people by height, so you pick a reference person and send
the shorter ones left and taller ones right. If you pick someone from the middle, you
get two roughly equal groups and the problem halves.

But if the queue is already arranged shortest to tallest and you always pick the last
person, everyone goes left and nobody goes right. You have removed one person instead of
half the queue — and you now have to do that n times.

**Stability**

A class list is already in alphabetical order. You now sort it by marks. A stable sort
keeps the students who scored the same still alphabetical among themselves; an unstable
one scrambles them.

This is why you can sort by one key and then another to get a combined ordering — but
only if the sort is stable.

</details>

### Hashing — maps, sets and frequency counting

[Striver video](https://www.youtube.com/watch?v=KEs5UyBJ39g)

<!-- theory-id:t-hashing -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** Hashing stores key-value pairs in an array indexed by a function of the
key, so that lookup, insertion and deletion take O(1) expected time. It answers one
question cheaply: *has this key been seen, and what is associated with it?*

Its algorithmic significance is that it removes search from inner loops. Any O(n²)
algorithm whose inner loop is a linear scan for a value is a candidate for reduction to
O(n) by recording elements as they are visited.

**The components.**

- A **hash function** maps a key to an integer in `[0, B)` where B is the bucket count.
- A **collision** occurs when two distinct keys map to the same bucket. Collisions are
  unavoidable, since the key space is larger than the bucket array.
- A **collision resolution strategy** handles them. *Separate chaining* stores a list per
  bucket. *Open addressing* probes subsequent slots until a free one is found.
- The **load factor** is `size / bucket_count`. When it exceeds a threshold the table
  **rehashes**: bucket count grows and every element is reinserted.

**Core patterns.**

```cpp
// Frequency count — the most-used pattern in DSA
unordered_map<int,int> freq;
for (int x : a) freq[x]++;

// Fixed alphabet: an array beats a hash map outright
int cnt[26] = {0};
for (char c : s) cnt[c - 'a']++;

// Seen-before set with early exit
unordered_set<int> seen;
for (int x : a) {
    if (seen.count(x)) return true;
    seen.insert(x);
}

// Grouping by a derived key
unordered_map<string, vector<string>> groups;
for (auto& w : words) {
    string key = w; sort(key.begin(), key.end());
    groups[key].push_back(w);
}

// Prefix sum + hash map — count subarrays summing to k
int countSubarrays(vector<int>& a, int k) {
    unordered_map<long long,int> cnt{{0, 1}};   // the empty prefix, seen once
    long long sum = 0; int res = 0;
    for (int x : a) {
        sum += x;
        res += cnt[sum - k];                    // prefixes leaving a suffix of exactly k
        cnt[sum]++;
    }
    return res;
}
```

The last of these underlies a large family of problems. The `{0, 1}` seed represents the
empty prefix and is required for subarrays beginning at index 0.

**Complexity.**

| Operation | `unordered_map` | `map` |
|---|---|---|
| insert / lookup / erase | O(1) avg, O(n) worst | O(log n) |
| iterate in sorted order | O(n log n), requires sorting | O(n) |
| `lower_bound` on key | unavailable | O(log n) |

Space is O(n) for n distinct keys in both cases, though `unordered_map` carries higher
constant overhead from the bucket array.

**When the key space is small and dense**, neither container is appropriate: an ordinary
array indexed by the key gives O(1) lookup with no hashing overhead, perfect cache
locality, and genuinely O(1) space when the range is a constant such as 26 or 256.

**Recognition cues.**

- "find two elements such that..." → record seen values, query the required complement
- "count occurrences", "most frequent", "top k frequent" → frequency map
- "anagram", "duplicate", "first unique" → frequency array or set
- "count subarrays with sum k" → prefix sum with a map, not a sliding window, because
  negative values destroy the window's monotonicity
- "longest consecutive sequence" → a set, counting runs only from values with no
  predecessor, giving O(n)
- "group by property" → `map<property, vector<item>>`

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Designing a hash function.** A good hash distributes keys uniformly and is cheap to
compute. For strings, the standard choice is a polynomial rolling hash:

```
h(s) = (s[0]·p^(n-1) + s[1]·p^(n-2) + ... + s[n-1]) mod m
```

with p a prime exceeding the alphabet size (31 or 53 for lowercase Latin) and m a large
prime (10⁹+7 or 2⁶¹−1). Two properties matter: it is order-sensitive, so "abc" and "cba"
differ; and it is incrementally updatable, since sliding the window one character right
costs O(1). That second property is what makes Rabin-Karp substring search O(n + m)
expected.

A prime modulus matters because with a composite modulus, keys sharing a factor with it
concentrate into a subset of residues, degrading uniformity.

**Collision probability.** By the birthday bound, inserting n keys into B buckets produces
a collision with probability roughly 1 − e^(−n²/2B). For a single 10⁹+7 modulus and
n = 10⁵ string hashes, collision probability is about 0.5% — small, but exploitable in a
contest. Double hashing with two independent moduli reduces it to negligible.

**Why `unordered_map` is attackable.** libstdc++ implements `std::hash<int>` as the
identity function and selects a prime bucket count B. Supplying keys that are all
multiples of B places every key in bucket 0, turning each operation into a linear walk and
the overall algorithm into O(n²). This is a routine hack on Codeforces. Mitigations: a
custom hash mixing the key with a clock-derived seed (splitmix64 is the usual choice), or
using `map` and accepting the log factor.

**Chaining versus open addressing.**

- *Chaining* degrades gracefully past a load factor of 1, supports deletion trivially, and
  tolerates poor hash functions. Its cost is pointer chasing and poor cache behaviour.
- *Open addressing* keeps everything in one contiguous array, so it is markedly faster
  when the load factor is below about 0.7. Deletion requires tombstone markers, because
  simply clearing a slot breaks the probe chains that pass through it. Linear probing
  suffers primary clustering; quadratic probing and double hashing reduce it.

`std::unordered_map` is required by the standard to use chaining, because the standard
mandates reference stability and bucket iteration — which is also why it is slower than
open-addressing alternatives such as `absl::flat_hash_map`.

**Amortised rehashing.** With doubling growth, total rehash work across n insertions is
O(n), so insertion remains O(1) amortised. A single insertion that triggers rehashing is
O(n); if a worst-case bound per operation is required, incremental resizing must be used,
where each operation migrates a constant number of elements from the old table.

**Prefix sum plus hashing, stated precisely.** Let P(i) be the sum of the first i
elements. A subarray (j, i] sums to k exactly when P(i) − P(j) = k, i.e. P(j) = P(i) − k.
Counting subarrays therefore reduces to counting previously seen prefix values equal to
P(i) − k, which a map answers in O(1). The generalisation is that any *invertible*
aggregate works: XOR (its own inverse) gives "count subarrays with XOR k", and counts
modulo m give "count subarrays divisible by m". Products do not work, because zero has no
inverse.

**Why sliding window fails where this succeeds.** A sliding window requires that extending
the window moves the aggregate monotonically, so shrinking is a valid corrective action.
With non-negative values, extending only increases the sum, so the window technique
applies. With negative values present, extending may decrease the sum, the shrink
condition is no longer well founded, and prefix sums with hashing are required instead.

**The grilling chain.**

- *Is your solution really O(1) lookup?* — O(1) expected; O(n) worst case.
- *Design a hash function for strings.* — Polynomial rolling hash; justify prime base and
  prime modulus.
- *What happens when the table fills?* — Rehash at the load factor threshold; amortised
  O(1).
- *Chaining or open addressing?* — State the trade-off and the deletion problem.
- *Solve Two Sum without hashing.* — Sort plus two pointers: O(n log n) time, O(1) extra
  space. Name the trade explicitly.
- *You have 10⁹ keys and cannot store them. Test membership.* — A Bloom filter: a bit
  array with k independent hash functions, constant space, no false negatives, tunable
  false-positive rate; confirm positives against backing storage.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**What a hash function does**

A hostel mess has 500 students and one register. Checking whether Rahul has eaten means
reading 500 names.

Now give every student a fixed slot on a board by roll number. Rahul is 214, so you look
at slot 214. One glance, no searching, regardless of how many students there are.

The hash function is the rule that turns "Rahul" into "214".

**Collisions and chaining**

The board only has 100 slots, so rooms 14, 114 and 214 all share slot 14. You still go
straight to slot 14 — you just flick through the two or three cards hanging there.

That is a collision, and it is harmless while the stacks stay short. Trouble only starts
if every student in the hostel ends up on the same hook, at which point you are reading
500 names again.

**Load factor and rehashing**

As more students join, every slot's little stack grows and the "one glance" becomes "flick
through six cards". So once the board is roughly full you build a bigger board and
redistribute everyone.

Rebuilding day is genuinely slow. But it happens rarely enough that, spread across all
the ordinary days, the cost per lookup stays flat.

**Prefix sums with a hash map**

You note down your running total spend at the end of every day — not each day's spend,
the total so far.

Now someone asks how many stretches of days cost you exactly ₹500. You do not re-add
anything. At today's total of ₹1,800 you simply ask "on how many earlier days was my
running total ₹1,300?" — because any such day marks the start of a ₹500 stretch ending
today.

The running totals are the prefix sums, and the map is your record of how often each
total has occurred.

</details>

### Basic maths for DSA

[Striver video](https://www.youtube.com/watch?v=1xNbjMdbjug)

<!-- theory-id:t-maths -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A small set of number-theoretic routines that recur constantly: digit
manipulation, divisors, primality, GCD, and modular arithmetic. None are conceptually
hard, but each has a standard efficient form that is expected rather than optional.

**Digit manipulation.** Two operations cover it: `n % 10` reads the last digit, `n /= 10`
removes it.

```cpp
int countDigits(int n) { int c = 0; while (n) { c++; n /= 10; } return c; }
// or, in closed form: floor(log10(n)) + 1

int reverseNumber(int n) {
    int rev = 0;
    while (n) { rev = rev * 10 + n % 10; n /= 10; }   // overflow risk — see Part 2
    return rev;
}

int sumOfDigits(int n) { int s = 0; while (n) { s += n % 10; n /= 10; } return s; }
```

Replacing 10 with b performs the same operations in base b.

**Divisors.** A naive scan to n is O(n), but divisors pair up: if d divides n then so
does n/d, and one of the pair is at most √n. Iterating to √n therefore finds all of them.

```cpp
vector<int> divisors(int n) {
    vector<int> d;
    for (int i = 1; (long long)i * i <= n; i++)
        if (n % i == 0) {
            d.push_back(i);
            if (i != n / i) d.push_back(n / i);       // guard against perfect squares
        }
    return d;                                          // O(sqrt n)
}
```

**Primality.** The same √n bound applies: a composite n must have a factor at most √n.

```cpp
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; (long long)i * i <= n; i++)
        if (n % i == 0) return false;
    return true;                                       // O(sqrt n)
}
```

**Sieve of Eratosthenes.** For all primes up to n, repeated √n tests cost O(n√n). The
sieve marks multiples instead and costs O(n log log n).

```cpp
vector<bool> sieve(int n) {
    vector<bool> p(n + 1, true);
    p[0] = p[1] = false;
    for (int i = 2; (long long)i * i <= n; i++)
        if (p[i])
            for (long long j = (long long)i * i; j <= n; j += i)   // start at i*i
                p[j] = false;
    return p;
}
```

Starting the inner loop at i² rather than 2i is correct because every smaller multiple of
i has a factor below i and was already marked.

**GCD and the Euclidean algorithm.** gcd(a, b) = gcd(b, a mod b), terminating when b = 0.

```cpp
int gcd(int a, int b) { return b ? gcd(b, a % b) : a; }
int lcm(int a, int b) { return a / gcd(a, b) * b; }     // divide first to avoid overflow
```

It runs in O(log min(a, b)); `__gcd(a, b)` is the library version.

**Fast exponentiation.** Computing aⁿ by repeated multiplication is O(n). Binary
exponentiation squares the base and halves the exponent, giving O(log n).

```cpp
long long power(long long a, long long n, long long mod) {
    long long res = 1; a %= mod;
    while (n > 0) {
        if (n & 1) res = res * a % mod;
        a = a * a % mod;
        n >>= 1;
    }
    return res;
}
```

**Modular arithmetic.** Addition and multiplication distribute over the modulus:
`(a + b) % m == ((a % m) + (b % m)) % m`, and likewise for multiplication. Division does
not; it requires a modular inverse.

**Common identities.**

- Sum of the first n integers: n(n+1)/2
- Sum of the first n squares: n(n+1)(2n+1)/6
- Number of trailing zeros in n!: ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ... (count factors of 5)
- Digital root of n: 1 + (n − 1) mod 9 for n > 0 — a closed form for repeated digit sums

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Overflow is the dominant failure mode here.** `int` holds up to 2,147,483,647.

- `i * i <= n` overflows when i approaches 46,341. Cast to `long long` or write
  `i <= n / i`.
- Reversing an integer can exceed the range even when the input does not: reversing
  1,534,236,469 gives 9,646,324,351. Detect it before the final multiply with
  `if (rev > INT_MAX / 10 || (rev == INT_MAX / 10 && digit > 7)) return 0;`
- `lcm` as `a * b / gcd(a, b)` overflows; `a / gcd(a, b) * b` does not, and is exact
  because the gcd divides a.
- `INT_MIN` has no positive counterpart, so `abs(INT_MIN)` is undefined behaviour. This
  affects Reverse Integer and Divide Two Integers, where the standard fix is to work in
  `long long` or to operate entirely in the negative domain.

**Why the √n bound is correct for divisors and primality.** If n = a·b with both a > √n
and b > √n, then a·b > n, a contradiction. So every factorisation has a member at most
√n, and finding none proves primality.

**Sieve complexity.** The inner loop runs n/p times for each prime p ≤ n, so total work is
n·Σ(1/p) over primes p ≤ n. By Mertens' theorem that sum is ln ln n + M, giving
O(n log log n) — very nearly linear. A linear O(n) sieve exists (each composite is marked
exactly once by its smallest prime factor) and additionally yields the smallest prime
factor of every number, which makes subsequent factorisations O(log n) each.

**Euclidean algorithm complexity.** The worst case is consecutive Fibonacci numbers, where
each step reduces the pair by roughly the golden ratio; the number of steps is
O(log_φ(min(a,b))) ≈ 4.78·log₁₀(min(a,b)). This is Lamé's theorem.

**Extended Euclid and modular inverse.** The extended algorithm returns x and y with
ax + by = gcd(a, b). When gcd(a, m) = 1 this gives ax ≡ 1 (mod m), so x is the modular
inverse of a. It exists only when a and m are coprime.

When m is prime, Fermat's little theorem gives a simpler route: a^(m−1) ≡ 1 (mod m), so
a⁻¹ ≡ a^(m−2) (mod m), computable with binary exponentiation in O(log m). This is the
standard method with m = 10⁹+7, and it is why that modulus is chosen — it is prime, it
fits in 32 bits, and its square fits in 64.

**Why answers are requested modulo 10⁹+7.** Counting problems produce results far beyond
any integer type. The modulus keeps arithmetic bounded while preserving the ability to
verify correctness. Its appearance in a statement is a reliable signal that the problem is
counting or combinatorial rather than constructive.

**Trailing zeros in n!.** A trailing zero comes from a factor of 10 = 2 × 5. Factors of 2
are strictly more plentiful than factors of 5, so the count of 5s is binding. Multiples of
25 contribute two 5s, of 125 three, and so on — hence the sum of ⌊n/5^i⌋. Legendre's
formula generalises this to any prime.

**Factorisation by trial division** is O(√n) and adequate for n ≤ 10¹². Beyond that,
Pollard's rho gives O(n^(1/4)) expected. For primality testing on large n, Miller-Rabin is
deterministic below 3.3×10²⁴ with a fixed set of bases.

**The grilling chain.**

- *Why is checking to √n sufficient for primality?* — The factor-pair argument.
- *What is the sieve's complexity, and why is it not O(n log n)?* — n·Σ(1/p) over primes,
  which is O(n log log n) by Mertens.
- *Why start the sieve's inner loop at i²?* — Smaller multiples already carry a factor
  below i.
- *Reverse an integer and handle overflow.* — Check before the multiply, or use
  `long long`; mention that `INT_MIN` has no positive counterpart.
- *Compute a^b mod m for b = 10¹⁸.* — Binary exponentiation, O(log b).
- *Divide two integers without using division.* — Repeated subtraction of
  doubling multiples: shift the divisor left while it fits, subtract, accumulate. O(log n).
- *Compute nCr mod p for large n.* — Precompute factorials and inverse factorials via
  Fermat's little theorem; each query is then O(1).

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**Why you only need to check up to the square root**

To find every way of arranging 36 chairs into a rectangle, you try 1×36, 2×18, 3×12,
4×9, 6×6 — and then stop. Carrying on gives 9×4, 12×3, 18×2: the same rectangles rotated.

Every arrangement has a shorter side and a longer side, and the shorter side can never
exceed 6. So checking to 6 finds all of them.

**The Sieve of Eratosthenes**

Line up every number from 2 to 100. Circle 2, then cross out every second number after
it. Circle 3, cross out every third. Move to the next uncrossed number and repeat.

You never test whether anything is prime. Whatever survives the crossing-out is prime by
virtue of having survived — which is why it beats testing each number individually.

**Binary exponentiation**

To fold a sheet of paper a thousand times, you would not fold it once, a thousand times
over. You fold it once to get two layers, again to get four, again to get eight. Ten
folds and you have a thousand layers.

Squaring does to multiplication what folding does to layers: each step doubles your
progress, so a thousand steps collapse to about ten.

**Why trailing zeros in n! are counted by fives**

Every trailing zero needs a pair — one 2 and one 5 — the way every pair of shoes needs a
left and a right.

In a factorial the 2s vastly outnumber the 5s: every second number contributes a 2, only
every fifth contributes a 5. So the 5s run out first, and the number of complete pairs is
simply the number of 5s.

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

## Problems

### Day 1

*7 problems — 7 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Majority Element &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 169

<!-- id:hashing-majority-element | order:1 | day:1 | pattern:boyer-moore-voting | template:T-ARR-01 -->

[Solve on LeetCode](https://leetcode.com/problems/majority-element/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/find-the-majority-element-that-occurs-more-than-n-2-times/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nP_ns3uSh80)

**Asked by:** Amazon, Google, Adobe, Zenefits &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `boyer-moore-voting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting with a map is the obvious O(n)/O(n) answer. The interesting version is O(1) space, and it rests on a counting argument: if one value occupies more than half the array, then pairing off each occurrence of it against one occurrence of anything else must leave some of it unpaired.

**Trick.** Boyer-Moore voting. Hold a candidate and a counter. Matching the candidate increments; differing decrements; hitting zero replaces the candidate. The survivor is the majority element — if one exists.

**Edge cases that bite.**

- The algorithm returns garbage when no majority exists. Verify with a second pass whenever the guarantee is not given.
- Single element — returned immediately, counter never drops.
- Exactly n/2 occurrences is NOT a majority under the strict definition.

**Complexity.** `O(n)` time, `O(1)` space — one pass holding two scalars. Sorting and taking a[n/2] also works and is O(n log n) time, O(1) space — correct but slower, and worth naming as the middle option.

**Same pattern.** [Majority Element II](https://leetcode.com/problems/majority-element-ii/), [Single Number](https://leetcode.com/problems/single-number/), [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/), [Sort Colors](https://leetcode.com/problems/sort-colors/)

**Interview follow-ups.**

- **Q.** Why does the voting actually work?
  <br>**A.** Each decrement pairs one majority occurrence with one non-majority occurrence. Since majority count > n/2, there are not enough other elements to cancel it out, so at least one occurrence survives to the end as the candidate.
- **Q.** Find all elements appearing more than n/3 times.
  <br>**A.** At most two can exist. Run two candidates and two counters simultaneously, then verify both with a second pass. Generalises to n/k with k-1 candidates.
- **Q.** The array is sorted. Can you beat O(n)?
  <br>**A.** Yes. a[n/2] is necessarily the majority element if one exists, so it is O(1) after a single index lookup — and binary searching its first and last occurrence verifies it in O(log n).

</details>

#### `[CORE]` 2. Single Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 136

<!-- id:hashing-single-number | order:2 | day:1 | pattern:xor-cancellation | template:T-BIT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/single-number/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/arrays/find-the-number-that-appears-once-and-the-other-numbers-twice/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=bYWLJb3vCWY&t=1369)

**Asked by:** Amazon, Google, Airbnb, Palantir &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `xor-cancellation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A hash map solves this in O(n) time and O(n) space, and that answer is rejected. The constraint 'constant extra space' is the entire problem, and it is pointing at XOR, whose two properties — x^x = 0 and x^0 = x — make duplicates annihilate each other regardless of order.

**Trick.** XOR the whole array. Every value appearing twice cancels to 0, leaving only the unique element. Order is irrelevant because XOR is commutative and associative.

**Edge cases that bite.**

- Single-element array returns that element — the XOR identity handles it.
- Negative numbers work: XOR operates on the bit pattern, not the value.
- This breaks the moment duplicates appear three times — that is Single Number II, which needs bit-counting mod 3 instead.

**Complexity.** `O(n)` time, `O(1)` space — one pass, one accumulator register. The hash-map solution is also O(n) time but O(n) space, which is precisely what the problem forbids.

**Same pattern.** [Single Number II](https://leetcode.com/problems/single-number-ii/), [Single Number III](https://leetcode.com/problems/single-number-iii/), [Missing Number](https://leetcode.com/problems/missing-number/), [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/)

**Interview follow-ups.**

- **Q.** Every element appears three times except one. Now what?
  <br>**A.** XOR no longer cancels. Count set bits at each of the 32 positions across all numbers; positions where the count is not divisible by 3 belong to the unique element. O(32n) time, O(1) space.
- **Q.** Two elements appear once, the rest twice.
  <br>**A.** XOR everything to get a^b. Any set bit in that result is a position where a and b differ — pick the lowest with `x & -x`, partition the array on it, and XOR each half separately.
- **Q.** Same question but find the missing number in 0..n.
  <br>**A.** XOR all indices with all values. Everything present cancels and the missing value survives. Same trick, different framing.

</details>

#### `[CORE]` 3. Two Sum &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1

<!-- id:hashing-two-sum | order:3 | day:1 | pattern:hash-complement | template:T-HASH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/two-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=UXDSeD9mN-k)

**Asked by:** Amazon, Google, Microsoft, Adobe, Apple &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `hash-complement`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You are not looking for *pairs*. You are looking for one number at a time and asking 'has my partner already walked past me?' That reframing is the whole problem - it turns a two-dimensional search into a one-dimensional walk.

**Trick.** Store what you have SEEN, look up what you NEED. Check `target - x` in the map BEFORE inserting `x`, otherwise an element pairs with itself when target = 2x.

**Edge cases that bite.**

- Duplicate values - `[3,3]`, target 6. Checking before inserting handles it.
- Negative numbers work fine; the complement is just arithmetic.
- Exactly one valid answer is guaranteed here. Do not rely on that in variants.

**Complexity.** `O(n)` time, `O(n)` space — one pass, one O(1) average lookup per element. Space is the map holding up to n keys. The brute force is O(n^2) time and O(1) space - this is the classic trade.

**Same pattern.** [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/), [3Sum](https://leetcode.com/problems/3sum/), [4Sum](https://leetcode.com/problems/4sum/), [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)

**Interview follow-ups.**

- **Q.** Now the array is sorted. Can you do it in O(1) space?
  <br>**A.** Two pointers from both ends. Sum too small, move left up; too big, move right down. O(n) time, O(1) space - strictly better than hashing when sorted.
- **Q.** Return all unique pairs, not just one.
  <br>**A.** Sort plus two pointers, skipping duplicates on both sides after each hit. Hashing gets messy for uniqueness; sorting makes dedup trivial.
- **Q.** What if the array is a stream you cannot store?
  <br>**A.** You cannot, in general - the pair may span the whole stream. If the range of values is bounded you can keep a fixed-size seen-array instead.

</details>

#### `[CORE]` 4. Sort an Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 912

<!-- id:sorting-sort-an-array | order:4 | day:1 | pattern:merge-sort | template:T-SORT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-an-array/)

**Asked by:** Microsoft, Amazon, Bloomberg &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `merge-sort`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** LeetCode blocks `std::sort` here on purpose. This problem exists so you write merge sort or quick sort from memory, once, properly - and then reuse the merge step for Count Inversions and Reverse Pairs, which are otherwise hard.

**Trick.** Write merge sort, not quick sort. The test data includes adversarial input that drives naive quick sort to O(n^2) and times you out. If you insist on quick sort, randomise the pivot.

**Edge cases that bite.**

- Single element or empty - the `if (l >= r) return;` guard handles both.
- All elements identical - fine for merge sort, worst case for Lomuto partition.
- Negative numbers - no special handling, but it kills counting-sort shortcuts.

**Complexity.** `O(n log n)` time, `O(n)` space — log n levels of recursion, O(n) merging at each level. Space is the temporary buffer plus O(log n) stack. Quick sort would be O(log n) space but risks O(n^2) time.

**Same pattern.** [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/), [Sort List](https://leetcode.com/problems/sort-list/), [Reverse Pairs](https://leetcode.com/problems/reverse-pairs/), [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)

**Interview follow-ups.**

- **Q.** Your merge sort uses O(n) space. Make it O(1).
  <br>**A.** In-place merge exists but is O(n log^2 n) and genuinely fiddly. The honest answer is heap sort: O(n log n) time, O(1) space, at the cost of stability and cache locality.
- **Q.** Same problem, but it is a linked list.
  <br>**A.** Merge sort is strictly the right answer - no random access needed, and you relink rather than copy, so it is O(1) extra space. Quick sort on a list is painful.
- **Q.** Values are all between 0 and 1000.
  <br>**A.** Counting sort. O(n + k) beats O(n log n) outright. Notice the constraint gave this away - that is the habit to build.

</details>

#### `[CORE]` 5. Sort the Matrix Diagonally &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1329

<!-- id:sorting-sort-the-matrix-diagonally | order:5 | day:1 | pattern:group-by-invariant | template:T-SORT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-the-matrix-diagonally/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `group-by-invariant`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Every cell on the same diagonal shares the value `i - j`. Once you notice that, the problem stops being about matrices and becomes 'group by a key, sort each group, write it back' — a pattern you will reuse constantly.

**Trick.** Bucket cells into `map<int, vector<int>>` keyed on `i - j`, sort each bucket, then walk the matrix again popping values back in order. The invariant does all the work.

**Edge cases that bite.**

- `i - j` is negative for cells above the main diagonal — a map handles it, a plain array needs an offset of `+ n`.
- Single row or single column — every diagonal has length 1 and nothing changes.
- Write-back must traverse in the same direction as the read, or the sorted order reverses.

**Complexity.** `O(m·n·log(min(m,n)))` time, `O(m·n)` space — every cell is visited twice and each diagonal of length d costs O(d log d) to sort; diagonals are bounded by min(m,n). Space holds all cells across the buckets.

**Same pattern.** [Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/), [Transpose Matrix](https://leetcode.com/problems/transpose-matrix/), [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/), [Group Anagrams](https://leetcode.com/problems/group-anagrams/)

**Interview follow-ups.**

- **Q.** Use a priority queue per diagonal instead.
  <br>**A.** Push during the first traversal, pop during the second. Same complexity, but it fuses the sort into the traversal and avoids materialising the vectors.
- **Q.** Sort anti-diagonals instead.
  <br>**A.** The invariant becomes `i + j` rather than `i - j`. Nothing else changes, which is the point — the algorithm was never about diagonals, it was about the key.

</details>

#### `[CORE]` 6. Factorial Trailing Zeroes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 172

<!-- id:math-factorial-trailing-zeroes | order:6 | day:1 | pattern:prime-factor-counting | template:T-MATH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/factorial-trailing-zeroes/)

**Asked by:** Amazon, Bloomberg, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `prime-factor-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Computing n! and counting zeros is impossible past n = 20 — the value overflows everything. The problem is asking you to count a specific prime factor without ever constructing the number, which is a habit worth far more than this problem.

**Trick.** A trailing zero needs a factor of 10 = 2 x 5. Factors of 2 are strictly more plentiful, so the count of 5s is binding. Answer is n/5 + n/25 + n/125 + ..., each term counting numbers contributing an additional 5.

**Edge cases that bite.**

- n = 0 gives 0, since 0! = 1.
- Use `n /= 5` in a loop rather than `pow(5, i)`, which overflows and introduces floating-point error.
- Integer division is doing the flooring — do not add rounding.

**Complexity.** `O(log₅ n)` time, `O(1)` space — the loop divides n by 5 each iteration, so it runs about log₅n times. For n = 10⁹ that is 13 iterations.

**Same pattern.** [Count Primes](https://leetcode.com/problems/count-primes/), [Ugly Number](https://leetcode.com/problems/ugly-number/), [Add Digits](https://leetcode.com/problems/add-digits/), [Nth Digit](https://leetcode.com/problems/nth-digit/)

**Interview follow-ups.**

- **Q.** Why are there always more 2s than 5s?
  <br>**A.** Every second integer contributes a 2 but only every fifth contributes a 5, so the count of 2s exceeds the count of 5s for all n >= 1. The pairs are therefore limited by the 5s.
- **Q.** Trailing zeros of n! in base 12.
  <br>**A.** 12 = 2² x 3. Count factors of 2 and of 3 by Legendre's formula, then the answer is min(count₂ / 2, count₃). The generalisation is what is being tested.
- **Q.** Find the smallest n whose factorial has exactly k trailing zeros.
  <br>**A.** The zero count is monotonic in n, so binary search on n. Note that some k have no solution, because the count jumps by more than one at multiples of 25.

</details>

#### `[CORE]` 7. Happy Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 202

<!-- id:math-happy-number | order:7 | day:1 | pattern:cycle-detection | template:T-MATH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/happy-number/)

**Asked by:** Google, Uber, Airbnb &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `cycle-detection`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This looks like a maths problem and is actually a **linked list** problem in disguise. Each number points to exactly one successor, so you are walking a chain. It either reaches 1 or loops forever - and 'detect a loop' has a known answer.

**Trick.** Floyd's tortoise and hare. Slow advances one step, fast advances two. If they meet, there is a cycle and the answer is false. O(1) space, versus a hash set's O(log n). Recognising the disguise is the whole skill here.

**Edge cases that bite.**

- n = 1 is happy by definition - handle before entering the loop.
- Single-digit numbers other than 1 and 7 all fall into the same 4-16-37... cycle.
- The chain is guaranteed finite: any number above 999 shrinks, so values are bounded.

**Complexity.** `O(log n)` time, `O(1)` space — digit-sum collapses large numbers fast - anything above 999 drops below itself, so the walk is short and bounded. Floyd's uses two pointers and nothing else.

**Same pattern.** [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/), [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/), [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/), [Add Digits](https://leetcode.com/problems/add-digits/)

**Interview follow-ups.**

- **Q.** Why does this terminate at all?
  <br>**A.** For any n with d digits, the max digit-square-sum is 81d, which is smaller than n once d >= 4. So every number eventually falls below 1000, and there are finitely many states below 1000 - so it must cycle or hit 1.
- **Q.** Find the length of the cycle.
  <br>**A.** After the pointers meet, hold one still and advance the other until they meet again, counting steps. Same trick as LC 142.
- **Q.** Where else have you seen a value-points-to-value chain?
  <br>**A.** LC 287, Find the Duplicate Number. Recognising that an array of values in [1,n] IS a linked list is the single highest-leverage disguise in all of DSA.

</details>

### Day 1 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Store what you have seen, look up what you need.** A nested loop whose inner loop is a search can almost always be collapsed by recording elements as you pass them and querying that record in O(1). This is the single most common route from O(n^2) to O(n).
  <br>↳ *Two Sum* — keeping a map of value→index and querying `target - x` on arrival
- **Query before you insert.** When an element could pair with itself, the order of query and insert decides correctness. Querying first makes self-pairing impossible without a special case.
  <br>↳ *Two Sum* — checking `target - x` before storing `x`, so `[3,3]` with target 6 still works and `x` never matches itself
- **The merge step is reusable, so learn it properly once.** Merge sort's combine phase walks two sorted halves with two pointers. Any quantity that can be counted while those pointers move - inversions, qualifying pairs - comes free, which is how several otherwise-hard problems are solved.
  <br>↳ *Sort an Array* — the `merge` routine itself, written from scratch because `std::sort` is disallowed here
- **Naive quicksort dies on sorted input.** Choosing the first or last element as pivot degrades to O(n^2) precisely when the array is already sorted or reverse-sorted, which is a common test case. Randomising the pivot or taking a median-of-three removes the failure mode.
  <br>↳ *Sort an Array* — why merge sort is the safe submission here, and why `std::sort` uses introsort rather than plain quicksort
- **`n % 10` reads a digit, `n /= 10` advances.** Those two operations are the whole of digit manipulation. Any problem that forbids string conversion is asking you to use them, and the same pair works in any base once 10 is replaced by that base.
  <br>↳ *Happy Number* — extracting each digit to square and sum it
- **A value that maps to exactly one successor is a linked list.** If every state has exactly one next state, you are walking a chain, so it either terminates or cycles - and cycle detection has a known O(1)-space answer in Floyd's tortoise and hare. Recognising this disguise is worth more than the algorithm.
  <br>↳ *Happy Number* — treating digit-square-sum as the next pointer and running slow/fast pointers instead of storing a seen-set
- **A forbidden data structure is a hint, not an obstacle.** When a problem bans extra space, it is naming the technique it wants. Constant-space constraints on counting problems point at XOR, at voting arguments, or at arithmetic identities - never at a cleverer hash map.
  <br>↳ *Single Number* — the O(1) space requirement ruling out the map and forcing XOR, where x^x = 0 makes duplicates annihilate; *Majority Element* — the same constraint forcing Boyer-Moore voting instead of a frequency map
- **Group by an invariant, then solve each group.** When elements fall into classes defined by a shared computed value, bucket them on that value and the problem reduces to solving one small independent instance per bucket.
  <br>↳ *Sort the Matrix Diagonally* — every cell on a diagonal sharing `i - j`, so the matrix becomes a map of independent lists to sort
- **Count a factor without constructing the number.** Large values need not be built to be analysed. Counting occurrences of a prime across a range, or dividing out permitted factors, answers questions about numbers far beyond any integer type.
  <br>↳ *Factorial Trailing Zeroes* — summing n/5 + n/25 + n/125 rather than computing n!
- **Floyd's reset finds the cycle entry.** After the pointers meet, moving one back to the head and advancing both at equal speed brings them together exactly at the entry. The proof turns on the tail length k and the cycle length c.
  <br>↳ *Happy Number* — the same structure applied to a value-to-value chain rather than nodes

### Day 2

*7 problems — 7 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Reverse Integer &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 7

<!-- id:math-reverse-integer | order:8 | day:2 | pattern:digit-reversal | template:T-MATH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/reverse-integer/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/maths/reverse-digits-of-a-number) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=1xNbjMdbjug&t=930)

**Asked by:** Amazon, Apple, Bloomberg, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `digit-reversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The reversal itself is four lines. The problem is entirely about overflow: the result may exceed the 32-bit range even though the input never does, and you are forbidden from using a 64-bit type to detect it. So the check must happen BEFORE the multiply.

**Trick.** Before `rev = rev * 10 + d`, test whether `rev > INT_MAX / 10`, or `rev == INT_MAX / 10` with `d > 7`. Same on the negative side with INT_MIN and 8. Checking after the fact is already undefined behaviour.

**Edge cases that bite.**

- 1534236469 reverses to 9646324351, which overflows — the canonical failing test.
- Trailing zeros vanish: 120 becomes 21, which is correct.
- INT_MIN has no positive counterpart, so negating it is undefined. Work in the negative domain or use long long internally if permitted.
- 0 reverses to 0.

**Complexity.** `O(log n)` time, `O(1)` space — one operation per digit, and a 32-bit integer has at most 10 of them. No storage beyond two scalars.

**Same pattern.** [Palindrome Number](https://leetcode.com/problems/palindrome-number/), [Add Digits](https://leetcode.com/problems/add-digits/), [Nth Digit](https://leetcode.com/problems/nth-digit/), [Divide Two Integers](https://leetcode.com/problems/divide-two-integers/)

**Interview follow-ups.**

- **Q.** Why 7 and 8 specifically?
  <br>**A.** INT_MAX is 2147483647, whose last digit is 7; INT_MIN is -2147483648, ending in 8. When rev already equals INT_MAX/10, only a final digit at or below that last digit keeps the result in range.
- **Q.** Reverse the bits instead of the digits.
  <br>**A.** LC 190. Shift out of the source and into the result 32 times. Same shape, base 2 instead of base 10 — which is the general lesson about digit extraction.
- **Q.** Detect overflow without any comparison at all.
  <br>**A.** Reverse back and check for equality: if `newRev / 10 != rev` then the multiply overflowed. Elegant, though it relies on well-defined wraparound that C++ does not guarantee for signed types.

</details>

#### `[CORE]` 2. Combination Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 39

<!-- id:recursion-combination-sum | order:9 | day:2 | pattern:unbounded-combination | template:T-BT-03 -->

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

#### `[CORE]` 3. Combination Sum II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 40

<!-- id:recursion-combination-sum-ii | order:10 | day:2 | pattern:bounded-combination-dedup | template:T-BT-03 -->

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

#### `[CORE]` 4. N-Queens &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 51

<!-- id:recursion-n-queens | order:11 | day:2 | pattern:constraint-backtracking | template:T-BT-05 -->

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

#### `[CORE]` 5. Permutations &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 46

<!-- id:recursion-permutations | order:12 | day:2 | pattern:swap-permutation | template:T-BT-02 -->

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

#### `[CORE]` 6. Subsets &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 78

<!-- id:recursion-subsets | order:13 | day:2 | pattern:include-exclude | template:T-BT-01 -->

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

#### `[CORE]` 7. Subsets II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 90

<!-- id:recursion-subsets-ii | order:14 | day:2 | pattern:include-exclude-dedup | template:T-BT-01 -->

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

### Day 2 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Check overflow before the operation, not after.** Once a signed multiply has overflowed the behaviour is undefined, so the result cannot be inspected to detect it. The test must be a division or comparison performed on the operands beforehand.
  <br>↳ *Reverse Integer* — testing `rev > INT_MAX / 10` before `rev = rev * 10 + d`, with the digit-7 and digit-8 boundary cases
- **Include or exclude gives 2^n, choose-one-of-many gives n!.** The shape of the choice at each level determines the complexity class. Recognising which you are in tells you the bound before you write a line.
  <br>↳ *Subsets* — two branches per index, giving 2^n leaves; *Permutations* — n choices at the first level, n-1 at the next, giving n!
- **Sort, then skip equal siblings to dedupe.** Equal values at the same recursion level generate identical subtrees. Skipping them with `i > start && a[i] == a[i-1]` removes duplicates without a set. The condition is i > start, not i > 0, because equal values may legitimately appear along a single path.
  <br>↳ *Subsets II* — the sibling skip after sorting; *Combination Sum II* — the same skip, combined with i + 1 to forbid reuse
- **`i` versus `i + 1` is the whole reuse question.** Passing the current index permits an element to be used again; passing the next forbids it. One character separates two otherwise identical problems.
  <br>↳ *Combination Sum* — recursing with i, since candidates may be reused; *Combination Sum II* — recursing with i + 1, since each element is used at most once
- **Prune before recursing, not at the leaf.** Validity checks placed before the recursive call eliminate entire subtrees. Sorting often enables an even stronger `break`, which is frequently the difference between accepting and timing out.
  <br>↳ *Combination Sum* — breaking as soon as a[i] > target, which requires the sorted input; *N-Queens* — three marker arrays making the conflict test O(1) instead of an O(n) board scan

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; A forbidden data structure is a hint, not an obstacle
- **sorting** — The merge step is reusable, so learn it properly once; Naive quicksort dies on sorted input; Group by an invariant, then solve each group
- **math** — `n % 10` reads a digit, `n /= 10` advances; A value that maps to exactly one successor is a linked list; Check overflow before the operation, not after; Count a factor without constructing the number

### Day 3

*6 problems — 6 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Word Search &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 79

<!-- id:recursion-word-search | order:15 | day:3 | pattern:grid-backtracking | template:T-BT-04 -->

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

#### `[CORE]` 2. Best Time to Buy and Sell Stock &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 121

<!-- id:arrays-best-time-to-buy-and-sell-stock | order:16 | day:3 | pattern:running-minimum | template:T-DP-05 -->

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

#### `[CORE]` 3. Maximum Subarray &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 53

<!-- id:arrays-maximum-subarray | order:17 | day:3 | pattern:kadane | template:T-DP-01 -->

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

#### `[CORE]` 4. Merge Sorted Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 88

<!-- id:arrays-merge-sorted-array | order:18 | day:3 | pattern:merge-from-back | template:T-SORT-01 -->

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

#### `[CORE]` 5. Remove Duplicates from Sorted Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 26

<!-- id:arrays-remove-duplicates-from-sorted-array | order:19 | day:3 | pattern:two-pointer-write | template:T-SORT-02 -->

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

#### `[CORE]` 6. Subarray Sum Equals K &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 560

<!-- id:arrays-subarray-sum-equals-k | order:20 | day:3 | pattern:prefix-sum-hashmap | template:T-HASH-04 -->

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

### Day 3 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **A read pointer and a write pointer beat a second array.** Whenever elements must be removed or reordered in place, one pointer scans and another marks where the next kept element belongs. The gap between them is exactly what has been discarded.
  <br>↳ *Remove Duplicates from Sorted Array* — the write index trailing the read index by the number of duplicates seen
- **Sortedness turns a search into an adjacency check.** In a sorted array, anything you would otherwise search for is next to you. Duplicate detection, nearest-neighbour questions and merging all collapse to comparing neighbours.
  <br>↳ *Remove Duplicates from Sorted Array* — comparing a[read] against the last written value rather than scanning for a match; *Merge Sorted Array* — comparing only the two current tails, since everything behind them is already ordered
- **Write into free space from the end when merging in place.** Merging forward needs somewhere to put displaced elements. Merging backward does not, when the free space happens to sit where the largest elements belong.
  <br>↳ *Merge Sorted Array* — three pointers walking backwards so every write lands in guaranteed-empty tail space
- **A running extreme replaces an inner loop.** If the best answer at index i depends only on some aggregate of everything before it, carry that aggregate forward in a scalar. The nested loop disappears.
  <br>↳ *Best Time to Buy and Sell Stock* — tracking the minimum price seen so far instead of trying every earlier buy day
- **Extend or restart is the whole of Kadane.** The best subarray ending at i either extends the best one ending at i-1 or begins fresh at i. It can never extend a suboptimal predecessor, because swapping in the optimal one would improve it.
  <br>↳ *Maximum Subarray* — cur = max(a[i], cur + a[i]), with best initialised to a[0] rather than 0; *Best Time to Buy and Sell Stock* — the same recurrence applied to consecutive price differences
- **Negatives forbid a sliding window.** A window needs extending to move the aggregate one way only, so that shrinking is a valid correction. Negative values break that, and prefix sums with a hash map are the replacement.
  <br>↳ *Subarray Sum Equals K* — prefix sums keyed in a map, seeded with {0,1}, because the constraints permit negative values
- **Count subarrays by their right endpoint.** For a valid window [l, r], every subarray ending at r and starting at or after l is also valid. Adding r - l + 1 counts them all without enumerating any.
  <br>↳ *Subarray Sum Equals K* — counting prefix occurrences rather than subarrays directly
- **Mark in place and restore on the way out.** Grid searches need no visited array - overwrite the cell with a sentinel and put it back when the branch fails. The restore is the backtrack, and omitting it corrupts every later attempt.
  <br>↳ *Word Search* — writing '#' into the grid before recursing and restoring afterwards
- **A root-to-node path is an array, so array techniques apply.** Prefix sums with a hash map work on a tree path exactly as on a subarray - provided the map is unwound when the recursion backtracks.
  <br>↳ *Subarray Sum Equals K* — the array version of the identical idea

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; A forbidden data structure is a hint, not an obstacle
- **sorting** — The merge step is reusable, so learn it properly once; Naive quicksort dies on sorted input; Group by an invariant, then solve each group
- **math** — `n % 10` reads a digit, `n /= 10` advances; A value that maps to exactly one successor is a linked list; Check overflow before the operation, not after; Count a factor without constructing the number
- **recursion** — Include or exclude gives 2^n, choose-one-of-many gives n!; Sort, then skip equal siblings to dedupe; `i` versus `i + 1` is the whole reuse question; Prune before recursing, not at the leaf; Mark in place and restore on the way out
