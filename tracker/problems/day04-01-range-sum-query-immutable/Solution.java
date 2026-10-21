// Range Sum Query - Immutable
// https://leetcode.com/problems/range-sum-query-immutable/
import java.util.*;

class NumArray {
    private long[] pre;
    public NumArray(int[] a) {
        pre = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
    }
    public int sumRange(int l, int r) { return (int)(pre[r + 1] - pre[l]); }
}
