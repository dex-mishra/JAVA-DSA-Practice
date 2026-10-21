# Grouping by a derived key

> Compute a canonical key for each item so that items that "belong together" share a key, then group them in a map from key to list.

## Idea

✍️ Two items belong to the same group exactly when some **canonical form** of them is equal. Compute that form, use it as a map key, and push each item into `groups[key]`.
✍️ Group anagrams: canonical form = the sorted string, or the 26-count signature.

## Recognise it

✍️ "group", "bucket", "classify", "all items that are equivalent under …", "isomorphic", "same pattern".

## Template

```java
Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {
    char[] c = w.toCharArray();
    Arrays.sort(c);                        // canonical form
    String key = new String(c);
    groups.putIfAbsent(key, new ArrayList<>());
    groups.get(key).add(w);
}
List<List<String>> out = new ArrayList<>(groups.values());
```

## Choosing the key

✍️ Sorted string: simple, O(L log L) per word.
✍️ Count signature (e.g. "1#0#2#…" for 26 counts): O(L + 26) per word, better for long words.
- Pattern keys for "word pattern / isomorphic strings": map each character to the index of its first appearance, e.g. "egg" → [0,1,1], "add" → [0,1,1].

## Complexity

O(n · cost of computing one key). With sorted keys: O(n · L log L). Space O(n · L) to store the groups.
