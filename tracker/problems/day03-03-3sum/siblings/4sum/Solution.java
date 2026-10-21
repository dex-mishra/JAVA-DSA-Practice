// 4Sum
// https://leetcode.com/problems/4sum/
import java.util.*;

class Solution {
    public List<List<Integer>> fourSum(int[] a, int target) {
        Arrays.sort(a);
        int n = a.length;
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            for (int j = i + 1; j < n; j++) {
                if (j > i + 1 && a[j] == a[j - 1]) continue;
                int l = j + 1, r = n - 1;
                while (l < r) {
                    long s = (long) a[i] + a[j] + a[l] + a[r];
                    if (s < target) l++;
                    else if (s > target) r--;
                    else {
                        res.add(Arrays.asList(a[i], a[j], a[l], a[r]));
                        l++; r--;
                        while (l < r && a[l] == a[l - 1]) l++;
                        while (l < r && a[r] == a[r + 1]) r--;
                    }
                }
            }
        }
        return res;
    }
}
