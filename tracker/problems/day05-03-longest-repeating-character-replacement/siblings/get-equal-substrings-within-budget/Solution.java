// Get Equal Substrings Within Budget
// https://leetcode.com/problems/get-equal-substrings-within-budget/
import java.util.*;

class Solution {
    public int equalSubstring(String s, String t, int maxCost) {
        int l = 0, cost = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            cost += Math.abs(s.charAt(r) - t.charAt(r));
            while (cost > maxCost) { cost -= Math.abs(s.charAt(l) - t.charAt(l)); l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
