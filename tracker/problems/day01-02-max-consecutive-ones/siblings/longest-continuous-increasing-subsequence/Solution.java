// Longest Continuous Increasing Subsequence
// https://leetcode.com/problems/longest-continuous-increasing-subsequence/
import java.util.*;

class Solution {
    public int findLengthOfLCIS(int[] a) {
        int cur = 1, best = 1;
        for (int i = 1; i < a.length; i++) {
            cur = (a[i] > a[i - 1]) ? cur + 1 : 1;
            best = Math.max(best, cur);
        }
        return best;
    }
}
