// Group Anagrams
// https://leetcode.com/problems/group-anagrams/
import java.util.*;

class Solution {
    public List<List<String>> groupAnagrams(String[] words) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String w : words) {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            String key = new String(c);
            groups.putIfAbsent(key, new ArrayList<>());
            groups.get(key).add(w);
        }
        return new ArrayList<>(groups.values());
    }
}
