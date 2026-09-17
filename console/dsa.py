"""The DSA sheet: content served read-only, progress written per problem.

A blueprint rather than more routes in main.py, for the same reason mcp_http
is one -- main.py is already the size where finding anything is work.

Two halves that never touch:

  content   data/dsa/*.json, baked into the image by tools/import-dsa.mjs.
            Immutable at runtime. Re-importing a phase rewrites these files
            and cannot reach a single thing the user has written.

  progress  console/dsa_progress.json in the shared bucket. Its own blob,
            deliberately not the one the tracker ticks live in: that one is
            capped at 512 KB because a tick is an id and a boolean, and a
            sheet where every problem carries free-text notes, an approach
            line and a GoodNotes reference would eventually push a placement
            tick over the cap and start failing saves that have nothing to do
            with DSA.

Writes are per problem and read-modify-write, so typing a long note does not
re-upload six hundred other rows and cannot lose a concurrent edit.
"""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import date
from pathlib import Path
from typing import Any, Callable

from flask import Blueprint, jsonify, request

log = logging.getLogger("console.dsa")

PROGRESS_BLOB = "console/dsa_progress.json"

# Roomier than the tracker's 512 KB because this one legitimately holds prose.
# 600 problems averaging 2 KB of notes is 1.2 MB; 4 MB leaves the ceiling far
# enough away that nobody meets it by writing carefully.
MAX_PROGRESS_BYTES = 4 * 1024 * 1024

# Per-field caps, so one runaway paste cannot consume the whole budget and
# lock every other problem out of being saved.
MAX_NOTES = 20_000
MAX_APPROACH = 2_000
MAX_GOODNOTES = 200
MAX_TAGS = 32
MAX_TAG_LEN = 40

STATUSES = {"todo", "solved", "revisit"}

DEFAULTS: dict[str, Any] = {
    "status": "todo",
    "revision": False,
    "notes": "",
    "tags": [],
    "confidence": None,
    "last_revised": None,
    "goodnotes_ref": "",
    "my_approach": "",
}

_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# ---------------------------------------------------------------------------
# Content, loaded once
# ---------------------------------------------------------------------------


class Content:
    """data/dsa, resolved and cross-linked.

    Loaded lazily and held for the life of the process: the files ship inside
    the image, so nothing can change them without a redeploy.
    """

    def __init__(self, data_dir: Path):
        self.dir = data_dir / "dsa"
        self._loaded = False
        self.spec: dict = {}
        self.index: dict = {}
        self.problems: dict[str, dict] = {}       # thin rows, by id
        self.full: dict[str, dict] = {}           # full records, by id
        self.theory: dict[str, dict] = {}         # by theory id
        self.templates: dict[str, dict] = {}      # by template id
        self.learnings: list[dict] = []           # every phase, in day order
        self.by_slug: dict[str, str] = {}
        self.days: dict[int, list[dict]] = {}

    def _read(self, name: str, fallback):
        try:
            return json.loads((self.dir / name).read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            log.warning("Could not read dsa/%s: %s", name, exc)
            return fallback

    def load(self) -> "Content":
        if self._loaded:
            return self
        self._loaded = True

        self.spec = self._read("spec.json", {})
        self.index = self._read("index.json", {"problems": [], "by_slug": {}})
        self.by_slug = self.index.get("by_slug") or {}

        for row in self.index.get("problems", []):
            self.problems[row["id"]] = row
            self.days.setdefault(row["day"], []).append(row)

        for phase in self.spec.get("phases", []):
            if not phase.get("loaded"):
                continue
            doc = self._read(f"phase-{phase['key']}.json", {})
            for t in doc.get("theory", []):
                self.theory[t["id"]] = {**t, "phase": phase["key"]}
            for l in doc.get("learnings", []):
                self.learnings.append({**l, "phase": phase["key"]})
            for p in doc.get("problems", []):
                self.full[p["id"]] = p

        for t in self._read("templates.json", {}).get("templates", []):
            self.templates[t["id"]] = t

        # Day order inside a day is the sheet's own ordering, then tier, so
        # CORE always reads before the DRILLs that depend on it.
        rank = {"CORE": 0, "DRILL": 1, "SKIM": 2}
        for day in self.days:
            self.days[day].sort(key=lambda r: (rank.get(r["tier"], 9), r["ord"]))

        # Which day each topic last appears on. A topic whose last day is
        # behind you is "closed", which is what the checkpoint's carried
        # forward section is built from.
        self.topic_last_day: dict[str, int] = {}
        self.topic_first_day: dict[str, int] = {}
        for row in self.problems.values():
            t, d = row["topic"], row["day"]
            self.topic_last_day[t] = max(self.topic_last_day.get(t, 0), d)
            self.topic_first_day[t] = min(self.topic_first_day.get(t, 10**6), d)

        log.info(
            "DSA content: %d problems, %d theory, %d learnings, %d templates.",
            len(self.problems), len(self.theory), len(self.learnings), len(self.templates),
        )
        return self

    # -- lookups ------------------------------------------------------------

    def dominant_topic(self, day: int) -> str:
        rows = self.days.get(day, [])
        if not rows:
            return ""
        counts: dict[str, int] = {}
        for r in rows:
            counts[r["topic"]] = counts.get(r["topic"], 0) + 1
        # Ties break towards the topic that appears first in the day's order,
        # which is the one the day is actually about.
        best = max(counts.values())
        for r in rows:
            if counts[r["topic"]] == best:
                return r["topic"]
        return ""

    def title_for_slug(self, slug: str) -> str:
        pid = self.by_slug.get(slug)
        row = self.problems.get(pid or "")
        return row["title"] if row else slug.replace("-", " ").title()


# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------


def _clean_row(row: dict) -> dict:
    """A stored row, with defaults filled in. Absent means untouched."""
    out = dict(DEFAULTS)
    out["tags"] = list(row.get("tags") or [])
    for k in DEFAULTS:
        if k in row and k != "tags":
            out[k] = row[k]
    return out


def _validate_patch(body: dict) -> tuple[dict, str | None]:
    """Only the user fields, only in their declared shapes.

    Returns (patch, error). Anything not in the schema is dropped rather than
    rejected -- a future field arriving from an older page should not 400.
    """
    patch: dict[str, Any] = {}

    if "status" in body:
        v = body["status"]
        if v not in STATUSES:
            return {}, f"status must be one of {sorted(STATUSES)}"
        patch["status"] = v

    if "revision" in body:
        patch["revision"] = bool(body["revision"])

    if "notes" in body:
        patch["notes"] = str(body["notes"])[:MAX_NOTES]

    if "my_approach" in body:
        patch["my_approach"] = str(body["my_approach"])[:MAX_APPROACH]

    if "goodnotes_ref" in body:
        # Opaque by contract. Trimmed and length-capped, never parsed.
        patch["goodnotes_ref"] = str(body["goodnotes_ref"]).strip()[:MAX_GOODNOTES]

    if "tags" in body:
        raw = body["tags"]
        if not isinstance(raw, list):
            return {}, "tags must be an array"
        seen, tags = set(), []
        for t in raw:
            s = str(t).strip().lower()[:MAX_TAG_LEN]
            if s and s not in seen:
                seen.add(s)
                tags.append(s)
        patch["tags"] = tags[:MAX_TAGS]

    if "confidence" in body:
        v = body["confidence"]
        if v is None or v == "":
            patch["confidence"] = None
        else:
            try:
                n = int(v)
            except (TypeError, ValueError):
                return {}, "confidence must be an integer 1-5 or null"
            if not 1 <= n <= 5:
                return {}, "confidence must be between 1 and 5"
            patch["confidence"] = n

    if "last_revised" in body:
        v = body["last_revised"]
        if v in (None, ""):
            patch["last_revised"] = None
        elif isinstance(v, str) and _DATE.match(v):
            patch["last_revised"] = v
        else:
            return {}, "last_revised must be YYYY-MM-DD or null"

    return patch, None


# ---------------------------------------------------------------------------
# Checkpoints — computed, never stored
# ---------------------------------------------------------------------------


def _first_sentence(text: str) -> str:
    """Up to and including the first sentence-ending punctuation.

    Deliberately the same expression the page uses in dsaCheckpoint(), so a
    checkpoint rendered offline from the baked learnings and one rendered
    from this endpoint say the same thing rather than differing by a word.
    """
    text = (text or "").strip()
    m = re.match(r"[\s\S]*?[.!?](?=\s|$)", text)
    return m.group(0) if m else text


def build_checkpoint(c: Content, day: int) -> dict:
    """The day's learning checkpoint, per the decay rule in SPEC.

    Nothing is ever dropped; older material only gets denser. Today's
    learnings arrive whole, yesterday's keep their detail's first sentence
    and one citation, the day before keeps a citation's title, everything
    earlier in the same topic collapses to headlines, and a topic you have
    finished becomes a single consolidated line for the rest of the sheet.
    """
    topic = c.dominant_topic(day)

    def cite(applied: list) -> list[dict]:
        return [
            {
                "slug": a[0],
                "id": c.by_slug.get(a[0], ""),
                "title": c.title_for_slug(a[0]),
                "where": a[1] if len(a) > 1 else "",
            }
            for a in (applied or [])
        ]

    new_today, yesterday, two_back, earlier = [], [], [], []

    for l in c.learnings:
        d, t = l["day"], l["topic"]
        if d == day:
            new_today.append(
                {
                    "id": l["id"], "headline": l["headline"], "detail": l["detail"],
                    "citations": cite(l["applied"]),
                }
            )
        elif t == topic and d == day - 1:
            cites = cite(l["applied"])
            yesterday.append(
                {
                    "id": l["id"], "headline": l["headline"],
                    "detail": _first_sentence(l["detail"]),
                    "citations": cites[:1],
                }
            )
        elif t == topic and d == day - 2:
            cites = cite(l["applied"])
            two_back.append(
                {
                    "id": l["id"], "headline": l["headline"],
                    "problem": cites[0]["title"] if cites else "",
                }
            )
        elif t == topic and d <= day - 3:
            earlier.append(l["headline"])

    # Carried forward: every topic whose last problem is behind this day,
    # one dense line each. Arrays never vanishes -- by DP it is a paragraph.
    carried = []
    for t, last in sorted(c.topic_last_day.items(), key=lambda kv: kv[1]):
        if last >= day or t == topic:
            continue
        heads = [l["headline"] for l in c.learnings if l["topic"] == t]
        if heads:
            carried.append({"topic": t, "closed_after_day": last, "headlines": heads})

    return {
        "day": day,
        "topic": topic,
        "new_today": new_today,
        "from_yesterday": yesterday,
        "two_days_back": two_back,
        "earlier_in_topic": earlier,
        "carried_forward": carried,
    }


# ---------------------------------------------------------------------------
# Blueprint
# ---------------------------------------------------------------------------


def build_blueprint(data_dir: Path, deps: dict[str, Callable]) -> Blueprint:
    """`deps` supplies the bucket helpers from main.py rather than importing
    them, so this module stays testable without a GCS client."""

    bp = Blueprint("dsa", __name__)
    protected = deps["protected"]
    read_json_blob = deps["read_json_blob"]
    mutate_json_blob = deps["mutate_json_blob"]

    content = Content(data_dir)

    def C() -> Content:
        return content.load()

    def progress() -> dict:
        doc = read_json_blob(PROGRESS_BLOB, {}) or {}
        rows = doc.get("problems")
        return rows if isinstance(rows, dict) else {}

    def rollup(rows: dict) -> dict:
        """Per-phase and per-topic counts, computed rather than stored so a
        re-import cannot leave a stale total behind."""
        c = C()
        by_phase: dict[str, dict] = {}
        by_topic: dict[str, dict] = {}
        for pid, row in c.problems.items():
            g = rows.get(pid) or {}
            status = g.get("status", "todo")
            for bucket, key in ((by_phase, row["phase"]), (by_topic, row["topic"])):
                b = bucket.setdefault(key, {"total": 0, "solved": 0, "revisit": 0, "todo": 0, "starred": 0})
                b["total"] += 1
                b[status if status in STATUSES else "todo"] += 1
                if g.get("revision"):
                    b["starred"] += 1
        return {"by_phase": by_phase, "by_topic": by_topic}

    # -- content ------------------------------------------------------------

    @bp.get("/api/dsa/spec")
    @protected
    def dsa_spec():
        return jsonify(C().spec)

    @bp.get("/api/dsa/phases")
    @protected
    def dsa_phases():
        c = C()
        roll = rollup(progress())["by_phase"]
        out = []
        for p in c.spec.get("phases", []):
            out.append({**p, "progress": roll.get(p["key"], {"total": 0, "solved": 0, "revisit": 0, "todo": 0, "starred": 0})})
        return jsonify({"phases": out, "total_days": c.spec.get("total_days"), "pool_size": c.spec.get("pool_size")})

    @bp.get("/api/dsa/day/<int:n>")
    @protected
    def dsa_day(n: int):
        c = C()
        rows = c.days.get(n, [])
        g = progress()
        return jsonify(
            {
                "day": n,
                "topic": c.dominant_topic(n),
                "phase": rows[0]["phase"] if rows else "",
                "problems": [{**r, "progress": _clean_row(g.get(r["id"]) or {})} for r in rows],
                "checkpoint": build_checkpoint(c, n),
            }
        )

    @bp.get("/api/dsa/checkpoint/<int:n>")
    @protected
    def dsa_checkpoint(n: int):
        return jsonify(build_checkpoint(C(), n))

    @bp.get("/api/dsa/problem/<path:pid>")
    @protected
    def dsa_problem(pid: str):
        c = C()
        full = c.full.get(pid)
        if not full:
            return jsonify({"error": f"unknown problem {pid!r}"}), 404

        template = c.templates.get(full.get("template") or "")
        siblings = []
        for slug in (full.get("learnings") or {}).get("siblings", []):
            sid = c.by_slug.get(slug)
            siblings.append(
                {
                    "slug": slug,
                    "id": sid or "",
                    "title": c.title_for_slug(slug),
                    # Not every sibling is in the 600. Those render as plain
                    # LeetCode links rather than dead internal ones.
                    "url": c.problems[sid]["url"] if sid else f"https://leetcode.com/problems/{slug}/",
                    "in_sheet": bool(sid),
                }
            )

        return jsonify(
            {
                **full,
                "siblings_resolved": siblings,
                "template_resolved": template,
                # A template id that resolves to nothing is a content gap, not
                # a bug here. Say so plainly rather than rendering a dead link.
                "template_missing": bool(full.get("template") and not template),
                "theory_id": (C().index.get("theory_for_topic") or {}).get(full.get("topic"), ""),
                "progress": _clean_row(progress().get(pid) or {}),
            }
        )

    @bp.get("/api/dsa/learnings")
    @protected
    def dsa_learnings():
        """Every learning in every imported phase, in day order.

        The page builds its own checkpoints rather than asking for one per
        day: the decay rule needs the whole set anyway, and fetching it once
        means moving between days costs nothing. /api/dsa/checkpoint/<n> is
        the same rule server-side, for anything that is not the page.
        """
        return jsonify({"learnings": sorted(C().learnings, key=lambda l: (l["day"], l["id"]))})

    @bp.get("/api/dsa/theory")
    @protected
    def dsa_theory_list():
        c = C()
        return jsonify(
            {
                "theory": [
                    {"id": t["id"], "title": t["title"], "phase": t["phase"], "links": t.get("links", [])}
                    for t in c.theory.values()
                ],
                "parts": c.spec.get("theory_parts", []),
            }
        )

    @bp.get("/api/dsa/theory/<path:tid>")
    @protected
    def dsa_theory(tid: str):
        t = C().theory.get(tid)
        if not t:
            return jsonify({"error": f"unknown theory section {tid!r}"}), 404
        return jsonify({**t, "parts_meta": C().spec.get("theory_parts", [])})

    @bp.get("/api/dsa/templates")
    @protected
    def dsa_templates():
        c = C()
        used: dict[str, int] = {}
        for row in c.problems.values():
            if row.get("template"):
                used[row["template"]] = used.get(row["template"], 0) + 1
        return jsonify(
            {
                "templates": [
                    {"id": t["id"], "name": t["name"], "topic": t["topic"], "when": t.get("when", ""), "used_by": used.get(t["id"], 0)}
                    for t in c.templates.values()
                ]
            }
        )

    @bp.get("/api/dsa/template/<path:tid>")
    @protected
    def dsa_template(tid: str):
        c = C()
        t = c.templates.get(tid)
        if not t:
            return jsonify({"error": f"unknown template {tid!r}"}), 404
        users = [
            {"id": r["id"], "title": r["title"], "topic": r["topic"], "day": r["day"]}
            for r in c.problems.values()
            if r.get("template") == tid
        ]
        users.sort(key=lambda r: r["day"])
        return jsonify({**t, "used_by": users})

    # -- search and queue ---------------------------------------------------

    @bp.get("/api/dsa/search")
    @protected
    def dsa_search():
        c = C()
        g = progress()
        q = request.args.get("q", "").strip().lower()
        limit = max(1, min(int(request.args.get("limit", 100)), 1000))

        def want(name: str, value: str) -> bool:
            wanted = request.args.get(name, "")
            return not wanted or value.lower() == wanted.lower()

        company = request.args.get("company", "").strip().lower()
        tag = request.args.get("tag", "").strip().lower()
        has_notes = request.args.get("has_notes", "")
        confidence = request.args.get("confidence", "")

        rows = []
        for r in c.problems.values():
            p = _clean_row(g.get(r["id"]) or {})
            if not want("topic", r["topic"]) or not want("tier", r["tier"]):
                continue
            if not want("difficulty", r["difficulty"]) or not want("campus_oa", r["campus_oa"]):
                continue
            if not want("phase", r["phase"]) or not want("status", p["status"]):
                continue
            if company and not any(company == x.lower() for x in r.get("companies", [])):
                continue
            if tag and tag not in p["tags"]:
                continue
            if has_notes in ("1", "true") and not p["notes"].strip():
                continue
            if confidence and str(p["confidence"]) != confidence:
                continue
            if q and q not in r["title"].lower() and q not in r["topic"] and q not in (r.get("pattern") or ""):
                continue
            rows.append({**r, "progress": p})

        rows.sort(key=lambda r: (r["day"], r["ord"]))
        return jsonify({"total": len(rows), "problems": rows[:limit]})

    @bp.get("/api/dsa/revision-queue")
    @protected
    def dsa_revision_queue():
        """SPEC's rule, exactly: anything started that is either starred or
        rated 3 or below, weakest and least recently revised first.

        No revision days are scheduled anywhere in the sheet -- by design.
        The queue is pulled when there is time for it, not slotted.
        """
        c = C()
        g = progress()
        limit = max(1, min(int(request.args.get("limit", 20)), 200))

        picked = []
        for pid, row in c.problems.items():
            p = _clean_row(g.get(pid) or {})
            if p["status"] == "todo":
                continue
            if not (p["revision"] or (p["confidence"] is not None and p["confidence"] <= 3)):
                continue
            picked.append({**row, "progress": p})

        # confidence ASC NULLS LAST, last_revised ASC NULLS FIRST.
        picked.sort(
            key=lambda r: (
                r["progress"]["confidence"] if r["progress"]["confidence"] is not None else 99,
                r["progress"]["last_revised"] or "",
            )
        )
        return jsonify({"total": len(picked), "problems": picked[:limit]})

    # -- progress -----------------------------------------------------------

    @bp.get("/api/dsa/progress")
    @protected
    def dsa_progress_get():
        doc = read_json_blob(PROGRESS_BLOB, {}) or {}
        rows = doc.get("problems")
        return jsonify(
            {
                "problems": rows if isinstance(rows, dict) else {},
                "updated_ts": float(doc.get("updated_ts") or 0),
                "rollup": rollup(rows if isinstance(rows, dict) else {}),
            }
        )

    @bp.patch("/api/dsa/progress/<path:pid>")
    @protected
    def dsa_progress_patch(pid: str):
        c = C()
        if pid not in c.problems:
            return jsonify({"error": f"unknown problem {pid!r}"}), 404

        body = request.get_json(silent=True) or {}
        patch, err = _validate_patch(body)
        if err:
            return jsonify({"error": err}), 400
        if not patch:
            return jsonify({"error": "nothing to update"}), 400

        def mutate(doc: dict):
            doc.setdefault("version", 1)
            rows = doc.setdefault("problems", {})
            row = rows.setdefault(pid, {})
            row.update(patch)

            # Marking something revised is a date, and typing the date by hand
            # every time is the kind of friction that stops it being used. A
            # status change to solved or revisit stamps it unless the caller
            # said otherwise explicitly.
            if "status" in patch and patch["status"] != "todo" and "last_revised" not in patch:
                row["last_revised"] = date.today().isoformat()

            row["updated_at"] = time.time()

            # A row back at every default is absence, not state. Dropping it
            # keeps the blob proportional to what has actually been touched.
            if all(row.get(k, DEFAULTS[k]) == DEFAULTS[k] for k in DEFAULTS) and not row.get("notes"):
                rows.pop(pid, None)

            doc["updated_ts"] = time.time()

            if len(json.dumps(doc, separators=(",", ":")).encode("utf-8")) > MAX_PROGRESS_BYTES:
                raise ValueError("dsa progress payload too large")

            return _clean_row(rows.get(pid) or {})

        try:
            row = mutate_json_blob(PROGRESS_BLOB, mutate)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 413

        return jsonify({"id": pid, "progress": row})

    return bp
