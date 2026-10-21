// Merge Sorted Array
// https://leetcode.com/problems/merge-sorted-array/
import java.util.*;

class Solution {
    public void merge(int[] a, int m, int[] b, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && a[i] > b[j]) a[k--] = a[i--];
            else a[k--] = b[j--];
        }
    }
}
