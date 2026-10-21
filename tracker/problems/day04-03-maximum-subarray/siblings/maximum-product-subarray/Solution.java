// Maximum Product Subarray
// https://leetcode.com/problems/maximum-product-subarray/
import java.util.*;

class Solution {
    public int maxProduct(int[] a) {
        int hi = a[0], lo = a[0], best = a[0];
        for (int i = 1; i < a.length; i++) {
            int x = a[i];
            if (x < 0) { int t = hi; hi = lo; lo = t; }
            hi = Math.max(x, hi * x);
            lo = Math.min(x, lo * x);
            best = Math.max(best, hi);
        }
        return best;
    }
}
