// Contains Duplicate
// https://leetcode.com/problems/contains-duplicate/
import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] a) {
        Set<Integer> seen = new HashSet<>();
        for (int x : a) {
            if (seen.contains(x)) return true;
            seen.add(x);
        }
        return false;
    }
}
