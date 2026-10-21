// Two Sum II - Input Array Is Sorted
// https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
import java.util.*;

class Solution {
    public int[] twoSum(int[] a, int target) {
        int l = 0, r = a.length - 1;
        while (l < r) {
            int s = a[l] + a[r];
            if (s == target) return new int[]{l + 1, r + 1};
            if (s < target) l++;
            else r--;
        }
        return new int[]{};
    }
}
