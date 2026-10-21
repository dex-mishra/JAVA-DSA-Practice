// Maximum Average Subarray I
// https://leetcode.com/problems/maximum-average-subarray-i/
import java.util.*;

class Solution {
    public double findMaxAverage(int[] a, int k) {
        long win = 0, best = Long.MIN_VALUE;
        for (int i = 0; i < a.length; i++) {
            win += a[i];
            if (i >= k) win -= a[i - k];
            if (i >= k - 1) best = Math.max(best, win);
        }
        return (double) best / k;
    }
}
