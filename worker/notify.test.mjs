/**
 * The cron, a day at a time, against real SQL. The two acceptance checks
 * from PRD §17 are here verbatim: a forced run at 11:00 on Day 1 sends
 * exactly one nudge naming Max Consecutive Ones, and at 08:45 on 23 Oct the
 * mock email is sent once.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeD1 } from "./d1-shim.mjs";
import { istInstant } from "../shared/dsa-core.mjs";
import { tick } from "./notify.js";
import { patchDsaProgress, patchDay, patchDrill } from "./store.js";
import { PLAN } from "./schedule.js";

const at = (iso, hhmm) => istInstant(iso, hhmm);

function harness() {
  const sent = [];
  const env = { DB: makeD1(), CONSOLE_URL: "https://console.example", RESEND_API_KEY: "k", NOTIFY_TO: "me@example.com" };
  const send = async (_env, msg) => { sent.push(msg); return { ok: true }; };
  return { env, sent, run: (now) => tick(env, now, { send, rand: () => 0.5 }) };
}

test("Day 1, 11:00, Running Sum done: exactly one nudge, naming Max Consecutive Ones", async () => {
  const h = harness();
  await patchDsaProgress(h.env.DB, "running-sum-of-1d-array", { status: "solved" }, { now: at("2026-10-18", "10:30") });
  await h.run(at("2026-10-18", "11:00"));
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0].subject, /^DSA Day 1 · next: Max Consecutive Ones$/);
  assert.match(h.sent[0].html, /#dsa\/problem\/max-consecutive-ones/);

  // The same slot again (a retried cron): nothing.
  await h.run(at("2026-10-18", "11:05"));
  // Between slots: nothing.
  await h.run(at("2026-10-18", "11:30"));
  assert.equal(h.sent.length, 1);
});

test("Day 1, 09:00, nothing done: the nudge names the first problem", async () => {
  const h = harness();
  await h.run(at("2026-10-18", "09:00"));
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0].subject, /next: Running Sum of 1d Array/);
});

test("before the plan starts, nothing is sent", async () => {
  const h = harness();
  await h.run(at("2026-10-17", "09:00"));
  await h.run(at("2026-10-17", "21:00"));
  assert.equal(h.sent.length, 0);
});

test("a complete day stops the nudges", async () => {
  const h = harness();
  const db = h.env.DB;
  const now = at("2026-10-18", "10:00");
  for (const p of PLAN.days[0].problems) await patchDsaProgress(db, p.id, { status: "solved" }, { now });
  for (const id of PLAN.days[0].drill) await patchDrill(db, id, { day: 1, correct: true }, { now });
  await patchDay(db, 1, { cs_core_done: true }, { now });
  await h.run(at("2026-10-18", "11:00"));
  assert.equal(h.sent.length, 0);
});

test("21:00: the miss mail when the floor is not met, and not when it is", async () => {
  const h = harness();
  await h.run(at("2026-10-18", "21:00"));
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0].subject, /floor not met: Running Sum of 1d Array/);

  const k = harness();
  await patchDsaProgress(k.env.DB, "running-sum-of-1d-array", { status: "solved" }, { now: at("2026-10-18", "20:00") });
  await k.run(at("2026-10-18", "21:00"));
  assert.equal(k.sent.length, 0);
  const kept = await k.env.DB.prepare("SELECT kept FROM dsa_day WHERE day = 1").first();
  assert.equal(kept.kept, 1, "the cron keeps a day whose floor was met");
});

test("23 Oct 08:45: the mock email once, with the time, the window and an .ics", async () => {
  const h = harness();
  await h.run(at("2026-10-23", "08:45"));
  const mail = h.sent.filter((m) => /Mock 01/.test(m.subject));
  assert.equal(mail.length, 1);
  // rand 0.5 over 33 slots -> slot 16 -> 13:00.
  assert.match(mail[0].subject, /^Mock 01 unlocks at 13:00 today · start by 16:00$/);
  assert.equal(mail[0].attachments[0].filename, "mock-01.ics");
  assert.match(atob(mail[0].attachments[0].content), /DTSTART:20261023T073000Z/);

  await h.run(at("2026-10-23", "09:00"));
  assert.equal(h.sent.filter((m) => /unlocks at/.test(m.subject)).length, 1, "never twice");
});

test("mock day: the DISGUISE problem moves to the revision queue", async () => {
  const h = harness();
  await h.run(at("2026-10-23", "08:45"));
  const day6 = PLAN.days[5].problems;
  const cut = day6.find((p) => p.role === "DISGUISE") || day6[day6.length - 1];
  const row = await h.env.DB.prepare("SELECT cut_state, next_resolve_on, status FROM dsa_progress WHERE problem_id = ?").bind(cut.id).first();
  assert.deepEqual({ ...row }, { cut_state: "queued", next_resolve_on: "2026-10-25", status: "todo" });
});

test("at the unlock: 'it is open' once, while not started", async () => {
  const h = harness();
  await h.run(at("2026-10-23", "08:45"));
  await h.run(at("2026-10-23", "13:00"));
  await h.run(at("2026-10-23", "13:15"));
  assert.equal(h.sent.filter((m) => /is open/.test(m.subject)).length, 1);
});

test("a failed send is released and retried; an unconfigured run sends nothing and fails nothing", async () => {
  const env = { DB: makeD1() };
  let calls = 0;
  const failing = async () => { calls++; return { ok: false, status: 500 }; };
  await tick(env, at("2026-10-23", "08:45"), { send: failing, rand: () => 0 });
  const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM notify_log").first();
  assert.equal(left.n, 0, "no claim survives a failed send");
  assert.ok(calls >= 1);

  // The real sender with no key: logs, returns, writes nothing.
  const done = await tick(env, at("2026-10-23", "09:00"), { rand: () => 0 });
  assert.ok(done.every((d) => d.sent === false));
});
