---
phase: V5
title: Advanced & Revision
days: 30-30
problems: 2
generated: 2026-09-17
---

# V5 — Advanced & Revision

**Days 30–30** &nbsp;·&nbsp; **2 problems** &nbsp;·&nbsp; Tries, the hardest leftovers, and the revision queue.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Tries

[Striver: Trie](https://www.youtube.com/watch?v=dBGUmUQhjaM)

<!-- theory-id:t-tries -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A trie is a tree where each edge is a character and each path from the root spells a
prefix. Words sharing a prefix share the path, which is what makes prefix queries cheap.

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
    bool search(const string& w) {
        Trie* n = this;
        for (char c : w) { if (!n->ch[c-'a']) return false; n = n->ch[c-'a']; }
        return n->end;
    }
    bool startsWith(const string& p) {
        Trie* n = this;
        for (char c : p) { if (!n->ch[c-'a']) return false; n = n->ch[c-'a']; }
        return true;                    // reached the end of the prefix: it exists
    }
};
```

The `end` flag is what distinguishes a stored word from a mere prefix. Without it, `search("ca")`
would return true for a trie containing only "cat".

**Complexity.** Insert, search and prefix-check are all **O(L)** in the word length and
**independent of how many words are stored** — that independence is the whole point. A hash set
gives O(L) membership too, but cannot answer prefix queries at all.

Space is O(total characters × alphabet size) with a fixed array per node. A `map<char, Trie*>` is
leaner for sparse or large alphabets at the cost of a log factor per step.

**When to reach for it.**

- Autocomplete, "words starting with", prefix counting
- A dictionary queried many times against a fixed word set
- Searching many words against one text at once — build a trie of the words and walk the text once
- Maximum XOR pair, by building a **binary** trie over the bits of each number

**Comparison.**

| Need | Structure |
|---|---|
| exact membership only | hash set — O(L), smaller |
| prefix queries, autocomplete | trie |
| sorted iteration | balanced BST |
| many patterns against one text | trie, or Aho-Corasick |

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why a trie beats a hash set despite both being O(L).** The bound is the same for exact lookup, but
a hash set cannot answer "does any stored word start with this prefix" without scanning everything.
The trie's structure *is* the prefix index. State this when asked why not just hash.

**Space is the real cost.** 26 pointers per node at 8 bytes each is 208 bytes per node before the
flag. A dictionary of 10⁵ words averaging 10 characters is up to 10⁶ nodes, so ~200 MB in the worst
case — though shared prefixes reduce it enormously in practice. Mitigations: `map<char, Trie*>` for
sparse nodes, or a compressed trie (radix tree) that collapses non-branching chains into single
edges holding a substring.

**Wildcards.** Supporting `.` as "any character" turns search from a walk into a DFS: at a `.` you
must try every existing child. Worst case O(26^d) for d wildcards, which is why the problem bounds
them. The implementation is a recursive search rather than a loop, and that change is the whole of
LC 211.

**Binary tries for XOR.** Insert each number as a 32-bit path, most significant bit first. To
maximise XOR against a query, walk greedily preferring the **opposite** bit at every level. This is
exact because a higher bit outweighs every lower bit combined: 2^k > 2^k − 1. That inequality is the
greedy's proof, and it is the follow-up interviewers ask.

**Aho-Corasick** extends a trie with failure links — on a mismatch, jump to the longest proper suffix
that is still a prefix of some pattern, exactly like KMP's lps generalised to many patterns. It finds
all occurrences of all patterns in O(text + total pattern length + matches). Worth being able to name
and describe at one level of depth; rarely worth implementing in an interview.

**Memory management.** The naive `new Trie()` leaks. In an interview, say so and offer either a vector
of nodes with integer indices — faster, cache-friendly, trivially freed — or smart pointers. The
index-based form is what competitive implementations use:

```cpp
vector<array<int,26>> ch{ {} };        // node 0 is the root
vector<bool> end{false};
int newNode() { ch.push_back({}); end.push_back(false); return ch.size()-1; }
```

**The grilling chain.**

- *Why a trie rather than a hash set?* — Prefix queries, which a hash cannot answer.
- *What does the `end` flag do?* — Distinguishes a stored word from a prefix of one.
- *What is the space cost, and how would you reduce it?* — 26 pointers per node; name radix
  compression and the map-per-node alternative.
- *Support `.` as a wildcard.* — Search becomes a DFS branching over all children.
- *Maximum XOR pair in better than O(n²).* — Binary trie, greedy opposite bit, with the
  2^k > 2^k − 1 argument.
- *Find all of 10⁴ patterns in a 10⁶-character text.* — Aho-Corasick; a trie alone still needs one
  pass per start position.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**What a trie is**

A library index organised by the first letter, then the second, then the third. To find everything
beginning "pho", you walk to P, then H, then O, and everything below that point qualifies.

A hash set is more like a cloakroom: you hand over the exact title and get an instant yes or no, but
you cannot ask what else starts with "pho".

**The end flag**

Walking to P-H-O-N-E tells you that path exists. It does not tell you whether "phone" is itself a
word in the index or merely the beginning of "phonetics".

The flag is a small tick at that node saying "a real entry stops here".

**Why the greedy bit choice is exact**

Choosing between a thousand-rupee note and any combination of smaller notes that add to less than a
thousand. The single large note always wins, so you take it whenever it is available.

Each bit position is worth more than every position below it combined, which is why taking the
opposite bit greedily, from the top down, cannot be improved on.

</details>

## Problems

### Day 30

*2 problems — 2 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Implement Trie (Prefix Tree) &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 208

<!-- id:tries-implement-trie-prefix-tree | order:1 | day:30 | pattern:trie-insert-search | template:T-TRIE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/implement-trie-prefix-tree/) &nbsp;·&nbsp; [TUF editorial](https://takeuforward.org/plus/dsa/problems/trie-implementation-and-operations?tab=editorial) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=dBGUmUQhjaM)

**Asked by:** Amazon, Google, Facebook, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `trie-insert-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The whole structure in three methods. The one detail that matters is the `end` flag - without it there is no way to distinguish a stored word from a prefix of one, and search('ca') would wrongly succeed on a trie holding only 'cat'.

**Trick.** 26-pointer array per node plus a boolean. insert walks and creates; search walks and checks the flag; startsWith walks and checks only that the path exists.

**Edge cases that bite.**

- search and startsWith differ ONLY in whether the end flag is tested.
- An empty string inserted marks the root as a word end.
- `new Trie()` leaks - mention the vector-of-nodes alternative with integer indices.

**Complexity.** `O(L) per operation` time, `O(total characters × 26)` space — every operation walks one character at a time, independent of how many words are stored. That independence is the reason to use a trie at all.

**Same pattern.** [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/), [Word Search II](https://leetcode.com/problems/word-search-ii/), [Replace Words](https://leetcode.com/problems/replace-words/), [Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/)

**Interview follow-ups.**

- **Q.** Why not a hash set?
  <br>**A.** A hash set matches O(L) for exact lookup but cannot answer prefix queries without scanning every word. The trie's structure is the prefix index.
- **Q.** Reduce the memory.
  <br>**A.** map<char, Trie*> for sparse nodes, or a radix tree collapsing non-branching chains into one edge holding a substring. 26 pointers per node is 208 bytes before the flag.
- **Q.** Count how many words share a prefix.
  <br>**A.** Store a counter per node, incremented on every insert passing through. Then the count is a single O(L) walk.

</details>

#### `[CORE]` 2. Design Add and Search Words Data Structure &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 211

<!-- id:tries-design-add-and-search-words-data-structure | order:2 | day:30 | pattern:trie-with-wildcard | template:T-TRIE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/design-add-and-search-words-data-structure/)

**Asked by:** Amazon, Google, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `trie-with-wildcard`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The wildcard turns search from a walk into a search. At a '.' you cannot know which child to follow, so you must try all of them - which means recursion rather than a loop. That is the only change from a plain trie.

**Trick.** Recursive search(node, word, index). On a normal character follow that child; on '.' loop over all 26 children and recurse into each existing one, returning true on the first success.

**Edge cases that bite.**

- '.' must branch over all existing children, not just the first.
- A word of all dots matches any stored word of that length.
- Worst case is O(26^d) for d wildcards, which is why the problem bounds them.
- The end flag is still what terminates a successful match.

**Complexity.** `O(L) with no wildcards, O(26^d · L) with d of them` time, `O(total characters × 26)` space — a normal walk is linear; each wildcard multiplies the branching by the alphabet size.

**Same pattern.** [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/), [Word Search II](https://leetcode.com/problems/word-search-ii/), [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/)

**Interview follow-ups.**

- **Q.** Support '*' meaning zero or more characters.
  <br>**A.** Now it is regex matching against a trie - the branch must also consider staying at the same node. Substantially harder, and closer to LC 10 than to this.
- **Q.** Why is this O(26^d) and not O(L)?
  <br>**A.** Each '.' forces exploring every child subtree. With d wildcards the search tree branches 26 ways d times.
- **Q.** Bound it better in practice.
  <br>**A.** Index words by length first, so a search only explores the trie restricted to matching lengths. Does not change the worst case but helps enormously on real data.

</details>

### Day 30 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The end flag is what makes a trie a dictionary.** Without it, reaching a node only proves the path exists - not that a word stops there. search and startsWith differ in exactly that one test.
  <br>↳ *Implement Trie (Prefix Tree)* — the boolean checked by search and ignored by startsWith
- **A trie's cost is independent of how many words it holds.** Every operation is O(L) in the query length regardless of dictionary size. A hash set matches that for exact lookup but cannot answer prefix queries at all.
  <br>↳ *Implement Trie (Prefix Tree)* — walking one character per step, never touching unrelated words
- **A wildcard turns a walk into a search.** When you cannot tell which child to follow, you must try all of them - so the loop becomes recursion and the bound gains a factor of the alphabet size per wildcard.
  <br>↳ *Design Add and Search Words Data Structure* — branching over all 26 children at every '.'
