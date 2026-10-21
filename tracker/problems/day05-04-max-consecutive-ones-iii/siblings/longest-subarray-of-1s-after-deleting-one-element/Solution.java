// Longest Subarray of 1's After Deleting One Element
// https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/
import java.util.*;

class Solution {
    public int longestSubarray(int[] a) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            if (a[r] == 0) zeros++;
            while (zeros > 1) { if (a[l++] == 0) zeros--; }
            best = Math.max(best, r - l);
        }
        return best;
    }
}
