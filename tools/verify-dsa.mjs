/**
 * Compile and test every reference C++ solution in docs/dsa-sheet/v3.
 *
 *   node tools/verify-dsa.mjs            (npm run verify:dsa)
 *   node tools/verify-dsa.mjs --if-gxx   (skip with a warning when g++ is absent)
 *
 * A wrapper over the content's own verify_cpp.py rather than a port of it:
 * the authoring pipeline owns that script and runs it on every batch, and
 * two runners would eventually disagree about what "passes" means.
 *
 * The one thing it adds is the include shim. The solutions start with
 * <bits/stdc++.h>, a GCC header that Apple clang -- which is what `g++` is
 * on a Mac -- does not have. Every solution fails to compile there for a
 * reason unrelated to the content.
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const optional = process.argv.includes("--if-gxx");

if (spawnSync("g++", ["--version"]).status !== 0) {
  const msg = "g++ not found -- reference solutions not verified";
  if (optional) { console.warn(`  warning: ${msg}`); process.exit(0); }
  console.error(msg);
  process.exit(1);
}

const shim = join(ROOT, "tools", "cpp-shim");
const env = { ...process.env, CPLUS_INCLUDE_PATH: [shim, process.env.CPLUS_INCLUDE_PATH].filter(Boolean).join(":") };
const res = spawnSync("python3", [join(ROOT, "docs", "dsa-sheet", "v3", "authoring", "verify_cpp.py"),
  join(ROOT, "docs", "dsa-sheet", "v3")], { env, stdio: "inherit" });
process.exit(res.status === null ? 1 : res.status);
