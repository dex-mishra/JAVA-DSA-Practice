// Move Zeroes
// https://leetcode.com/problems/move-zeroes/
import java.util.*;

class Solution {
    public void moveZeroes(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++) {
            if (a[read] != 0) {
                int t = a[write]; a[write] = a[read]; a[read] = t;
                write++;
            }
        }
    }
}
