"""Keeps a copy of everything the agent sends, and a log of every run.

Without this the only record of a run is Cloud Logging, which means "did my
full inbox review work?" is answered by learning gcloud. Worse, a run that
fails before it sends leaves no trace at all in the one place you look --
your inbox -- so it is indistinguishable from a run that never started.

Two small objects in the same bucket:

    reports/index.json   newest-first list of what was sent
    reports/<id>.html    the mail itself, so the console can show it back
    reports/runs.json    every run and how it ended, sent or not

Every write here is best-effort. Archiving is a convenience; failing to
archive must never stop a report actually going out.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

log = logging.getLogger(__name__)

INDEX_BLOB = "reports/index.json"
RUNS_BLOB = "reports/runs.json"

# Enough to cover a few weeks of four-a-day digests without the index
# turning into something you have to paginate.
MAX_REPORTS = 60
MAX_RUNS = 100


def _bucket(bucket_name: str, client: Any = None):
    from google.cloud import storage

    return (client or storage.Client()).bucket(bucket_name)


def _read(bucket_name: str, path: str, default, client: Any = None):
    try:
        return json.loads(_bucket(bucket_name, client).blob(path).download_as_bytes())
    except Exception:  # noqa: BLE001 -- absent or unreadable, same answer
        return default


def save_report(
    bucket_name: str,
    *,
    mode: str,
    subject: str,
    html: str,
    sent: bool,
    client: Any = None,
) -> str | None:
    """Archive one report. Returns its id, or None if archiving failed."""
    stamp = time.time()
    report_id = f"{int(stamp)}-{mode}"
    try:
        bucket = _bucket(bucket_name, client)
        bucket.blob(f"reports/{report_id}.html").upload_from_string(
            html, content_type="text/html; charset=utf-8"
        )

        index = _read(bucket_name, INDEX_BLOB, {"reports": []}, client)
        entries = index.get("reports") or []
        entries.insert(
            0,
            {
                "id": report_id,
                "mode": mode,
                "subject": subject,
                "ts": stamp,
                # False means it was produced but withheld -- dry run, or the
                # send failed. Worth showing differently in the console.
                "sent": bool(sent),
            },
        )

        dropped = entries[MAX_REPORTS:]
        entries = entries[:MAX_REPORTS]
        bucket.blob(INDEX_BLOB).upload_from_string(
            json.dumps({"reports": entries}, indent=2), content_type="application/json"
        )

        # Delete the bodies that fell off the end, or the bucket grows forever
        # holding HTML nothing links to any more.
        for old in dropped:
            try:
                bucket.blob(f"reports/{old['id']}.html").delete()
            except Exception:  # noqa: BLE001
                pass

        return report_id
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not archive the %s report: %s", mode, exc)
        return None


def log_run(
    bucket_name: str,
    *,
    mode: str,
    ok: bool,
    detail: str = "",
    report_id: str | None = None,
    started_ts: float | None = None,
    client: Any = None,
) -> None:
    """Record how a run ended, whether or not it sent anything."""
    try:
        finished = time.time()
        runs = _read(bucket_name, RUNS_BLOB, {"runs": []}, client).get("runs") or []
        runs.insert(
            0,
            {
                "mode": mode,
                "ok": bool(ok),
                "detail": detail[:400],
                "report_id": report_id,
                "started_ts": started_ts or finished,
                "finished_ts": finished,
                "seconds": round(finished - (started_ts or finished), 1),
            },
        )
        _bucket(bucket_name, client).blob(RUNS_BLOB).upload_from_string(
            json.dumps({"runs": runs[:MAX_RUNS]}, indent=2),
            content_type="application/json",
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not write the run log: %s", exc)
