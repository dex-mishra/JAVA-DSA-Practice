/**
 * DSA plan arithmetic shared by the page and the Worker.
 *
 * One copy, because the two must agree to the day: the page decides which
 * row to expand and what "behind by N" says, the Worker decides when to stamp
 * `first_done_at` and (from slice two) when a nudge is due. Two copies of
 * "what is today in IST" would disagree at 00:10 one night and nobody would
 * find out until a re-solve came due a day early.
 *
 * The Worker imports this as a module. tools/build.mjs inlines it into the
 * page as `DSA_CORE`, stripping the `export` keywords -- so it must stay
 * dependency-free plain functions and constants, no imports.
 *
 * Every date is an ISO calendar date (YYYY-MM-DD) in Asia/Kolkata. IST has
 * no daylight saving, so a fixed +05:30 offset is exact.
 */

export const IST_OFFSET_MS = 330 * 60 * 1000;

/** The IST calendar date at an instant. */
export function istDate(ms) {
  const t = ms === undefined ? Date.now() : ms;
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since IST midnight at an instant -- what the cron compares
 *  against 09:00, 11:00 and so on. */
export function istMinutes(ms) {
  const t = ms === undefined ? Date.now() : ms;
  const d = new Date(t + IST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Epoch ms of HH:MM IST on an ISO date. */
export function istInstant(iso, hhmm) {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return Date.parse(iso + "T00:00:00Z") + (h * 60 + m) * 60000 - IST_OFFSET_MS;
}

/** Calendar arithmetic on ISO dates, in UTC so the host timezone is irrelevant. */
export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

/** Plan day for a date: 1 on start_date. Unclamped -- 0 or less is before
 *  the plan, more than the day count is after it, and the caller decides
 *  what each of those shows. */
export function planDay(startDate, iso) {
  return daysBetween(startDate, iso) + 1;
}

/** Statuses that mean the problem has been worked. `skimmed` counts: it is
 *  the cut-order close of a TWIST, and it is not "still to do". */
export function isDone(status) {
  return status === "solved" || status === "revisit" || status === "skimmed";
}

/* Cold re-solves at +2, +7 and +14 days from the first solve (PRD §8.2).
   A shaky re-solve (confidence 3 or below) does not advance the ladder's
   dates: the next one comes back in two days instead. */
export const RESOLVE_OFFSETS = [2, 7, 14];

/** The re-solve date to schedule after `stage` re-solves are done. */
export function nextResolveOn(firstDoneAt, stage) {
  if (!firstDoneAt || stage >= RESOLVE_OFFSETS.length) return null;
  return addDays(firstDoneAt, RESOLVE_OFFSETS[stage]);
}

/** State after one cold re-solve, rated `confidence` 1..5, done on `today`. */
export function afterResolve(row, confidence, today) {
  const stage = Math.min(RESOLVE_OFFSETS.length, (row.resolve_stage || 0) + 1);
  let next = nextResolveOn(row.first_done_at, stage);
  if (next && confidence !== null && confidence !== undefined && confidence <= 3) next = addDays(today, 2);
  // A date already in the past (a re-solve done very late) comes due tomorrow,
  // not today again.
  if (next && next <= today) next = addDays(today, 1);
  return { resolve_stage: stage, next_resolve_on: next };
}
