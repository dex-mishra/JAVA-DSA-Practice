"""MCP server for the Launch Console.

Lets an assistant read and change the same things you can from the website:
your placement, MBA and DSA progress, your goals, and the opportunities you
are tracking.

It is a thin client over the console's HTTP API rather than a second way into
the data. That is deliberate: validation, the id scheme, and the limits on
what may be changed all live in one place, so an assistant cannot reach
anything the page could not, and cannot corrupt state the page would reject.

    CONSOLE_URL=https://launch-console.<subdomain>.workers.dev python mcp/server.py

If the console is password-protected, also set CONSOLE_PASSWORD.

The inbox email agent that used to live behind this server is retired, and
every email_agent_ tool went with it. What remains is one system, not two,
so the disambiguating instructions that kept "tick an MBA box" from being
answered as a mail-agent request are no longer needed either.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

CONSOLE_URL = os.environ.get("CONSOLE_URL", "http://localhost:8080").rstrip("/")
CONSOLE_PASSWORD = os.environ.get("CONSOLE_PASSWORD", "")
TIMEOUT = float(os.environ.get("CONSOLE_TIMEOUT", "60"))

# The DSA problem index is baked into the page rather than served on its own,
# so it is read from the repo this server ships in.
DSA_INDEX = Path(__file__).resolve().parent.parent / "data" / "dsa" / "index.json"
DSA_STATUSES = {"todo", "solved", "revisit", "skimmed"}

mcp = FastMCP(
    "launch-console",
    instructions=(
        "A placement, MBA and DSA progress tracker: get_overview, "
        "list_topics, set_topics_done, list_mba_items, set_mba_item_done, "
        "add_mba_item, add_mba_tags, remove_mba_tags, delete_mba_item, "
        "restore_mba_item, list_goals, create_goal, update_goal, "
        "list_opportunities, add_opportunity, list_dsa_problems, "
        "get_dsa_problem, update_dsa_problem."
    ),
)


def _headers() -> dict[str, str]:
    h = {"Content-Type": "application/json"}
    if CONSOLE_PASSWORD:
        h["X-Console-Password"] = CONSOLE_PASSWORD
    return h


def _call(method: str, path: str, **kw) -> Any:
    """One HTTP call, with errors turned into something an assistant can read
    and act on rather than a stack trace."""
    url = f"{CONSOLE_URL}{path}"
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            resp = client.request(method, url, headers=_headers(), **kw)
    except httpx.RequestError as exc:
        return {"error": f"Could not reach the console at {CONSOLE_URL}: {exc}"}

    if resp.status_code == 401:
        return {"error": "The console needs a password. Set CONSOLE_PASSWORD."}
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("error", resp.text[:300])
        except Exception:  # noqa: BLE001
            detail = resp.text[:300]
        return {"error": f"{resp.status_code} from {path}: {detail}"}
    try:
        return resp.json()
    except Exception:  # noqa: BLE001
        return {"error": f"{path} did not return JSON"}


# ---------------------------------------------------------------------------
# Reading
# ---------------------------------------------------------------------------


@mcp.tool()
def get_overview() -> dict:
    """Where things stand overall: mastery rating and rank, topics cleared,
    MBA window integrity, per-track progress, open goal count, streak.

    Good first call — it gives enough context to answer most questions
    without listing anything."""
    return _call("GET", "/api/overview")


@mcp.tool()
def list_topics(
    status: str = "all", track: str = "", query: str = "", limit: int = 50
) -> dict:
    """Placement topics.

    status: all | todo | done
    track:  restrict to one track id (see get_overview's `tracks`)
    query:  case-insensitive substring of the topic name
    limit:  max returned (the total before truncation is always reported)
    """
    if status not in {"all", "todo", "done"}:
        return {"error": "status must be all, todo or done"}
    return _call(
        "GET",
        "/api/topics",
        params={"status": status, "track": track, "q": query, "limit": limit},
    )


@mcp.tool()
def list_mba_items() -> dict:
    """Every MBA commitment with its date, phase, tags and done state."""
    return _call("GET", "/api/mba")


@mcp.tool()
def list_opportunities(limit: int = 25) -> dict:
    """Internships and placement openings the inbox agent has extracted from
    your mail: company, role, deadline, stipend, apply link."""
    result = _call("GET", "/api/opportunities")
    if isinstance(result, dict) and isinstance(result.get("opportunities"), list):
        items = result["opportunities"]
        return {"total": len(items), "opportunities": items[:limit]}
    return result


@mcp.tool()
def set_topics_done(topic_ids: list[str], done: bool = True) -> dict:
    """Tick or untick placement topics, by id from list_topics.

    Ticking moves the mastery rating, so only mark what has genuinely been
    learned. Unknown ids are rejected outright rather than partially applied.
    """
    if not topic_ids:
        return {"error": "give at least one topic id"}
    return _call("POST", "/api/topics/set", json={"ids": topic_ids, "done": done})


@mcp.tool()
def set_mba_item_done(item_id: str, done: bool = True) -> dict:
    """Mark an MBA commitment done or not done, by id from list_mba_items."""
    return _call("POST", "/api/mba/set", json={"id": item_id, "done": done})


@mcp.tool()
def add_mba_item(task: str, date: str = "", phase: str = "", tags: list[str] | None = None) -> dict:
    """Add a brand new MBA commitment, alongside the built-in list.

    Shows up afterwards in list_mba_items with source="custom", and on the
    website itself -- not just to an assistant. `date` is YYYY-MM-DD or
    empty for no date; `phase` is a free label, default "CUSTOM"."""
    return _call(
        "POST", "/api/mba/create",
        json={"task": task, "date": date, "phase": phase, "tags": tags or []},
    )


@mcp.tool()
def add_mba_tags(item_id: str, tags: list[str]) -> dict:
    """Add tags to an MBA item, built-in or custom, by id.

    Free text: spaces and capitals are fine, up to 40 characters, and tags
    match without regard to case. The reply carries a `rejected` list -- if
    it is not empty, say so rather than reporting a clean success, because
    those tags were not saved."""
    return _call("POST", "/api/mba/tags", json={"id": item_id, "tags": tags})


@mcp.tool()
def remove_mba_tags(item_id: str, tags: list[str]) -> dict:
    """Remove tags from an MBA item, built-in or custom, by id -- including
    a tag the built-in list shipped with.

    That cannot rewrite the built-in data, so the tag is hidden rather than
    deleted; it looks identical either way."""
    return _call("POST", "/api/mba/tags/remove", json={"id": item_id, "tags": tags})


@mcp.tool()
def delete_mba_item(item_id: str) -> dict:
    """Remove an MBA item by id.

    A custom item you added is deleted outright. A built-in item ships
    with the site and comes back on the next deploy regardless, so it is
    instead moved into the EXCLUDED section -- reversible with
    restore_mba_item."""
    return _call("POST", "/api/mba/delete", json={"id": item_id})


@mcp.tool()
def restore_mba_item(item_id: str) -> dict:
    """Undo delete_mba_item on a built-in item -- brings it back out of the
    EXCLUDED section.

    Has no effect on a custom item, which was deleted outright rather than
    hidden."""
    return _call("POST", "/api/mba/exclude", json={"id": item_id, "excluded": False})


@mcp.tool()
def list_goals(status: str = "") -> dict:
    """Goals. Optionally filter by status: open, done, or dropped."""
    return _call("GET", "/api/goals", params={"status": status} if status else None)


@mcp.tool()
def create_goal(title: str, detail: str = "", due: str = "") -> dict:
    """Add a goal. `due` is YYYY-MM-DD, or empty for no date.

    Goals created here are tagged source="ai", so it stays obvious later
    which ones you wrote and which an assistant added for you."""
    return _call(
        "POST",
        "/api/goals",
        json={"title": title, "detail": detail, "due": due, "source": "ai"},
    )


@mcp.tool()
def update_goal(
    goal_id: str, title: str = "", detail: str = "", due: str = "", status: str = ""
) -> dict:
    """Change a goal. Only non-empty fields are applied, so you can move one
    to status="done" without restating its title."""
    body: dict[str, Any] = {}
    for key, value in (("title", title), ("detail", detail), ("due", due), ("status", status)):
        if value:
            body[key] = value
    if not body:
        return {"error": "nothing to change"}
    return _call("PATCH", f"/api/goals/{goal_id}", json=body)


@mcp.tool()
def add_opportunity(
    company: str = "",
    role: str = "",
    deadline: str = "",
    apply_url: str = "",
    location: str = "",
    stipend: str = "",
    summary: str = "",
) -> dict:
    """Add a placement or internship opportunity to the Opportunities tab.

    The inbox agent used to fill this tab by reading mail. It is retired, so
    anything worth tracking is added by hand -- from the page, or from here
    when an assistant is the one who spotted it.

    Give at least a company or a role. `deadline` is YYYY-MM-DD and puts the
    posting into the countdown spine alongside the MBA dates.
    """
    if not company.strip() and not role.strip():
        return {"error": "give at least a company or a role"}
    return _call(
        "POST",
        "/api/opportunities",
        json={
            "company": company, "role": role, "deadline": deadline,
            "apply_url": apply_url, "location": location,
            "stipend": stipend, "summary": summary,
        },
    )


# ---------------------------------------------------------------------------
# DSA plan
# ---------------------------------------------------------------------------


def _dsa_index() -> list[dict]:
    try:
        return json.loads(DSA_INDEX.read_text(encoding="utf-8"))["problems"]
    except (OSError, ValueError, KeyError):
        return []


@mcp.tool()
def list_dsa_problems(day: int = 0, status: str = "all", limit: int = 50) -> dict:
    """DSA plan problems with your progress on each.

    day:    plan day number, or 0 for every day
    status: all | todo | solved | revisit | skimmed
    limit:  max returned (the total before truncation is always reported)

    Each row carries the LeetCode link, difficulty, pattern and your status,
    minutes spent and next re-solve date."""
    if status != "all" and status not in DSA_STATUSES:
        return {"error": "status must be all, todo, solved, revisit or skimmed"}
    problems = _dsa_index()
    if not problems:
        return {"error": f"could not read the DSA index at {DSA_INDEX}"}
    progress = _call("GET", "/api/dsa/progress")
    if isinstance(progress, dict) and "error" in progress:
        return progress
    rows = progress.get("problems", {})
    out = []
    for p in problems:
        if day and p.get("day") != day:
            continue
        row = rows.get(p["id"], {})
        st = row.get("status", "todo")
        if status != "all" and st != status:
            continue
        out.append({
            "id": p["id"], "day": p.get("day"), "title": p.get("title"),
            "difficulty": p.get("difficulty"), "pattern": p.get("pattern"),
            "url": p.get("url"), "status": st,
            "minutes_spent": row.get("minutes_spent"),
            "next_resolve_on": row.get("next_resolve_on"),
        })
    return {"total": len(out), "today": progress.get("today"), "problems": out[:limit]}


@mcp.tool()
def get_dsa_problem(problem_id: str) -> dict:
    """One plan problem in full: every solving step (understand, analyse,
    brainstorm, algorithm, pseudocode, reference Java solution, dry run, edge
    cases, follow-ups), its sibling problems, and your saved progress."""
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            resp = client.get(f"{CONSOLE_URL}/data/dsa/problem/{problem_id}.json")
    except httpx.RequestError as exc:
        return {"error": f"Could not reach the console at {CONSOLE_URL}: {exc}"}
    if resp.status_code != 200 or "json" not in resp.headers.get("content-type", ""):
        return {"error": f"no written-up problem with id {problem_id!r} (only days with notes have one)"}
    doc = resp.json()
    progress = _call("GET", "/api/dsa/progress")
    if isinstance(progress, dict) and "problems" in progress:
        doc["progress"] = progress["problems"].get(problem_id, {"status": "todo"})
    return doc


@mcp.tool()
def update_dsa_problem(
    problem_id: str,
    status: str = "",
    minutes_spent: int = -1,
    notes: str = "",
    my_approach: str = "",
    confidence: int = 0,
) -> dict:
    """Record progress on a plan problem, by id from list_dsa_problems.

    status:        todo | solved | revisit | skimmed (solved and revisit
                   both move the mastery rating)
    minutes_spent: whole minutes, or -1 to leave unchanged
    notes, my_approach: replace the saved text when non-empty
    confidence:    1-5, or 0 to leave unchanged

    Only the fields you pass are changed."""
    body: dict[str, Any] = {}
    if status:
        if status not in DSA_STATUSES:
            return {"error": "status must be todo, solved, revisit or skimmed"}
        body["status"] = status
    if minutes_spent >= 0:
        body["minutes_spent"] = minutes_spent
    if notes:
        body["notes"] = notes
    if my_approach:
        body["my_approach"] = my_approach
    if confidence:
        body["confidence"] = confidence
    if not body:
        return {"error": "nothing to change"}
    return _call("PATCH", f"/api/dsa/progress/{problem_id}", json=body)


if __name__ == "__main__":
    mcp.run()
