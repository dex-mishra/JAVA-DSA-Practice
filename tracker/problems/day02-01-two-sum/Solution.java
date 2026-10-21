// Two Sum
// https://leetcode.com/problems/two-sum/
import java.util.*;

class Solution {
    public int[] twoSum(int[] a, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value to index
        for (int i = 0; i < a.length; i++) {
            int need = target - a[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(a[i], i);
        }
        return new int[]{};
    }
}
