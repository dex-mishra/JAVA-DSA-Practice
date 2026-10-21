// Sort Array by Increasing Frequency
// https://leetcode.com/problems/sort-array-by-increasing-frequency/
import java.util.*;

class Solution {
    public int[] frequencySort(int[] a) {
        final Map<Integer, Integer> cnt = new HashMap<>();
        for (int x : a) cnt.put(x, cnt.getOrDefault(x, 0) + 1);
        Integer[] b = new Integer[a.length];
        for (int i = 0; i < a.length; i++) b[i] = a[i];
        Arrays.sort(b, new Comparator<Integer>() {
            public int compare(Integer x, Integer y) {
                if (!cnt.get(x).equals(cnt.get(y))) return cnt.get(x) - cnt.get(y);
                return y - x;
            }
        });
        for (int i = 0; i < a.length; i++) a[i] = b[i];
        return a;
    }
}
