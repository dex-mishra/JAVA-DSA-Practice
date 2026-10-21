// Subarray Sum Equals K
// https://leetcode.com/problems/subarray-sum-equals-k/
import java.util.*;

class Solution {
    public int subarraySum(int[] a, int k) {
        Map<Long, Integer> cnt = new HashMap<>();
        cnt.put(0L, 1);
        long run = 0;
        int ans = 0;
        for (int x : a) {
            run += x;
            ans += cnt.getOrDefault(run - k, 0);
            cnt.put(run, cnt.getOrDefault(run, 0) + 1);
        }
        return ans;
    }
}
