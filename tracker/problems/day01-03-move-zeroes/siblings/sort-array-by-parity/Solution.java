// Sort Array By Parity
// https://leetcode.com/problems/sort-array-by-parity/
import java.util.*;

class Solution {
    public int[] sortArrayByParity(int[] a) {
        int write = 0;
        for (int read = 0; read < a.length; read++)
            if (a[read] % 2 == 0) { int t = a[write]; a[write] = a[read]; a[read] = t; write++; }
        return a;
    }
}
