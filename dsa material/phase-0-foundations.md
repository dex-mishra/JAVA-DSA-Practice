---
phase: P0
title: Foundations
days: 1-3
problems: 24
generated: 2026-09-17
---

# P0 — Foundations

**Days 1–3** &nbsp;·&nbsp; **24 problems** &nbsp;·&nbsp; Reference layer. Complexity, STL, sorting, hashing, recursion, bit basics, maths. Reread whenever you open the sheet.

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

## Problems

### Day 1

*8 problems — 3 core, 3 drill, 2 skim.*

#### `[CORE]` 1. Two Sum &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1

<!-- id:hashing-two-sum | order:1 | day:1 | pattern:hash-complement | template:T-HASH-01 -->

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

#### `[CORE]` 2. Single Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 136

<!-- id:hashing-single-number | order:7 | day:1 | pattern:xor-cancellation | template:T-BIT-01 -->

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

#### `[CORE]` 3. Majority Element &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 169

<!-- id:hashing-majority-element | order:8 | day:1 | pattern:boyer-moore-voting | template:T-ARR-01 -->

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

#### `[DRILL]` 4. Contains Duplicate &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 217

<!-- id:hashing-contains-duplicate | order:2 | day:1 | pattern:seen-set | template:T-HASH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/contains-duplicate/)

**Asked by:** Amazon, Adobe, Palantir &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `seen-set`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The moment a question asks 'does anything repeat', you are being asked whether you know that a set gives you membership in O(1). That is the entire test.

**Trick.** Short-circuit. Return true the instant you see a repeat - do not build the whole set first and compare sizes, even though `set.size() != n` also works.

**Edge cases that bite.**

- Empty array and single element - both false.
- All identical - returns true on the second element, not the last.

**Complexity.** `O(n)` time, `O(n)` space — one pass with O(1) average inserts. Sorting first would be O(n log n) time but O(1) extra space - name that trade if asked.

**Same pattern.** [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/), [Single Number](https://leetcode.com/problems/single-number/), [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/), [Valid Anagram](https://leetcode.com/problems/valid-anagram/)

**Interview follow-ups.**

- **Q.** O(1) extra space?
  <br>**A.** Sort in place, then scan adjacent pairs. O(n log n) time, O(1) space - but it destroys the input order, which may not be allowed.
- **Q.** Duplicates within distance k of each other?
  <br>**A.** That is LC 219 - a sliding window of a set, evicting the element that falls out of the window. Same idea, bounded memory.
- **Q.** Array of n+1 integers in range [1,n], find the duplicate without modifying it, O(1) space?
  <br>**A.** Floyd's cycle detection treating values as next-pointers. That is LC 287 and it is a genuinely beautiful problem. (This is the separator.)

</details>

#### `[DRILL]` 5. Valid Anagram &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 242

<!-- id:hashing-valid-anagram | order:3 | day:1 | pattern:frequency-count | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/valid-anagram/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/)

**Asked by:** Amazon, Uber, Bloomberg, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `frequency-count`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two words are anagrams when their letter *multisets* match. You do not need to sort to compare multisets - you just need to count, and counting is O(n) while sorting is O(n log n).

**Trick.** For a fixed alphabet, use `int cnt[26]` and NOT a hash map. Increment for string one, decrement for string two, then assert everything is zero. One array, one pass each, no hashing overhead at all.

**Edge cases that bite.**

- Different lengths - return false immediately, before counting.
- Empty strings are anagrams of each other.
- The `cnt[26]` trick silently breaks on Unicode. Ask about the character set.

**Complexity.** `O(n)` time, `O(1)` space — the counter is 26 ints regardless of input size, so it is genuinely constant space - not O(k) hand-waving. Sorting-based solutions are O(n log n) time.

**Same pattern.** [Group Anagrams](https://leetcode.com/problems/group-anagrams/), [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/), [Permutation in String](https://leetcode.com/problems/permutation-in-string/), [Ransom Note](https://leetcode.com/problems/ransom-note/)

**Interview follow-ups.**

- **Q.** What if the strings contain Unicode?
  <br>**A.** The 26-array collapses. Switch to `unordered_map<char32_t,int>` and accept O(1) average instead of true O(1). Always ask about the alphabet before optimising.
- **Q.** Group all anagrams in a list of words.
  <br>**A.** Hash each word by its sorted form, or by its 26-length count signature. The count signature is O(n) per word versus O(n log n) for sorting - faster for long words.
- **Q.** Find every anagram of p inside s.
  <br>**A.** Sliding window of size |p| carrying a rolling count. LC 438, and it is the natural next rung from here.

</details>

#### `[DRILL]` 6. Ransom Note &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 383

<!-- id:hashing-ransom-note | order:9 | day:1 | pattern:frequency-count | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/ransom-note/)

**Asked by:** Amazon, Apple &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `frequency-count`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is Valid Anagram with the equality relaxed to containment. Instead of asserting every count is zero, you assert no count goes negative. Recognising that two problems differ only in their terminating condition is the skill being built here.

**Trick.** Count the magazine once into `int cnt[26]`, then decrement for each ransom-note character and fail the moment a count would go below zero.

**Edge cases that bite.**

- Empty ransom note is always constructible — return true.
- Ransom note longer than the magazine can be rejected immediately on length.
- Each magazine character is usable only once, which is exactly what decrementing enforces; a set instead of a counter would silently allow reuse.

**Complexity.** `O(n + m)` time, `O(1)` space — one pass over each string, with a fixed 26-slot counter. The constant space claim is genuine because the alphabet is fixed by the constraints.

**Same pattern.** [Valid Anagram](https://leetcode.com/problems/valid-anagram/), [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/), [Permutation in String](https://leetcode.com/problems/permutation-in-string/)

**Interview follow-ups.**

- **Q.** Unicode instead of lowercase Latin?
  <br>**A.** The fixed array collapses; switch to a hash map and the space becomes O(k) for k distinct characters, with O(1) average rather than guaranteed lookups.
- **Q.** Characters may be reused any number of times.
  <br>**A.** Counting becomes unnecessary — a set of available characters suffices, and the problem degrades to a subset test.

</details>

#### `[SKIM]` 7. First Unique Character in a String &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 387

<!-- id:hashing-first-unique-character-in-a-string | order:10 | day:1 | pattern:frequency-count | template:T-HASH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/first-unique-character-in-a-string/)

**Asked by:** Amazon, Microsoft, Bloomberg, Goldman Sachs &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `frequency-count`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two passes beat one clever pass. The first pass establishes counts; the second walks the string in order and returns the first character whose count is 1. Trying to do it in a single pass is where people waste time, because uniqueness is not knowable until the whole string has been read.

**Trick.** Count, then scan in original order. The second scan is what supplies 'first' — a map alone loses positional order.

**Edge cases that bite.**

- No unique character exists — return -1, do not fall off the end.
- Single-character string returns index 0.
- The answer is an index, not the character. Easy mark to lose.

**Complexity.** `O(n)` time, `O(1)` space — two passes, each linear, over a 26-slot counter. Storing first-seen indices in the map and taking the minimum is an alternative one-pass-plus-scan variant with the same bound.

**Same pattern.** [Valid Anagram](https://leetcode.com/problems/valid-anagram/), [Ransom Note](https://leetcode.com/problems/ransom-note/), [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)

**Interview follow-ups.**

- **Q.** Now it is a stream and you must answer at any moment.
  <br>**A.** Maintain a queue of candidate characters plus a count map. On each arrival, push it and then pop from the front while the front's count exceeds 1. The front is always the current first-unique.
- **Q.** Return the first character appearing exactly k times.
  <br>**A.** Identical structure — only the second-pass predicate changes from `== 1` to `== k`.

</details>

#### `[SKIM]` 8. Intersection of Two Arrays &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 349

<!-- id:hashing-intersection-of-two-arrays | order:11 | day:1 | pattern:seen-set | template:T-HASH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/intersection-of-two-arrays/)

**Asked by:** Amazon, Facebook, Two Sigma &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `seen-set`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The word 'unique' in the output specification is doing real work: it means a set, not a list, and choosing the right container makes the deduplication free rather than a separate step.

**Trick.** Put the smaller array into a set, scan the larger, and collect into a second set to deduplicate the output. Sizing by the smaller array minimises memory.

**Edge cases that bite.**

- Either array empty — result is empty.
- Duplicates within an input must not produce duplicates in the output.
- The result has no required ordering here, which is what allows a set.

**Complexity.** `O(n + m)` time, `O(min(n, m))` space — both arrays are scanned once and the set holds only the smaller one. Sorting both and using two pointers is O(n log n + m log m) time but O(1) extra space.

**Same pattern.** [Intersection of Two Arrays II](https://leetcode.com/problems/intersection-of-two-arrays-ii/), [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/), [Two Sum](https://leetcode.com/problems/two-sum/)

**Interview follow-ups.**

- **Q.** Now duplicates must appear as many times as they occur in both.
  <br>**A.** That is LC 350 — replace the set with a count map and decrement on each match.
- **Q.** Both arrays are already sorted.
  <br>**A.** Two pointers, O(n + m) time and O(1) extra space. Strictly better than hashing, and the reason to always ask whether input is sorted.
- **Q.** One array is enormous and on disk, the other fits in memory.
  <br>**A.** Hash the small one in memory and stream the large one past it. This is exactly how a database hash join works.

</details>

### Day 1 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Store what you have seen, look up what you need.** A nested loop whose inner loop is a search can almost always be collapsed by recording elements as you pass them and querying that record in O(1). This is the single most common route from O(n^2) to O(n).
  <br>↳ *Two Sum* — keeping a map of value→index and querying `target - x` on arrival; *Contains Duplicate* — keeping a set of seen values and querying before insert
- **Query before you insert.** When an element could pair with itself, the order of query and insert decides correctness. Querying first makes self-pairing impossible without a special case.
  <br>↳ *Two Sum* — checking `target - x` before storing `x`, so `[3,3]` with target 6 still works and `x` never matches itself; *Contains Duplicate* — checking membership before inserting, which also lets you return on the first repeat instead of building the whole set
- **Fixed alphabet means an array, not a hash map.** When keys are drawn from a small dense range, an ordinary array indexed by the key beats a hash map on both constant factor and cache behaviour, and the space is genuinely O(1) rather than O(k).
  <br>↳ *Valid Anagram* — `int cnt[26]`, incremented for the first string and decremented for the second, then asserted all-zero
- **A forbidden data structure is a hint, not an obstacle.** When a problem bans extra space, it is naming the technique it wants. Constant-space constraints on counting problems point at XOR, at voting arguments, or at arithmetic identities - never at a cleverer hash map.
  <br>↳ *Single Number* — the O(1) space requirement ruling out the map and forcing XOR, where x^x = 0 makes duplicates annihilate; *Majority Element* — the same constraint forcing Boyer-Moore voting instead of a frequency map
- **Two passes beat one clever pass.** Some properties are unknowable until the whole input has been read. Establish them in a first pass and act on them in a second, walking the original order. Forcing a single pass costs time and usually correctness.
  <br>↳ *First Unique Character in a String* — counting every character first, then rescanning in index order to find the first with count 1; *Minimum Absolute Difference* — one pass to find the minimum gap, a second to collect every pair achieving it
- **The output specification picks the container.** Words like 'unique', 'in order' or 'as many times as it appears' are container instructions. Reading them properly makes deduplication or ordering free instead of a separate corrective step.
  <br>↳ *Intersection of Two Arrays* — the word 'unique' making a set the right output container, so deduplication never needs its own pass

### Day 2

*8 problems — 3 core, 3 drill, 2 skim.*

#### `[CORE]` 1. Sort an Array &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 912

<!-- id:sorting-sort-an-array | order:4 | day:2 | pattern:merge-sort | template:T-SORT-01 -->

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

#### `[CORE]` 2. Pancake Sorting &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 969

<!-- id:sorting-pancake-sorting | order:13 | day:2 | pattern:selection-by-reversal | template:T-SORT-03 -->

[Solve on LeetCode](https://leetcode.com/problems/pancake-sorting/)

**Asked by:** Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `selection-by-reversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** You cannot swap, only reverse a prefix. That single restriction rules out every standard sort and forces you to think about what operations you actually have. The answer is selection sort, rebuilt from prefix reversals.

**Trick.** Repeatedly find the largest unplaced element, flip it to the front, then flip it into its final position at the end of the unsorted region. Two flips place one element, so at most 2n flips total.

**Edge cases that bite.**

- Already sorted — skip the flips when the maximum is already in position, or you waste operations.
- The maximum already at the front needs only one flip, not two.
- Indices in the answer are 1-based, which is an easy mark to drop.

**Complexity.** `O(n²)` time, `O(1)` space — n iterations, each scanning for a maximum in O(n) and performing O(n) reversal work. The output length is what is being optimised here, not the runtime — at most 2n flips.

**Same pattern.** [Sort an Array](https://leetcode.com/problems/sort-an-array/), [Reverse String](https://leetcode.com/problems/reverse-string/), [Rotate Array](https://leetcode.com/problems/rotate-array/)

**Interview follow-ups.**

- **Q.** Minimise the number of flips rather than achieving 2n.
  <br>**A.** That is the pancake number problem and it is NP-hard in the burnt variant. The known upper bound is roughly 18n/11. Recognising a problem as NP-hard is itself the expected answer here.
- **Q.** Why does selection sort adapt here when quicksort does not?
  <br>**A.** Selection sort only ever needs to move one known element to one known place, which two reversals achieve. Quicksort needs arbitrary pairwise swaps, which prefix reversal cannot express cheaply.

</details>

#### `[CORE]` 3. Sort the Matrix Diagonally &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1329

<!-- id:sorting-sort-the-matrix-diagonally | order:14 | day:2 | pattern:group-by-invariant | template:T-SORT-04 -->

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

#### `[DRILL]` 4. Sort Array By Parity &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 905

<!-- id:sorting-sort-array-by-parity | order:12 | day:2 | pattern:two-pointer-partition | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-array-by-parity/)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `two-pointer-partition`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This is one partition step of quicksort with the predicate changed from 'less than pivot' to 'is even'. Seeing it that way turns an unfamiliar problem into a routine you already own, and generalises to any binary property.

**Trick.** Two pointers from both ends. Advance left while it is even, retreat right while it is odd, then swap. No comparison sort is needed because there are only two classes.

**Edge cases that bite.**

- All even or all odd — one pointer runs the full length, no swaps occur.
- Empty array — the loop guard handles it.
- Relative order within each group is not required here. If it were, the two-pointer approach would be invalid and you would need a stable partition.

**Complexity.** `O(n)` time, `O(1)` space — each pointer moves monotonically, so together they traverse the array once. Sorting with a parity comparator is O(n log n) and strictly worse.

**Same pattern.** [Sort Array By Parity II](https://leetcode.com/problems/sort-array-by-parity-ii/), [Sort Colors](https://leetcode.com/problems/sort-colors/), [Move Zeroes](https://leetcode.com/problems/move-zeroes/), [Partition List](https://leetcode.com/problems/partition-list/)

**Interview follow-ups.**

- **Q.** Preserve the relative order within evens and within odds.
  <br>**A.** The in-place two-pointer swap destroys order. You need a stable partition — either O(n) extra space writing evens then odds, or the O(n log n) in-place stable variant.
- **Q.** Three classes instead of two.
  <br>**A.** Dutch National Flag with three pointers. That is Sort Colors, and it is the natural generalisation of this problem.

</details>

#### `[DRILL]` 5. Relative Sort Array &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1122

<!-- id:sorting-relative-sort-array | order:15 | day:2 | pattern:custom-comparator | template:T-SORT-05 -->

[Solve on LeetCode](https://leetcode.com/problems/relative-sort-array/)

**Asked by:** Amazon, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `custom-comparator`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** When the ordering is defined by external data rather than by the values themselves, you build a rank map and sort on the rank. This is the general shape of every 'sort by a custom priority' question.

**Trick.** Map each value in arr2 to its position, then sort arr1 with a comparator returning that rank, falling back to the value itself for anything absent. Values not in arr2 get rank infinity so they sort last, ascending among themselves.

**Edge cases that bite.**

- Elements of arr1 missing from arr2 must go last in ascending order — a single comparator handles both rules.
- Duplicates in arr1 are preserved; ranks are not unique.
- Constraints cap values at 1000, so counting sort is available and is O(n + k).

**Complexity.** `O(n log n)` time, `O(m)` space — the sort dominates, with the rank map sized by arr2. The counting-sort alternative is O(n + k) because the value range is bounded — worth naming.

**Same pattern.** [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/), [Custom Sort String](https://leetcode.com/problems/custom-sort-string/), [Sort the People](https://leetcode.com/problems/sort-the-people/), [Largest Number](https://leetcode.com/problems/largest-number/)

**Interview follow-ups.**

- **Q.** Do it in O(n + k) without a comparison sort.
  <br>**A.** Counting sort. Tally arr1 into a 1001-slot array, emit values in arr2's order draining their counts, then emit the remaining values in ascending index order.
- **Q.** Why must the comparator be a strict weak ordering?
  <br>**A.** Returning `<=` makes it non-irreflexive, which is undefined behaviour. In libstdc++ `std::sort` then reads past the range boundary and segfaults on inputs above 16 elements.

</details>

#### `[DRILL]` 6. Minimum Absolute Difference &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1200

<!-- id:sorting-minimum-absolute-difference | order:16 | day:2 | pattern:sort-then-adjacent-scan | template:T-SORT-06 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-absolute-difference/)

**Asked by:** Amazon, Bloomberg &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `sort-then-adjacent-scan`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The minimum difference between any two elements is always between two elements that are adjacent after sorting. That one fact collapses an O(n²) pairwise search into a sort plus a linear scan, and it recurs across many problems.

**Trick.** Sort, make one pass computing adjacent differences to find the minimum, then a second pass collecting every pair achieving it. Two passes are cleaner than trying to collect and compare simultaneously.

**Edge cases that bite.**

- Multiple pairs share the minimum — all must be returned, in ascending order.
- Negative values are fine; sorting normalises them.
- Two elements only — one pair, difference is the answer.

**Complexity.** `O(n log n)` time, `O(1)` space — the sort dominates; both scans are linear and the output is not counted as working space. Without sorting, comparing all pairs is O(n²).

**Same pattern.** [Minimum Absolute Difference in BST](https://leetcode.com/problems/minimum-absolute-difference-in-bst/), [K-diff Pairs in an Array](https://leetcode.com/problems/k-diff-pairs-in-an-array/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

**Interview follow-ups.**

- **Q.** Prove the minimum difference must be between adjacent elements.
  <br>**A.** If i < j are non-adjacent in sorted order, any k between them satisfies a[k] - a[i] <= a[j] - a[i], so a closer pair always exists. Therefore the minimum is attained adjacently.
- **Q.** Find the maximum absolute difference instead.
  <br>**A.** Last minus first after sorting — or just max minus min in O(n) with no sort at all.

</details>

#### `[SKIM]` 7. Height Checker &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 1051

<!-- id:sorting-height-checker | order:17 | day:2 | pattern:compare-against-sorted-copy | template:T-SORT-06 -->

[Solve on LeetCode](https://leetcode.com/problems/height-checker/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `compare-against-sorted-copy`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The question is 'how far is this from sorted', and the direct way to answer it is to produce the sorted version and count positional mismatches. Do not look for something cleverer — the clever version is the counting sort, not a different idea.

**Trick.** Copy, sort the copy, count indices where the two disagree. With heights bounded at 100, counting sort makes it O(n).

**Edge cases that bite.**

- Already sorted — answer is 0.
- Duplicate heights never count as mismatches when they occupy equivalent positions.
- The answer counts positions, not swaps needed — a different and harder quantity.

**Complexity.** `O(n log n), or O(n + k) with counting sort` time, `O(n)` space — the copy is O(n) space regardless. The bounded height range of 1..100 is the constraint signalling that counting sort is intended.

**Same pattern.** [Relative Sort Array](https://leetcode.com/problems/relative-sort-array/), [Sort an Array](https://leetcode.com/problems/sort-an-array/), [Minimum Absolute Difference](https://leetcode.com/problems/minimum-absolute-difference/)

**Interview follow-ups.**

- **Q.** Count the minimum number of swaps to sort instead.
  <br>**A.** A different problem entirely: decompose the permutation into cycles; a cycle of length L needs L-1 swaps. Total is n minus the number of cycles.
- **Q.** Why is counting sort applicable here?
  <br>**A.** Heights are bounded by 100, so a 101-slot tally is O(1) space and one pass fills it. Bounded value ranges in the constraints are always worth checking for.

</details>

#### `[SKIM]` 8. Sort Array By Parity II &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 922

<!-- id:sorting-sort-array-by-parity-ii | order:18 | day:2 | pattern:two-pointer-partition | template:T-SORT-02 -->

[Solve on LeetCode](https://leetcode.com/problems/sort-array-by-parity-ii/)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `two-pointer-partition`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The constraint is positional rather than ordinal: evens at even indices, odds at odd indices. Two independent pointers stepping by two — one over even slots, one over odd — reduce it to a single corrective swap whenever both are misplaced.

**Trick.** Walk `i` over even indices and `j` over odd indices, each by 2. Advance each while it is already correct; when both are wrong, one swap fixes both at once.

**Edge cases that bite.**

- The input guarantees exactly half even and half odd, so the pointers can never run out of partners.
- Array length is always even under the constraints.
- Swapping fixes two violations simultaneously — never swap when only one side is misplaced.

**Complexity.** `O(n)` time, `O(1)` space — both pointers advance monotonically across disjoint index sets, so total movement is n. The two-array approach is also O(n) time but O(n) space.

**Same pattern.** [Sort Array By Parity](https://leetcode.com/problems/sort-array-by-parity/), [Sort Colors](https://leetcode.com/problems/sort-colors/), [Move Zeroes](https://leetcode.com/problems/move-zeroes/)

**Interview follow-ups.**

- **Q.** The guarantee of equal counts is removed.
  <br>**A.** Detect infeasibility first by counting parities; if they are unequal no arrangement exists and you return early. The algorithm is otherwise unchanged.
- **Q.** Do it with O(n) space instead.
  <br>**A.** Write evens to indices 0,2,4... and odds to 1,3,5... in one pass over a new array. Simpler to reason about, worse on memory — the classic trade worth stating aloud.

</details>

### Day 2 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The merge step is reusable, so learn it properly once.** Merge sort's combine phase walks two sorted halves with two pointers. Any quantity that can be counted while those pointers move - inversions, qualifying pairs - comes free, which is how several otherwise-hard problems are solved.
  <br>↳ *Sort an Array* — the `merge` routine itself, written from scratch because `std::sort` is disallowed here
- **Naive quicksort dies on sorted input.** Choosing the first or last element as pivot degrades to O(n^2) precisely when the array is already sorted or reverse-sorted, which is a common test case. Randomising the pivot or taking a median-of-three removes the failure mode.
  <br>↳ *Sort an Array* — why merge sort is the safe submission here, and why `std::sort` uses introsort rather than plain quicksort
- **Partition is a primitive, not just a quicksort step.** Splitting an array by a binary predicate with two converging pointers is O(n) and O(1) space. Any problem that separates elements into two classes is this, with the predicate swapped out.
  <br>↳ *Sort Array By Parity* — advancing from both ends and swapping when both sides are misplaced, with 'is even' as the predicate; *Sort Array By Parity II* — two pointers stepping by two over even and odd index positions, one swap fixing two violations
- **Group by an invariant, then solve each group.** When elements fall into classes defined by a shared computed value, bucket them on that value and the problem reduces to solving one small independent instance per bucket.
  <br>↳ *Sort the Matrix Diagonally* — every cell on a diagonal sharing `i - j`, so the matrix becomes a map of independent lists to sort
- **External ordering means a rank map plus a comparator.** When the required order is defined by separate data rather than by the values, build a value→rank map and sort on the rank, with a documented fallback rank for anything absent.
  <br>↳ *Relative Sort Array* — mapping each arr2 value to its index, sorting arr1 on that rank, and sending unlisted values to the end ascending
- **After sorting, the answer is usually adjacent.** Minimum gaps, closest pairs and duplicate detection all become adjacent-element checks once sorted, because sorting places every element next to its nearest neighbours in value. This turns O(n^2) pairwise search into a linear scan.
  <br>↳ *Minimum Absolute Difference* — the minimum gap being provably between consecutive sorted elements, so one scan suffices; *Height Checker* — comparing against the sorted copy position by position
- **A bounded value range means counting sort.** When the constraints cap the values rather than just the count, a tally array indexed by value gives O(n + k) and sidesteps the comparison lower bound entirely. The bound in the statement is the hint.
  <br>↳ *Relative Sort Array* — values capped at 1000, making a 1001-slot tally available; *Height Checker* — heights capped at 100, so the sort is avoidable altogether
- **Restricted operations dictate the algorithm.** When the problem removes an operation you rely on, do not adapt your favourite algorithm - ask which algorithm only needs the operations that remain.
  <br>↳ *Pancake Sorting* — prefix reversal being the only move, which rules out quicksort's arbitrary swaps and makes selection sort the natural fit

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; Fixed alphabet means an array, not a hash map; A forbidden data structure is a hint, not an obstacle; Two passes beat one clever pass; The output specification picks the container

### Day 3

*8 problems — 3 core, 3 drill, 2 skim.*

#### `[CORE]` 1. Happy Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 202

<!-- id:math-happy-number | order:6 | day:3 | pattern:cycle-detection | template:T-MATH-02 -->

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

#### `[CORE]` 2. Reverse Integer &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 7

<!-- id:math-reverse-integer | order:19 | day:3 | pattern:digit-reversal | template:T-MATH-01 -->

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

#### `[CORE]` 3. Factorial Trailing Zeroes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 172

<!-- id:math-factorial-trailing-zeroes | order:20 | day:3 | pattern:prime-factor-counting | template:T-MATH-03 -->

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

#### `[DRILL]` 4. Palindrome Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 9

<!-- id:math-palindrome-number | order:5 | day:3 | pattern:digit-reversal | template:T-MATH-01 -->

[Solve on LeetCode](https://leetcode.com/problems/palindrome-number/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-a-number-is-palindrome-or-not/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=1xNbjMdbjug&t=1230)

**Asked by:** Amazon, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `digit-reversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The interesting version of this problem is the one where you are banned from converting to a string. Then it becomes a digit-extraction exercise, and digit extraction is `n % 10` to read and `n /= 10` to advance - the two operations behind half of all number problems.

**Trick.** Reverse only HALF the number and compare the halves. Stop when the reversed half becomes >= the remaining half. This avoids the overflow you get from reversing the whole thing, and it is the answer they are fishing for.

**Edge cases that bite.**

- Negatives are never palindromes - the minus sign. Return false immediately.
- Any number ending in 0 (except 0 itself) cannot be a palindrome.
- Odd digit counts leave a middle digit - discard it with `rev / 10` before comparing.

**Complexity.** `O(log n)` time, `O(1)` space — log10(n) digits, one operation each, no extra storage. The string solution is O(log n) space for the string, which is why they ban it.

**Same pattern.** [Reverse Integer](https://leetcode.com/problems/reverse-integer/), [Add Digits](https://leetcode.com/problems/add-digits/), [Happy Number](https://leetcode.com/problems/happy-number/), [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/)

**Interview follow-ups.**

- **Q.** Reverse the whole number instead. What breaks?
  <br>**A.** Overflow. Reversing 1534236469 exceeds INT_MAX. Half-reversal sidesteps it entirely, which is exactly why it is the preferred solution.
- **Q.** Now do it in base k instead of base 10.
  <br>**A.** Replace every 10 with k. The algorithm is unchanged - which is the point. Digit extraction was never about base 10.

</details>

#### `[DRILL]` 5. Add Digits &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 258

<!-- id:math-add-digits | order:21 | day:3 | pattern:digital-root | template:T-MATH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/add-digits/)

**Asked by:** Amazon, Adobe &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `digital-root`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The loop version is trivially correct and is the right first answer. The follow-up asks for O(1), and the closed form exists because repeated digit summing preserves the value modulo 9 — a number and its digit sum are always congruent mod 9.

**Trick.** Digital root is `1 + (n - 1) % 9` for n > 0, and 0 for n = 0. Derive it rather than memorise it: 10 ≡ 1 (mod 9), so every positional weight collapses to 1.

**Edge cases that bite.**

- n = 0 returns 0 — the formula's `(n-1) % 9` would be wrong without the guard.
- Multiples of 9 return 9, not 0, which is exactly what the `1 + (n-1) % 9` form produces.
- Single-digit inputs return themselves.

**Complexity.** `O(1)` time, `O(1)` space — pure arithmetic with no loop. The iterative digit-summing version is O(log n) per pass and converges in a couple of passes, which is acceptable but not what is asked.

**Same pattern.** [Happy Number](https://leetcode.com/problems/happy-number/), [Palindrome Number](https://leetcode.com/problems/palindrome-number/), [Reverse Integer](https://leetcode.com/problems/reverse-integer/)

**Interview follow-ups.**

- **Q.** Prove the mod 9 property.
  <br>**A.** A number equals Σ dᵢ·10ⁱ, and 10 ≡ 1 (mod 9), so 10ⁱ ≡ 1 for all i. Therefore the number ≡ Σ dᵢ (mod 9) — it is congruent to its own digit sum.
- **Q.** Same question in base b.
  <br>**A.** The modulus becomes b - 1, by the identical argument: b ≡ 1 (mod b-1). In hexadecimal the digital root is mod 15.
- **Q.** Where is this actually used?
  <br>**A.** Casting out nines, a classical hand-check for arithmetic errors, and the basis of several checksum schemes.

</details>

#### `[DRILL]` 6. Ugly Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 263

<!-- id:math-ugly-number | order:22 | day:3 | pattern:trial-division | template:T-MATH-03 -->

[Solve on LeetCode](https://leetcode.com/problems/ugly-number/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `trial-division`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** 'Only has prime factors 2, 3 and 5' is a factorisation question in disguise. Divide out each permitted factor completely, and whatever remains decides it: 1 means the number was built entirely from allowed factors.

**Trick.** For each of 2, 3, 5, divide while divisible. Then check the residue equals 1. No primality testing is needed at all.

**Edge cases that bite.**

- n <= 0 is not ugly by definition — reject before dividing, or the loops hang.
- n = 1 is ugly, being the empty product.
- Dividing must be exhaustive per factor; a single division leaves residue.

**Complexity.** `O(log n)` time, `O(1)` space — each division at least halves n, so total iterations across all three factors are bounded by log₂n.

**Same pattern.** [Ugly Number II](https://leetcode.com/problems/ugly-number-ii/), [Happy Number](https://leetcode.com/problems/happy-number/), [Count Primes](https://leetcode.com/problems/count-primes/), [Factorial Trailing Zeroes](https://leetcode.com/problems/factorial-trailing-zeroes/)

**Interview follow-ups.**

- **Q.** Find the n-th ugly number.
  <br>**A.** LC 264 and a genuine step up. Three pointers into the sequence being built, each tracking the next multiple of 2, 3 and 5; take the minimum and advance every pointer that produced it, to avoid duplicates. O(n) DP.
- **Q.** Generalise to an arbitrary list of allowed primes.
  <br>**A.** Super Ugly Number, LC 313. k pointers instead of three, or a min-heap when k is large. Same idea, scaled.

</details>

#### `[SKIM]` 7. Nth Digit &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 400

<!-- id:math-nth-digit | order:23 | day:3 | pattern:digit-block-counting | template:T-MATH-05 -->

[Solve on LeetCode](https://leetcode.com/problems/nth-digit/)

**Asked by:** Google, Bloomberg &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `digit-block-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Building the sequence is impossible for n up to 2³¹. Instead, you skip whole blocks: there are 9 one-digit numbers, 90 two-digit, 900 three-digit, and so on, contributing 9, 180, 2700 digits respectively. Subtract blocks until n lands inside one.

**Trick.** Find the digit-length d by subtracting `9 * 10^(d-1) * d` while it fits. Then the containing number is `10^(d-1) + (n-1)/d`, and the digit within it is at index `(n-1) % d`.

**Edge cases that bite.**

- Off-by-one in the 1-based indexing — using `n-1` consistently after locating the block is what makes both the division and modulo land correctly.
- `9 * 10^(d-1) * d` overflows int for large d — use long long.
- n = 1 through 9 must resolve in the first block without entering the loop body.

**Complexity.** `O(log n)` time, `O(1)` space — one iteration per digit-length block, and there are at most 10 of them within the integer range. Constructing the string would be O(n) and infeasible.

**Same pattern.** [Reverse Integer](https://leetcode.com/problems/reverse-integer/), [Palindrome Number](https://leetcode.com/problems/palindrome-number/), [Add Digits](https://leetcode.com/problems/add-digits/)

**Interview follow-ups.**

- **Q.** How many digits does the sequence use up to number k?
  <br>**A.** Sum over each block: for lengths 1..d-1 take the full block, then partial for the last. It is the same block arithmetic run forwards instead of backwards.
- **Q.** Same question but the sequence is only even numbers.
  <br>**A.** Block sizes halve; the structure is identical. The lesson is that the technique is about counting blocks, not about this particular sequence.

</details>

#### `[SKIM]` 8. Rectangle Area &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 223

<!-- id:math-rectangle-area | order:24 | day:3 | pattern:inclusion-exclusion | template:T-MATH-06 -->

[Solve on LeetCode](https://leetcode.com/problems/rectangle-area/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `inclusion-exclusion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Total area is area A plus area B minus their overlap. That is inclusion-exclusion, and the only real work is computing the overlap correctly — including recognising when it is zero.

**Trick.** Overlap width is `min(right) - max(left)`, height is `min(top) - max(bottom)`. Clamp both at zero with `max(0, ...)`, which handles non-overlapping rectangles without any branching.

**Edge cases that bite.**

- Disjoint rectangles produce a negative width or height — clamping to 0 is what makes the single formula universal.
- Touching edges give zero overlap, not negative.
- Coordinates reach ±10⁴, so areas reach 4×10⁸ and sums exceed int. Use long long.
- Degenerate rectangles with zero width or height are valid input.

**Complexity.** `O(1)` time, `O(1)` space — pure arithmetic on eight coordinates, no iteration.

**Same pattern.** [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Insert Interval](https://leetcode.com/problems/insert-interval/), [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)

**Interview follow-ups.**

- **Q.** Do the rectangles overlap at all — yes or no?
  <br>**A.** LC 836. They overlap when `max(left) < min(right)` and `max(bottom) < min(top)`. The strict inequality means edge-touching does not count.
- **Q.** Total area covered by n rectangles.
  <br>**A.** Inclusion-exclusion becomes exponential, so it is the wrong tool. Use a sweep line over x-coordinates with a segment tree tracking covered y-length. That is LC 850.
- **Q.** Why does clamping at zero work rather than a special case?
  <br>**A.** A negative overlap dimension means the projections are disjoint on that axis, which means the rectangles cannot intersect at all, so the correct overlap is zero. The clamp encodes that fact rather than testing for it.

</details>

### Day 3 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **`n % 10` reads a digit, `n /= 10` advances.** Those two operations are the whole of digit manipulation. Any problem that forbids string conversion is asking you to use them, and the same pair works in any base once 10 is replaced by that base.
  <br>↳ *Palindrome Number* — extracting digits from the right to build the reversed half; *Happy Number* — extracting each digit to square and sum it
- **Do half the work to dodge overflow.** Reversing an entire integer can exceed the type's range even when the input does not. Reversing only until the reversed part meets or exceeds the remainder avoids the overflow entirely, and is the intended solution rather than a trick.
  <br>↳ *Palindrome Number* — stopping once `rev >= x`, then comparing `x == rev` or `x == rev / 10` to discard the middle digit
- **A value that maps to exactly one successor is a linked list.** If every state has exactly one next state, you are walking a chain, so it either terminates or cycles - and cycle detection has a known O(1)-space answer in Floyd's tortoise and hare. Recognising this disguise is worth more than the algorithm.
  <br>↳ *Happy Number* — treating digit-square-sum as the next pointer and running slow/fast pointers instead of storing a seen-set
- **Check overflow before the operation, not after.** Once a signed multiply has overflowed the behaviour is undefined, so the result cannot be inspected to detect it. The test must be a division or comparison performed on the operands beforehand.
  <br>↳ *Reverse Integer* — testing `rev > INT_MAX / 10` before `rev = rev * 10 + d`, with the digit-7 and digit-8 boundary cases; *Palindrome Number* — reversing only half the number so the overflow cannot arise at all
- **Count a factor without constructing the number.** Large values need not be built to be analysed. Counting occurrences of a prime across a range, or dividing out permitted factors, answers questions about numbers far beyond any integer type.
  <br>↳ *Factorial Trailing Zeroes* — summing n/5 + n/25 + n/125 rather than computing n!; *Ugly Number* — dividing out 2, 3 and 5 exhaustively and testing the residue for 1
- **Positional weights collapse under a modulus.** Because 10 ≡ 1 (mod 9), every power of ten is congruent to 1, so a number is congruent to its own digit sum mod 9. The same argument holds in base b with modulus b-1.
  <br>↳ *Add Digits* — replacing the repeated digit-summing loop with the closed form `1 + (n - 1) % 9`
- **Skip whole blocks rather than enumerating.** When the index space is far too large to build, partition it into blocks whose sizes are known in closed form, subtract whole blocks until the target lands inside one, then solve locally.
  <br>↳ *Nth Digit* — subtracting 9, 180, 2700... digits per length class until n falls inside, then locating the number and the digit within it
- **Clamping encodes a case instead of branching on it.** A negative intermediate often means 'this case does not occur'. Clamping it to zero collapses the special case into the general formula, which is shorter and harder to get wrong than an explicit branch.
  <br>↳ *Rectangle Area* — `max(0, min(right) - max(left))` making disjoint rectangles contribute zero overlap with no separate test

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; Fixed alphabet means an array, not a hash map; A forbidden data structure is a hint, not an obstacle; Two passes beat one clever pass; The output specification picks the container
- **sorting** — The merge step is reusable, so learn it properly once; Naive quicksort dies on sorted input; Partition is a primitive, not just a quicksort step; Group by an invariant, then solve each group; External ordering means a rank map plus a comparator; After sorting, the answer is usually adjacent; A bounded value range means counting sort; Restricted operations dictate the algorithm
