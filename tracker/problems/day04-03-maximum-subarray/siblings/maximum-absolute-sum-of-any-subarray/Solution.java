// Maximum Absolute Sum of Any Subarray
// https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/
import java.util.*;

class Solution {
    public int maxAbsoluteSum(int[] a) {
        int hi = 0, lo = 0, ans = 0;
        for (int x : a) {
            hi = Math.max(0, hi + x);
            lo = Math.min(0, lo + x);
            ans = Math.max(ans, Math.max(hi, -lo));
        }
        return ans;
    }
}
