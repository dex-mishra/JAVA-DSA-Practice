---
phase: V1
title: Trees & BST
days: 4-9
problems: 26
generated: 2026-09-17
---

# V1 — Trees & BST

**Days 4–9** &nbsp;·&nbsp; **26 problems** &nbsp;·&nbsp; Binary trees and BSTs. Traversals, the bottom-up pattern, tree DP, and the BST invariant.

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

### Day 4

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. All Nodes Distance K in Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 863

<!-- id:binary-trees-all-nodes-distance-k-in-binary-tree | order:1 | day:4 | pattern:tree-as-graph | template:T-GRAPH-02 -->

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

#### `[CORE]` 2. Binary Tree Cameras &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 968

<!-- id:binary-trees-binary-tree-cameras | order:2 | day:4 | pattern:tree-dp-three-states | template:T-DP-01 -->

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

#### `[CORE]` 3. Binary Tree Inorder Traversal &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 94

<!-- id:binary-trees-binary-tree-inorder-traversal | order:3 | day:4 | pattern:dfs-traversal | template:T-TREE-01 -->

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

#### `[CORE]` 4. Binary Tree Level Order Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 102

<!-- id:binary-trees-binary-tree-level-order-traversal | order:4 | day:4 | pattern:bfs-levels | template:T-TREE-02 -->

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

#### `[CORE]` 5. Binary Tree Maximum Path Sum &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 124

<!-- id:binary-trees-binary-tree-maximum-path-sum | order:5 | day:4 | pattern:bottom-up-return | template:T-TREE-03 -->

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

### Day 4 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **The three DFS traversals differ only in when the node is emitted.** The walk is identical. Preorder writes on arrival, inorder between the two children, postorder on the way out. Which one a problem needs follows from when the node's answer becomes known.
  <br>↳ *Binary Tree Inorder Traversal* — the dive-left-then-pop-and-go-right stack loop
- **Capture the queue size before the level loop.** The queue holds a mixture of levels at any instant. Snapshotting its size fixes the boundary; reading it inside the loop sees it grow as children are pushed and merges the levels.
  <br>↳ *Binary Tree Level Order Traversal* — int sz = q.size() outside the inner for-loop
- **Tree DP returns a tuple of states.** When a node's optimum depends on a choice it makes, return one value per choice and let the parent combine them. This removes exponential recomputation without a memo table.
  <br>↳ *House Robber III* — returning {robbed, notRobbed} per node; *Binary Tree Cameras* — three states - needs cover, has camera, is covered
- **A tree is a graph once you add parent edges.** Any problem needing upward movement becomes BFS or DFS on an undirected graph. Build a parent map first, and remember the visited set.
  <br>↳ *All Nodes Distance K in Binary Tree* — a parent map plus BFS bounded at k levels

### Day 5

*4 problems — 4 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Binary Tree Right Side View &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 199

<!-- id:binary-trees-binary-tree-right-side-view | order:6 | day:5 | pattern:bfs-levels | template:T-TREE-02 -->

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

#### `[CORE]` 2. Construct Binary Tree from Preorder and Inorder Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 105

<!-- id:binary-trees-construct-binary-tree-from-preorder-and-inorder-traversal | order:7 | day:5 | pattern:traversal-reconstruction | template:T-TREE-04 -->

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

#### `[CORE]` 3. Diameter of Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 543

<!-- id:binary-trees-diameter-of-binary-tree | order:8 | day:5 | pattern:bottom-up-return | template:T-TREE-03 -->

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

#### `[CORE]` 4. Flatten Binary Tree to Linked List &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 114

<!-- id:binary-trees-flatten-binary-tree-to-linked-list | order:9 | day:5 | pattern:reverse-preorder-rewire | template:T-TREE-01 -->

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

### Day 5 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Return one value upward, accumulate another locally.** The answer AT a node often uses both children, but the value a parent can extend uses only one. Conflating them is the most common bug in tree problems.
  <br>↳ *Diameter of Binary Tree* — best gets l + r, but the return is 1 + max(l, r); *Maximum Depth of Binary Tree* — the simplest instance, where the two happen to coincide
- **Ask whether the answer depends on ancestors or descendants.** Descendants means return values upward. Ancestors means pass state downward. Naming which one a problem is before writing code saves rewriting it.
  <br>↳ *Diameter of Binary Tree* — the contrasting case, where heights flow upward
- **Two traversals pin down a tree, one does not.** Preorder gives the root; inorder says how many nodes sit on each side of it. A value-to-index hash map keeps the construction linear instead of quadratic.
  <br>↳ *Construct Binary Tree from Preorder and Inorder Traversal* — the inorder index map and building left before right
- **Traverse in the order that makes the successor already known.** Flattening in forward preorder would overwrite pointers still needed. Reverse preorder means everything to the right is already processed when you arrive.
  <br>↳ *Flatten Binary Tree to Linked List* — right, left, node with a trailing prev pointer

#### From yesterday

- **The three DFS traversals differ only in when the node is emitted.** The walk is identical. ↳ *Binary Tree Inorder Traversal* — the dive-left-then-pop-and-go-right stack loop
- **Capture the queue size before the level loop.** The queue holds a mixture of levels at any instant. ↳ *Binary Tree Level Order Traversal* — int sz = q.size() outside the inner for-loop
- **Tree DP returns a tuple of states.** When a node's optimum depends on a choice it makes, return one value per choice and let the parent combine them. ↳ *House Robber III* — returning {robbed, notRobbed} per node
- **A tree is a graph once you add parent edges.** Any problem needing upward movement becomes BFS or DFS on an undirected graph. ↳ *All Nodes Distance K in Binary Tree* — a parent map plus BFS bounded at k levels

### Day 6

*4 problems — 4 core, 0 drill, 0 skim.*

#### `[CORE]` 1. House Robber III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 337

<!-- id:binary-trees-house-robber-iii | order:10 | day:6 | pattern:tree-dp-two-states | template:T-DP-01 -->

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

#### `[CORE]` 2. Lowest Common Ancestor of a Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 236

<!-- id:binary-trees-lowest-common-ancestor-of-a-binary-tree | order:11 | day:6 | pattern:lca-recursion | template:T-TREE-03 -->

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

#### `[CORE]` 3. Maximum Depth of Binary Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 104

<!-- id:binary-trees-maximum-depth-of-binary-tree | order:12 | day:6 | pattern:bottom-up-return | template:T-TREE-03 -->

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

#### `[CORE]` 4. Maximum Width of Binary Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 662

<!-- id:binary-trees-maximum-width-of-binary-tree | order:13 | day:6 | pattern:index-arithmetic-bfs | template:T-TREE-02 -->

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

### Day 6 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Minimum depth is not maximum depth with min substituted.** A node with one null child has no root-to-leaf path through the null side, so min would wrongly return 1. BFS sidesteps it entirely and stops at the first leaf.
  <br>↳ *Maximum Depth of Binary Tree* — where max needs no such special case
- **Normalise indices before they overflow.** Heap-style indexing doubles each level, so depth 60 exceeds 64 bits. Subtracting the level's first index preserves differences while keeping values small.
  <br>↳ *Maximum Width of Binary Tree* — subtracting the level's first index from every node in it

#### From yesterday

- **Return one value upward, accumulate another locally.** The answer AT a node often uses both children, but the value a parent can extend uses only one. ↳ *Diameter of Binary Tree* — best gets l + r, but the return is 1 + max(l, r)
- **Ask whether the answer depends on ancestors or descendants.** Descendants means return values upward. ↳ *Diameter of Binary Tree* — the contrasting case, where heights flow upward
- **Two traversals pin down a tree, one does not.** Preorder gives the root. ↳ *Construct Binary Tree from Preorder and Inorder Traversal* — the inorder index map and building left before right
- **Traverse in the order that makes the successor already known.** Flattening in forward preorder would overwrite pointers still needed. ↳ *Flatten Binary Tree to Linked List* — right, left, node with a trailing prev pointer

#### Two days back

- **The three DFS traversals differ only in when the node is emitted** — Binary Tree Inorder Traversal
- **Capture the queue size before the level loop** — Binary Tree Level Order Traversal
- **Tree DP returns a tuple of states** — House Robber III
- **A tree is a graph once you add parent edges** — All Nodes Distance K in Binary Tree

### Day 7

*5 problems — 5 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Path Sum III &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 437

<!-- id:binary-trees-path-sum-iii | order:14 | day:7 | pattern:prefix-sum-on-path | template:T-HASH-04 -->

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

#### `[CORE]` 2. Populating Next Right Pointers in Each Node II &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 117

<!-- id:binary-trees-populating-next-right-pointers-in-each-node-ii | order:15 | day:7 | pattern:level-linking | template:T-TREE-02 -->

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

#### `[CORE]` 3. Serialize and Deserialize Binary Tree &nbsp;·&nbsp; `Hard` &nbsp;·&nbsp; LC 297

<!-- id:binary-trees-serialize-and-deserialize-binary-tree | order:16 | day:7 | pattern:preorder-with-sentinels | template:T-TREE-01 -->

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

#### `[CORE]` 4. Symmetric Tree &nbsp;·&nbsp; `Easy` &nbsp;·&nbsp; LC 101

<!-- id:binary-trees-symmetric-tree | order:17 | day:7 | pattern:mirror-recursion | template:T-TREE-03 -->

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

#### `[CORE]` 5. Binary Search Tree Iterator &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 173

<!-- id:bst-binary-search-tree-iterator | order:18 | day:7 | pattern:controlled-inorder | template:T-TREE-01 -->

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

### Day 7 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Parallel recursion compares or combines two trees at once.** Recurse on a pair of nodes rather than one. The base cases - both null, one null, values differ - carry all the weight, and the recursive step is a single line.
  <br>↳ *Symmetric Tree* — the same recursion with the two recursive calls crossed over
- **A root-to-node path is an array, so array techniques apply.** Prefix sums with a hash map work on a tree path exactly as on a subarray - provided the map is unwound when the recursion backtracks.
  <br>↳ *Path Sum III* — a prefix-sum map seeded with {0,1} and decremented on the way back up
- **Null sentinels make one traversal sufficient.** Preorder alone cannot rebuild a tree, but preorder with explicit nulls can - the sentinels encode exactly the shape that ordering alone omits. Delimiters are needed too.
  <br>↳ *Serialize and Deserialize Binary Tree* — '#' for nulls plus a separator between tokens
- **A dummy head removes the first-element case in any structure.** The linked-list trick works on tree levels too: append to a tail behind a dummy and the 'is this the first node' branch disappears.
  <br>↳ *Populating Next Right Pointers in Each Node II* — a dummy per level with a tail pointer
- **Keep only the left spine to pause an inorder traversal.** An iterator is a recursion whose state has been made explicit. The stack holds O(h) nodes, and each is pushed and popped once overall, giving amortised O(1) per step.
  <br>↳ *Binary Search Tree Iterator* — pushing the left spine in the constructor and again after each pop

#### From yesterday

- **Minimum depth is not maximum depth with min substituted.** A node with one null child has no root-to-leaf path through the null side, so min would wrongly return 1. ↳ *Maximum Depth of Binary Tree* — where max needs no such special case
- **Normalise indices before they overflow.** Heap-style indexing doubles each level, so depth 60 exceeds 64 bits. ↳ *Maximum Width of Binary Tree* — subtracting the level's first index from every node in it

#### Two days back

- **Return one value upward, accumulate another locally** — Diameter of Binary Tree
- **Ask whether the answer depends on ancestors or descendants** — Diameter of Binary Tree
- **Two traversals pin down a tree, one does not** — Construct Binary Tree from Preorder and Inorder Traversal
- **Traverse in the order that makes the successor already known** — Flatten Binary Tree to Linked List

#### Earlier in binary-trees

- The three DFS traversals differ only in when the node is emitted · Capture the queue size before the level loop · Tree DP returns a tuple of states · A tree is a graph once you add parent edges

### Day 8

*4 problems — 4 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Construct Binary Search Tree from Preorder Traversal &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 1008

<!-- id:bst-construct-binary-search-tree-from-preorder-traversal | order:19 | day:8 | pattern:bound-carrying-construction | template:T-BST-01 -->

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

#### `[CORE]` 2. Convert BST to Greater Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 538

<!-- id:bst-convert-bst-to-greater-tree | order:20 | day:8 | pattern:reverse-inorder-accumulate | template:T-TREE-01 -->

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

#### `[CORE]` 3. Delete Node in a BST &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 450

<!-- id:bst-delete-node-in-a-bst | order:21 | day:8 | pattern:bst-delete | template:T-BST-01 -->

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

#### `[CORE]` 4. Kth Smallest Element in a BST &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 230

<!-- id:bst-kth-smallest-element-in-a-bst | order:22 | day:8 | pattern:inorder-with-counter | template:T-TREE-01 -->

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

### Day 8 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Inorder on a BST is sorted, which solves most BST problems.** Validation, kth smallest, mode finding, minimum gap and recovery are all one inorder pass with a little bookkeeping.
  <br>↳ *Kth Smallest Element in a BST* — an inorder counter with early return; *Validate Binary Search Tree* — the alternative strictly-increasing formulation
- **Delete by replacing with the inorder successor.** Zero or one child is a splice. Two children means copying the smallest value from the right subtree, which by construction has no left child and is therefore easy to remove.
  <br>↳ *Delete Node in a BST* — finding the leftmost node of the right subtree and recursively deleting it
- **Reverse inorder visits values in descending order.** When a node's answer depends on everything LARGER than it, traverse right, node, left, and accumulate as you go.
  <br>↳ *Convert BST to Greater Tree* — a running sum added before assigning back to the node
- **The BST invariant replaces the second traversal.** Preorder alone determines a BST, because the ordering supplies the shape. Carrying an upper bound down the recursion makes construction linear.
  <br>↳ *Construct Binary Search Tree from Preorder Traversal* — consuming values while they stay below the inherited bound

#### From yesterday

- **Keep only the left spine to pause an inorder traversal.** An iterator is a recursion whose state has been made explicit. ↳ *Binary Search Tree Iterator* — pushing the left spine in the constructor and again after each pop

#### Carried forward

- **binary-trees** — The three DFS traversals differ only in when the node is emitted; Capture the queue size before the level loop; Return one value upward, accumulate another locally; Parallel recursion compares or combines two trees at once; Minimum depth is not maximum depth with min substituted; Ask whether the answer depends on ancestors or descendants; A root-to-node path is an array, so array techniques apply; Two traversals pin down a tree, one does not; Traverse in the order that makes the successor already known; Tree DP returns a tuple of states; A tree is a graph once you add parent edges; Null sentinels make one traversal sufficient; A dummy head removes the first-element case in any structure; Normalise indices before they overflow

### Day 9

*4 problems — 4 core, 0 drill, 0 skim.*

#### `[CORE]` 1. Lowest Common Ancestor of a Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 235

<!-- id:bst-lowest-common-ancestor-of-a-binary-search-tree | order:23 | day:9 | pattern:bst-split-point | template:T-BST-01 -->

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

#### `[CORE]` 2. Recover Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 99

<!-- id:bst-recover-binary-search-tree | order:24 | day:9 | pattern:inorder-descent-detection | template:T-TREE-01 -->

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

#### `[CORE]` 3. Unique Binary Search Trees &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 96

<!-- id:bst-unique-binary-search-trees | order:25 | day:9 | pattern:catalan-dp | template:T-DP-01 -->

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

#### `[CORE]` 4. Validate Binary Search Tree &nbsp;·&nbsp; `Medium` &nbsp;·&nbsp; LC 98

<!-- id:bst-validate-binary-search-tree | order:26 | day:9 | pattern:range-propagation | template:T-BST-01 -->

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

### Day 9 — learning checkpoint

*Read this before you close the day. If any line below does not ring a bell, reopen the problem it cites — that is cheaper than meeting it cold in an OA.*

#### New today

- **Validate with a propagated range, never a parent comparison.** A node in a left subtree must be smaller than every ancestor above it, not just its parent. [10, 5, 15, null, null, 6, 20] passes every parent check and is not a BST.
  <br>↳ *Validate Binary Search Tree* — carrying (lo, hi) downward with long bounds
- **The invariant lets you skip subtrees without inspecting them.** If a node's value is below the range, every value in its left subtree is smaller still. That is a proof, not a heuristic, and it is what makes BST operations O(h).
  <br>↳ *Lowest Common Ancestor of a Binary Search Tree* — descending to the first node that splits the two targets
- **An inversion in a sorted sequence is detectable in one pass.** A valid BST's inorder is strictly increasing. Two swapped nodes create one descent if adjacent, two otherwise - so record the first descent's prev and the last descent's cur.
  <br>↳ *Recover Binary Search Tree* — tracking prev and capturing both nodes across at most two descents
- **Choosing a root splits the count multiplicatively.** Left and right subtree arrangements are independent, so their counts multiply. Summing over every root gives the Catalan recurrence.
  <br>↳ *Unique Binary Search Trees* — dp[n] = sum of dp[i] * dp[n-1-i]

#### From yesterday

- **Inorder on a BST is sorted, which solves most BST problems.** Validation, kth smallest, mode finding, minimum gap and recovery are all one inorder pass with a little bookkeeping. ↳ *Kth Smallest Element in a BST* — an inorder counter with early return
- **Delete by replacing with the inorder successor.** Zero or one child is a splice. ↳ *Delete Node in a BST* — finding the leftmost node of the right subtree and recursively deleting it
- **Reverse inorder visits values in descending order.** When a node's answer depends on everything LARGER than it, traverse right, node, left, and accumulate as you go. ↳ *Convert BST to Greater Tree* — a running sum added before assigning back to the node
- **The BST invariant replaces the second traversal.** Preorder alone determines a BST, because the ordering supplies the shape. ↳ *Construct Binary Search Tree from Preorder Traversal* — consuming values while they stay below the inherited bound

#### Two days back

- **Keep only the left spine to pause an inorder traversal** — Binary Search Tree Iterator

#### Carried forward

- **binary-trees** — The three DFS traversals differ only in when the node is emitted; Capture the queue size before the level loop; Return one value upward, accumulate another locally; Parallel recursion compares or combines two trees at once; Minimum depth is not maximum depth with min substituted; Ask whether the answer depends on ancestors or descendants; A root-to-node path is an array, so array techniques apply; Two traversals pin down a tree, one does not; Traverse in the order that makes the successor already known; Tree DP returns a tuple of states; A tree is a graph once you add parent edges; Null sentinels make one traversal sufficient; A dummy head removes the first-element case in any structure; Normalise indices before they overflow
