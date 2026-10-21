// Remove Duplicates from Sorted Array II
// https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/
import java.util.*;

class Solution {
    public int removeDuplicates(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (write < 2 || a[read] != a[write - 2]) a[write++] = a[read];
        return write;
    }
}
