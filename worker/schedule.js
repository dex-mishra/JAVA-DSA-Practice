/**
 * The mock schedule at runtime (PRD-v3 §10).
 *
 * The dates are content (MOCK-SCHEDULE.json, bundled as dsa-plan.json) and
 * never change. What happens on the day is state, kept in `oa_schedule`:
 * the unlock instant, drawn once at 08:45 IST, and the scored attempt.
 * Everything else -- revealed, unlocked, missed -- is derived from those two
 * and the clock by `mockState` in shared/dsa-core.mjs, so the cron, the API
 * and the page cannot disagree about what state a mock is in.
 */

import PLAN from "./dsa-plan.json" with { type: "json" };
import {
  istDate, planDay, addDays, mockState, mockRevealAt, mockWindowCloses, drawUnlock, mockDayCut
} from "../shared/dsa-core.mjs";

export const MOCKS = PLAN.mocks || [];
export const RULES = PLAN.rules || {};
export { PLAN };

export function scheduledMock(id) {
  return MOCKS.find((m) => m.id === id) || null;
}

/** Uniform in [0, 1) from the platform CSPRNG. The unlock time is the one
 *  thing in this system that must not be guessable in advance. */
export function cryptoRand() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
}

async function readRow(db, id) {
  return db.prepare("SELECT * FROM oa_schedule WHERE mock_id = ?").bind(id).first();
}

/**
 * Draw the unlock time if it is due and not drawn yet. Idempotent and safe
 * to race: the draw is written with COALESCE, so whichever of two concurrent
 * callers lands second keeps the first one's time.
 */
export async function ensureRevealed(db, mock, now, rand = cryptoRand) {
  const row = await readRow(db, mock.id);
  if (row && row.unlock_at) return row;
  if (now < mockRevealAt(mock)) return row || null;
  const unlock = drawUnlock(mock, RULES, rand);
  await db.prepare(
    `INSERT INTO oa_schedule (mock_id, unlock_at, state, updated_at) VALUES (?, ?, 'revealed', ?)
     ON CONFLICT(mock_id) DO UPDATE SET unlock_at = COALESCE(oa_schedule.unlock_at, excluded.unlock_at),
       updated_at = excluded.updated_at`
  ).bind(mock.id, unlock, now / 1000).run();
  return readRow(db, mock.id);
}

async function scoredAttempt(db, row) {
  if (!row || !row.attempt_id) return null;
  return db.prepare("SELECT id, started_at, ended_at, score FROM oa_attempt WHERE id = ?").bind(row.attempt_id).first();
}

/** Unfinished plan problems on the days a mock covers -- the coverage
 *  warning (§10), never a gate. */
export function unfinishedCovered(mock, progress) {
  let n = 0;
  for (const d of PLAN.days) {
    if (!mock.covers_days.includes(d.day)) continue;
    for (const p of d.problems) {
      const status = (progress[p.id] || {}).status || "todo";
      if (status === "todo") n++;
    }
  }
  return n;
}

/** One mock as the API reports it. The unlock time is included only once it
 *  has been revealed -- before 08:45 on the day, not even the server knows it. */
export async function mockStatus(db, mock, now, { progress = null, reveal = true } = {}) {
  const row = reveal ? await ensureRevealed(db, mock, now) : await readRow(db, mock.id);
  const attempt = await scoredAttempt(db, row);
  const state = mockState(mock, RULES, row, attempt, now);

  if (row && row.state !== state) {
    await db.prepare("UPDATE oa_schedule SET state = ?, updated_at = ? WHERE mock_id = ?")
      .bind(state, now / 1000, mock.id).run();
  }

  const revealed = state !== "scheduled" && row && row.unlock_at;
  return {
    id: mock.id,
    day: mock.day,
    date: mock.date,
    weekday: mock.weekday,
    kind: mock.kind,
    duration_min: mock.duration_min,
    covers_days: mock.covers_days,
    content: mock.content,
    state,
    unlock_at: revealed ? row.unlock_at : null,
    window_closes: revealed ? mockWindowCloses(RULES, row.unlock_at) : null,
    attempt_id: attempt ? attempt.id : null,
    score: attempt && attempt.ended_at ? attempt.score : null,
    unfinished: progress ? unfinishedCovered(mock, progress) : null
  };
}

export async function allStatuses(db, now, opts) {
  const out = [];
  for (const m of MOCKS) out.push(await mockStatus(db, m, now, opts));
  return out;
}

/** What a new attempt on this mock would be: scored inside the window,
 *  practice after it (or after the scored one), refused before it. */
export function attemptKind(status) {
  if (!status) return { kind: "practice" };
  if (status.state === "unlocked") return { kind: "scored" };
  if (status.state === "missed" || status.state === "submitted") return { kind: "practice" };
  if (status.state === "started") return { error: "the scored attempt for this mock is already running" };
  return { error: status.unlock_at ? "locked until the unlock time" : "locked until its day -- the unlock time is revealed at 08:45 IST" };
}

export async function linkScoredAttempt(db, mockId, attemptId, now) {
  await db.prepare(
    `INSERT INTO oa_schedule (mock_id, state, attempt_id, updated_at) VALUES (?, 'started', ?, ?)
     ON CONFLICT(mock_id) DO UPDATE SET state = 'started', attempt_id = excluded.attempt_id, updated_at = excluded.updated_at`
  ).bind(mockId, attemptId, now / 1000).run();
}

/**
 * Mock-day load (§8.2): on a mock day the plan asks for three problems, so
 * the DISGUISE one (or the last) goes to the revision queue, due in two
 * days. Only if it is still untouched -- a problem already done, or already
 * cut, is left alone. Returns the problem id moved, or null.
 */
export async function applyMockDayCut(db, mock, now, patchDsaProgress) {
  const today = istDate(now);
  if (mock.date !== today) return null;
  const ctx = { days: PLAN.days };
  const p = mockDayCut(ctx, mock.day);
  if (!p) return null;
  const row = await db.prepare("SELECT status, cut_state FROM dsa_progress WHERE problem_id = ?").bind(p.id).first();
  if (row && (row.status !== "todo" || row.cut_state)) return null;
  await patchDsaProgress(db, p.id, { cut_state: "queued", next_resolve_on: addDays(today, 2) }, { now });
  return p.id;
}

export function planDayOn(now) {
  return planDay(PLAN.start_date, istDate(now));
}
