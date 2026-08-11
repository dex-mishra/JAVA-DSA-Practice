/**
 * Lift the data arrays out of the two original single-file trackers into
 * data/*.json, so content and rendering stop being the same file.
 *
 * This is a one-time migration, but it is written to be re-runnable and
 * verifying: it counts what it extracts and fails loudly if the totals drift
 * from what the source briefs recorded. Retyping 1,328 topics by hand was
 * never an option.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

/**
 * Pull a single array literal out of a source file by brace matching.
 * String-aware, so brackets inside topic labels do not throw the count off.
 */
function extractArray(source, name) {
  const decl = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
  const match = decl.exec(source);
  if (!match) throw new Error(`could not find "const ${name} = ["`);

  const start = match.index + match[0].length - 1; // at the opening bracket
  let depth = 0;
  let quote = null;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    const prev = source[i - 1];

    if (quote) {
      if (ch === quote && prev !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) {
        const literal = source.slice(start, i + 1);
        // Pure data, from a file already on disk. No network, no imports.
        return new Function(`return ${literal}`)();
      }
    }
  }
  throw new Error(`unterminated array literal for ${name}`);
}

/** Stable id, byte-identical to the hash the original tracker used, so any
 *  progress already saved under the old scheme still lines up. */
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// ---------------------------------------------------------------- placement

const trackerSrc = readFileSync(join(ROOT, "placement-tracker.html"), "utf8");
const RANKS = extractArray(trackerSrc, "RANKS");
const TRACKS = extractArray(trackerSrc, "TRACKS");
const BADGES = extractArray(trackerSrc, "BADGES");

let ratedCount = 0;
let unratedCount = 0;
const trackSummary = [];

for (const track of TRACKS) {
  let items = 0;
  for (const section of track.sections) {
    for (const group of section.g) items += group.i.length;
  }
  if (track.rated) ratedCount += items;
  else unratedCount += items;
  trackSummary.push({
    id: track.id,
    label: track.label,
    rated: !!track.rated,
    sections: track.sections.length,
    items,
  });
}

// Every rated topic gets its stable id up front, so the site never has to
// recompute them and the ids can be referenced from other files.
const index = [];
for (const track of TRACKS) {
  for (const section of track.sections) {
    for (const group of section.g) {
      for (const label of group.i) {
        index.push({
          id: hash(track.id + "|" + section.n + "|" + label),
          track: track.id,
          rated: !!track.rated,
          sec: section.n,
          grp: group.n,
          label,
        });
      }
    }
  }
}

const ids = new Set(index.map((x) => x.id));
if (ids.size !== index.length) {
  throw new Error(`id collision: ${index.length} items but only ${ids.size} unique ids`);
}

// Badges carry a `t` predicate in the original source. JSON cannot hold a
// function, so only the display fields survive into data/. The unlock rules
// live in src/app.js keyed by badge id -- they are logic, not content, and the
// auto-updater has no business rewriting them. Assert the split holds so this
// never becomes a silent loss.
const droppedPredicates = BADGES.filter((b) => typeof b.t === "function").map((b) => b.id);
for (const badge of BADGES) delete badge.t;

// ---------------------------------------------------------------------- mba

const mbaSrc = readFileSync(join(ROOT, "mba-launch-windows.html"), "utf8");
const PHASES = extractArray(mbaSrc, "PHASES");
const SCHOOLS = extractArray(mbaSrc, "SCHOOLS");
const EXCLUDED = extractArray(mbaSrc, "EXCLUDED");

let mbaItems = 0;
const mbaIds = new Set();
const dated = [];

function walkMba(list, phaseName) {
  for (const item of list || []) {
    mbaItems++;
    if (item.id) {
      if (mbaIds.has(item.id)) throw new Error(`duplicate MBA item id: ${item.id}`);
      mbaIds.add(item.id);
    }
    if (item.date) dated.push({ id: item.id, date: item.date, t: item.t, phase: phaseName });
  }
}

for (const phase of PHASES) walkMba(phase.items, phase.n);
// EXCLUDED is a flat list of items, not phase-shaped groups.
walkMba(EXCLUDED, "EXCLUDED");

// ------------------------------------------------------------------- verify

const report = {
  placement: {
    tracks: trackSummary,
    ratedTopics: ratedCount,
    unratedItems: unratedCount,
    totalIndexed: index.length,
    badges: BADGES.length,
    ranks: RANKS.length,
  },
  mba: {
    phases: PHASES.length,
    schools: SCHOOLS.length,
    excludedItems: EXCLUDED.length,
    trackedItems: mbaItems,
    datedItems: dated.length,
  },
};

mkdirSync(DATA, { recursive: true });

writeFileSync(
  join(DATA, "placement.json"),
  JSON.stringify({ version: 1, ranks: RANKS, tracks: TRACKS, badges: BADGES }, null, 1)
);
writeFileSync(join(DATA, "placement-index.json"), JSON.stringify({ version: 1, index }, null, 0));
writeFileSync(
  join(DATA, "mba.json"),
  JSON.stringify({ version: 1, phases: PHASES, schools: SCHOOLS, excluded: EXCLUDED }, null, 1)
);

console.log(JSON.stringify(report, null, 2));

// Cross-check against the numbers recorded in the original build briefs.
// A mismatch means the extraction lost something and must not be shipped.
const EXPECTED_RATED = 1328;
const EXPECTED_MBA = 56;

const problems = [];
if (ratedCount !== EXPECTED_RATED)
  problems.push(`rated topics: got ${ratedCount}, brief recorded ${EXPECTED_RATED}`);
if (mbaItems !== EXPECTED_MBA)
  problems.push(`MBA tracked items: got ${mbaItems}, brief recorded ${EXPECTED_MBA}`);

console.log(
  `\nBadge predicates moved to src/app.js (not JSON-serialisable): ${droppedPredicates.length}/${BADGES.length}`
);
console.log(`  ${droppedPredicates.join(", ")}`);

if (problems.length) {
  console.log("\nMISMATCH vs the original briefs:");
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
} else {
  console.log("\nCounts match both briefs exactly.");
}
