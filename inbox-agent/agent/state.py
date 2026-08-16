"""Tiny JSON state blob in GCS.

Holds only what the agent needs to avoid repeating itself: which messages it
has already alerted or reported on, and when each periodic task last ran.
Entries expire so the blob stays small.
"""

from __future__ import annotations

import copy
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
    "proposals": {},         # token -> ProposalBatch dict, awaiting your reply
    "events_created": 0,
}


class State:
    def __init__(self, bucket_name: str, client: storage.Client | None = None):
        self._client = client or storage.Client()
        self._bucket = self._client.bucket(bucket_name)
        self._blob = self._bucket.blob(BLOB_NAME)
        self._generation: int | None = None
        self.data: dict[str, Any] = dict(_EMPTY)
        # What we loaded, kept so a concurrent write can be merged rather than
        # dropped: counters need the delta, not the absolute value.
        self._base: dict[str, Any] = dict(_EMPTY)

    def load(self) -> "State":
        try:
            raw = self._blob.download_as_bytes()
            self._generation = self._blob.generation
            loaded = json.loads(raw.decode("utf-8"))
            merged = dict(_EMPTY)
            merged.update(loaded)
            self.data = merged
            self._base = copy.deepcopy(merged)
        except gcs_exceptions.NotFound:
            log.info("No prior state at gs://%s/%s; starting fresh.", self._bucket.name, BLOB_NAME)
            self.data = dict(_EMPTY)
            self._base = dict(_EMPTY)
            self._generation = 0
        except (ValueError, UnicodeDecodeError):
            log.warning("State blob was unreadable; starting fresh rather than guessing.")
            self.data = dict(_EMPTY)
            self._base = dict(_EMPTY)
            self._generation = None
        return self

    def _fetch(self) -> tuple[dict[str, Any], int | None]:
        raw = self._blob.download_as_bytes()
        merged = dict(_EMPTY)
        merged.update(json.loads(raw.decode("utf-8")))
        return merged, self._blob.generation

    def _merge_onto(self, remote: dict[str, Any]) -> dict[str, Any]:
        """Fold this run's changes into state written by another run.

        Every field here has an obvious combining rule, which is why merging
        beats picking a winner: the id maps are unions, the timestamps are
        high-water marks, and the counters are sums -- so a counter is applied
        as the delta this run produced, never as its absolute value, or a
        concurrent run's increment would be erased.
        """
        merged = dict(remote)

        for key in ("alerted", "reported"):
            combined = dict(remote.get(key) or {})
            combined.update(self.data.get(key) or {})
            merged[key] = combined

        # Ours wins per token: resolving a batch must not be undone by a run
        # that still saw it open.
        batches = dict(remote.get("proposals") or {})
        batches.update(self.data.get("proposals") or {})
        merged["proposals"] = batches

        for key in ("last_digest_ts", "last_cleanup_ts", "last_alert_ts"):
            merged[key] = max(
                float(remote.get(key) or 0), float(self.data.get(key) or 0)
            )

        for key in ("trashed_total", "events_created"):
            delta = int(self.data.get(key, 0)) - int(self._base.get(key, 0))
            merged[key] = int(remote.get(key, 0)) + max(0, delta)

        merged["version"] = self.data.get("version", 1)
        return merged

    def save(self, attempts: int = 3) -> None:
        """Write, merging rather than surrendering if another run got there
        first.

        The digest and the sweep were both scheduled on the hour, so they ran
        together four times a day. The loser used to log a warning and drop
        its write entirely -- which silently lost the digest timestamp and,
        worse, the record of which messages had been reported, so the next
        digest repeated them.
        """
        self._prune()
        for attempt in range(1, attempts + 1):
            payload = json.dumps(self.data, separators=(",", ":"), sort_keys=True)
            try:
                if self._generation is not None:
                    self._blob.upload_from_string(
                        payload,
                        content_type="application/json",
                        if_generation_match=self._generation,
                    )
                else:
                    self._blob.upload_from_string(payload, content_type="application/json")
                return
            except gcs_exceptions.PreconditionFailed:
                if attempt == attempts:
                    log.error(
                        "State contended %d times; giving up on this write.", attempts
                    )
                    return
                log.info("State changed underneath this run; merging and retrying.")
                try:
                    remote, generation = self._fetch()
                except Exception as exc:  # noqa: BLE001
                    log.warning("Could not re-read state to merge: %s", exc)
                    return
                self.data = self._merge_onto(remote)
                # The merged data now carries the remote counters, so the
                # remote becomes the new baseline. Without this a second
                # retry would compute its delta against the original load and
                # add this run's increment on top of a total that already
                # includes it.
                self._base = copy.deepcopy(remote)
                self._generation = generation

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

    # -- calendar proposals ------------------------------------------------

    def open_batches(self, expiry_hours: float) -> list[dict[str, Any]]:
        """Unresolved proposal batches still inside their reply window."""
        cutoff = time.time() - expiry_hours * 3600
        out = []
        for batch in self.data.get("proposals", {}).values():
            if batch.get("resolved"):
                continue
            if float(batch.get("sent_ts") or 0) < cutoff:
                continue
            out.append(batch)
        return out

    def put_batch(self, batch: dict[str, Any]) -> None:
        self.data.setdefault("proposals", {})[batch["token"]] = batch

    def resolve_batch(self, token: str) -> None:
        batch = self.data.get("proposals", {}).get(token)
        if batch:
            batch["resolved"] = True

    def prune_batches(self, expiry_hours: float) -> int:
        """Drop resolved or long-expired batches. Returns how many went."""
        cutoff = time.time() - max(expiry_hours * 3600, RETENTION_SECONDS / 21)
        batches = self.data.get("proposals", {})
        keep = {
            token: b
            for token, b in batches.items()
            if not b.get("resolved") and float(b.get("sent_ts") or 0) >= cutoff
        }
        dropped = len(batches) - len(keep)
        self.data["proposals"] = keep
        return dropped

    def count_events(self, n: int) -> None:
        self.data["events_created"] = int(self.data.get("events_created", 0)) + n
