// Minimum Size Subarray Sum
// https://leetcode.com/problems/minimum-size-subarray-sum/
import java.util.*;

class Solution {
    public int minSubArrayLen(int target, int[] a) {
        int l = 0, best = Integer.MAX_VALUE;
        long sum = 0;
        for (int r = 0; r < a.length; r++) {
            sum += a[r];
            while (sum >= target) {
                best = Math.min(best, r - l + 1);
                sum -= a[l++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }
}
