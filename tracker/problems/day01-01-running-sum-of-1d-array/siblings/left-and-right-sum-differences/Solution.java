// Left and Right Sum Differences
// https://leetcode.com/problems/left-and-right-sum-differences/
import java.util.*;

class Solution {
    public int[] leftRightDifference(int[] a) {
        int total = 0; for (int x : a) total += x;
        int[] out = new int[a.length];
        int left = 0;
        for (int i = 0; i < a.length; i++) {
            out[i] = Math.abs(left - (total - left - a[i]));
            left += a[i];
        }
        return out;
    }
}
