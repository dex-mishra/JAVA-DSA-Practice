// Consecutive Characters
// https://leetcode.com/problems/consecutive-characters/
import java.util.*;

class Solution {
    public int maxPower(String s) {
        int cur = 1, best = 1;
        for (int i = 1; i < s.length(); i++) {
            cur = (s.charAt(i) == s.charAt(i - 1)) ? cur + 1 : 1;
            best = Math.max(best, cur);
        }
        return best;
    }
}
