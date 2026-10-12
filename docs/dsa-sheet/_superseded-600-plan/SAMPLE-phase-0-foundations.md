---
phase: P0
title: Foundations
days: 1-3
problems: 6
generated: 2026-09-17
---

# P0 — Foundations

**Days 1–3** &nbsp;·&nbsp; **6 problems** &nbsp;·&nbsp; Reference layer. Complexity, STL, sorting, hashing, recursion, bit basics, maths. Reread whenever you open the sheet.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Time & Space Complexity

[Striver video](https://www.youtube.com/watch?v=FPu9Uld7W-E)

<!-- theory-id:t-complexity -->

<details open>
<summary><b>What it is</b></summary>

Imagine you have lost your friend's number and you have a printed phone directory.

- **Method 1:** start at page one, read every name. Works. Takes forever.
- **Method 2:** open the middle. Is the name before or after? Throw away half. Repeat.

Now make the directory a **billion** names long. Method 1 is a genuine lifetime of
flipping. Method 2 finishes in **thirty** flips.

That gap — the same problem, the same machine, the same person, thirty operations
versus a billion — is the whole reason this chapter exists.

Complexity is **not** how many seconds your code takes. Seconds depend on your laptop,
the compiler, and whether the judge server is having a bad day. Complexity is the
**shape of the growth curve**: when the input gets 10x bigger, does your work get 10x
bigger, or 100x, or barely move at all?

</details>

<details open>
<summary><b>The mental model</b></summary>

**Count what dominates. Bin the rest.**

Suppose your code does `3n² + 500n + 9000` operations. At n = 1,000,000:

- `3n²` ≈ 3,000,000,000,000
- `500n` = 500,000,000
- `9000` = ...nine thousand

The second term is 0.02% of the first. The third is a rounding error on a rounding
error. So we call the whole thing **O(n²)** and move on. The constants are real, they
just do not decide whether you pass.

Now here is the arithmetic that should genuinely worry you, and that most students
never actually do:

> A judge executes roughly **10⁸ operations per second**. You usually get 1-2 seconds.
> O(n²) at n = 10⁵ is **10¹⁰ operations**. That is **100 seconds**.
>
> Your solution is not "a bit slow". It is fifty times over budget.

Burn that into your head. It is why you check constraints *before* you write code, not
after your submission goes red.

</details>

<details>
<summary><b>How it actually works</b></summary>

One question, asked of every line: **how many times does this run, in terms of n?**

```cpp
for (int i = 0; i < n; i++)          // n times
    for (int j = 0; j < n; j++)      // n times, once per i
        sum += a[i] * a[j];          // so: n x n
```
→ **O(n²)**.

The two rules that cover almost everything:

- **Nested loops multiply.** n inside n is n².
- **Sequential loops add, and the bigger one wins.** O(n) then O(m) is O(n + m), which
  collapses to O(n) if you know m ≤ n.

**Where does `log` come from?** Halving.

```cpp
while (n > 0) n /= 2;
```
8 → 4 → 2 → 1. Three halvings. n = 10⁹? **Thirty.** Logarithms are so small they feel
like a bug. This is why binary search feels like cheating — it is just the phone
directory again.

**And recursion?** *(number of calls) × (work per call).*

- Naive Fibonacci: each call spawns two, so ~2ⁿ calls doing O(1) each → **O(2ⁿ)**.
- Merge sort: log n levels, O(n) merging per level → **O(n log n)**.

</details>

<details>
<summary><b>Implementing it from scratch</b></summary>

Sit with these until the answer is instant. This is a drill, not a read.

```cpp
// A - O(n)
for (int i = 0; i < n; i++) work();

// B - O(n^2). Yes, it is only n(n+1)/2 iterations. Constants die. Still n^2.
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++) work();

// C - O(n log n). Outer halves the space (log n), inner is linear each round.
for (int i = 1; i < n; i *= 2)
    for (int j = 0; j < n; j++) work();

// D - O(log n). i doubles, so it hits n after log n steps.
for (int i = 1; i < n; i *= 2) work();

// E - O(sqrt n). Lives in every divisor and prime problem you will ever see.
for (int i = 1; i * i <= n; i++) work();

// F - O(2^n). Each call branches twice. Subsets. Naive fib.
int f(int n) { return n <= 1 ? n : f(n-1) + f(n-2); }
```

**Test yourself honestly.** If you had to pause on C or E, you are not ready for the
problems yet. Come back to this block tomorrow.

</details>

<details>
<summary><b>The version you actually use</b></summary>

Every STL call is a bill you are signing without reading. Here is the bill:

| What you write | What it costs | The bit that bites |
|---|---|---|
| `sort(v.begin(), v.end())` | O(n log n) | introsort: quick, then heap, then insertion |
| `v.push_back(x)` | O(1) *amortised* | one unlucky push is O(n) — it reallocates |
| `v.insert(v.begin(), x)` | **O(n)** | shifts everything. Inside a loop this is O(n²) |
| `map<K,V>` anything | O(log n) | red-black tree. **Sorted.** |
| `unordered_map<K,V>` | O(1) avg, **O(n) worst** | collisions |
| `s.substr(i, len)` | **O(len)** | it *copies*. This one is a career-long trap |
| `priority_queue` push/pop | O(log n) | `top()` is O(1) |

That `substr` row. Look at it again:

```cpp
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++)
        check(s.substr(i, j - i + 1));      // looks O(n^2). Is O(n^3).
```

Two visible loops, one invisible copy. I have watched people stare at this for an hour.

</details>

<details>
<summary><b>Complexity, with reasoning</b></summary>

**Read the constraints, get told the answer.** This table is the single highest-return
thing in Phase 0.

| n up to | Target | What it is telling you to use |
|---|---|---|
| 10-12 | O(n!) | permutations, brute-force TSP |
| 20-25 | O(2ⁿ) | subsets, bitmask DP |
| 100 | O(n⁴) | four loops, Floyd-Warshall |
| 500 | O(n³) | interval / MCM DP |
| 5,000 | O(n²) | 2D DP |
| 10⁵ | O(n log n) | sort, heap, binary search, monotonic stack |
| 10⁶ | O(n) | one pass. Prefix sums, sliding window, counting |
| 10⁹ | O(log n) / O(1) | binary search **on the answer**, or maths |

The setter chose `n ≤ 20` on purpose. They are *telling* you it is exponential. Listen.

**On space:**

- A fixed handful of variables → O(1).
- A `vector<int>` of size n → O(n).
- A DP table n×m → O(n·m). At 5000×5000 that is 25M ints = **100 MB**, which will blow
  a 256 MB limit once overhead lands. That is your cue to compress to two rows.
- **Recursion costs stack even when you allocate nothing.** Depth d is O(d) space, and
  recursing 10⁵ deep will stack-overflow. People forget this constantly.

</details>

<details>
<summary><b>When to reach for it</b></summary>

Reading constraints is a *recognition* skill. These should fire automatically:

- **n ≤ 20** → try every subset. Bitmask.
- **n ≤ 10⁵, sorted or sortable** → binary search, two pointers, or sort-then-sweep.
- **n up to 10⁹ but the *answer* is bounded** → binary search **on the answer**.
  The tell is the phrasing: *"minimum capacity such that..."*, *"minimum days such that..."*
- **"count the subarrays/substrings where..."** → prefix sums + hash map, or sliding
  window if the property is monotonic.
- **n = 10⁶ with a tight limit** → one pass. You cannot even afford to sort.
- **"answer modulo 10⁹+7"** → the answer is astronomically large, so it is a counting
  DP or combinatorics problem. You are not constructing anything.

</details>

<details>
<summary><b>What everyone gets wrong</b></summary>

The five that cost real marks:

- **`int` dies at ~2.1×10⁹.** `n*(n-1)/2` with n = 10⁵ is 5×10⁹ — already wrong. Use
  `long long`. It does not crash. It just quietly returns nonsense, which is worse.
- **`(l + r) / 2` overflows** when both are near INT_MAX. Write `l + (r - l) / 2`.
  Famously shipped broken in Java's standard library for nine years.
- **Amortised ≠ worst case.** `push_back` is O(1) amortised. If asked for a *guaranteed*
  worst-case O(1), the honest answer is no — one push can be O(n).
- **Average ≠ worst.** `unordered_map` is O(1) average, O(n) worst. On Codeforces people
  will hack you for exactly this.
- **Dropping constants is for asymptotics, not for passing.** O(n log n) with a fat
  constant can TLE where O(n²) with a tiny one sails through at n = 2000. Know both numbers.

</details>

<details>
<summary><b>Interview grilling</b></summary>

Here is how the interviewer actually walks you down. Each answer earns the next question.

- **Q.** Complexity of your solution?
  **A.** Time and space, separately, and say what n *is*. *"O(n log n) time where n is
  the array length, O(n) space for the sorted copy."* Vagueness here is a red flag.

- **Q.** Why n log n and not n?
  **A.** Because I sort, and comparison sorting has a proven Ω(n log n) lower bound —
  there are n! possible orderings, each comparison gives one bit, so you need log₂(n!)
  ≈ n log n comparisons.

- **Q.** So sorting can never beat n log n?
  **A.** It can, if you stop comparing. Counting sort is O(n + k) for bounded integers,
  radix is O(d(n+k)). They dodge the bound by never doing a comparison.

- **Q.** Your `unordered_map` is O(n). Always?
  **A.** O(n) *expected*. Worst case O(n²) if everything collides — and C++'s default
  integer hash is essentially the identity, so it is trivially attackable.

- **Q.** You claimed O(1) space. But you recursed n deep.
  **A.** Caught — that is O(n) auxiliary stack. True O(1) means converting to iteration.
  *(Most candidates miss this entirely. Do not be most candidates.)*

- **Q.** Can you beat O(n)?
  **A.** Not if the answer depends on every element — you must read each one at least
  once. Adversary argument: skip any element and I change it, and your answer is wrong.
  Sub-linear needs structure: a sorted array, or a precomputed index.

</details>

### C++ STL — the containers you actually use

[Striver video](https://www.youtube.com/watch?v=RRVYpIET_RU)

<!-- theory-id:t-stl -->

<details open>
<summary><b>What it is</b></summary>

Think about how you store things in real life. You do not use one system for everything.

- **Clothes in a wardrobe** — stacked in a pile. Grabbing the top one is instant.
  Getting the shirt at the bottom means lifting everything above it.
- **Contacts in your phone** — sorted alphabetically. You can jump to "R" instantly and
  you can also ask "who comes after Rahul".
- **Hostel room keys on a board** — each key hangs on the hook with its room number.
  Room 214? Go straight to hook 214. No searching at all.

Those are a **stack**, a **map**, and a **hash table**. You already understand them.
The STL just gives you the C++ spelling.

And in an interview, using the STL is not cheating — it is expected. What is *also*
expected is that you know what is underneath, because the follow-up is always
*"and how would you build that yourself?"*

</details>

<details open>
<summary><b>The mental model</b></summary>

**Every container trades three things: lookup speed, insertion speed, and ordering.
There is no container that wins all three.** Picking the container *is* the algorithm
design step — very often the entire interview hinges on it.

The decision tree, honestly, is this short:

- Index access, contiguous memory → **`vector`**
- "Have I seen this?", order irrelevant → **`unordered_set` / `unordered_map`**
- "Have I seen this?" **and** I need sorted order or range queries → **`set` / `map`**
- "Give me the biggest thing", over and over → **`priority_queue`**
- Add and remove at **both** ends → **`deque`**
- I want LIFO/FIFO discipline enforced so I cannot cheat → **`stack` / `queue`**

If you can answer "which container and why" in one sentence, you are ahead of most
candidates.

</details>

<details>
<summary><b>How it actually works</b></summary>

```cpp
#include <bits/stdc++.h>          // everything. Contest habit, not production habit.
using namespace std;

vector<int> v = {3, 1, 2};
v.push_back(4);                   // {3,1,2,4}
sort(v.begin(), v.end());         // {1,2,3,4}
v.erase(v.begin() + 1);           // {1,3,4} - O(n), the tail shuffles left

map<string,int> freq;             // SORTED by key
freq["apple"]++;                  // missing key? default-constructs to 0, then ++
for (auto &[k, val] : freq) ...   // iterates a, b, c... in sorted order

unordered_map<int,int> seen;      // hash table. No order. Do not assume one.
if (seen.count(x)) ...            // O(1) average

set<int> s = {5, 1, 3};           // {1,3,5} - unique AND sorted
s.insert(3);                      // silently does nothing, already there
auto it = s.lower_bound(2);       // -> 3.  Use s.lower_bound, NOT std::lower_bound

priority_queue<int> maxHeap;                              // biggest on top
priority_queue<int, vector<int>, greater<int>> minHeap;   // smallest on top

deque<int> dq;
dq.push_front(1); dq.push_back(2);                        // O(1) at both ends
```

**Try this and watch it bite you:** insert `"b"`, `"a"`, `"c"` into a `map` and print.
You get a, b, c. Swap to `unordered_map` and the order is arbitrary garbage. Roughly
half of all *"my output is in the wrong order"* bugs are exactly this, and the error
message is no error message at all.

</details>

<details>
<summary><b>Implementing it from scratch</b></summary>

You must be able to build these blindfolded, because this is the follow-up question.

```cpp
// A dynamic array - this is what vector IS
struct Vec {
    int *a = nullptr; int sz = 0, cap = 0;
    void push_back(int x) {
        if (sz == cap) {                       // full - time to grow
            cap = cap ? cap * 2 : 1;           // DOUBLING. This is the whole trick.
            int *b = new int[cap];
            for (int i = 0; i < sz; i++) b[i] = a[i];
            delete[] a; a = b;
        }
        a[sz++] = x;
    }
};
```

**Why doubling and not "add 10 more"?** Do the arithmetic.

- Doubling: n pushes cost 1 + 2 + 4 + ... + n < 2n copies *total*. Average O(1). 
- Adding a constant: you reallocate every few pushes, costing O(n) each time → O(n²) total.

One line of code, an entire complexity class apart. This is the amortisation story and
it comes up constantly.

```cpp
// A hash map with chaining - what unordered_map IS
struct HashMap {
    static const int B = 100003;                        // prime bucket count
    vector<vector<pair<int,int>>> t{B};
    int h(int k) { return ((k % B) + B) % B; }          // the +B rescues negatives
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

</details>

<details>
<summary><b>The version you actually use</b></summary>

The algorithms that turn ten lines into one. Learn these and your implementation speed
doubles overnight.

```cpp
sort(v.begin(), v.end());
sort(v.begin(), v.end(), greater<int>());                 // descending
sort(v.begin(), v.end(), [](auto&a, auto&b){ return a.second < b.second; });

reverse(v.begin(), v.end());
*max_element(v.begin(), v.end());
accumulate(v.begin(), v.end(), 0LL);                      // 0LL. Not 0. Overflow.
count(v.begin(), v.end(), x);

lower_bound(v.begin(), v.end(), x) - v.begin();           // first index with v[i] >= x
upper_bound(v.begin(), v.end(), x) - v.begin();           // first index with v[i] >  x

v.erase(unique(v.begin(), v.end()), v.end());             // dedupe a SORTED vector
next_permutation(v.begin(), v.end());                     // in-place next ordering

__builtin_popcount(x);        // set bits in an int
__builtin_popcountll(x);      // ... in a long long
__gcd(a, b);
```

**`lower_bound` on unsorted input does not error.** It returns confident nonsense. That
is a far nastier bug than a crash, because your code runs and your answer is wrong.

</details>

<details>
<summary><b>Complexity, with reasoning</b></summary>

| Container | Access | Insert | Erase | Search | Ordered? | What it really is |
|---|---|---|---|---|---|---|
| `vector` | O(1) | O(1)* back / O(n) mid | O(n) | O(n), O(log n) sorted | insertion | dynamic array |
| `deque` | O(1) | O(1) both ends | O(n) mid | O(n) | insertion | chunked arrays |
| `list` | O(n) | O(1) at iterator | O(1) at iterator | O(n) | insertion | doubly linked list |
| `set` / `map` | — | O(log n) | O(log n) | O(log n) | **sorted** | red-black tree |
| `unordered_*` | — | O(1) avg / O(n) worst | O(1) avg | O(1) avg | **no** | hash table |
| `priority_queue` | O(1) top | O(log n) | O(log n) | — | partial | binary heap |
| `stack` / `queue` | O(1) | O(1) | O(1) | — | — | adapter over deque |

\* amortised.

**The decision rule, stated plainly:** default to `unordered_map`. Switch to `map` the
moment you need sorted iteration, `lower_bound` on keys, or a guaranteed worst case.
That is it. That is the whole rule.

</details>

<details>
<summary><b>When to reach for it</b></summary>

Problem statement says → reach for:

- *"Has this been seen before?"*, *"count occurrences"* → `unordered_map` / `unordered_set`
- *"the k largest / k smallest"* → `priority_queue` of size k
- *"the next greater element"*, *"the most recent unmatched thing"* → `stack`
- *"process in arrival order"*, *"level by level"* → `queue`
- *"smallest key ≥ x"*, *"all keys between a and b"* → `set`/`map` + `lower_bound`
- *"maximum in a sliding window"* → `deque` of indices, kept monotonic
- *"group these by ..."* → `unordered_map<Key, vector<T>>`

</details>

<details>
<summary><b>What everyone gets wrong</b></summary>

Read this list twice. Every single one has cost someone a submission.

- **`m[k]` on a map *inserts*.** So `if (m[k] == 0)` quietly creates the key. Inside a
  loop, your map grows to the size of your input for no reason. Use `m.count(k)`.
- **Iterator invalidation.** A `push_back` can reallocate and invalidate every iterator
  and pointer into the vector. Erasing while looping needs `it = v.erase(it)`.
- **`unordered_map` with a `pair` key does not compile** — no default hash exists. Either
  use `map`, or encode: `long long key = (long long)a * 1000000 + b;`
- **Comparators must be a strict weak ordering.** `return a <= b;` is undefined behaviour
  and genuinely segfaults on large inputs. It must be `<`. Never `<=`.
- **`accumulate(..., 0)` returns an `int`.** The initial value sets the accumulator type.
  Pass `0LL` or watch your sum wrap around.
- **`unique()` removes only *adjacent* duplicates.** Sort first or it does nothing useful.
- **`multiset.erase(x)` deletes every copy of x.** You almost always wanted
  `ms.erase(ms.find(x))`, which deletes one. Classic sliding-window corruption.

</details>

<details>
<summary><b>Interview grilling</b></summary>

- **Q.** Why is `push_back` O(1) if it sometimes copies the entire array?
  **A.** Amortised analysis. Doubling means n pushes cost at most 2n copies total, so
  constant on average — even though one individual push is O(n).

- **Q.** `map` or `unordered_map` here?
  **A.** Never answer with a preference. Answer with the *requirement*: *"`unordered_map`,
  because I only do point lookups and n is 10⁵ so the log factor is real overhead"* —
  or — *"`map`, because I need sorted output at the end, and re-sorting would cost the
  same log factor anyway."*

- **Q.** When does `unordered_map` become O(n)?
  **A.** When keys collide into one bucket. C++'s default integer hash is effectively the
  identity function, so an adversary can force it trivially. Fix: a custom hash seeded
  from `chrono::steady_clock`, or accept `map`.

- **Q.** How does `set` stay sorted *and* O(log n)?
  **A.** Red-black tree — a self-balancing BST that recolours and rotates on insert and
  delete to keep the longest root-to-leaf path at most twice the shortest, bounding
  height at O(log n).

- **Q.** Implement a hash map. Collision strategy?
  **A.** Chaining (a list per bucket) — simple, degrades gracefully. Open addressing is
  more cache-friendly but needs tombstones on delete and suffers clustering. Then
  volunteer the load factor: rehash past ~0.75.

- **Q.** Ten billion numbers streaming past. Give me the k largest.
  **A.** They do not fit in memory, so sorting is off the table. Min-heap of size k: push
  each element, pop when size exceeds k. O(n log k) time, O(k) space.
  *(This is the separator. The urge to sort is strong, and it is wrong.)*

</details>

## Problems

### Day 1

*3 problems — 1 core, 2 drill, 0 skim.*

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

#### `[DRILL]` 2. Contains Duplicate &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 217

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

#### `[DRILL]` 3. Valid Anagram &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 242

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

### Day 2

*1 problems — 1 core, 0 drill, 0 skim.*

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

### Day 3

*2 problems — 1 core, 1 drill, 0 skim.*

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

#### `[DRILL]` 2. Palindrome Number &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 9

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
