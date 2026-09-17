/**
 * Compose src/* plus data/*.json into a single self-contained index.html.
 *
 * Why a build step when both originals were deliberately single-file:
 * the single-file property is worth keeping (opens from disk, no server, no
 * dependencies), but content and rendering being the same file is what makes
 * automated updating dangerous. Splitting them means the updater only ever
 * rewrites JSON -- it cannot reach the rating maths, the badge rules or the
 * layout. The build puts the file back together.
 *
 *   node tools/build.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DATA = join(ROOT, "data");

function readJson(name, fallback) {
  const path = join(DATA, name);
  if (!existsSync(path)) {
    console.warn(`  (no ${name}; using empty)`);
    return fallback;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const placement = readJson("placement.json", { ranks: [], tracks: [], badges: [] });
const mba = readJson("mba.json", { phases: [], schools: [], excluded: [] });
const opportunities = readJson("opportunities.json", { opportunities: [] });

// The DSA sheet is split deliberately. The thin index carries everything a
// problem row needs and is baked in, so the day view paints with no network.
// The learnings, theory and templates are the other 90% of the bytes -- ~2 MB
// at the full 600 problems -- and are fetched per problem from /api/dsa/*.
// Written by tools/import-dsa.mjs; absent until it has been run once.
const dsaSpec = readJson(join("dsa", "spec.json"), null);
const dsaIndex = readJson(join("dsa", "index.json"), null);

const dsa = dsaSpec && dsaIndex ? { spec: dsaSpec, index: dsaIndex } : null;

const payload = { placement, mba, opportunities, dsa };

// Guard rails. A build that silently ships an empty curriculum would look
// fine and be useless, so refuse instead.
const ratedTopics = placement.tracks
  .filter((t) => t.rated)
  .reduce((n, t) => n + t.sections.reduce((m, s) => m + s.g.reduce((k, g) => k + g.i.length, 0), 0), 0);

const mbaItems =
  mba.phases.reduce((n, p) => n + (p.items || []).length, 0) + (mba.excluded || []).length;

if (ratedTopics === 0) throw new Error("refusing to build: no rated topics in data/placement.json");
if (mbaItems === 0) throw new Error("refusing to build: no MBA items in data/mba.json");

// Same guard rail, one step further: a DSA directory that exists but is
// empty ships a tab that renders an empty sheet and looks deliberate. An
// absent directory is fine -- that is just a repo where the import has not
// been run yet, and the tab hides itself.
const dsaProblems = dsa ? dsa.index.problems.length : 0;
if (dsa && dsaProblems === 0) {
  throw new Error("refusing to build: data/dsa exists but carries no problems — run node tools/import-dsa.mjs");
}

const styles = readFileSync(join(SRC, "styles.css"), "utf8");
const app = readFileSync(join(SRC, "app.js"), "utf8");
let shell = readFileSync(join(SRC, "shell.html"), "utf8");

// `</script>` inside the JSON payload would close the tag early. Escape it.
const json = JSON.stringify(payload).replace(/<\//g, "<\\/");

shell = shell
  .replace("/*__STYLES__*/", () => styles)
  .replace("/*__DATA__*/{}", () => json)
  .replace("/*__APP__*/", () => app)
  .replace(">—</span>. ", ">—</span>. ");

const out = join(ROOT, "index.html");
writeFileSync(out, shell);

const kb = (Buffer.byteLength(shell) / 1024).toFixed(1);
console.log(`built index.html  ${kb} KB`);
console.log(`  rated topics    ${ratedTopics}`);
console.log(`  MBA items       ${mbaItems}`);
console.log(`  opportunities   ${(opportunities.opportunities || []).length}`);
console.log(
  `  DSA problems    ${dsaProblems}` +
    (dsa ? ` (${dsa.spec.phases.filter((p) => p.loaded).length}/${dsa.spec.phases.length} phases)` : " — not imported")
);
