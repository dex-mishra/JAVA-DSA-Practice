# Contains Duplicate II

**LeetCode:** [219. Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/) (Easy)  
**Tier:** optional  
**How it maps from Two Sum:** Store the last index of each value; a duplicate counts only if it is within distance k.

## Analyse

✍️ True if some value appears at indices i ≠ j with |i − j| ≤ k.

## Brainstorm

✍️ For each x, the best earlier partner is its **most recent** occurrence (closest). Map value → last index. O(n). (Window alternative: a set of the last k elements.)

## Algorithm in words

✍️ For each i: if x was seen and i − last[x] ≤ k → true. Update last[x] = i.

## Pseudocode

```
last = map
for i, x in a:
    if x in last and i - last[x] <= k: return true
    last[x] = i
return false
```

## Reference Java

```java
class Solution {
    public boolean containsNearbyDuplicate(int[] a, int k) {
        Map<Integer, Integer> last = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            if (last.containsKey(a[i]) && i - last.get(a[i]) <= k) return true;
            last.put(a[i], i);
        }
        return false;
    }
}
```

## Quick theory

✍️ The map value is chosen by what the check needs: here the **latest** index.
