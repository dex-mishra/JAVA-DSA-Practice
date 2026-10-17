/**
 * The cron (PRD-v3 §11): every 15 minutes, decide in IST what is due and
 * send it once.
 *
 *   mock       08:45 on a mock date   the unlock time, the 3-hour window, an .ics
 *   mock-open  at the unlock time     "it is open now", if not started
 *   nudge      09, 11, 13, 15, 17, 19 the one next action, while today is not complete
 *   miss       21:00                  the floor items, if the day was not kept
 *
 * Every send is claimed in `notify_log` under a unique key before it goes
 * out and released if it fails, so a retried or overlapping run never sends
 * twice and a failed one is tried again. Without RESEND_API_KEY / NOTIFY_TO
 * the whole thing runs and logs what it would have sent -- nothing fails.
 *
 * `tick` takes the clock and the sender as arguments so the tests can run a
 * whole day against a real SQLite database in a few milliseconds.
 */

import {
  istDate, istMinutes, istClock, planDay, floorStatus, dayAgenda
} from "../shared/dsa-core.mjs";
import { PLAN, MOCKS, RULES, ensureRevealed, mockStatus, applyMockDayCut, cryptoRand } from "./schedule.js";
import { readDsaProgress, readDsaLedgers, patchDsaProgress, patchDay } from "./store.js";

export const NUDGE_HOURS = [9, 11, 13, 15, 17, 19];
const SLOT_MIN = 15; // the cron interval: each slot is seen by exactly one run

// ---------------------------------------------------------------- sending

export async function sendEmail(env, { subject, html, attachments }) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO) {
    console.log(`[notify] not configured; would send: ${subject}`);
    return { ok: false, skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || "Launch Console <onboarding@resend.dev>",
      to: [env.NOTIFY_TO],
      subject,
      html,
      ...(attachments ? { attachments } : {})
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[notify] Resend ${res.status}: ${text.slice(0, 300)}`);
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

/** Claim a key, send, release on failure. Returns true if this call sent. */
async function once(env, key, now, message, send) {
  const claim = await env.DB.prepare(
    "INSERT INTO notify_log (key, sent_at, detail) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING"
  ).bind(key, now / 1000, message.subject).run();
  if (!claim.meta || !claim.meta.changes) return false;
  let result;
  try {
    result = await send(env, message);
  } catch (e) {
    result = { ok: false, error: e.message };
  }
  if (!result.ok) {
    await env.DB.prepare("DELETE FROM notify_log WHERE key = ?").bind(key).run();
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- content

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function base(env) {
  return String(env.CONSOLE_URL || "").replace(/\/+$/, "");
}

function page(body) {
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#11151b;max-width:560px">${body}` +
    `<p style="color:#737d8c;font-size:12px;margin-top:24px">Launch Console · DSA plan</p></div>`;
}

const KIND_LABEL = {
  resolve: "Cold re-solve", sibling: "Must-study sibling", carried: "Carried over",
  problem: "Today's problem", drill: "Recognition drill", cs_core: "CS core card"
};

function mockLabel(m) {
  return m.kind === "grand" ? "Grand mock" : `Mock ${m.id.replace(/^mock-/, "")}`;
}

export function nudgeMessage(env, dayN, agenda) {
  const next = agenda[0];
  const d = PLAN.days[dayN - 1];
  const url = base(env);
  const rowLink = next.kind === "sibling" ? `${url}/#dsa/problem/${encodeURIComponent(next.parent)}`
    : next.kind === "drill" || next.kind === "cs_core" ? `${url}/#dsa/day/${dayN}`
    : `${url}/#dsa/problem/${encodeURIComponent(next.id)}`;
  const micro = (d.micro_theory || [])[0];
  const rest = agenda.slice(1);
  const html = page(
    `<p style="color:#0d9488;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0">Day ${dayN} · ${esc(d.title)}</p>` +
    `<h2 style="margin:6px 0 4px;font-size:20px">Next: ${esc(next.title)}</h2>` +
    `<p style="margin:0 0 14px;color:#495260">${esc(KIND_LABEL[next.kind])}${next.role ? ` · ${esc(next.role)}` : ""}</p>` +
    `<p><a href="${esc(rowLink)}" style="background:#0d9488;color:#fff;padding:9px 14px;border-radius:5px;text-decoration:none">Open it in the console</a>` +
    (next.url ? ` &nbsp; <a href="${esc(next.url)}">LeetCode</a>` : "") + "</p>" +
    (micro ? `<p style="font-size:13px">Today's theory: <a href="${esc(url)}/#dsa/theory/${esc(micro)}">${esc(micro)}</a></p>` : "") +
    (rest.length ? `<p style="font-size:13px;color:#495260">After that, ${rest.length} more today: ` +
      rest.slice(0, 5).map((i) => esc(i.title)).join(" · ") + (rest.length > 5 ? " …" : "") + "</p>" : "")
  );
  return { subject: `DSA Day ${dayN} · next: ${next.title}`, html };
}

export function missMessage(env, dayN, floor) {
  const html = page(
    `<h2 style="margin:0 0 8px;font-size:19px">Floor not met today</h2>` +
    `<p>Still open: <b>${esc(floor.missing.join(" + "))}</b>.</p>` +
    `<p>Tomorrow starts with these — the floor comes before anything else on a day after a miss.</p>` +
    `<p><a href="${esc(base(env))}/#dsa">Open today</a></p>`
  );
  return { subject: `DSA Day ${dayN} · floor not met: ${floor.missing.join(" + ")}`, html };
}

/** An all-day-free .ics block from the unlock time for the mock's length. */
export function mockIcs(mock, unlockAt) {
  const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Launch Console//DSA mocks//EN", "BEGIN:VEVENT",
    `UID:${mock.id}-${mock.date}@launch-console`, `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(unlockAt)}`, `DTEND:${stamp(unlockAt + mock.duration_min * 60000)}`,
    `SUMMARY:${mockLabel(mock)} (${mock.duration_min} min)`,
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  return { filename: `${mock.id}.ics`, content: btoa(ics) };
}

export function mockMessage(env, mock, status) {
  const opens = istClock(status.unlock_at);
  const closes = istClock(status.window_closes);
  const html = page(
    `<h2 style="margin:0 0 8px;font-size:20px">${esc(mockLabel(mock))} unlocks at ${opens}</h2>` +
    `<p>Start it by <b>${closes}</b> (a ${RULES.start_window_hours || 3}-hour window). ${mock.duration_min} minutes once started; ` +
    "the clock does not stop.</p>" +
    `<p>Covers days ${mock.covers_days[0]}–${mock.covers_days[mock.covers_days.length - 1]}.` +
    (status.unfinished ? ` You have <b>${status.unfinished}</b> unfinished problem${status.unfinished === 1 ? "" : "s"} from those days — ` +
      "take it anyway; it is a diagnostic, not a gate." : "") + "</p>" +
    `<p><a href="${esc(base(env))}/#dsa/oa">Open the OA tab</a></p>`
  );
  return {
    subject: `${mockLabel(mock)} unlocks at ${opens} today · start by ${closes}`,
    html,
    attachments: status.unlock_at ? [mockIcs(mock, status.unlock_at)] : undefined
  };
}

export function mockOpenMessage(env, mock, status) {
  const html = page(
    `<h2 style="margin:0 0 8px;font-size:20px">${esc(mockLabel(mock))} is open now</h2>` +
    `<p>The window closes at <b>${istClock(status.window_closes)}</b>. After that it becomes an unscored practice attempt.</p>` +
    `<p><a href="${esc(base(env))}/#dsa/oa">Start it</a></p>`
  );
  return { subject: `${mockLabel(mock)} is open — window closes at ${istClock(status.window_closes)}`, html };
}

// ---------------------------------------------------------------- the tick

export async function dayContext(db, now) {
  const today = istDate(now);
  const [progress, ledgers] = await Promise.all([readDsaProgress(db), readDsaLedgers(db)]);
  return {
    days: PLAN.days,
    progress: progress.problems,
    siblings: ledgers.siblings,
    drill: ledgers.drill,
    ledger: ledgers.days,
    today,
    todayN: planDay(PLAN.start_date, today)
  };
}

function inSlot(mins, hour, minute = 0) {
  const at = hour * 60 + minute;
  return mins >= at && mins < at + SLOT_MIN;
}

/**
 * One run. Returns what it did, for the logs and the tests:
 * [{ kind, key, sent }].
 */
export async function tick(env, now = Date.now(), { send = sendEmail, rand = cryptoRand } = {}) {
  const db = env.DB;
  const done = [];
  const today = istDate(now);
  const mins = istMinutes(now);

  // Mocks: reveal at 08:45, queue the mock-day problem, mail the time, then
  // "it is open" at the unlock.
  for (const mock of MOCKS) {
    if (mock.date !== today) continue;
    const row = await ensureRevealed(db, mock, now, rand);
    if (!row || !row.unlock_at) continue;
    const moved = await applyMockDayCut(db, mock, now, patchDsaProgress);
    if (moved) done.push({ kind: "mock-day-cut", key: moved, sent: false });

    const progress = (await readDsaProgress(db)).problems;
    const status = await mockStatus(db, mock, now, { progress, reveal: false });
    // The morning mail is only worth sending while there is still something
    // to start: not after the window, not after the attempt.
    if (status.state === "revealed" || status.state === "unlocked") {
      const key = `mock:${mock.id}`;
      done.push({ kind: "mock", key, sent: await once(env, key, now, mockMessage(env, mock, status), send) });
    }

    if (status.state === "unlocked") {
      const k2 = `mock-open:${mock.id}`;
      done.push({ kind: "mock-open", key: k2, sent: await once(env, k2, now, mockOpenMessage(env, mock, status), send) });
    }
  }

  const ctx = await dayContext(db, now);
  const inPlan = ctx.todayN >= 1 && ctx.todayN <= PLAN.days.length;
  if (!inPlan) return done;

  // The day is kept the moment the floor is met; the page writes that, and
  // this catches a day finished on a device that never reopened the tab.
  const floor = floorStatus(ctx);
  if (floor.ok && !(ctx.ledger[ctx.todayN] || {}).kept) {
    await patchDay(db, ctx.todayN, { kept: true }, { now });
  }

  for (const h of NUDGE_HOURS) {
    if (!inSlot(mins, h)) continue;
    const agenda = dayAgenda(ctx);
    if (!agenda.length) break; // today is complete: stop nudging
    const key = `nudge:${today}:${String(h).padStart(2, "0")}`;
    done.push({ kind: "nudge", key, next: agenda[0].title, sent: await once(env, key, now, nudgeMessage(env, ctx.todayN, agenda), send) });
  }

  if (inSlot(mins, 21) && !floor.ok) {
    const key = `miss:${today}`;
    done.push({ kind: "miss", key, sent: await once(env, key, now, missMessage(env, ctx.todayN, floor), send) });
  }

  return done;
}
