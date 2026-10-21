// Remove Element
// https://leetcode.com/problems/remove-element/
import java.util.*;

class Solution {
    public int removeElement(int[] a, int val) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (a[read] != val) a[write++] = a[read];
        return write;
    }
}
