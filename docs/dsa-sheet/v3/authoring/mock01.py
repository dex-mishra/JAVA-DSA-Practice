import json, random
old = json.load(open('../../_superseded-v2/oa/mock-oa-01-problems.json'))
q1, q2 = old['problems'][0], old['problems'][1]
q1 = dict(q1); q2 = dict(q2)
q1['source_day'] = 2; q1['related'] = 'majority-element'; q1['tests_pattern'] = 'boyer-moore-voting'
q2['source_day'] = 4; q2['related'] = 'subarray-sum-equals-k'; q2['tests_pattern'] = 'prefix-sum-hashmap'

def ref(s, k):
    cnt = {}; l = 0; best = 0; d = 0
    for r, c in enumerate(s):
        cnt[c] = cnt.get(c, 0) + 1
        if cnt[c] == 1: d += 1
        while d > k:
            cnt[s[l]] -= 1
            if cnt[s[l]] == 0: d -= 1
            l += 1
        best = max(best, r - l + 1)
    return best
def brute(s, k):
    best = 0
    for i in range(len(s)):
        seen = set()
        for j in range(i, len(s)):
            seen.add(s[j])
            if len(seen) > k: break
            best = max(best, j - i + 1)
    return best
rng = random.Random(7)
def case(desc, marks, s, k):
    out = ref(s, k)
    if len(s) <= 3000: assert out == brute(s, k), desc
    return dict(desc=desc, marks=marks, input=f"{len(s)} {k}\n{s}\n", output=str(out))
hidden = [
 case("n = 1", 3, "q", 1),
 case("k = 26: the whole log qualifies", 4, "".join(rng.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(500)), 26),
 case("k = 1: longest run of a single letter", 5, "aabbbbbcaaab" * 20 + "ddddddd", 1),
 case("best segment at the very end of the log", 5, "abcabcabcabc" + "xyxyxyxyyyxxyyx", 2),
 case("window must shrink several times in a row", 6, "aaaaabbbbbcdefgaaaaaaaab", 2),
 case("many small segments, k = 3, n = 3000", 7, "".join(rng.choice("abcdef") for _ in range(3000)), 3),
 case("n = 2*10^5, k = 3, performance", 10, "".join(rng.choice("abcde") for _ in range(200000)), 3),
]
assert sum(h['marks'] for h in hidden) == 40
q3 = dict(
 id="mock-01-q3", ord=3, title="Signal Log", marks=40, difficulty="Medium",
 statement=("A ground station logs one lowercase letter per second, naming the satellite whose signal was strongest in that second.\n\n"
            "Analysts want to study a calm stretch: a continuous run of seconds during which **at most k different satellites** appear in the log. "
            "Report the length of the longest such stretch."),
 input_format="The first line contains two integers n and k. The second line contains a string s of n lowercase letters.",
 output_format="Print one integer: the maximum length of a contiguous part of s that contains at most k distinct letters.",
 constraints="1 <= n <= 2 * 10^5\n1 <= k <= 26\ns consists of lowercase English letters.",
 samples=[dict(input="7 2\nabacccb\n", output="4", explanation="\"accc\" uses only a and c. No longer stretch has at most 2 distinct letters."),
          dict(input="5 1\naaaaa\n", output="5", explanation="The whole log is one satellite.")],
 hidden=hidden,
 tests_pattern="variable-window", source_day=5,
 intended_approach="Variable sliding window with a 26-letter count array and a distinct counter: expand right; while distinct > k, remove s[l] and move l; record r − l + 1.",
 intended_complexity="O(n) time, O(26) space",
 common_wrong_turn="Re-scanning every start (O(n²) — fails the performance test), or using map.size() as the distinct count without erasing zero-count keys.",
 related="longest-substring-without-repeating-characters",
)
for h in q3['samples']:
    s = h['input'].split('\n')[1]; k = int(h['input'].split()[1])
    assert str(ref(s, k)) == h['output'], h
mock = dict(id="mock-01", title="Mock OA 01", covers_days=[1, 2, 3, 4, 5], duration_min=90, total_marks=100,
            difficulty="campus-beginner", grading=old['grading'], problems=[q1, q2, q3])
mock['grading']['totals'] = {"mock-01-q1": q1['marks'], "mock-01-q2": q2['marks'], "mock-01-q3": 40}
assert q1['marks'] + q2['marks'] + 40 == 100
json.dump(mock, open('../oa/mock-01-problems.json', 'w'))
print("ok", q1['marks'], q2['marks'], [h['output'] for h in hidden])
