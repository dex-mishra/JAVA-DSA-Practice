// Maximize the Confusion of an Exam
// https://leetcode.com/problems/maximize-the-confusion-of-an-exam/
import java.util.*;

class Solution {
    private int longest(String s, int k, char bad) {
        int l = 0, cnt = 0, ans = 0;
        for (int r = 0; r < s.length(); r++) {
            if (s.charAt(r) == bad) cnt++;
            while (cnt > k) if (s.charAt(l++) == bad) cnt--;
            ans = Math.max(ans, r - l + 1);
        }
        return ans;
    }
    public int maxConsecutiveAnswers(String s, int k) {
        return Math.max(longest(s, k, 'T'), longest(s, k, 'F'));
    }
}
