"""Parse the authored v3 text sources into JSON, validate every cross-reference,
and compile + run every C++ solution against its tests.

    python3 build.py <out_dir> [--no-compile]

Sources:
  theory/*.txt   atomic theory pages      ->  <out>/theory/<page-id>.json + theory/INDEX.json
  days/*.txt     per-day problem content  ->  <out>/days/day-NN.json
"""
import json, os, re, subprocess, sys, tempfile, glob, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
COMPILE = "--no-compile" not in sys.argv
PLAN = json.load(open(os.path.join(OUT, "PLAN.json")))

NOTE = {"write", "screenshot", "mixed", "hidden"}
SEC_RE = re.compile(r"^--- ([a-z0-9_-]+) \| (.+?) \| (write|screenshot|mixed|hidden)\s*$")
errors, warnings = [], []


def split_blocks(text, marker):
    """Split text on lines starting with `marker` (e.g. '=== ')."""
    blocks, cur = [], None
    for line in text.split("\n"):
        if line.startswith(marker):
            if cur is not None:
                blocks.append(cur)
            cur = [line]
        elif cur is not None:
            cur.append(line)
    if cur is not None:
        blocks.append(cur)
    return blocks


def parse_sections(lines, where):
    """Header 'key: value' lines (and '- ' list items under a key), then '--- id | title | note' sections."""
    head, sections, cur, key = {}, [], None, None
    for line in lines:
        m = SEC_RE.match(line)
        if m:
            cur = dict(id=m.group(1), title=m.group(2), note=m.group(3), body=[])
            sections.append(cur)
            continue
        if cur is None:
            if not line.strip():
                continue
            if line.startswith("- ") and key:
                head.setdefault(key, [])
                if not isinstance(head[key], list):
                    errors.append(f"{where}: header {key} mixes scalar and list")
                    continue
                head[key].append(line[2:].strip())
                continue
            mm = re.match(r"^([a-z_]+):\s?(.*)$", line)
            if not mm:
                errors.append(f"{where}: unparsable header line {line!r}")
                continue
            key, val = mm.group(1), mm.group(2).strip()
            head[key] = val if val else []
        else:
            cur["body"].append(line)
    for s in sections:
        s["body"] = "\n".join(s["body"]).strip("\n")
        if not s["body"].strip():
            errors.append(f"{where}: section {s['id']} is empty")
    ids = [s["id"] for s in sections]
    if len(ids) != len(set(ids)):
        errors.append(f"{where}: duplicate section ids {ids}")
    return head, sections


def csv(v):
    if isinstance(v, list):
        return v
    return [x.strip() for x in v.split(",") if x.strip()] if v else []


def strip_fence(code):
    code = code.strip()
    if code.startswith("```"):
        code = code.split("\n", 1)[1]
        code = code.rsplit("```", 1)[0]
    return code


# ------------------------------------------------------------------ theory
pages = {}
for path in sorted(glob.glob(os.path.join(HERE, "theory", "*.txt"))):
    text = open(path).read()
    for blk in split_blocks(text, "=== page: "):
        pid = blk[0][len("=== page: "):].strip()
        where = f"{os.path.basename(path)}:{pid}"
        head, secs = parse_sections(blk[1:], where)
        for k in ("title", "topic", "kind", "summary"):
            if not head.get(k):
                errors.append(f"{where}: missing {k}")
        if pid in pages:
            errors.append(f"{where}: duplicate page id")
        if len(secs) < 2:
            errors.append(f"{where}: only {len(secs)} sections")
        pages[pid] = dict(id=pid, title=head.get("title"), topic=head.get("topic"), kind=head.get("kind"),
                          summary=head.get("summary"), prereqs=csv(head.get("prereqs", "")),
                          related=csv(head.get("related", "")), sections=secs, used_by=[])


def check_ref(ref, where):
    """'page#section' or 'page' -> validated."""
    page, _, sec = ref.partition("#")
    if page not in pages:
        errors.append(f"{where}: theory ref to missing page {page!r}")
        return
    if sec and sec not in {s["id"] for s in pages[page]["sections"]}:
        errors.append(f"{where}: theory ref {ref!r}: page has no section {sec!r} "
                      f"(has {[s['id'] for s in pages[page]['sections']]})")


INLINE_REF = re.compile(r"\[\[([a-z0-9-]+(?:#[a-z0-9_-]+)?)\]\]")
for pid, p in pages.items():
    for r in p["prereqs"] + p["related"]:
        check_ref(r, f"page {pid} prereq/related")
    for s in p["sections"]:
        for r in INLINE_REF.findall(s["body"]):
            check_ref(r, f"page {pid}#{s['id']} inline")

# ------------------------------------------------------------------ plan cross-check
plan_problems = {p["id"]: (d["day"], p) for d in PLAN["days"] for p in d["problems"]}
plan_skims = {s["id"]: (d["day"], s) for d in PLAN["days"] for s in d["skims"]}
for pid, (dn, p) in plan_problems.items():
    for t in p["theory"]:
        check_ref(t, f"PLAN day {dn} {pid}")
for sid, (dn, s) in plan_skims.items():
    for t in s["theory"]:
        check_ref(t, f"PLAN day {dn} skim {sid}")

# ------------------------------------------------------------------ days
STAGES = ["understand", "analyse", "brainstorm", "algorithm", "pseudocode", "solution", "dry_run", "edges",
          "carry", "followups", "tests"]
SIB_STAGES = ["analyse", "brainstorm", "algorithm", "pseudocode", "solution", "quick_theory", "tests"]
compile_jobs = []  # (label, solution, tests)
all_slugs_seen = set(plan_problems) | set(plan_skims)
day_docs = {}


def parse_refs(lines, where):
    out = []
    for l in lines or []:
        parts = [x.strip() for x in l.split("|")]
        if len(parts) != 4:
            errors.append(f"{where}: theory_refs line needs 4 '|' fields: {l!r}")
            continue
        stage, at, ref, why = parts
        check_ref(ref, where)
        page, _, sec = ref.partition("#")
        out.append(dict(stage=stage, at=at, page=page, section=sec, why=why))
    return out


def parse_stuck(lines, where):
    out = {}
    for l in lines or []:
        mins, ref = [x.strip() for x in l.split("|", 1)]
        check_ref(ref, where)
        page, _, sec = ref.partition("#")
        out[mins] = dict(page=page, section=sec)
    return out


for path in sorted(glob.glob(os.path.join(HERE, "days", "day-*.txt"))):
    text = open(path).read()
    top = split_blocks(text, "=== ")
    doc = dict(problems=[], drill=[], cs_core=None)
    dn = None
    for blk in top:
        hdr = blk[0][4:].strip()
        if hdr.startswith("day:"):
            dn = int(hdr.split(":")[1])
            head, secs = parse_sections(blk[1:], f"day {dn}")
            doc.update(day=dn, micro=dict(title=head.get("micro_title", ""), theory=csv(head.get("micro_theory", "")),
                                          sections=secs))
            for r in doc["micro"]["theory"]:
                check_ref(r, f"day {dn} micro")
            for s in secs:
                for r in INLINE_REF.findall(s["body"]):
                    check_ref(r, f"day {dn} micro#{s['id']}")
        elif hdr.startswith("problem:"):
            slug = hdr.split(":", 1)[1].strip()
            where = f"day {dn} {slug}"
            if slug not in plan_problems:
                errors.append(f"{where}: not a problem in PLAN.json")
                continue
            pday, pp = plan_problems[slug]
            if pday != dn:
                errors.append(f"{where}: PLAN says day {pday}")
            subs = split_blocks("\n".join(blk), "+++ sibling: ")
            main_lines = blk[1:]
            sib_blocks = []
            if subs:
                first = "\n".join(blk).split("\n+++ sibling: ")[0].split("\n")[1:]
                main_lines = first
                sib_blocks = subs
            head, secs = parse_sections(main_lines, where)
            got = [s["id"] for s in secs]
            if got != STAGES:
                errors.append(f"{where}: stages {got} != {STAGES}")
            sec = {s["id"]: s for s in secs}
            for s in secs:
                for r in INLINE_REF.findall(s["body"]):
                    check_ref(r, f"{where}#{s['id']} inline")
            siblings = []
            for sb in sib_blocks:
                sh = [x.strip() for x in sb[0][len("+++ sibling: "):].split("|")]
                if len(sh) != 5:
                    errors.append(f"{where}: sibling header needs 'lc_id | slug | title | difficulty | must|optional': {sb[0]!r}")
                    continue
                lcid, sslug, stitle, sdiff, tier = sh
                sw = f"{where} sibling {sslug}"
                if sslug in all_slugs_seen:
                    errors.append(f"{sw}: slug already used in plan, skims or another sibling")
                all_slugs_seen.add(sslug)
                shead, ssecs = parse_sections(sb[1:], sw)
                if [s["id"] for s in ssecs] != SIB_STAGES:
                    errors.append(f"{sw}: stages {[s['id'] for s in ssecs]} != {SIB_STAGES}")
                for s in ssecs:
                    for r in INLINE_REF.findall(s["body"]):
                        check_ref(r, f"{sw}#{s['id']} inline")
                ssec = {s["id"]: s for s in ssecs}
                if "solution" in ssec and "tests" in ssec:
                    compile_jobs.append((sw, ssec["solution"]["body"], ssec["tests"]["body"]))
                siblings.append(dict(id=sslug, title=stitle, tier=tier,
                                     lc=dict(id=lcid, slug=sslug, url=f"https://leetcode.com/problems/{sslug}/", difficulty=sdiff),
                                     maps=shead.get("maps", ""),
                                     stages=[s for s in ssecs if s["id"] != "tests"],
                                     verify=dict(solution=strip_fence(ssec.get("solution", {}).get("body", "")),
                                                 tests=strip_fence(ssec.get("tests", {}).get("body", "")))))
            if sum(1 for s in siblings if s["tier"] == "must") != 1:
                errors.append(f"{where}: needs exactly one must-study sibling, has {[s['tier'] for s in siblings]}")
            if "solution" in sec and "tests" in sec:
                compile_jobs.append((where, sec["solution"]["body"], sec["tests"]["body"]))
            refs = parse_refs(head.get("theory_refs"), where)
            stuck = parse_stuck(head.get("stuck_refs"), where)
            if not refs:
                errors.append(f"{where}: no theory_refs")
            for r in refs:
                pages[r["page"]]["used_by"].append(dict(problem=slug, day=dn, section=r["section"], stage=r["stage"], at=r["at"]))
            doc["problems"].append(dict(id=slug, theory_refs=refs, stuck_refs=stuck,
                                        stages=[s for s in secs if s["id"] != "tests"], siblings=siblings,
                                        verify=dict(solution=strip_fence(sec.get("solution", {}).get("body", "")),
                                                    tests=strip_fence(sec.get("tests", {}).get("body", "")))))
        elif hdr.startswith("drill"):
            for it in split_blocks("\n".join(blk), "+++ item: "):
                sh = [x.strip() for x in it[0][len("+++ item: "):].split("|")]
                lcid, sslug, stitle, sdiff = sh
                w = f"day {dn} drill {sslug}"
                if sslug in all_slugs_seen:
                    errors.append(f"{w}: slug already used elsewhere")
                all_slugs_seen.add(sslug)
                h, isecs = parse_sections(it[1:], w)
                for k in ("statement", "pattern", "approach", "trigger"):
                    if not h.get(k):
                        errors.append(f"{w}: missing {k}")
                check_ref(h.get("pattern", ""), w)
                # Optional full statement (input, output, constraints, an
                # example), in original words -- never LeetCode's text.
                details = next((x["body"] for x in isecs if x["id"] == "details"), None)
                if [x["id"] for x in isecs if x["id"] != "details"]:
                    errors.append(f"{w}: the only section a drill item may have is 'details'")
                doc["drill"].append(dict(id=sslug, title=stitle,
                                         lc=dict(id=lcid, slug=sslug, url=f"https://leetcode.com/problems/{sslug}/", difficulty=sdiff),
                                         statement=h.get("statement"), pattern_page=h.get("pattern"),
                                         pattern_name=h.get("pattern_name", ""),
                                         approach=h.get("approach"), trigger=h.get("trigger"),
                                         complexity=h.get("complexity", ""),
                                         **({"details": details} if details else {})))
        elif hdr.startswith("cs_core:"):
            cid = hdr.split(":", 1)[1].strip()
            h, secs = parse_sections(blk[1:], f"day {dn} cs_core")
            doc["cs_core"] = dict(id=cid, subject=h.get("subject"), title=h.get("title"), sections=secs)
    if dn is None:
        errors.append(f"{path}: no '=== day:' block")
        continue
    plan_day = next(d for d in PLAN["days"] if d["day"] == dn)
    want = [p["id"] for p in plan_day["problems"]]
    have = [p["id"] for p in doc["problems"]]
    if want != have:
        errors.append(f"day {dn}: problems {have} != PLAN {want}")
    if len(doc["drill"]) != 5:
        errors.append(f"day {dn}: drill has {len(doc['drill'])} items, want 5")
    if not doc["cs_core"]:
        errors.append(f"day {dn}: no cs_core card")
    day_docs[dn] = doc

# ------------------------------------------------------------------ compile
HARNESS_PRE = r"""
#include <bits/stdc++.h>
using namespace std;
struct ListNode { int val; ListNode *next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode *n) : val(x), next(n) {} };
struct TreeNode { int val; TreeNode *left, *right; TreeNode() : val(0), left(nullptr), right(nullptr) {} TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {} };
#define CHECK(cond) do { if (!(cond)) { fprintf(stderr, "FAILED line %d: %s\n", __LINE__, #cond); return 1; } } while (0)
"""


results = []
if COMPILE and not errors:
    tmp = tempfile.mkdtemp(prefix="v3verify-")
    for i, (label, sol, tests) in enumerate(compile_jobs):
        src = HARNESS_PRE + "\n" + strip_fence(sol) + "\nint main() {\n" + strip_fence(tests) + "\n  puts(\"OK\");\n  return 0;\n}\n"
        f = os.path.join(tmp, f"t{i}.cpp")
        open(f, "w").write(src)
        exe = f[:-4]
        c = subprocess.run(["g++", "-std=c++17", "-O2", "-Wall", "-Wno-unused-variable", "-Wno-sign-compare", "-o", exe, f],
                           capture_output=True, text=True)
        if c.returncode:
            errors.append(f"COMPILE {label}:\n{c.stderr[:1500]}")
            continue
        r = subprocess.run([exe], capture_output=True, text=True, timeout=20)
        if r.returncode or "OK" not in r.stdout:
            errors.append(f"TESTS {label}: {r.stderr.strip()[:500]}")
        else:
            results.append(label)

# ------------------------------------------------------------------ write
if errors:
    print(f"\n{len(errors)} error(s):")
    for e in errors:
        print("  -", e)
    sys.exit(1)

os.makedirs(os.path.join(OUT, "theory"), exist_ok=True)
os.makedirs(os.path.join(OUT, "days"), exist_ok=True)
for f in glob.glob(os.path.join(OUT, "theory", "*.json")):
    os.remove(f)
index = []
for pid, p in sorted(pages.items()):
    json.dump(p, open(os.path.join(OUT, "theory", f"{pid}.json"), "w"), indent=1, ensure_ascii=False)
    index.append(dict(id=pid, title=p["title"], topic=p["topic"], kind=p["kind"], summary=p["summary"],
                      sections=[dict(id=s["id"], title=s["title"], note=s["note"]) for s in p["sections"]],
                      prereqs=p["prereqs"], related=p["related"]))
topics = {}
for e in index:
    topics.setdefault(e["topic"], []).append(e["id"])
json.dump(dict(version=3, count=len(index), topics=topics, pages=index),
          open(os.path.join(OUT, "theory", "INDEX.json"), "w"), indent=1, ensure_ascii=False)
for dn, doc in day_docs.items():
    json.dump(doc, open(os.path.join(OUT, "days", f"day-{dn:02d}.json"), "w"), indent=1, ensure_ascii=False)

words = sum(len(s["body"].split()) for p in pages.values() for s in p["sections"])
print(f"theory pages {len(pages)} ({words} words), topics {len(topics)}")
print(f"days written {sorted(day_docs)}")
print(f"C++ verified {len(results)} / {len(compile_jobs)}" if COMPILE else "compile skipped")
unref = sorted(set(pages) - {t for d in PLAN['days'] for p in d['problems'] for t in p['theory']} - {t for d in PLAN['days'] for s in d['skims'] for t in s['theory']})
print(f"pages not on any plan problem's primary list ({len(unref)}): {unref}")
for w in warnings:
    print("warn:", w)
