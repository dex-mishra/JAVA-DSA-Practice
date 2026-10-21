// Subarray Sums Divisible by K
// https://leetcode.com/problems/subarray-sums-divisible-by-k/
import java.util.*;

class Solution {
    public int subarraysDivByK(int[] a, int k) {
        int[] cnt = new int[k];
        cnt[0] = 1;
        int run = 0, ans = 0;
        for (int x : a) {
            run = ((run + x) % k + k) % k;
            ans += cnt[run]++;
        }
        return ans;
    }
}
