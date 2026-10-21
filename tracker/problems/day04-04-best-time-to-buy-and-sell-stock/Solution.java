// Best Time to Buy and Sell Stock
// https://leetcode.com/problems/best-time-to-buy-and-sell-stock/
import java.util.*;

class Solution {
    public int maxProfit(int[] p) {
        int minSoFar = p[0], best = 0;
        for (int j = 1; j < p.length; j++) {
            best = Math.max(best, p[j] - minSoFar);
            minSoFar = Math.min(minSoFar, p[j]);
        }
        return best;
    }
}
