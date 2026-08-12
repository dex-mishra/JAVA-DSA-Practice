"""Date validation.

Shape is not validity. `\\d{4}-\\d{2}-\\d{2}` happily matches 2027-13-45, and a
regex that only checks the shape will pass a month-13 date straight through to
the Calendar API or into the tracker's date arithmetic. Everything here parses
for real and rejects what the calendar does not contain.
"""

from __future__ import annotations

from datetime import date, datetime

DATE_FORMATS = ("%Y-%m-%d",)
DATETIME_FORMATS = ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M")


def parse_date(value: str) -> date | None:
    """A real calendar date in canonical YYYY-MM-DD, or None.

    strptime is lenient about zero padding, so "2027-4-2" parses happily. That
    string then reaches the browser as new Date("2027-4-2T00:00:00"), which is
    not valid ISO 8601 and yields Invalid Date. Requiring the value to
    round-trip to its canonical form rejects it here instead.
    """
    if not isinstance(value, str):
        return None
    text = value.strip()
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(text, fmt).date()
        except ValueError:
            continue
        return parsed if parsed.isoformat() == text else None
    return None


def parse_when(value: str) -> datetime | date | None:
    """A real date or date-time in canonical form, or None."""
    if not isinstance(value, str):
        return None
    text = value.strip()
    for fmt in DATETIME_FORMATS:
        try:
            parsed = datetime.strptime(text, fmt)
        except ValueError:
            continue
        # Same round-trip rule as above, against the format that matched.
        return parsed if parsed.strftime(fmt) == text else None
    return parse_date(text)


def is_date(value: str) -> bool:
    return parse_date(value) is not None


def is_when(value: str) -> bool:
    return parse_when(value) is not None


def normalise_when(value: str) -> str:
    """Return the canonical string, or "" if the value is not a real moment."""
    parsed = parse_when(value)
    if parsed is None:
        return ""
    if isinstance(parsed, datetime):
        return parsed.strftime("%Y-%m-%dT%H:%M")
    return parsed.isoformat()
