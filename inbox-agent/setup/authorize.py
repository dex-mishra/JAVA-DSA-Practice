#!/usr/bin/env python3
"""One-time OAuth for a mailbox. Run once per account, from Cloud Shell or a
laptop -- both work the same way here.

You visit a URL, approve, and paste back the page it lands on. The resulting
refresh token is written straight into Secret Manager; it never touches disk.

    python setup/authorize.py --account primary --secret inbox-agent-primary-token
    python setup/authorize.py --account college --secret inbox-agent-college-token

Scopes are assigned by role, least privilege first:

    primary  gmail.modify + gmail.send   (reads, stars, trashes, sends reports)
    college  gmail.modify                (reads, stars, trashes -- cannot send)

Neither is `https://mail.google.com/`, so neither token can permanently delete
a message. That is the point.

Why copy/paste instead of the library's automatic `run_local_server` flow:
that flow starts a web server and waits for Google to redirect your browser
back to `localhost:<port>`. That only works when the browser and the server
are the same machine. From Cloud Shell they are not -- the browser is on your
laptop, the listener is on a remote VM -- so the redirect always fails with
nothing on the other end, and the script hangs forever waiting for a
connection that cannot arrive. Exchanging the code by hand sidesteps the
problem entirely: the page Google redirects you to doesn't need to load, it
only needs to exist in your address bar long enough to copy.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = {
    "primary": [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.send",
        # Secondary calendars this app created, and nothing else. Not
        # calendar.events, which would grant your whole diary.
        "https://www.googleapis.com/auth/calendar.app.created",
    ],
    "college": [
        "https://www.googleapis.com/auth/gmail.modify",
    ],
}


def store_secret(project: str, name: str, payload: str) -> None:
    """Create the secret if needed, then add a version."""
    exists = subprocess.run(
        ["gcloud", "secrets", "describe", name, f"--project={project}"],
        capture_output=True,
    )
    if exists.returncode != 0:
        print(f"Creating secret {name} ...")
        subprocess.run(
            [
                "gcloud",
                "secrets",
                "create",
                name,
                "--replication-policy=automatic",
                f"--project={project}",
            ],
            check=True,
        )

    result = subprocess.run(
        ["gcloud", "secrets", "versions", "add", name, "--data-file=-", f"--project={project}"],
        input=payload.encode(),
        capture_output=True,
    )
    if result.returncode != 0:
        print(result.stderr.decode(), file=sys.stderr)
        raise SystemExit("Could not write the secret.")
    print(f"Stored a new version of {name}.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", required=True, choices=sorted(SCOPES))
    parser.add_argument("--secret", required=True, help="Secret Manager secret name")
    parser.add_argument("--project", required=True, help="GCP project id")
    parser.add_argument(
        "--client-secret",
        default="client_secret.json",
        help="OAuth client JSON downloaded from the GCP console",
    )
    parser.add_argument(
        "--print-only",
        action="store_true",
        help="Print the bundle instead of writing it to Secret Manager",
    )
    args = parser.parse_args()

    scopes = SCOPES[args.account]
    print(f"\nAuthorizing the '{args.account}' mailbox with scopes:")
    for scope in scopes:
        print(f"  - {scope}")
    print("\nSign in as the account you want the agent to read.")
    if args.account == "college":
        print(
            "If your university blocks third-party apps you will see "
            "'access blocked' here -- see the IMAP fallback in the README.\n"
        )

    # oauthlib refuses to process an http:// authorization_response URL
    # unless this is set -- normally invisible, since run_local_server() sets
    # it internally before calling fetch_token(). We call fetch_token()
    # directly, so it has to be set here or every exchange fails with
    # "InsecureTransportError: OAuth 2 MUST utilize https." before it even
    # looks at the code.
    #
    # Safe specifically because of what it does and doesn't affect: it only
    # relaxes the scheme check on the local, never-contacted placeholder URL
    # used to carry the code (http://localhost:8085/?code=...) -- nothing
    # ever connects to that URL, it exists only to be parsed. The actual
    # token exchange is a direct network call to Google's token endpoint,
    # hardcoded to https:// in the client library and unaffected by this.
    os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

    flow = InstalledAppFlow.from_client_secrets_file(args.client_secret, scopes)
    # A loopback address, per Google's "Desktop app" client rules -- Desktop
    # clients accept any port here without pre-registering it, and it never
    # needs to actually be reachable for this manual flow. Using an explicit
    # port rather than a bare "http://localhost" only because that is the
    # exact form already proven to work: it is what run_local_server used to
    # generate, and Google accepted it without a redirect_uri_mismatch error.
    flow.redirect_uri = "http://localhost:8085"

    auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")

    print("Open this URL and sign in as the account you want the agent to read:\n")
    print(f"  {auth_url}\n")
    print(
        "After you approve, Google sends the browser to a 'localhost' page\n"
        "that fails to load -- that is expected, not an error; nothing is\n"
        "listening there on purpose. Copy the FULL URL from the address bar\n"
        "at that point (it starts with http://localhost:8085/?state=...&code=...)\n"
        "and paste it below.\n"
    )

    pasted = input("Paste that URL here: ").strip()
    if not pasted:
        raise SystemExit("Nothing pasted; run this again.")
    if not pasted.startswith("http"):
        # Tolerate someone pasting just the query string rather than a full URL.
        pasted = "http://localhost:8085/?" + pasted.lstrip("?")

    try:
        flow.fetch_token(authorization_response=pasted)
    except Exception as exc:  # noqa: BLE001 -- surfaced to the user, not swallowed
        raise SystemExit(
            f"Could not exchange that code ({exc}). Codes are single-use and "
            "expire quickly -- run this script again for a fresh URL rather "
            "than reusing an old one."
        ) from exc

    creds = flow.credentials

    if not creds.refresh_token:
        raise SystemExit(
            "Google did not return a refresh token. Revoke the app at "
            "https://myaccount.google.com/permissions and run this again."
        )

    bundle = json.dumps(
        {
            "account": args.account,
            "refresh_token": creds.refresh_token,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "token_uri": creds.token_uri,
            "scopes": scopes,
            # When this was minted. An OAuth client in Testing publishing
            # status has its refresh tokens expired by Google after seven
            # days, so the agent uses this to warn you a couple of days out
            # -- while it can still send the warning.
            "created_ts": time.time(),
        },
        indent=2,
    )

    if args.print_only:
        print(bundle)
        return 0

    store_secret(args.project, args.secret, bundle)
    print("\nDone. Nothing sensitive was written to disk.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
