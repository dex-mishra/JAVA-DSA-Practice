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

/* ------------------------------------------------------------ the day

   What the floor is and what is left to do today, computed from the same
   inputs on both sides: the page paints the header and blocks from it, the
   cron decides from it whether to nudge and what to name. A nudge that says
   "next: Two Sum" while the page shows Two Sum done would be worse than no
   nudge at all.

   `ctx`:
     days      [{ day, date, problems: [{ id, ord, role, title, url, must }],
                  drill: [item ids], cs_core: id|null }]
     progress  { problem id: row }           (dsa_progress, as rowToProgress shapes it)
     siblings  { sibling id: { studied } }
     drill     { item id: { correct } }
     ledger    { day: { kept, cs_core_done, micro_read } }
     today     ISO date (IST), todayN its plan day                         */

function row(ctx, id) {
  return (ctx.progress && ctx.progress[id]) || {};
}

function allProblems(ctx) {
  const out = [];
  for (const d of ctx.days) for (const p of d.problems) out.push({ ...p, day: d.day });
  return out;
}

export function dueResolves(ctx) {
  return allProblems(ctx)
    // A re-solve needs a first solve. A problem the cut order queued carries
    // a next_resolve_on too, but it belongs to Revision's "Queued" list.
    .filter((p) => { const r = row(ctx, p.id); return r.first_done_at && r.next_resolve_on && r.next_resolve_on <= ctx.today; })
    .sort((a, b) => row(ctx, a.id).next_resolve_on.localeCompare(row(ctx, b.id).next_resolve_on) || a.day - b.day || a.ord - b.ord);
}

export function resolvedToday(ctx) {
  return allProblems(ctx).filter((p) => {
    const r = row(ctx, p.id);
    return (r.resolve_stage || 0) > 0 && r.last_revised === ctx.today;
  }).length;
}

/** The day's first LEARN problem -- or, on a day with none (Day 11), its
 *  first problem: every day has one thing that keeps it. */
export function floorProblem(ctx, dayN) {
  const d = ctx.days[dayN - 1];
  if (!d) return null;
  const ps = d.problems.slice().sort((a, b) => a.ord - b.ord);
  return ps.find((p) => p.role === "LEARN") || ps[0] || null;
}

/** Re-solves count as met once none are due or two were done today -- two
 *  is all the block ever shows. */
export function floorStatus(ctx) {
  const resolvesOk = dueResolves(ctx).length === 0 || resolvedToday(ctx) >= 2;
  const first = floorProblem(ctx, ctx.todayN);
  const firstOk = !first || isDone(row(ctx, first.id).status);
  const missing = [];
  if (!resolvesOk) missing.push("re-solves");
  if (!firstOk) missing.push(first.title);
  return { ok: resolvesOk && firstOk, missing, first };
}

/** Everything still to do today, in block order (PRD §11's "one next
 *  action" is the first entry). Empty means the day is complete. */
export function dayAgenda(ctx) {
  const items = [];
  const n = ctx.todayN;
  const d = ctx.days[n - 1];
  if (!d) return items;

  if (resolvedToday(ctx) < 2) {
    for (const p of dueResolves(ctx).slice(0, 2 - Math.min(2, resolvedToday(ctx)))) {
      items.push({ kind: "resolve", id: p.id, title: p.title, url: p.url, day: p.day, role: p.role });
    }
  }

  const all = allProblems(ctx);
  all.filter((p) => {
    const r = row(ctx, p.id);
    return p.must && r.first_done_at && r.first_done_at < ctx.today && !((ctx.siblings || {})[p.must.id] || {}).studied;
  }).sort((a, b) => row(ctx, a.id).first_done_at.localeCompare(row(ctx, b.id).first_done_at) || a.day - b.day)
    .slice(0, 4)
    .forEach((p) => items.push({ kind: "sibling", id: p.must.id, title: p.must.title, parent: p.id, day: p.day }));

  all.filter((p) => {
    const r = row(ctx, p.id);
    return p.day < n && (p.role === "LEARN" || p.role === "APPLY") && (r.status || "todo") === "todo" && !r.cut_state;
  }).sort((a, b) => a.day - b.day || a.ord - b.ord)
    .slice(0, 4)
    .forEach((p) => items.push({ kind: "carried", id: p.id, title: p.title, url: p.url, day: p.day, role: p.role }));

  d.problems.slice().sort((a, b) => a.ord - b.ord).forEach((p) => {
    const r = row(ctx, p.id);
    if ((r.status || "todo") === "todo" && !r.cut_state) {
      items.push({ kind: "problem", id: p.id, title: p.title, url: p.url, day: n, role: p.role });
    }
  });

  const unanswered = (d.drill || []).filter((id) => {
    const g = (ctx.drill || {})[id];
    return !g || g.correct === null || g.correct === undefined;
  });
  if (unanswered.length) items.push({ kind: "drill", id: `drill-${n}`, title: `Recognition drill (${unanswered.length} left)`, day: n });

  if (d.cs_core && !((ctx.ledger || {})[n] || {}).cs_core_done) {
    items.push({ kind: "cs_core", id: d.cs_core, title: "CS core card", day: n });
  }
  return items;
}

/** Which plan problem a mock day moves to the revision queue (PRD §8.2):
 *  the DISGUISE problem, or the last by ord on a day without one. */
export function mockDayCut(ctx, dayN) {
  const d = ctx.days[dayN - 1];
  if (!d || !d.problems.length) return null;
  const ps = d.problems.slice().sort((a, b) => a.ord - b.ord);
  return ps.find((p) => p.role === "DISGUISE") || ps[ps.length - 1];
}

/* ------------------------------------------------------------ mocks

   A mock's runtime state, from the frozen schedule plus one stored draw.
   The unlock time is drawn at 08:45 IST on the day (never earlier, so it
   cannot be known in advance), uniformly from the window in 15-minute steps;
   the mock must be started within `start_window_hours` of unlocking. */

export function mockRevealAt(mock) {
  return istInstant(mock.date, "08:45");
}

/** Draw an unlock instant. `rand` is a function returning [0, 1) -- the
 *  Worker passes one built on crypto.getRandomValues, tests pass a fixed one. */
export function drawUnlock(mock, rules, rand) {
  const [from, to] = (rules && rules.unlock_time_window_ist) || ["09:00", "17:00"];
  const step = ((rules && rules.unlock_time_granularity_min) || 15) * 60000;
  const a = istInstant(mock.date, from);
  const b = istInstant(mock.date, to);
  const slots = Math.floor((b - a) / step) + 1;
  return a + Math.min(slots - 1, Math.floor(rand() * slots)) * step;
}

/** scheduled | revealed | unlocked | started | submitted | missed.
 *  `stored` is the oa_schedule row (or null); `attempt` the scored attempt
 *  it points at (or null). Pure: the caller persists what changed. */
export function mockState(mock, rules, stored, attempt, now) {
  if (attempt) return attempt.ended_at ? "submitted" : "started";
  if (!stored || !stored.unlock_at || now < mockRevealAt(mock)) return "scheduled";
  if (now < stored.unlock_at) return "revealed";
  const windowMs = ((rules && rules.start_window_hours) || 3) * 3600000;
  return now < stored.unlock_at + windowMs ? "unlocked" : "missed";
}

export function mockWindowCloses(rules, unlockAt) {
  return unlockAt + ((rules && rules.start_window_hours) || 3) * 3600000;
}

/** HH:MM in IST, for emails and the OA card. */
export function istClock(ms) {
  const d = new Date(ms + IST_OFFSET_MS);
  return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
}

/* ------------------------------------------------------------ recall

   v3.1 §7: a ✗ comes back in 2 days from stage 0; a ✓ advances the stage
   (+2, +7, +14 days) and retires the item after the third. */
export const RECALL_OFFSETS = [2, 7, 14];

export function recallNext(stage, result, today) {
  if (!result) return { stage: 0, due_on: addDays(today, 2) };
  const next = (stage || 0) + 1;
  return { stage: next, due_on: next > RECALL_OFFSETS.length ? null : addDays(today, RECALL_OFFSETS[next - 1]) };
}
