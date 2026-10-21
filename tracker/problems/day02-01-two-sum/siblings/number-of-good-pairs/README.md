# Number of Good Pairs

**LeetCode:** [1512. Number of Good Pairs](https://leetcode.com/problems/number-of-good-pairs/) (Easy)  
**Tier:** optional  
**How it maps from Two Sum:** Count pairs instead of finding one: the map stores counts and every earlier equal value forms a pair.

## Analyse

✍️ Count pairs i < j with a[i] == a[j].

## Brainstorm

✍️ Brute O(n²). Complement = x itself; when x arrives, it pairs with every earlier x → add cnt[x], then cnt[x]++.

## Algorithm in words

✍️ For each x: answer += count of x seen so far; then increment the count.

## Pseudocode

```
cnt = map; ans = 0
for x in a: ans += cnt[x]; cnt[x] += 1
return ans
```

## Reference Java

```java
class Solution {
    public int numIdenticalPairs(int[] a) {
        Map<Integer, Integer> cnt = new HashMap<>();
        int ans = 0;
        for (int x : a) {
            ans += cnt.getOrDefault(x, 0);          // pairs with earlier copies
            cnt.put(x, cnt.getOrDefault(x, 0) + 1); // then count this one
        }
        return ans;
    }
}
```

## Quick theory

✍️ Counting pairs → map value is a **count**; still query before recording ([[hash-complement-lookup#variations]]).
