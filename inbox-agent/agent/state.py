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
    # message id -> unix ts the agent starred it. Without this the star rules
    # are re-evaluated from scratch every run, so unstarring something by hand
    # lasts until the next run and no longer -- the agent has no way to tell
    # "not starred yet" from "starred, and you took it off".
    "starred": {},
    # message id -> unix ts the sweep last classified it. The sweep only ever
    # marked a message once it *sent an alert* about it, so a quiet six-hour
    # window was re-read and re-classified every fifteen minutes -- twenty-four
    # times over, at model prices, for the same mail.
    "seen": {},
    # message id -> unix ts it was last offered as a calendar proposal, so the
    # same deadline is not proposed again in every digest.
    "proposed": {},
    # message id -> [times carried, unix ts of the last carry]. A still-open
    # item used to reappear in all four digests a day for the full three-day
    # window: twelve reminders for one email.
    "carries": {},
    "last_digest_ts": 0.0,
    "last_cleanup_ts": 0.0,
    "last_alert_ts": 0.0,
    "trashed_total": 0,
    "proposals": {},         # token -> ProposalBatch dict, awaiting your reply
    "events_created": 0,
}


def _blank() -> dict[str, Any]:
    """A fresh state dict that shares nothing with the template.

    `dict(_EMPTY)` is a shallow copy, so every state object built that way
    pointed at the *same* inner maps -- and the first `setdefault(...).update()`
    on a run that started with no saved blob wrote into the module-level
    default, where it stayed for the rest of the process.
    """
    return copy.deepcopy(_EMPTY)


def _carry_parts(record: Any) -> tuple[int, float]:
    """Read a carry record, tolerating anything a older or corrupted blob holds."""
    if isinstance(record, (list, tuple)) and len(record) >= 2:
        try:
            return int(record[0]), float(record[1])
        except (TypeError, ValueError):
            return 0, 0.0
    try:
        return 1, float(record)
    except (TypeError, ValueError):
        return 0, 0.0


def _carry_ts(record: Any) -> float:
    return _carry_parts(record)[1]


class State:
    def __init__(self, bucket_name: str, client: storage.Client | None = None):
        self._client = client or storage.Client()
        self._bucket = self._client.bucket(bucket_name)
        self._blob = self._bucket.blob(BLOB_NAME)
        self._generation: int | None = None
        self.data: dict[str, Any] = _blank()
        # What we loaded, kept so a concurrent write can be merged rather than
        # dropped: counters need the delta, not the absolute value.
        self._base: dict[str, Any] = _blank()

    def load(self) -> "State":
        try:
            raw = self._blob.download_as_bytes()
            self._generation = self._blob.generation
            loaded = json.loads(raw.decode("utf-8"))
            merged = _blank()
            merged.update(loaded)
            self.data = merged
            self._base = copy.deepcopy(merged)
        except gcs_exceptions.NotFound:
            log.info("No prior state at gs://%s/%s; starting fresh.", self._bucket.name, BLOB_NAME)
            self.data = _blank()
            self._base = _blank()
            self._generation = 0
        except (ValueError, UnicodeDecodeError):
            log.warning("State blob was unreadable; starting fresh rather than guessing.")
            self.data = _blank()
            self._base = _blank()
            self._generation = None
        return self

    def _fetch(self) -> tuple[dict[str, Any], int | None]:
        raw = self._blob.download_as_bytes()
        merged = _blank()
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

        for key in ("alerted", "reported", "starred", "seen", "proposed", "carries"):
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

    def save(self, attempts: int = 4) -> bool:
        """Write, merging rather than surrendering if another run got there
        first. Returns whether the write landed.

        The digest and the sweep were both scheduled on the hour, so they ran
        together four times a day. The loser used to log a warning and drop
        its write entirely -- which silently lost the digest timestamp and,
        worse, the record of which messages had been reported, so the next
        digest repeated them.

        Merging fixed the common case, but every remaining failure path here
        still ended in `return` -- a lost write that nothing recorded and
        nobody could see. A digest is fifteen minutes of work and its entire
        result lives in this one object, so the last resort is now to merge
        onto the newest copy and write without the precondition. That can only
        lose whatever landed in the milliseconds between that read and this
        write; giving up loses the whole run.
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
                return True
            except gcs_exceptions.PreconditionFailed:
                log.info(
                    "State changed underneath this run; merging and retrying (%d/%d).",
                    attempt, attempts,
                )
                if not self._remerge():
                    break
            except Exception as exc:  # noqa: BLE001 -- reported, not raised
                log.error("Could not write state: %s", exc)
                break

        return self._force_save()

    def _remerge(self) -> bool:
        """Re-read the blob and fold this run's changes onto it."""
        try:
            remote, generation = self._fetch()
        except Exception as exc:  # noqa: BLE001
            log.warning("Could not re-read state to merge: %s", exc)
            return False
        self.data = self._merge_onto(remote)
        # The merged data now carries the remote counters, so the remote
        # becomes the new baseline. Without this a second retry would compute
        # its delta against the original load and add this run's increment on
        # top of a total that already includes it.
        self._base = copy.deepcopy(remote)
        self._generation = generation
        return True

    def _force_save(self) -> bool:
        """Last resort: merge onto whatever is there now and write anyway.

        Reached only after the preconditioned attempts are exhausted. Losing a
        concurrent write is bad; losing the record of a fifteen-minute digest
        -- which mail was summarised, which calendar items are awaiting a
        reply -- is worse, and that is what the alternative costs.
        """
        self._remerge()
        try:
            self._blob.upload_from_string(
                json.dumps(self.data, separators=(",", ":"), sort_keys=True),
                content_type="application/json",
            )
            log.warning("State written without its precondition after contention.")
            return True
        except Exception as exc:  # noqa: BLE001
            log.error("STATE WRITE LOST -- this run's record is gone: %s", exc)
            return False

    def _prune(self) -> None:
        cutoff = time.time() - RETENTION_SECONDS
        for key in ("alerted", "reported", "starred", "seen", "proposed"):
            bucket = self.data.get(key, {})
            self.data[key] = {k: v for k, v in bucket.items() if float(v) >= cutoff}
        carries = self.data.get("carries", {})
        self.data["carries"] = {
            k: v for k, v in carries.items() if float(_carry_ts(v)) >= cutoff
        }

    # -- dedup helpers -----------------------------------------------------

    def already_alerted(self, message_id: str) -> bool:
        return message_id in self.data.get("alerted", {})

    def mark_alerted(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("alerted", {}).update({mid: now for mid in message_ids})
        self.data["last_alert_ts"] = now

    def already_reported(self, message_id: str) -> bool:
        return message_id in self.data.get("reported", {})

    def already_starred(self, message_id: str) -> bool:
        """True once the agent has starred this, whether or not it still is.

        Deliberately not a live check against Gmail: the question is not "is
        it starred now" but "have we already had our say about it". Re-reading
        the flag would make the agent undo an unstar every single run.
        """
        return message_id in self.data.get("starred", {})

    def mark_starred(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("starred", {}).update({mid: now for mid in message_ids})

    def already_seen(self, message_id: str) -> bool:
        """True once any sweep has classified this message.

        The sweep's job is to notice new mail that cannot wait. Once it has
        looked at a message and decided it is not urgent, looking again fifteen
        minutes later cannot change the answer -- the message has not changed.
        """
        return message_id in self.data.get("seen", {})

    def mark_seen(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("seen", {}).update({mid: now for mid in message_ids})

    def already_proposed(self, message_id: str) -> bool:
        return message_id in self.data.get("proposed", {})

    def mark_proposed(self, message_ids: list[str]) -> None:
        now = time.time()
        self.data.setdefault("proposed", {}).update({mid: now for mid in message_ids})

    def carry_allowed(self, message_id: str, *, cooldown_hours: float, limit: int) -> bool:
        """Whether a still-open item may be nudged about again.

        Two separate brakes, because they answer different complaints. The
        cooldown stops the same reminder arriving in every digest on the same
        day; the limit stops it arriving forever. Something you have ignored
        three days running is not going to be rescued by a fourth line of small
        print, and the cost of that line is that the whole section stops being
        read.
        """
        record = self.data.get("carries", {}).get(message_id)
        if not record:
            return True
        count, last = _carry_parts(record)
        if limit > 0 and count >= limit:
            return False
        return (time.time() - last) >= cooldown_hours * 3600

    def mark_carried(self, message_ids: list[str]) -> None:
        now = time.time()
        carries = self.data.setdefault("carries", {})
        for mid in message_ids:
            count, _ = _carry_parts(carries.get(mid))
            carries[mid] = [count + 1, now]

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
