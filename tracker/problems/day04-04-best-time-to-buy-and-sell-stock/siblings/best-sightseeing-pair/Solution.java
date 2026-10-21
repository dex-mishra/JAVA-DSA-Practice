// Best Sightseeing Pair
// https://leetcode.com/problems/best-sightseeing-pair/
import java.util.*;

class Solution {
    public int maxScoreSightseeingPair(int[] a) {
        int bestLeft = a[0], ans = 0;
        for (int j = 1; j < a.length; j++) {
            ans = Math.max(ans, bestLeft + a[j] - j);
            bestLeft = Math.max(bestLeft, a[j] + j);
        }
        return ans;
    }
}
