/**
 * Compose src/* plus data/*.json into a self-contained index.html, and lay
 * out the deployable tree in public/.
 *
 * Why a build step when both originals were deliberately single-file:
 * the single-file property is worth keeping (opens from disk, no server, no
 * dependencies), but content and rendering being the same file is what makes
 * automated updating dangerous. Splitting them means the updater only ever
 * rewrites JSON -- it cannot reach the rating maths, the badge rules or the
 * layout. The build puts the file back together.
 *
 *   node tools/build.mjs
 *
 * Two outputs, deliberately:
 *
 *   index.html   the single file, committed, opens from disk. Unchanged.
 *   public/      what actually deploys: index.html plus the DSA material
 *                exploded into one static file per problem, theory section
 *                and template.
 *
 * The explosion is the whole reason the DSA tab needs no server. Those were
 * API routes reading files baked into a container image -- compute doing a
 * filesystem read behind an HTTP hop. As static objects on a CDN they are
 * the same bytes, cached at the edge, for nothing.
 *
 * public/ is derived and gitignored. Rebuild it; never edit it.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DATA = join(ROOT, "data");
const PUBLIC = join(ROOT, "public");

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

// The DSA plan is split deliberately. The plan (without day bodies) and the
// thin problem index are baked in, so the Today view paints its rows, roles,
// links and header with no network. The teaching material -- stages, theory
// pages, drill, CS core -- is the other 95% of the bytes and is fetched as
// static files from public/data/dsa/. Written by tools/import-dsa.mjs.
const dsaPlan = readJson(join("dsa", "plan.json"), null);
const dsaIndex = readJson(join("dsa", "index.json"), null);

const dsa = dsaPlan && dsaIndex ? { plan: dsaPlan, index: dsaIndex } : null;

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
// Day 1 is the day the tab opens on before the plan starts and on its first
// morning. A build without it ships a Today view with nothing to do.
if (dsa && !existsSync(join(DATA, "dsa", "day", "1.json"))) {
  throw new Error("refusing to build: Day 1 content is missing from data/dsa — run node tools/import-dsa.mjs");
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

// ---------------------------------------------------------------- public/

/* Rebuilt from scratch every time. A stale problem file left behind by a
   previous import would be served happily by the CDN and would be wrong in
   the one way nobody checks: quietly, for a single problem. */
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
writeFileSync(join(PUBLIC, "index.html"), shell);

let staticFiles = 1;

function emit(relPath, value) {
  const target = join(PUBLIC, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(value));
  staticFiles++;
}

/* The importer has already written the finished files -- theory pages with
   their reverse index, problem files with their siblings, day files -- so the
   build only copies them. Copying everything the importer wrote, rather than
   a list, means a new kind of file cannot be forgotten here; the importer is
   also what guarantees no `verify` field and no hidden OA test is among them. */
if (dsa) {
  const from = join(DATA, "dsa");
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".json") ? [join(dir, e.name)] : []);
  for (const file of walk(from)) {
    const rel = file.slice(from.length + 1);
    // plan and index are already inside index.html.
    if (rel === "plan.json" || rel === "index.json") continue;
    emit(join("data", "dsa", rel), JSON.parse(readFileSync(file, "utf8")));
  }
}

const kb = (Buffer.byteLength(shell) / 1024).toFixed(1);
console.log(`built index.html  ${kb} KB`);
console.log(`  rated topics    ${ratedTopics}`);
console.log(`  MBA items       ${mbaItems}`);
console.log(`  opportunities   ${(opportunities.opportunities || []).length}`);
console.log(
  `  DSA problems    ${dsaProblems}` +
    (dsa ? ` (${dsa.plan.days.filter((d) => d.content === "ready").length}/${dsa.plan.days.length} days with notes)` : " — not imported")
);
console.log(`  public/         ${staticFiles} files`);
