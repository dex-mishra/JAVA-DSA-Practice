/**
 * Just enough of the D1 binding, over node:sqlite, for the tests: prepare /
 * bind / first / all / run, loaded with the real schema.sql. Real SQL means
 * the ON CONFLICT clauses, COALESCE draws and claim-then-send de-duplication
 * are tested as they will run, not against a mock that agrees with them.
 */

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "schema.sql"), "utf8");

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) {
    return new Stmt(this.db, this.sql, args.map((a) => (a === undefined ? null : typeof a === "boolean" ? (a ? 1 : 0) : a)));
  }
  async first() { return this.db.prepare(this.sql).get(...this.args) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
  async run() {
    const r = this.db.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export function makeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  return { prepare: (sql) => new Stmt(db, sql), raw: db };
}
