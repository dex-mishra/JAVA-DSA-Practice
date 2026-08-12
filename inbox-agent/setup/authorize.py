#!/usr/bin/env python3
"""One-time OAuth for a mailbox. Run this on your laptop, once per account.

It opens a browser, you approve, and the resulting refresh token is written
straight into Secret Manager. The token never lands in a file you might later
commit.

    python setup/authorize.py --account primary --secret inbox-agent-primary-token
    python setup/authorize.py --account college --secret inbox-agent-college-token

Scopes are assigned by role, least privilege first:

    primary  gmail.modify + gmail.send   (reads, stars, trashes, sends reports)
    college  gmail.modify                (reads, stars, trashes -- cannot send)

Neither is `https://mail.google.com/`, so neither token can permanently delete
a message. That is the point.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys

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

    flow = InstalledAppFlow.from_client_secrets_file(args.client_secret, scopes)
    creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")

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