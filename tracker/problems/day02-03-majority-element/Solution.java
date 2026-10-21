// Majority Element
// https://leetcode.com/problems/majority-element/
import java.util.*;

class Solution {
    public int majorityElement(int[] a) {
        int cand = 0, cnt = 0;
        for (int x : a) {
            if (cnt == 0) cand = x;
            cnt += (x == cand) ? 1 : -1;
        }
        return cand;
    }
}
