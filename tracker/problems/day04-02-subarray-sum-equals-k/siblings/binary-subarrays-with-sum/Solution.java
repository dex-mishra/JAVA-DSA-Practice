// Binary Subarrays With Sum
// https://leetcode.com/problems/binary-subarrays-with-sum/
import java.util.*;

class Solution {
    public int numSubarraysWithSum(int[] a, int goal) {
        int[] cnt = new int[a.length + 1];       // prefix sums of a 0/1 array are in [0, n]
        cnt[0] = 1;
        int run = 0, ans = 0;
        for (int x : a) {
            run += x;
            if (run - goal >= 0) ans += cnt[run - goal];
            cnt[run]++;
        }
        return ans;
    }
}
