// Contains Duplicate II
// https://leetcode.com/problems/contains-duplicate-ii/
import java.util.*;

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
