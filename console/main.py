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
from functools import wraps
from pathlib import Path

from flask import Flask, Response, jsonify, redirect, request, send_from_directory, session

# The overlay schema is shared with the agent so both sides validate
# identically. Vendored onto the path rather than duplicated.
sys.path.insert(0, str(Path(__file__).parent / "_agent"))
import overlay as overlay_mod  # noqa: E402

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


def read_state() -> dict:
    try:
        blob = gcs().bucket(BUCKET).blob("state.json")
        return json.loads(blob.download_as_bytes().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        log.info("No readable state.json yet: %s", exc)
        return {}


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
    return jsonify(
        {
            "accounts": _known_accounts(over),
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
    over = overlay_mod.load(BUCKET)
    return jsonify(
        {
            "instructions": over.get("instructions", ""),
            "dry_run": over.get("dry_run"),
            "cleanup_dry_run": over.get("cleanup_dry_run"),
            "updated_ts": over.get("updated_ts", 0),
            "max_instructions": overlay_mod.MAX_INSTRUCTIONS,
        }
    )


@app.put("/api/settings")
@protected
def api_settings_put():
    body = request.get_json(silent=True) or {}
    current = overlay_mod.load(BUCKET)
    # Only the three fields the UI owns. extra_accounts is managed by the
    # OAuth endpoints, so a hand-rolled PUT cannot inject a mailbox.
    merged = dict(current)
    if "instructions" in body:
        merged["instructions"] = body["instructions"]
    if "dry_run" in body:
        merged["dry_run"] = body["dry_run"]
    if "cleanup_dry_run" in body:
        merged["cleanup_dry_run"] = body["cleanup_dry_run"]

    saved = overlay_mod.save(BUCKET, merged)
    log.info("Settings saved (%d chars of guidance).", len(saved["instructions"]))
    return jsonify(
        {
            "instructions": saved["instructions"],
            "dry_run": saved["dry_run"],
            "cleanup_dry_run": saved["cleanup_dry_run"],
            "updated_ts": saved["updated_ts"],
        }
    )


@app.post("/api/run")
@protected
def api_run():
    """Kick off a job execution now, instead of waiting for the schedule."""
    mode = (request.get_json(silent=True) or {}).get("mode", "digest")
    if mode not in {"digest", "sweep", "cleanup", "check", "site-update"}:
        return jsonify({"error": f"unknown mode {mode!r}"}), 400
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
            json={"overrides": {"containerOverrides": [{"args": [f"--mode={mode}"]}]}},
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
