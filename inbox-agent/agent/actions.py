"""Things the website asked the agent to do.

The console runs as its own service with its own identity. It cannot create
calendar events itself -- those need your OAuth token and the scope the job
holds, and duplicating that into a public web service would be the single
worst decision in this codebase.

So the console queues an intent here, and the next sweep (within 15 minutes)
performs it with the credentials that already exist for exactly this. Same
shape as the settings overlay: one small JSON object both sides can reach,
with the privileged half of the work staying in the job.

    console/actions.json

Each entry is claimed and marked terminal before the work is attempted, so a
crash mid-run cannot leave something to be retried forever.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

log = logging.getLogger(__name__)

BLOB_NAME = "console/actions.json"
MAX_PENDING = 50
# Anything older than this was queued and never picked up -- the agent was
# down, or the sweep is not running. Creating a calendar event a week late is
# worse than not creating it.
STALE_AFTER_HOURS = 48

_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_ISO_DATETIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$")


def _bucket(bucket_name: str, client: Any = None):
    from google.cloud import storage

    return (client or storage.Client()).bucket(bucket_name)


def load(bucket_name: str, client: Any = None) -> list[dict[str, Any]]:
    try:
        raw = _bucket(bucket_name, client).blob(BLOB_NAME).download_as_bytes()
        items = json.loads(raw).get("actions")
        return items if isinstance(items, list) else []
    except Exception:  # noqa: BLE001 -- absent is the normal case
        return []


def save(bucket_name: str, actions: list[dict[str, Any]], client: Any = None) -> None:
    _bucket(bucket_name, client).blob(BLOB_NAME).upload_from_string(
        json.dumps({"actions": actions[-MAX_PENDING:]}, indent=2),
        content_type="application/json",
    )


def valid_when(value: Any) -> str:
    """A date or a date-time, or empty. Same shapes the classifier emits."""
    text = str(value or "").strip()
    if _ISO_DATE.match(text) or _ISO_DATETIME.match(text):
        return text
    return ""


def make_event_action(
    *, title: str, start: str, end: str = "", source_url: str = "", origin: str = "site"
) -> dict[str, Any] | None:
    """Build one 'put this on the calendar' request, or None if unusable."""
    title = str(title or "").strip()[:200]
    start = valid_when(start)
    if not title or not start:
        return None
    end = valid_when(end)
    if end and end < start:
        end = ""
    return {
        "id": f"a{int(time.time() * 1000) % 10**10}",
        "kind": "create_event",
        "title": title,
        "start": start,
        "end": end,
        "all_day": len(start) <= 10,
        "source_url": str(source_url or "")[:500],
        "origin": origin,
        "status": "pending",
        "created_ts": time.time(),
    }


def pending(actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cutoff = time.time() - STALE_AFTER_HOURS * 3600
    return [
        a for a in actions
        if a.get("status") == "pending" and float(a.get("created_ts") or 0) >= cutoff
    ]


def expire_stale(actions: list[dict[str, Any]]) -> int:
    """Mark long-unclaimed requests failed rather than silently doing them
    days later. Returns how many were expired."""
    cutoff = time.time() - STALE_AFTER_HOURS * 3600
    n = 0
    for a in actions:
        if a.get("status") == "pending" and float(a.get("created_ts") or 0) < cutoff:
            a["status"] = "failed"
            a["detail"] = f"not picked up within {STALE_AFTER_HOURS}h"
            a["finished_ts"] = time.time()
            n += 1
    return n
