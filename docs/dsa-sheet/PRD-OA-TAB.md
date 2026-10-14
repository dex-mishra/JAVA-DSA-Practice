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
  hidden_tests  JSONB NOT NULL,          -- [{input, output, marks}]
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

The honest options, in order of preference:

1. **Judge0** — self-hostable or hosted API. Takes source, language id, stdin; returns stdout,
   stderr, exit code, time, memory. Supports C++17. This is what to use.
2. **Piston** — lighter, self-hosted, no auth. Fine for single-user.
3. **Local `g++` in a sandboxed child process** — simplest if the app already runs on your own
   machine. Requires a hard timeout, a memory cap, and no network for the compiled binary.

Grading is per test case: compile once, run against each hidden test, award that test's marks on an
exact stdout match after trimming trailing whitespace. Report compile errors as 0 with the message
shown — exactly as HackerRank does.

**Do not build your own sandbox.** Running arbitrary submitted C++ with no isolation on a machine
holding your placement data is not a trade worth making, even single-user.

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
2. Judge0 (or Piston) integration with a `run(source, lang, stdin)` wrapper and a hard timeout
3. Seed Mock 01 (provided — covers days 1–3)
4. The assessment screen: timer, tabs, statement pane, editor, run against samples
5. Submit and grade against hidden tests
6. Finish, score, and the review screen
7. Write failed patterns back to `dsa_progress` as confidence 2 + revision true
8. History with per-pattern accuracy over time
