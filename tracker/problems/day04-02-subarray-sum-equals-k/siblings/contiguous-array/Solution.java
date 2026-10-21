// Contiguous Array
// https://leetcode.com/problems/contiguous-array/
import java.util.*;

class Solution {
    public int findMaxLength(int[] a) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);
        int run = 0, best = 0;
        for (int i = 0; i < a.length; i++) {
            run += a[i] != 0 ? 1 : -1;
            if (first.containsKey(run)) best = Math.max(best, i - first.get(run));
            else first.put(run, i);
        }
        return best;
    }
}
