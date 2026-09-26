/**
 * The curriculum, resolved once per isolate.
 *
 * Lets the API talk about "the pandas topic" instead of the opaque id the
 * page uses internally, which is what every MCP tool needs.
 *
 * placement.json and mba.json are imported rather than fetched: together
 * they are 35 KB gzipped, far inside the Worker's bundle budget, and a
 * bundled import cannot be missing at runtime the way an asset fetch can.
 */

// The `with` attribute is required by Node (so `node --test` can load this
// module directly) and understood by the bundler Wrangler uses, so one form
// works in both places.
import placement from "../data/placement.json" with { type: "json" };
import mba from "../data/mba.json" with { type: "json" };

/**
 * djb2, uint32, base36 — byte-identical to hash() in src/app.js and to
 * _topic_id() in the Flask console it replaces.
 *
 * All three MUST agree: the page writes progress keyed by this id and the
 * API reads it back, so a divergence would not error, it would quietly
 * orphan every tick ever made.
 */
export function topicId(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (((h << 5) + h + text.charCodeAt(i)) >>> 0);
  return h.toString(36);
}

let cached = null;

export function curriculum() {
  if (cached) return cached;

  const topics = [];
  for (const track of placement.tracks || []) {
    for (const section of track.sections || []) {
      for (const group of section.g || []) {
        for (const label of group.i || []) {
          topics.push({
            id: topicId(`${track.id}|${section.n}|${label}`),
            label,
            track: track.id,
            track_label: track.label || track.id,
            section: section.n,
            group: group.n || "",
            rated: !!track.rated
          });
        }
      }
    }
  }

  const mbaItems = [];
  for (const phase of mba.phases || []) {
    for (const item of phase.items || []) mbaItems.push({ ...item, phase: phase.n, excluded: false });
  }
  for (const item of mba.excluded || []) mbaItems.push({ ...item, phase: "EXCLUDED", excluded: true });

  cached = { topics, mbaItems, ranks: placement.ranks || [] };
  return cached;
}

export function ratedTopics() {
  return curriculum().topics.filter((t) => t.rated);
}

/** Where a rating sits on the Codeforces-style ladder. */
export function rankFor(rating) {
  const ranks = curriculum().ranks;
  let out = ranks[0] || { n: "Unrated", min: 800 };
  for (const r of ranks) if (rating >= r.min) out = r;
  return out;
}
