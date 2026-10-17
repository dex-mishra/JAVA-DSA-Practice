"""One-off transform: upgrade days/day-01.txt and day-02.txt to the v3.1 format
(reading path, 6-field refs, detours, problem notes, must-sibling notes, core block)."""
import re, os
HERE = os.path.dirname(os.path.abspath(__file__))

HEADER = {
1: """=== day: 1
micro_title: Day 1 — one pass, a few variables, and writing in place
micro_theory: arr-single-pass-running-state, arr-read-write-pointer, cx-big-o, cpp-vector, meta-analyse-a-problem
reading_path:
- meta-analyse-a-problem#five-questions | Every problem in this plan starts with this box on paper. Read it once — you will fill it four times today. | 4
- meta-bottleneck-method#idea | How a slow solution becomes a fast one. Today's problems are the gentlest examples of this method. | 3
- meta-pseudocode-format#five-slots | The five-slot pseudocode you write on paper before any C++. | 3
- cx-big-o#counting | Just enough Big-O to say "this is O(n)" and mean it. | 3
- cpp-vector#basics | The container in every problem. Note the size() trap. | 2
- arr-single-pass-running-state#idea | Pattern 1 of today: carry the past in a few variables. Used by problems 1 and 2. | 3
- arr-read-write-pointer#idea | Pattern 2 of today: compacting an array in place. Used by problems 3 and 4. | 3
--- micro | Today in one minute | mixed
Day 1 is about **not looking back**. Two ideas, four easy problems, and the habits you will use for the next 29 days.

✍️ **Running state** — walk once, keep a few variables that summarise the past.
✍️ **Read/write pointer** — one index reads everything, another marks where the next kept element goes.

The reading path below takes about 20 minutes (longer than usual — it includes the foundations). Every page opens inside the path; when you finish a step you continue from here.
--- card | Pattern card | write
✍️ RUNNING STATE — trigger: "so far / running / streak / consecutive". Keep: total, current, best. Update every step; reset when the condition breaks.
✍️ READ/WRITE POINTER — trigger: "in-place", "O(1) extra space", "remove/move, keep order". `if keep(a[read]) a[write++] = a[read]`. Return `write`.
""",
2: """=== day: 2
micro_title: Day 2 — hashing: remember what you have seen
micro_theory: hash-table-internals, cpp-unordered-map-set, hash-complement-lookup, hash-frequency-counting, cpp-container-choice
reading_path:
- hash-table-internals#picture | Why a hash map can answer "have I seen this?" without searching. | 3
- cpp-unordered-map-set#api | The five operations you will type today. | 2
- cpp-unordered-map-set#bracket-trap | The one bug everybody makes with mp[k]. | 2
- hash-complement-lookup#idea | Pattern 1 of today — the idea behind Two Sum. | 3
- hash-frequency-counting#idea | Pattern 2 of today — count once, answer every "how many" in O(1). | 2
- cpp-container-choice#rule | Array, unordered_map or map? One rule. | 1
--- micro | Today in one minute | mixed
Yesterday you remembered a few numbers about the past. Today you remember **everything** about the past — in a hash map — so "have I seen X?" costs O(1).

✍️ **Complement lookup** — for each x, ask whether its partner (target − x) has already appeared.
✍️ **Frequency counting** — count once, then every "how many" is a lookup.

Problems 3 and 4 have no reading in the path on purpose: try them first. Their theory opens from inside the problem when you need it.
--- card | Pattern card | write
✍️ COMPLEMENT LOOKUP — trigger: "pair that sums/differs to …", unsorted. need = target − x; check map; THEN insert x.
✍️ FREQUENCY COUNT — trigger: "anagram, same characters, appears more than, most frequent, duplicate". One table, ++ for one input, −− for the other.
✍️ START OF RUN — trigger: "longest consecutive", O(n), unsorted. Only walk from v where v−1 is missing.
""",
}

REFS = {
"running-sum-of-1d-array": """- analyse | n ≤ 1000 → aim for O(n) anyway | cx-constraints-to-target#table | Turns n into a target complexity before you think of an idea. | before | optional
- brainstorm | ↳ Bottleneck: the inner loop re-adds a[0..i−1] | arr-single-pass-running-state#think | Shows exactly why re-adding the prefix is wasted work — the move this whole problem is about. | before | must
- pseudocode | STATE `run`, UPDATE `run = run + a[i]` | arr-single-pass-running-state#template | The running-total template your pseudocode follows line by line. | while | must
- edges | Time O(n): one loop, O(1) work inside | cx-big-o#counting | How "one loop with O(1) inside" becomes O(n). | while | optional
- carry | "This output array is called a prefix sum array" | ps-prefix-sum-basics#idea | The same array answers any range sum on Day 4 — read it then, or peek now. | after | optional""",
"max-consecutive-ones": """- brainstorm | **2. Optimal.** One pass with `cur` and `best` | arr-single-pass-running-state#template | The streak-that-resets template. | while | must
- pseudocode | `best = max(best, cur)` every step | arr-single-pass-running-state#pitfalls | Why updating best only on a reset misses a streak that runs to the end. | while | must
- carry | "the streak becomes a sliding window" | sw-variable-window#budget | Day 5 turns this exact problem into "flip at most k zeros". | after | optional""",
"move-zeroes": """- understand | "in place", keep the order of non-zeros | arr-read-write-pointer#recognise | The trigger words that point to the read/write pointer. | before | must
- brainstorm | ↳ Bottleneck of B: elements are shifted again and again | arr-read-write-pointer#think | Why erase-and-shift is O(n²) and how moving each element once fixes it. | before | must
- pseudocode | `swap(a[write], a[read])` | arr-read-write-pointer#swap-vs-copy | Why this problem needs swap (or a fill pass) instead of a plain copy. | while | must
- edges | O(1) extra space | cx-space-and-in-place#in-place | What "in place" allows and forbids. | while | optional""",
"remove-duplicates-from-sorted-array": """- analyse | "because it is sorted, a value is new when it differs from the last kept" | arr-read-write-pointer#recognise | Sortedness turns "seen before?" into a neighbour comparison. | while | optional
- pseudocode | CHECK `a[read] != a[write−1]` | arr-read-write-pointer#template | The keep-rule table, including this exact rule. | while | must
- edges | compare with the written array | arr-read-write-pointer#pitfalls | Why `a[write−k]` generalises to "keep at most k copies" (the must-study sibling). | after | optional""",
"two-sum": """- brainstorm | ↳ Bottleneck: the inner loop searches for one known value | hash-complement-lookup#idea | The whole idea of this problem in three lines — read it before attempting. | before | must
- brainstorm | ↳ Unlock: "Am I searching for something I could have remembered?" | hash-complement-lookup#think | The full brute → hash-map derivation, step by step. | while | must
- pseudocode | UPDATE `seen[x] = i` comes after CHECK | hash-complement-lookup#self-pairing | Why inserting first lets 3 pair with itself when the target is 6. | while | must
- solution | `seen.find(need)` instead of `seen[need]` | cpp-unordered-map-set#bracket-trap | `[]` would insert the key while you are only asking. | while | must
- edges | O(n) **average** time | hash-table-internals#why-o1 | What "O(1) lookup" really means, and its worst case. | after | optional
- followups | "The array is sorted; O(1) space?" | tp-opposite-ends#idea | Tomorrow's pattern — the answer to this follow-up. | after | optional""",
"valid-anagram": """- brainstorm | **3. Optimal.** Count letters | hash-frequency-counting#think | Why counting removes the need to sort. | while | must
- pseudocode | `cnt[s[i]-'a']++ ; cnt[t[i]-'a']--` | hash-frequency-counting#template | The one-table ++/−− template. | while | must
- solution | `int cnt[26]` instead of a map | cpp-container-choice#anagram-example | Why an array is the right container for lowercase letters. | while | optional
- edges | length check first | hash-frequency-counting#pitfalls | Different lengths can never be anagrams. | after | optional""",
"majority-element": """- brainstorm | ↳ Unlock: "a forbidden data structure is a hint" | hash-boyer-moore-voting#recognise | How the O(1)-space requirement names the technique. | stuck | must
- brainstorm | **4. Optimal (Boyer–Moore).** | hash-boyer-moore-voting#think | The map → sort → voting ladder in full. | stuck | must
- pseudocode | `if cnt == 0: cand = x` comes first | hash-boyer-moore-voting#pitfalls | The order of the two lines inside the loop. | while | must
- edges | "guaranteed only because a majority is guaranteed" | hash-boyer-moore-voting#why-it-works | The cancellation argument you say in an interview. | after | must""",
"longest-consecutive-sequence": """- understand | "n ≤ 10⁵, must be O(n)" on unsorted input | hash-set-runs#recognise | The O(n) requirement is the hint that rules out sorting. | stuck | must
- brainstorm | ↳ Bottleneck: a run of length L is walked L times | hash-set-runs#think | Why the naive set version is O(n²) and the start-of-run fix. | stuck | must
- pseudocode | CHECK `if (v − 1) in s: continue` | hash-set-runs#idea | The start-of-run rule. | while | must
- solution | `for (int v : s)` — the set, not the array | hash-set-runs#pitfalls | Duplicates in the array would restart the same walk. | while | optional
- edges | "each value is visited by at most one walk" | cx-amortised-analysis#counting-trick | Why a loop inside a loop can still be O(n). | after | optional""",
}

DETOURS = {  # (problem, anchor substring in that problem's main block) -> detour line inserted after it
("running-sum-of-1d-array", "✍️ ↳ Unlock question"): ">> detour meta-bottleneck-method#unlock-questions | The seven unlock questions — you will reuse them all month | 2 min",
("move-zeroes", "- Example: [0,1,0,3,12]"): ">> detour cx-space-and-in-place#in-place | What \"in place\" allows and forbids | 2 min",
("two-sum", "✍️ **4. Optimal (one-pass hash).**"): ">> detour hash-table-internals#why-o1 | Why the map lookup is O(1) — and when it is not | 3 min",
("valid-anagram", "✍️ **3. Optimal.** Count letters"): ">> detour cpp-container-choice#rule | Array vs unordered_map vs map — the one-minute rule | 1 min",
("majority-element", "✍️ **2. Better (frequency map).**"): ">> detour cx-space-and-in-place#aux | What counts as extra space — and why the map is O(n) | 2 min",
("longest-consecutive-sequence", "✍️ O(n) average time: n inserts"): ">> detour cx-amortised-analysis#counting-trick | Why the inner while loop does not make this O(n²) | 3 min",
}

NOTES = {
"running-sum-of-1d-array": """1. Problem
   • out[i] = a[0] + … + a[i]  (Running Sum, LC 1480)
2. Pattern: running state
   • Trigger: answer at i = answer at i−1 + one change
3. Brute → optimal
   • Brute: for each i, add a[0..i] again → O(n²)
       ◦ Bottleneck: re-adding a prefix the last step already added
   • Optimal: keep `run`, add a[i], write it → O(n)
4. Pseudocode
   • STATE run = 0 · LOOP i = 0..n−1 · UPDATE run += a[i]; out[i] = run · RETURN out
5. Remember
   • This output is a **prefix sum array** (Day 4 uses it for range sums)
   • O(1) extra space: a[i] += a[i−1] in place
✎ In my words: ______________________________________________""",
"max-consecutive-ones": """1. Problem
   • Longest block of consecutive 1s (LC 485)
2. Pattern: running state — streak that resets
3. Brute → optimal
   • Brute: count forward from every start → O(n²)
       ◦ Bottleneck: a block is recounted from each of its positions
   • Optimal: cur = (x == 1) ? cur + 1 : 0; best = max(best, cur) → O(n), O(1)
4. Pitfalls
   • Update best **every** step — a streak can end at the last element
5. Leads to
   • "Flip at most k zeros" = Day 5 sliding window (Max Consecutive Ones III)
✎ In my words: ______________________________________________""",
"move-zeroes": """1. Problem
   • Move all 0s to the end, keep the order of the rest, in place (LC 283)
2. Pattern: read / write pointer
   • Trigger: "in-place", "keep relative order"
3. Brute → optimal
   • Brute A: new array → O(n) space ✗ · Brute B: erase + push_back → O(n²)
       ◦ Bottleneck: the same elements get shifted again and again
   • Optimal: move each non-zero once, to index `write` → O(n), O(1)
4. Pseudocode
   • write = 0 · for read: if a[read] ≠ 0 → swap(a[write], a[read]); write++
5. Remember
   • **Swap**, not copy — the zeros must survive at the back
   • Invariant: a[0..write−1] = non-zeros in order
✎ In my words: ______________________________________________""",
"remove-duplicates-from-sorted-array": """1. Problem
   • Sorted array → keep one copy of each value in front, return k (LC 26)
2. Pattern: read / write pointer + sortedness
   • Sorted ⇒ duplicates are adjacent ⇒ "new?" = differs from last kept
3. Brute → optimal
   • Brute: set of seen values → O(n) space
       ◦ Waste: the set answers a question sortedness already answers
   • Optimal: keep if a[read] ≠ a[write−1] → O(n), O(1)
4. Pseudocode
   • write = 1 · for read = 1..n−1: if a[read] ≠ a[write−1] → a[write++] = a[read] · return write
5. Remember
   • Compare with the **written** array: "at most k copies" → a[write−k]
✎ In my words: ______________________________________________""",
"two-sum": """1. Problem
   • Unsorted array, return indices i ≠ j with a[i] + a[j] = target (LC 1)
2. Pattern: complement lookup
   • Trigger: pair with a sum/difference, input **unsorted**, indices needed
3. Brute → optimal
   • Brute: all pairs → O(n²)
       ◦ Bottleneck: inner loop searches for one known value (target − a[i])
       ◦ Unlock: "searching for something I could have remembered"
   • Optimal: map value → index; one pass → O(n) time, O(n) space
4. Pseudocode
   • need = target − x → if need in seen → return · **then** seen[x] = i
5. Pitfalls
   • Insert first → x pairs with itself ([3,2,4], target 6)
   • Ask with find/count, not [] (inserts)
6. Follow-up
   • Sorted + O(1) space → two pointers (Day 3)
✎ In my words: ______________________________________________""",
"valid-anagram": """1. Problem
   • Is t a rearrangement of s? (LC 242)
2. Pattern: frequency counting
   • Trigger: "anagram / same characters" → order doesn't matter, counts do
3. Brute → optimal
   • Brute: find-and-remove each char → O(n²) · sort both → O(n log n)
       ◦ Waste: full order when only counts matter
   • Optimal: one int cnt[26], ++ for s, −− for t, all zero → O(n), O(1)
4. Pitfalls
   • Check lengths first
   • Unicode follow-up → unordered_map instead of [26]
✎ In my words: ______________________________________________""",
"majority-element": """1. Problem
   • Value appearing > n/2 times; follow-up O(1) space (LC 169)
2. Pattern: Boyer–Moore voting
   • Trigger: "majority / more than n/2" + "O(1) space"
3. Ladder
   • count map → O(n) space · sort → a[n/2] → O(n log n) · voting → O(n), O(1)
4. Algorithm
   • cnt == 0 → cand = x (first) · x == cand → cnt++ · else cnt−−
5. Why it works
   • each −1 cancels one cand against a different value; majority can't be cancelled out
6. Remember
   • No guarantee → verify with a second pass · > n/3 → two candidates
✎ In my words: ______________________________________________""",
"longest-consecutive-sequence": """1. Problem
   • Longest run of consecutive integers in an unsorted array, O(n) (LC 128)
2. Pattern: set + start of run
   • Trigger: "consecutive", unsorted, **O(n)** (rules out sorting)
3. Brute → optimal
   • Sort + scan → O(n log n) ✗
   • Set + walk from every value → O(n²) on 1..n
       ◦ Bottleneck: a run of length L is walked L times
   • Walk only from starts (v−1 missing) → O(n)
4. Pitfalls
   • Iterate the **set**, not the array (duplicates)
5. Remember
   • A loop inside a loop can be O(n) if each element is charged to one walk
✎ In my words: ______________________________________________""",
}

SIB_NOTES = {
"find-pivot-index": """• Pivot: sum left of i == sum right of i
• right = total − left − a[i] → one pass with running `left`
• CHECK before adding a[i] to left · O(n), O(1)""",
"consecutive-characters": """• Streak of equal neighbours: extend if s[i] == s[i−1]
• Reset to **1** (the current char is a run) · O(n)""",
"remove-element": """• Read/write with keep = a[read] ≠ val
• Copy is enough (tail doesn't matter) · return write""",
"remove-duplicates-from-sorted-array-ii": """• At most 2 copies: keep if write < 2 || a[read] ≠ a[write−2]
• Compare with the **written** array, not the input""",
"contains-duplicate": """• Complement of x is x itself → hash **set**
• check, then insert · O(n) time, O(n) space (sort: O(n log n), O(1))""",
"group-anagrams": """• Canonical key = sorted word (or 26-count signature)
• groups[key].push_back(word) · O(n · L log L)""",
"majority-element-ii": """• > n/3 → at most two values → two candidates + two counters
• different from both → decrement both · always verify in a 2nd pass""",
"longest-square-streak-in-an-array": """• Successor is v² instead of v+1 → set lookups again
• long long + stop above 10⁵ · answer −1 if < 2""",
}

CORE = {
1: """=== core: 1
subject: OOP
unit: OOP & C++ internals
title: Classes, objects and their memory · Constructors and destructors
minutes: 45
topics: oop-classes-objects-memory, oop-constructors-destructors
explain: An interviewer asks: "What exactly happens in memory when you write `Account a(100);` and when `a` goes out of scope?" Answer in 2 minutes: object layout, constructor call, stack vs heap, destructor call.
--- intro | Today | mixed
OOP is the first CS subject because every LLD round and many C++ questions sit on top of it. Today: what an object actually is in memory, and how it is born and destroyed.
✍️ Read topic 1 → write its note → answer its recall questions. Then topic 2. Then the MCQs and the 2-minute explanation.
+++ mcq: d1-q1
q: In C++, what is the only difference between `struct` and `class`?
a: struct cannot have member functions
b: struct members and base classes are public by default; class ones are private
c: struct objects live on the stack, class objects on the heap
d: struct cannot be inherited from
answer: b
why: Both can have functions, constructors, inheritance and live anywhere. Only the default access differs.
topic: oop-classes-objects-memory
+++ mcq: d1-q2
q: `class A { char c; int x; };` — on a typical 64-bit compiler, `sizeof(A)` is most likely:
a: 5
b: 8
c: 16
d: 1
answer: b
why: 1 byte for c, 3 bytes of padding so the int is 4-byte aligned, 4 bytes for x → 8.
topic: oop-classes-objects-memory
+++ mcq: d1-q3
q: What does `sizeof` of a class with no data members return?
a: 0
b: 1
c: 4
d: It does not compile
answer: b
why: Every object must have a distinct address, so an empty class has size 1.
topic: oop-classes-objects-memory
+++ mcq: d1-q4
q: In which order are members initialised?
a: The order they appear in the initialiser list
b: Alphabetical order
c: The order they are declared in the class
d: Undefined
answer: c
why: Declaration order always wins; compilers warn (-Wreorder) when the initialiser list order differs.
topic: oop-constructors-destructors
+++ mcq: d1-q5
q: `Derived` inherits from `Base`. Creating and destroying a `Derived` object calls, in order:
a: Derived(), Base(), ~Derived(), ~Base()
b: Base(), Derived(), ~Derived(), ~Base()
c: Base(), Derived(), ~Base(), ~Derived()
d: Derived(), Base(), ~Base(), ~Derived()
answer: b
why: Construction goes base → derived; destruction is the exact reverse.
topic: oop-constructors-destructors
+++ mcq: d1-q6
q: Which members MUST be set in the constructor initialiser list (not in the body)?
a: static members
b: const members and reference members
c: public members
d: pointer members
answer: b
why: const and reference members cannot be assigned after construction, so they must be initialised in the list.
topic: oop-constructors-destructors
""",
2: """=== core: 2
subject: OOP
unit: OOP & C++ internals
title: Encapsulation and access control · Abstraction, abstract classes and interfaces
minutes: 45
topics: oop-encapsulation-access, oop-abstraction-interfaces
explain: An interviewer asks: "What is the difference between encapsulation and abstraction? Give one example of each from a payment system." Answer in 2 minutes.
--- intro | Today | mixed
Two pillars that are always asked together — and always confused. Encapsulation protects an object's data; abstraction hides how something works behind an interface.
✍️ Topic 1 → note → recall. Topic 2 → note → recall. Then MCQs and the 2-minute explanation.
+++ mcq: d2-q1
q: Which access specifier lets a derived class use a member but hides it from all other code?
a: private
b: protected
c: public
d: friend
answer: b
why: protected = visible to the class and its derived classes only.
topic: oop-encapsulation-access
+++ mcq: d2-q2
q: A `friend` function of class A can:
a: only access public members of A
b: access private and protected members of A, without being a member of A
c: be called only from inside A
d: be inherited by classes derived from A
answer: b
why: Friendship grants access to private/protected members; it is not inherited and not transitive.
topic: oop-encapsulation-access
+++ mcq: d2-q3
q: A class with at least one pure virtual function:
a: can be instantiated if all other functions are defined
b: cannot be instantiated
c: cannot have a constructor
d: cannot have data members
answer: b
why: It is abstract. It can still have constructors, data members and implemented functions.
topic: oop-abstraction-interfaces
+++ mcq: d2-q4
q: In C++, an "interface" is usually written as:
a: a class with the `interface` keyword
b: a struct with only static functions
c: a class with only pure virtual functions and a virtual destructor
d: a template class
answer: c
why: C++ has no interface keyword; the convention is an abstract class with only pure virtual methods.
topic: oop-abstraction-interfaces
+++ mcq: d2-q5
q: Which statement is about abstraction rather than encapsulation?
a: Balance can only change through deposit() and withdraw()
b: checkout() calls pay() on a PaymentMethod without knowing if it is UPI or a card
c: Member variables are private
d: A setter validates input before storing it
answer: b
why: Hiding *how* (which payment implementation) behind an interface is abstraction; the others protect data = encapsulation.
topic: oop-abstraction-interfaces
+++ mcq: d2-q6
q: A derived class does not override one inherited pure virtual function. The derived class is:
a: concrete, the base version is used
b: abstract too, and cannot be instantiated
c: a compile error at the class definition
d: concrete, the function returns a default value
answer: b
why: An unimplemented pure virtual function keeps the derived class abstract.
topic: oop-abstraction-interfaces
""",
}


def transform(dn):
    path = os.path.join(HERE, "days", f"day-0{dn}.txt")
    t = open(path).read()
    # header
    i = t.index("=== problem:")
    t = HEADER[dn] + "\n" + t[i:]
    # core block replaces cs_core
    j = t.index("=== cs_core:")
    t = t[:j] + CORE[dn]
    # per problem
    blocks = re.split(r"(?m)^(?==== problem: )", t)
    out = []
    for b in blocks:
        m = re.match(r"=== problem: (\S+)", b)
        if not m:
            out.append(b); continue
        slug = m.group(1)
        main, *sibs = re.split(r"(?m)^(?=\+\+\+ sibling: )", b)
        main = re.sub(r"(?ms)^theory_refs:\n.*?(?=^stuck_refs:)", "theory_refs:\n" + REFS[slug] + "\n", main)
        for (p, anchor), det in DETOURS.items():
            if p != slug: continue
            lines = main.split("\n")
            k = next(n for n, l in enumerate(lines) if anchor in l)
            lines.insert(k + 1, det)
            main = "\n".join(lines)
        main = main.replace("--- tests | Tests | hidden", "--- note | Note this | write\n" + NOTES[slug] + "\n--- tests | Tests | hidden", 1)
        new_sibs = []
        for sb in sibs:
            sm = re.match(r"\+\+\+ sibling: \S+ \| (\S+) \|.*\| must\s*$", sb.split("\n")[0])
            if sm and sm.group(1) in SIB_NOTES:
                sb = sb.replace("--- tests | Tests | hidden", "--- note | Note this | write\n" + SIB_NOTES[sm.group(1)] + "\n--- tests | Tests | hidden", 1)
            new_sibs.append(sb)
        out.append(main + "".join(new_sibs))
    open(path, "w").write("".join(out))


for d in (1, 2):
    transform(d)
print("upgraded days 1-2")
