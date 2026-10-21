// Ransom Note
// https://leetcode.com/problems/ransom-note/
import java.util.*;

class Solution {
    public boolean canConstruct(String note, String mag) {
        int[] cnt = new int[26];
        for (char c : mag.toCharArray()) cnt[c - 'a']++;
        for (char c : note.toCharArray()) if (--cnt[c - 'a'] < 0) return false;
        return true;
    }
}
