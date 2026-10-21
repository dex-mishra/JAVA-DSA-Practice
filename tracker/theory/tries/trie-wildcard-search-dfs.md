# Trie search with wildcards (DFS over children)

> A '.' matches any letter, so at that position try every existing child recursively. Normal letters follow one child.

## Idea

✍️ Walk the word as in a normal search. At a '.', the next node could be **any** existing child — recurse into each and return true if any succeeds.

## Template

```java
boolean match(Node n, String w, int i) {
    if (n == null) return false;
    if (i == w.length()) return n.end;
    if (w.charAt(i) == '.') {
        for (Node c : n.ch) if (c != null && match(c, w, i + 1)) return true;
        return false;
    }
    return match(n.ch[w.charAt(i) - 'a'], w, i + 1);
}
```

## Word Search II (recognition)

Insert all words into a trie; DFS from every grid cell walking the trie at the same time; stop as soon as the current path is not a prefix. Remove found words (or mark them) to avoid duplicates. Much faster than running Word Search once per word.

## Complexity

Without dots O(L); each dot can branch 26 ways, so worst case O(26^dots · L).
