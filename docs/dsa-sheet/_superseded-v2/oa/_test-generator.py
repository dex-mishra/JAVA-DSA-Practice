import json, itertools, sys
from collections import Counter

# ---------- reference implementations ----------
def q1_ref(inp):
    lines = inp.split("\n"); n = int(lines[0]); a = list(map(int, lines[1].split()))
    assert len(a) == n
    cand, cnt = None, 0
    for x in a:
        if cnt == 0: cand, cnt = x, 1
        elif x == cand: cnt += 1
        else: cnt -= 1
    return str(cand)

def q1_brute(inp):
    lines = inp.split("\n"); n = int(lines[0]); a = list(map(int, lines[1].split()))
    c = Counter(a); best, k = max(c.items(), key=lambda t: t[1])
    assert k * 2 > n, "input violates the strict-majority guarantee"
    return str(best)

def q2_ref(inp):
    l = inp.split("\n"); n, k = map(int, l[0].split()); a = list(map(int, l[1].split()))
    assert len(a) == n
    seen = {0: 1}; pre = 0; ans = 0
    for x in a:
        pre += x
        ans += seen.get(pre - k, 0)
        seen[pre] = seen.get(pre, 0) + 1
    return str(ans)

def q2_brute(inp):
    l = inp.split("\n"); n, k = map(int, l[0].split()); a = list(map(int, l[1].split()))
    ans = 0
    for i in range(n):
        s = 0
        for j in range(i, n):
            s += a[j]
            if s == k: ans += 1
    return str(ans)

def q3_ref(inp):
    l = inp.split("\n"); n, t = map(int, l[0].split()); a = sorted(map(int, l[1].split()))
    assert len(a) == n
    out = []
    def go(start, rem, path):
        if rem == 0: out.append(path[:]); return
        for i in range(start, len(a)):
            if i > start and a[i] == a[i-1]: continue
            if a[i] > rem: break
            path.append(a[i]); go(i+1, rem-a[i], path); path.pop()
    go(0, t, [])
    if not out: return "NONE"
    out.sort()
    return "\n".join(" ".join(map(str, r)) for r in out)

def q3_brute(inp):
    l = inp.split("\n"); n, t = map(int, l[0].split()); a = list(map(int, l[1].split()))
    res = set()
    for m in range(1 << n):
        s = 0; pick = []
        for i in range(n):
            if m >> i & 1: s += a[i]; pick.append(a[i])
            if s > t: break
        if s == t: res.add(tuple(sorted(pick)))
    if not res: return "NONE"
    return "\n".join(" ".join(map(str, r)) for r in sorted(res))

# ---------- generators for the two performance tests ----------
def gen_q1():
    n = 499999
    a = [7 if i % 2 == 0 else (i % 5) + 1 for i in range(n)]
    return "%d\n%s" % (n, " ".join(map(str, a)))

def gen_q2():
    n = 200000
    a = [(i % 7) - 3 for i in range(n)]
    return "%d %d\n%s" % (n, 0, " ".join(map(str, a)))

# ---------- test tables: (desc, marks, input, verify-with-brute?) ----------
Q1 = [
 ("n = 1, single reading", 2, "1\n42", True),
 ("majority at the very start of the log", 3, "9\n8 8 8 8 8 1 2 3 4", True),
 ("majority at the very end of the log", 3, "9\n1 2 3 4 8 8 8 8 8", True),
 ("majority exactly n/2 + 1 occurrences, maximally spread", 5, "9\n5 1 5 2 5 3 5 4 5", True),
 ("all IDs negative", 3, "7\n-3 -9 -3 -3 -7 -3 -3", True),
 ("IDs at the +/-10^9 boundary", 3, "5\n1000000000 -1000000000 1000000000 -1000000000 1000000000", True),
]
Q2 = [
 ("n = 1 with the single value equal to k", 3, "1 5\n5", True),
 ("n = 1 with the single value not equal to k", 2, "1 5\n-5", True),
 ("all values zero, k = 0 (answer is n(n+1)/2)", 5, "1000 0\n" + " ".join(["0"]*1000), False),
 ("k = 0 with alternating positives and negatives", 5, "10 0\n3 -3 3 -3 3 -3 3 -3 3 -3", True),
 ("a valid range starting at hour 1", 4, "6 10\n10 -1 1 5 2 3", True),
 ("answer exceeding 2^31 - 1", 6, "70000 0\n" + " ".join(["0"]*70000), False),
 ("all values negative, k negative", 4, "8 -6\n-1 -2 -3 -1 -4 -5 -2 -1", True),
]
Q3 = [
 ("no valid roster exists, expect NONE", 4, "4 60\n1 1 1 1", True),
 ("exactly one roster, using every slot", 4, "5 50\n10 12 8 15 5", True),
 ("all durations identical", 6, "10 20\n5 5 5 5 5 5 5 5 5 5", True),
 ("many duplicate durations, checking no repeated rosters", 8, "12 10\n1 1 2 2 3 3 4 4 5 5 6 6", True),
 ("a single slot equal to the target", 3, "1 7\n7", True),
 ("durations larger than the target present in the pool", 4, "6 9\n50 40 4 5 9 30", True),
 ("output ordering, lexicographic (numeric, element by element)", 4, "6 10\n10 1 9 2 8 3", True),
]

def build(table, ref, brute, perf):
    out = []
    for desc, marks, inp, use_brute in table:
        exp = ref(inp)
        if use_brute:
            b = brute(inp)
            assert exp == b, "MISMATCH %r\n ref=%r\n brute=%r" % (desc, exp, b)
        out.append(dict(desc=desc, marks=marks, input=inp, output=exp))
    out.append(perf)
    return out

# q1 perf
i1 = gen_q1(); o1 = q1_ref(i1); assert o1 == q1_brute(i1) == "7"
p1 = dict(desc="n ~ 5*10^5, performance", marks=6, output=o1,
          gen=dict(kind="formula", n=499999,
                   spec="first line: 499999. second line: a[i] = 7 when i is even, otherwise (i % 5) + 1, for i = 0..499998.",
                   builder_js="function build(){const n=499999,a=new Array(n);for(let i=0;i<n;i++)a[i]=(i%2===0)?7:(i%5)+1;return n+'\\n'+a.join(' ');}"))
# q2 perf
i2 = gen_q2(); o2 = q2_ref(i2)
p2 = dict(desc="n = 2*10^5, performance", marks=6, output=o2,
          gen=dict(kind="formula", n=200000,
                   spec="first line: 200000 0. second line: a[i] = (i % 7) - 3, for i = 0..199999.",
                   builder_js="function build(){const n=200000,a=new Array(n);for(let i=0;i<n;i++)a[i]=(i%7)-3;return n+' 0\\n'+a.join(' ');}"))
# q3 perf: n=100 heavy duplication, stays literal (input is tiny)
i3 = "100 12\n" + " ".join([str(v) for v in ([1]*25 + [2]*25 + [3]*25 + [4]*25)])
o3 = q3_ref(i3)
p3 = dict(desc="n = 100 with heavy duplication, performance", marks=7, input=i3, output=o3)

h1 = build(Q1, q1_ref, q1_brute, p1)
h2 = build(Q2, q2_ref, q2_brute, p2)
h3 = build(Q3, q3_ref, q3_brute, p3)

# ---------- assertions the descriptions promise ----------
assert h2[2]["output"] == str(1000*1001//2), h2[2]["output"]
assert int(h2[5]["output"]) > 2**31 - 1, h2[5]["output"]
assert h2[5]["output"] == str(70000*70001//2)
assert h3[0]["output"] == "NONE"
assert h3[1]["output"] == "5 8 10 12 15", h3[1]["output"]
assert h3[4]["output"] == "7"
assert h3[6]["output"].split("\n") == ["1 9", "2 8", "10"], h3[6]["output"]
assert len(h3[3]["output"].split("\n")) == len(set(h3[3]["output"].split("\n"))), "duplicate rosters"
assert h1[-1]["output"] == "7"
for name, h, tot in (("Q1", h1, 25), ("Q2", h2, 35), ("Q3", h3, 40)):
    s = sum(t["marks"] for t in h)
    assert s == tot, (name, s, tot)
    print(name, len(h), "tests,", s, "marks")

print("\nQ2 perf answer:", o2)
print("Q3 perf rosters:", len(o3.split("\n")))
print("Q3 dup-heavy rosters:", h3[3]["output"].replace("\n"," | "))
print("Q3 ordering test:", h3[6]["output"].replace("\n"," | "))
print("Q2 alternating:", h2[3]["output"], "| start-at-1:", h2[4]["output"], "| all-neg:", h2[6]["output"])
json.dump(dict(q1=h1, q2=h2, q3=h3), open("/tmp/claude-0/-home-claude/831b99d8-bc4e-55b4-a784-98712fce0bdf/scratchpad/oa/hidden.json","w"))
print("\nALL CHECKS PASSED")
