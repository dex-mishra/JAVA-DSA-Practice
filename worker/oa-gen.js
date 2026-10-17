/**
 * Hand-ported generators for the OA performance tests.
 *
 * PRD §3.1: two hidden tests have inputs of 1.0 MB and 0.5 MB of digits.
 * Inlining them would add 1.45 MB to a 150 KB file, so the content ships a
 * recipe instead -- `gen.spec` in prose and `gen.builder_js` as JavaScript
 * source. The same section is explicit about what to do with that source:
 *
 *     Copy it into the grader as source; never `eval` it at request time.
 *     It is trusted content from the sheet, but a code path that evaluates
 *     strings from the content store is a path an attacker only has to
 *     reach once.
 *
 * So these are the ports, written out by hand. The import step then does
 * what makes the port trustworthy: it runs the authored `builder_js` and
 * the port below over the same key and refuses to import unless the two
 * produce byte-identical strings. A regenerated mock that changes a
 * generator fails the build loudly rather than grading against the wrong
 * input.
 *
 * `builder_js` is stripped from the bundle at import time, so the Worker
 * never carries the string at all. There is nothing here to evaluate even
 * by accident.
 *
 * Keys are `<problem id>#<index in that problem's hidden tests>`.
 */

export const BUILDERS = {
  /* mock-01-q1: a[i] = 7 on even i, else (i % 5) + 1. 7 holds a strict
     majority (250000 of 499999), which is what the test is checking the
     voting survives at scale. */
  "mock-01-q1#6": function build() {
    const n = 499999;
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = (i % 2 === 0) ? 7 : (i % 5) + 1;
    return n + "\n" + a.join(" ");
  },

  /* mock-01-q2: a[i] = (i % 7) - 3, k = 0. The values cycle through
     -3..3 summing to zero every seven terms, so prefix sums repeat
     constantly and the answer is large enough to overflow a 32-bit
     counter -- which is the actual thing under test. */
  "mock-01-q2#7": function build() {
    const n = 200000;
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = (i % 7) - 3;
    return n + " 0\n" + a.join(" ");
  },

  /* mock-01-q2: 70000 zeros, k = 0. Every subarray sums to zero, so the
     answer is n(n+1)/2 = 2450035000 -- past 2^31, like #7. Generated only
     because 140 KB is over the runner's stdin cap. */
  "mock-01-q2#5": function build() {
    const n = 70000;
    return n + " 0\n" + new Array(n).fill(0).join(" ");
  },

  /* mock-01-q3: 200000 letters from a 32-bit LCG (Numerical Recipes
     constants), top byte mod 5 into "abcde". Chosen over Math.random-style
     generators because it is reproducible bit for bit in C++ and Python. */
  "mock-01-q3#6": function build() {
    const n = 200000;
    let x = 20261023;
    let s = "";
    for (let i = 0; i < n; i++) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      s += "abcde"[(x >>> 24) % 5];
    }
    return n + " 3\n" + s + "\n";
  }
};

/* The same generators as source code, for runners whose stdin is capped
 * (OnlineCompiler.io: 100 KB). worker/runner.js prepends one of these to the
 * submission, and it writes the input to a file and points stdin at it
 * before main() runs -- so the program reads exactly what it would have read
 * from stdin. worker/oa-gen.test.mjs compiles each one and checks it against
 * the JS builder above byte for byte. */
const CPP_FEED = (body) => `// ---- grader: generates this test's input (too large to send as stdin) ----
#include <cstdio>
#include <string>
namespace lc_grader_ {
static std::string build() {
${body}
}
struct Feed {
  Feed() {
    const std::string s = build();
    const char* paths[] = {"/tmp/lc_grader_in.txt", "lc_grader_in.txt"};
    for (const char* p : paths) {
      FILE* f = std::fopen(p, "wb");
      if (!f) continue;
      std::fwrite(s.data(), 1, s.size(), f);
      std::fclose(f);
      if (std::freopen(p, "rb", stdin)) return;
    }
  }
};
static Feed feed_;
}
#line 1
`;

const PY_FEED = (body) => `# ---- grader: generates this test's input (too large to send as stdin) ----
import io as _lc_io, sys as _lc_sys
def _lc_build():
${body}
_lc_sys.stdin = _lc_io.TextIOWrapper(_lc_io.BytesIO(_lc_build().encode()), encoding="utf-8")
del _lc_io, _lc_sys, _lc_build
`;

export const GEN_SOURCES = {
  "mock-01-q1#6": {
    cpp: CPP_FEED(`  const int n = 499999; std::string s = std::to_string(n) + "\\n";
  for (int i = 0; i < n; i++) { if (i) s += ' '; s += std::to_string(i % 2 == 0 ? 7 : (i % 5) + 1); }
  return s;`),
    python: PY_FEED(`    n = 499999
    return str(n) + "\\n" + " ".join(str(7 if i % 2 == 0 else i % 5 + 1) for i in range(n))`)
  },
  "mock-01-q2#7": {
    cpp: CPP_FEED(`  const int n = 200000; std::string s = std::to_string(n) + " 0\\n";
  for (int i = 0; i < n; i++) { if (i) s += ' '; s += std::to_string((i % 7) - 3); }
  return s;`),
    python: PY_FEED(`    n = 200000
    return str(n) + " 0\\n" + " ".join(str(i % 7 - 3) for i in range(n))`)
  },
  "mock-01-q2#5": {
    cpp: CPP_FEED(`  const int n = 70000; std::string s = std::to_string(n) + " 0\\n";
  for (int i = 0; i < n; i++) { if (i) s += ' '; s += '0'; }
  return s;`),
    python: PY_FEED(`    n = 70000
    return str(n) + " 0\\n" + " ".join(["0"] * n)`)
  },
  "mock-01-q3#6": {
    cpp: CPP_FEED(`  const int n = 200000; unsigned int x = 20261023u; std::string s = std::to_string(n) + " 3\\n";
  for (int i = 0; i < n; i++) { x = x * 1664525u + 1013904223u; s += "abcde"[(x >> 24) % 5]; }
  s += '\\n';
  return s;`),
    python: PY_FEED(`    n, x, out = 200000, 20261023, []
    for _ in range(n):
        x = (x * 1664525 + 1013904223) & 0xFFFFFFFF
        out.append("abcde"[(x >> 24) % 5])
    return str(n) + " 3\\n" + "".join(out) + "\\n"`)
  }
};

/** Source to prepend so a submission builds its own input, or null. */
export function genSource(key, lang) {
  const g = GEN_SOURCES[key];
  return (g && g[lang]) || null;
}

/** The input for a hidden test: literal when it has one, built when it does
 *  not. Built inputs are cached by the caller, per PRD §3.1 -- a generated
 *  input is rebuilt once per grading request, never once per test case. */
export function buildInput(key) {
  const fn = BUILDERS[key];
  if (!fn) throw new Error(`no ported generator for '${key}'`);
  return fn();
}
