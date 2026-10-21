// Maximum Subarray
// https://leetcode.com/problems/maximum-subarray/
import java.util.*;

class Solution {
    public int maxSubArray(int[] a) {
        int cur = a[0], best = a[0];
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}
