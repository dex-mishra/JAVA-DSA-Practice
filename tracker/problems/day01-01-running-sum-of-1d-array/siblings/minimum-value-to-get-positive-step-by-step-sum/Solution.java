// Minimum Value to Get Positive Step by Step Sum
// https://leetcode.com/problems/minimum-value-to-get-positive-step-by-step-sum/
import java.util.*;

class Solution {
    public int minStartValue(int[] a) {
        int run = 0, low = 0;
        for (int x : a) { run += x; low = Math.min(low, run); }
        return 1 - low;
    }
}
