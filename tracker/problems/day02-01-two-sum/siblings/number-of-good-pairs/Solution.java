// Number of Good Pairs
// https://leetcode.com/problems/number-of-good-pairs/
import java.util.*;

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
