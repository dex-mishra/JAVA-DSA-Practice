// Intersection of Two Arrays
// https://leetcode.com/problems/intersection-of-two-arrays/
import java.util.*;

class Solution {
    public int[] intersection(int[] a, int[] b) {
        Set<Integer> s = new HashSet<>();
        for (int x : a) s.add(x);
        List<Integer> out = new ArrayList<>();
        for (int x : b) if (s.remove(x)) out.add(x);   // remove returns true if it was there
        int[] res = new int[out.size()];
        for (int i = 0; i < res.length; i++) res[i] = out.get(i);
        return res;
    }
}
