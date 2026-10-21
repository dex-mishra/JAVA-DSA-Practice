// Longest Nice Subarray
// https://leetcode.com/problems/longest-nice-subarray/
import java.util.*;

class Solution {
    public int longestNiceSubarray(int[] a) {
        int used = 0, l = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            while ((used & a[r]) != 0) used ^= a[l++];
            used |= a[r];
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
