// Container With Most Water
// https://leetcode.com/problems/container-with-most-water/
import java.util.*;

class Solution {
    public int maxArea(int[] h) {
        int l = 0, r = h.length - 1, best = 0;
        while (l < r) {
            best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
            if (h[l] < h[r]) l++;
            else r--;
        }
        return best;
    }
}
