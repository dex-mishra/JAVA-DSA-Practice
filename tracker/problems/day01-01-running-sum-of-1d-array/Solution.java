// Running Sum of 1d Array
// https://leetcode.com/problems/running-sum-of-1d-array/
import java.util.*;

class Solution {
    public int[] runningSum(int[] a) {
        int[] out = new int[a.length];
        int run = 0;
        for (int i = 0; i < a.length; i++) {
            run += a[i];
            out[i] = run;
        }
        return out;
    }
}
