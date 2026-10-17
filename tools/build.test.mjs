/**
 * What must never be deployed (PRD-v3 §18): reference solutions and their
 * tests (`verify`), and OA hidden tests. public/ is world-readable, so one
 * of either there would hand out the answer key. Runs over the last build;
 * skipped when there is none yet.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
}

test("public/ carries no verify fields and no hidden OA tests", { skip: !existsSync(PUBLIC) && "no build yet" }, () => {
  for (const file of walk(PUBLIC)) {
    const s = readFileSync(file, "utf8");
    const rel = file.slice(PUBLIC.length + 1);
    assert.ok(!s.includes('"verify":{'), `${rel} carries a verify field`); // the MBA tag "verify" is fine
    assert.ok(!s.includes('"hidden":['), `${rel} carries hidden OA tests`);
    assert.ok(!s.includes("builder_js"), `${rel} carries an OA generator`);
  }
});

test("Day 1 is deployed", { skip: !existsSync(PUBLIC) && "no build yet" }, () => {
  assert.ok(existsSync(join(PUBLIC, "data", "dsa", "day", "1.json")));
});
