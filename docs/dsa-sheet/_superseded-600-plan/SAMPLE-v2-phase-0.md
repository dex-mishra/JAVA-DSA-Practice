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

### Day 1 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Store what you have seen, look up what you need.** A nested loop whose inner loop is a search can almost always be collapsed by recording elements as you pass them and querying that record in O(1). This is the single most common route from O(n^2) to O(n).
  <br>↳ *Two Sum* — keeping a map of value→index and querying `target - x` on arrival; *Contains Duplicate* — keeping a set of seen values and querying before insert
- **Query before you insert.** When an element could pair with itself, the order of query and insert decides correctness. Querying first makes self-pairing impossible without a special case.
  <br>↳ *Two Sum* — checking `target - x` before storing `x`, so `[3,3]` with target 6 still works and `x` never matches itself; *Contains Duplicate* — checking membership before inserting, which also lets you return on the first repeat instead of building the whole set
- **Fixed alphabet means an array, not a hash map.** When keys are drawn from a small dense range, an ordinary array indexed by the key beats a hash map on both constant factor and cache behaviour, and the space is genuinely O(1) rather than O(k).
  <br>↳ *Valid Anagram* — `int cnt[26]`, incremented for the first string and decremented for the second, then asserted all-zero

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

### Day 2 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The merge step is reusable, so learn it properly once.** Merge sort's combine phase walks two sorted halves with two pointers. Any quantity that can be counted while those pointers move - inversions, qualifying pairs - comes free, which is how several otherwise-hard problems are solved.
  <br>↳ *Sort an Array* — the `merge` routine itself, written from scratch because `std::sort` is disallowed here
- **Naive quicksort dies on sorted input.** Choosing the first or last element as pivot degrades to O(n^2) precisely when the array is already sorted or reverse-sorted, which is a common test case. Randomising the pivot or taking a median-of-three removes the failure mode.
  <br>↳ *Sort an Array* — why merge sort is the safe submission here, and why `std::sort` uses introsort rather than plain quicksort

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; Fixed alphabet means an array, not a hash map

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

### Day 3 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **`n % 10` reads a digit, `n /= 10` advances.** Those two operations are the whole of digit manipulation. Any problem that forbids string conversion is asking you to use them, and the same pair works in any base once 10 is replaced by that base.
  <br>↳ *Palindrome Number* — extracting digits from the right to build the reversed half; *Happy Number* — extracting each digit to square and sum it
- **Do half the work to dodge overflow.** Reversing an entire integer can exceed the type's range even when the input does not. Reversing only until the reversed part meets or exceeds the remainder avoids the overflow entirely, and is the intended solution rather than a trick.
  <br>↳ *Palindrome Number* — stopping once `rev >= x`, then comparing `x == rev` or `x == rev / 10` to discard the middle digit
- **A value that maps to exactly one successor is a linked list.** If every state has exactly one next state, you are walking a chain, so it either terminates or cycles - and cycle detection has a known O(1)-space answer in Floyd's tortoise and hare. Recognising this disguise is worth more than the algorithm.
  <br>↳ *Happy Number* — treating digit-square-sum as the next pointer and running slow/fast pointers instead of storing a seen-set

#### Carried forward

- **hashing** — Store what you have seen, look up what you need; Query before you insert; Fixed alphabet means an array, not a hash map
- **sorting** — The merge step is reusable, so learn it properly once; Naive quicksort dies on sorted input
