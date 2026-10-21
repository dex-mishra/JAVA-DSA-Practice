// Reverse String
// https://leetcode.com/problems/reverse-string/
import java.util.*;

class Solution {
    public void reverseString(char[] a) {
        int l = 0, r = a.length - 1;
        while (l < r) { char t = a[l]; a[l++] = a[r]; a[r--] = t; }
    }
}
