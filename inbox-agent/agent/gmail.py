"""Gmail access for one account.

Scope note, and it is the load-bearing safety property of this whole project:
we request `gmail.modify`, never `https://mail.google.com/`. A token with
gmail.modify physically cannot permanently delete a message -- the strongest
thing it can do is move it to Trash, where Gmail keeps it for 30 days. That
ceiling is enforced by Google, not by the code below.
"""

from __future__ import annotations

import base64
import json
import logging
import re
import time
from dataclasses import dataclass, field
from email.message import EmailMessage
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from typing import Any, Iterable

from google.auth.transport.requests import Request
from google.cloud import secretmanager
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

log = logging.getLogger(__name__)

# Read + modify + trash. Deliberately excludes the full-access scope.
SCOPES_READ_MODIFY = ["https://www.googleapis.com/auth/gmail.modify"]
SCOPES_SEND = ["https://www.googleapis.com/auth/gmail.send"]

_NOREPLY = re.compile(r"(no[-_.]?reply|donotreply|do-not-reply|notifications?@|mailer@|bounce)", re.I)
_EMAIL_IN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_WS = re.compile(r"[ \t\r\f\v]+")
_NEWLINES = re.compile(r"\n{3,}")


class _Stripper(HTMLParser):
    """Minimal HTML-to-text. Good enough to give the model something readable."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs: Any) -> None:
        if tag in {"script", "style", "head"}:
            self._skip += 1
        elif tag in {"br", "p", "div", "tr", "li", "h1", "h2", "h3"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "head"} and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip:
            self.parts.append(data)

    def text(self) -> str:
        return "".join(self.parts)


def html_to_text(html: str) -> str:
    parser = _Stripper()
    try:
        parser.feed(html)
        parser.close()
    except Exception:  # malformed HTML is extremely common in bulk mail
        return re.sub(r"<[^>]+>", " ", html)
    return parser.text()


def normalize_ws(text: str) -> str:
    return _NEWLINES.sub("\n\n", _WS.sub(" ", text)).strip()


@dataclass
class Message:
    """A single message, flattened into what the policy layer needs."""

    id: str
    thread_id: str
    account: str
    subject: str
    sender: str
    sender_email: str
    to: str
    date_ts: float
    snippet: str
    body: str
    label_ids: list[str] = field(default_factory=list)
    headers: dict[str, str] = field(default_factory=dict)
    web_url: str = ""

    @property
    def sender_domain(self) -> str:
        _, _, domain = self.sender_email.partition("@")
        return domain.lower()

    @property
    def age_days(self) -> float:
        if not self.date_ts:
            return 0.0
        return (time.time() - self.date_ts) / 86400.0

    @property
    def is_bulk(self) -> bool:
        """True for mailing lists, marketing blasts and machine notifications."""
        h = {k.lower(): v for k, v in self.headers.items()}
        if h.get("list-id") or h.get("list-unsubscribe"):
            return True
        if h.get("precedence", "").lower() in {"bulk", "list", "junk"}:
            return True
        if h.get("auto-submitted", "").lower() not in {"", "no"}:
            return True
        if _NOREPLY.search(self.sender_email or ""):
            return True
        return bool({"CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL"} & set(self.label_ids))

    @property
    def is_starred(self) -> bool:
        return "STARRED" in self.label_ids

    @property
    def is_unread(self) -> bool:
        return "UNREAD" in self.label_ids

    def searchable(self) -> str:
        return f"{self.subject}\n{self.sender}\n{self.snippet}".lower()


def load_credentials(project: str, secret_name: str) -> Credentials:
    """Pull the stored OAuth bundle out of Secret Manager and refresh it."""
    client = secretmanager.SecretManagerServiceClient()
    path = f"projects/{project}/secrets/{secret_name}/versions/latest"
    payload = client.access_secret_version(request={"name": path}).payload.data.decode("utf-8")
    info = json.loads(payload)

    creds = Credentials(
        token=None,
        refresh_token=info["refresh_token"],
        client_id=info["client_id"],
        client_secret=info["client_secret"],
        token_uri=info.get("token_uri", "https://oauth2.googleapis.com/token"),
        scopes=info.get("scopes", SCOPES_READ_MODIFY),
    )
    creds.refresh(Request())
    return creds


class GmailClient:
    def __init__(self, account_key: str, email: str, project: str, secret_name: str):
        self.account_key = account_key
        self.email = email
        creds = load_credentials(project, secret_name)
        self.service = build("gmail", "v1", credentials=creds, cache_discovery=False)
        self._thread_sent_cache: dict[str, bool] = {}
        self._label_cache: dict[str, str] | None = None

    # -- reading -----------------------------------------------------------

    def search_ids(self, query: str, limit: int) -> list[str]:
        ids: list[str] = []
        page_token = None
        while len(ids) < limit:
            resp = _retry(
                lambda: self.service.users()
                .messages()
                .list(
                    userId="me",
                    q=query,
                    maxResults=min(500, limit - len(ids)),
                    pageToken=page_token,
                )
                .execute()
            )
            ids.extend(m["id"] for m in resp.get("messages", []))
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
        log.info("[%s] %d hits for: %s", self.account_key, len(ids), query)
        return ids[:limit]

    def fetch(self, message_ids: Iterable[str], body_chars: int) -> list[Message]:
        out: list[Message] = []
        for mid in message_ids:
            try:
                raw = _retry(
                    lambda: self.service.users()
                    .messages()
                    .get(userId="me", id=mid, format="full")
                    .execute()
                )
            except HttpError as exc:
                log.warning("[%s] could not fetch %s: %s", self.account_key, mid, exc)
                continue
            out.append(self._parse(raw, body_chars))
        return out

    def _parse(self, raw: dict[str, Any], body_chars: int) -> Message:
        payload = raw.get("payload", {}) or {}
        headers = {h["name"]: h.get("value", "") for h in payload.get("headers", [])}
        lower = {k.lower(): v for k, v in headers.items()}

        sender = lower.get("from", "")
        match = _EMAIL_IN.search(sender)
        sender_email = (match.group(0) if match else "").lower()

        date_ts = 0.0
        if raw.get("internalDate"):
            date_ts = int(raw["internalDate"]) / 1000.0
        elif lower.get("date"):
            try:
                date_ts = parsedate_to_datetime(lower["date"]).timestamp()
            except (TypeError, ValueError):
                pass

        body = normalize_ws(self._extract_body(payload))[:body_chars]

        return Message(
            id=raw["id"],
            thread_id=raw.get("threadId", ""),
            account=self.account_key,
            subject=lower.get("subject", "(no subject)"),
            sender=sender,
            sender_email=sender_email,
            to=lower.get("to", ""),
            date_ts=date_ts,
            snippet=raw.get("snippet", ""),
            body=body,
            label_ids=raw.get("labelIds", []) or [],
            headers=headers,
            web_url=f"https://mail.google.com/mail/u/{self.email}/#all/{raw['id']}",
        )

    def _extract_body(self, payload: dict[str, Any]) -> str:
        """Depth-first walk, preferring text/plain over text/html."""
        plain: list[str] = []
        html: list[str] = []

        def walk(part: dict[str, Any]) -> None:
            mime = part.get("mimeType", "")
            data = (part.get("body") or {}).get("data")
            if data:
                try:
                    decoded = base64.urlsafe_b64decode(data.encode()).decode("utf-8", "replace")
                except Exception:
                    decoded = ""
                if mime == "text/plain":
                    plain.append(decoded)
                elif mime == "text/html":
                    html.append(decoded)
            for child in part.get("parts", []) or []:
                walk(child)

        walk(payload)
        if plain:
            return "\n".join(plain)
        if html:
            return html_to_text("\n".join(html))
        return ""

    def thread_has_sent(self, thread_id: str) -> bool:
        """Did you ever send a message in this thread? Cached per run."""
        if not thread_id:
            return False
        if thread_id in self._thread_sent_cache:
            return self._thread_sent_cache[thread_id]
        try:
            thread = _retry(
                lambda: self.service.users()
                .threads()
                .get(userId="me", id=thread_id, format="minimal")
                .execute()
            )
            found = any("SENT" in (m.get("labelIds") or []) for m in thread.get("messages", []))
        except HttpError as exc:
            log.warning("[%s] thread %s unreadable, assuming replied: %s", self.account_key, thread_id, exc)
            found = True  # fail safe: treat as protected
        self._thread_sent_cache[thread_id] = found
        return found

    # -- writing -----------------------------------------------------------

    def ensure_label(self, name: str) -> str | None:
        if self._label_cache is None:
            try:
                resp = _retry(lambda: self.service.users().labels().list(userId="me").execute())
                self._label_cache = {l["name"]: l["id"] for l in resp.get("labels", [])}
            except HttpError as exc:
                log.warning("[%s] cannot list labels: %s", self.account_key, exc)
                return None
        if name in self._label_cache:
            return self._label_cache[name]
        try:
            created = _retry(
                lambda: self.service.users()
                .labels()
                .create(
                    userId="me",
                    body={
                        "name": name,
                        "labelListVisibility": "labelShow",
                        "messageListVisibility": "show",
                    },
                )
                .execute()
            )
            self._label_cache[name] = created["id"]
            return created["id"]
        except HttpError as exc:
            log.warning("[%s] cannot create label %s: %s", self.account_key, name, exc)
            return None

    def star(self, message_id: str, label_name: str | None = None) -> bool:
        add = ["STARRED"]
        if label_name:
            label_id = self.ensure_label(label_name)
            if label_id:
                add.append(label_id)
        try:
            _retry(
                lambda: self.service.users()
                .messages()
                .modify(userId="me", id=message_id, body={"addLabelIds": add})
                .execute()
            )
            return True
        except HttpError as exc:
            log.warning("[%s] star failed for %s: %s", self.account_key, message_id, exc)
            return False

    def apply_label(self, message_id: str, label_name: str) -> bool:
        label_id = self.ensure_label(label_name)
        if not label_id:
            return False
        try:
            _retry(
                lambda: self.service.users()
                .messages()
                .modify(userId="me", id=message_id, body={"addLabelIds": [label_id]})
                .execute()
            )
            return True
        except HttpError as exc:
            log.warning("[%s] label failed for %s: %s", self.account_key, message_id, exc)
            return False

    def trash(self, message_id: str) -> bool:
        """Move to Trash. Recoverable for 30 days; this token cannot do worse."""
        try:
            _retry(
                lambda: self.service.users().messages().trash(userId="me", id=message_id).execute()
            )
            return True
        except HttpError as exc:
            log.warning("[%s] trash failed for %s: %s", self.account_key, message_id, exc)
            return False

    def send_html(
        self, to: str, subject: str, html_body: str, text_body: str = ""
    ) -> dict[str, str] | None:
        """Returns {"id", "threadId"} on success, so a reply to this message
        can be found later. None on failure."""
        msg = EmailMessage()
        msg["To"] = to
        msg["From"] = self.email
        msg["Subject"] = subject
        msg.set_content(text_body or "This report is best viewed as HTML.")
        msg.add_alternative(html_body, subtype="html")

        encoded = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        try:
            sent = _retry(
                lambda: self.service.users()
                .messages()
                .send(userId="me", body={"raw": encoded})
                .execute()
            )
            log.info("Sent %r to %s", subject, to)
            return {"id": sent.get("id", ""), "threadId": sent.get("threadId", "")}
        except HttpError as exc:
            log.error("Sending failed: %s", exc)
            return None


def _retry(call, attempts: int = 4, base_delay: float = 1.0):
    """Retry on Gmail's rate limits and transient 5xx."""
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            return call()
        except HttpError as exc:
            status = getattr(exc.resp, "status", 0)
            if status in {403, 429, 500, 502, 503, 504}:
                last = exc
                delay = base_delay * (2**attempt)
                log.debug("Gmail %s; retrying in %.1fs", status, delay)
                time.sleep(delay)
                continue
            raise
    raise last  # type: ignore[misc]