"""Google Calendar writes.

Scope note, same reasoning as the Gmail side. We request
`calendar.app.created`, not `calendar.events`. That scope only grants access
to secondary calendars this application itself created -- the agent can make
its own calendar and manage events on it, and is structurally incapable of
reading, editing or deleting anything on your real calendars. If this code
had a bug that tried to wipe your schedule, Google would refuse it.

The tradeoff is that events land on a separate "Inbox Agent" calendar rather
than your primary one. In the Google Calendar UI they show in the same grid,
colour-coded, and you can hide them with one checkbox. That is a better
default than handing an automated process write access to your whole diary.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .gmail import load_credentials

log = logging.getLogger(__name__)

# Create and manage secondary calendars this app made. Nothing else.
SCOPES_CALENDAR = ["https://www.googleapis.com/auth/calendar.app.created"]

CALENDAR_NAME = "Inbox Agent"
CALENDAR_DESCRIPTION = (
    "Deadlines and events added by your inbox agent, after you confirmed them by "
    "replying to a digest. Safe to hide or delete; the agent will recreate it."
)


@dataclass
class EventSpec:
    """A calendar event the agent has been authorised to create."""

    title: str
    start: str          # YYYY-MM-DD, or YYYY-MM-DDTHH:MM
    end: str = ""       # optional; defaults sensibly per kind
    all_day: bool = True
    description: str = ""
    source_url: str = ""

    def body(self, timezone: str) -> dict[str, Any]:
        description = self.description
        if self.source_url:
            description = (description + "\n\n" if description else "") + f"Source: {self.source_url}"

        if self.all_day:
            start_date = _parse_date(self.start)
            end_date = _parse_date(self.end) if self.end else start_date
            # Google treats all-day `end` as exclusive.
            return {
                "summary": self.title[:250],
                "description": description[:7000],
                "start": {"date": start_date.isoformat()},
                "end": {"date": (end_date + timedelta(days=1)).isoformat()},
                "reminders": {
                    "useDefault": False,
                    # A deadline you learn about on the morning it lands is not
                    # much use, so: a week out, a day out, and that morning.
                    "overrides": [
                        {"method": "popup", "minutes": 7 * 24 * 60},
                        {"method": "popup", "minutes": 24 * 60},
                        {"method": "popup", "minutes": 9 * 60},
                    ],
                },
            }

        start_dt = _parse_datetime(self.start)
        end_dt = _parse_datetime(self.end) if self.end else start_dt + timedelta(hours=1)
        if end_dt <= start_dt:
            end_dt = start_dt + timedelta(hours=1)
        return {
            "summary": self.title[:250],
            "description": description[:7000],
            "start": {"dateTime": start_dt.isoformat(), "timeZone": timezone},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": timezone},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 24 * 60},
                    {"method": "popup", "minutes": 30},
                ],
            },
        }


def _parse_date(value: str) -> date:
    return datetime.strptime(value[:10], "%Y-%m-%d").date()


def _parse_datetime(value: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    # Date only: treat as 9am local rather than midnight, which reads as
    # "the night before" in most calendar views.
    return datetime.combine(_parse_date(value), datetime.min.time()).replace(hour=9)


class CalendarClient:
    def __init__(self, project: str, secret_name: str, timezone: str = "Asia/Kolkata"):
        creds = load_credentials(project, secret_name)
        self.service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        self.timezone = timezone
        self._calendar_id: str | None = None

    def has_scope(self) -> bool:
        """Cheap probe. The primary token predates calendar support, so a
        mailbox authorised before this feature simply will not have it."""
        try:
            self.service.calendarList().list(maxResults=1).execute()
            return True
        except HttpError as exc:
            if getattr(exc.resp, "status", 0) in {401, 403}:
                return False
            raise

    def ensure_calendar(self) -> str | None:
        """Find or create the agent's own calendar. Cached per run."""
        if self._calendar_id:
            return self._calendar_id
        try:
            page_token = None
            while True:
                resp = self.service.calendarList().list(pageToken=page_token).execute()
                for entry in resp.get("items", []):
                    if entry.get("summary") == CALENDAR_NAME:
                        self._calendar_id = entry["id"]
                        return self._calendar_id
                page_token = resp.get("nextPageToken")
                if not page_token:
                    break

            created = self.service.calendars().insert(
                body={
                    "summary": CALENDAR_NAME,
                    "description": CALENDAR_DESCRIPTION,
                    "timeZone": self.timezone,
                }
            ).execute()
            self._calendar_id = created["id"]
            log.info("Created the '%s' calendar.", CALENDAR_NAME)
            return self._calendar_id
        except HttpError as exc:
            log.error("Could not reach Calendar: %s", exc)
            return None

    def create_event(self, spec: EventSpec) -> str | None:
        """Returns the event's htmlLink, or None if it could not be created."""
        cal_id = self.ensure_calendar()
        if not cal_id:
            return None
        try:
            event = self.service.events().insert(
                calendarId=cal_id, body=spec.body(self.timezone)
            ).execute()
            log.info("Created event %r on %s", spec.title[:60], spec.start)
            return event.get("htmlLink")
        except HttpError as exc:
            log.warning("Event creation failed for %r: %s", spec.title[:60], exc)
            return None
