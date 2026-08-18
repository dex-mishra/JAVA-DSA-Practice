"""Operator settings, written by the console and read by the job.

The console runs as a separate Cloud Run *Service* and cannot redeploy the
*Job*, so anything you change from the web UI has to live somewhere both
sides can reach. That is one small JSON object in the bucket the agent
already uses for state.

Reading it is best-effort on purpose. A missing, unreachable, or malformed
overlay leaves the agent running exactly as its baked-in `config.yaml` and
environment variables say. The console being broken must never be able to
stop the agent from doing its job.

What the overlay may and may not change is the important part. It can adjust
*judgement*: the free-text instructions steer how Gemini reads your mail, and
the dry-run switches decide whether the agent acts on what it finds. It
cannot touch the protections in `policy.py` -- the trash rules, the per-run
caps, the scope limits. Those stay in code, because they are what stands
between a bad instruction and a lost email.

This module deliberately imports nothing from the rest of the package: the
console depends on it, and the console has no business installing the Gemini
SDK just to save a text box.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

log = logging.getLogger(__name__)

BLOB_NAME = "console/settings.json"

# Free text is cheap to write and expensive to send: every run pays for these
# tokens on every batch. Long enough for real guidance, short enough that a
# pasted novel is rejected rather than quietly tripling the bill.
MAX_INSTRUCTIONS = 8000
MAX_ACCOUNTS = 8

# Must match classify.FENCE. Not imported, to keep this module free of the
# Gemini SDK for the console's sake -- tests/test_overlay.py asserts the two
# stay identical, so drift fails the suite instead of silently un-fencing
# email content.
FENCE_LITERAL = "<<<EMAIL_DATA>>>"

# Everything except tab and newline. Instructions are a textarea, so those two
# are legitimate; the rest is either a copy-paste artefact or an attempt to do
# something clever to the prompt.
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_KEY_OK = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")
_SECRET_OK = re.compile(r"^[a-zA-Z0-9_-]{1,255}$")
_EMAIL_OK = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Reserved: these two come from environment variables on the job itself, and
# the console must not be able to redefine them. In particular the primary
# account is the one allowed to send, and REPORT_TO follows from it.
RESERVED_KEYS = {"primary", "college"}

DEFAULTS: dict[str, Any] = {
    "version": 1,
    "instructions": "",
    # None means "no opinion, defer to the deployed configuration". This is
    # not the same as False, and conflating them would have the console
    # silently switch cleanup live the first time anyone saved the form.
    "dry_run": None,
    "cleanup_dry_run": None,
    # The stop button. True means every scheduled run exits immediately
    # without opening a mailbox -- not "act but change nothing", which is what
    # the dry-run switches do, but "do not look at my mail at all".
    #
    # A plain bool rather than a tristate: there is no deployed default to
    # defer to, and "off" has to mean off unambiguously.
    "paused": False,
    "extra_accounts": [],
    "updated_ts": 0.0,
    # Rules compiled from `instructions`. Written by the agent, read by both
    # sides. Kept separate from the prose so a failed compile leaves the
    # previous rules in force rather than wiping them.
    "derived": {},
    "compile_requested_ts": 0.0,
    "compiled_ts": 0.0,
}


def sanitize_instructions(text: Any) -> str:
    """Clean operator text for use inside the model's system instruction.

    This text is trusted -- you wrote it -- so the goal is not to defend
    against it. It is to stop an honest paste from breaking the framing that
    protects against *email* content: if the fence marker appeared here it
    could close the block that keeps third-party mail quarantined as data.
    """
    if not isinstance(text, str):
        return ""
    cleaned = _CONTROL.sub("", text)
    cleaned = cleaned.replace(FENCE_LITERAL, "[fence]")
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    return cleaned.strip()[:MAX_INSTRUCTIONS]


def _tristate(value: Any) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "on", "1"}:
            return True
        if lowered in {"false", "no", "off", "0"}:
            return False
    return None


def _clean_accounts(raw: Any) -> list[dict[str, str]]:
    """Keep only well-formed, non-reserved, non-duplicate mailbox entries."""
    if not isinstance(raw, list):
        return []
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if len(out) >= MAX_ACCOUNTS:
            break
        if not isinstance(item, dict):
            continue
        key = str(item.get("key", "")).strip().lower()
        email = str(item.get("email", "")).strip()
        secret = str(item.get("secret_name", "")).strip()
        if not _KEY_OK.match(key) or key in RESERVED_KEYS or key in seen:
            continue
        if not _EMAIL_OK.match(email) or not _SECRET_OK.match(secret):
            continue
        seen.add(key)
        out.append({"key": key, "email": email, "secret_name": secret})
    return out


def normalise(raw: Any) -> dict[str, Any]:
    """Coerce anything into a valid overlay. Never raises."""
    data = dict(DEFAULTS)
    if not isinstance(raw, dict):
        return data
    data["instructions"] = sanitize_instructions(raw.get("instructions"))
    data["dry_run"] = _tristate(raw.get("dry_run"))
    data["cleanup_dry_run"] = _tristate(raw.get("cleanup_dry_run"))
    data["paused"] = _tristate(raw.get("paused")) is True
    data["extra_accounts"] = _clean_accounts(raw.get("extra_accounts"))

    from . import rules as rules_mod

    data["derived"] = rules_mod.normalise(raw.get("derived"))
    for key in ("compile_requested_ts", "compiled_ts"):
        try:
            data[key] = float(raw.get(key) or 0.0)
        except (TypeError, ValueError):
            data[key] = 0.0
    try:
        data["updated_ts"] = float(raw.get("updated_ts") or 0.0)
    except (TypeError, ValueError):
        data["updated_ts"] = 0.0
    return data


def load_with_status(bucket_name: str, client: Any = None) -> tuple[dict[str, Any], str]:
    """Read the overlay, and say whether the read actually worked.

    Returns (settings, error). The error is empty both on success and when
    there is simply nothing saved yet -- but it is filled in when a saved
    overlay exists and could not be used.

    That distinction is the whole point of this function. "Nothing saved" and
    "saved, but unreadable" produce identical output and mean opposite things:
    the first honestly reports the deployed defaults, the second reports
    defaults while the job is reading something else entirely. Collapsing them
    is how the settings page came to show cleanup as preview-only while the
    agent had it switched on and was moving mail to Trash.
    """
    if not bucket_name:
        return dict(DEFAULTS), ""

    try:
        from google.cloud import storage

        gcs = client or storage.Client()
        blob = gcs.bucket(bucket_name).blob(BLOB_NAME)
        raw = blob.download_as_bytes().decode("utf-8")
    except Exception as exc:  # noqa: BLE001 -- deliberately total
        # Debug, not warning: no overlay is the normal state until the console
        # is first used, and this runs on every single job execution.
        log.debug("No console overlay (%s); using deployed config.", exc)
        return dict(DEFAULTS), ""

    try:
        return normalise(json.loads(raw)), ""
    except Exception as exc:  # noqa: BLE001
        log.error(
            "The console overlay exists but could not be read (%s); the agent "
            "is running on its deployed configuration instead.", exc
        )
        return dict(DEFAULTS), f"{type(exc).__name__}: {exc}"


def load(bucket_name: str, client: Any = None) -> dict[str, Any]:
    """Read the overlay. Any failure yields defaults, never an exception.

    Kept forgiving for the agent's sake: the console being broken must never
    stop the job from doing its work. Callers that display settings back to a
    person should use load_with_status instead, so a failed read is shown as a
    failure rather than as an empty form.
    """
    return load_with_status(bucket_name, client)[0]


def save(bucket_name: str, data: dict[str, Any], client: Any = None) -> dict[str, Any]:
    """Validate and persist. Returns what was actually written."""
    payload = normalise(data)
    payload["updated_ts"] = time.time()

    from google.cloud import storage

    gcs = client or storage.Client()
    blob = gcs.bucket(bucket_name).blob(BLOB_NAME)
    blob.upload_from_string(
        json.dumps(payload, indent=2, sort_keys=True),
        content_type="application/json",
    )
    return payload
