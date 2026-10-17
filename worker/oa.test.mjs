/**
 * The OA tab's silent-failure surface.
 *
 * Three things here go wrong without raising anything:
 *   - the output comparator, which decides every mark;
 *   - the projections, which are what keeps the answers off the client;
 *   - the ported input generators, which would grade a correct solution
 *     wrong on exactly the test designed to catch a slow one.
 *
 *   node --test worker/oa.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  normaliseOutput, outputMatches, forAttempt, forReview, forList,
  band, remainingMs, rawRemainingMs, expired, failedPatterns, getMock, allMocks,
  GRACE_MIN
} from "./oa.js";
import { BUILDERS, buildInput } from "./oa-gen.js";
import { runnerStatus } from "./runner.js";

// ---------------------------------------------------------------- comparator

/* PRD §3.1: exact match after stripping trailing whitespace per line and
   overall. No tolerance, no reordering, no numeric fuzzing. Each of these
   is a way a lenient comparator would hand marks to a wrong program. */

test("trailing whitespace and a missing final newline do not change a verdict", () => {
  assert.ok(outputMatches("4\n", "4"));
  assert.ok(outputMatches("4", "4\n\n"));
  assert.ok(outputMatches("1 2\n3 4   \n", "1 2\n3 4"));
  assert.ok(outputMatches("7\r\n", "7"), "a CRLF is trailing whitespace, not a wrong answer");
});

test("the comparator does not reorder, round, or ignore interior spacing", () => {
  assert.ok(!outputMatches("2 1", "1 2"), "reordered output is wrong output");
  assert.ok(!outputMatches("3.0000001", "3"), "no numeric tolerance");
  assert.ok(!outputMatches("1  9", "1 9"), "interior spacing is significant");
  assert.ok(!outputMatches("", "0"), "empty output is not zero");
});

/* The specific case PRD §3.1 calls out: mock 01 Q3 has an ordering test that
   separates numeric order from string order, and says in as many words that
   "a lenient comparator would silently pass a wrong solution". */
test("numeric order and lexicographic order are told apart", () => {
  assert.ok(!outputMatches("1 9\n10\n2 8", "1 9\n2 8\n10"));
});

test("normaliseOutput survives null and undefined", () => {
  assert.equal(normaliseOutput(null), "");
  assert.equal(normaliseOutput(undefined), "");
});

// ---------------------------------------------------------------- projections

const MOCK = getMock("mock-01");

test("mock 01 is bundled and sums to its declared marks", () => {
  assert.ok(MOCK, "mock-01 is not in the bundle");
  const total = MOCK.problems.reduce((n, q) => n + q.marks, 0);
  assert.equal(total, MOCK.total_marks);
  for (const q of MOCK.problems) {
    const hidden = q.hidden.reduce((n, t) => n + t.marks, 0);
    assert.equal(hidden, q.marks, `${q.id}: hidden tests do not sum to the problem's marks`);
    assert.equal(q.samples.reduce((n, s) => n + (s.marks || 0), 0), 0, "samples must be worth nothing");
  }
});

/* The one that matters most. PRD §6 lists what must not appear during an
   attempt; this asserts the payload by serialising the whole thing and
   looking for the answers in it, rather than by checking the fields one at
   a time -- a field added upstream would slip past a field-by-field test. */
test("the attempt payload carries no hidden test, pattern, or review material", () => {
  const sent = JSON.stringify(forAttempt(MOCK));

  for (const q of MOCK.problems) {
    for (const t of q.hidden) {
      if (t.input) {
        assert.ok(!sent.includes(t.input), `${q.id}: a hidden test input reached the client`);
      }
      /* Short outputs are not evidence of a leak and cannot be: Q3's answer
         to an impossible case is the word NONE, which the output format has
         to name, and Q1's answers are single digits that occur all over the
         samples. Only an output long enough to be distinctive says anything,
         and a leak of the real payload would carry those too. */
      if (t.output.length >= 8) {
        assert.ok(!sent.includes(t.output), `${q.id}: a hidden test output reached the client`);
      }
    }
    assert.ok(!sent.includes(q.tests_pattern), `${q.id}: the pattern name reached the client`);
    assert.ok(!sent.includes(q.intended_approach), `${q.id}: the intended approach reached the client`);
    assert.ok(!sent.includes(q.common_wrong_turn), `${q.id}: the wrong turn reached the client`);
    if (q.related) assert.ok(!sent.includes(q.related), `${q.id}: the sheet link reached the client`);
  }
  assert.ok(!sent.includes("gen_key"), "a generator key reached the client");
  assert.ok(!sent.includes("source_day"), "the source day reached the client");
});

test("the attempt payload still carries everything needed to solve", () => {
  const sent = forAttempt(MOCK);
  for (const [i, q] of sent.problems.entries()) {
    assert.ok(q.statement && q.statement.length > 50, `${q.id}: no statement`);
    assert.ok(q.input_format && q.output_format && q.constraints, `${q.id}: missing a format block`);
    assert.ok(q.samples.length >= 1, `${q.id}: no samples to self-check against`);
    for (const s of q.samples) assert.ok(s.input && s.output, `${q.id}: a sample is incomplete`);
    assert.equal(q.hidden_count, MOCK.problems[i].hidden.length);
  }
});

test("the review payload carries what the attempt withheld", () => {
  const review = forReview(MOCK);
  for (const q of review.problems) {
    assert.ok(q.tests_pattern, `${q.id}: review has no pattern`);
    assert.ok(q.intended_approach, `${q.id}: review has no approach`);
    assert.ok(q.common_wrong_turn, `${q.id}: review has no wrong turn`);
    assert.ok(q.source_day >= 1, `${q.id}: review has no source day`);
  }
  // Still not the answers themselves: a test's description, never its data.
  const sent = JSON.stringify(review);
  for (const q of MOCK.problems) {
    for (const t of q.hidden) {
      if (t.input && t.input.length > 8) {
        assert.ok(!sent.includes(t.input), `${q.id}: the review leaked a hidden test input`);
      }
    }
  }
});

test("a mock only draws on days it declares as covered", () => {
  for (const mock of allMocks()) {
    for (const q of mock.problems) {
      assert.ok(mock.covers_days.includes(q.source_day),
        `${mock.id} ${q.id}: source_day ${q.source_day} is outside covers_days`);
    }
    assert.equal(forList(mock).last_covered_day, Math.max(...mock.covers_days));
  }
});

// ---------------------------------------------------------------- generators

/* The import step cross-checks these against the authored builder_js. This
   asserts the cheaper invariant the Worker depends on: every gen_key in the
   bundle has a port, and the ports produce what the content says they do. */
test("every generated hidden test has a ported builder", () => {
  for (const mock of allMocks()) {
    for (const q of mock.problems) {
      for (const t of q.hidden) {
        if (!t.gen_key) continue;
        assert.ok(BUILDERS[t.gen_key], `no ported generator for ${t.gen_key}`);
        const built = buildInput(t.gen_key);
        assert.ok(built.length > 1000, `${t.gen_key} built something implausibly short`);
      }
    }
  }
});

test("the ported generators reproduce their declared shapes", () => {
  const q1 = buildInput("mock-01-q1#6").split("\n");
  assert.equal(q1[0], "499999");
  assert.equal(q1[1].split(" ").length, 499999);

  const q2 = buildInput("mock-01-q2#7").split("\n");
  assert.equal(q2[0], "200000 0");
  assert.equal(q2[1].split(" ").length, 200000);
});

// ---------------------------------------------------------------- scoring

test("the bands match PRD §7's thresholds at their boundaries", () => {
  assert.equal(band(100, 100).key, "strong");
  assert.equal(band(85, 100).key, "strong");
  assert.equal(band(84, 100).key, "implementation");
  assert.equal(band(60, 100).key, "implementation");
  assert.equal(band(59, 100).key, "partial");
  assert.equal(band(35, 100).key, "partial");
  assert.equal(band(34, 100).key, "not-yet");
  assert.equal(band(0, 100).key, "not-yet");
});

test("a zero-mark mock does not divide by zero", () => {
  assert.equal(band(0, 0).key, "not-yet");
});

// ---------------------------------------------------------------- the clock

test("time remaining comes from the server's start time, not the client's", () => {
  const mock = { duration_min: 90 };
  const justStarted = { started_at: Date.now() / 1000 };
  const ms = remainingMs(justStarted, mock);
  assert.ok(ms > 89 * 60_000 && ms <= 90 * 60_000, `got ${ms}`);
  assert.ok(!expired(justStarted, mock));

  const old = { started_at: Date.now() / 1000 - 91 * 60 };
  assert.equal(remainingMs(old, mock), 0, "a finished clock never goes negative");
  assert.ok(expired(old, mock));
});

// ---------------------------------------------------------------- write-back

test("only attempted problems that fell short reach the revision queue", () => {
  const mock = {
    problems: [
      { id: "q1", marks: 25, tests_pattern: "p-one", related: "sheet-one" },
      { id: "q2", marks: 35, tests_pattern: "p-two", related: "sheet-two" },
      { id: "q3", marks: 40, tests_pattern: "p-three", related: "sheet-three" }
    ]
  };
  const failed = failedPatterns(mock, {
    q1: { submitted: true, marks: 25 },   // full marks: not a weakness
    q2: { submitted: true, marks: 10 },   // attempted and short: the real case
    q3: { submitted: false, marks: 0 }    // never opened: no evidence either way
  });
  assert.deepEqual(failed.map((f) => f.problem_id), ["sheet-two"]);
  assert.equal(failed[0].pattern, "p-two");
});

test("a problem with no sheet link is left out rather than written nowhere", () => {
  const mock = { problems: [{ id: "q1", marks: 25, tests_pattern: "p", related: "" }] };
  assert.deepEqual(failedPatterns(mock, { q1: { submitted: true, marks: 0 } }), []);
});

// ---------------------------------------------------------------- runner

test("an unconfigured runner explains itself instead of throwing", () => {
  const status = runnerStatus({});
  assert.equal(status.ready, false);
  assert.equal(status.backend, "none");
  assert.match(status.reason, /ONLINECOMPILER_KEY/);
});

test("a configured backend is reported as ready", () => {
  assert.equal(runnerStatus({ JUDGE0_KEY: "x" }).backend, "judge0");
  assert.equal(runnerStatus({ PISTON_URL: "https://piston.example/api/v2/piston" }).backend, "piston");
  // A self-hosted Piston wins, because setting it is the deliberate act.
  assert.equal(runnerStatus({ JUDGE0_KEY: "x", PISTON_URL: "https://p/api" }).backend, "piston");
  // OnlineCompiler.io is the free default once its key exists.
  assert.equal(runnerStatus({ ONLINECOMPILER_KEY: "k", JUDGE0_KEY: "x" }).backend, "onlinecompiler");
});

// ---------------------------------------------------------------- the CDN

/* The whole reason OA content is bundled rather than built into public/.
   This is the assertion that would catch someone later "tidying up" by
   routing oa-content.json through the static pipeline with everything else:
   the tab would keep working, and the assessment would be worthless. */
test("no OA content is reachable as a static asset", async () => {
  const { existsSync, readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = new URL("../public", import.meta.url).pathname;
  if (!existsSync(root)) return;   // nothing built yet; the deploy builds first

  const needles = [];
  for (const mock of allMocks()) {
    for (const q of mock.problems) {
      needles.push(q.intended_approach, q.common_wrong_turn);
      for (const t of q.hidden) if (t.input && t.input.length >= 8) needles.push(t.input);
    }
  }

  const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    for (const needle of needles) {
      assert.ok(!text.includes(needle),
        `${file.replace(root, "public")} carries OA content that must not be public`);
    }
  }
});

test("a late submission can actually be told apart from an on-time one", () => {
  const mock = { duration_min: 90 };
  const justOver = { started_at: Date.now() / 1000 - 90 * 60 - 30 };   // 30s past
  const longOver = { started_at: Date.now() / 1000 - 180 * 60 };       // 90 min past

  /* remainingMs floors at zero for the display, so the submit route cannot
     use it to measure lateness -- it would read both of these as 0 and let
     a submission through a day later. rawRemainingMs is what the grace
     window is measured against. */
  assert.equal(remainingMs(justOver, mock), 0);
  assert.equal(remainingMs(longOver, mock), 0);
  assert.ok(rawRemainingMs(justOver, mock) < 0 && rawRemainingMs(justOver, mock) > -GRACE_MIN * 60_000,
    "a submission seconds late is inside the grace window");
  assert.ok(rawRemainingMs(longOver, mock) < -GRACE_MIN * 60_000,
    "a submission an hour late is outside it");
});
