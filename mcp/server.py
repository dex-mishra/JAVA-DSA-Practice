"""MCP server for the Launch Console.

Lets an assistant read and change the same things you can from the website:
your placement and MBA progress, your goals, the inbox email agent's
instructions, and the opportunities it has found.

It is a thin client over the console's HTTP API rather than a second way into
the data. That is deliberate: validation, the id scheme, and the limits on
what may be changed all live in one place, so an assistant cannot reach
anything the page could not, and cannot corrupt state the page would reject.

    CONSOLE_URL=https://launch-console-xxxx.a.run.app python mcp/server.py

If the console is password-protected, also set CONSOLE_PASSWORD.

Two unrelated systems live here: the placement/MBA tracker, and the inbox
email agent (reads Gmail, sends summaries). Every email-agent tool is
prefixed email_agent_ -- flat, similarly-named tools ("settings", "status")
sitting next to the tracker's own is how a request to tick an MBA box got
answered as though it were about the mail agent instead.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

CONSOLE_URL = os.environ.get("CONSOLE_URL", "http://localhost:8080").rstrip("/")
CONSOLE_PASSWORD = os.environ.get("CONSOLE_PASSWORD", "")
TIMEOUT = float(os.environ.get("CONSOLE_TIMEOUT", "60"))

mcp = FastMCP(
    "launch-console",
    instructions=(
        "This server exposes TWO unrelated systems. Do not answer a request "
        "about one as though it were about the other.\n\n"
        "1. A placement/MBA progress tracker: get_overview, list_topics, "
        "set_topics_done, list_mba_items, set_mba_item_done, add_mba_item, "
        "add_mba_tags, delete_mba_item, list_goals, create_goal, "
        "update_goal, list_opportunities. Ticking a box, adding an MBA "
        "item or tagging one means one of these -- never an email_agent_ "
        "tool.\n\n"
        "2. An inbox email agent that reads Gmail and sends summaries -- "
        "every tool for it is prefixed email_agent_ (settings, status, "
        "calendar_proposals, add_calendar_event, run, set_instructions). "
        "A request about the tracker is never answered with one of these."
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
def email_agent_settings() -> dict:
    """The INBOX EMAIL AGENT's current free-text instructions, its two
    dry-run switches, and when the settings were last saved. Unrelated to
    the placement/MBA tracker."""
    return _call("GET", "/api/settings")


@mcp.tool()
def email_agent_status() -> dict:
    """Email agent activity: when it last sent a summary, last urgent
    alert, last junk sweep, which mailboxes it reads, and how many
    calendar items are waiting on your confirmation."""
    return _call("GET", "/api/status")


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------


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

    Additive only -- this can add a tag but never remove one already there.
    Lowercase letters, digits, - and _ only."""
    return _call("POST", "/api/mba/tags", json={"id": item_id, "tags": tags})


@mcp.tool()
def delete_mba_item(item_id: str) -> dict:
    """Remove a custom MBA item you added, by id.

    Only works on items with source="custom" -- the built-in list ships
    with the site and cannot be deleted from here."""
    return _call("POST", "/api/mba/delete", json={"id": item_id})


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
def email_agent_set_instructions(instructions: str) -> dict:
    """Replace the inbox email agent's instructions. Plain English; it
    reads these before every pass over your mail.

    This REPLACES the existing text rather than appending, so read
    email_agent_settings first if you mean to extend it. It steers
    judgement only — it cannot widen what the agent is permitted to do."""
    return _call("PUT", "/api/settings", json={"instructions": instructions})


@mcp.tool()
def email_agent_run(mode: str = "digest") -> dict:
    """Start an email agent run now instead of waiting for its schedule.
    Nothing to do with the placement/MBA tracker.

    digest  — summary of the last 3 days, emailed. 3-5 minutes.
    review  — reads the WHOLE inbox and emails one stocktake. 10-20 minutes.
    sweep   — checks the last few hours, emails only if urgent.
    cleanup — lists what it would bin, without binning.

    Returns as soon as the run starts; the result arrives by email.
    """
    if mode not in {"digest", "review", "sweep", "cleanup", "check", "site-update"}:
        return {"error": f"unknown mode {mode!r}"}
    return _call("POST", "/api/run", json={"mode": mode})


if __name__ == "__main__":
    mcp.run()
