// Fruit Into Baskets
// https://leetcode.com/problems/fruit-into-baskets/
import java.util.*;

class Solution {
    public int totalFruit(int[] f) {
        Map<Integer, Integer> cnt = new HashMap<>();
        int l = 0, d = 0, best = 0;
        for (int r = 0; r < f.length; r++) {
            int c = cnt.getOrDefault(f[r], 0);
            if (c == 0) d++;
            cnt.put(f[r], c + 1);
            while (d > 2) {
                int cl = cnt.get(f[l]) - 1;
                cnt.put(f[l], cl);
                if (cl == 0) d--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
