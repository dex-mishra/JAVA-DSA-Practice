// Squares of a Sorted Array
// https://leetcode.com/problems/squares-of-a-sorted-array/
import java.util.*;

class Solution {
    public int[] sortedSquares(int[] a) {
        int n = a.length, l = 0, r = n - 1;
        int[] out = new int[n];
        for (int w = n - 1; w >= 0; w--) {
            if (Math.abs(a[l]) > Math.abs(a[r])) { out[w] = a[l] * a[l]; l++; }
            else { out[w] = a[r] * a[r]; r--; }
        }
        return out;
    }
}
