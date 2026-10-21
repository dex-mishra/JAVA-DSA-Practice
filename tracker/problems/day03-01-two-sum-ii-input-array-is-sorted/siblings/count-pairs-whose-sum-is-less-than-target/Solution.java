// Count Pairs Whose Sum is Less than Target
// https://leetcode.com/problems/count-pairs-whose-sum-is-less-than-target/
import java.util.*;

class Solution {
    public int countPairs(int[] a, int target) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, cnt = 0;
        while (l < r) {
            if (a[l] + a[r] < target) { cnt += r - l; l++; }
            else r--;
        }
        return cnt;
    }
}
