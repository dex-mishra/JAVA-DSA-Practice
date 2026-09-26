/**
 * MBA items you add yourself, on top of the fixed curriculum baked in at
 * build time. One document serves a few different needs:
 *
 *   items          whole new commitments.
 *   tag_add        extra tags on ANY item, curriculum or custom.
 *   tag_removed    tags suppressed on ANY item, including ones baked into
 *                  data/mba.json -- removing a curriculum item's own tag
 *                  cannot edit that file, so it is hidden at read time
 *                  instead. Add always wins over a stale remove and vice
 *                  versa: each undoes the other for the same tag, so
 *                  toggling back and forth behaves the way it looks like it
 *                  should rather than accumulating contradictory state.
 *   exclude_over   forces an item's excluded flag either way. This is what
 *                  "delete" means for a curriculum item: it ships with the
 *                  site and returns on the next deploy regardless, so a real
 *                  delete is not on offer. What is on offer is hiding it
 *                  into the EXCLUDED section, reversibly, which is where the
 *                  static "decided against" schools already live.
 */

import { curriculum } from "./curriculum.js";

export const MAX_CUSTOM_MBA = 200;
export const MAX_TAGS_PER_ITEM = 12;
export const MAX_TAG_LEN = 40;

const TAG_CONTROL = /[\x00-\x1f\x7f]/g;
const TAG_HAS_CONTENT = /[0-9A-Za-z]/;
const TAG_SPACE = /\s+/g;
export const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;

export function emptyCustom() {
  return { items: [], tag_add: {}, tag_removed: {}, exclude_over: {} };
}

/** Normalise whatever is stored into the four keys, whatever shape it is in. */
export function readCustom(doc) {
  const dictOf = (k) => (doc && doc[k] && typeof doc[k] === "object" && !Array.isArray(doc[k]) ? doc[k] : {});
  return {
    items: doc && Array.isArray(doc.items) ? doc.items : [],
    tag_add: dictOf("tag_add"),
    tag_removed: dictOf("tag_removed"),
    exclude_over: dictOf("exclude_over")
  };
}

/** Tags compare without regard to case, so adding "R1" to an item that
 *  already has "r1" is a no-op rather than a second pill saying the same
 *  thing -- and removing either one removes it. */
export function sameTag(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/**
 * Why this tag cannot be stored, or "" if it can.
 *
 * A deny-list rather than the narrow allow-list this once had. The old rule
 * was /^[a-z][a-z0-9_-]{0,23}$/, which rejected a capital, a space, an
 * ampersand and anything over 23 characters -- so "Action Required", "R1/R2"
 * and "stanford-gsb-deferred-round-one" were all refused, while the tags the
 * curriculum itself ships with read "Confirmed date" and "Projected —
 * verify". You could not add a tag in the style of the ones already on the
 * page.
 *
 * Everything a tag reaches is escaped at the point of use, so the only hard
 * requirements are that it holds no control characters, carries at least one
 * letter or digit, and does not contain the "::" the site's own delete
 * button uses to pack an id and a tag into one attribute.
 */
export function tagFault(tag) {
  if (!tag) return "it is empty";
  if (tag.length > MAX_TAG_LEN) return `it is longer than ${MAX_TAG_LEN} characters`;
  if (!TAG_HAS_CONTENT.test(tag)) return "it has no letters or digits in it";
  if (tag.includes("::")) return 'it contains "::", which the site uses as a separator';
  return "";
}

/**
 * Returns { kept, rejected }.
 *
 * Rejections used to be dropped on the floor. Sending ["r1", "Action
 * Required"] stored the first, silently discarded the second and answered
 * 200 listing only what stuck -- so an assistant reported success and half
 * the tags never existed. Whatever cannot be stored now comes back by name.
 */
export function cleanTags(raw) {
  if (!Array.isArray(raw)) return { kept: [], rejected: [] };
  const kept = [];
  const rejected = [];
  for (const item of raw) {
    const tag = String(item).replace(TAG_CONTROL, "").replace(TAG_SPACE, " ").trim();
    const fault = tagFault(tag);
    if (fault) {
      rejected.push(`"${String(item).trim().slice(0, 60)}" (${fault})`);
      continue;
    }
    if (kept.some((seen) => sameTag(tag, seen))) continue;
    if (kept.length >= MAX_TAGS_PER_ITEM) {
      rejected.push(`"${tag}" (over the ${MAX_TAGS_PER_ITEM}-tag limit)`);
      continue;
    }
    kept.push(tag);
  }
  return { kept, rejected };
}

/** The message when nothing survived cleaning. Names what was wrong with
 *  each one: "give at least one tag" told you nothing about the tag you had
 *  just given. */
export function refusal(rejected, verb = "store") {
  if (!rejected.length) return `give at least one tag to ${verb}`;
  return `none of those tags could be ${verb === "remove" ? "removed" : "stored"}: ` + rejected.join("; ");
}

/**
 * Curriculum items plus anything added later, with every override applied.
 *
 * The one place both /api/mba (for an assistant) and the site's live splice
 * (for a person) read from, so the two cannot drift apart.
 */
export function allItems(custom) {
  const { tag_add: added, tag_removed: removed, exclude_over: over } = custom;

  const resolve = (item, source) => {
    const id = item.id;
    let tags = [...(item.tags || [])];
    for (const t of added[id] || []) {
      if (!tags.some((have) => sameTag(t, have))) tags.push(t);
    }
    const drop = removed[id] || [];
    if (drop.length) tags = tags.filter((t) => !drop.some((d) => sameTag(t, d)));

    let excluded = item.excluded || false;
    if (Object.prototype.hasOwnProperty.call(over, id)) excluded = over[id];

    return { ...item, tags, excluded, source, overridden: Object.prototype.hasOwnProperty.call(over, id) };
  };

  return [
    ...curriculum().mbaItems.map((i) => resolve(i, "curriculum")),
    ...custom.items.map((i) => resolve(i, "custom"))
  ];
}
