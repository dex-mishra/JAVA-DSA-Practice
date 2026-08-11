"""Tiny JSON state blob in GCS.

Holds only what the agent needs to avoid repeating itself: which messages it
has already alerted or reported on, and when each periodic task last ran.
Entries expire so the blob stays small.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from google.api_core import exceptions as gcs_exceptions
from google.cloud import storage

log = logging.getLogger(__name__)

BLOB_NAME = "state.json"
RETENTION_SECONDS = 21 * 24 * 3600

_EMPTY: dict[str, Any] = {
    "version": 1,
    "alerted": {},          # message id -> unix ts of the alert
    "reported": {},         # message id -> unix ts it appeared in a digest
    "last_digest_ts": 0.0,
    "last_cleanup_ts": 0.0,
    "last_alert_ts": 0.0,
    "trashed_total": 0,
}


class State:
    def __init__(self, bucket_name: str, client: storage.Client | None = None):
        self._client = client or storage.Client()
        self._bucket = self._client.bucket(bucket_name)
        self._blob = self._bucket.blob(BLOB_NAME)
        self._generation: int | None = None
        self.data: dict[str, Any] = dict(_EMPTY)

    def load(self) -> "State":
        try:
            raw = self._blob.download_as_bytes()
            self._generation = self._blob.generation
            loaded = json.loads(raw.decode("utf-8"))
            merged = dict(_EMPTY)
            merged.update(loaded)
            self.data = merged
        except gcs_exceptions.NotFound:
            log.info("No prior state at gs://%s/%s; starting fresh.", self._bucket.name, BLOB_NAME)
            self.data = dict(_EMPTY)
            self._generation = 0
        except (ValueError, UnicodeDecodeError):
            log.warning("State blob was unreadable; starting fresh rather than guessing.")
            self.data = dict(_EMPTY)
            self._generation = None
        return self

    def save(self) -> None:
        self._prune()
        payload = json.dumps(self.data, separators=(",", ":"), sort_keys=True)
        try:
            # if_generation_match makes overlapping runs fail loudly instead of
            # silently clobbering each other's dedup records.
            if self._generation is not None:
                self._blob.upload_from_string(
                    payload,
                    content_type="application/json",
                    if_generation_match=self._generation,
                )
            else:
                self._blob.upload_from_string(payload, content_type="application/json")
        except gcs_exceptions.PreconditionFailed:
            log.warning("State changed underneath this run (concurrent job?); skipping the write.")

    def _prune(self) -> None:
        cutoff = time.time() - RETENTION_SECONDS
        for key in ("alerted", "reported"):
            bucket = self.data.get(key, {})
            self.data[key] = {k: v for k, v in bucket.items() if float(v) >= cutoff}

    # -- dedup helpers -----------------------------------------------------

    def already_alerted(self, message_id: str) -> bool:
        return message_id in self.data.get("alerted", {})

    def mark_alerted(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("alerted", {}).update({mid: now for mid in message_ids})
        self.data["last_alert_ts"] = now

    def already_reported(self, message_id: str) -> bool:
        return message_id in self.data.get("reported", {})

    def mark_reported(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("reported", {}).update({mid: now for mid in message_ids})

    def seconds_since_last_alert(self) -> float:
        last = float(self.data.get("last_alert_ts") or 0)
        return time.time() - last if last else float("inf")

    def seconds_since_last_cleanup(self) -> float:
        last = float(self.data.get("last_cleanup_ts") or 0)
        return time.time() - last if last else float("inf")

    def mark_cleanup_ran(self, trashed: int) -> None:
        self.data["last_cleanup_ts"] = time.time()
        self.data["trashed_total"] = int(self.data.get("trashed_total", 0)) + trashed

    def mark_digest_sent(self) -> None:
        self.data["last_digest_ts"] = time.time()
