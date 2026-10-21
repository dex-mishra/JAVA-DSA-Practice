// Valid Palindrome II
// https://leetcode.com/problems/valid-palindrome-ii/
import java.util.*;

class Solution {
    private boolean pal(String s, int l, int r) {
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }
    public boolean validPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) return pal(s, l + 1, r) || pal(s, l, r - 1);
            l++; r--;
        }
        return true;
    }
}
