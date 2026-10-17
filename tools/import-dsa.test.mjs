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
  assert.equal(r.stats.pages, 165);
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

test("6: a ready day with neither core nor cs_core is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-05.json", (d) => {
    delete d.cs_core; delete d.core;
  })), /needs a core block/);
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
  const row = page.used_by.find((u) => u.kind === "ref" && u.id === "two-sum");
  assert.ok(row, "Two Sum's reference is in used_by");
  // v3.1 §12: each row carries where, why, when and must/optional.
  assert.ok(row.stage && row.why && row.when && row.need);
  assert.ok(existsSync(join(SRC, "theory", "hash-complement-lookup.json")));
});

// ---------------------------------------------------------------- v3.1 §12

test("v3.1: the Day 1–2 numbers from START-HERE", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  const d1 = r.outputs.get("day/1.json"), d2 = r.outputs.get("day/2.json");
  assert.equal(d1.reading_path.length, 7);
  assert.equal(d1.reading_path.reduce((n, s) => n + s.minutes, 0), 21);
  assert.equal(d2.reading_path.length, 6);
  assert.deepEqual(d1.core.topics, ["oop-classes-objects-memory", "oop-constructors-destructors"]);
  assert.equal(d1.core.mcqs.length, 6);
  const ready = r.outputs.get("theory-index.json").pages.filter((p) => p.notes_status === "ready").length;
  assert.equal(ready, 23);
});

test("v3.1: v3-format refs default to while/optional", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  const p = r.outputs.get("problem/3sum.json");
  assert.ok(p.theory_refs.every((x) => x.when === "while" || x.when !== undefined));
  assert.ok(p.theory_refs.every((x) => ["before", "while", "stuck", "after"].includes(x.when) && ["must", "optional"].includes(x.need)));
});

test("v3.1: a malformed detour line is refused", () => {
  refuses(withCopy(({ edit }) => edit("theory/arr-read-write-pointer.json", (t) => {
    t.sections[0].body += "\n>> detour cx-space-and-in-place#aux why but no minutes";
  })), /malformed detour/);
});

test("v3.1: a detour to a missing section is refused", () => {
  refuses(withCopy(({ edit }) => edit("theory/arr-read-write-pointer.json", (t) => {
    t.sections[0].body += "\n>> detour cx-space-and-in-place#nope | why | 2 min";
  })), /has no section 'nope'/);
});

test("v3.1: a reading_path step to a missing section is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.reading_path[0].section = "nope";
  })), /reading_path\[1\].*has no section 'nope'/);
});

test("v3.1: an invalid when / need is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].theory_refs[0].when = "sometimes";
  })), /when 'sometimes'/);
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].theory_refs[0].need = "nice";
  })), /need 'nice'/);
});

test("v3.1: note, recall and shot must come together; recall needs 3", () => {
  refuses(withCopy(({ edit }) => edit("theory/hash-complement-lookup.json", (t) => { t.shot = null; })), /must come together/);
  refuses(withCopy(({ edit }) => edit("theory/hash-complement-lookup.json", (t) => { t.recall = t.recall.slice(0, 2); })), /at least 3 questions/);
});

test("v3.1: a core topic that is not a core page is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.core.topics[0] = "hash-complement-lookup";
  })), /not a CS core page/);
});

test("v3.1: fewer than 5 MCQs, or an answer outside the options, is refused", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => { d.core.mcqs = d.core.mcqs.slice(0, 4); })), /at least 5 MCQs/);
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => { d.core.mcqs[0].answer = "z"; })), /answer among them/);
});

test("v3.1: Days 1–2 problems need notes; LEARN needs a 'before' ref", () => {
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => { d.problems[0].note = null; })), /need a note outline/);
  refuses(withCopy(({ edit }) => edit("days/day-01.json", (d) => {
    d.problems[0].theory_refs.forEach((r) => { if (r.when === "before") r.when = "while"; });
  })), /at least one 'before' reference/);
});

test("v3.1: Days 3–5 in the v3 format still import (fallbacks)", () => {
  const r = importDsa({ src: SRC, today: TODAY });
  const d3 = r.outputs.get("day/3.json");
  assert.deepEqual(d3.reading_path, []);
  assert.ok(d3.cs_core && !d3.core);
});
