// Product of Array Except Self
// https://leetcode.com/problems/product-of-array-except-self/
import java.util.*;

class Solution {
    public int[] productExceptSelf(int[] a) {
        int n = a.length;
        int[] out = new int[n];
        out[0] = 1;
        for (int i = 1; i < n; i++) out[i] = out[i - 1] * a[i - 1];
        int right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= a[i]; }
        return out;
    }
}
