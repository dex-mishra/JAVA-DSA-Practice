// Subarray Product Less Than K
// https://leetcode.com/problems/subarray-product-less-than-k/
import java.util.*;

class Solution {
    public int numSubarrayProductLessThanK(int[] a, int k) {
        if (k <= 1) return 0;
        long prod = 1;
        int l = 0, cnt = 0;
        for (int r = 0; r < a.length; r++) {
            prod *= a[r];
            while (prod >= k) prod /= a[l++];
            cnt += r - l + 1;
        }
        return cnt;
    }
}
