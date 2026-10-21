// Find All Numbers Disappeared in an Array
// https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/
import java.util.*;

class Solution {
    public List<Integer> findDisappearedNumbers(int[] a) {
        for (int x : a) { int i = Math.abs(x) - 1; a[i] = -Math.abs(a[i]); }
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < a.length; i++) if (a[i] > 0) out.add(i + 1);
        return out;
    }
}
