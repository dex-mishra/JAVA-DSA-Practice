/**
 * Every interactive data-dsa-* attribute the page renders must have a
 * handler bound somewhere. The Library search and its Pages/Patterns switch
 * once lost theirs in a refactor and failed silently -- the box took input
 * and nothing happened. This catches that class of bug statically.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

/* Attributes that carry data rather than behaviour (targets, parameters,
   anchors), so they are not expected to have a handler of their own. */
const DATA_ONLY = new Set([
  "data-dsa-row", "data-dsa-detail", "data-dsa-timer", "data-dsa-sec", "data-dsa-why", "data-dsa-at",
  "data-dsa-at-stage", "data-dsa-notebody", "data-dsa-help", "data-dsa-andgo"
]);

test("every interactive data-dsa-* attribute in the markup has a bound handler", () => {
  const rendered = new Set([...app.matchAll(/(data-dsa-[a-z-]+)=\\?"/g)].map((m) => m[1]));
  const bound = new Set([...app.matchAll(/\[(data-dsa-[a-z-]+)(?:=[^\]]*)?\]/g)].map((m) => m[1]));
  const missing = [...rendered].filter((a) => !DATA_ONLY.has(a) && !bound.has(a));
  assert.deepEqual(missing, [], `rendered with no handler: ${missing.join(", ")}`);
});

test("the Library search box is wired to repaint the list", () => {
  assert.match(app, /getElementById\("dsaTheoryQ"\)[\s\S]{0,200}oninput/);
});
