// K Radius Subarray Averages
// https://leetcode.com/problems/k-radius-subarray-averages/
import java.util.*;

class Solution {
    public int[] getAverages(int[] a, int k) {
        int n = a.length;
        int w = 2 * k + 1;
        long sum = 0;
        int[] out = new int[n];
        Arrays.fill(out, -1);
        for (int i = 0; i < n; i++) {
            sum += a[i];
            if (i >= w) sum -= a[i - w];
            if (i >= w - 1) out[i - k] = (int)(sum / w);
        }
        return out;
    }
}
