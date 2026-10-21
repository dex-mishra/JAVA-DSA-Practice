// 3Sum Closest
// https://leetcode.com/problems/3sum-closest/
import java.util.*;

class Solution {
    public int threeSumClosest(int[] a, int t) {
        Arrays.sort(a);
        int n = a.length, best = a[0] + a[1] + a[2];
        for (int i = 0; i + 2 < n; i++) {
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (Math.abs(s - t) < Math.abs(best - t)) best = s;
                if (s < t) l++;
                else if (s > t) r--;
                else return s;
            }
        }
        return best;
    }
}
