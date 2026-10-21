// Apply Operations to an Array
// https://leetcode.com/problems/apply-operations-to-an-array/
import java.util.*;

class Solution {
    public int[] applyOperations(int[] a) {
        int n = a.length;
        for (int i = 0; i + 1 < n; i++)
            if (a[i] == a[i + 1]) { a[i] *= 2; a[i + 1] = 0; }
        int write = 0;
        for (int read = 0; read < n; read++)
            if (a[read] != 0) { int t = a[write]; a[write] = a[read]; a[read] = t; write++; }
        return a;
    }
}
