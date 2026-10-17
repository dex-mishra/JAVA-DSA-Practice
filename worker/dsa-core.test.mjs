/**
 * The shared plan arithmetic. The cases that matter are the ones around IST
 * midnight, where a UTC date and an IST date disagree for five and a half
 * hours every night.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  istDate, istMinutes, istInstant, addDays, daysBetween, planDay, isDone,
  nextResolveOn, afterResolve
} from "../shared/dsa-core.mjs";

test("IST date across midnight", () => {
  // 18:29 UTC on the 17th is 23:59 IST on the 17th; a minute later it is the 18th.
  assert.equal(istDate(Date.parse("2026-10-17T18:29:00Z")), "2026-10-17");
  assert.equal(istDate(Date.parse("2026-10-17T18:30:00Z")), "2026-10-18");
  // 00:10 IST on the 18th is still the 17th in UTC.
  assert.equal(istDate(Date.parse("2026-10-17T18:40:00Z")), "2026-10-18");
});

test("IST minutes and instants round-trip", () => {
  const t = istInstant("2026-10-18", "09:00");
  assert.equal(new Date(t).toISOString(), "2026-10-18T03:30:00.000Z");
  assert.equal(istMinutes(t), 9 * 60);
  assert.equal(istDate(istInstant("2026-10-18", "23:45")), "2026-10-18");
});

test("calendar arithmetic", () => {
  assert.equal(addDays("2026-10-18", 2), "2026-10-20");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(daysBetween("2026-10-18", "2026-11-16"), 29);
});

test("plan day is 1 on the start date and unclamped either side", () => {
  assert.equal(planDay("2026-10-18", "2026-10-18"), 1);
  assert.equal(planDay("2026-10-18", "2026-11-16"), 30);
  assert.equal(planDay("2026-10-18", "2026-10-17"), 0);
  assert.equal(planDay("2026-10-18", "2026-11-17"), 31);
});

test("skimmed counts as done, todo does not", () => {
  assert.ok(isDone("solved") && isDone("revisit") && isDone("skimmed"));
  assert.ok(!isDone("todo") && !isDone(undefined));
});

test("re-solve ladder: +2, +7, +14, then nothing", () => {
  assert.equal(nextResolveOn("2026-10-18", 0), "2026-10-20");
  let row = { first_done_at: "2026-10-18", resolve_stage: 0 };
  row = { ...row, ...afterResolve(row, 5, "2026-10-20") };
  assert.deepEqual([row.resolve_stage, row.next_resolve_on], [1, "2026-10-25"]);
  row = { ...row, ...afterResolve(row, 4, "2026-10-25") };
  assert.deepEqual([row.resolve_stage, row.next_resolve_on], [2, "2026-11-01"]);
  row = { ...row, ...afterResolve(row, 5, "2026-11-01") };
  assert.deepEqual([row.resolve_stage, row.next_resolve_on], [3, null]);
});

test("a shaky re-solve comes back in two days", () => {
  const row = { first_done_at: "2026-10-18", resolve_stage: 0 };
  assert.equal(afterResolve(row, 3, "2026-10-20").next_resolve_on, "2026-10-22");
});

test("a late re-solve is never scheduled in the past", () => {
  const row = { first_done_at: "2026-10-18", resolve_stage: 0 };
  // First re-solve done on the 26th: the +7 date (25th) has passed already.
  assert.equal(afterResolve(row, 5, "2026-10-26").next_resolve_on, "2026-10-27");
});
