// Max Consecutive Ones III
// https://leetcode.com/problems/max-consecutive-ones-iii/
import java.util.*;

class Solution {
    public int longestOnes(int[] a, int k) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            if (a[r] == 0) zeros++;
            while (zeros > k) {
                if (a[l] == 0) zeros--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
