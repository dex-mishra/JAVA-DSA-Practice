"""Launch Console — the web front end for the trackers and the inbox agent.

A Cloud Run *Service*, separate from the agent's Cloud Run *Job*. It serves
the three-tab site and a small API the Agent tab talks to.

The split matters. A Job has no URL and cannot be visited; a Service scales to
zero and costs nothing idle. They share one GCS bucket, which is how a change
made here reaches a job that is not running yet: the console writes an overlay
object, and the next execution reads it. Nothing is redeployed, and a console
outage leaves the agent running on its deployed configuration.

What this service can and cannot change is deliberate:

  can    free-text instructions steering the classifier's judgement
  can    the two dry-run switches
  can    connect and disconnect additional mailboxes to read
  cannot REPORT_TO, or which mailbox is allowed to send
  cannot any protection in policy.py -- trash rules, caps, OAuth scopes

That last pair is the point. REPORT_TO is fixed at deploy time, so no request
to this service can redirect your summaries somewhere else, and the
protections that stop mail being lost live in code that ships with the job.
"""

from __future__ import annotations

import hmac
import json
import logging
import os
import re
import secrets as pysecrets
import sys
import time
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, Response, jsonify, redirect, request, send_from_directory, session

# The overlay schema is shared with the agent so both sides validate
# identically. Vendored as a package rather than duplicated -- as a package
# because overlay.py resolves `from . import rules` against its parent, and
# loose modules on sys.path give it none.
sys.path.insert(0, str(Path(__file__).parent))
from _agent import overlay as overlay_mod  # noqa: E402
from _agent import rules as rules_mod  # noqa: E402

import codeforces as cf_mod  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("console")

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("FLASK_SECRET", pysecrets.token_hex(32))

PROJECT = os.environ.get("GCP_PROJECT", "")
BUCKET = os.environ.get("STATE_BUCKET", "")
JOB_NAME = os.environ.get("JOB_NAME", "inbox-agent")
JOB_REGION = os.environ.get("JOB_REGION", "asia-south1")
AGENT_SA = os.environ.get("AGENT_SERVICE_ACCOUNT", "")
PRIMARY_EMAIL = os.environ.get("PRIMARY_EMAIL", "")
COLLEGE_EMAIL = os.environ.get("COLLEGE_EMAIL", "")
OAUTH_CLIENT_SECRET = os.environ.get("OAUTH_CLIENT_SECRET_NAME", "inbox-agent-oauth-web-client")
# Unset by default: the console is open, as configured. Set it to require a
# password on every request without changing anything else.
CONSOLE_PASSWORD = os.environ.get("CONSOLE_PASSWORD", "")
# The build that produced this image. Compared against the agent's, because
# the two deploy separately and can silently drift apart.
APP_VERSION = os.environ.get("APP_VERSION", "")
# Fallback only; the handle is normally set on the page and stored in the
# overlay, so changing it does not need a deploy.
CF_HANDLE = os.environ.get("CF_HANDLE", "")

STATIC_DIR = Path(__file__).parent / "static"

# Extra mailboxes are read-only participants in the digest. Never gmail.send:
# only the primary sends, and that is settled at deploy time.
ACCOUNT_SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

_SLUG = re.compile(r"[^a-z0-9]+")


# ---------------------------------------------------------------------------
# Auth (opt-in)
# ---------------------------------------------------------------------------


def protected(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not CONSOLE_PASSWORD:
            return view(*args, **kwargs)
        if session.get("ok") is True:
            return view(*args, **kwargs)
        supplied = request.headers.get("X-Console-Password", "")
        if supplied and hmac.compare_digest(supplied, CONSOLE_PASSWORD):
            session["ok"] = True
            return view(*args, **kwargs)
        return jsonify({"error": "password required"}), 401

    return wrapper


@app.errorhandler(Exception)
def json_errors(exc):
    """Anything under /api answers in JSON, including crashes.

    Flask's default is an HTML error page, which the front end would surface
    to you as a wall of markup in a toast instead of the actual reason.
    """
    from werkzeug.exceptions import HTTPException

    code = exc.code if isinstance(exc, HTTPException) else 500
    if not request.path.startswith("/api/"):
        if isinstance(exc, HTTPException):
            return exc
        log.exception("Unhandled error on %s", request.path)
        return Response("Something broke. Check the logs.", status=500, mimetype="text/plain")

    if not isinstance(exc, HTTPException):
        log.exception("Unhandled error on %s %s", request.method, request.path)
    message = getattr(exc, "description", None) or str(exc) or "internal error"
    return jsonify({"error": message}), code


@app.post("/api/login")
def login():
    if not CONSOLE_PASSWORD:
        return jsonify({"ok": True, "required": False})
    supplied = (request.get_json(silent=True) or {}).get("password", "")
    if hmac.compare_digest(str(supplied), CONSOLE_PASSWORD):
        session["ok"] = True
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401


@app.get("/api/session")
def session_state():
    return jsonify({"required": bool(CONSOLE_PASSWORD), "ok": not CONSOLE_PASSWORD or session.get("ok") is True})


# ---------------------------------------------------------------------------
# Clients, made lazily so a cold start that never touches GCS stays fast
# ---------------------------------------------------------------------------


def gcs():
    from google.cloud import storage

    return storage.Client()


def secret_manager():
    from google.cloud import secretmanager

    return secretmanager.SecretManagerServiceClient()


def read_json_blob(path: str, default):
    try:
        blob = gcs().bucket(BUCKET).blob(path)
        return json.loads(blob.download_as_bytes().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        log.info("No readable %s yet: %s", path, exc)
        return default


def read_state() -> dict:
    return read_json_blob("state.json", {})


def mutate_json_blob(path: str, mutate, *, attempts: int = 4):
    """Read-modify-write a shared blob without trampling a concurrent writer.

    The agent writes state.json and actions.json on every run. Downloading one,
    editing it in memory and uploading the whole object -- which is what this
    replaces -- silently discards anything the agent wrote in between: the
    alerted and reported maps, the run timestamps, the counters. So confirming
    a single calendar item from the site could wipe the record of which mail
    had been summarised and make the next digest repeat all of it.

    `mutate` receives the document, edits it in place, and returns whatever the
    caller wants back. It may be called more than once, so it must not have
    side effects of its own.
    """
    from google.api_core import exceptions as gexc

    blob = gcs().bucket(BUCKET).blob(path)
    for attempt in range(1, attempts + 1):
        try:
            raw = blob.download_as_bytes()
            generation = blob.generation
            doc = json.loads(raw.decode("utf-8"))
            if not isinstance(doc, dict):
                raise ValueError(f"{path} is not a JSON object")
        except gexc.NotFound:
            doc, generation = {}, 0
        # A blob that exists but cannot be parsed is deliberately not handled:
        # overwriting it would destroy state the agent may still be using.

        result = mutate(doc)
        payload = json.dumps(doc, separators=(",", ":"))
        try:
            blob.upload_from_string(
                payload,
                content_type="application/json",
                if_generation_match=generation,
            )
            return result
        except gexc.PreconditionFailed:
            if attempt == attempts:
                raise
            log.info("%s changed underneath this write; re-reading (%d).", path, attempt)


# ---------------------------------------------------------------------------
# Tracker progress, shared across devices
# ---------------------------------------------------------------------------

PROGRESS_BLOB = "console/progress.json"
# A tick is a short id and a boolean. Tens of thousands of them still fit in
# well under this; anything larger is a bug or someone poking at the endpoint.
MAX_PROGRESS_BYTES = 512 * 1024


@app.get("/api/progress")
@protected
def progress_get():
    """Your ticked boxes, from the server rather than one browser.

    Returns 'updated_ts': 0 when nothing has ever been saved, which the page
    reads as "keep whatever this browser already had" on first sync.
    """
    doc = read_json_blob(PROGRESS_BLOB, {})
    return jsonify(
        {
            "data": doc.get("data") or {},
            "updated_ts": float(doc.get("updated_ts") or 0),
        }
    )


@app.put("/api/progress")
@protected
def progress_put():
    body = request.get_json(silent=True) or {}
    data = body.get("data")
    if not isinstance(data, dict):
        return jsonify({"error": "expected an object under 'data'"}), 400

    payload = json.dumps({"version": 1, "updated_ts": time.time(), "data": data},
                         separators=(",", ":"))
    if len(payload.encode("utf-8")) > MAX_PROGRESS_BYTES:
        return jsonify({"error": "progress payload too large"}), 413

    gcs().bucket(BUCKET).blob(PROGRESS_BLOB).upload_from_string(
        payload, content_type="application/json"
    )
    return jsonify({"updated_ts": json.loads(payload)["updated_ts"]})


# ---------------------------------------------------------------------------
# Curriculum, resolved. Lets the API and the MCP server talk about "the
# pandas topic" instead of the opaque id the page uses internally.
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent / "data"
_curriculum: dict | None = None


def _topic_id(text: str) -> str:
    """djb2, uint32, base36 -- byte-identical to hash() in src/app.js.

    The two MUST agree: the page writes progress keyed by this id and the API
    reads it back. tests/test_topic_ids.py pins them against ids captured
    from a real browser session, so a divergence fails rather than silently
    orphaning everyone's ticks.
    """
    h = 5381
    for ch in text:
        h = ((h << 5) + h + ord(ch)) & 0xFFFFFFFF
    if h == 0:
        return "0"
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = ""
    while h:
        out = digits[h % 36] + out
        h //= 36
    return out


def curriculum() -> dict:
    global _curriculum
    if _curriculum is not None:
        return _curriculum

    def read(name, fallback):
        try:
            return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            log.warning("Could not read %s: %s", name, exc)
            return fallback

    placement = read("placement.json", {"tracks": [], "ranks": []})
    mba = read("mba.json", {"phases": [], "excluded": []})

    topics = []
    for track in placement.get("tracks", []):
        for section in track.get("sections", []):
            for group in section.get("g", []):
                for label in group.get("i", []):
                    topics.append(
                        {
                            "id": _topic_id(f"{track['id']}|{section['n']}|{label}"),
                            "label": label,
                            "track": track["id"],
                            "track_label": track.get("label", track["id"]),
                            "section": section["n"],
                            "group": group.get("n", ""),
                            "rated": bool(track.get("rated")),
                        }
                    )

    mba_items = []
    for phase in mba.get("phases", []):
        for item in phase.get("items", []):
            mba_items.append({**item, "phase": phase.get("n"), "excluded": False})
    for item in mba.get("excluded", []):
        mba_items.append({**item, "phase": "EXCLUDED", "excluded": True})

    _curriculum = {"topics": topics, "mba_items": mba_items, "ranks": placement.get("ranks", [])}
    log.info("Curriculum: %d topics, %d MBA items.", len(topics), len(mba_items))
    return _curriculum


def _progress() -> dict:
    return (read_json_blob(PROGRESS_BLOB, {}) or {}).get("data") or {}


def _write_progress(data: dict) -> None:
    gcs().bucket(BUCKET).blob(PROGRESS_BLOB).upload_from_string(
        json.dumps({"version": 1, "updated_ts": time.time(), "data": data},
                   separators=(",", ":")),
        content_type="application/json",
    )


@app.get("/api/topics")
@protected
def topics_list():
    status = request.args.get("status", "all")
    track = request.args.get("track", "")
    query = request.args.get("q", "").strip().lower()
    limit = max(1, min(int(request.args.get("limit", 100)), 1000))

    checked = _progress().get("checked") or {}
    rows = []
    for t in curriculum()["topics"]:
        done = bool(checked.get(t["id"]))
        if status == "done" and not done:
            continue
        if status == "todo" and done:
            continue
        if track and t["track"] != track:
            continue
        if query and query not in t["label"].lower():
            continue
        rows.append({**t, "done": done})

    return jsonify({"total": len(rows), "topics": rows[:limit]})


@app.post("/api/topics/set")
@protected
def topics_set():
    body = request.get_json(silent=True) or {}
    ids = body.get("ids") or ([body["id"]] if body.get("id") else [])
    done = bool(body.get("done", True))
    if not ids:
        return jsonify({"error": "pass 'id' or 'ids'"}), 400

    known = {t["id"] for t in curriculum()["topics"]}
    unknown = [i for i in ids if i not in known]
    if unknown:
        return jsonify({"error": f"unknown topic ids: {unknown[:5]}"}), 400

    data = _progress()
    checked = data.setdefault("checked", {})
    for i in ids:
        if done:
            checked[i] = 1
        else:
            checked.pop(i, None)

    # Ticking anything counts towards the streak, exactly as the page does.
    if done:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        days = data.setdefault("days", [])
        if today not in days:
            days.append(today)

    _write_progress(data)
    return jsonify({"updated": len(ids), "done": done})


@app.get("/api/mba")
@protected
def mba_list():
    checked = _progress().get("mba") or {}
    rows = [
        {
            "id": i.get("id"),
            "task": i.get("task"),
            "date": i.get("date", ""),
            "phase": i.get("phase"),
            "tags": i.get("tags", []),
            "excluded": i.get("excluded", False),
            "done": bool(checked.get(i.get("id"))),
        }
        for i in curriculum()["mba_items"]
    ]
    return jsonify({"total": len(rows), "items": rows})


@app.post("/api/mba/set")
@protected
def mba_set():
    body = request.get_json(silent=True) or {}
    item_id = body.get("id", "")
    done = bool(body.get("done", True))
    if not any(i.get("id") == item_id for i in curriculum()["mba_items"]):
        return jsonify({"error": f"unknown MBA item {item_id!r}"}), 400

    data = _progress()
    mba = data.setdefault("mba", {})
    if done:
        mba[item_id] = 1
    else:
        mba.pop(item_id, None)
    _write_progress(data)
    return jsonify({"id": item_id, "done": done})


# ---------------------------------------------------------------------------
# Goals -- free-form, unlike the fixed curriculum above
# ---------------------------------------------------------------------------

GOALS_BLOB = "console/goals.json"
GOAL_STATUS = {"open", "done", "dropped"}
MAX_GOALS = 200


def _goals() -> list:
    doc = read_json_blob(GOALS_BLOB, {}) or {}
    items = doc.get("goals")
    return items if isinstance(items, list) else []


def _save_goals(items: list) -> None:
    gcs().bucket(BUCKET).blob(GOALS_BLOB).upload_from_string(
        json.dumps({"version": 1, "updated_ts": time.time(), "goals": items}, indent=2),
        content_type="application/json",
    )


@app.get("/api/goals")
@protected
def goals_list():
    status = request.args.get("status", "")
    items = _goals()
    if status:
        items = [g for g in items if g.get("status") == status]
    return jsonify({"total": len(items), "goals": items})


@app.post("/api/goals")
@protected
def goals_create():
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    items = _goals()
    if len(items) >= MAX_GOALS:
        return jsonify({"error": f"at most {MAX_GOALS} goals"}), 400

    goal = {
        "id": "g_" + pysecrets.token_hex(4),
        "title": title[:300],
        "detail": str(body.get("detail", ""))[:2000],
        "due": str(body.get("due", ""))[:10],
        "status": "open",
        # Recorded so you can always tell what you wrote from what an
        # assistant added on your behalf.
        "source": str(body.get("source", "you"))[:40],
        "created_ts": time.time(),
        "updated_ts": time.time(),
    }
    items.append(goal)
    _save_goals(items)
    log.info("Goal created: %s", goal["title"][:60])
    return jsonify(goal), 201


@app.patch("/api/goals/<goal_id>")
@protected
def goals_update(goal_id: str):
    body = request.get_json(silent=True) or {}
    items = _goals()
    for goal in items:
        if goal.get("id") != goal_id:
            continue
        if "title" in body:
            goal["title"] = str(body["title"])[:300]
        if "detail" in body:
            goal["detail"] = str(body["detail"])[:2000]
        if "due" in body:
            goal["due"] = str(body["due"])[:10]
        if "status" in body:
            if body["status"] not in GOAL_STATUS:
                return jsonify({"error": f"status must be one of {sorted(GOAL_STATUS)}"}), 400
            goal["status"] = body["status"]
        goal["updated_ts"] = time.time()
        _save_goals(items)
        return jsonify(goal)
    return jsonify({"error": f"no goal {goal_id!r}"}), 404


@app.delete("/api/goals/<goal_id>")
@protected
def goals_delete(goal_id: str):
    items = _goals()
    kept = [g for g in items if g.get("id") != goal_id]
    if len(kept) == len(items):
        return jsonify({"error": f"no goal {goal_id!r}"}), 404
    _save_goals(kept)
    return jsonify({"deleted": goal_id})


@app.get("/api/overview")
@protected
def overview():
    """Everything an assistant needs to open with, in one call."""
    data = _progress()
    checked = data.get("checked") or {}
    cur = curriculum()

    rated = [t for t in cur["topics"] if t["rated"]]
    done = sum(1 for t in rated if checked.get(t["id"]))
    total = len(rated)
    pct = (done / total * 100) if total else 0
    rating = round(800 + (pct / 100) * 2400)

    rank = ""
    for r in cur["ranks"]:
        if rating >= r.get("min", 0):
            rank = r.get("n", r.get("name", ""))

    mba_checked = data.get("mba") or {}
    today = datetime.now(timezone.utc).date()
    dated = [i for i in cur["mba_items"] if i.get("date")]
    missed = 0
    for item in dated:
        if mba_checked.get(item.get("id")):
            continue
        try:
            if datetime.strptime(item["date"], "%Y-%m-%d").date() < today:
                missed += 1
        except ValueError:
            continue
    integrity = round(100 - (missed / len(dated) * 100)) if dated else 100

    per_track: dict[str, dict] = {}
    for t in cur["topics"]:
        row = per_track.setdefault(t["track"], {"label": t["track_label"], "done": 0, "total": 0})
        row["total"] += 1
        if checked.get(t["id"]):
            row["done"] += 1

    return jsonify(
        {
            "mastery": {"rating": rating, "rank": rank, "done": done, "total": total,
                        "percent": round(pct, 1)},
            "window_integrity": {"percent": integrity, "missed": missed, "dated_items": len(dated)},
            "tracks": per_track,
            "goals_open": sum(1 for g in _goals() if g.get("status") == "open"),
            "streak_days": len(data.get("days") or []),
        }
    )


# ---------------------------------------------------------------------------
# Sent reports and run history
# ---------------------------------------------------------------------------


@app.get("/api/reports")
@protected
def reports_list():
    """What the agent has sent, newest first, plus how recent runs ended.

    Runs are included because a run that fails before sending produces no
    report and no email -- without this, "I clicked it and nothing happened"
    has no answer short of reading Cloud Logging.
    """
    index = read_json_blob("reports/index.json", {}) or {}
    runs = (read_json_blob("reports/runs.json", {}) or {}).get("runs") or []
    return jsonify(
        {
            "reports": (index.get("reports") or [])[:40],
            # Twenty covered about five hours, which is not long enough to
            # answer "I pressed the button this morning and got nothing".
            "runs": runs[:60],
        }
    )


@app.get("/api/state")
@protected
def state_debug():
    """A read-only look at the agent's state object.

    Its own writes have been going missing, and every way of checking that
    ran through gcloud -- so the symptom (stale numbers, repeated mail,
    calendar items that never appear) was visible while the cause was not.
    Counts and timestamps only; the message ids themselves are not interesting
    and there are thousands of them.
    """
    doc = read_state() or {}
    sizes = {
        key: len(doc.get(key) or {})
        for key in ("alerted", "reported", "starred", "proposals")
    }
    newest = {}
    for key in ("alerted", "reported", "starred"):
        values = [float(v) for v in (doc.get(key) or {}).values()]
        newest[key] = max(values) if values else 0
    return jsonify(
        {
            "present": bool(doc),
            "counts": sizes,
            "newest_entry_ts": newest,
            "last_digest_ts": doc.get("last_digest_ts", 0),
            "last_alert_ts": doc.get("last_alert_ts", 0),
            "last_cleanup_ts": doc.get("last_cleanup_ts", 0),
            "trashed_total": doc.get("trashed_total", 0),
            "events_created": doc.get("events_created", 0),
            "open_proposals": [
                {"token": t, "items": len(b.get("items") or []), "sent_ts": b.get("sent_ts", 0)}
                for t, b in (doc.get("proposals") or {}).items()
                if not b.get("resolved")
            ],
        }
    )


@app.get("/api/reports/<report_id>")
@protected
def report_body(report_id: str):
    """The archived HTML of one report, rendered in the page."""
    if not re.fullmatch(r"[0-9]+-[a-z-]+", report_id):
        return jsonify({"error": "bad report id"}), 400
    try:
        html = (
            gcs().bucket(BUCKET).blob(f"reports/{report_id}.html").download_as_bytes().decode("utf-8")
        )
    except Exception:  # noqa: BLE001
        return jsonify({"error": "no such report"}), 404
    # Served as a fragment for the page to sandbox in an iframe rather than
    # injecting: the body is agent-generated HTML built from email content.
    return Response(html, mimetype="text/html; charset=utf-8")


# ---------------------------------------------------------------------------
# Calendar: confirm proposals, or add something directly
# ---------------------------------------------------------------------------

ACTIONS_BLOB = "console/actions.json"


def _read_actions() -> list:
    doc = read_json_blob(ACTIONS_BLOB, {}) or {}
    items = doc.get("actions")
    return items if isinstance(items, list) else []


def _append_actions(new_items: list, *, skip_duplicate_of=None):
    """Add queued actions, keeping whatever the agent has written meanwhile.

    The agent updates the status of these same entries as it performs them, so
    a plain overwrite here could resurrect an action it had just marked done --
    and create the calendar event a second time.
    """
    def mutate(doc):
        items = doc.get("actions")
        items = items if isinstance(items, list) else []
        if skip_duplicate_of and any(skip_duplicate_of(a) for a in items):
            return None
        items.extend(new_items)
        doc["actions"] = items[-50:]
        return list(new_items)

    return mutate_json_blob(ACTIONS_BLOB, mutate)


@app.get("/api/proposals")
@protected
def proposals_list():
    """Calendar items the agent proposed and is still waiting on.

    Previously only answerable by replying to the digest email. Same
    underlying batches; this just surfaces them where you already are.
    """
    state = read_state()
    out = []
    for batch in (state.get("proposals") or {}).values():
        if batch.get("resolved"):
            continue
        out.append(
            {
                "token": batch.get("token"),
                "sent_ts": batch.get("sent_ts", 0),
                "items": [
                    {
                        "n": i.get("n"),
                        "title": i.get("title"),
                        "start": i.get("start"),
                        "end": i.get("end", ""),
                        "all_day": i.get("all_day", True),
                        "source_url": i.get("source_url", ""),
                    }
                    for i in (batch.get("items") or [])
                ],
            }
        )
    queued = _read_actions()
    return jsonify(
        {
            "batches": out,
            "queued": [a for a in queued if a.get("status") == "pending"],
            "recent": queued[-8:][::-1],
        }
    )


_WHEN = re.compile(r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$")


@app.post("/api/calendar/request")
@protected
def calendar_request():
    """Queue an event for the agent to create on its next sweep.

    The console cannot create it directly: that needs the OAuth token and the
    calendar scope, which stay with the job. Queuing keeps the privileged
    half of the work out of a service that is open to the internet.
    """
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()[:200]
    start = str(body.get("start", "")).strip()
    end = str(body.get("end", "")).strip()

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not _WHEN.match(start):
        return jsonify({"error": "start must be YYYY-MM-DD or YYYY-MM-DDTHH:MM"}), 400
    if end and not _WHEN.match(end):
        return jsonify({"error": "end must be YYYY-MM-DD or YYYY-MM-DDTHH:MM"}), 400
    if end and end < start:
        end = ""

    action = {
        "id": "a" + pysecrets.token_hex(4),
        "kind": "create_event",
        "title": title,
        "start": start,
        "end": end,
        "all_day": len(start) <= 10,
        "source_url": str(body.get("source_url", ""))[:500],
        "origin": str(body.get("origin", "site"))[:40],
        "status": "pending",
        "created_ts": time.time(),
    }
    # The duplicate check happens inside the same preconditioned write, so two
    # taps on the button cannot both pass it and queue the event twice.
    added = _append_actions(
        [action],
        skip_duplicate_of=lambda a: (
            a.get("status") == "pending"
            and a.get("title") == title
            and a.get("start") == start
        ),
    )
    if added is None:
        return jsonify({"error": "already queued"}), 409

    log.info("Queued calendar event: %s on %s", title[:60], start)
    return jsonify(action), 201


@app.post("/api/proposals/decide")
@protected
def proposals_decide():
    """Confirm or dismiss a proposed batch from the website.

    Confirmed items become queued create_event actions, which the agent
    performs on its next sweep with the credentials it already holds.
    """
    body = request.get_json(silent=True) or {}
    token = str(body.get("token", ""))
    track = body.get("track") or []
    if not isinstance(track, list):
        return jsonify({"error": "track must be a list of numbers"}), 400

    state = read_state()
    batch = (state.get("proposals") or {}).get(token)
    if not batch:
        return jsonify({"error": f"no open batch {token!r}"}), 404

    wanted = {int(n) for n in track if str(n).isdigit()}
    new_actions = []
    for item in batch.get("items") or []:
        if item.get("n") not in wanted:
            continue
        start = str(item.get("start", ""))
        if not _WHEN.match(start):
            continue
        new_actions.append(
            {
                "id": "a" + pysecrets.token_hex(4),
                "kind": "create_event",
                "title": str(item.get("title", ""))[:200],
                "start": start,
                "end": str(item.get("end", "")),
                "all_day": bool(item.get("all_day", True)),
                "source_url": str(item.get("source_url", ""))[:500],
                "origin": f"proposal:{token}",
                "status": "pending",
                "created_ts": time.time(),
            }
        )

    queued = len(new_actions)
    if queued:
        _append_actions(new_actions)

    # Close the batch either way -- deciding "none" is a decision, and the
    # agent should stop waiting for a reply to it.
    #
    # Through mutate_json_blob, because this is the agent's own state blob: it
    # also holds which messages have been alerted on and summarised. An
    # unconditional overwrite here would drop whatever the agent wrote while
    # the page was open, and the visible symptom would be the next digest
    # repeating mail you had already been sent.
    def resolve(doc):
        batches = doc.get("proposals") or {}
        if token not in batches:
            return False
        batches[token]["resolved"] = True
        doc["proposals"] = batches
        return True

    mutate_json_blob("state.json", resolve)

    log.info("Batch %s decided from the site: %d queued.", token, queued)
    return jsonify({"queued": queued, "token": token})


CF_BLOB = "console/codeforces.json"


@app.get("/api/codeforces")
@protected
def codeforces_stats():
    """Live rating, rank and next contest, refreshed at most hourly.

    The rank costs a 17 MB download of the whole rated list -- Codeforces
    publishes a rating and a title but no rank number, so the only way to know
    where you stand is to count the people above you. Fine once an hour,
    absurd on every page load, so the answer is cached in the bucket.

    Refreshed synchronously when stale rather than on a timer or a background
    thread: this service scales to zero and has its CPU throttled between
    requests, so a thread is not reliably alive to do the work. The page
    fetches this after it has already painted, so the wait costs a few late
    tiles once an hour and nothing else.
    """
    handle = (
        request.args.get("handle")
        or overlay_mod.load(BUCKET).get("cf_handle")
        or CF_HANDLE
        or ""
    ).strip()

    cached = read_json_blob(CF_BLOB, {}) or {}
    forced = request.args.get("refresh") == "1"
    changed = cached.get("handle", "").lower() != handle.lower()

    if not (forced or changed or cf_mod.is_stale(cached)):
        return jsonify(cached)

    fresh = cf_mod.refresh(handle)
    # A failed refresh keeps the last good answer rather than blanking the
    # tiles: a rating from 50 minutes ago is still true, and Codeforces being
    # briefly unreachable is not news.
    if fresh.get("error") and cached.get("rating") is not None and not changed:
        cached["error"] = fresh["error"]
        cached["stale"] = True
        if fresh.get("next_contest"):
            cached["next_contest"] = fresh["next_contest"]
        return jsonify(cached)

    try:
        gcs().bucket(BUCKET).blob(CF_BLOB).upload_from_string(
            json.dumps(fresh, separators=(",", ":")), content_type="application/json"
        )
    except Exception as exc:  # noqa: BLE001 -- caching is a convenience
        log.warning("Could not cache the Codeforces answer: %s", exc)
    return jsonify(fresh)


@app.get("/api/opportunities")
@protected
def opportunities():
    """The career feed the agent maintains, served live.

    The site used to read a build-time data/opportunities.json that was never
    generated, so the tab was permanently empty while the agent happily wrote
    entries here on every digest.
    """
    doc = read_json_blob("career/opportunities.json", {})
    items = doc.get("opportunities")
    return jsonify({"opportunities": items if isinstance(items, list) else []})


# ---------------------------------------------------------------------------
# Static site
# ---------------------------------------------------------------------------


@app.get("/")
@protected
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/healthz")
def healthz():
    return Response("ok", mimetype="text/plain")


@app.get("/<path:filename>")
@protected
def static_files(filename: str):
    target = (STATIC_DIR / filename).resolve()
    if not str(target).startswith(str(STATIC_DIR.resolve())) or not target.is_file():
        return jsonify({"error": "not found"}), 404
    return send_from_directory(STATIC_DIR, filename)


# ---------------------------------------------------------------------------
# Agent status and settings
# ---------------------------------------------------------------------------


def _known_accounts(over: dict) -> list[dict]:
    rows = []
    if PRIMARY_EMAIL:
        rows.append(
            {
                "key": "primary",
                "email": PRIMARY_EMAIL,
                "role": "primary",
                "can_send": True,
                "removable": False,
            }
        )
    if COLLEGE_EMAIL:
        rows.append(
            {
                "key": "college",
                "email": COLLEGE_EMAIL,
                "role": "read-only",
                "can_send": False,
                "removable": False,
            }
        )
    for extra in over.get("extra_accounts", []):
        rows.append(
            {
                "key": extra["key"],
                "email": extra["email"],
                "role": "read-only",
                "can_send": False,
                "removable": True,
            }
        )
    return rows


def _oauth_ready() -> bool:
    """Whether a web OAuth client has been stored yet.

    Connecting a mailbox is the one feature needing setup beyond the deploy,
    so the UI asks first rather than offering a button that cannot work.
    Everything else on the tab is unaffected by this being False.
    """
    if not PROJECT:
        return False
    try:
        secret_manager().get_secret(name=f"projects/{PROJECT}/secrets/{OAUTH_CLIENT_SECRET}")
        return True
    except Exception:  # noqa: BLE001 -- absent, or unreadable; same answer
        return False


@app.get("/api/status")
@protected
def api_status():
    state = read_state()
    over = overlay_mod.load(BUCKET)

    # Which build of each half is live. The site and the agent deploy as two
    # separate things from one build, so a build that fails partway leaves the
    # page updated and the agent running last week's code -- indistinguishable
    # from a fix that did not work, unless both versions are on screen.
    runs = (read_json_blob("reports/runs.json", {}) or {}).get("runs") or []
    agent_version = next((r.get("version") for r in runs if r.get("version")), "")

    return jsonify(
        {
            "accounts": _known_accounts(over),
            "console_version": APP_VERSION,
            "agent_version": agent_version,
            "versions_match": bool(
                agent_version and APP_VERSION and agent_version == APP_VERSION
            ),
            "oauth_ready": _oauth_ready(),
            "report_to": PRIMARY_EMAIL,
            "last_digest_ts": state.get("last_digest_ts", 0),
            "last_cleanup_ts": state.get("last_cleanup_ts", 0),
            "last_alert_ts": state.get("last_alert_ts", 0),
            "trashed_total": state.get("trashed_total", 0),
            "events_created": state.get("events_created", 0),
            "open_proposals": len(
                [b for b in (state.get("proposals") or {}).values() if not b.get("resolved")]
            ),
        }
    )


@app.get("/api/settings")
@protected
def api_settings_get():
    over, read_error = overlay_mod.load_with_status(BUCKET)
    derived = over.get("derived") or {}
    return jsonify(
        {
            # Empty unless a saved overlay exists and could not be read. An
            # empty form and an unreadable one look the same on screen, so the
            # page has to be told which it is -- otherwise it shows switches
            # that do not reflect what the agent is doing.
            "read_error": read_error,
            "instructions": over.get("instructions", ""),
            "dry_run": over.get("dry_run"),
            "cleanup_dry_run": over.get("cleanup_dry_run"),
            "paused": bool(over.get("paused", False)),
            "cf_handle": over.get("cf_handle", "") or CF_HANDLE,
            "updated_ts": over.get("updated_ts", 0),
            "max_instructions": overlay_mod.MAX_INSTRUCTIONS,
            # What the prose compiled to, in plain English, plus whether a
            # recompile is still pending so the page can say so rather than
            # showing stale rules as if they were current.
            "rules": rules_mod.describe(derived),
            "rules_note": derived.get("note", ""),
            "compiled_ts": over.get("compiled_ts", 0),
            "compile_pending": float(over.get("compile_requested_ts") or 0)
            > float(over.get("compiled_ts") or 0),
        }
    )


@app.put("/api/settings")
@protected
def api_settings_put():
    body = request.get_json(silent=True) or {}
    current, read_error = overlay_mod.load_with_status(BUCKET)
    if read_error:
        # Saving on top of a failed read would write defaults over whatever is
        # actually stored -- silently disconnecting extra mailboxes and
        # discarding the compiled rules. Refuse instead.
        return (
            jsonify(
                {
                    "error": "Your saved settings exist but could not be read, "
                    f"so nothing was changed ({read_error}). Saving now would "
                    "have overwritten them."
                }
            ),
            503,
        )

    # Only the three fields the UI owns. extra_accounts is managed by the
    # OAuth endpoints, so a hand-rolled PUT cannot inject a mailbox.
    merged = dict(current)
    if "instructions" in body:
        merged["instructions"] = body["instructions"]
        # Only ask for a recompile when the text actually changed. Flipping a
        # switch should not send the agent off to re-read the prose.
        if overlay_mod.sanitize_instructions(body["instructions"]) != current.get(
            "instructions", ""
        ):
            merged["compile_requested_ts"] = time.time()
    if "dry_run" in body:
        merged["dry_run"] = body["dry_run"]
    if "cleanup_dry_run" in body:
        merged["cleanup_dry_run"] = body["cleanup_dry_run"]
    if "cf_handle" in body:
        merged["cf_handle"] = body["cf_handle"]
    if "paused" in body:
        merged["paused"] = bool(body["paused"])
        log.warning("Agent %s from the website.",
                    "STOPPED" if merged["paused"] else "restarted")

    saved = overlay_mod.save(BUCKET, merged)
    log.info("Settings saved (%d chars of guidance).", len(saved["instructions"]))
    return jsonify(
        {
            "instructions": saved["instructions"],
            "dry_run": saved["dry_run"],
            "cleanup_dry_run": saved["cleanup_dry_run"],
            "paused": saved["paused"],
            "cf_handle": saved["cf_handle"],
            "updated_ts": saved["updated_ts"],
        }
    )


@app.post("/api/run")
@protected
def api_run():
    """Kick off a job execution now, instead of waiting for the schedule."""
    mode = (request.get_json(silent=True) or {}).get("mode", "digest")
    if mode not in {"digest", "sweep", "review", "cleanup", "check", "site-update"}:
        return jsonify({"error": f"unknown mode {mode!r}"}), 400

    # Every run started from here was asked for by a person looking at the
    # page, so it always reports back rather than staying quiet when there is
    # nothing new. And the cleanup button is labelled "show me what it would
    # bin", so it is pinned to read-only here rather than trusting whatever
    # the dry-run switch happens to be set to.
    argv = [f"--mode={mode}", "--manual"]
    if mode == "cleanup":
        argv.append("--preview")
    try:
        import google.auth
        from google.auth.transport.requests import AuthorizedSession

        creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        url = (
            f"https://{JOB_REGION}-run.googleapis.com/apis/run.googleapis.com/v1"
            f"/namespaces/{PROJECT}/jobs/{JOB_NAME}:run"
        )
        resp = AuthorizedSession(creds).post(
            url,
            json={"overrides": {"containerOverrides": [{"args": argv}]}},
            timeout=30,
        )
        if resp.status_code >= 300:
            return jsonify({"error": f"Cloud Run said {resp.status_code}: {resp.text[:300]}"}), 502
        return jsonify({"ok": True, "mode": mode})
    except Exception as exc:  # noqa: BLE001
        log.exception("Could not start the job")
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# Connecting another mailbox
# ---------------------------------------------------------------------------


def _oauth_client_config() -> dict:
    name = f"projects/{PROJECT}/secrets/{OAUTH_CLIENT_SECRET}/versions/latest"
    raw = secret_manager().access_secret_version(name=name).payload.data.decode("utf-8")
    return json.loads(raw)


def _redirect_uri() -> str:
    # Derived from the incoming request so the same image works on the
    # run.app URL and on a custom domain. Both must be registered on the
    # OAuth client, or Google rejects the round trip.
    root = request.url_root
    if root.startswith("http://") and not root.startswith("http://localhost"):
        root = "https://" + root[len("http://") :]
    return root.rstrip("/") + "/api/oauth/callback"


@app.get("/api/accounts/connect")
@protected
def accounts_connect():
    # A full-page navigation, not a fetch, so failures answer in HTML. A JSON
    # blob rendered raw in the address bar is not a useful error message.
    if not _oauth_ready():
        return _done_page(
            "No web OAuth client is set up yet, so mailboxes cannot be connected "
            "from here. Your existing mailboxes are unaffected and keep working. "
            "See console/README.md for the four-step setup."
        )
    try:
        from google_auth_oauthlib.flow import Flow

        flow = Flow.from_client_config(
            _oauth_client_config(), scopes=ACCOUNT_SCOPES, redirect_uri=_redirect_uri()
        )
        auth_url, state = flow.authorization_url(
            access_type="offline", prompt="consent", include_granted_scopes="true"
        )
        session["oauth_state"] = state
        return redirect(auth_url)
    except Exception as exc:  # noqa: BLE001
        log.exception("Could not start the OAuth flow")
        return _done_page(f"Could not start the connection: {exc}")


@app.get("/api/oauth/callback")
@protected
def oauth_callback():
    try:
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build

        flow = Flow.from_client_config(
            _oauth_client_config(),
            scopes=ACCOUNT_SCOPES,
            redirect_uri=_redirect_uri(),
            state=session.get("oauth_state"),
        )
        flow.fetch_token(authorization_response=request.url)
        creds = flow.credentials
        if not creds.refresh_token:
            return _done_page(
                "No refresh token came back. Remove this app at "
                "myaccount.google.com/permissions and try once more."
            )

        profile = build("gmail", "v1", credentials=creds).users().getProfile(userId="me").execute()
        email = profile.get("emailAddress", "").strip()
        if not email:
            return _done_page("Google did not tell us which mailbox that was.")

        over = overlay_mod.load(BUCKET)
        existing = {a["email"].lower() for a in _known_accounts(over)}
        if email.lower() in existing:
            return _done_page(f"{email} is already connected.")

        key = _SLUG.sub("-", email.split("@")[0].lower()).strip("-")[:24] or "mailbox"
        if key in overlay_mod.RESERVED_KEYS or any(
            a["key"] == key for a in over.get("extra_accounts", [])
        ):
            key = f"{key}-{pysecrets.token_hex(2)}"
        secret_name = f"inbox-agent-acct-{key}-token"

        _store_secret(
            secret_name,
            json.dumps(
                {
                    "account": key,
                    "refresh_token": creds.refresh_token,
                    "client_id": creds.client_id,
                    "client_secret": creds.client_secret,
                    "token_uri": creds.token_uri,
                    "scopes": ACCOUNT_SCOPES,
                },
                indent=2,
            ),
        )

        over.setdefault("extra_accounts", []).append(
            {"key": key, "email": email, "secret_name": secret_name}
        )
        saved = overlay_mod.save(BUCKET, over)
        if not any(a["email"] == email for a in saved["extra_accounts"]):
            return _done_page(f"{email} was rejected by validation and not connected.")

        log.info("Connected mailbox %s as %s", email, key)
        return _done_page(f"Connected {email}. It joins the next digest.")
    except Exception as exc:  # noqa: BLE001
        log.exception("OAuth callback failed")
        return _done_page(f"Could not connect that mailbox: {exc}")


def _store_secret(name: str, payload: str) -> None:
    from google.api_core import exceptions as gexc

    client = secret_manager()
    parent = f"projects/{PROJECT}"
    try:
        client.create_secret(
            parent=parent,
            secret_id=name,
            secret={"replication": {"automatic": {}}},
        )
    except gexc.AlreadyExists:
        pass
    client.add_secret_version(
        parent=f"{parent}/secrets/{name}",
        payload={"data": payload.encode("utf-8")},
    )


@app.post("/api/accounts/remove")
@protected
def accounts_remove():
    key = (request.get_json(silent=True) or {}).get("key", "")
    over = overlay_mod.load(BUCKET)
    before = len(over.get("extra_accounts", []))
    over["extra_accounts"] = [a for a in over.get("extra_accounts", []) if a["key"] != key]
    if len(over["extra_accounts"]) == before:
        return jsonify({"error": "no such mailbox, or it is not removable"}), 404
    overlay_mod.save(BUCKET, over)
    # The secret is deliberately left in place: removing the mailbox stops the
    # agent reading it, and a stale secret is easier to live with than a
    # deleted one you wanted back.
    log.info("Disconnected mailbox %s", key)
    return jsonify({"ok": True})


def _done_page(message: str) -> Response:
    body = f"""<!doctype html><meta charset="utf-8">
<title>Launch Console</title>
<style>
  body {{ font: 16px/1.6 system-ui, sans-serif; margin: 0; display: grid;
         place-items: center; min-height: 100vh; background: #0f1115; color: #e7e9ee; }}
  .card {{ max-width: 32rem; padding: 2rem; border: 1px solid #262a35;
           border-radius: 14px; background: #161922; }}
  a {{ color: #7aa2f7; }}
</style>
<div class="card"><p>{message}</p><p><a href="/#agent">Back to the console</a></p></div>"""
    return Response(body, mimetype="text/html")


# ---------------------------------------------------------------------------
# MCP over HTTP
#
# Same capabilities as the REST API above, shaped for assistants. Registered
# last so every helper it leans on already exists.
# ---------------------------------------------------------------------------


def _mcp_overview():
    with app.test_request_context():
        return overview().get_json()


def _mcp_topics(status, track, query, limit):
    checked = _progress().get("checked") or {}
    rows = []
    for t in curriculum()["topics"]:
        done = bool(checked.get(t["id"]))
        if status == "done" and not done:
            continue
        if status == "todo" and done:
            continue
        if track and t["track"] != track:
            continue
        if query and query.lower() not in t["label"].lower():
            continue
        rows.append({**t, "done": done})
    return {"total": len(rows), "topics": rows[: max(1, min(limit, 500))]}


def _mcp_set_topics(ids, done):
    known = {t["id"] for t in curriculum()["topics"]}
    unknown = [i for i in ids if i not in known]
    if unknown:
        return {"error": f"unknown topic ids: {unknown[:5]}"}
    data = _progress()
    checked = data.setdefault("checked", {})
    for i in ids:
        if done:
            checked[i] = 1
        else:
            checked.pop(i, None)
    if done:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        days = data.setdefault("days", [])
        if today not in days:
            days.append(today)
    _write_progress(data)
    return {"updated": len(ids), "done": done}


def _mcp_mba():
    checked = _progress().get("mba") or {}
    return {
        "items": [
            {"id": i.get("id"), "task": i.get("task"), "date": i.get("date", ""),
             "phase": i.get("phase"), "tags": i.get("tags", []),
             "excluded": i.get("excluded", False), "done": bool(checked.get(i.get("id")))}
            for i in curriculum()["mba_items"]
        ]
    }


def _mcp_set_mba(item_id, done):
    if not any(i.get("id") == item_id for i in curriculum()["mba_items"]):
        return {"error": f"unknown MBA item {item_id!r}"}
    data = _progress()
    mba = data.setdefault("mba", {})
    if done:
        mba[item_id] = 1
    else:
        mba.pop(item_id, None)
    _write_progress(data)
    return {"id": item_id, "done": done}


def _mcp_goals(status):
    items = _goals()
    if status:
        items = [g for g in items if g.get("status") == status]
    return {"total": len(items), "goals": items}


def _mcp_create_goal(title, detail, due):
    title = str(title).strip()
    if not title:
        return {"error": "title is required"}
    items = _goals()
    if len(items) >= MAX_GOALS:
        return {"error": f"at most {MAX_GOALS} goals"}
    goal = {
        "id": "g_" + pysecrets.token_hex(4),
        "title": title[:300], "detail": str(detail)[:2000], "due": str(due)[:10],
        "status": "open", "source": "ai",
        "created_ts": time.time(), "updated_ts": time.time(),
    }
    items.append(goal)
    _save_goals(items)
    return goal


def _mcp_update_goal(goal_id, fields):
    items = _goals()
    for goal in items:
        if goal.get("id") != goal_id:
            continue
        for key in ("title", "detail", "due", "status"):
            value = fields.get(key)
            if not value:
                continue
            if key == "status" and value not in GOAL_STATUS:
                return {"error": f"status must be one of {sorted(GOAL_STATUS)}"}
            goal[key] = str(value)
        goal["updated_ts"] = time.time()
        _save_goals(items)
        return goal
    return {"error": f"no goal {goal_id!r}"}


def _mcp_opportunities(limit):
    doc = read_json_blob("career/opportunities.json", {}) or {}
    items = doc.get("opportunities")
    items = items if isinstance(items, list) else []
    return {"total": len(items), "opportunities": items[: max(1, min(limit, 200))]}


def _mcp_settings():
    over, read_error = overlay_mod.load_with_status(BUCKET)
    return {
        "instructions": over.get("instructions", ""),
        "dry_run": over.get("dry_run"),
        "cleanup_dry_run": over.get("cleanup_dry_run"),
        "paused": bool(over.get("paused", False)),
        "updated_ts": over.get("updated_ts", 0),
        "rules": rules_mod.describe(over.get("derived") or {}),
        # Present only when the stored settings could not be read, so an
        # assistant reporting these back does not present defaults as fact.
        "read_error": read_error,
    }


def _mcp_set_instructions(text):
    current, read_error = overlay_mod.load_with_status(BUCKET)
    if read_error:
        raise RuntimeError(
            f"Saved settings exist but could not be read ({read_error}); "
            "nothing was changed, because saving would have overwritten them."
        )
    changed = overlay_mod.sanitize_instructions(text) != current.get("instructions", "")
    current["instructions"] = text
    if changed:
        # Without this the prose steers judgement but never compiles into
        # rules, so nothing gets starred or protected by what was written.
        current["compile_requested_ts"] = time.time()
    saved = overlay_mod.save(BUCKET, current)
    return {
        "instructions": saved["instructions"],
        "updated_ts": saved["updated_ts"],
        "compile_requested": changed,
    }


def _mcp_status():
    with app.test_request_context():
        return api_status().get_json()


def _mcp_proposals():
    with app.test_request_context():
        return proposals_list().get_json()


def _mcp_add_event(title, start, end, source_url):
    with app.test_request_context(
        json={"title": title, "start": start, "end": end,
              "source_url": source_url, "origin": "assistant"}
    ):
        result = calendar_request()
        body, status = (result if isinstance(result, tuple) else (result, 200))
        payload = body.get_json()
        return payload if status < 400 else {"error": payload.get("error", "failed")}


def _mcp_run_agent(mode):
    with app.test_request_context(json={"mode": mode}):
        result = api_run()
        body, status = (result if isinstance(result, tuple) else (result, 200))
        payload = body.get_json()
        return payload if status < 400 else {"error": payload.get("error", "failed")}


from mcp_http import build_blueprint  # noqa: E402

app.register_blueprint(
    build_blueprint(
        {
            "overview": _mcp_overview,
            "topics": _mcp_topics,
            "set_topics": _mcp_set_topics,
            "mba": _mcp_mba,
            "set_mba": _mcp_set_mba,
            "goals": _mcp_goals,
            "create_goal": _mcp_create_goal,
            "update_goal": _mcp_update_goal,
            "opportunities": _mcp_opportunities,
            "settings": _mcp_settings,
            "set_instructions": _mcp_set_instructions,
            "status": _mcp_status,
            "proposals": _mcp_proposals,
            "add_event": _mcp_add_event,
            "run_agent": _mcp_run_agent,
        },
        token=os.environ.get("MCP_TOKEN", ""),
    )
)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
