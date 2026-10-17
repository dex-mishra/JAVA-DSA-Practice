# PRD — the OAs tab

A sub-tab inside the DSA tab. Timed mock online assessments built only from concepts already
covered, so a mock is a **diagnostic on what you have studied**, never a test of what you have not.

---

## 1. Why this exists

The sheet tells you whether you can solve a problem when you know which pattern it is. An OA does
not tell you. Campus assessments wrap a known pattern in an unfamiliar story, give you 90 minutes
for three problems, and never say which topic they came from.

That gap — pattern recognition under time pressure, with no label — is what the sheet cannot train
and what this tab is for.

**The rule that makes it a diagnostic rather than a demoralisation:** a mock may only use patterns
from days you have marked complete. Nothing else.

---

## 2. Scope of a mock

| | Value |
|---|---|
| Duration | 90 minutes, hard stop |
| Problems | 3 — one easy/medium, two medium, occasionally one medium/hard |
| Scoring | weighted by problem, partial credit per test case |
| Source concepts | only patterns from completed days |
| Statements | **original**, story-wrapped, never a LeetCode copy-paste |
| Navigation | free between problems; a submitted problem locks |
| Environment | single screen, no external tabs expected, no hints |

**Why original statements.** If the mock reuses a LeetCode title you have already solved, it tests
recall rather than recognition. Every problem is rewritten as a plausible company scenario with
different variable names, different constraints, and no clue which pattern applies.

**Constraints carry the signal.** Companies set `n` deliberately. A mock must do the same — `n ≤ 10⁵`
with negative values present is how you communicate "prefix sums, not a sliding window" without
saying it. Getting the constraints right is more important than the story.

---

## 3. Data model

Three new tables. Content tables regenerate; attempt tables are user state.

```sql
CREATE TABLE oa_mock (
  id            TEXT PRIMARY KEY,        -- 'mock-01'
  title         TEXT NOT NULL,
  covers_days   INT[] NOT NULL,          -- [1,2,3]
  duration_min  INT  NOT NULL,           -- 90
  total_marks   INT  NOT NULL,
  difficulty    TEXT NOT NULL,           -- 'campus-standard'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE oa_problem (
  id            TEXT PRIMARY KEY,        -- 'mock-01-q2'
  mock_id       TEXT REFERENCES oa_mock(id),
  ord           INT  NOT NULL,           -- 1..3
  title         TEXT NOT NULL,
  marks         INT  NOT NULL,
  difficulty    TEXT NOT NULL,
  statement_md  TEXT NOT NULL,
  input_format  TEXT NOT NULL,
  output_format TEXT NOT NULL,
  constraints   TEXT NOT NULL,
  samples       JSONB NOT NULL,          -- [{input, output, explanation}]
  hidden_tests  JSONB NOT NULL,          -- [{desc, marks, input?, gen?, output}]  see 3.1
  -- the review payload, revealed only after submit or timeout
  tests_pattern TEXT NOT NULL,           -- the dsa_problem.pattern it diagnoses
  source_day    INT  NOT NULL,
  intended_approach TEXT NOT NULL,
  intended_complexity TEXT NOT NULL,
  common_wrong_turn TEXT NOT NULL,
  related_problem_id TEXT REFERENCES dsa_problem(id)
);

CREATE TABLE oa_attempt (
  id            BIGSERIAL PRIMARY KEY,
  mock_id       TEXT REFERENCES oa_mock(id),
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  score         INT,
  per_problem   JSONB,                   -- {problem_id: {code, lang, passed, total, marks, minutes}}
  notes         TEXT NOT NULL DEFAULT ''
);
```

`hidden_tests` must never reach the client before submission. Serve it only from the grading
endpoint.

### 3.1 Hidden-test shape

Each entry carries `desc`, `marks`, `output`, and **either** `input` **or** `gen`:

```json
{ "desc": "majority at the very end of the log", "marks": 3,
  "input": "9\n1 2 3 4 8 8 8 8 8", "output": "8" }

{ "desc": "n ~ 5*10^5, performance", "marks": 6, "output": "7",
  "gen": { "kind": "formula", "n": 499999,
           "spec": "first line: 499999. second line: a[i] = 7 when i is even, otherwise (i % 5) + 1.",
           "builder_js": "function build(){...return n+'\\n'+a.join(' ');}" } }
```

`gen` exists only for the two performance tests, whose inputs are 1.0 MB and 0.5 MB of digits —
inlining them would add 1.45 MB to a file that is otherwise 150 KB. Rules:

- `output` is **always** present and is authoritative. It was computed from a verified reference
  implementation, not from the generator.
- `builder_js` is a complete pure function returning the input string. **Copy it into the grader as
  source; never `eval` it at request time.** It is trusted content from the sheet, but a code path
  that evaluates strings from the content store is a path an attacker only has to reach once.
- `spec` states the same recipe in prose so it can be reimplemented in C++, Python or anything else
  if the grader is not JavaScript. The two must agree; they were cross-verified byte for byte.
- Build each generated input once per grading request and cache it. Do not rebuild per test case.

**Comparison rule.** A test is awarded its marks on an exact match of stdout against `output`, after
stripping trailing whitespace from each line and from the output as a whole. No tolerance, no
reordering, no numeric fuzzing. Q3 of mock 01 depends on this: its ordering test distinguishes
numeric lexicographic order (`1 9` before `10`) from string order, and a lenient comparator would
silently pass a wrong solution.

**Samples are worth zero marks.** Every mark lives in the hidden tests. Samples exist only so the
candidate can self-check before spending a submission.

---

## 4. API

```
GET   /api/oa/mocks                       -> available mocks + whether prerequisites are met
POST  /api/oa/attempt                     -> start; returns attempt_id and server-side start time
GET   /api/oa/attempt/:id                 -> problems WITHOUT hidden tests or review payload
POST  /api/oa/attempt/:id/run             -> run against SAMPLE tests only
POST  /api/oa/attempt/:id/submit/:qid     -> grade against hidden tests, lock the problem
POST  /api/oa/attempt/:id/finish          -> end, compute score, release the review payload
GET   /api/oa/attempt/:id/review          -> full review; 403 until finished
GET   /api/oa/history                     -> past attempts with scores and per-pattern accuracy
```

**The timer is server-authoritative.** Store `started_at` server-side and compute remaining time
from it. A client-side timer is trivially paused by closing the laptop, and the whole point is the
pressure.

---

## 5. Code execution

**Decision: Piston first, behind an adapter. Judge0 is the upgrade, not the starting point.**

The whole surface is one function:

```
run({ source, lang, stdin, timeLimitMs, memoryLimitKb })
  -> { stdout, stderr, exitCode, timeMs, compileError? }
```

Write that interface first and put Piston behind it. Piston's public API at `emkc.org` needs no key
and no signup, which means the OAs tab works the day it is built rather than the day an API key
arrives. Its rate limit is a few requests per second — irrelevant for one candidate submitting one
problem at a time, and the per-submission loop should be serial anyway so a slow test cannot
stampede the limiter.

Judge0 via RapidAPI is more reliable and reports memory, which Piston does not. Swap it in behind
the same adapter when either of two things happens: `emkc.org` starts failing or rate-limiting
during a real attempt, or a mock needs a memory limit enforced rather than stated. Do not take the
signup cost up front for a tool with one user.

Three things the adapter must handle regardless of backend:

- **A hard wall-clock timeout** per test, independent of whatever the backend promises. A hung
  submission must not hang the attempt.
- **Compile once, run many.** Piston compiles per request, so cache nothing but accept the cost;
  with Judge0, submit the compiled artefact where the API allows it.
- **Serial test execution with early exit on compile error.** Report a compile error as 0 marks with
  the compiler message shown verbatim, exactly as HackerRank does. Do not silently score it as a
  wrong answer.

**Do not build your own sandbox.** Running arbitrary submitted C++ with no isolation on a machine
holding your placement data is not a trade worth making, even single-user. A Cloudflare Worker
cannot run `g++` at all, which removes the temptation — treat that as a feature.

### 5.1 Where OA content lives

**Decision: bundle OA content into the Worker. Do not put it on the CDN with the sheet content.**

The DSA sheet's phase JSONs are static files because they are meant to be read by the client. OA
content is the opposite: §3 requires that `hidden_tests` never reach the client before submission,
and anything in `public/` is world-readable by definition. One curl of the mock's JSON and the
assessment is worthless.

So the departure from how the rest of the content is served is deliberate and correct:

- The mock's statements, samples, constraints and marks may be served to the client on attempt start.
- `hidden_tests`, `intended_approach`, `intended_complexity`, `common_wrong_turn` and `related` are
  served **only** from `/submit` and `/review`, and `/review` 403s until the attempt is finished.
- The content lives in the Worker bundle (or in the database, if the Worker already talks to one),
  never in `public/`.

A single mock is ~150 KB, so bundling is cheap; the generated performance inputs are built at
request time, which is most of why `gen` exists.

---

## 6. Interface

Modelled on the HackerRank assessment screen, because that is what campus OAs actually use and
familiarity is part of the training.

**Top bar, fixed:** mock title · problem tabs (Q1 Q2 Q3, with a tick once submitted) · marks
counter · **countdown timer**, turning amber under 15 minutes and red under 5.

**Left pane, ~45%:** problem statement, input format, output format, constraints, sample cases with
explanations. Scrollable, independent of the editor.

**Right pane, ~55%:** language selector (C++17 default), code editor with syntax highlighting, line
numbers and a monospace font. Persist the buffer per problem to local storage on every change so a
refresh never loses work.

**Bottom strip:** `Run Code` (samples only) · `Submit` (hidden tests, locks the problem) · a results
table showing each test as passed, failed or errored with runtime.

**On finish:** a review screen per problem showing your code, tests passed, the pattern it was
diagnosing, the intended approach and complexity, the common wrong turn, and a link to the sheet
problem that teaches it.

**What must NOT appear during the attempt:** the pattern name, the topic, the source day, any hint,
any link to the sheet. All of it is in the review payload and all of it stays server-side until
`finish`.

---

## 7. Scoring and what to do with the result

Weighted by problem, partial credit per test case. A typical 100-mark split is 25 / 35 / 40.

**Interpretation bands** — the point is the action, not the number:

| Score | Reading | Action |
|---|---|---|
| 85–100 | Pattern recognition is working under pressure | Move on; take the next mock after the next 3 days |
| 60–84 | Recognised the patterns, lost time on implementation | Redo the two slowest problems from the sheet, cold |
| 35–59 | Recognised one or two, missed the rest | Reread those patterns' theory Part 2, then redo their sheet problems |
| < 35 | Recognition is not there yet | Do not take another mock. Go back to the days this covered |

**Feed the per-pattern accuracy back into the sheet.** When a mock problem diagnosing
`prefix-sum-hashmap` fails, set that sheet problem's `confidence` to 2 and `revision` to true. The
mock then drives the revision queue automatically, which is the whole reason to store
`tests_pattern`.

---

## 8. Generating future mocks

Mocks are authored, not generated at runtime. The process:

1. Pick a day range the user has completed.
2. Pull the distinct `pattern` values from the sheet for those days.
3. Choose three, weighted toward the ones with low `confidence` scores.
4. Write original statements wrapping those patterns in unrelated scenarios.
5. Set constraints that signal the intended complexity without naming it.
6. Write 8–12 hidden tests per problem, including the edge cases from the sheet problem's
   `edge_cases` array — those are already the right ones.
7. Fill the review payload from the sheet problem's `learnings`.

Step 6 is the shortcut worth noticing: the sheet already records which edge cases bite for every
pattern, so the hidden tests write themselves.

---

## 9. Build order

1. `oa_mock`, `oa_problem`, `oa_attempt` migrations
2. The `run()` adapter from §5, with Piston behind it and a hard timeout
3. Seed Mock 01 (provided — covers days 1–3)
4. The assessment screen: timer, tabs, statement pane, editor, run against samples
5. Submit and grade against hidden tests
6. Finish, score, and the review screen
7. Write failed patterns back to `dsa_progress` as confidence 2 + revision true
8. History with per-pattern accuracy over time
