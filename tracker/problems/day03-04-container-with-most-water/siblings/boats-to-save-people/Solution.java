// Boats to Save People
// https://leetcode.com/problems/boats-to-save-people/
import java.util.*;

class Solution {
    public int numRescueBoats(int[] a, int limit) {
        Arrays.sort(a);
        int l = 0, r = a.length - 1, boats = 0;
        while (l <= r) {
            if (a[l] + a[r] <= limit) l++;
            r--; boats++;
        }
        return boats;
    }
}
