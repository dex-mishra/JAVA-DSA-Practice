// Best Time to Buy and Sell Stock II
// https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/
import java.util.*;

class Solution {
    public int maxProfit(int[] p) {
        int profit = 0;
        for (int i = 1; i < p.length; i++) profit += Math.max(0, p[i] - p[i - 1]);
        return profit;
    }
}
