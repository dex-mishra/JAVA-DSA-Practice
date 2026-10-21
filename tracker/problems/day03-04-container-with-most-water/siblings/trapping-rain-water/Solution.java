// Trapping Rain Water
// https://leetcode.com/problems/trapping-rain-water/
import java.util.*;

class Solution {
    public int trap(int[] h) {
        int l = 0, r = h.length - 1, lm = 0, rm = 0, water = 0;
        while (l < r) {
            if (h[l] < h[r]) { lm = Math.max(lm, h[l]); water += lm - h[l]; l++; }
            else { rm = Math.max(rm, h[r]); water += rm - h[r]; r--; }
        }
        return water;
    }
}
