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

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

if (dsa) {
  const dsaDir = join(DATA, "dsa");
  const templates = readJson(join("dsa", "templates.json"), { templates: [] }).templates;
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const bySlug = dsa.index.by_slug || {};
  const rowById = new Map(dsa.index.problems.map((p) => [p.id, p]));
  const theoryForTopic = dsa.index.theory_for_topic || {};

  const learnings = [];
  const templateUsers = new Map();

  for (const phase of dsa.spec.phases) {
    if (!phase.loaded) continue;
    const payload = JSON.parse(readFileSync(join(dsaDir, `phase-${phase.key}.json`), "utf8"));

    for (const t of payload.theory || []) emit(`data/dsa/theory/${t.id}.json`, { ...t, phase: phase.key });
    for (const l of payload.learnings || []) learnings.push({ ...l, phase: phase.key });

    for (const p of payload.problems || []) {
      /* Cross-references are resolved here rather than in the browser.
         The page would otherwise need the slug map and the whole problem
         list in memory to turn a sibling slug into a link -- which it has,
         but doing it once at build time means the fetched file is already
         the finished answer. */
      const siblings = ((p.learnings || {}).siblings || []).map((slug) => {
        const sid = bySlug[slug];
        const row = sid ? rowById.get(sid) : null;
        return {
          slug,
          id: sid || "",
          title: row ? row.title : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          // A sibling outside the 600 is a real thing, not a broken link:
          // it leaves the sheet for LeetCode and the UI says so.
          url: row ? row.url : `https://leetcode.com/problems/${slug}/`,
          in_sheet: !!sid
        };
      });

      const template = p.template ? templateById.get(p.template) : null;
      if (p.template) {
        if (!templateUsers.has(p.template)) templateUsers.set(p.template, []);
        templateUsers.get(p.template).push({ id: p.id, title: p.title, topic: p.topic, day: p.day });
      }

      emit(`data/dsa/problem/${p.id}.json`, {
        ...p,
        siblings_resolved: siblings,
        template_resolved: template || null,
        // Referenced but not written yet. Said out loud so the UI can show
        // that rather than a dead deep-link.
        template_missing: !!(p.template && !template),
        theory_id: theoryForTopic[p.topic] || ""
      });
    }
  }

  learnings.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
  emit("data/dsa/learnings.json", { learnings });

  for (const t of templates) {
    const users = (templateUsers.get(t.id) || []).sort((a, b) => a.day - b.day);
    emit(`data/dsa/template/${t.id}.json`, { ...t, used_by: users });
  }

  emit("data/dsa/templates.json", {
    templates: templates.map((t) => ({
      id: t.id, name: t.name, topic: t.topic, when: t.when || "",
      used_by: (templateUsers.get(t.id) || []).length
    }))
  });
}

const kb = (Buffer.byteLength(shell) / 1024).toFixed(1);
console.log(`built index.html  ${kb} KB`);
console.log(`  rated topics    ${ratedTopics}`);
console.log(`  MBA items       ${mbaItems}`);
console.log(`  opportunities   ${(opportunities.opportunities || []).length}`);
console.log(
  `  DSA problems    ${dsaProblems}` +
    (dsa ? ` (${dsa.spec.phases.filter((p) => p.loaded).length}/${dsa.spec.phases.length} phases)` : " — not imported")
);
console.log(`  public/         ${staticFiles} files`);
