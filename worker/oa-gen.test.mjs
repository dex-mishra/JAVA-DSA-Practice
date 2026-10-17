/**
 * The generator sources (GEN_SOURCES) must feed a submission exactly the
 * bytes the JS builder produces -- the expected outputs were computed for
 * those bytes. Each one is compiled and run here, under real g++ and
 * python3, and compared byte for byte. Skipped where the tool is missing.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUILDERS, buildInput, GEN_SOURCES, genSource } from "./oa-gen.js";

const hasGxx = spawnSync("g++", ["--version"]).status === 0;
const hasPy = spawnSync("python3", ["--version"]).status === 0;

const ECHO_CPP = `
#include <iostream>
#include <iterator>
#include <string>
int main() {
  std::string s((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
  std::cout << s;
}`;

// How submissions actually read: fast IO switched on in main, then >>.
const FASTIO_CPP = `
#include <bits/stdc++.h>
using namespace std;
int main() {
  ios::sync_with_stdio(false); cin.tie(nullptr);
  long long n; cin >> n; long long count = 0; string tok;
  string rest; getline(cin, rest);
  while (cin >> tok) count++;
  cout << n << " " << count;
}`;

function runCpp(src) {
  const dir = mkdtempSync(join(tmpdir(), "oagen-"));
  try {
    writeFileSync(join(dir, "main.cpp"), src);
    const env = { ...process.env, CPLUS_INCLUDE_PATH: fileURLToPath(new URL("../tools/cpp-shim", import.meta.url)) };
    const c = spawnSync("g++", ["-std=c++17", "-O2", "-o", join(dir, "a.out"), join(dir, "main.cpp")], { env, encoding: "utf8" });
    assert.equal(c.status, 0, c.stderr);
    const r = spawnSync(join(dir, "a.out"), [], { cwd: dir, encoding: "utf8", maxBuffer: 1 << 26, input: "" });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runPy(src) {
  const r = spawnSync("python3", ["-c", src], { encoding: "utf8", maxBuffer: 1 << 26, input: "" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

test("every ported generator has a C++ and a Python source", () => {
  for (const key of Object.keys(BUILDERS)) {
    assert.ok(genSource(key, "cpp"), `${key}: no C++ source`);
    assert.ok(genSource(key, "python"), `${key}: no Python source`);
  }
  assert.equal(genSource("nope#1", "cpp"), null);
});

for (const key of Object.keys(GEN_SOURCES)) {
  test(`${key}: the C++ feed reproduces the JS builder byte for byte`, { skip: !hasGxx && "no g++" }, () => {
    const want = buildInput(key);
    assert.equal(runCpp(genSource(key, "cpp") + ECHO_CPP), want);
  });

  test(`${key}: a fast-IO submission reads it as stdin`, { skip: !hasGxx && "no g++" }, () => {
    const want = buildInput(key);
    const firstLine = want.slice(0, want.indexOf("\n"));
    const n = firstLine.split(" ")[0];
    const tokens = want.slice(want.indexOf("\n") + 1).split(/\s+/).filter(Boolean).length;
    assert.equal(runCpp(genSource(key, "cpp") + FASTIO_CPP), `${n} ${tokens}`);
  });

  test(`${key}: the Python feed reproduces the JS builder byte for byte`, { skip: !hasPy && "no python3" }, () => {
    const want = buildInput(key);
    assert.equal(runPy(genSource(key, "python") + "import sys\nsys.stdout.write(sys.stdin.read())\n"), want);
  });
}
