/**
 * Code execution, behind one interface.
 *
 * PRD §5 asks for exactly this shape:
 *
 *     run({ source, lang, stdin, timeLimitMs }) -> { stdout, stderr, exitCode, timeMs, compileError? }
 *
 * and for the backend to sit behind it so it can be swapped. The swap
 * happened before the first deploy.
 *
 * The PRD picked Piston first on the grounds that its public API at
 * emkc.org "needs no key and no signup, which means the OAs tab works the
 * day it is built rather than the day an API key arrives". That stopped
 * being true: since 15 February 2026 the public instance answers every
 * request with
 *
 *     Public Piston API is now whitelist only as of 2/15/2026.
 *
 * With both backends behind a signup, the reason to prefer Piston is gone
 * and the PRD's own upgrade path -- "Judge0 is the upgrade" -- is simply
 * where we start. Piston stays implemented below for a self-hosted or
 * whitelisted instance, which is a one-environment-variable switch.
 *
 * What the backend choice does change is the shape of a submission. Judge0
 * CE's free tier allows **50 requests a day**, so a serial loop of one
 * request per hidden test would spend a third of the daily allowance on a
 * single problem. Its batch endpoint takes up to 20 submissions in one
 * request, which maps exactly onto "grade one problem against its hidden
 * tests": three submits and a handful of sample runs per mock, well inside
 * the limit. So `runBatch` is the primary entry point and `run` is the
 * single-case convenience on top of it.
 *
 * Nothing here compiles or executes anything locally. A Cloudflare Worker
 * cannot run g++, which PRD §5 correctly calls a feature.
 */

const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const PISTON_DEFAULT = "https://emkc.org/api/v2/piston";

// Judge0's language ids. C++ (GCC 9.2.0) is 54; Python 3.8.1 is 71.
const JUDGE0_LANG = { cpp: 54, python: 71 };
const PISTON_LANG = {
  cpp: { language: "c++", version: "10.2.0", file: "main.cpp" },
  python: { language: "python", version: "3.10.0", file: "main.py" }
};

export const LANGS = [
  { id: "cpp", label: "C++17", mono: "cpp" },
  { id: "python", label: "Python 3", mono: "python" }
];

export class RunnerError extends Error {
  constructor(message, kind = "backend") {
    super(message);
    this.kind = kind;
  }
}

/** Which backend is configured, and whether it can actually be called.
 *  The tab uses this to explain itself rather than failing at submit time. */
export function runnerStatus(env) {
  if (env.PISTON_URL) {
    return { backend: "piston", ready: true, endpoint: env.PISTON_URL };
  }
  if (env.JUDGE0_KEY) {
    return { backend: "judge0", ready: true, endpoint: `https://${env.JUDGE0_HOST || JUDGE0_HOST}` };
  }
  return {
    backend: "none",
    ready: false,
    reason:
      "No code runner is configured, so problems can be written and saved but not run or graded. " +
      "Judge0's free tier needs a RapidAPI key: subscribe to Judge0 CE (Basic, free), then set it " +
      "with `npx wrangler secret put JUDGE0_KEY`. A self-hosted or whitelisted Piston instance " +
      "works instead — set PISTON_URL to its /api/v2/piston base."
  };
}

/* A wall-clock ceiling of our own, per PRD §5: "A hard wall-clock timeout
   per test, independent of whatever the backend promises. A hung submission
   must not hang the attempt." AbortController is what makes it real --
   without it a backend that never answers holds the request open until the
   Worker itself is killed, and the attempt loses its submission. */
async function postJson(url, payload, headers, timeoutMs) {
  const abort = new AbortController();
  const bell = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(payload),
      signal: abort.signal
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* handled below */ }
    if (!res.ok) {
      const detail = (data && (data.message || data.error)) || text.slice(0, 300);
      throw new RunnerError(`the code runner answered ${res.status}: ${detail}`);
    }
    if (data === null) throw new RunnerError("the code runner returned something that is not JSON");
    return data;
  } catch (err) {
    if (err instanceof RunnerError) throw err;
    if (err.name === "AbortError") throw new RunnerError("the code runner did not answer in time", "timeout");
    throw new RunnerError(`could not reach the code runner: ${err.message}`);
  } finally {
    clearTimeout(bell);
  }
}

// ------------------------------------------------------------------ judge0

/* Judge0 statuses. 3 is Accepted, 6 is Compilation Error, 5 is TLE, 11/12
   are runtime errors. Anything other than 3 still carries whatever the
   program managed to print, which is what the results table shows. */
const J0_COMPILE_ERROR = 6;
const J0_TLE = 5;

const b64encode = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

const b64decode = (s) => {
  if (!s) return "";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

async function judge0Batch(env, cases, { source, lang, timeLimitMs }) {
  const langId = JUDGE0_LANG[lang];
  if (!langId) throw new RunnerError(`unsupported language '${lang}'`, "input");

  const host = env.JUDGE0_HOST || JUDGE0_HOST;
  const headers = {
    "x-rapidapi-key": env.JUDGE0_KEY,
    "x-rapidapi-host": host
  };

  /* Everything base64, in both directions. Submitted code and generated
     inputs both contain characters that do not survive a JSON round trip
     intact otherwise, and a half-megabyte of digits is exactly where a
     silent truncation would hide. */
  const submissions = cases.map((c) => ({
    language_id: langId,
    source_code: b64encode(source),
    stdin: b64encode(c.input),
    cpu_time_limit: Math.max(1, Math.ceil(timeLimitMs / 1000)),
    wall_time_limit: Math.max(2, Math.ceil(timeLimitMs / 1000) + 2)
  }));

  const url = `https://${host}/submissions/batch?base64_encoded=true&wait=true`;
  const data = await postJson(url, { submissions }, headers, timeLimitMs * cases.length + 20_000);

  const rows = Array.isArray(data) ? data : data.submissions;
  if (!Array.isArray(rows)) throw new RunnerError("the code runner returned no results");

  return rows.map((r) => {
    const statusId = r.status && r.status.id;
    const compile = b64decode(r.compile_output);
    return {
      stdout: b64decode(r.stdout),
      stderr: b64decode(r.stderr) || b64decode(r.message),
      exitCode: statusId === 3 ? 0 : 1,
      timeMs: r.time ? Math.round(Number(r.time) * 1000) : null,
      timedOut: statusId === J0_TLE,
      compileError: statusId === J0_COMPILE_ERROR ? (compile || "compilation failed") : null
    };
  });
}

// ------------------------------------------------------------------ piston

/* Serial, deliberately. Piston's limiter is a few requests per second and
   PRD §5 asks for serial execution anyway so that "a slow test cannot
   stampede the limiter". Judge0 gets a real batch; Piston gets a loop with
   an early exit on compile error, which is the same behaviour at a
   different cost. */
async function pistonBatch(env, cases, { source, lang, timeLimitMs }) {
  const spec = PISTON_LANG[lang];
  if (!spec) throw new RunnerError(`unsupported language '${lang}'`, "input");
  const base = String(env.PISTON_URL).replace(/\/+$/, "");

  const out = [];
  for (const c of cases) {
    const data = await postJson(`${base}/execute`, {
      language: spec.language,
      version: spec.version,
      files: [{ name: spec.file, content: source }],
      stdin: c.input,
      compile_timeout: 15_000,
      run_timeout: timeLimitMs
    }, {}, timeLimitMs + 25_000);

    const compile = data.compile || {};
    const run = data.run || {};
    if (compile.code) {
      // Every remaining case would fail the same way; say so once.
      const err = { stdout: "", stderr: "", exitCode: 1, timeMs: null, timedOut: false,
                    compileError: compile.stderr || compile.output || "compilation failed" };
      while (out.length < cases.length) out.push(err);
      return out;
    }
    out.push({
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      exitCode: run.code === 0 ? 0 : 1,
      timeMs: null,
      timedOut: run.signal === "SIGKILL",
      compileError: null
    });
  }
  return out;
}

// ------------------------------------------------------------------ api

/**
 * Run one source against many stdins.
 *
 * `cases` is `[{ input }]`; the result is one row per case in the same
 * order. A compile error comes back on every row, because that is what it
 * is -- PRD §5: "Report a compile error as 0 marks with the compiler
 * message shown verbatim. Do not silently score it as a wrong answer."
 */
export async function runBatch(env, cases, opts) {
  const status = runnerStatus(env);
  if (!status.ready) throw new RunnerError(status.reason, "unconfigured");
  if (!cases.length) return [];

  const options = { timeLimitMs: 5000, ...opts };
  if (status.backend === "piston") return pistonBatch(env, cases, options);
  return judge0Batch(env, cases, options);
}

/** PRD §5's single-case signature, on top of the batch. */
export async function run(env, { source, lang, stdin, timeLimitMs }) {
  const [only] = await runBatch(env, [{ input: stdin || "" }], { source, lang, timeLimitMs });
  return only;
}
