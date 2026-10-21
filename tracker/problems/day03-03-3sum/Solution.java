// 3Sum
// https://leetcode.com/problems/3sum/
import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] a) {
        Arrays.sort(a);
        int n = a.length;
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i + 2 < n; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            if (a[i] > 0) break;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    res.add(Arrays.asList(a[i], a[l], a[r]));
                    l++; r--;
                    while (l < r && a[l] == a[l - 1]) l++;
                    while (l < r && a[r] == a[r + 1]) r--;
                }
            }
        }
        return res;
    }
}
