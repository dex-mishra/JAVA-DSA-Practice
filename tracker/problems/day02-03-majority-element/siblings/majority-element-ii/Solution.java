// Majority Element II
// https://leetcode.com/problems/majority-element-ii/
import java.util.*;

class Solution {
    public List<Integer> majorityElement(int[] a) {
        int c1 = 0, c2 = 1, n1 = 0, n2 = 0;          // different initial candidates
        for (int x : a) {
            if (x == c1) n1++;
            else if (x == c2) n2++;
            else if (n1 == 0) { c1 = x; n1 = 1; }
            else if (n2 == 0) { c2 = x; n2 = 1; }
            else { n1--; n2--; }
        }
        n1 = 0; n2 = 0;
        for (int x : a) { if (x == c1) n1++; else if (x == c2) n2++; }
        List<Integer> out = new ArrayList<>();
        int n = a.length;
        if (n1 > n / 3) out.add(c1);
        if (n2 > n / 3) out.add(c2);
        return out;
    }
}
