// Max Consecutive Ones
// https://leetcode.com/problems/max-consecutive-ones/
import java.util.*;

class Solution {
    public int findMaxConsecutiveOnes(int[] a) {
        int cur = 0, best = 0;
        for (int x : a) {
            cur = (x == 1) ? cur + 1 : 0;
            best = Math.max(best, cur);
        }
        return best;
    }
}
