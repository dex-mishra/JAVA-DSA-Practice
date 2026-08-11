"""Career opportunity feed.

The agent is the producer; the career site (to be built once the repo lands)
is the consumer. Keeping this as a versioned JSON document in GCS means the
two halves stay decoupled -- the site can be rebuilt, moved or rewritten
without touching the agent.

Merge rule that matters: entries are keyed by Gmail message id, and any field
under `user` is preserved across runs. The agent owns what it extracted from
the mail; you own status, notes and priority. The agent must never clobber
your edits, because you will be editing these from the site.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from google.api_core import exceptions as gcs_exceptions
from google.cloud import storage

from .classify import Label
from .gmail import Message

log = logging.getLogger(__name__)

FEED_VERSION = 1

# Fields the site owns. The agent reads them, preserves them, never writes them.
USER_FIELDS = {
    "status": "new",       # new | interested | applied | shortlisted | rejected | offer | dropped
    "notes": "",
    "priority": 0,
    "archived": False,
}


def _iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(timespec="seconds")


def build_entry(msg: Message, label: Label) -> dict[str, Any]:
    """One opportunity, as extracted from a single message."""
    return {
        "id": msg.id,
        "account": msg.account,
        "company": label.career_company,
        "role": label.career_role,
        "kind": label.career_kind,
        "deadline": label.deadline_iso or "",
        "location": label.career_location,
        "stipend": label.career_stipend,
        "apply_url": label.career_apply_url,
        "summary": label.one_line,
        "source": {
            "subject": msg.subject,
            "sender": msg.sender,
            "received_at": _iso(msg.date_ts) if msg.date_ts else "",
            "gmail_url": msg.web_url,
        },
        "user": dict(USER_FIELDS),
        "first_seen": _iso(time.time()),
        "last_updated": _iso(time.time()),
    }


class CareerFeed:
    def __init__(self, bucket_name: str, object_path: str, client: storage.Client | None = None):
        self._client = client or storage.Client()
        self._blob = self._client.bucket(bucket_name).blob(object_path)
        self.doc: dict[str, Any] = {
            "version": FEED_VERSION,
            "generated_at": "",
            "opportunities": [],
        }

    def load(self) -> "CareerFeed":
        try:
            raw = self._blob.download_as_bytes()
            loaded = json.loads(raw.decode("utf-8"))
            if isinstance(loaded, dict) and isinstance(loaded.get("opportunities"), list):
                self.doc = loaded
        except gcs_exceptions.NotFound:
            log.info("No career feed yet; creating one.")
        except (ValueError, UnicodeDecodeError):
            log.warning("Career feed was unreadable; starting a new one.")
        return self

    def merge(self, entries: list[dict[str, Any]]) -> int:
        """Add new opportunities, refresh agent-owned fields on existing ones.

        Returns the count of genuinely new entries.
        """
        by_id = {e.get("id"): e for e in self.doc.get("opportunities", []) if isinstance(e, dict)}
        added = 0

        for entry in entries:
            existing = by_id.get(entry["id"])
            if existing is None:
                by_id[entry["id"]] = entry
                added += 1
                continue

            # Preserve everything the user owns, then refresh the rest.
            preserved = existing.get("user") or {}
            merged = dict(existing)
            for key, value in entry.items():
                if key in {"user", "first_seen"}:
                    continue
                # Do not overwrite a known value with an empty one.
                if value in ("", None) and merged.get(key):
                    continue
                merged[key] = value
            merged["user"] = {**dict(USER_FIELDS), **preserved}
            merged["last_updated"] = _iso(time.time())
            by_id[entry["id"]] = merged

        self.doc["opportunities"] = list(by_id.values())
        return added

    def prune(self, keep_days: int) -> int:
        """Drop stale entries, but never one you have engaged with."""
        if keep_days <= 0:
            return 0
        cutoff = time.time() - keep_days * 86400
        kept: list[dict[str, Any]] = []
        dropped = 0

        for entry in self.doc.get("opportunities", []):
            user = entry.get("user") or {}
            if user.get("status", "new") not in {"new", "dropped"} or user.get("notes"):
                kept.append(entry)
                continue
            stamp = entry.get("first_seen") or ""
            try:
                seen = datetime.fromisoformat(stamp).timestamp()
            except (ValueError, TypeError):
                kept.append(entry)
                continue
            if seen >= cutoff:
                kept.append(entry)
            else:
                dropped += 1

        self.doc["opportunities"] = kept
        return dropped

    def save(self) -> None:
        self.doc["version"] = FEED_VERSION
        self.doc["generated_at"] = _iso(time.time())
        self.doc["opportunities"].sort(
            key=lambda e: (e.get("deadline") or "9999-12-31", e.get("first_seen") or "")
        )
        payload = json.dumps(self.doc, indent=2, sort_keys=False)
        self._blob.upload_from_string(payload, content_type="application/json")
        log.info("Career feed saved: %d opportunities.", len(self.doc["opportunities"]))

    def upcoming(self, limit: int = 8) -> list[dict[str, Any]]:
        """Open opportunities with a future deadline, soonest first."""
        today = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
        live = [
            e
            for e in self.doc.get("opportunities", [])
            if (e.get("user") or {}).get("status", "new") in {"new", "interested", "applied"}
            and not (e.get("user") or {}).get("archived")
            and (e.get("deadline") or "") >= today
        ]
        live.sort(key=lambda e: e.get("deadline") or "9999-12-31")
        return live[:limit]
