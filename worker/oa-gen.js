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
  }
};

/** The input for a hidden test: literal when it has one, built when it does
 *  not. Built inputs are cached by the caller, per PRD §3.1 -- a generated
 *  input is rebuilt once per grading request, never once per test case. */
export function buildInput(key) {
  const fn = BUILDERS[key];
  if (!fn) throw new Error(`no ported generator for '${key}'`);
  return fn();
}
