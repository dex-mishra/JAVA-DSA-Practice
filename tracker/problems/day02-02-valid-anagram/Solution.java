// Valid Anagram
// https://leetcode.com/problems/valid-anagram/
import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] cnt = new int[26];
        for (int i = 0; i < s.length(); i++) {
            cnt[s.charAt(i) - 'a']++;
            cnt[t.charAt(i) - 'a']--;
        }
        for (int k = 0; k < 26; k++) if (cnt[k] != 0) return false;
        return true;
    }
}
