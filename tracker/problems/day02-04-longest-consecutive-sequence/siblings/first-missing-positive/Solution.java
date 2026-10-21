// First Missing Positive
// https://leetcode.com/problems/first-missing-positive/
import java.util.*;

class Solution {
    public int firstMissingPositive(int[] a) {
        int n = a.length;
        for (int i = 0; i < n; i++)
            while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i]) {
                int j = a[i] - 1, t = a[j]; a[j] = a[i]; a[i] = t;
            }
        for (int i = 0; i < n; i++) if (a[i] != i + 1) return i + 1;
        return n + 1;
    }
}
