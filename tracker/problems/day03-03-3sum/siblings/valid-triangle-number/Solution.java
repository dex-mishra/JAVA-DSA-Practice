// Valid Triangle Number
// https://leetcode.com/problems/valid-triangle-number/
import java.util.*;

class Solution {
    public int triangleNumber(int[] a) {
        Arrays.sort(a);
        int cnt = 0;
        for (int k = a.length - 1; k >= 2; k--) {
            int l = 0, r = k - 1;
            while (l < r) {
                if (a[l] + a[r] > a[k]) { cnt += r - l; r--; }
                else l++;
            }
        }
        return cnt;
    }
}
