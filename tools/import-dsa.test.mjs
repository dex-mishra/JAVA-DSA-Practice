/**
 * The importer's refusal rules (PRD §6.1), each against a copy of the real
 * v3 content with exactly one thing broken. Using the real content rather
 * than a hand-built miniature means a rule is tested against the shapes the
 * importer will actually meet, and the "clean" case doubles as a check that
 * the delivered content imports at all.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { importDsa } from "./import-dsa.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "dsa-sheet", "v3");
const TODAY = "2026-10-17";

function withCopy(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "dsa-import-"));
  for (const part of ["PLAN.json", "MOCK-SCHEDULE.json", "theory", "days", "oa"]) {
    cpSync(join(SRC, part), join(dir, part), { recursive: true });
  }
  const edit = (rel, fn) => {
    const p = join(dir, rel);
    const doc = JSON.parse(readFileSync(p, "utf8"));
    const out = fn(doc);
    writeFileSync(p, JSON.stringify(out === undefined ? doc : out));
  };
  try {
    mutate({ dir, edit });
    return importDsa({ src: dir, today: TODAY });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function refuses(result, pattern) {
  assert.ok(result.errors.length > 0, "expected the import to be refused");
  assert.ok(result.errors.some((e) => pattern.test(e)), `no error matched ${pattern}:\n  ${result.errors.join("\n  ")}`);
}

test("the delivered content imports cleanly", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  assert.deepEqual(r.errors, []);
  assert.equal(r.stats.problems, 120);
  assert.equal(r.stats.pages, 161);
  assert.equal(r.stats.ready_days, 5);
  assert.equal(r.stats.drill, 25);
  assert.equal(Object.keys(r.outputs.get("index.json").legacy_map).length, 89);
});

test("nothing it outputs carries a verify field or a hidden OA test", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  for (const [rel, value] of r.outputs) {
    const s = JSON.stringify(value);
    assert.ok(!s.includes('"verify"'), `${rel} carries verify`);
    assert.ok(!s.includes('"hidden"'), `${rel} carries hidden tests`);
  }
});

test("1: a duplicate id across problems and siblings is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].siblings[0].id = "two-sum";
  })), /already used/);
});

test("2: a day file whose problems differ from PLAN is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems.reverse();
  })), /differ from PLAN/);
});

test("3: a problem missing a stage is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-02.json", (d) => {
    d.problems[0].stages = d.problems[0].stages.filter((s) => s.id !== "dry_run");
  })), /stages must be exactly/);
});

test("3: an empty stage body is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-02.json", (d) => {
    d.problems[1].stages[3].body = "  ";
  })), /empty body/);
});

test("3: an unknown note tag is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-03.json", (d) => {
    d.problems[0].stages[0].note = "highlight";
  })), /not write, screenshot or mixed/);
});

test("4: two must siblings on one problem is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-04.json", (d) => {
    d.problems[0].siblings.forEach((s) => { s.tier = "must"; });
  })), /exactly one must sibling/);
});

test("5: a theory_ref to a missing section is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].theory_refs[0].section = "no-such-section";
  })), /has no section 'no-such-section'/);
});

test("5: an inline [[link]] to a missing page is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].stages[0].body += "\n\nSee [[no-such-page#idea]].";
  })), /'no-such-page' does not exist/);
});

test("5: a PLAN primary theory page that does not exist is refused", () => {
  refuses(withCopy(({ edit }) => edit("PLAN.json", (p) => {
    p.days[9].problems[0].theory.push("gone-page");
  })), /'gone-page' does not exist/);
});

test("6: a drill day with four items is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-05.json", (d) => {
    d.drill.pop();
  })), /exactly 5 items/);
});

test("6: a ready day without cs_core is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-05.json", (d) => {
    delete d.cs_core;
  })), /needs cs_core/);
});

test("7: an OA problem from outside covers_days is refused", () => {
  refuses(withCopy(({ edit }) => edit("oa/mock-01-problems.json", (m) => {
    m.problems[0].source_day = 9;
  })), /source_day 9 is not in covers_days/);
});

test("7: OA covers_days that disagree with the schedule are refused", () => {
  refuses(withCopy(({ edit }) => edit("MOCK-SCHEDULE.json", (s) => {
    s.mocks[0].covers_days = [1, 2, 3];
  })), /differ from MOCK-SCHEDULE/);
});

test("7: an OA problem related to a v2 id is refused", () => {
  refuses(withCopy(({ edit }) => edit("oa/mock-01-problems.json", (m) => {
    m.problems[0].related = "hashing-majority-element";
  })), /is not a PLAN problem/);
});

test("8: a mock date that is not start_date + day - 1 is refused", () => {
  refuses(withCopy(({ edit }) => edit("MOCK-SCHEDULE.json", (s) => {
    s.mocks[1].date = "2026-10-29";
  })), /is not start_date/);
});

test("a day PLAN marks ready without its file is refused", () => {
  refuses(withCopy(({ dir }) => rmSync(join(dir, "days", "day-03.json"))), /file is missing/);
});

test("used_by is recomputed from the references, not taken from the content", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  const page = r.outputs.get("theory/hash-complement-lookup.json");
  assert.ok(page.used_by.some((u) => u.kind === "problem" && u.id === "two-sum"));
  assert.ok(page.used_by.every((u) => "kind" in u && "stage" in u));
  assert.ok(existsSync(join(SRC, "theory", "hash-complement-lookup.json")));
});
