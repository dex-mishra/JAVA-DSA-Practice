// Duplicate Zeros
// https://leetcode.com/problems/duplicate-zeros/
import java.util.*;

class Solution {
    public void duplicateZeros(int[] a) {
        int n = a.length, z = 0;
        for (int x : a) if (x == 0) z++;
        for (int i = n - 1; i >= 0; i--) {
            int j = i + z;
            if (j < n) a[j] = a[i];
            if (a[i] == 0) {
                z--;
                if (j - 1 < n) a[j - 1] = 0;
            }
        }
    }
}
