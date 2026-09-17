---
phase: P2A
title: Core I - Trees & BST
days: 14-19
problems: 80
generated: 2026-09-17
---

# P2A — Core I - Trees & BST

**Days 14–19** &nbsp;·&nbsp; **80 problems** &nbsp;·&nbsp; Binary trees and BSTs at full depth. Every traversal, every medium, every hard.

> **Tier key.** `[CORE]` code it fully, the pattern lives here. `[DRILL]` a variation on a CORE, under 10 minutes. `[SKIM]` read the dropdown, write 3 lines of pseudocode, move on.

## Theory

*Read this before the problems, and reread it whenever you reopen the topic. Each section runs from zero knowledge to the question that separates candidates.*

### Binary trees

[Striver: Trees playlist](https://www.youtube.com/watch?v=_ANrF3FJm7I)

<!-- theory-id:t-binary-trees -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A binary tree is a hierarchical structure where each node holds a value and at
most two children, conventionally `left` and `right`. A node with no children is a leaf. The
**height** of a node is the number of edges on the longest path down to a leaf; the height of
the tree is the height of its root. **Depth** is the reverse — edges from the root down to the
node.

```cpp
struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

**Terminology worth fixing.**

- *Full* — every node has 0 or 2 children.
- *Complete* — every level is filled except possibly the last, which fills left to right. This is
  what permits array representation, and it is why heaps are complete trees.
- *Perfect* — all internal nodes have two children and all leaves are at the same depth. A perfect
  tree of height h has exactly 2^(h+1) − 1 nodes.
- *Balanced* — for every node, the heights of the two subtrees differ by at most one.
- *Degenerate* — every node has one child. Structurally a linked list, and the worst case for
  every tree algorithm.

**The four traversals.** Three are depth-first and differ only in when the node itself is visited.

```cpp
void inorder(TreeNode* r, vector<int>& out) {      // Left, Node, Right
    if (!r) return;
    inorder(r->left, out); out.push_back(r->val); inorder(r->right, out);
}
void preorder(TreeNode* r, vector<int>& out) {     // Node, Left, Right
    if (!r) return;
    out.push_back(r->val); preorder(r->left, out); preorder(r->right, out);
}
void postorder(TreeNode* r, vector<int>& out) {    // Left, Right, Node
    if (!r) return;
    postorder(r->left, out); postorder(r->right, out); out.push_back(r->val);
}
```

The fourth is breadth-first — level order — and needs a queue rather than recursion:

```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> res;
    if (!root) return res;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = q.size();                    // FIX the size before the inner loop
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

Capturing `q.size()` before the inner loop is what separates the levels. Without it, the loop
consumes nodes from the next level too.

**Iterative inorder**, which interviewers ask for specifically:

```cpp
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

**The bottom-up pattern**, which solves most medium tree problems:

```cpp
int best = INT_MIN;
int dfs(TreeNode* r) {                        // returns the best DOWNWARD value from r
    if (!r) return 0;
    int l  = max(0, dfs(r->left));            // clamp: a negative branch is skipped
    int rt = max(0, dfs(r->right));
    best = max(best, r->val + l + rt);        // answer THROUGH r — uses both children
    return r->val + max(l, rt);               // value UP from r — only one child can extend
}
```

The split between *the answer at this node* and *the value returned to the parent* is the pattern.
Diameter, maximum path sum and the balanced check are all this skeleton with different bodies.

**Complexity.** Every traversal is O(n) time. Space is O(h) for the recursion stack, which is
O(log n) for a balanced tree and O(n) for a degenerate one. Level order is O(w) space where w is
the maximum width, up to n/2 for a perfect tree.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why level order needs the size snapshot.** The queue holds a mixture of levels at any instant.
Capturing `q.size()` before the inner loop fixes the boundary, because exactly that many nodes
belong to the current level. Reading `q.size()` inside the loop sees it grow as children are
pushed and merges the levels.

Once you have level order, several problems become one-line variants: right view is the last
element of each level, left view the first, maximum width a comparison of first and last indices,
and minimum depth the first level containing a leaf — which is why BFS beats DFS for minimum depth
on a skewed tree.

**Iterative postorder.** Preorder and inorder have natural stack forms; postorder is awkward
because the node must be emitted after both subtrees. Two routes:

- *Two stacks.* Run a modified preorder visiting Node, Right, Left, pushing results onto a second
  stack. Popping it gives Left, Right, Node.
- *One stack.* Track the last visited node and only emit the current one when its right child is
  absent or already visited.

The two-stack version is easier to reproduce under pressure; know that the one-stack version
exists.

**Uniqueness of reconstruction.** Preorder alone does not determine a tree. Preorder plus inorder
does: preorder's first element is the root, and its position in inorder splits the remaining
elements into left and right subtrees. Postorder plus inorder works the same way, consuming
postorder from the end and building the right subtree before the left. **Preorder plus postorder
does not** uniquely determine a general binary tree — it cannot distinguish a single left child
from a single right child — though it does for full binary trees.

Building naively costs O(n²) because each recursive call searches inorder for the root. A hash map
from value to inorder index makes each lookup O(1) and the whole construction O(n). This assumes
distinct values, which the constraints usually guarantee.

**Serialisation.** A preorder walk emitting a sentinel for null children is sufficient to
reconstruct the tree, because the sentinels encode the shape that preorder alone lacks. Level-order
serialisation with sentinels works equally well and is what LeetCode's own test format uses.

**Lowest common ancestor.** In a general binary tree, recurse: if the current node is null or
equals either target, return it. Recurse into both children. If both return non-null, the current
node is the LCA; otherwise propagate whichever is non-null. This is O(n) and assumes both nodes
exist — if that is not guaranteed, a second verification pass is needed.

For repeated queries, preprocess with binary lifting for O(log n) per query, or Euler tour plus
sparse table for O(1) after O(n log n) setup.

**Morris traversal** achieves inorder in O(1) space by temporarily threading each node's
predecessor's right pointer to it, then undoing the thread on the way back. It is the answer to
"traverse without recursion or a stack" and it mutates the tree during traversal, which matters in
concurrent contexts.

**Why the bottom-up clamp at zero.** In maximum path sum, a subtree contributing a negative total
should be excluded rather than included, and `max(0, dfs(child))` expresses exactly that. Omitting
the clamp forces every path through negative regions and gives wrong answers on trees with negative
values.

**Recursion depth is a real constraint.** A degenerate tree of 10⁵ nodes recurses 10⁵ deep, which
overflows the default 1 MB stack. Where the constraints permit such a tree, an iterative traversal
is not a stylistic preference but a correctness requirement.

**The grilling chain.**

- *Traverse inorder without recursion.* — Explicit stack; then Morris for O(1) space.
- *Reconstruct a tree from traversals — which pairs suffice?* — Preorder+inorder and
  postorder+inorder; preorder+postorder only for full trees.
- *Why is your reconstruction O(n) and not O(n²)?* — The value-to-index hash map.
- *Minimum depth — DFS or BFS?* — BFS, because it can stop at the first leaf instead of exploring
  a long branch.
- *Find the LCA with parent pointers available.* — Walk both up to equal depth, then together; or
  use a set of one node's ancestors.
- *Your recursion is 10⁵ deep.* — Stack overflow; convert to iteration.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**The three DFS traversals**

You are exploring a building where every room has two doors leading to smaller rooms. The route you
walk is identical in all three cases. The only difference is **when you write down the room's name**
— on the way in, between the two doors, or on the way out.

Preorder writes on entry. Inorder writes between. Postorder writes on the way out. Same walk, three
different logs.

**Level order versus depth first**

Depth first is one person walking the whole building, going as deep as possible before backing up.

Level order is a search party: everyone on the ground floor reports in, then everyone on the first
floor, then the second. You learn about the whole of each floor before anything below it.

That is why level order finds the shallowest leaf first, and depth first might walk a very long
corridor before noticing a short one nearby.

**The bottom-up return value**

A manager asks each team for one number — their best single result. But the manager's own report to
the board can combine two teams' results, which no individual team could claim.

So each node reports one thing upward and records something bigger locally. Confusing the two is
the most common tree bug there is.

**Why preorder alone is not enough**

Someone reads you a list of names in the order they entered a building. You cannot redraw the
floor plan from that alone — you do not know who went left and who went right.

Add a second list in a different order, and the two together pin down the layout exactly.

</details>

### Binary search trees

[Striver: BST](https://www.youtube.com/watch?v=p7-9UvDQZ3w)

<!-- theory-id:t-bst -->

<details open>
<summary><b>Part 1 — The topic, in breadth</b></summary>

**What it is.** A binary search tree adds one invariant to a binary tree: for every node, all
values in its left subtree are smaller and all values in its right subtree are larger. That single
rule turns an unordered hierarchy into a searchable one, because at each node you can discard an
entire subtree.

**The consequence that solves most problems:** an inorder traversal of a BST yields the values in
sorted order. Any problem phrased as "the kth smallest", "the closest value", "validate", "find the
mode" or "convert to a sorted list" is an inorder traversal with a small amount of bookkeeping.

**Search, insert, delete.**

```cpp
TreeNode* search(TreeNode* r, int key) {
    while (r && r->val != key) r = key < r->val ? r->left : r->right;
    return r;
}

TreeNode* insert(TreeNode* r, int key) {
    if (!r) return new TreeNode(key);
    if (key < r->val) r->left  = insert(r->left,  key);
    else              r->right = insert(r->right, key);
    return r;
}

TreeNode* deleteNode(TreeNode* r, int key) {
    if (!r) return nullptr;
    if      (key < r->val) r->left  = deleteNode(r->left,  key);
    else if (key > r->val) r->right = deleteNode(r->right, key);
    else {
        if (!r->left)  return r->right;        // 0 or 1 child: splice
        if (!r->right) return r->left;
        TreeNode* s = r->right;                // 2 children: inorder successor
        while (s->left) s = s->left;
        r->val = s->val;
        r->right = deleteNode(r->right, s->val);
    }
    return r;
}
```

Deletion has three cases and the two-child case is the only interesting one: replace the node's
value with its inorder successor — the smallest value in the right subtree — then delete that
successor, which by construction has at most one child.

**Validation.** The common wrong answer compares each node only against its parent. That accepts
invalid trees, because a node deep in a left subtree must be smaller than every ancestor above it,
not just its immediate parent. The correct check carries a range downward:

```cpp
bool validate(TreeNode* r, long lo, long hi) {
    if (!r) return true;
    if (r->val <= lo || r->val >= hi) return false;
    return validate(r->left, lo, r->val) && validate(r->right, r->val, hi);
}
// call with LONG_MIN, LONG_MAX — long, not int, or a node holding INT_MIN breaks it
```

**Lowest common ancestor** is far simpler than in a general binary tree. Walk down from the root:
if both targets are smaller, go left; if both larger, go right; otherwise the current node is the
split point and therefore the LCA. O(h) with no recursion needed.

**Complexity.**

| Operation | Balanced | Degenerate |
|---|---|---|
| search / insert / delete | O(log n) | O(n) |
| inorder traversal | O(n) | O(n) |
| kth smallest | O(h + k) | O(n) |
| min / max | O(log n) | O(n) |

Every bound is O(h), and h is O(log n) only if the tree is balanced. A BST built by inserting
already-sorted data degenerates into a linked list, which is why self-balancing variants exist.

**Self-balancing.** `std::set` and `std::map` are red-black trees: a BST with colour invariants
guaranteeing that the longest root-to-leaf path is at most twice the shortest, which bounds the
height at O(log n). AVL trees balance more strictly — heights differ by at most one — giving faster
lookups but more rotations on insertion.

</details>

<details>
<summary><b>Part 2 — Interview depth</b></summary>

**Why range-based validation is required.** Consider a root of 10 with left child 5 and that node's
right child 12. A parent-only check passes at every step: 5 < 10 and 12 > 5. But 12 sits in the
root's left subtree and exceeds 10, so the tree is invalid. The range formulation carries the
ancestor constraint downward, which is exactly the information a parent comparison discards.

Use `long` bounds, or sentinel values equal to `INT_MIN`/`INT_MAX` fail on a tree containing those
values. The alternative formulation — an inorder traversal checking strict increase — avoids
sentinels entirely and is arguably cleaner.

**Kth smallest, and the follow-up.** Inorder with an early stop is O(h + k). If the tree is
modified frequently and this query is common, augment each node with its subtree size; then
descending is O(h) per query, because at each node you know how many values lie in its left
subtree. Augmentation is the general technique — an order-statistic tree — and it is what the
interviewer is fishing for.

**Recover BST with two swapped nodes.** An inorder traversal of a valid BST is strictly increasing,
so a swap creates one or two descents. If the swapped nodes are adjacent in inorder there is one
descent; otherwise two. Record the first element of the first descent and the second element of the
last descent, then swap their values. Morris traversal makes it O(1) space, which is the stated
follow-up.

**Construct from preorder.** The first element is the root, and everything following it that is
smaller belongs to the left subtree. A naive split is O(n²) on a degenerate tree. Carrying an upper
bound down the recursion makes it O(n): consume elements while they remain below the bound. The
same bound idea that validates a BST also constructs one.

**Unique BSTs.** The number of structurally distinct BSTs on n nodes is the nth Catalan number,
because choosing a root splits the remaining nodes into a left group and a right group whose counts
multiply, summed over every root choice. That recurrence, `C(n) = Σ C(i)·C(n-1-i)`, is the Catalan
definition. Counting is O(n²) DP; generating them all is exponential.

**Successor and predecessor.** The inorder successor of a node with a right child is the minimum of
that subtree. Without a right child, it is the lowest ancestor for which the node lies in the left
subtree — found by walking from the root and recording the last node taken leftward. With parent
pointers it is a walk upward instead.

**Why BSTs degenerate, and what the standard library does about it.** Inserting sorted data into a
plain BST produces a chain of height n. Red-black trees fix this by recolouring and rotating on
insert and delete, keeping the height within 2·log(n+1). AVL trees maintain a stricter invariant,
so lookups are faster but modifications do more work. `std::set` chooses red-black because
insertion-heavy workloads are more common.

**When a BST is the wrong choice.** If you only need membership testing with no ordering, a hash
table is O(1) average against the BST's O(log n). The BST earns its keep when you need sorted
iteration, range queries, `lower_bound`, or predecessor and successor — which a hash table cannot
provide at any price.

**The grilling chain.**

- *Validate a BST.* — Range propagation; explain why parent comparison fails, with a counterexample.
- *Kth smallest, with frequent modifications.* — Augment nodes with subtree sizes.
- *Recover a BST with two swapped nodes in O(1) space.* — Inorder descents plus Morris traversal.
- *Why is your BST O(n) in the worst case?* — Degeneracy on sorted input; name red-black and AVL.
- *How many structurally distinct BSTs on n nodes?* — Catalan; derive the recurrence.
- *BST or hash table here?* — Whether the problem needs ordering. Say which operation decides it.

</details>

<details>
<summary><b>Part 3 — If something above did not land</b></summary>

**The BST invariant**

A well-organised filing cabinet. At the front drawer you decide: earlier in the alphabet, go left;
later, go right. You never open the other side, so half the cabinet disappears with each decision.

Compare that to a drawer where papers were dropped in as they arrived. There, you check every
sheet.

**Why comparing against the parent is not enough**

A company rule says every employee earns less than their manager. You check each person against
their own manager and everything looks fine.

But someone three levels down in the finance branch might still earn more than the CEO, and nobody
compared them directly. The rule was never just about your manager — it was about everyone above
you.

**Why a BST degenerates**

Filing papers into the cabinet in perfect alphabetical order. Every new sheet goes after the last
one, so instead of a branching structure you build one long chain.

The cabinet still works. It has just become a single very deep drawer, and finding anything means
walking the whole thing.

**Inorder gives sorted order**

Reading a family tree by always visiting the whole left branch, then the person, then the whole
right branch. Because everyone on the left is smaller and everyone on the right is larger, the
names come out in order without you ever sorting anything.

That is why so many BST problems turn out to be "do an inorder walk and count".

</details>

## Problems

### Day 14

*15 problems — 7 core, 7 drill, 1 skim.*

#### `[CORE]` 1. Binary Tree Inorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 94

<!-- id:binary-trees-binary-tree-inorder-traversal | order:1 | day:14 | pattern:dfs-traversal | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-inorder-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/inorder-traversal-of-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Z_NEgBgbRVI)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `dfs-traversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The recursive version is three lines and is not what is being tested. The iterative version with an explicit stack is, because it forces you to make the recursion's hidden state visible - and inorder is the one where that state is least obvious.

**Trick.** Dive left pushing every node, then pop, emit, and move right. The outer loop condition is `cur || !st.empty()`, which is what lets the walk resume after a subtree is exhausted.

**Edge cases that bite.**

- The loop must continue while EITHER cur is non-null or the stack is non-empty.
- Empty tree returns an empty list.
- Morris traversal gives O(1) space and is the real follow-up.

**Complexity.** `O(n)` time, `O(h), or O(1) with Morris` space — every node is pushed and popped once. Stack depth is the tree height, which is O(n) for a degenerate tree.

**Same pattern.** [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/), [Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)

**Interview follow-ups.**

- **Q.** Do it in O(1) space.
  <br>**A.** Morris traversal: thread each node's inorder predecessor's right pointer to it, follow the thread, then undo it. The tree is temporarily mutated, which matters under concurrency.
- **Q.** Why does inorder matter more than the other two?
  <br>**A.** On a BST it yields sorted order, which turns validation, kth-smallest, mode-finding and recovery into linear scans.

</details>

#### `[CORE]` 2. Binary Tree Level Order Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 102

<!-- id:binary-trees-binary-tree-level-order-traversal | order:4 | day:14 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-level-order-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/level-order-traversal-of-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=EoAsWbO7sqg)

**Asked by:** Amazon, Microsoft, Facebook, LinkedIn, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Capturing the queue size before the inner loop is what separates one level from the next. That single line converts a flat BFS into a grouped one, and a dozen other problems are variations on it.

**Trick.** `int sz = q.size();` before the inner for-loop. Reading q.size() inside the loop sees it grow as children are pushed and merges the levels.

**Edge cases that bite.**

- Null root returns empty, not a list containing an empty level.
- Only non-null children are enqueued.
- The size snapshot must be taken outside the inner loop.

**Complexity.** `O(n)` time, `O(w) where w is the maximum width` space — every node is enqueued and dequeued once. The queue holds at most one level, which reaches n/2 for a perfect tree.

**Same pattern.** [Binary Tree Level Order Traversal II](https://leetcode.com/problems/binary-tree-level-order-traversal-ii/), [Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/), [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/), [Average of Levels in Binary Tree](https://leetcode.com/problems/average-of-levels-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Right side view, left view, maximum width, deepest leaves sum.
  <br>**A.** All one-line variants: last of each level, first of each level, index arithmetic per level, and the last level's sum. Learn this template and four problems come free.
- **Q.** Minimum depth - BFS or DFS?
  <br>**A.** BFS, because it stops at the first leaf. DFS may explore a 10^5-deep branch before finding a leaf at depth 2.

</details>

#### `[CORE]` 3. Maximum Depth of Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 104

<!-- id:binary-trees-maximum-depth-of-binary-tree | order:7 | day:14 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-depth-of-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=eD3tmO66aBA)

**Asked by:** Amazon, Microsoft, Google, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The gentlest possible instance of the bottom-up pattern: a node's answer is one more than the best of its children's answers. Every harder tree problem is this skeleton with a more interesting body.

**Trick.** `return r ? 1 + max(depth(left), depth(right)) : 0;`. The null base case returning 0 is what makes the arithmetic work without special-casing leaves.

**Edge cases that bite.**

- Null returns 0, so a leaf correctly returns 1.
- Depth counts nodes here, not edges - check the definition each time.
- A 10^5-deep degenerate tree overflows the recursion stack.

**Complexity.** `O(n)` time, `O(h)` space — every node is visited once; stack depth is the height.

**Same pattern.** [Minimum Depth of Binary Tree](https://leetcode.com/problems/minimum-depth-of-binary-tree/), [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/), [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Maximum Depth of N-ary Tree](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/)

**Interview follow-ups.**

- **Q.** Minimum depth - is it symmetric?
  <br>**A.** No. A node with one null child has no path through that side, so `min` would wrongly return 1. You must take the non-null child's depth, or use BFS.
- **Q.** Do it iteratively.
  <br>**A.** BFS counting levels, or DFS with an explicit stack of (node, depth) pairs.

</details>

#### `[CORE]` 4. Minimum Depth of Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 111

<!-- id:binary-trees-minimum-depth-of-binary-tree | order:8 | day:14 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-depth-of-binary-tree/)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** This looks like maximum depth with min swapped in, and that is wrong. A node with one null child has no root-to-leaf path through the null side, so taking the minimum incorrectly returns 1 for a long chain.

**Trick.** Either handle the one-child case explicitly, or use BFS and return at the first leaf - which is strictly better, since it stops early instead of exploring the whole tree.

**Edge cases that bite.**

- A node with exactly one child must take that child's depth, not 0.
- BFS stops at the first leaf; DFS must explore everything.
- Null root returns 0.

**Complexity.** `O(n) worst, far less with BFS on a skewed tree` time, `O(w) for BFS, O(h) for DFS` space — BFS reaches the shallowest leaf first and can return immediately, whereas DFS may walk a 10^5-deep branch before finding a leaf at depth 2.

**Same pattern.** [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/), [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/)

**Interview follow-ups.**

- **Q.** Why is min not symmetric with max?
  <br>**A.** Maximum depth is well defined through any child. Minimum depth requires a path ending at a LEAF, and a null child is not a leaf.
- **Q.** When is BFS clearly better here?
  <br>**A.** A tree that is a long left chain with a leaf near the root. BFS answers in two levels; DFS walks the entire chain first.

</details>

#### `[CORE]` 5. Symmetric Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 101

<!-- id:binary-trees-symmetric-tree | order:10 | day:14 | pattern:mirror-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/symmetric-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-for-symmetrical-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=nKggNAiEpBE)

**Asked by:** Amazon, Microsoft, LinkedIn, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `mirror-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A tree is symmetric when its left subtree mirrors its right. The recursion therefore takes two nodes and compares left-against-right crosswise - which is Same Tree with one pair of arguments swapped.

**Trick.** `mirror(a,b)` returns `a->val == b->val && mirror(a->left, b->right) && mirror(a->right, b->left)`. The crossing in the two recursive calls is the whole difference.

**Edge cases that bite.**

- Compare a->left with b->right, NOT b->left. Getting this wrong tests identity instead of symmetry.
- Both null is true; one null is false.
- A single node is symmetric.

**Complexity.** `O(n)` time, `O(h)` space — each pair of mirrored nodes is compared once.

**Same pattern.** [Same Tree](https://leetcode.com/problems/same-tree/), [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/), [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/)

**Interview follow-ups.**

- **Q.** Do it iteratively.
  <br>**A.** A queue holding pairs of nodes, enqueued in mirrored order. The pairing is what preserves the crossing.
- **Q.** How does this relate to Invert Binary Tree?
  <br>**A.** A tree is symmetric exactly when it equals its own inversion. You could invert and compare, though that mutates or copies unnecessarily.

</details>

#### `[CORE]` 6. Balanced Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 110

<!-- id:binary-trees-balanced-binary-tree | order:12 | day:14 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/balanced-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-the-binary-tree-is-balanced-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Yt50Jfbd8Po)

**Asked by:** Amazon, Microsoft, Google, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Computing height at every node and checking balance separately is O(n^2). The bottom-up fix is to return the height AND signal imbalance in the same value - conventionally -1 for 'already unbalanced below here'.

**Trick.** Return -1 to propagate failure. Any child returning -1 short-circuits immediately, so the whole check is a single traversal.

**Edge cases that bite.**

- -1 must propagate upward without further computation.
- Balance is defined per node, not globally - every node's subtrees must differ by at most 1.
- Null returns 0.

**Complexity.** `O(n)` time, `O(h)` space — one traversal computing heights, versus O(n^2) for recomputing height at every node. The sentinel is what fuses the two questions into one pass.

**Same pattern.** [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/), [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Check Completeness of a Binary Tree](https://leetcode.com/problems/check-completeness-of-a-binary-tree/)

**Interview follow-ups.**

- **Q.** Why is the naive version O(n^2)?
  <br>**A.** Height at the root costs O(n), and it is recomputed at every node. On a degenerate tree that is n calls of O(n) work.
- **Q.** Return the height instead of a boolean.
  <br>**A.** That is the point of the sentinel - one return value answers both questions, which is the general trick for fusing two tree traversals.

</details>

#### `[CORE]` 7. Diameter of Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 543

<!-- id:binary-trees-diameter-of-binary-tree | order:13 | day:14 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/diameter-of-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/calculate-the-diameter-of-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=Rezetez59Nk)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The diameter through a node is leftHeight + rightHeight, but the value returned to the parent is 1 + max(leftHeight, rightHeight). Confusing those two is the single most common bug in tree problems, and this is where you learn the distinction.

**Trick.** Update a global best with l + r inside the recursion, but return 1 + max(l, r). The answer through a node uses BOTH children; the value that can extend upward uses only one.

**Edge cases that bite.**

- The diameter counts EDGES, so it is l + r rather than l + r + 1.
- The longest path need not pass through the root.
- A single node has diameter 0.

**Complexity.** `O(n)` time, `O(h)` space — one traversal, with each node contributing a constant-time update. Computing height separately at each node is O(n^2).

**Same pattern.** [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Longest Univalue Path](https://leetcode.com/problems/longest-univalue-path/), [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/), [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)

**Interview follow-ups.**

- **Q.** Why can't you just return the diameter?
  <br>**A.** The diameter through a node uses both subtrees and therefore cannot be extended by the parent. The parent needs a one-sided value. Two different quantities, one traversal.
- **Q.** Maximum path sum instead of length.
  <br>**A.** LC 124 - same skeleton, but clamp negative child contributions at zero, since excluding a negative subtree is always allowed.

</details>

#### `[DRILL]` 8. Binary Tree Preorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 144

<!-- id:binary-trees-binary-tree-preorder-traversal | order:2 | day:14 | pattern:dfs-traversal | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-preorder-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/preorder-traversal-of-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=RlUu72JrOCQ)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dfs-traversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Preorder is the easiest to write iteratively because the node is emitted on arrival, so no state needs to be deferred. Push right before left, since the stack reverses order.

**Trick.** Push the root. Pop, emit, then push right then left. The reversal is the entire subtlety.

**Edge cases that bite.**

- Push right BEFORE left, or the traversal comes out mirrored.
- Null children must not be pushed.
- Empty tree returns empty.

**Complexity.** `O(n)` time, `O(h)` space — each node enters and leaves the stack once.

**Same pattern.** [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/), [N-ary Tree Preorder Traversal](https://leetcode.com/problems/n-ary-tree-preorder-traversal/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)

**Interview follow-ups.**

- **Q.** Why push right before left?
  <br>**A.** A stack emits in reverse insertion order, so pushing right first means left is popped first - which is the order preorder requires.
- **Q.** Preorder is used for serialisation. Why?
  <br>**A.** It emits the root first, so reconstruction can build top-down. With null sentinels it uniquely determines the tree.

</details>

#### `[DRILL]` 9. Binary Tree Postorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 145

<!-- id:binary-trees-binary-tree-postorder-traversal | order:3 | day:14 | pattern:dfs-traversal | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-postorder-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/iterative-postorder-traversal-of-binary-tree-using-2-stack) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=2YBhNLodD8Q)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `dfs-traversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Postorder is the awkward one iteratively, because the node must be emitted after BOTH subtrees. The trick that sidesteps all the bookkeeping is to run a modified preorder and reverse the result.

**Trick.** Do preorder as Node, Right, Left - then reverse. That sequence reversed is Left, Right, Node, which is postorder exactly.

**Edge cases that bite.**

- The modified preorder pushes LEFT before right, the opposite of normal preorder.
- Reversing at the end is O(n) and unavoidable in this formulation.
- The genuine one-stack version tracks the last visited node - know it exists.

**Complexity.** `O(n)` time, `O(h)` space — one traversal plus one reversal, both linear.

**Same pattern.** [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/), [N-ary Tree Postorder Traversal](https://leetcode.com/problems/n-ary-tree-postorder-traversal/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

**Interview follow-ups.**

- **Q.** Write the genuine one-stack version.
  <br>**A.** Track the last node emitted. Emit the current node only when its right child is null or was the last emitted; otherwise descend right.
- **Q.** Where is postorder actually needed?
  <br>**A.** Anywhere a node's answer depends on its children - deletion, subtree sums, height, and every bottom-up DP on trees.

</details>

#### `[DRILL]` 10. Binary Tree Zigzag Level Order Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 103

<!-- id:binary-trees-binary-tree-zigzag-level-order-traversal | order:6 | day:14 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/zig-zag-traversal-of-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=3OXWEdlIGl4)

**Asked by:** Amazon, Microsoft, Facebook, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Do not change the traversal. Do the normal BFS and reverse alternate levels - trying to enqueue children in alternating order is a classic wrong turn that produces subtly incorrect output.

**Trick.** Keep a boolean that flips each level. Reverse the level vector before appending when it is set. Enqueue order never changes.

**Edge cases that bite.**

- Flipping the enqueue order instead of the output order gives wrong answers beyond depth 2.
- The first level is left-to-right by convention.
- Reversing in place with std::reverse is O(level size).

**Complexity.** `O(n)` time, `O(w)` space — one BFS plus reversals totalling O(n) across all levels.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Binary Tree Level Order Traversal II](https://leetcode.com/problems/binary-tree-level-order-traversal-ii/), [Vertical Order Traversal of a Binary Tree](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/)

**Interview follow-ups.**

- **Q.** Why does flipping the enqueue order fail?
  <br>**A.** Reversing the order children are pushed also reverses their children's relative positions, so the error compounds with depth instead of cancelling.
- **Q.** Do it with two stacks instead.
  <br>**A.** One stack per direction, pushing children in the order the next direction needs. Works, but is harder to get right than reversing the output.

</details>

#### `[DRILL]` 11. Same Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 100

<!-- id:binary-trees-same-tree | order:9 | day:14 | pattern:parallel-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/same-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/check-if-two-trees-are-identical/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=BhuvF_-PWS0)

**Asked by:** Amazon, Microsoft, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `parallel-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Recurse on two trees simultaneously. The base cases carry all the weight: both null is true, exactly one null is false, and different values is false. Get those three right and the recursive step is one line.

**Trick.** `if (!p && !q) return true; if (!p || !q) return false; return p->val == q->val && same(p->left,q->left) && same(p->right,q->right);` - in that exact order.

**Edge cases that bite.**

- Both null must be checked before either-null, or you return false for two empty trees.
- Structure matters as much as values - same values in a different shape is false.
- Short-circuit evaluation means unequal values stop the recursion early.

**Complexity.** `O(n)` time, `O(h)` space — each pair of nodes is compared once, stopping early on any mismatch.

**Same pattern.** [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/), [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/), [Leaf-Similar Trees](https://leetcode.com/problems/leaf-similar-trees/), [Merge Two Binary Trees](https://leetcode.com/problems/merge-two-binary-trees/)

**Interview follow-ups.**

- **Q.** Symmetric tree.
  <br>**A.** The same parallel recursion, but compare left against right and right against left - a mirror rather than an identity.
- **Q.** Subtree of another tree.
  <br>**A.** Run this check at every node of the larger tree. O(n*m) naively; serialise both and use KMP for O(n+m).

</details>

#### `[DRILL]` 12. Invert Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 226

<!-- id:binary-trees-invert-binary-tree | order:11 | day:14 | pattern:structural-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/invert-binary-tree/)

**Asked by:** Google, Amazon, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `structural-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Swap every node's children. Three lines, and famous only because of the story about its author failing an interview on it. The value here is that it is the simplest possible structural mutation.

**Trick.** Swap left and right, then recurse into both. Order does not matter - recurse first or swap first, both work, because the swap is local.

**Edge cases that bite.**

- Null returns null.
- The tree is mutated in place; return the root.
- An iterative BFS version is equally short.

**Complexity.** `O(n)` time, `O(h)` space — every node is visited once and performs a constant-time swap.

**Same pattern.** [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/), [Same Tree](https://leetcode.com/problems/same-tree/), [Binary Tree Pruning](https://leetcode.com/problems/binary-tree-pruning/), [Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/)

**Interview follow-ups.**

- **Q.** Does it matter whether you swap before or after recursing?
  <br>**A.** No. The swap only affects the node's own two pointers, and the recursive calls operate on whole subtrees regardless of which side they now hang from.
- **Q.** Iterative version.
  <br>**A.** BFS with a queue, swapping each dequeued node's children before enqueuing them.

</details>

#### `[DRILL]` 13. Binary Tree Paths &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 257

<!-- id:binary-trees-binary-tree-paths | order:14 | day:14 | pattern:path-accumulation | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-paths/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `path-accumulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Carry the path down rather than reconstructing it on the way up. Passing the accumulated string by value is simple but copies at every node; passing a vector by reference with an explicit pop is the pattern that scales to harder path problems.

**Trick.** Push the node, recurse, pop. Emit only at a leaf - a node with both children null, not merely a null node, or you emit each path twice.

**Edge cases that bite.**

- A leaf is a node with BOTH children null. Recursing into nulls and emitting there duplicates every path.
- Null root returns empty.
- The pop after recursion is the backtrack; omitting it corrupts sibling paths.

**Complexity.** `O(n · h)` time, `O(h)` space — n nodes, each path costing O(h) to format. The path vector is bounded by the height.

**Same pattern.** [Path Sum](https://leetcode.com/problems/path-sum/), [Path Sum II](https://leetcode.com/problems/path-sum-ii/), [Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/), [Smallest String Starting From Leaf](https://leetcode.com/problems/smallest-string-starting-from-leaf/)

**Interview follow-ups.**

- **Q.** Why check for a leaf rather than recursing into null?
  <br>**A.** A node with one child would otherwise emit a path ending at the null side, producing duplicates and paths that do not end at a leaf.
- **Q.** Sum root-to-leaf numbers.
  <br>**A.** LC 129 - carry an integer built as `cur * 10 + val` instead of a string. Same skeleton, cheaper accumulation.

</details>

#### `[DRILL]` 14. Path Sum &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 112

<!-- id:binary-trees-path-sum | order:15 | day:14 | pattern:path-accumulation | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/path-sum/)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `path-accumulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Subtract as you descend rather than accumulating and comparing at the leaf. It reads more cleanly and the leaf test becomes 'does the remainder equal this node's value'.

**Trick.** At a leaf, return `target == r->val`. Recurse with `target - r->val` into both children and OR the results.

**Edge cases that bite.**

- Negative values mean you cannot prune on the remainder going negative.
- The path must END at a leaf - a partial path summing correctly does not count.
- Null root returns false even when the target is 0.

**Complexity.** `O(n)` time, `O(h)` space — each node is visited at most once, with early exit on the first matching path.

**Same pattern.** [Path Sum II](https://leetcode.com/problems/path-sum-ii/), [Path Sum III](https://leetcode.com/problems/path-sum-iii/), [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/)

**Interview follow-ups.**

- **Q.** Return all such paths.
  <br>**A.** LC 113 - carry the path vector and push a copy at every successful leaf. Backtrack with a pop after each recursive call.
- **Q.** Paths that need not start at the root or end at a leaf.
  <br>**A.** LC 437 - prefix sums in a hash map along the current root-to-node path, which is the tree version of Subarray Sum Equals K.

</details>

#### `[SKIM]` 15. Binary Tree Level Order Traversal II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 107

<!-- id:binary-trees-binary-tree-level-order-traversal-ii | order:5 | day:14 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-level-order-traversal-ii/)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Identical to level order with the output reversed. The only decision worth making is whether to reverse at the end or insert at the front, and insertion at the front of a vector is O(n) per level.

**Trick.** Build normally, then reverse once. Using `insert(begin(), ...)` per level is O(n^2) in the number of levels.

**Edge cases that bite.**

- Reverse the outer vector, not the individual levels.
- Empty tree returns empty.
- A deque with push_front is the alternative that avoids both costs.

**Complexity.** `O(n)` time, `O(w)` space — one BFS plus one reversal of the level list.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/), [Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/)

**Interview follow-ups.**

- **Q.** Why is insert-at-front worse?
  <br>**A.** std::vector::insert at the beginning shifts every existing element, so building L levels that way costs O(L^2) rather than O(L).

</details>

### Day 14 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The three DFS traversals differ only in when the node is emitted.** The walk is identical. Preorder writes on arrival, inorder between the two children, postorder on the way out. Which one a problem needs follows from when the node's answer becomes known.
  <br>↳ *Binary Tree Inorder Traversal* — the dive-left-then-pop-and-go-right stack loop; *Binary Tree Preorder Traversal* — emitting on arrival, pushing right before left; *Binary Tree Postorder Traversal* — reversing a node-right-left preorder
- **Capture the queue size before the level loop.** The queue holds a mixture of levels at any instant. Snapshotting its size fixes the boundary; reading it inside the loop sees it grow as children are pushed and merges the levels.
  <br>↳ *Binary Tree Level Order Traversal* — int sz = q.size() outside the inner for-loop; *Binary Tree Zigzag Level Order Traversal* — the same snapshot, with alternate levels reversed on output rather than on enqueue
- **Return one value upward, accumulate another locally.** The answer AT a node often uses both children, but the value a parent can extend uses only one. Conflating them is the most common bug in tree problems.
  <br>↳ *Diameter of Binary Tree* — best gets l + r, but the return is 1 + max(l, r); *Balanced Binary Tree* — returning -1 as a failure sentinel alongside the height; *Maximum Depth of Binary Tree* — the simplest instance, where the two happen to coincide
- **Parallel recursion compares or combines two trees at once.** Recurse on a pair of nodes rather than one. The base cases - both null, one null, values differ - carry all the weight, and the recursive step is a single line.
  <br>↳ *Same Tree* — checking both-null before either-null, then values, then both subtrees; *Symmetric Tree* — the same recursion with the two recursive calls crossed over
- **Minimum depth is not maximum depth with min substituted.** A node with one null child has no root-to-leaf path through the null side, so min would wrongly return 1. BFS sidesteps it entirely and stops at the first leaf.
  <br>↳ *Minimum Depth of Binary Tree* — using BFS, or explicitly handling the one-child case; *Maximum Depth of Binary Tree* — where max needs no such special case
- **Emit at a leaf, not at a null.** A leaf is a node with both children null. Recursing into nulls and emitting there produces duplicate paths for every one-child node.
  <br>↳ *Binary Tree Paths* — testing for both children null before appending the path; *Path Sum* — returning target == r->val only at a genuine leaf

### Day 15

*12 problems — 1 core, 3 drill, 8 skim.*

#### `[CORE]` 1. Subtree of Another Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 572

<!-- id:binary-trees-subtree-of-another-tree | order:16 | day:15 | pattern:nested-tree-match | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/subtree-of-another-tree/)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `nested-tree-match`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Run Same Tree at every node of the larger tree. The naive bound is O(n*m), and the follow-up - serialise both with null sentinels and run KMP - is what makes this worth doing rather than a duplicate of Same Tree.

**Trick.** At each node, if values match, try a full Same Tree comparison; otherwise recurse into both children. An early value check avoids most of the expensive comparisons.

**Edge cases that bite.**

- An empty subRoot is trivially a subtree.
- The match must be complete - a partial structural match does not count.
- Serialisation must include null sentinels, or [1,2] and [1,null,2] serialise identically.

**Complexity.** `O(n·m) naive, O(n+m) with serialisation` time, `O(h) or O(n+m)` space — each of n nodes may trigger an O(m) comparison. Serialising both trees turns it into substring search, which KMP does in linear time.

**Same pattern.** [Same Tree](https://leetcode.com/problems/same-tree/), [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/), [Leaf-Similar Trees](https://leetcode.com/problems/leaf-similar-trees/)

**Interview follow-ups.**

- **Q.** Make it O(n + m).
  <br>**A.** Serialise both trees in preorder with null sentinels and delimiters, then run KMP. The sentinels are what make the serialisation injective.
- **Q.** Why are delimiters needed as well as sentinels?
  <br>**A.** Without them, values 1 and 12 are indistinguishable from 1,2 in the flattened string.

</details>

#### `[DRILL]` 2. Merge Two Binary Trees &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 617

<!-- id:binary-trees-merge-two-binary-trees | order:17 | day:15 | pattern:parallel-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/merge-two-binary-trees/)

**Asked by:** Amazon, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `parallel-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Parallel recursion again, but constructive rather than comparative. When one side is null, the whole opposing subtree is the answer - returning it wholesale rather than copying node by node is both simpler and faster.

**Trick.** `if (!a) return b; if (!b) return a;` then build a new node with the sum and recurse. Two lines handle every null case.

**Edge cases that bite.**

- Returning the existing subtree shares nodes between input and output - fine here, but worth stating if mutation matters.
- Both null returns null, which the first check handles.
- Values may be negative; the sum is unconditional.

**Complexity.** `O(min(n, m))` time, `O(h)` space — recursion stops as soon as either tree runs out, so only the overlapping region is traversed.

**Same pattern.** [Same Tree](https://leetcode.com/problems/same-tree/), [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/), [Maximum Binary Tree](https://leetcode.com/problems/maximum-binary-tree/), [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/)

**Interview follow-ups.**

- **Q.** Merge in place into the first tree.
  <br>**A.** Assign into a->left and a->right rather than allocating. Saves memory but destroys the input, which the caller may not expect.
- **Q.** Why is it O(min(n,m)) and not O(n+m)?
  <br>**A.** Once one tree is exhausted the other is returned whole without traversal.

</details>

#### `[DRILL]` 3. Binary Tree Tilt &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 563

<!-- id:binary-trees-binary-tree-tilt | order:22 | day:15 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-tilt/)

**Asked by:** Amazon, Indeed &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Another instance of returning one thing and accumulating another: the function returns the subtree sum while a global collects the tilt. Recognising this shape for the third time is the point of the repetition.

**Trick.** Return the subtree sum. Add `abs(leftSum - rightSum)` to a running total inside the recursion.

**Edge cases that bite.**

- Tilt is accumulated over ALL nodes, not just the root.
- Sums can be negative; the tilt uses absolute difference.
- Null returns 0 for both the sum and the tilt contribution.

**Complexity.** `O(n)` time, `O(h)` space — one traversal. Computing each subtree sum independently would be O(n^2).

**Same pattern.** [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Count Good Nodes in Binary Tree](https://leetcode.com/problems/count-good-nodes-in-binary-tree/), [Distribute Coins in Binary Tree](https://leetcode.com/problems/distribute-coins-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Name the pattern.
  <br>**A.** Return-one-value-accumulate-another. Diameter, maximum path sum, tilt, longest univalue path and distribute coins are all this.
- **Q.** Distribute coins in a binary tree.
  <br>**A.** LC 979 - return the excess coins, accumulate the absolute movement. Structurally identical, and the hardest instance of the pattern in this phase.

</details>

#### `[DRILL]` 4. Cousins in Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 993

<!-- id:binary-trees-cousins-in-binary-tree | order:23 | day:15 | pattern:depth-plus-parent | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/cousins-in-binary-tree/)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `depth-plus-parent`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two facts are needed per node - its depth and its parent - and neither is available locally. Carrying both down the recursion, or capturing them during BFS, is the general answer to 'compare two nodes' relationship'.

**Trick.** BFS is cleaner here: process level by level, and within a level check whether both targets appear and whether they share a parent. Same level plus different parents is the definition.

**Edge cases that bite.**

- Same depth is not sufficient - siblings share a parent and are not cousins.
- The root has no cousins.
- Both values are guaranteed to exist and be distinct.

**Complexity.** `O(n)` time, `O(w) for BFS` space — one traversal capturing depth and parent for both targets.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/), [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Why check parents rather than just depth?
  <br>**A.** Siblings are at the same depth but are explicitly excluded by the definition. The parent check is what distinguishes cousins from siblings.
- **Q.** All nodes at distance k from a target.
  <br>**A.** LC 863 - build parent pointers, then BFS outward treating the tree as an undirected graph. The same 'give nodes access to their parents' idea, scaled up.

</details>

#### `[SKIM]` 5. Sum of Left Leaves &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 404

<!-- id:binary-trees-sum-of-left-leaves | order:18 | day:15 | pattern:parent-aware-dfs | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/sum-of-left-leaves/)

**Asked by:** Amazon, Adobe &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `parent-aware-dfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A node cannot tell whether it is a left child - that information lives with the parent. Carrying an `isLeft` flag down the recursion is the general fix whenever a node needs context it does not own.

**Trick.** Pass a boolean saying whether the current node is a left child. Add its value only when the flag is set AND it is a leaf.

**Edge cases that bite.**

- A left child that is not a leaf contributes nothing, but must still be recursed into.
- A single root node is not a left leaf.
- Checking for a leaf from the parent works too - test `r->left && !r->left->left && !r->left->right`.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with a constant-time test per node.

**Same pattern.** [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Find Bottom Left Tree Value](https://leetcode.com/problems/find-bottom-left-tree-value/), [Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/), [Leaf-Similar Trees](https://leetcode.com/problems/leaf-similar-trees/)

**Interview follow-ups.**

- **Q.** Do it without the flag.
  <br>**A.** Test from the parent: if the left child exists and has no children, add it. Avoids the parameter but duplicates the leaf test.
- **Q.** When else must context flow downward?
  <br>**A.** Anywhere a node's answer depends on its ancestors - BST validation ranges, path prefix sums, and depth-aware problems.

</details>

#### `[SKIM]` 6. Average of Levels in Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 637

<!-- id:binary-trees-average-of-levels-in-binary-tree | order:19 | day:15 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/average-of-levels-in-binary-tree/)

**Asked by:** Facebook, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A direct application of the level-order template with an aggregate per level instead of a list. The only real trap is overflow: a level of 10^4 nodes each at INT_MAX exceeds int comfortably.

**Trick.** Accumulate the level sum in a long long or double, then divide by the captured level size.

**Edge cases that bite.**

- Sum the level in long long - values reach INT_MAX and levels can be wide.
- Divide by the size captured before the loop, not q.size() after it.
- Null root returns empty.

**Complexity.** `O(n)` time, `O(w)` space — one BFS with constant work per node.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/), [Find Bottom Left Tree Value](https://leetcode.com/problems/find-bottom-left-tree-value/), [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)

**Interview follow-ups.**

- **Q.** Why is overflow a real risk here?
  <br>**A.** 10^4 nodes at 2^31-1 each sums past 2^45. Accumulating in int silently wraps and the average is nonsense.

</details>

#### `[SKIM]` 7. Leaf-Similar Trees &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 872

<!-- id:binary-trees-leaf-similar-trees | order:20 | day:15 | pattern:leaf-sequence | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/leaf-similar-trees/)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `leaf-sequence`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Collect each tree's leaves in left-to-right order and compare the sequences. The interesting version generates both sequences lazily and compares as it goes, which avoids materialising either.

**Trick.** A DFS appending only at leaves gives the sequence in order. Compare the two vectors directly.

**Edge cases that bite.**

- Order matters - the same leaf values in a different arrangement is false.
- Different leaf counts fail immediately.
- A single-node tree has one leaf: itself.

**Complexity.** `O(n + m)` time, `O(n + m)` space — one traversal per tree, with the leaf sequences bounded by the node counts.

**Same pattern.** [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Sum of Left Leaves](https://leetcode.com/problems/sum-of-left-leaves/), [Same Tree](https://leetcode.com/problems/same-tree/), [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/)

**Interview follow-ups.**

- **Q.** Compare without storing either sequence.
  <br>**A.** Run two iterative traversals in lockstep, advancing each to its next leaf and comparing. O(h) space instead of O(n), and it can exit early on the first mismatch.

</details>

#### `[SKIM]` 8. Univalued Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 965

<!-- id:binary-trees-univalued-binary-tree | order:21 | day:15 | pattern:uniform-check | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/univalued-binary-tree/)

**Asked by:** Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `uniform-check`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Compare each node against the root rather than against its parent. Both work here, but the root comparison makes the transitivity explicit and generalises to 'all nodes satisfy property P'.

**Trick.** Pass the root's value down and check equality at every node. Short-circuit on the first mismatch.

**Edge cases that bite.**

- A single node is univalued.
- Null returns true, which makes the recursion terminate cleanly.
- Checking against the parent works too, by transitivity.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with early exit.

**Same pattern.** [Same Tree](https://leetcode.com/problems/same-tree/), [Longest Univalue Path](https://leetcode.com/problems/longest-univalue-path/), [Binary Tree Tilt](https://leetcode.com/problems/binary-tree-tilt/)

**Interview follow-ups.**

- **Q.** Longest univalue path.
  <br>**A.** LC 687 - the bottom-up pattern again, extending only through children with the same value. A genuine step up from this.

</details>

#### `[SKIM]` 9. Maximum Depth of N-ary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 559

<!-- id:binary-trees-maximum-depth-of-n-ary-tree | order:24 | day:15 | pattern:n-ary-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `n-ary-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The binary case generalises by replacing 'max of two children' with 'max over a vector of children'. Nothing else changes, which is the point - the recursion never depended on there being exactly two.

**Trick.** Loop over the children vector taking the maximum, then add one. An empty children vector makes a leaf return 1 naturally.

**Edge cases that bite.**

- Null root returns 0.
- A node with no children returns 1, handled by the loop not executing.
- Children are stored in a vector, so null children do not appear.

**Complexity.** `O(n)` time, `O(h)` space — every node and every edge is visited once.

**Same pattern.** [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/), [N-ary Tree Preorder Traversal](https://leetcode.com/problems/n-ary-tree-preorder-traversal/), [N-ary Tree Level Order Traversal](https://leetcode.com/problems/n-ary-tree-level-order-traversal/)

**Interview follow-ups.**

- **Q.** Diameter of an N-ary tree.
  <br>**A.** Take the two LARGEST child depths rather than both children. The bottom-up pattern generalises the same way.

</details>

#### `[SKIM]` 10. N-ary Tree Preorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 589

<!-- id:binary-trees-n-ary-tree-preorder-traversal | order:25 | day:15 | pattern:n-ary-recursion | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/n-ary-tree-preorder-traversal/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `n-ary-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Preorder on an N-ary tree is identical in structure. Iteratively, children must be pushed in REVERSE order, for exactly the same reason the binary version pushes right before left.

**Trick.** Emit the node, then recurse over children in order. Iteratively, push children in reverse so the leftmost is popped first.

**Edge cases that bite.**

- Reverse the push order in the iterative version.
- Empty children vector is a leaf.
- Null root returns empty.

**Complexity.** `O(n)` time, `O(h)` space — each node is emitted once and each edge traversed once.

**Same pattern.** [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/), [N-ary Tree Postorder Traversal](https://leetcode.com/problems/n-ary-tree-postorder-traversal/), [N-ary Tree Level Order Traversal](https://leetcode.com/problems/n-ary-tree-level-order-traversal/)

**Interview follow-ups.**

- **Q.** Why reverse the push order?
  <br>**A.** A stack emits in reverse insertion order, so pushing children left to right would visit them right to left.

</details>

#### `[SKIM]` 11. N-ary Tree Postorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 590

<!-- id:binary-trees-n-ary-tree-postorder-traversal | order:26 | day:15 | pattern:n-ary-recursion | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/n-ary-tree-postorder-traversal/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `n-ary-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The reverse-a-modified-preorder trick generalises: emit the node, push children in FORWARD order, then reverse the whole result. Same shortcut as the binary case.

**Trick.** Iteratively: emit node, push children left to right, then reverse the output at the end.

**Edge cases that bite.**

- Push order is the opposite of the preorder version.
- The final reversal is required.
- Recursion is trivially a loop over children followed by an emit.

**Complexity.** `O(n)` time, `O(h)` space — one traversal plus one reversal.

**Same pattern.** [Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/), [N-ary Tree Preorder Traversal](https://leetcode.com/problems/n-ary-tree-preorder-traversal/), [Maximum Depth of N-ary Tree](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/)

**Interview follow-ups.**

- **Q.** Why does the reversal trick work for both binary and N-ary?
  <br>**A.** It relies only on postorder being the reverse of a preorder with children visited in reverse - which is true for any branching factor.

</details>

#### `[SKIM]` 12. N-ary Tree Level Order Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 429

<!-- id:binary-trees-n-ary-tree-level-order-traversal | order:27 | day:15 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/n-ary-tree-level-order-traversal/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The level-order template with an inner loop over the children vector instead of two explicit pushes. The size snapshot still does all the work.

**Trick.** Same `int sz = q.size()` snapshot, then enqueue every child of each dequeued node.

**Edge cases that bite.**

- Enqueue all children, not just the first two.
- Null root returns empty.
- Children vectors contain no nulls.

**Complexity.** `O(n)` time, `O(w)` space — every node is enqueued and dequeued once.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [N-ary Tree Preorder Traversal](https://leetcode.com/problems/n-ary-tree-preorder-traversal/), [Maximum Depth of N-ary Tree](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/)

**Interview follow-ups.**

- **Q.** How much of the binary template survives?
  <br>**A.** All of it. Only the child enumeration changes, which is why learning the template once pays across both shapes.

</details>

### Day 15 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Pass context down when a node cannot see it.** A node does not know its depth, its parent, or whether it is a left child. Carrying that information down the recursion is the general fix.
  <br>↳ *Sum of Left Leaves* — an isLeft flag passed to each recursive call; *Cousins in Binary Tree* — capturing depth and parent for both targets during the traversal
- **Returning a whole subtree beats copying it node by node.** When one side of a parallel recursion runs out, the opposing subtree IS the answer. Returning it wholesale is shorter and stops the traversal early.
  <br>↳ *Merge Two Binary Trees* — if (!a) return b; if (!b) return a;, giving O(min(n,m))
- **Everything generalises from two children to many.** Nothing in the traversal templates depends on there being exactly two children. Replacing the pair with a loop over a vector is the only change an N-ary tree requires.
  <br>↳ *Maximum Depth of N-ary Tree* — max over the children vector instead of two calls; *N-ary Tree Level Order Traversal* — enqueuing every child rather than two; *N-ary Tree Postorder Traversal* — the same reverse-a-preorder trick at any branching factor

#### From yesterday

- **The three DFS traversals differ only in when the node is emitted.** The walk is identical. ↳ *Binary Tree Inorder Traversal* — the dive-left-then-pop-and-go-right stack loop
- **Capture the queue size before the level loop.** The queue holds a mixture of levels at any instant. ↳ *Binary Tree Level Order Traversal* — int sz = q.size() outside the inner for-loop
- **Return one value upward, accumulate another locally.** The answer AT a node often uses both children, but the value a parent can extend uses only one. ↳ *Diameter of Binary Tree* — best gets l + r, but the return is 1 + max(l, r)
- **Parallel recursion compares or combines two trees at once.** Recurse on a pair of nodes rather than one. ↳ *Same Tree* — checking both-null before either-null, then values, then both subtrees
- **Minimum depth is not maximum depth with min substituted.** A node with one null child has no root-to-leaf path through the null side, so min would wrongly return 1. ↳ *Minimum Depth of Binary Tree* — using BFS, or explicitly handling the one-child case
- **Emit at a leaf, not at a null.** A leaf is a node with both children null. ↳ *Binary Tree Paths* — testing for both children null before appending the path

### Day 16

*8 problems — 5 core, 3 drill, 0 skim.*

#### `[CORE]` 1. Binary Tree Right Side View &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 199

<!-- id:binary-trees-binary-tree-right-side-view | order:28 | day:16 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-right-side-view/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/right-left-view-of-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=KV4mRzTjlAk)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The right side view is the last node of each level. Once you see that, the entire problem is the level-order template with one line changed - which is why learning that template properly pays off repeatedly.

**Trick.** BFS, and append the node when `i == sz - 1`. The DFS alternative visits right before left and records the first node seen at each new depth.

**Edge cases that bite.**

- It is not 'all rightmost children' - a deep left subtree is visible when the right side is shorter.
- Null root returns empty.
- The DFS version must visit right first, or it records the left side.

**Complexity.** `O(n)` time, `O(w)` space — one BFS with constant work per node.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Find Bottom Left Tree Value](https://leetcode.com/problems/find-bottom-left-tree-value/), [Maximum Width of Binary Tree](https://leetcode.com/problems/maximum-width-of-binary-tree/), [Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/)

**Interview follow-ups.**

- **Q.** Left side view.
  <br>**A.** Append when i == 0, or DFS visiting left before right. One character of difference.
- **Q.** Why not just follow right pointers?
  <br>**A.** A node's right child may be null while a deeper left descendant is still the rightmost visible node at its level.

</details>

#### `[CORE]` 2. Path Sum III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 437

<!-- id:binary-trees-path-sum-iii | order:32 | day:16 | pattern:prefix-sum-on-path | template:T-HASH-04 -->

[Solve on LeetCode](https://leetcode.com/problems/path-sum-iii/)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `prefix-sum-on-path`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Paths need not start at the root, so this is Subarray Sum Equals K on the root-to-node path. A hash map of prefix sums along the current path answers each node in O(1), and the map must be UNWOUND on the way back up.

**Trick.** Maintain a map from prefix sum to count, seeded with {0: 1}. At each node add `map[cur - target]` to the answer, then recurse, then DECREMENT the map entry before returning.

**Edge cases that bite.**

- Failing to decrement on the way back up counts paths from other branches.
- Seed the map with {0, 1} for paths starting at the root.
- Sums overflow int - use long long for the running prefix.
- Negative values are permitted, which is why no pruning is possible.

**Complexity.** `O(n)` time, `O(h)` space — each node does constant-time map work, and the map holds at most h entries because it is unwound. The naive all-pairs version is O(n^2).

**Same pattern.** [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/), [Path Sum](https://leetcode.com/problems/path-sum/), [Path Sum II](https://leetcode.com/problems/path-sum-ii/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

**Interview follow-ups.**

- **Q.** Why must the map be decremented?
  <br>**A.** The map represents prefixes along the CURRENT path only. Leaving a sibling branch's entries in place counts paths that do not exist.
- **Q.** Recognise the parent problem.
  <br>**A.** It is Subarray Sum Equals K with the array replaced by a root-to-node path. Recognising that equivalence is worth more than the code.

</details>

#### `[CORE]` 3. Lowest Common Ancestor of a Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 236

<!-- id:binary-trees-lowest-common-ancestor-of-a-binary-tree | order:33 | day:16 | pattern:lca-recursion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=_-QHfMDde90)

**Asked by:** Amazon, Facebook, Google, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `lca-recursion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Return the node itself if it matches either target, then let the recursion combine: if both sides return non-null, this node is the split point and therefore the LCA. Four lines, and the correctness argument is worth more than the code.

**Trick.** `if (!r || r == p || r == q) return r;` then recurse both sides. Both non-null means return r; otherwise return whichever is non-null.

**Edge cases that bite.**

- A node may be its own ancestor - if p is an ancestor of q, p is the LCA.
- This assumes both nodes exist. If that is not guaranteed, a verification pass is needed.
- Comparison is by pointer identity here, not by value.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with early return. Every node is visited at most once.

**Same pattern.** [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/), [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/), [Cousins in Binary Tree](https://leetcode.com/problems/cousins-in-binary-tree/)

**Interview follow-ups.**

- **Q.** What if a node might not exist?
  <br>**A.** The bare algorithm returns the other node, which is wrong. Add a verification pass, or count found targets during the recursion.
- **Q.** The BST version.
  <br>**A.** LC 235 - far simpler. Descend while both targets are on the same side; the first node that splits them is the LCA. O(h) with no recursion.
- **Q.** Many queries on the same tree.
  <br>**A.** Binary lifting for O(log n) per query after O(n log n) preprocessing, or Euler tour plus sparse table for O(1) queries.

</details>

#### `[CORE]` 4. Flatten Binary Tree to Linked List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 114

<!-- id:binary-trees-flatten-binary-tree-to-linked-list | order:34 | day:16 | pattern:reverse-preorder-rewire | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/flatten-binary-tree-to-linked-list/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=sWf7k1x9XR4)

**Asked by:** Amazon, Facebook, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `reverse-preorder-rewire`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Flattening in preorder order looks like it needs the successor of each node, which is awkward forward. Traversing in REVERSE preorder - right, left, node - means the previously visited node is always exactly the successor you need.

**Trick.** Traverse right, then left, then the node. Keep a `prev` pointer; set `r->right = prev`, `r->left = nullptr`, then `prev = r`.

**Edge cases that bite.**

- Left must be nulled, or the result is not a proper list.
- prev starts as nullptr so the last node in preorder terminates the list.
- The Morris-style O(1) version rewires using the left subtree's rightmost node.

**Complexity.** `O(n)` time, `O(h)` space — one traversal rewiring two pointers per node. The O(1)-space version threads instead of recursing.

**Same pattern.** [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/), [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)

**Interview follow-ups.**

- **Q.** Do it in O(1) space.
  <br>**A.** For each node with a left child, find that subtree's rightmost node, attach the current right subtree there, move left to right, and null the left. Move on. This is Morris threading applied to flattening.
- **Q.** Why reverse preorder?
  <br>**A.** Forward preorder would overwrite the right pointer before its subtree was processed. Reversing means everything to the right is already flattened when you arrive.

</details>

#### `[CORE]` 5. Construct Binary Tree from Preorder and Inorder Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 105

<!-- id:binary-trees-construct-binary-tree-from-preorder-and-inorder-traversal | order:35 | day:16 | pattern:traversal-reconstruction | template:T-TREE-04 -->

[Solve on LeetCode](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/construct-a-binary-tree-from-inorder-and-preorder-traversal/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=aZNaLrVebKQ)

**Asked by:** Amazon, Facebook, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `traversal-reconstruction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Preorder gives you the root; inorder tells you how many nodes are on each side of it. Together they pin the tree down uniquely, and a hash map from value to inorder index is what keeps the construction linear.

**Trick.** Consume preorder left to right with a shared index. For each call, take the root, look up its inorder position in O(1), and recurse LEFT before RIGHT - the preorder index must advance in that order.

**Edge cases that bite.**

- Left must be built before right, because preorder is consumed sequentially.
- Without the hash map, searching inorder is O(n) per node, giving O(n^2).
- This assumes distinct values, which the constraints guarantee.

**Complexity.** `O(n)` time, `O(n)` space — each node is constructed once with an O(1) index lookup. The map is the only extra space beyond the recursion.

**Same pattern.** [Construct Binary Tree from Inorder and Postorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/), [Construct Binary Search Tree from Preorder Traversal](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)

**Interview follow-ups.**

- **Q.** The postorder variant.
  <br>**A.** Consume postorder from the END and build RIGHT before LEFT - postorder reversed is node-right-left.
- **Q.** Can preorder plus postorder work?
  <br>**A.** Not for a general binary tree - it cannot distinguish a single left child from a single right child. It does work for full binary trees.
- **Q.** What if values repeat?
  <br>**A.** The index map becomes ambiguous and the reconstruction is no longer unique. The constraint on distinctness is load-bearing.

</details>

#### `[DRILL]` 6. Find Bottom Left Tree Value &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 513

<!-- id:binary-trees-find-bottom-left-tree-value | order:29 | day:16 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/find-bottom-left-tree-value/)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Traverse level by level enqueuing RIGHT before LEFT, and the last node dequeued is automatically the bottom-left. Inverting the enqueue order removes all the bookkeeping.

**Trick.** BFS pushing right then left; whatever is dequeued last is the answer. No level tracking needed at all.

**Edge cases that bite.**

- 'Bottom-left' means leftmost node of the DEEPEST level, not the leftmost leaf.
- A single node is its own answer.
- The DFS version must track maximum depth and only record on a strictly greater depth.

**Complexity.** `O(n)` time, `O(w)` space — one BFS with no per-level structure, because the reversed enqueue order encodes the answer.

**Same pattern.** [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/), [Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/), [Binary Tree Level Order Traversal II](https://leetcode.com/problems/binary-tree-level-order-traversal-ii/)

**Interview follow-ups.**

- **Q.** DFS version.
  <br>**A.** Track the maximum depth seen and record the value only when the current depth strictly exceeds it, visiting left first. Strict inequality is what keeps the leftmost.
- **Q.** Why does reversing the enqueue order work?
  <br>**A.** The last node dequeued is on the deepest level, and pushing right first means the leftmost of that level is dequeued last.

</details>

#### `[DRILL]` 7. Count Good Nodes in Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1448

<!-- id:binary-trees-count-good-nodes-in-binary-tree | order:30 | day:16 | pattern:ancestor-context | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/count-good-nodes-in-binary-tree/)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `ancestor-context`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A node's status depends on its ancestors, not its descendants, so this is a TOP-DOWN problem rather than the usual bottom-up one. Carry the running maximum downward.

**Trick.** Pass the maximum value seen on the path so far. Count the node if its value is at least that maximum, then recurse with the updated maximum.

**Edge cases that bite.**

- The root is always good - initialise the running maximum to INT_MIN or the root's value.
- Equal values count as good, so use >=, not >.
- Values may be negative.

**Complexity.** `O(n)` time, `O(h)` space — one traversal carrying a scalar. No information flows upward at all.

**Same pattern.** [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Path Sum](https://leetcode.com/problems/path-sum/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/)

**Interview follow-ups.**

- **Q.** Top-down versus bottom-up - how do you tell?
  <br>**A.** Ask whether the node's answer depends on its ancestors or its descendants. Ancestors means pass state down; descendants means return values up.
- **Q.** Which other problems are top-down?
  <br>**A.** BST validation with ranges, path sums, and anything phrased 'on the path from the root'.

</details>

#### `[DRILL]` 8. Sum Root to Leaf Numbers &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 129

<!-- id:binary-trees-sum-root-to-leaf-numbers | order:31 | day:16 | pattern:path-accumulation | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/sum-root-to-leaf-numbers/)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `path-accumulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Build the number as you descend with `cur * 10 + val` rather than collecting digits and assembling at the leaf. It is cheaper and it makes the leaf case a single return.

**Trick.** Pass the accumulated value down. At a leaf return it; otherwise return the sum of both recursive calls. Nulls return 0 so they contribute nothing.

**Edge cases that bite.**

- Only complete root-to-leaf paths count.
- Null children return 0, which is why a one-child node does not double-count.
- Depth is bounded, so the accumulated value fits in int per the constraints.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with constant work per node.

**Same pattern.** [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Path Sum](https://leetcode.com/problems/path-sum/), [Smallest String Starting From Leaf](https://leetcode.com/problems/smallest-string-starting-from-leaf/), [Path Sum II](https://leetcode.com/problems/path-sum-ii/)

**Interview follow-ups.**

- **Q.** Binary digits instead of decimal.
  <br>**A.** LC 1022 - `cur * 2 + val`. The accumulation pattern is base-independent.
- **Q.** Smallest string starting from leaf.
  <br>**A.** LC 988 - build the string in reverse and compare lexicographically at each leaf. Harder, because string comparison is not a simple accumulation.

</details>

### Day 16 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Ask whether the answer depends on ancestors or descendants.** Descendants means return values upward. Ancestors means pass state downward. Naming which one a problem is before writing code saves rewriting it.
  <br>↳ *Count Good Nodes in Binary Tree* — carrying the path maximum downward; *Sum Root to Leaf Numbers* — accumulating cur * 10 + val downward; *Diameter of Binary Tree* — the contrasting case, where heights flow upward
- **A root-to-node path is an array, so array techniques apply.** Prefix sums with a hash map work on a tree path exactly as on a subarray - provided the map is unwound when the recursion backtracks.
  <br>↳ *Path Sum III* — a prefix-sum map seeded with {0,1} and decremented on the way back up; *subarray-sum-equals-k* — the array version of the identical idea
- **Two traversals pin down a tree, one does not.** Preorder gives the root; inorder says how many nodes sit on each side of it. A value-to-index hash map keeps the construction linear instead of quadratic.
  <br>↳ *Construct Binary Tree from Preorder and Inorder Traversal* — the inorder index map and building left before right
- **Traverse in the order that makes the successor already known.** Flattening in forward preorder would overwrite pointers still needed. Reverse preorder means everything to the right is already processed when you arrive.
  <br>↳ *Flatten Binary Tree to Linked List* — right, left, node with a trailing prev pointer

#### From yesterday

- **Pass context down when a node cannot see it.** A node does not know its depth, its parent, or whether it is a left child. ↳ *Sum of Left Leaves* — an isLeft flag passed to each recursive call
- **Returning a whole subtree beats copying it node by node.** When one side of a parallel recursion runs out, the opposing subtree IS the answer. ↳ *Merge Two Binary Trees* — if (!a) return b; if (!b) return a;, giving O(min(n,m))
- **Everything generalises from two children to many.** Nothing in the traversal templates depends on there being exactly two children. ↳ *Maximum Depth of N-ary Tree* — max over the children vector instead of two calls

#### Two days back

- **The three DFS traversals differ only in when the node is emitted** — Binary Tree Inorder Traversal
- **Capture the queue size before the level loop** — Binary Tree Level Order Traversal
- **Return one value upward, accumulate another locally** — Diameter of Binary Tree
- **Parallel recursion compares or combines two trees at once** — Same Tree
- **Minimum depth is not maximum depth with min substituted** — Minimum Depth of Binary Tree
- **Emit at a leaf, not at a null** — Binary Tree Paths

### Day 17

*20 problems — 10 core, 9 drill, 1 skim.*

#### `[CORE]` 1. Populating Next Right Pointers in Each Node &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 116

<!-- id:binary-trees-populating-next-right-pointers-in-each-node | order:37 | day:17 | pattern:level-linking | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `level-linking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** BFS solves it in O(w) space. The follow-up demands O(1), and the perfect-tree guarantee is what makes it possible: every node has both children, so the next pointers of the level above form a ready-made linked list to walk.

**Trick.** Use the current level's next pointers to traverse it while wiring the level below. `node->left->next = node->right` and `node->right->next = node->next->left`.

**Edge cases that bite.**

- `node->next->left` requires a null check on node->next at the end of each level.
- The perfect-tree guarantee is what makes both children always present.
- The recursion-based version is O(h) stack, not O(1).

**Complexity.** `O(n)` time, `O(1)` space — each node is visited once and wires two pointers. The already-built level above serves as the traversal structure, which is what removes the queue.

**Same pattern.** [Populating Next Right Pointers in Each Node II](https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/), [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)

**Interview follow-ups.**

- **Q.** The tree is no longer perfect.
  <br>**A.** LC 117 - children may be missing, so you must scan forward along the next chain to find the next available child. A dummy head per level makes it manageable.
- **Q.** Why is recursion not O(1) space?
  <br>**A.** The call stack is O(h). Only the iterative level-walk achieves genuine constant space.

</details>

#### `[CORE]` 2. Populating Next Right Pointers in Each Node II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 117

<!-- id:binary-trees-populating-next-right-pointers-in-each-node-ii | order:38 | day:17 | pattern:level-linking | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `level-linking`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Without the perfect-tree guarantee, a node's next sibling may be several nodes along the level. A dummy head for the level being built turns that search into a simple append, which is the trick that makes the O(1) version tractable.

**Trick.** Keep a dummy node and a tail pointer for the next level. Walk the current level via next pointers, appending each existing child to the tail. The next level's head is dummy.next.

**Edge cases that bite.**

- The dummy must be reset at the start of every level.
- Children may be absent on either side - append only non-null ones.
- The last node of each level must end with a null next.

**Complexity.** `O(n)` time, `O(1)` space — each node is appended exactly once and the walk uses pointers already built.

**Same pattern.** [Populating Next Right Pointers in Each Node](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/), [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/)

**Interview follow-ups.**

- **Q.** Why does the dummy head help so much?
  <br>**A.** It removes the 'is this the first node of the level' special case, exactly as a dummy head does in linked list problems. Same trick, different structure.
- **Q.** Does this solution also work for LC 116?
  <br>**A.** Yes - it is strictly more general. Writing this one first means you only learn one algorithm.

</details>

#### `[CORE]` 3. Count Complete Tree Nodes &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 222

<!-- id:binary-trees-count-complete-tree-nodes | order:39 | day:17 | pattern:complete-tree-binary-search | template:T-BS-01 -->

[Solve on LeetCode](https://leetcode.com/problems/count-complete-tree-nodes/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/binary-tree/count-number-of-nodes-in-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=u-yWemKGWO0)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `complete-tree-binary-search`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Counting every node is O(n) and ignores the completeness guarantee. Exploiting it gives O(log^2 n): compare the leftmost and rightmost depths, and if they match the subtree is perfect, so its size is 2^h - 1 with no traversal at all.

**Trick.** Walk left and right from each node measuring depths. Equal depths means a perfect subtree - return the formula. Otherwise recurse into both children.

**Edge cases that bite.**

- Only one of the two recursive branches ever does real work, which is why it is log^2 and not linear.
- Depth measurement is O(log n) and happens O(log n) times.
- Use 1 << h, and watch for overflow at large heights.

**Complexity.** `O(log² n)` time, `O(log n)` space — at each of log n levels, one subtree is perfect and answered in O(1) after an O(log n) depth check. Only the other is recursed into.

**Same pattern.** [Check Completeness of a Binary Tree](https://leetcode.com/problems/check-completeness-of-a-binary-tree/), [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/), [Binary Search](https://leetcode.com/problems/binary-search/)

**Interview follow-ups.**

- **Q.** Why is only one branch ever recursed into?
  <br>**A.** In a complete tree, at any node either the left subtree is perfect or the right one is. The perfect side is answered by formula, so recursion continues down a single path.
- **Q.** Where else does 'exploit the structural guarantee' apply?
  <br>**A.** Heaps, which are complete by definition - which is why they can live in an array with no pointers.

</details>

#### `[CORE]` 4. Binary Tree Maximum Path Sum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 124

<!-- id:binary-trees-binary-tree-maximum-path-sum | order:40 | day:17 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-maximum-path-sum/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-sum-path-in-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=WszrfSwMz58)

**Asked by:** Amazon, Facebook, Google, Microsoft, Adobe &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The hardest instance of the return-one-accumulate-another pattern. The answer through a node uses both children; the value returned upward can use only one. Clamping negative contributions at zero is what handles negative values correctly.

**Trick.** `l = max(0, dfs(left)); r = max(0, dfs(right)); best = max(best, val + l + r); return val + max(l, r);`. Four lines, and every one of them matters.

**Edge cases that bite.**

- Clamping at 0 means a negative subtree is excluded rather than forced into the path.
- The path need not touch the root and need not reach a leaf.
- An all-negative tree returns the largest single value, which the clamp handles.
- Initialise best to INT_MIN, not 0.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with constant work per node.

**Same pattern.** [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Longest Univalue Path](https://leetcode.com/problems/longest-univalue-path/), [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Distribute Coins in Binary Tree](https://leetcode.com/problems/distribute-coins-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Why clamp at zero?
  <br>**A.** Including a negatively-summing subtree can only reduce the total, and the path is allowed to stop before it. max(0, ...) encodes that choice without a branch.
- **Q.** Return the path itself.
  <br>**A.** Record the node achieving each best, plus which children contributed, then reconstruct by walking down from the recorded node.

</details>

#### `[CORE]` 5. Serialize and Deserialize Binary Tree &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 297

<!-- id:binary-trees-serialize-and-deserialize-binary-tree | order:41 | day:17 | pattern:preorder-with-sentinels | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/serialize-and-deserialize-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=-YbXySKJsX8)

**Asked by:** Amazon, Facebook, Google, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `preorder-with-sentinels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Preorder alone cannot rebuild a tree, but preorder WITH null sentinels can - the sentinels encode exactly the shape information that ordering alone lacks. That is the whole design decision.

**Trick.** Serialise preorder, emitting a marker such as '#' for every null, with a delimiter between tokens. Deserialise by consuming tokens in the same order, returning null on the marker.

**Edge cases that bite.**

- Delimiters are needed as well as sentinels, or 1 and 12 are ambiguous against 1,2.
- Negative values must survive the round trip.
- Deserialisation consumes tokens in exactly the serialisation order - an index or stream shared across recursive calls.

**Complexity.** `O(n) both ways` time, `O(n)` space — each node produces one token and consumes one. The string is proportional to the node count.

**Same pattern.** [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/), [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/), [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/)

**Interview follow-ups.**

- **Q.** Why are sentinels enough when a second traversal was needed before?
  <br>**A.** The nulls mark exactly where subtrees end, which is the structural information inorder was supplying. One annotated traversal replaces two plain ones.
- **Q.** Serialise a BST more compactly.
  <br>**A.** Preorder alone suffices, because the BST invariant supplies the shape. No sentinels needed - LC 449.
- **Q.** Make it robust to duplicate values.
  <br>**A.** It already is - unlike reconstruction from two traversals, the sentinel form never needs to look values up.

</details>

#### `[CORE]` 6. All Nodes Distance K in Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 863

<!-- id:binary-trees-all-nodes-distance-k-in-binary-tree | order:42 | day:17 | pattern:tree-as-graph | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/print-all-the-nodes-at-a-distance-of-k-in-a-binary-tree) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=i9ORlEy6EsI)

**Asked by:** Amazon, Facebook, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `tree-as-graph`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Distance in a tree runs in three directions - down both children and UP to the parent - but tree nodes have no parent pointer. Building a parent map converts the tree into an undirected graph, and then it is plain BFS.

**Trick.** One DFS to record every node's parent in a hash map, then BFS outward from the target for exactly k levels, using a visited set so you do not walk back.

**Edge cases that bite.**

- A visited set is mandatory - without it BFS oscillates between a node and its parent.
- k = 0 returns the target itself.
- k larger than the tree's reach returns empty.

**Complexity.** `O(n)` time, `O(n)` space — one DFS to build the parent map and one BFS bounded by k levels, each visiting every node at most once.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Cousins in Binary Tree](https://leetcode.com/problems/cousins-in-binary-tree/), [Time Needed to Inform All Employees](https://leetcode.com/problems/time-needed-to-inform-all-employees/), [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)

**Interview follow-ups.**

- **Q.** Why not solve it purely recursively?
  <br>**A.** You can - compute the distance from the target to each node via the LCA - but the parent-map plus BFS is shorter, and the reframing is the transferable idea.
- **Q.** Recognise the reframing.
  <br>**A.** 'A tree is a graph with no cycles.' The moment a problem needs upward movement, add parent edges and reach for BFS or DFS on a graph.

</details>

#### `[CORE]` 7. House Robber III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 337

<!-- id:binary-trees-house-robber-iii | order:43 | day:17 | pattern:tree-dp-two-states | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/house-robber-iii/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `tree-dp-two-states`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Tree DP with two states per node: the best total if this node is robbed, and the best if it is not. Returning a pair rather than a single number is what removes the exponential recomputation.

**Trick.** Return {robbed, notRobbed}. robbed = val + left.notRobbed + right.notRobbed. notRobbed = max of each child's two options, summed.

**Edge cases that bite.**

- notRobbed takes the MAX of each child's states, not the notRobbed one - you may still choose not to rob a child.
- Null returns {0, 0}.
- Values are non-negative here, so no clamping is needed.

**Complexity.** `O(n)` time, `O(h)` space — one traversal returning a pair. Memoising a single-value recursion also works but is more machinery for the same result.

**Same pattern.** [House Robber](https://leetcode.com/problems/house-robber/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Distribute Coins in Binary Tree](https://leetcode.com/problems/distribute-coins-in-binary-tree/), [Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/)

**Interview follow-ups.**

- **Q.** Why return a pair instead of memoising?
  <br>**A.** The pair makes the state explicit and needs no map. Memoising hides the same two states behind a cache keyed on (node, robbed).
- **Q.** Name the general pattern.
  <br>**A.** Tree DP: each node returns a small tuple of states, and the parent combines them. Binary Tree Cameras is the same idea with three states.

</details>

#### `[CORE]` 8. Maximum Width of Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 662

<!-- id:binary-trees-maximum-width-of-binary-tree | order:44 | day:17 | pattern:index-arithmetic-bfs | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-width-of-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/maximum-width-of-a-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ZbybYvcVLks)

**Asked by:** Amazon, Microsoft, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `index-arithmetic-bfs`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Width counts the null gaps between the outermost nodes, so you must track positions rather than counts. Indexing nodes as in a heap - children at 2i and 2i+1 - gives the positions for free.

**Trick.** BFS carrying (node, index). Width per level is lastIndex - firstIndex + 1. Normalise indices by subtracting the level's first index, or they overflow.

**Edge cases that bite.**

- Indices overflow at depth ~60 without normalisation - subtract the level's first index from every node in it.
- Use unsigned long long or normalise; a degenerate right-leaning tree hits this fast.
- Nulls are not enqueued, but their positions are still implied by the index arithmetic.

**Complexity.** `O(n)` time, `O(w)` space — one BFS with constant work per node. The index arithmetic is what accounts for gaps without enqueuing nulls.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Count Complete Tree Nodes](https://leetcode.com/problems/count-complete-tree-nodes/), [Check Completeness of a Binary Tree](https://leetcode.com/problems/check-completeness-of-a-binary-tree/)

**Interview follow-ups.**

- **Q.** Why does normalisation prevent overflow?
  <br>**A.** Indices double each level, so depth 60 exceeds 2^60. Subtracting the level's first index keeps every value small while preserving differences.
- **Q.** Where else does heap indexing appear?
  <br>**A.** Binary heaps themselves, and segment trees - any complete structure stored in a flat array.

</details>

#### `[CORE]` 9. Distribute Coins in Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 979

<!-- id:binary-trees-distribute-coins-in-binary-tree | order:46 | day:17 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/distribute-coins-in-binary-tree/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Return the EXCESS coins a subtree has - positive if surplus, negative if deficit - and accumulate the absolute value of what crosses each edge. The signed return value is what makes the accounting work.

**Trick.** `excess = node->val - 1 + leftExcess + rightExcess`. Add `abs(leftExcess) + abs(rightExcess)` to the answer, since that is how many coins must physically cross those two edges.

**Edge cases that bite.**

- Excess may be negative, meaning coins must flow INTO the subtree.
- The -1 accounts for the node keeping one coin for itself.
- The total number of coins equals the number of nodes, guaranteed.

**Complexity.** `O(n)` time, `O(h)` space — one traversal. Each edge's traffic is counted exactly once, and the total is the sum over edges.

**Same pattern.** [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Binary Tree Tilt](https://leetcode.com/problems/binary-tree-tilt/), [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/)

**Interview follow-ups.**

- **Q.** Why is summing |excess| per edge correct?
  <br>**A.** Each edge must carry exactly the net imbalance of the subtree below it. Moves along different edges are independent, so the total is their sum.
- **Q.** Why can excess be negative and that still be fine?
  <br>**A.** Direction does not affect the count of moves. The absolute value is what is being summed.

</details>

#### `[CORE]` 10. Binary Tree Cameras &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 968

<!-- id:binary-trees-binary-tree-cameras | order:47 | day:17 | pattern:tree-dp-three-states | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-cameras/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `tree-dp-three-states`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Greedy from the leaves upward: never place a camera on a leaf, because its parent covers strictly more. Three states per node - needs cover, has camera, is covered - encode the decision, and the bottom-up order is what makes the greedy exact.

**Trick.** Return one of three states. If either child needs cover, place a camera here. If either child has a camera, this node is covered. Otherwise it needs cover.

**Edge cases that bite.**

- The root may end in the needs-cover state and require one final camera.
- Null must return 'covered', or every leaf's parent is forced to place a camera.
- Leaves must never hold cameras - the state machine enforces this implicitly.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with a constant-size state. The DP over all placements would be exponential.

**Same pattern.** [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Distribute Coins in Binary Tree](https://leetcode.com/problems/distribute-coins-in-binary-tree/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

**Interview follow-ups.**

- **Q.** Why must null return 'covered'?
  <br>**A.** Returning 'needs cover' would force a camera at every leaf, which is exactly the suboptimal placement the greedy avoids.
- **Q.** Prove the leaf rule.
  <br>**A.** Any camera on a leaf covers the leaf and its parent. Moving it to the parent covers the leaf, the parent, the parent's other child and the grandparent - strictly more, never less.

</details>

#### `[DRILL]` 11. Construct Binary Tree from Inorder and Postorder Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 106

<!-- id:binary-trees-construct-binary-tree-from-inorder-and-postorder-traversal | order:36 | day:17 | pattern:traversal-reconstruction | template:T-TREE-04 -->

[Solve on LeetCode](https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/construct-binary-tree-from-inorder-and-postorder-traversal/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=LgLRTaEMRVc)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `traversal-reconstruction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The mirror of the preorder version. Postorder's LAST element is the root, so consume it from the end and build the RIGHT subtree before the left - because postorder reversed is node, right, left.

**Trick.** Index into postorder from the back, decrementing. Recurse right first, then left. Same inorder hash map.

**Edge cases that bite.**

- Right before left, or the postorder index desynchronises.
- Consume from the end, not the front.
- Same distinct-values assumption as the preorder variant.

**Complexity.** `O(n)` time, `O(n)` space — one construction pass with O(1) index lookups.

**Same pattern.** [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/), [Construct Binary Search Tree from Preorder Traversal](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/)

**Interview follow-ups.**

- **Q.** Why right before left?
  <br>**A.** Reading postorder backwards gives node, right subtree, left subtree. Building in that order keeps the shared index aligned.

</details>

#### `[DRILL]` 12. Longest Univalue Path &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 687

<!-- id:binary-trees-longest-univalue-path | order:45 | day:17 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/longest-univalue-path/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Diameter with a condition attached. A child only contributes if its value matches the current node's, which turns one comparison into the difference between this problem and LC 543.

**Trick.** Compute each child's arm length, but zero it unless the child's value equals the node's. Update the best with the sum of both arms; return the larger arm plus one.

**Edge cases that bite.**

- The value check happens AFTER recursing, since you need the child's arm length regardless.
- The answer counts edges, so a single node gives 0.
- Null returns 0.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with constant work per node.

**Same pattern.** [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Univalued Binary Tree](https://leetcode.com/problems/univalued-binary-tree/), [Binary Tree Tilt](https://leetcode.com/problems/binary-tree-tilt/)

**Interview follow-ups.**

- **Q.** How does it differ from Diameter?
  <br>**A.** Only in the conditional zeroing of each arm. Recognising a problem as 'X with a predicate' is faster than solving it fresh.
- **Q.** Why recurse before checking the value?
  <br>**A.** The recursion must still run to update the global best inside that subtree. Skipping it would miss answers entirely within the child.

</details>

#### `[DRILL]` 13. Vertical Order Traversal of a Binary Tree &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 987

<!-- id:binary-trees-vertical-order-traversal-of-a-binary-tree | order:48 | day:17 | pattern:coordinate-grouping | template:T-SORT-04 -->

[Solve on LeetCode](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/vertical-order-traversal-of-binary-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=q_a6lpbKJdw)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `coordinate-grouping`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Assign each node a (column, row) coordinate, then group by column. The tie-breaking rule is the whole difficulty: same column and same row means order by VALUE, not by traversal order.

**Trick.** DFS collecting (col, row, val) triples, then sort by col, then row, then value, and group. A map<int, map<int, multiset<int>>> does the grouping and sorting in one structure.

**Edge cases that bite.**

- Ties at the same coordinate sort by value - this is the difference from LC 314.
- Columns can be negative, so a map or an offset is needed.
- Rows must be tracked as well as columns, since ordering within a column is top-down.

**Complexity.** `O(n log n)` time, `O(n)` space — the sort dominates. Collection is linear; ordering the triples is the cost.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/), [Sort the Matrix Diagonally](https://leetcode.com/problems/sort-the-matrix-diagonally/)

**Interview follow-ups.**

- **Q.** How does it differ from the simpler vertical traversal?
  <br>**A.** LC 314 uses traversal order for ties. This one requires value order, which forces an explicit sort rather than a BFS that happens to arrive in order.
- **Q.** BFS instead of DFS.
  <br>**A.** BFS gives rows in order automatically, so only the value tie-break needs sorting. Slightly less work overall.

</details>

#### `[DRILL]` 14. Check Completeness of a Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 958

<!-- id:binary-trees-check-completeness-of-a-binary-tree | order:49 | day:17 | pattern:bfs-null-detection | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/check-completeness-of-a-binary-tree/)

**Asked by:** Amazon, Facebook, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bfs-null-detection`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Enqueue nulls as well as real nodes. In a complete tree every null appears after every real node, so the check is simply: once a null has been seen, no real node may follow.

**Trick.** BFS pushing both children unconditionally, including nulls. Set a flag on the first null dequeued; if any non-null appears afterwards, return false.

**Edge cases that bite.**

- Nulls MUST be enqueued - this is the opposite of every other BFS here.
- A single node is complete.
- The queue can hold up to n nulls, which is fine at these constraints.

**Complexity.** `O(n)` time, `O(w)` space — one BFS visiting every node and every null child once.

**Same pattern.** [Count Complete Tree Nodes](https://leetcode.com/problems/count-complete-tree-nodes/), [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Maximum Width of Binary Tree](https://leetcode.com/problems/maximum-width-of-binary-tree/)

**Interview follow-ups.**

- **Q.** Why does enqueuing nulls work?
  <br>**A.** Completeness means all gaps are at the end of the last level. In level order that is exactly 'all nulls come after all nodes'.
- **Q.** Index-based alternative.
  <br>**A.** Assign heap indices and check that the maximum index equals the node count. Equivalent, and it connects to why heaps are stored in arrays.

</details>

#### `[DRILL]` 15. Maximum Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 654

<!-- id:binary-trees-maximum-binary-tree | order:50 | day:17 | pattern:divide-on-maximum | template:T-STK-01 -->

[Solve on LeetCode](https://leetcode.com/problems/maximum-binary-tree/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `divide-on-maximum`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The naive construction finds the maximum in each range, which is O(n^2) on sorted input. The O(n) solution is a monotonic decreasing stack - the same structure as Next Greater Element, used constructively rather than analytically.

**Trick.** Maintain a decreasing stack of nodes. The popped node becomes the new node's LEFT child; the new node becomes the last-popped survivor's RIGHT child.

**Edge cases that bite.**

- Sorted input is exactly the O(n^2) worst case for the naive version.
- Values are distinct by constraint, so there are no ties to resolve.
- The final stack bottom is the root.

**Complexity.** `O(n) with the stack, O(n²) naive` time, `O(n)` space — each node is pushed and popped once. The recursive range version recomputes maxima repeatedly.

**Same pattern.** [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/), [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/), [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)

**Interview follow-ups.**

- **Q.** Why does a monotonic stack build the right tree?
  <br>**A.** The stack always holds the right spine of the tree built so far, in decreasing order. A new larger value displaces exactly the part of that spine it should become the parent of.
- **Q.** Recognise the connection.
  <br>**A.** This tree is the Cartesian tree of the array, and monotonic stacks are the standard way to build one in linear time.

</details>

#### `[DRILL]` 16. Binary Tree Pruning &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 814

<!-- id:binary-trees-binary-tree-pruning | order:51 | day:17 | pattern:postorder-deletion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-tree-pruning/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `postorder-deletion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Prune bottom-up. A node can only be judged after its children have been pruned, because removing them may make it removable in turn - which is precisely what postorder ordering guarantees.

**Trick.** Recurse into both children first, assigning the results back. Then return nullptr if the node is 0 and both children are now null.

**Edge cases that bite.**

- Assign the recursive results back into left and right, or the pruning is discarded.
- The cascade matters - pruning a child can make the parent prunable.
- The root itself may be pruned away, returning null.

**Complexity.** `O(n)` time, `O(h)` space — one postorder traversal. Repeated top-down passes until stable would be O(n·h).

**Same pattern.** [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/), [Delete Nodes And Return Forest](https://leetcode.com/problems/delete-nodes-and-return-forest/), [Trim a Binary Search Tree](https://leetcode.com/problems/trim-a-binary-search-tree/)

**Interview follow-ups.**

- **Q.** Why must this be postorder?
  <br>**A.** A node's removability depends on its children AFTER they have been pruned. Preorder would judge it against the un-pruned subtree and miss cascading removals.
- **Q.** Trim a BST to a value range.
  <br>**A.** LC 669 - same bottom-up rewiring, but the BST invariant lets you skip whole subtrees instead of examining every node.

</details>

#### `[DRILL]` 17. Smallest String Starting From Leaf &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 988

<!-- id:binary-trees-smallest-string-starting-from-leaf | order:53 | day:17 | pattern:path-accumulation | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/smallest-string-starting-from-leaf/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `path-accumulation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The string is read leaf-to-root, so build it in reverse as you descend and compare at each leaf. Lexicographic comparison is not an accumulation, which is why this is harder than Sum Root to Leaf Numbers.

**Trick.** Prepend each character as you descend - or append and reverse at the leaf. Compare the completed string against the best so far with plain string comparison.

**Edge cases that bite.**

- Shorter strings are not automatically smaller - 'ab' < 'aba' but 'b' > 'aba'.
- Only complete root-to-leaf paths count.
- Prepending is O(length) per node; appending and reversing once per leaf is cheaper.

**Complexity.** `O(n · h)` time, `O(h)` space — each of up to n leaves builds and compares a string of length up to h.

**Same pattern.** [Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/), [Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/), [Path Sum II](https://leetcode.com/problems/path-sum-ii/)

**Interview follow-ups.**

- **Q.** Why can't you prune early on a prefix comparison?
  <br>**A.** A longer path may still be lexicographically smaller if it continues with smaller characters. Only complete strings are comparable.
- **Q.** Why is this harder than summing root-to-leaf numbers?
  <br>**A.** Addition is associative and can be accumulated downward. Lexicographic order depends on the whole string, so nothing can be finalised until the leaf.

</details>

#### `[DRILL]` 18. Delete Nodes And Return Forest &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1110

<!-- id:binary-trees-delete-nodes-and-return-forest | order:54 | day:17 | pattern:postorder-deletion | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/delete-nodes-and-return-forest/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `postorder-deletion`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A node becomes a new root exactly when it survives and its parent did not. Passing that one boolean down, combined with bottom-up deletion, handles the whole problem.

**Trick.** Recurse with an `isRoot` flag. If the node is deleted, its surviving children become roots. Use a hash set for the delete list so membership is O(1).

**Edge cases that bite.**

- The original root is a root unless it is itself deleted.
- Collect new roots during the traversal, not afterwards.
- Children must be reassigned from the recursive calls, or deletions are lost.

**Complexity.** `O(n)` time, `O(n)` space — one traversal with O(1) set lookups. The delete set is the only extra space beyond recursion.

**Same pattern.** [Binary Tree Pruning](https://leetcode.com/problems/binary-tree-pruning/), [Trim a Binary Search Tree](https://leetcode.com/problems/trim-a-binary-search-tree/), [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/)

**Interview follow-ups.**

- **Q.** Why combine top-down and bottom-up here?
  <br>**A.** The isRoot flag flows down; the rewiring flows up. Several tree problems need both directions, and separating them keeps the code honest.
- **Q.** Why a set rather than scanning the delete list?
  <br>**A.** Scanning would be O(k) per node for O(n·k) total. The set makes each check constant.

</details>

#### `[DRILL]` 19. Time Needed to Inform All Employees &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1376

<!-- id:binary-trees-time-needed-to-inform-all-employees | order:55 | day:17 | pattern:tree-as-graph | template:T-GRAPH-02 -->

[Solve on LeetCode](https://leetcode.com/problems/time-needed-to-inform-all-employees/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `tree-as-graph`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** A general tree given as a parent array. Build children lists and the answer is the maximum root-to-leaf weighted depth - which is a DFS, not a BFS, because you want the longest path rather than the shortest.

**Trick.** Invert the manager array into a children adjacency list, then DFS accumulating informTime and taking the maximum over all leaves.

**Edge cases that bite.**

- The head has manager -1 and must be found, not assumed to be index 0.
- Leaves have informTime 0 but that must not be assumed.
- Recursion can be 10^5 deep - an explicit stack or BFS may be required.

**Complexity.** `O(n)` time, `O(n)` space — building the adjacency list is linear, and the DFS visits every node once.

**Same pattern.** [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/), [Maximum Depth of N-ary Tree](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/), [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

**Interview follow-ups.**

- **Q.** Why maximum and not sum?
  <br>**A.** Subordinates are informed in parallel, so the total time is set by the slowest chain, not the accumulated work.
- **Q.** Recursion depth risk.
  <br>**A.** A chain of 10^5 employees overflows the stack. Convert to an iterative DFS or a BFS carrying accumulated time.

</details>

#### `[SKIM]` 20. Deepest Leaves Sum &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1302

<!-- id:binary-trees-deepest-leaves-sum | order:52 | day:17 | pattern:bfs-levels | template:T-TREE-02 -->

[Solve on LeetCode](https://leetcode.com/problems/deepest-leaves-sum/)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bfs-levels`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The sum of the last level. With BFS you simply overwrite a running sum at each level and keep whatever survives - no depth tracking needed at all.

**Trick.** BFS, computing each level's sum and assigning (not adding) it to the answer. The final assignment is the deepest level.

**Edge cases that bite.**

- Assign rather than accumulate across levels.
- A single node is its own deepest level.
- The DFS version must reset the sum when a strictly greater depth is found.

**Complexity.** `O(n)` time, `O(w)` space — one BFS with constant work per node.

**Same pattern.** [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Find Bottom Left Tree Value](https://leetcode.com/problems/find-bottom-left-tree-value/), [Average of Levels in Binary Tree](https://leetcode.com/problems/average-of-levels-in-binary-tree/), [Sum of Left Leaves](https://leetcode.com/problems/sum-of-left-leaves/)

**Interview follow-ups.**

- **Q.** DFS version.
  <br>**A.** Track the maximum depth; on a strictly greater depth reset the sum, on an equal depth add to it. The reset is what people forget.

</details>

### Day 17 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Tree DP returns a tuple of states.** When a node's optimum depends on a choice it makes, return one value per choice and let the parent combine them. This removes exponential recomputation without a memo table.
  <br>↳ *House Robber III* — returning {robbed, notRobbed} per node; *Binary Tree Cameras* — three states - needs cover, has camera, is covered; *Distribute Coins in Binary Tree* — returning signed excess and accumulating absolute movement
- **A tree is a graph once you add parent edges.** Any problem needing upward movement becomes BFS or DFS on an undirected graph. Build a parent map first, and remember the visited set.
  <br>↳ *All Nodes Distance K in Binary Tree* — a parent map plus BFS bounded at k levels; *Time Needed to Inform All Employees* — inverting a parent array into children lists
- **Null sentinels make one traversal sufficient.** Preorder alone cannot rebuild a tree, but preorder with explicit nulls can - the sentinels encode exactly the shape that ordering alone omits. Delimiters are needed too.
  <br>↳ *Serialize and Deserialize Binary Tree* — '#' for nulls plus a separator between tokens; *Subtree of Another Tree* — the same serialisation turning subtree search into substring search
- **Exploit a structural guarantee instead of traversing.** Completeness lets you answer a perfect subtree's size by formula. Only one branch ever needs recursion, which turns O(n) into O(log^2 n).
  <br>↳ *Count Complete Tree Nodes* — comparing leftmost and rightmost depths, returning 2^h - 1 when they match; *Check Completeness of a Binary Tree* — enqueuing nulls so that completeness becomes 'no node after a null'
- **A dummy head removes the first-element case in any structure.** The linked-list trick works on tree levels too: append to a tail behind a dummy and the 'is this the first node' branch disappears.
  <br>↳ *Populating Next Right Pointers in Each Node II* — a dummy per level with a tail pointer; *Populating Next Right Pointers in Each Node* — the perfect-tree case where the wiring is direct
- **Normalise indices before they overflow.** Heap-style indexing doubles each level, so depth 60 exceeds 64 bits. Subtracting the level's first index preserves differences while keeping values small.
  <br>↳ *Maximum Width of Binary Tree* — subtracting the level's first index from every node in it
- **Prune bottom-up so removals cascade.** A node's removability depends on its children AFTER they have been pruned. Postorder guarantees that; preorder would judge against the un-pruned subtree.
  <br>↳ *Binary Tree Pruning* — recursing into both children and assigning the results back before testing the node; *Delete Nodes And Return Forest* — combining a downward isRoot flag with upward rewiring

#### From yesterday

- **Ask whether the answer depends on ancestors or descendants.** Descendants means return values upward. ↳ *Count Good Nodes in Binary Tree* — carrying the path maximum downward
- **A root-to-node path is an array, so array techniques apply.** Prefix sums with a hash map work on a tree path exactly as on a subarray - provided the map is unwound when the recursion backtracks. ↳ *Path Sum III* — a prefix-sum map seeded with {0,1} and decremented on the way back up
- **Two traversals pin down a tree, one does not.** Preorder gives the root. ↳ *Construct Binary Tree from Preorder and Inorder Traversal* — the inorder index map and building left before right
- **Traverse in the order that makes the successor already known.** Flattening in forward preorder would overwrite pointers still needed. ↳ *Flatten Binary Tree to Linked List* — right, left, node with a trailing prev pointer

#### Two days back

- **Pass context down when a node cannot see it** — Sum of Left Leaves
- **Returning a whole subtree beats copying it node by node** — Merge Two Binary Trees
- **Everything generalises from two children to many** — Maximum Depth of N-ary Tree

#### Earlier in binary-trees

- The three DFS traversals differ only in when the node is emitted · Capture the queue size before the level loop · Return one value upward, accumulate another locally · Parallel recursion compares or combines two trees at once · Minimum depth is not maximum depth with min substituted · Emit at a leaf, not at a null

### Day 18

*12 problems — 4 core, 5 drill, 3 skim.*

#### `[CORE]` 1. Validate Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 98

<!-- id:bst-validate-binary-search-tree | order:56 | day:18 | pattern:range-propagation | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/validate-binary-search-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=f-sj7I5oXEI)

**Asked by:** Amazon, Facebook, Microsoft, Google, Bloomberg &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `range-propagation`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Comparing each node only against its parent is the classic wrong answer. A node deep in a left subtree must be smaller than EVERY ancestor above it, and only a propagated range carries that constraint.

**Trick.** Pass (lo, hi) down, narrowing at each step. Use `long` bounds, or a tree containing INT_MIN breaks the sentinels. The inorder-strictly-increasing check is an equally valid alternative with no sentinels at all.

**Edge cases that bite.**

- Root 10, left child 5, that node's right child 12 - passes a parent check, fails validation. This is the canonical counterexample.
- Duplicates are not allowed, so comparisons are strict.
- INT_MIN or INT_MAX values break int-typed sentinels - use long.

**Complexity.** `O(n)` time, `O(h)` space — one traversal carrying two scalars. Every node is checked against its full ancestor constraint rather than just its parent.

**Same pattern.** [Recover Binary Search Tree](https://leetcode.com/problems/recover-binary-search-tree/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/), [Count Good Nodes in Binary Tree](https://leetcode.com/problems/count-good-nodes-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Give the counterexample for parent-only checking.
  <br>**A.** [10, 5, 15, null, null, 6, 20]. The node 6 sits in the root's right subtree and is smaller than 10, yet passes every parent comparison.
- **Q.** The inorder alternative.
  <br>**A.** Traverse inorder and verify each value strictly exceeds the previous. No sentinels needed, and it extends naturally to Recover BST.

</details>

#### `[CORE]` 2. Delete Node in a BST &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 450

<!-- id:bst-delete-node-in-a-bst | order:59 | day:18 | pattern:bst-delete | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/delete-node-in-a-bst/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=kouxiP_H5WE)

**Asked by:** Amazon, Microsoft, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bst-delete`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Three cases, and only the third is interesting. With zero or one child you splice. With two, you replace the value with the inorder successor - the smallest value in the right subtree - and then delete that successor, which by construction has at most one child.

**Trick.** `if (!left) return right; if (!right) return left;` handles the easy cases. Then find the leftmost node of the right subtree, copy its value up, and recursively delete it.

**Edge cases that bite.**

- The successor is the LEFTMOST node of the right subtree, not the right child.
- Deleting the successor recursively is safe because it has at most one child.
- Deleting the root must return the new root.
- The predecessor works equally well - either is a valid answer.

**Complexity.** `O(h)` time, `O(h)` space — one descent to find the node, plus one to find and remove the successor.

**Same pattern.** [Insert into a Binary Search Tree](https://leetcode.com/problems/insert-into-a-binary-search-tree/), [Trim a Binary Search Tree](https://leetcode.com/problems/trim-a-binary-search-tree/), [Balance a Binary Search Tree](https://leetcode.com/problems/balance-a-binary-search-tree/), [Binary Tree Pruning](https://leetcode.com/problems/binary-tree-pruning/)

**Interview follow-ups.**

- **Q.** Why the successor rather than any node?
  <br>**A.** It is the smallest value greater than the deleted one, so placing it at the node preserves the BST invariant on both sides simultaneously.
- **Q.** Why does the successor have at most one child?
  <br>**A.** It is the leftmost node of a subtree, so by definition it has no left child.

</details>

#### `[CORE]` 3. Lowest Common Ancestor of a Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 235

<!-- id:bst-lowest-common-ancestor-of-a-binary-search-tree | order:60 | day:18 | pattern:bst-split-point | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=cX_kPV_foZc)

**Asked by:** Amazon, Facebook, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bst-split-point`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** In a BST the LCA is the first node whose value lies between the two targets - the point where their search paths diverge. No recursion and no subtree exploration is needed at all, which is a dramatic simplification over the general-tree version.

**Trick.** Descend from the root. Both targets smaller means go left, both larger means go right, otherwise the current node is the answer.

**Edge cases that bite.**

- A node may be its own ancestor - if p is an ancestor of q, p is the LCA and the split test handles it.
- The targets may arrive in either order, so compare against both.
- Iterative is O(1) space.

**Complexity.** `O(h)` time, `O(1) iterative` space — one descent. Compare with the general binary tree version, which must explore both subtrees at every node for O(n).

**Same pattern.** [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/), [Search in a Binary Search Tree](https://leetcode.com/problems/search-in-a-binary-search-tree/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)

**Interview follow-ups.**

- **Q.** Why is the BST version so much cheaper?
  <br>**A.** The invariant tells you which side each target is on without looking. The general tree has no such information, so it must search both sides.
- **Q.** What if a node might not be present?
  <br>**A.** The split test still returns a node. Verify both targets exist with two searches, or the answer is meaningless.

</details>

#### `[CORE]` 4. Kth Smallest Element in a BST &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 230

<!-- id:bst-kth-smallest-element-in-a-bst | order:61 | day:18 | pattern:inorder-with-counter | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/kth-largest-smallest-element-in-binary-search-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=9TJYWh0adfk)

**Asked by:** Amazon, Facebook, Google, Uber &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `inorder-with-counter`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Inorder on a BST yields sorted order, so the kth smallest is simply the kth element emitted. The follow-up about frequent modifications is where the real content is - and the answer is node augmentation.

**Trick.** Iterative inorder with a counter, returning as soon as the count reaches k. Do not build the full sorted list.

**Edge cases that bite.**

- Return early - building the whole list is O(n) when O(h + k) suffices.
- k is 1-indexed.
- A degenerate tree makes this O(n) regardless.

**Complexity.** `O(h + k)` time, `O(h)` space — the descent to the smallest element is O(h), then k steps of the traversal. Collecting everything first is O(n).

**Same pattern.** [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Find Mode in Binary Search Tree](https://leetcode.com/problems/find-mode-in-binary-search-tree/)

**Interview follow-ups.**

- **Q.** The tree is modified frequently and this query is common.
  <br>**A.** Augment each node with its subtree size. Then descending is O(h) per query: at each node you know how many values lie to its left. This is an order-statistic tree.
- **Q.** Why is augmentation the general answer?
  <br>**A.** Any aggregate that can be computed from a node's children - size, sum, min, max - can be cached at the node and maintained in O(1) per structural change.

</details>

#### `[DRILL]` 5. Search in a Binary Search Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 700

<!-- id:bst-search-in-a-binary-search-tree | order:57 | day:18 | pattern:bst-descent | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/search-in-a-binary-search-tree/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/search-in-a-binary-search-tree-2/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=KcNt6v_56cc)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bst-descent`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The BST invariant means each comparison discards an entire subtree. Iteratively this is O(1) space, which is worth writing rather than defaulting to recursion out of habit.

**Trick.** `while (r && r->val != key) r = key < r->val ? r->left : r->right;`. One line, no stack.

**Edge cases that bite.**

- Returns null when absent, not a sentinel node.
- The iterative form is genuinely O(1) space; the recursive form is O(h).
- A degenerate tree makes this O(n).

**Complexity.** `O(h)` time, `O(1) iterative` space — each step eliminates one subtree. O(log n) when balanced, O(n) when degenerate.

**Same pattern.** [Insert into a Binary Search Tree](https://leetcode.com/problems/insert-into-a-binary-search-tree/), [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/), [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/), [Binary Search](https://leetcode.com/problems/binary-search/)

**Interview follow-ups.**

- **Q.** Why is O(h) not the same as O(log n)?
  <br>**A.** Only a balanced tree has h = O(log n). Inserting sorted data gives a chain, and every BST operation degrades to linear.
- **Q.** How does std::set avoid that?
  <br>**A.** Red-black balancing - rotations and recolouring keep the longest path within twice the shortest.

</details>

#### `[DRILL]` 6. Insert into a Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 701

<!-- id:bst-insert-into-a-binary-search-tree | order:58 | day:18 | pattern:bst-descent | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/insert-into-a-binary-search-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=FiFiNvM29ps)

**Asked by:** Amazon, Microsoft &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bst-descent`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Descend to the null position the value belongs in and attach there. Any valid BST is an acceptable answer, so no rebalancing is required - which is exactly why repeated sorted insertion degenerates.

**Trick.** Recurse and assign the result back: `r->left = insert(r->left, key)`. The null base case creates the node, and the assignment wires it in.

**Edge cases that bite.**

- Empty tree returns a new single node.
- Duplicates are excluded by constraint.
- Assign the recursive result back, or the new node is created and discarded.

**Complexity.** `O(h)` time, `O(h)` space — one descent to a leaf position.

**Same pattern.** [Search in a Binary Search Tree](https://leetcode.com/problems/search-in-a-binary-search-tree/), [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/), [Balance a Binary Search Tree](https://leetcode.com/problems/balance-a-binary-search-tree/), [Convert Sorted Array to Binary Search Tree](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/)

**Interview follow-ups.**

- **Q.** What happens if you insert sorted data?
  <br>**A.** Every value goes to the same side and the tree becomes a linked list of height n. This is the motivation for self-balancing trees.
- **Q.** Insert iteratively.
  <br>**A.** Track a parent pointer while descending, then attach on the correct side. O(1) space.

</details>

#### `[DRILL]` 7. Convert Sorted Array to Binary Search Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 108

<!-- id:bst-convert-sorted-array-to-binary-search-tree | order:62 | day:18 | pattern:balanced-construction | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/)

**Asked by:** Amazon, Microsoft, Airbnb &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `balanced-construction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Choosing the middle element as root at every level is what produces balance. The sorted array is already an inorder traversal, so the only decision is where to split it - and the midpoint gives equal subtree sizes.

**Trick.** Recurse on (lo, hi) taking mid as the root. Do not slice the array - pass indices, or you allocate O(n) at every level.

**Edge cases that bite.**

- Passing sub-vectors instead of indices makes the space O(n log n).
- Even-length ranges have two valid midpoints; either gives an accepted answer.
- Empty range returns null.

**Complexity.** `O(n)` time, `O(log n)` space — each element becomes exactly one node, and the recursion is log n deep because the split is balanced.

**Same pattern.** [Balance a Binary Search Tree](https://leetcode.com/problems/balance-a-binary-search-tree/), [Convert Sorted List to Binary Search Tree](https://leetcode.com/problems/convert-sorted-list-to-binary-search-tree/), [Construct Binary Search Tree from Preorder Traversal](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/)

**Interview follow-ups.**

- **Q.** The input is a sorted linked list.
  <br>**A.** LC 109. Either convert to an array first, or use the inorder-simulation trick: build left-to-right while advancing a list pointer, which is O(n) with no array.
- **Q.** Why does taking the midpoint guarantee balance?
  <br>**A.** It splits the remaining elements into two sets differing in size by at most one, at every level, which is exactly the balance condition.

</details>

#### `[DRILL]` 8. Range Sum of BST &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 938

<!-- id:bst-range-sum-of-bst | order:63 | day:18 | pattern:bst-pruned-traversal | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/range-sum-of-bst/)

**Asked by:** Facebook, Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bst-pruned-traversal`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The point is the pruning, not the sum. When a node's value is below the range, its entire left subtree is irrelevant and can be skipped without examination - which is what makes this cheaper than a full traversal.

**Trick.** If val < low, recurse right only. If val > high, recurse left only. Otherwise add and recurse both.

**Edge cases that bite.**

- The range is inclusive on both ends.
- Without pruning this is O(n) and the BST property is wasted.
- Sums fit in int at these constraints, but check.

**Complexity.** `O(h + k) where k is the number of in-range nodes` time, `O(h)` space — pruned subtrees are never entered, so only the descent path plus the in-range region is visited.

**Same pattern.** [Trim a Binary Search Tree](https://leetcode.com/problems/trim-a-binary-search-tree/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Two Sum IV - Input is a BST](https://leetcode.com/problems/two-sum-iv-input-is-a-bst/), [Search in a Binary Search Tree](https://leetcode.com/problems/search-in-a-binary-search-tree/)

**Interview follow-ups.**

- **Q.** Why is the pruning correct?
  <br>**A.** If a node's value is below low, every value in its left subtree is smaller still, so none can be in range. The invariant guarantees it without inspection.
- **Q.** Trim the tree to the range instead.
  <br>**A.** LC 669 - the same pruning, but rewiring rather than summing.

</details>

#### `[DRILL]` 9. Two Sum IV - Input is a BST &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 653

<!-- id:bst-two-sum-iv-input-is-a-bst | order:64 | day:18 | pattern:inorder-two-pointer | template:T-TP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/two-sum-iv-input-is-a-bst/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/two-sum-in-bst-check-if-there-exists-a-pair-with-sum-k) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ssL3sHwPeb4)

**Asked by:** Amazon, Facebook &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `inorder-two-pointer`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Three valid solutions with different trade-offs: a hash set during any traversal, an inorder array plus two pointers, or two BST iterators converging from both ends. The third is the O(h) space answer the follow-up wants.

**Trick.** For the O(h) version, run a forward iterator from the smallest and a reverse iterator from the largest, moving whichever is needed - exactly two-pointer on a sorted array, without materialising it.

**Edge cases that bite.**

- An element must not pair with itself - check that the two iterators have not met.
- Duplicates are excluded by the BST property.
- The hash-set solution is O(n) space and does not use the BST property at all.

**Complexity.** `O(n)` time, `O(h) with iterators, O(n) with a set` space — each node is visited once by one of the two iterators. The set version is simpler but ignores the sortedness entirely.

**Same pattern.** [Two Sum](https://leetcode.com/problems/two-sum/), [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/), [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Interview follow-ups.**

- **Q.** Which solution would you give first?
  <br>**A.** Name all three and their trade-offs. The set version is fastest to write; the dual-iterator version is what demonstrates you noticed it was a BST.
- **Q.** Why does the set version not use the BST property?
  <br>**A.** It would work identically on any binary tree. If a problem gives you a BST and your solution ignores that, expect a follow-up.

</details>

#### `[SKIM]` 10. Minimum Absolute Difference in BST &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 530

<!-- id:bst-minimum-absolute-difference-in-bst | order:65 | day:18 | pattern:inorder-adjacent | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-absolute-difference-in-bst/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `inorder-adjacent`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The minimum difference in a BST is always between two values adjacent in sorted order, and inorder produces exactly that order. So one traversal comparing against the previous value suffices.

**Trick.** Keep a `prev` pointer across the inorder traversal and take the minimum of `cur->val - prev`. Initialise prev to a sentinel or handle the first node.

**Edge cases that bite.**

- prev must persist across recursive calls - a member variable or reference parameter.
- At least two nodes are guaranteed.
- Values are non-negative here, but the subtraction order still matters.

**Complexity.** `O(n)` time, `O(h)` space — one traversal. Comparing all pairs is O(n^2) and ignores the BST property.

**Same pattern.** [Minimum Distance Between BST Nodes](https://leetcode.com/problems/minimum-distance-between-bst-nodes/), [Minimum Absolute Difference](https://leetcode.com/problems/minimum-absolute-difference/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Interview follow-ups.**

- **Q.** Why must the minimum be between inorder-adjacent nodes?
  <br>**A.** Sorted order places each value next to its nearest neighbours numerically. Any non-adjacent pair has something between them that is closer to both.
- **Q.** LC 783 is the same problem.
  <br>**A.** Identical, under a different name. Worth noticing how often that happens.

</details>

#### `[SKIM]` 11. Minimum Distance Between BST Nodes &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 783

<!-- id:bst-minimum-distance-between-bst-nodes | order:66 | day:18 | pattern:inorder-adjacent | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/minimum-distance-between-bst-nodes/)

**Asked by:** Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `inorder-adjacent`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Literally the same problem as LC 530 with a different title. Solving both back to back is a useful reminder to check whether a problem is one you have already done.

**Trick.** Identical: inorder traversal tracking the previous value.

**Edge cases that bite.**

- Same as LC 530 in every respect.
- prev must survive across calls.
- At least two nodes guaranteed.

**Complexity.** `O(n)` time, `O(h)` space — one inorder pass.

**Same pattern.** [Minimum Absolute Difference in BST](https://leetcode.com/problems/minimum-absolute-difference-in-bst/), [Minimum Absolute Difference](https://leetcode.com/problems/minimum-absolute-difference/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Interview follow-ups.**

- **Q.** Why do duplicate problems exist on LeetCode?
  <br>**A.** Different contributors, different years. The practical lesson is to search your own solved list before starting from scratch.

</details>

#### `[SKIM]` 12. Increasing Order Search Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 897

<!-- id:bst-increasing-order-search-tree | order:67 | day:18 | pattern:inorder-rewire | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/increasing-order-search-tree/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `inorder-rewire`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rewire the tree into a right-only chain in inorder order. Doing it during the traversal with a trailing pointer avoids building a list first, and it is the same shape as flattening a binary tree.

**Trick.** Inorder traversal keeping a `tail` pointer. At each node, null its left, attach it to tail->right, and advance tail. A dummy head removes the first-node case.

**Edge cases that bite.**

- Left pointers must be nulled, or the result is not a proper chain.
- A dummy head avoids special-casing the first node.
- Rewiring during traversal requires care not to lose the right subtree - visit it before reassigning.

**Complexity.** `O(n)` time, `O(h)` space — one traversal rewiring two pointers per node.

**Same pattern.** [Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Balance a Binary Search Tree](https://leetcode.com/problems/balance-a-binary-search-tree/)

**Interview follow-ups.**

- **Q.** How does this relate to flattening a binary tree?
  <br>**A.** Same operation in a different traversal order - preorder there, inorder here. Both use a trailing pointer and null one side.

</details>

### Day 18 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Validate with a propagated range, never a parent comparison.** A node in a left subtree must be smaller than every ancestor above it, not just its parent. [10, 5, 15, null, null, 6, 20] passes every parent check and is not a BST.
  <br>↳ *Validate Binary Search Tree* — carrying (lo, hi) downward with long bounds
- **Inorder on a BST is sorted, which solves most BST problems.** Validation, kth smallest, mode finding, minimum gap and recovery are all one inorder pass with a little bookkeeping.
  <br>↳ *Kth Smallest Element in a BST* — an inorder counter with early return; *Minimum Absolute Difference in BST* — comparing each value against the previous; *Validate Binary Search Tree* — the alternative strictly-increasing formulation
- **The invariant lets you skip subtrees without inspecting them.** If a node's value is below the range, every value in its left subtree is smaller still. That is a proof, not a heuristic, and it is what makes BST operations O(h).
  <br>↳ *Range Sum of BST* — recursing into only one side when the node is out of range; *Lowest Common Ancestor of a Binary Search Tree* — descending to the first node that splits the two targets; *Search in a Binary Search Tree* — the basic descent
- **Delete by replacing with the inorder successor.** Zero or one child is a splice. Two children means copying the smallest value from the right subtree, which by construction has no left child and is therefore easy to remove.
  <br>↳ *Delete Node in a BST* — finding the leftmost node of the right subtree and recursively deleting it
- **The midpoint as root is what produces balance.** A sorted array is already an inorder traversal, so the only choice is where to split. The middle gives subtrees differing by at most one at every level.
  <br>↳ *Convert Sorted Array to Binary Search Tree* — recursing on index ranges rather than slicing

#### Carried forward

- **binary-trees** — The three DFS traversals differ only in when the node is emitted; Capture the queue size before the level loop; Return one value upward, accumulate another locally; Parallel recursion compares or combines two trees at once; Minimum depth is not maximum depth with min substituted; Emit at a leaf, not at a null; Pass context down when a node cannot see it; Returning a whole subtree beats copying it node by node; Everything generalises from two children to many; Ask whether the answer depends on ancestors or descendants; A root-to-node path is an array, so array techniques apply; Two traversals pin down a tree, one does not; Traverse in the order that makes the successor already known; Tree DP returns a tuple of states; A tree is a graph once you add parent edges; Null sentinels make one traversal sufficient; Exploit a structural guarantee instead of traversing; A dummy head removes the first-element case in any structure; Normalise indices before they overflow; Prune bottom-up so removals cascade

### Day 19

*13 problems — 5 core, 5 drill, 3 skim.*

#### `[CORE]` 1. Binary Search Tree Iterator &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 173

<!-- id:bst-binary-search-tree-iterator | order:68 | day:19 | pattern:controlled-inorder | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-search-tree-iterator/) &nbsp;·&nbsp; [TUF article](https://takeuforward.org/data-structure/bst-iterator) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=D2jMcmxU4bs)

**Asked by:** Amazon, Facebook, Google, Microsoft, LinkedIn &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `controlled-inorder`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Materialising the whole inorder list is O(n) space and defeats the purpose. Keeping only the left spine on a stack gives O(h) space with amortised O(1) next() - the recursion's state made explicit and paused.

**Trick.** Push the entire left spine in the constructor. next() pops, then pushes the left spine of the popped node's right child. hasNext() is simply a non-empty stack.

**Edge cases that bite.**

- Only the LEFT spine is pushed, never whole subtrees.
- After popping, descend the right child's left spine, not the right child alone.
- next() is O(h) worst case but O(1) amortised across n calls.

**Complexity.** `O(1) amortised per next()` time, `O(h)` space — each node is pushed and popped exactly once across all calls, so n calls cost O(n) total despite individual calls costing up to O(h).

**Same pattern.** [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Two Sum IV - Input is a BST](https://leetcode.com/problems/two-sum-iv-input-is-a-bst/), [Flatten Nested List Iterator](https://leetcode.com/problems/flatten-nested-list-iterator/)

**Interview follow-ups.**

- **Q.** Justify the amortised bound.
  <br>**A.** Every node enters the stack once and leaves once over the iterator's lifetime. Total work across n calls is O(n), so O(1) each on average.
- **Q.** Add a prev() operation.
  <br>**A.** Keep a second stack for the right spine, or record visited nodes. Genuinely harder - LC 1586.
- **Q.** Why is O(h) space better than O(n) here?
  <br>**A.** For a balanced tree that is log n versus n, and the iterator may be abandoned early, in which case the unbuilt portion was never paid for.

</details>

#### `[CORE]` 2. Recover Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 99

<!-- id:bst-recover-binary-search-tree | order:69 | day:19 | pattern:inorder-descent-detection | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/recover-binary-search-tree/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=ZWGW7FminDM)

**Asked by:** Amazon, Facebook, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `inorder-descent-detection`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** An inorder traversal of a valid BST is strictly increasing. Two swapped nodes create either one descent, when they are adjacent, or two. Recording the right elements of those descents identifies both culprits.

**Trick.** Track prev during inorder. On the FIRST descent record both prev and cur; on any LATER descent record only cur. Then swap the two recorded values.

**Edge cases that bite.**

- Adjacent swaps produce exactly one descent - the second node is cur of that same descent.
- Non-adjacent swaps produce two descents; take the first's prev and the last's cur.
- Swap VALUES, not nodes, unless the problem requires structural preservation.
- Morris traversal gives the O(1) space follow-up.

**Complexity.** `O(n)` time, `O(h), or O(1) with Morris` space — one traversal detecting at most two anomalies.

**Same pattern.** [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Interview follow-ups.**

- **Q.** Do it in O(1) space.
  <br>**A.** Morris traversal - thread each node's predecessor to it, detect descents during the threaded walk, and undo the threads. That is the stated follow-up.
- **Q.** Why does an adjacent swap give only one descent?
  <br>**A.** Swapping neighbours in sorted order creates a single inversion. Non-adjacent swaps break the order at two separate points.

</details>

#### `[CORE]` 3. Convert BST to Greater Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 538

<!-- id:bst-convert-bst-to-greater-tree | order:70 | day:19 | pattern:reverse-inorder-accumulate | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/convert-bst-to-greater-tree/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `reverse-inorder-accumulate`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Each node must be increased by the sum of everything larger, so traverse in REVERSE inorder - right, node, left - accumulating as you go. The reversal is the entire insight.

**Trick.** Keep a running sum. Recurse right, add the node's value to the sum, assign the sum back to the node, then recurse left.

**Edge cases that bite.**

- The running sum must persist across calls - a member or reference parameter.
- The node's new value is the sum AFTER adding its own value.
- LC 1038 is the identical problem.

**Complexity.** `O(n)` time, `O(h)` space — one traversal with constant work per node. Computing each node's greater-sum independently would be O(n^2).

**Same pattern.** [Binary Search Tree to Greater Sum Tree](https://leetcode.com/problems/binary-search-tree-to-greater-sum-tree/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Range Sum of BST](https://leetcode.com/problems/range-sum-of-bst/)

**Interview follow-ups.**

- **Q.** Why reverse inorder specifically?
  <br>**A.** It visits values in descending order, so when you arrive at a node every larger value has already been accumulated.
- **Q.** LC 1038 is the same problem.
  <br>**A.** Identical. Another duplicate worth recognising rather than re-solving.

</details>

#### `[CORE]` 4. Construct Binary Search Tree from Preorder Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1008

<!-- id:bst-construct-binary-search-tree-from-preorder-traversal | order:73 | day:19 | pattern:bound-carrying-construction | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/) &nbsp;·&nbsp; [Striver video](https://www.youtube.com/watch?v=UmJT3j26t1I)

**Asked by:** Amazon, Google, Microsoft &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `bound-carrying-construction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Preorder alone is enough for a BST, because the invariant supplies the shape that a second traversal would otherwise provide. Carrying an upper bound down the recursion makes the construction linear rather than quadratic.

**Trick.** Consume preorder with a shared index. Recurse with an upper bound; stop as soon as the next value exceeds it. Left gets the current node's value as its bound; right inherits the parent's.

**Edge cases that bite.**

- Without the bound, splitting by scanning for the first larger element is O(n^2) on a degenerate tree.
- The index must be shared by reference across all calls.
- A strictly increasing preorder produces a right-leaning chain.

**Complexity.** `O(n)` time, `O(h)` space — each value is consumed exactly once, with the bound test doing the splitting in O(1).

**Same pattern.** [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Convert Sorted Array to Binary Search Tree](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)

**Interview follow-ups.**

- **Q.** Why does a BST need only one traversal?
  <br>**A.** The ordering invariant determines which side each value belongs on, which is exactly the information inorder supplies for a general tree.
- **Q.** Serialise a BST compactly.
  <br>**A.** Preorder alone, no null sentinels - LC 449. That is this construction run in reverse.
- **Q.** The same bound idea appears where else?
  <br>**A.** Validating a BST. Construction and validation are the same range propagation, used to build versus to check.

</details>

#### `[CORE]` 5. Unique Binary Search Trees &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 96

<!-- id:bst-unique-binary-search-trees | order:74 | day:19 | pattern:catalan-dp | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/unique-binary-search-trees/)

**Asked by:** Amazon, Google, Facebook &nbsp;·&nbsp; **Campus OA:** `HIGH` &nbsp;·&nbsp; **Pattern:** `catalan-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Choosing a root splits the remaining nodes into a left group and a right group whose counts multiply. Summing over every root choice gives the Catalan recurrence, and the whole problem is two nested loops.

**Trick.** `dp[n] = sum over i of dp[i] * dp[n-1-i]`, with dp[0] = 1. The empty tree counting as one arrangement is what makes the base case work.

**Edge cases that bite.**

- dp[0] = 1, not 0 - an empty subtree is one valid arrangement.
- The values do not matter, only the count, because any n distinct values give the same structural count.
- Catalan numbers grow fast but fit in int for n <= 19.

**Complexity.** `O(n²)` time, `O(n)` space — two nested loops over the DP table. The closed form C(2n,n)/(n+1) is O(n) but needs careful overflow handling.

**Same pattern.** [Unique Binary Search Trees II](https://leetcode.com/problems/unique-binary-search-trees-ii/), [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/), [Number of Ways to Reorder Array to Get Same BST](https://leetcode.com/problems/number-of-ways-to-reorder-array-to-get-same-bst/)

**Interview follow-ups.**

- **Q.** Derive the recurrence.
  <br>**A.** With root i, the left subtree holds i nodes and the right holds n-1-i. Their counts are independent, so they multiply; summing over i gives the total.
- **Q.** Where else do Catalan numbers appear?
  <br>**A.** Balanced bracket sequences, triangulations of a polygon, and monotonic lattice paths - which is why Generate Parentheses has the same count.

</details>

#### `[DRILL]` 6. Trim a Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 669

<!-- id:bst-trim-a-binary-search-tree | order:72 | day:19 | pattern:bst-pruned-rewire | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/trim-a-binary-search-tree/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `bst-pruned-rewire`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** When a node is below the range, the node AND its entire left subtree are out, so the answer is whatever trimming its right subtree returns. Returning the recursive result directly is what makes this four lines rather than a case analysis.

**Trick.** `if (val < low) return trim(right); if (val > high) return trim(left);` then recurse into both and return the node.

**Edge cases that bite.**

- Return the recursive call's result directly when out of range - do not attempt to rewire.
- The range is inclusive.
- The root itself may be trimmed away.

**Complexity.** `O(n) worst, far less with pruning` time, `O(h)` space — each node is visited at most once, and entire subtrees are skipped when the invariant proves them out of range.

**Same pattern.** [Range Sum of BST](https://leetcode.com/problems/range-sum-of-bst/), [Binary Tree Pruning](https://leetcode.com/problems/binary-tree-pruning/), [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/), [Delete Nodes And Return Forest](https://leetcode.com/problems/delete-nodes-and-return-forest/)

**Interview follow-ups.**

- **Q.** Why can you discard the left subtree when val < low?
  <br>**A.** Every value there is smaller than val, which is already below low. The invariant proves them all out of range without inspection.
- **Q.** How does this differ from Binary Tree Pruning?
  <br>**A.** Pruning has no ordering to exploit and must examine every node. Trimming can skip whole subtrees, which is the BST invariant paying off.

</details>

#### `[DRILL]` 7. Unique Binary Search Trees II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 95

<!-- id:bst-unique-binary-search-trees-ii | order:75 | day:19 | pattern:catalan-construction | template:T-BT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/unique-binary-search-trees-ii/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `catalan-construction`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The counting version is DP; generating them all is necessarily exponential, because the output itself is Catalan-many trees. The structure is the same - choose a root, combine every left option with every right option.

**Trick.** Recurse on a value range returning a vector of trees. For each root choice, take the Cartesian product of the left and right result lists.

**Edge cases that bite.**

- An empty range must return a vector containing one nullptr, not an empty vector - otherwise the product is empty and whole branches vanish.
- Subtrees can be shared between results, or deep-copied; sharing is accepted here.
- n <= 8 by constraint, because the output explodes.

**Complexity.** `O(Catalan(n) · n)` time, `O(Catalan(n) · n)` space — the output size is the Catalan number, and each tree costs O(n) to assemble.

**Same pattern.** [Unique Binary Search Trees](https://leetcode.com/problems/unique-binary-search-trees/), [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/), [Construct Binary Search Tree from Preorder Traversal](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/)

**Interview follow-ups.**

- **Q.** Why must the empty range return {nullptr}?
  <br>**A.** The Cartesian product of an empty list with anything is empty, which would discard every tree having an empty subtree. A list containing one null keeps the product non-trivial.
- **Q.** Memoise by range.
  <br>**A.** Trees for range [i, j] depend only on its length when values are consecutive, so results can be reused with an offset.

</details>

#### `[DRILL]` 8. All Elements in Two Binary Search Trees &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1305

<!-- id:bst-all-elements-in-two-binary-search-trees | order:76 | day:19 | pattern:merge-two-inorders | template:T-SORT-01 -->

[Solve on LeetCode](https://leetcode.com/problems/all-elements-in-two-binary-search-trees/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `merge-two-inorders`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Two inorder traversals produce two sorted lists, and merging them is the standard linear merge. The O(h) space follow-up runs two BST iterators in lockstep instead of materialising either list.

**Trick.** Collect both inorders, then merge with two pointers. For O(h) space, use two stack-based iterators and advance whichever holds the smaller value.

**Edge cases that bite.**

- Duplicates across the two trees are both kept.
- Either tree may be empty.
- Sorting the concatenation is O(n log n) and throws away the sortedness.

**Complexity.** `O(n + m)` time, `O(n + m), or O(h1 + h2) with iterators` space — two linear traversals plus a linear merge. Concatenating and sorting would be O(n log n).

**Same pattern.** [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/), [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)

**Interview follow-ups.**

- **Q.** Do it in O(h1 + h2) space.
  <br>**A.** Two BST iterators, advancing whichever front is smaller. This is the k-way merge idea with k = 2 and the lists never materialised.
- **Q.** Why not concatenate and sort?
  <br>**A.** It works and is one line, but it discards the fact that both inputs are already sorted - which is the whole reason the problem gives you BSTs.

</details>

#### `[DRILL]` 9. Balance a Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1382

<!-- id:bst-balance-a-binary-search-tree | order:77 | day:19 | pattern:flatten-and-rebuild | template:T-BST-01 -->

[Solve on LeetCode](https://leetcode.com/problems/balance-a-binary-search-tree/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `flatten-and-rebuild`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Rather than rotating, flatten the tree to a sorted array via inorder and rebuild it balanced from the midpoint. Two operations you already know, composed - which beats implementing AVL rotations under time pressure.

**Trick.** Inorder into a vector, then run Convert Sorted Array to BST on it.

**Edge cases that bite.**

- Any balanced arrangement is accepted, so the midpoint choice is free.
- O(n) extra space for the array; the Day-Stout-Warren algorithm does it in O(1).
- An already-balanced tree is rebuilt unnecessarily but correctly.

**Complexity.** `O(n)` time, `O(n)` space — one traversal to flatten and one linear pass to rebuild.

**Same pattern.** [Convert Sorted Array to Binary Search Tree](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/), [Increasing Order Search Tree](https://leetcode.com/problems/increasing-order-search-tree/), [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/)

**Interview follow-ups.**

- **Q.** Do it in O(1) extra space.
  <br>**A.** Day-Stout-Warren: rotate the tree into a right-leaning vine, then perform a series of left rotations to balance it. Worth naming; rarely worth implementing.
- **Q.** Why is this easier than AVL rebalancing?
  <br>**A.** AVL maintains balance incrementally on every insert. This rebuilds once, which is simpler when you do not need the invariant preserved between operations.

</details>

#### `[DRILL]` 10. Find Mode in Binary Search Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 501

<!-- id:bst-find-mode-in-binary-search-tree | order:78 | day:19 | pattern:inorder-run-counting | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/find-mode-in-binary-search-tree/)

**Asked by:** Google, Amazon &nbsp;·&nbsp; **Campus OA:** `MEDIUM` &nbsp;·&nbsp; **Pattern:** `inorder-run-counting`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Duplicates in a BST are adjacent in inorder order, so counting modes is a run-length scan rather than a frequency map. That is what satisfies the O(1) extra space follow-up.

**Trick.** Inorder with a prev value and a run counter. Reset the run on a change; when the run beats the best, clear the result list and start over; when it ties, append.

**Edge cases that bite.**

- Several modes may tie - the result is a list, not a single value.
- The final run must be evaluated after the traversal ends.
- A frequency map is O(n) space and is what the follow-up rules out.

**Complexity.** `O(n)` time, `O(h) for recursion, O(1) with Morris` space — one traversal with constant state. The map-based solution is simpler but ignores the sortedness.

**Same pattern.** [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/), [Minimum Absolute Difference in BST](https://leetcode.com/problems/minimum-absolute-difference-in-bst/), [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

**Interview follow-ups.**

- **Q.** Why can you avoid a frequency map here?
  <br>**A.** Equal values are contiguous in inorder, so a running count suffices. On an unordered tree you would need the map.
- **Q.** The two-pass trick.
  <br>**A.** One pass to find the maximum run length, a second to collect every value achieving it. Avoids clearing and rebuilding the result list.

</details>

#### `[SKIM]` 11. Binary Search Tree to Greater Sum Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1038

<!-- id:bst-binary-search-tree-to-greater-sum-tree | order:71 | day:19 | pattern:reverse-inorder-accumulate | template:T-TREE-01 -->

[Solve on LeetCode](https://leetcode.com/problems/binary-search-tree-to-greater-sum-tree/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `reverse-inorder-accumulate`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The same problem as LC 538 under a different title. Worth solving only as a two-minute confirmation that the reverse-inorder accumulation is now automatic.

**Trick.** Identical: reverse inorder with a running sum.

**Edge cases that bite.**

- Same as LC 538.
- Running sum persists across calls.
- Assign after adding.

**Complexity.** `O(n)` time, `O(h)` space — one reverse-inorder pass.

**Same pattern.** [Convert BST to Greater Tree](https://leetcode.com/problems/convert-bst-to-greater-tree/), [Range Sum of BST](https://leetcode.com/problems/range-sum-of-bst/), [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)

**Interview follow-ups.**

- **Q.** How quickly did you recognise the duplicate?
  <br>**A.** If it took more than ten seconds, the reverse-inorder pattern is not yet automatic. Redo LC 538 cold tomorrow.

</details>

#### `[SKIM]` 12. Count Nodes Equal to Average of Subtree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 2265

<!-- id:bst-count-nodes-equal-to-average-of-subtree | order:79 | day:19 | pattern:bottom-up-return | template:T-TREE-03 -->

[Solve on LeetCode](https://leetcode.com/problems/count-nodes-equal-to-average-of-subtree/)

**Asked by:** Amazon &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `bottom-up-return`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** Return a (sum, count) pair from each node so the parent can compute its own average in constant time. Computing each subtree's average independently would be O(n^2).

**Trick.** Return {sum, count}. The average uses integer division, so compare `sum / count == node->val` exactly as specified.

**Edge cases that bite.**

- Integer division truncates, which is the intended behaviour here.
- A leaf always equals its own average and is always counted.
- Null returns {0, 0}.

**Complexity.** `O(n)` time, `O(h)` space — one traversal returning a small tuple, which is the general fix for 'each node needs an aggregate of its subtree'.

**Same pattern.** [Binary Tree Tilt](https://leetcode.com/problems/binary-tree-tilt/), [House Robber III](https://leetcode.com/problems/house-robber-iii/), [Distribute Coins in Binary Tree](https://leetcode.com/problems/distribute-coins-in-binary-tree/), [Average of Levels in Binary Tree](https://leetcode.com/problems/average-of-levels-in-binary-tree/)

**Interview follow-ups.**

- **Q.** Why return a pair rather than two traversals?
  <br>**A.** Sum and count are both needed at every node. One traversal returning both is O(n); computing either separately per node is O(n^2).
- **Q.** This does not use the BST property at all.
  <br>**A.** Correct - it works on any binary tree. Worth noticing when a BST-tagged problem does not actually need the invariant.

</details>

#### `[SKIM]` 13. Number of Ways to Reorder Array to Get Same BST &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 1569

<!-- id:bst-number-of-ways-to-reorder-array-to-get-same-bst | order:80 | day:19 | pattern:combinatorial-tree-dp | template:T-DP-01 -->

[Solve on LeetCode](https://leetcode.com/problems/number-of-ways-to-reorder-array-to-get-same-bst/)

**Asked by:** Amazon, Google &nbsp;·&nbsp; **Campus OA:** `LOW` &nbsp;·&nbsp; **Pattern:** `combinatorial-tree-dp`

<details>
<summary><b>What this teaches you</b></summary>

**Insight.** The root is fixed as the first element. Any interleaving of the left and right subtrees' insertion orders produces the same tree, so the count is a binomial coefficient times each subtree's own count - a clean recursive combinatorial argument.

**Trick.** ways(seq) = C(n-1, leftSize) * ways(left) * ways(right). Precompute Pascal's triangle modulo 1e9+7, and subtract one at the very end to exclude the original ordering.

**Edge cases that bite.**

- Subtract 1 only once, at the top level, not at every recursion.
- Modular arithmetic throughout - the counts explode immediately.
- The relative order within each subtree's subsequence must be preserved.

**Complexity.** `O(n²)` time, `O(n²)` space — partitioning at each level is linear and the recursion is O(n) deep in the worst case, with the binomial table costing O(n^2) to build.

**Same pattern.** [Unique Binary Search Trees](https://leetcode.com/problems/unique-binary-search-trees/), [Construct Binary Search Tree from Preorder Traversal](https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/), [Unique Binary Search Trees II](https://leetcode.com/problems/unique-binary-search-trees-ii/)

**Interview follow-ups.**

- **Q.** Why a binomial coefficient?
  <br>**A.** The left and right insertion sequences must each keep their internal order, but they may be interleaved freely. Choosing which positions go to the left subtree is C(n-1, leftSize).
- **Q.** Why subtract one?
  <br>**A.** The problem asks for REORDERINGS, which excludes the original sequence itself.

</details>

### Day 19 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Keep only the left spine to pause an inorder traversal.** An iterator is a recursion whose state has been made explicit. The stack holds O(h) nodes, and each is pushed and popped once overall, giving amortised O(1) per step.
  <br>↳ *Binary Search Tree Iterator* — pushing the left spine in the constructor and again after each pop; *All Elements in Two Binary Search Trees* — two such iterators advanced in lockstep
- **Reverse inorder visits values in descending order.** When a node's answer depends on everything LARGER than it, traverse right, node, left, and accumulate as you go.
  <br>↳ *Convert BST to Greater Tree* — a running sum added before assigning back to the node; *Binary Search Tree to Greater Sum Tree* — the identical problem under a different title
- **An inversion in a sorted sequence is detectable in one pass.** A valid BST's inorder is strictly increasing. Two swapped nodes create one descent if adjacent, two otherwise - so record the first descent's prev and the last descent's cur.
  <br>↳ *Recover Binary Search Tree* — tracking prev and capturing both nodes across at most two descents
- **The BST invariant replaces the second traversal.** Preorder alone determines a BST, because the ordering supplies the shape. Carrying an upper bound down the recursion makes construction linear.
  <br>↳ *Construct Binary Search Tree from Preorder Traversal* — consuming values while they stay below the inherited bound
- **Choosing a root splits the count multiplicatively.** Left and right subtree arrangements are independent, so their counts multiply. Summing over every root gives the Catalan recurrence.
  <br>↳ *Unique Binary Search Trees* — dp[n] = sum of dp[i] * dp[n-1-i]; *Unique Binary Search Trees II* — the same split, taking a Cartesian product of subtree lists; *Number of Ways to Reorder Array to Get Same BST* — a binomial coefficient counting the interleavings of two insertion orders
- **Compose two known operations rather than inventing one.** Flatten to sorted, then rebuild balanced. Two things you already have beat implementing AVL rotations under time pressure.
  <br>↳ *Balance a Binary Search Tree* — inorder into a vector, then the midpoint construction; *Increasing Order Search Tree* — rewiring during inorder with a trailing tail pointer
- **Return a tuple when each node needs an aggregate of its subtree.** Sum and count together let the parent compute its own average in constant time. Computing either separately per node is quadratic.
  <br>↳ *Count Nodes Equal to Average of Subtree* — returning {sum, count} from every node

#### From yesterday

- **Validate with a propagated range, never a parent comparison.** A node in a left subtree must be smaller than every ancestor above it, not just its parent. ↳ *Validate Binary Search Tree* — carrying (lo, hi) downward with long bounds
- **Inorder on a BST is sorted, which solves most BST problems.** Validation, kth smallest, mode finding, minimum gap and recovery are all one inorder pass with a little bookkeeping. ↳ *Kth Smallest Element in a BST* — an inorder counter with early return
- **The invariant lets you skip subtrees without inspecting them.** If a node's value is below the range, every value in its left subtree is smaller still. ↳ *Range Sum of BST* — recursing into only one side when the node is out of range
- **Delete by replacing with the inorder successor.** Zero or one child is a splice. ↳ *Delete Node in a BST* — finding the leftmost node of the right subtree and recursively deleting it
- **The midpoint as root is what produces balance.** A sorted array is already an inorder traversal, so the only choice is where to split. ↳ *Convert Sorted Array to Binary Search Tree* — recursing on index ranges rather than slicing

#### Carried forward

- **binary-trees** — The three DFS traversals differ only in when the node is emitted; Capture the queue size before the level loop; Return one value upward, accumulate another locally; Parallel recursion compares or combines two trees at once; Minimum depth is not maximum depth with min substituted; Emit at a leaf, not at a null; Pass context down when a node cannot see it; Returning a whole subtree beats copying it node by node; Everything generalises from two children to many; Ask whether the answer depends on ancestors or descendants; A root-to-node path is an array, so array techniques apply; Two traversals pin down a tree, one does not; Traverse in the order that makes the successor already known; Tree DP returns a tuple of states; A tree is a graph once you add parent edges; Null sentinels make one traversal sufficient; Exploit a structural guarantee instead of traversing; A dummy head removes the first-element case in any structure; Normalise indices before they overflow; Prune bottom-up so removals cascade
