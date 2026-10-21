// Reverse Vowels of a String
// https://leetcode.com/problems/reverse-vowels-of-a-string/
import java.util.*;

class Solution {
    private boolean v(char c) { c = Character.toLowerCase(c); return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }
    public String reverseVowels(String s) {
        char[] a = s.toCharArray();
        int l = 0, r = a.length - 1;
        while (l < r) {
            while (l < r && !v(a[l])) l++;
            while (l < r && !v(a[r])) r--;
            char t = a[l]; a[l++] = a[r]; a[r--] = t;
        }
        return new String(a);
    }
}
