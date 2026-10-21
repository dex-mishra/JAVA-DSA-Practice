# Tries — prefix trees

> A tree where each edge is a character and each root-to-node path spells a prefix. Insert, search and startsWith all cost O(word length).

## Idea

✍️ Each node has up to 26 children (one per letter) and a flag `end` meaning "a word ends here".
✍️ Insert: walk from the root, creating missing children, and set `end` on the last node. Search: walk; fail if a child is missing; succeed only if the final node has `end`. startsWith: same walk without checking `end`.
✍️ Shared prefixes share nodes, so a set of words with common prefixes is stored compactly and prefix queries never scan the whole set.

## Template

```java
class Trie {
    static class Node { Node[] ch = new Node[26]; boolean end = false; }
    private Node root = new Node();
    private Node walk(String w) {
        Node cur = root;
        for (char c : w.toCharArray()) {
            if (cur.ch[c - 'a'] == null) return null;
            cur = cur.ch[c - 'a'];
        }
        return cur;
    }
    public void insert(String w) {
        Node cur = root;
        for (char c : w.toCharArray()) {
            if (cur.ch[c - 'a'] == null) cur.ch[c - 'a'] = new Node();
            cur = cur.ch[c - 'a'];
        }
        cur.end = true;
    }
    public boolean search(String w) { Node n = walk(w); return n != null && n.end; }
    public boolean startsWith(String p) { return walk(p) != null; }
}
```

## Recognise it

✍️ "prefix", "starts with", "autocomplete", "dictionary of words" with many queries, "word search II" (many words on one grid), "longest common prefix of many strings", "maximum XOR of two numbers" (a trie over bits).

## Trie vs hash set

✍️ Exact-word lookup: a hash set is simpler and equally fast. Choose a trie when you need **prefix** queries, wildcard matching, or to prune a DFS as soon as the current prefix matches no word.

## Complexity

Insert/search O(L). Space O(total characters × 26 pointers) worst case; a `Map<Character, Node>` per node saves memory for large alphabets.
