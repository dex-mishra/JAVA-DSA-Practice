// Maximum Sum Circular Subarray
// https://leetcode.com/problems/maximum-sum-circular-subarray/
import java.util.*;

class Solution {
    public int maxSubarraySumCircular(int[] a) {
        int total = 0, curMax = 0, curMin = 0, best = a[0], worst = a[0];
        for (int x : a) {
            curMax = Math.max(x, curMax + x); best = Math.max(best, curMax);
            curMin = Math.min(x, curMin + x); worst = Math.min(worst, curMin);
            total += x;
        }
        if (best < 0) return best;
        return Math.max(best, total - worst);
    }
}
