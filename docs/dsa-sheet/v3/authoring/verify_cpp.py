"""Compile and run every reference C++ solution in the v3 day files against its tests.

    python3 verify_cpp.py <v3 dir>            # e.g. docs/dsa-sheet/v3
    python3 verify_cpp.py <v3 dir> --day 6    # one day only

Reads days/day-NN.json -> problems[].verify and problems[].siblings[].verify,
each {solution: "<class Solution ...>", tests: "<statements using CHECK(...)>"}.
Exit code 1 if any solution fails to compile or any CHECK fails. Needs g++ (C++17).
"""
import json, os, subprocess, sys, tempfile, glob
from concurrent.futures import ThreadPoolExecutor

HARNESS = r"""
#include <bits/stdc++.h>
using namespace std;
struct ListNode { int val; ListNode *next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode *n) : val(x), next(n) {} };
struct TreeNode { int val; TreeNode *left, *right; TreeNode() : val(0), left(nullptr), right(nullptr) {} TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {} };
#define CHECK(cond) do { if (!(cond)) { fprintf(stderr, "FAILED line %d: %s\n", __LINE__, #cond); return 1; } } while (0)
"""


def jobs(root, only_day=None):
    for path in sorted(glob.glob(os.path.join(root, "days", "day-*.json"))):
        doc = json.load(open(path))
        if only_day and doc["day"] != only_day:
            continue
        for p in doc["problems"]:
            yield f"day {doc['day']} {p['id']}", p["verify"]
            for s in p.get("siblings", []):
                yield f"day {doc['day']} {p['id']} / sibling {s['id']}", s["verify"]


def run(job, tmp):
    label, v = job
    if not v.get("solution") or not v.get("tests"):
        return label, "missing solution or tests"
    key = str(abs(hash(label)))
    src = os.path.join(tmp, key + ".cpp")
    exe = os.path.join(tmp, key)
    open(src, "w").write(HARNESS + "\n" + v["solution"] + "\nint main() {\n" + v["tests"] + "\n  puts(\"OK\");\n  return 0;\n}\n")
    c = subprocess.run(["g++", "-std=c++17", "-O2", "-o", exe, src], capture_output=True, text=True)
    if c.returncode:
        return label, "compile error:\n" + c.stderr[:1200]
    r = subprocess.run([exe], capture_output=True, text=True, timeout=20)
    if r.returncode or "OK" not in r.stdout:
        return label, "test failure: " + r.stderr.strip()[:400]
    return label, None


def main():
    root = sys.argv[1]
    only = int(sys.argv[sys.argv.index("--day") + 1]) if "--day" in sys.argv else None
    js = list(jobs(root, only))
    tmp = tempfile.mkdtemp(prefix="dsa-verify-")
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as ex:
        results = list(ex.map(lambda j: run(j, tmp), js))
    bad = [(l, e) for l, e in results if e]
    for l, e in bad:
        print(f"FAIL {l}\n  {e}")
    print(f"{len(js) - len(bad)} / {len(js)} solutions verified")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
