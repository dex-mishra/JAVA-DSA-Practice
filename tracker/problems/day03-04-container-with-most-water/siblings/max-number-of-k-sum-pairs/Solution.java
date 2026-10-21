// Max Number of K-Sum Pairs
// https://leetcode.com/problems/max-number-of-k-sum-pairs/
import java.util.*;

class Solution {
    public int maxOperations(int[] a, int k) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, ops = 0;
        while (l < r) {
            int s = a[l] + a[r];
            if (s == k) { ops++; l++; r--; }
            else if (s < k) l++;
            else r--;
        }
        return ops;
    }
}
