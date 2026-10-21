// Find the Highest Altitude
// https://leetcode.com/problems/find-the-highest-altitude/
import java.util.*;

class Solution {
    public int largestAltitude(int[] gain) {
        int alt = 0, best = 0;
        for (int g : gain) { alt += g; best = Math.max(best, alt); }
        return best;
    }
}
