// Longest Substring Without Repeating Characters
// https://leetcode.com/problems/longest-substring-without-repeating-characters/
import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] cnt = new int[256];
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            cnt[s.charAt(r)]++;
            while (cnt[s.charAt(r)] > 1) {
                cnt[s.charAt(l)]--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
