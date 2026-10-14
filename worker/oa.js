/**
 * Mock assessments: content access, grading, scoring.
 *
 * The content is bundled, not served from public/ and not in the database.
 * PRD §5.1: hidden tests must never reach the client before submission, and
 * anything under public/ is world-readable by definition. The projections
 * below are the enforcement -- `forAttempt` is the only shape the browser
 * sees during an attempt, and it is built by naming the safe fields rather
 * than by deleting the unsafe ones, so a field added upstream is invisible
 * by default instead of leaking by default.
 */

import OA_CONTENT from "./oa-content.json" with { type: "json" };
import { buildInput } from "./oa-gen.js";
import { runBatch, RunnerError } from "./runner.js";

const MOCKS = new Map((OA_CONTENT.mocks || []).map((m) => [m.id, m]));

export const MAX_SOURCE = 64 * 1024;
export const GRACE_MIN = 2;   // the timer is not a stopwatch; see finishedAt

export function getMock(id) {
  return MOCKS.get(id) || null;
}

export function allMocks() {
  return [...MOCKS.values()];
}

// ---------------------------------------------------------------- projections

/** The listing. No statements, no tests -- just enough to choose one. */
export function forList(mock) {
  return {
    id: mock.id,
    title: mock.title,
    covers_days: mock.covers_days,
    last_covered_day: mock.last_covered_day,
    duration_min: mock.duration_min,
    total_marks: mock.total_marks,
    difficulty: mock.difficulty,
    problem_count: mock.problems.length
  };
}

/** What the browser gets during an attempt.
 *
 *  PRD §6: "What must NOT appear during the attempt: the pattern name, the
 *  topic, the source day, any hint, any link to the sheet." So this lists
 *  the fields that may be sent instead of removing the ones that may not.
 *  `hidden` becomes a count and the marks per test -- the candidate can see
 *  there are eight tests worth 35 marks without seeing one of them. */
export function forAttempt(mock) {
  return {
    id: mock.id,
    title: mock.title,
    duration_min: mock.duration_min,
    total_marks: mock.total_marks,
    problems: mock.problems.map((q) => ({
      id: q.id,
      ord: q.ord,
      title: q.title,
      marks: q.marks,
      difficulty: q.difficulty,
      statement: q.statement,
      input_format: q.input_format,
      output_format: q.output_format,
      constraints: q.constraints,
      samples: (q.samples || []).map((s) => ({
        input: s.input, output: s.output, explanation: s.explanation || ""
      })),
      hidden_count: (q.hidden || []).length
    }))
  };
}

/** The review payload, which is everything held back above. */
export function forReview(mock) {
  return {
    id: mock.id,
    title: mock.title,
    total_marks: mock.total_marks,
    problems: mock.problems.map((q) => ({
      id: q.id,
      ord: q.ord,
      title: q.title,
      marks: q.marks,
      tests_pattern: q.tests_pattern,
      source_day: q.source_day,
      intended_approach: q.intended_approach,
      intended_complexity: q.intended_complexity,
      common_wrong_turn: q.common_wrong_turn,
      related: q.related,
      hidden: (q.hidden || []).map((t) => ({ desc: t.desc, marks: t.marks }))
    }))
  };
}

// ---------------------------------------------------------------- grading

/**
 * PRD §3.1's comparison rule, exactly:
 *
 *   "an exact match of stdout against `output`, after stripping trailing
 *    whitespace from each line and from the output as a whole. No
 *    tolerance, no reordering, no numeric fuzzing."
 *
 * Q3 of mock 01 depends on the strictness: one of its tests separates
 * numeric order (`1 9` before `10`) from string order, and a lenient
 * comparator would pass a wrong solution silently.
 *
 * Carriage returns are stripped as trailing whitespace, which is what they
 * are -- a CRLF from a Windows-ish runtime is not a wrong answer.
 */
export function normaliseOutput(s) {
  return String(s == null ? "" : s)
    .split("\n")
    .map((line) => line.replace(/[ \t\r\f\v]+$/, ""))
    .join("\n")
    .replace(/\s+$/, "");
}

export function outputMatches(actual, expected) {
  return normaliseOutput(actual) === normaliseOutput(expected);
}

/** A hidden test's stdin: literal, or built from its ported generator.
 *  Built once per grading request and cached, per PRD §3.1 -- the 1 MB case
 *  must not be rebuilt eight times. */
function inputsFor(hidden) {
  const cache = new Map();
  return hidden.map((t) => {
    if (typeof t.input === "string") return t.input;
    if (!cache.has(t.gen_key)) cache.set(t.gen_key, buildInput(t.gen_key));
    return cache.get(t.gen_key);
  });
}

/**
 * Grade one problem against its hidden tests.
 *
 * Returns the per-test rows the results table renders, plus the marks
 * earned. A compile error is zero marks with the compiler's own message,
 * never a wrong answer (PRD §5).
 */
export async function gradeProblem(env, problem, { source, lang }) {
  const hidden = problem.hidden || [];
  const inputs = inputsFor(hidden);

  let rows;
  try {
    rows = await runBatch(env, inputs.map((input) => ({ input })), { source, lang });
  } catch (err) {
    if (err instanceof RunnerError) {
      return {
        ok: false, kind: err.kind, error: err.message,
        marks: 0, passed: 0, total: hidden.length, tests: []
      };
    }
    throw err;
  }

  const compileError = rows.find((r) => r.compileError);
  if (compileError) {
    return {
      ok: true, compile_error: compileError.compileError,
      marks: 0, passed: 0, total: hidden.length,
      tests: hidden.map((t) => ({ desc: t.desc, marks: t.marks, earned: 0, verdict: "compile-error" }))
    };
  }

  let marks = 0;
  let passed = 0;
  const tests = hidden.map((t, i) => {
    const r = rows[i] || {};
    let verdict = "failed";
    if (r.timedOut) verdict = "timed-out";
    else if (r.exitCode !== 0) verdict = "errored";
    else if (outputMatches(r.stdout, t.output)) verdict = "passed";

    const earned = verdict === "passed" ? (Number(t.marks) || 0) : 0;
    marks += earned;
    if (verdict === "passed") passed++;

    return {
      desc: t.desc,
      marks: Number(t.marks) || 0,
      earned,
      verdict,
      time_ms: r.timeMs ?? null,
      /* stderr is shown; stdout is not. Printing what the program produced
         on a hidden test would hand over the expected answer by elimination
         after a couple of submissions. The error stream is a debugging aid
         that does not carry the test's content. */
      stderr: verdict === "errored" || verdict === "timed-out" ? String(r.stderr || "").slice(0, 2000) : ""
    };
  });

  return { ok: true, marks, passed, total: hidden.length, tests };
}

/** Run against the samples, which are worth nothing and show everything.
 *  PRD §3: "Samples exist only so the candidate can self-check before
 *  spending a submission." */
export async function runSamples(env, problem, { source, lang }) {
  const samples = problem.samples || [];
  let rows;
  try {
    rows = await runBatch(env, samples.map((s) => ({ input: s.input })), { source, lang });
  } catch (err) {
    if (err instanceof RunnerError) return { ok: false, kind: err.kind, error: err.message, tests: [] };
    throw err;
  }

  const compileError = rows.find((r) => r.compileError);
  if (compileError) return { ok: true, compile_error: compileError.compileError, tests: [] };

  return {
    ok: true,
    tests: samples.map((s, i) => {
      const r = rows[i] || {};
      return {
        input: s.input,
        expected: s.output,
        got: String(r.stdout || ""),
        stderr: String(r.stderr || "").slice(0, 2000),
        time_ms: r.timeMs ?? null,
        verdict: r.timedOut ? "timed-out"
          : r.exitCode !== 0 ? "errored"
          : outputMatches(r.stdout, s.output) ? "passed" : "failed"
      };
    })
  };
}

// ---------------------------------------------------------------- scoring

/** PRD §7's interpretation bands. The action is the point, not the number. */
export function band(score, total) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 85) {
    return { key: "strong", reading: "Pattern recognition is working under pressure",
             action: "Move on. Take the next mock after the next three days." };
  }
  if (pct >= 60) {
    return { key: "implementation", reading: "Recognised the patterns, lost time on implementation",
             action: "Redo the two slowest problems from the sheet, cold." };
  }
  if (pct >= 35) {
    return { key: "partial", reading: "Recognised one or two, missed the rest",
             action: "Reread those patterns' theory Part 2, then redo their sheet problems." };
  }
  return { key: "not-yet", reading: "Recognition is not there yet",
           action: "Do not take another mock. Go back to the days this covered." };
}

/** Remaining milliseconds, from the server's own clock.
 *
 *  PRD §4: "The timer is server-authoritative. A client-side timer is
 *  trivially paused by closing the laptop, and the whole point is the
 *  pressure." So the browser is told what is left and never trusted to
 *  compute it. */
export function remainingMs(attempt, mock) {
  return Math.max(0, rawRemainingMs(attempt, mock));
}

/** The same figure unclamped, so "how long ago did this run out" is
 *  answerable. `remainingMs` floors at zero because the browser renders it
 *  and a negative countdown is not a thing; the submit route needs the
 *  signed value to tell "one second late" from "yesterday". */
export function rawRemainingMs(attempt, mock) {
  const ends = attempt.started_at * 1000 + mock.duration_min * 60_000;
  return ends - Date.now();
}

export function expired(attempt, mock) {
  return rawRemainingMs(attempt, mock) <= 0;
}

/** Which patterns a finished attempt failed.
 *
 *  PRD §7: "When a mock problem diagnosing `prefix-sum-hashmap` fails, set
 *  that sheet problem's confidence to 2 and revision to true. The mock then
 *  drives the revision queue automatically, which is the whole reason to
 *  store tests_pattern."
 *
 *  Failure is not binary here. A problem that earned every mark is not a
 *  weakness and a problem never opened is not evidence of one, so the
 *  write-back fires on a genuine attempt that fell short: some code
 *  submitted, and less than full marks. */
export function failedPatterns(mock, perProblem) {
  const out = [];
  for (const q of mock.problems) {
    const got = perProblem[q.id];
    if (!got || !got.submitted) continue;
    if ((got.marks || 0) >= q.marks) continue;
    if (!q.related) continue;
    out.push({
      problem_id: q.related,
      pattern: q.tests_pattern,
      marks: got.marks || 0,
      out_of: q.marks,
      oa_problem: q.id
    });
  }
  return out;
}
