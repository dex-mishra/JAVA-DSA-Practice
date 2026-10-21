// Frequency of the Most Frequent Element
// https://leetcode.com/problems/frequency-of-the-most-frequent-element/
import java.util.*;

class Solution {
    public int maxFrequency(int[] a, int k) {
        Arrays.sort(a);
        long sum = 0;
        int l = 0, best = 0;
        for (int r = 0; r < a.length; r++) {
            sum += a[r];
            while ((long) a[r] * (r - l + 1) - sum > k) sum -= a[l++];
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
