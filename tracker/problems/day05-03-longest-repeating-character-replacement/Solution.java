// Longest Repeating Character Replacement
// https://leetcode.com/problems/longest-repeating-character-replacement/
import java.util.*;

class Solution {
    public int characterReplacement(String s, int k) {
        int[] cnt = new int[26];
        int l = 0, maxCount = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            maxCount = Math.max(maxCount, ++cnt[s.charAt(r) - 'A']);
            if (r - l + 1 - maxCount > k) {
                cnt[s.charAt(l) - 'A']--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
