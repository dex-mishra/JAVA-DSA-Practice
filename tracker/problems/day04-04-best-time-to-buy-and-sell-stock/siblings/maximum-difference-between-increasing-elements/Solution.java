// Maximum Difference Between Increasing Elements
// https://leetcode.com/problems/maximum-difference-between-increasing-elements/
import java.util.*;

class Solution {
    public int maximumDifference(int[] a) {
        int mn = a[0], ans = -1;
        for (int j = 1; j < a.length; j++) {
            if (a[j] > mn) ans = Math.max(ans, a[j] - mn);
            mn = Math.min(mn, a[j]);
        }
        return ans;
    }
}
