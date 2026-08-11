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

const payload = { placement, mba, opportunities };

// Guard rails. A build that silently ships an empty curriculum would look
// fine and be useless, so refuse instead.
const ratedTopics = placement.tracks
  .filter((t) => t.rated)
  .reduce((n, t) => n + t.sections.reduce((m, s) => m + s.g.reduce((k, g) => k + g.i.length, 0), 0), 0);

const mbaItems =
  mba.phases.reduce((n, p) => n + (p.items || []).length, 0) + (mba.excluded || []).length;

if (ratedTopics === 0) throw new Error("refusing to build: no rated topics in data/placement.json");
if (mbaItems === 0) throw new Error("refusing to build: no MBA items in data/mba.json");

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
