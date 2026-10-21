// Maximum Number of Vowels in a Substring of Given Length
// https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/
import java.util.*;

class Solution {
    private boolean v(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
    public int maxVowels(String s, int k) {
        int cnt = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (v(s.charAt(i))) cnt++;
            if (i >= k && v(s.charAt(i - k))) cnt--;
            if (i >= k - 1) best = Math.max(best, cnt);
        }
        return best;
    }
}
