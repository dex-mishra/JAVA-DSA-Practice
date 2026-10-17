/**
 * The mock schedule: the draw, the state machine, and the attempt gate as
 * the real route enforces it.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeD1 } from "./d1-shim.mjs";
import { istInstant, istClock, drawUnlock, mockState, mockRevealAt } from "../shared/dsa-core.mjs";
import { MOCKS, RULES, ensureRevealed, mockStatus, scheduledMock } from "./schedule.js";
import worker from "./index.js";

const M1 = scheduledMock("mock-01");
const at = (iso, hhmm) => istInstant(iso, hhmm);

test("the schedule is the frozen one", () => {
  assert.deepEqual(MOCKS.map((m) => m.date),
    ["2026-10-23", "2026-10-28", "2026-10-31", "2026-11-06", "2026-11-09", "2026-11-13", "2026-11-16"]);
  assert.equal(MOCKS[6].duration_min, 120);
});

test("the unlock is drawn inside 09:00–17:00 IST in 15-minute steps", () => {
  assert.equal(istClock(drawUnlock(M1, RULES, () => 0)), "09:00");
  assert.equal(istClock(drawUnlock(M1, RULES, () => 0.999999)), "17:00");
  for (let i = 0; i < 200; i++) {
    const t = drawUnlock(M1, RULES, Math.random);
    assert.ok(t >= at("2026-10-23", "09:00") && t <= at("2026-10-23", "17:00"));
    assert.equal(((t - at("2026-10-23", "09:00")) / 60000) % 15, 0);
  }
});

test("state: scheduled → revealed → unlocked → missed, or started → submitted", () => {
  const row = { unlock_at: at("2026-10-23", "13:00") };
  assert.equal(mockState(M1, RULES, null, null, at("2026-10-23", "08:44")), "scheduled");
  assert.equal(mockState(M1, RULES, row, null, at("2026-10-23", "08:44")), "scheduled");
  assert.equal(mockState(M1, RULES, row, null, at("2026-10-23", "09:00")), "revealed");
  assert.equal(mockState(M1, RULES, row, null, at("2026-10-23", "13:00")), "unlocked");
  assert.equal(mockState(M1, RULES, row, null, at("2026-10-23", "15:59")), "unlocked");
  assert.equal(mockState(M1, RULES, row, null, at("2026-10-23", "16:00")), "missed");
  assert.equal(mockState(M1, RULES, row, { ended_at: null }, at("2026-10-23", "14:00")), "started");
  assert.equal(mockState(M1, RULES, row, { ended_at: 1 }, at("2026-10-23", "14:00")), "submitted");
});

test("the draw happens once, never before 08:45, and a second draw cannot change it", async () => {
  const db = makeD1();
  assert.equal(await ensureRevealed(db, M1, at("2026-10-23", "08:30"), () => 0.5), null);
  const first = await ensureRevealed(db, M1, mockRevealAt(M1), () => 0);
  const again = await ensureRevealed(db, M1, at("2026-10-23", "10:00"), () => 0.99);
  assert.equal(istClock(first.unlock_at), "09:00");
  assert.equal(again.unlock_at, first.unlock_at);
});

test("the unlock time is not reported before it is revealed", async () => {
  const db = makeD1();
  const s = await mockStatus(db, M1, at("2026-10-22", "20:00"));
  assert.equal(s.state, "scheduled");
  assert.equal(s.unlock_at, null);
});

// ---------------------------------------------------------------- the route

function call(env, method, path, body, clockIso) {
  const headers = { "content-type": "application/json" };
  if (clockIso) headers["x-dsa-clock"] = clockIso;
  return worker.fetch(new Request("http://x" + path, { method, headers, body: body ? JSON.stringify(body) : undefined }), env, {})
    .then(async (r) => ({ status: r.status, body: await r.json() }));
}

test("starting: refused before the unlock, scored in the window, practice after", async () => {
  const env = { DB: makeD1(), DSA_FAKE_CLOCK: "1" };
  const iso = (hhmm) => new Date(at("2026-10-23", hhmm)).toISOString();

  let r = await call(env, "POST", "/api/oa/attempt", { mock_id: "mock-01" }, new Date(at("2026-10-22", "12:00")).toISOString());
  assert.equal(r.status, 423);

  // Reveal, then read the drawn time back.
  r = await call(env, "GET", "/api/oa/schedule", null, iso("08:50"));
  const s1 = r.body.schedule.find((m) => m.id === "mock-01");
  assert.equal(s1.state, "revealed");
  const unlock = s1.unlock_at;

  r = await call(env, "POST", "/api/oa/attempt", { mock_id: "mock-01" }, new Date(unlock - 60000).toISOString());
  assert.equal(r.status, 423, "one minute early is still locked");

  r = await call(env, "POST", "/api/oa/attempt", { mock_id: "mock-01" }, new Date(unlock + 60000).toISOString());
  assert.equal(r.status, 200);
  assert.equal(r.body.kind, "scored");
  const scoredId = r.body.attempt_id;

  r = await call(env, "GET", "/api/oa/schedule", null, new Date(unlock + 120000).toISOString());
  assert.equal(r.body.schedule.find((m) => m.id === "mock-01").state, "started");

  await call(env, "POST", `/api/oa/attempt/${scoredId}/finish`, null);
  r = await call(env, "GET", "/api/oa/schedule", null, new Date(unlock + 3600000).toISOString());
  assert.equal(r.body.schedule.find((m) => m.id === "mock-01").state, "submitted");

  r = await call(env, "POST", "/api/oa/attempt", { mock_id: "mock-01" }, new Date(unlock + 3600000).toISOString());
  assert.equal(r.body.kind, "practice", "after the scored attempt, the mock stays available as practice");
});

test("a window that passes without a start is missed, and practice opens", async () => {
  const env = { DB: makeD1(), DSA_FAKE_CLOCK: "1" };
  await call(env, "GET", "/api/oa/schedule", null, new Date(at("2026-10-23", "08:46")).toISOString());
  const r = await call(env, "POST", "/api/oa/attempt", { mock_id: "mock-01" }, new Date(at("2026-10-23", "23:00")).toISOString());
  assert.equal(r.status, 200);
  assert.equal(r.body.kind, "practice");
  const s = await call(env, "GET", "/api/oa/schedule", null, new Date(at("2026-10-23", "23:00")).toISOString());
  assert.equal(s.body.schedule.find((m) => m.id === "mock-01").state, "missed");
});

test("the fake clock header is ignored unless DSA_FAKE_CLOCK is set", async () => {
  const env = { DB: makeD1() };
  const r = await call(env, "GET", "/api/oa/schedule", null, "2026-10-23T05:00:00Z");
  assert.ok(Math.abs(r.body.now - Date.now()) < 5000);
});
