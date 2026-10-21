// Longest Consecutive Sequence
// https://leetcode.com/problems/longest-consecutive-sequence/
import java.util.*;

class Solution {
    public int longestConsecutive(int[] a) {
        Set<Integer> s = new HashSet<>();
        for (int x : a) s.add(x);
        int best = 0;
        for (int v : s) {
            if (s.contains(v - 1)) continue;
            int len = 1;
            while (s.contains(v + len)) len++;
            best = Math.max(best, len);
        }
        return best;
    }
}
