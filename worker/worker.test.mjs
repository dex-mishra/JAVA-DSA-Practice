/**
 * The parts of the Worker that would fail silently.
 *
 * Ported from the Flask console's suite when the API moved to Cloudflare.
 * The selection is deliberate: these are the behaviours where a bug does not
 * raise anything, it just quietly produces a wrong answer that looks fine.
 *
 *   node --test worker/worker.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

import { topicId, curriculum, ratedTopics, rankFor } from "./curriculum.js";
import { cleanTags, tagFault, sameTag, allItems, readCustom, emptyCustom } from "./mba.js";

// ---------------------------------------------------------------- topic ids

/* The page writes progress keyed by these ids and the Worker reads it back.
   If the two implementations of djb2 ever diverge, every tick silently
   orphans: the site keeps working, the API reports zero done, and nothing
   errors anywhere. These three ids were captured from a real browser session
   against the built page and are the anchor for both. */
const KNOWN_BROWSER_IDS = ["1ue32lc", "8pvi1t", "10slz4v"];

test("ids seen in the browser are reproduced here", () => {
  const ids = new Set(curriculum().topics.map((t) => t.id));
  assert.ok(ids.size > 0, "curriculum did not load");
  for (const id of KNOWN_BROWSER_IDS) {
    assert.ok(ids.has(id), `id ${id} seen in the browser is not reproduced by the Worker`);
  }
});

test("topic ids do not collide", () => {
  const ids = curriculum().topics.map((t) => t.id);
  assert.equal(ids.length - new Set(ids).size, 0, "colliding topic ids");
});

test("topic ids have JavaScript's base36 shape", () => {
  for (const t of curriculum().topics.slice(0, 200)) {
    assert.match(t.id, /^[0-9a-z]+$/);
  }
});

test("djb2 stays unsigned across the 32-bit boundary", () => {
  // A long string is what pushes the accumulator past 2^31; a signed shift
  // here would produce a "-" in the base36 output rather than a wrong-but-
  // plausible id, so this is the cheap canary for the >>> 0.
  const long = "sde|Language — C++|".padEnd(400, "x");
  assert.match(topicId(long), /^[0-9a-z]+$/);
});

test("the rated topic count matches what the build ships", () => {
  assert.equal(ratedTopics().length, 1328);
});

test("rankFor walks the ladder, not just the ends", () => {
  assert.equal(rankFor(800).n, "Newbie");
  assert.equal(rankFor(1199).n, "Newbie");
  assert.equal(rankFor(1200).n, "Pupil");
  assert.equal(rankFor(3200).n, "Legendary GM");
});

// ---------------------------------------------------------------- tags

test("tags compare without regard to case", () => {
  assert.ok(sameTag("R1", "r1"));
  assert.ok(sameTag(" Action Required ", "action required"));
  assert.ok(!sameTag("r1", "r2"));
});

/* The old rule was /^[a-z][a-z0-9_-]{0,23}$/, which rejected a capital, a
   space, an ampersand and anything over 23 characters -- so you could not
   add a tag in the style of the ones the curriculum itself ships with. */
test("tags in the style the curriculum already uses are accepted", () => {
  const { kept, rejected } = cleanTags(["Action Required", "R1/R2", "Projected — verify"]);
  assert.deepEqual(rejected, []);
  assert.equal(kept.length, 3);
});

test("a tag is refused for a reason, by name", () => {
  assert.match(tagFault(""), /empty/);
  assert.match(tagFault("x".repeat(41)), /longer than/);
  assert.match(tagFault("—"), /no letters or digits/);
  assert.match(tagFault("a::b"), /separator/);
  assert.equal(tagFault("fine"), "");
});

/* Rejections used to be dropped on the floor: sending two tags stored one,
   discarded the other and answered 200 listing only what stuck. */
test("rejected tags come back named rather than vanishing", () => {
  const { kept, rejected } = cleanTags(["r1", "::bad::"]);
  assert.deepEqual(kept, ["r1"]);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0], /separator/);
});

test("duplicate tags collapse case-insensitively", () => {
  const { kept } = cleanTags(["R1", "r1", " r1 "]);
  assert.deepEqual(kept, ["R1"]);
});

test("control characters are stripped rather than stored", () => {
  const { kept } = cleanTags(["ok\u0007tag"]);
  assert.deepEqual(kept, ["oktag"]);
});

// ---------------------------------------------------------------- overlay

function overlay(patch) {
  return readCustom({ ...emptyCustom(), ...patch });
}

test("a tag added to a curriculum item appears on it", () => {
  const base = allItems(overlay({}));
  const item = base.find((i) => i.source === "curriculum" && i.id);
  const withTag = allItems(overlay({ tag_add: { [item.id]: ["urgent"] } }));
  const after = withTag.find((i) => i.id === item.id);
  assert.ok(after.tags.some((t) => sameTag(t, "urgent")));
});

/* Removing a curriculum item's own tag cannot edit data/mba.json, so it is
   suppressed at read time instead. */
test("a baked-in tag can be suppressed without editing the data file", () => {
  const base = allItems(overlay({}));
  const item = base.find((i) => (i.tags || []).length);
  const victim = item.tags[0];
  const hidden = allItems(overlay({ tag_removed: { [item.id]: [victim] } }));
  const after = hidden.find((i) => i.id === item.id);
  assert.ok(!after.tags.some((t) => sameTag(t, victim)));
});

test("add does not duplicate a tag the item already carries", () => {
  const base = allItems(overlay({}));
  const item = base.find((i) => (i.tags || []).length);
  const existing = item.tags[0];
  const after = allItems(overlay({ tag_add: { [item.id]: [existing.toUpperCase()] } }))
    .find((i) => i.id === item.id);
  assert.equal(after.tags.filter((t) => sameTag(t, existing)).length, 1);
});

test("exclude_over forces the flag either way and marks the item overridden", () => {
  const base = allItems(overlay({}));
  const live = base.find((i) => !i.excluded);
  const hidden = allItems(overlay({ exclude_over: { [live.id]: true } })).find((i) => i.id === live.id);
  assert.equal(hidden.excluded, true);
  assert.equal(hidden.overridden, true);

  const declined = base.find((i) => i.excluded);
  const restored = allItems(overlay({ exclude_over: { [declined.id]: false } })).find((i) => i.id === declined.id);
  assert.equal(restored.excluded, false);
});

test("an item excluded back to false is not silently re-excluded", () => {
  const base = allItems(overlay({}));
  const live = base.find((i) => !i.excluded);
  const after = allItems(overlay({ exclude_over: { [live.id]: false } })).find((i) => i.id === live.id);
  assert.equal(after.excluded, false);
});

test("custom items sit alongside the curriculum and are marked as custom", () => {
  const rows = allItems(overlay({ items: [{ id: "c1", task: "Book GMAT", tags: ["r1"] }] }));
  const mine = rows.find((i) => i.id === "c1");
  assert.equal(mine.source, "custom");
  assert.equal(rows.filter((i) => i.source === "curriculum").length, curriculum().mbaItems.length);
});

test("the MBA item count matches what the build ships", () => {
  assert.equal(curriculum().mbaItems.length, 56);
});

// ---------------------------------------------------------------- shapes

test("readCustom survives a document of the wrong shape", () => {
  // A hand-edited or half-written document should degrade to empty rather
  // than throw on every request afterwards.
  for (const junk of [null, {}, { items: "nope", tag_add: [] }, { tag_removed: 3 }]) {
    const c = readCustom(junk);
    assert.ok(Array.isArray(c.items));
    assert.equal(typeof c.tag_add, "object");
    assert.equal(typeof c.tag_removed, "object");
    assert.equal(typeof c.exclude_over, "object");
  }
});
