// Longest Square Streak in an Array
// https://leetcode.com/problems/longest-square-streak-in-an-array/
import java.util.*;

class Solution {
    public int longestSquareStreak(int[] a) {
        Set<Long> s = new HashSet<>();
        for (int x : a) s.add((long) x);
        int best = 0;
        for (long v : s) {
            int len = 0;
            long x = v;
            while (x <= 100000 && s.contains(x)) { len++; x = x * x; }
            best = Math.max(best, len);
        }
        return best >= 2 ? best : -1;
    }
}
