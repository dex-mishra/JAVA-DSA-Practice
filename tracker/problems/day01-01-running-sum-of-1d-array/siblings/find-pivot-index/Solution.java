// Find Pivot Index
// https://leetcode.com/problems/find-pivot-index/
import java.util.*;

class Solution {
    public int pivotIndex(int[] a) {
        int total = 0;
        for (int x : a) total += x;
        int left = 0;
        for (int i = 0; i < a.length; i++) {
            if (left == total - left - a[i]) return i;
            left += a[i];
        }
        return -1;
    }
}
