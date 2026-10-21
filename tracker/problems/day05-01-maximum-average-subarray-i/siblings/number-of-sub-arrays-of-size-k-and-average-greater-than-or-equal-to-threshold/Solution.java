// Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold
// https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/
import java.util.*;

class Solution {
    public int numOfSubarrays(int[] a, int k, int threshold) {
        long target = 1L * threshold * k, sum = 0;
        int cnt = 0;
        for (int i = 0; i < a.length; i++) {
            sum += a[i];
            if (i >= k) sum -= a[i - k];
            if (i >= k - 1 && sum >= target) cnt++;
        }
        return cnt;
    }
}
