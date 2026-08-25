"""Live Codeforces standing, cached in the bucket.

Three public endpoints, no authentication -- everything here is readable
anonymously, so no API key is involved and none is stored.

The awkward part is rank. Codeforces exposes a rating and a *title*
("specialist", "expert") but no rank number anywhere, so the only way to get
one is to pull the whole rated list and count how many people are above you.
That is ~17 MB and ~48,000 users, which parses in a tenth of a second and
peaks around 115 MB -- fine once an hour, absurd on every page load. Hence the
cache: the answer is recomputed at most hourly and served from a small blob.

Two honest limits, carried in the payload so the page can state them rather
than implying a precision that is not there:

  * The list is active users only -- those who competed in the last month --
    which is what codeforces.com/ratings shows by default. It is not a rank
    among everyone who ever registered.
  * Country is optional on Codeforces and only about a third of users set it.
    A country rank is therefore a rank among Indian users *who said so*. The
    true figure is worse, and unknowable from the API.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

import requests

log = logging.getLogger(__name__)

API = "https://codeforces.com/api"
BLOB = "console/codeforces.json"
TTL_SECONDS = 3600

# Codeforces handles are 3-24 of these. Validated because it lands in a URL.
HANDLE_OK = re.compile(r"^[A-Za-z0-9_.-]{3,24}$")

# The rated list is the big one; the other two are small.
_TIMEOUT = 60

EMPTY: dict[str, Any] = {
    "handle": "",
    "rating": None,
    "max_rating": None,
    "title": "",
    "world_rank": None,
    "world_total": None,
    "country": "",
    "country_rank": None,
    "country_total": None,
    "next_contest": None,
    "fetched_ts": 0.0,
    "error": "",
}


def _get(path: str) -> Any:
    """One anonymous API call. Raises on anything that is not a clean OK.

    requests rather than urllib for its bundled CA store: urllib trusts the
    host's, which is a thing that differs between a laptop and a slim
    container and fails as an SSL error rather than as anything informative.
    """
    response = requests.get(
        f"{API}/{path}",
        timeout=_TIMEOUT,
        headers={"User-Agent": "launch-console"},
    )
    # A rejected request still carries the reason in the body, and the reason
    # is the useful part: "User with handle x not found" told as a 400 reads
    # as though Codeforces were unreachable.
    try:
        doc = response.json()
    except ValueError:
        response.raise_for_status()
        raise RuntimeError("Codeforces returned something that was not JSON")
    if doc.get("status") != "OK":
        raise RuntimeError(doc.get("comment") or f"Codeforces said {response.status_code}")
    return doc["result"]


def next_contest() -> dict[str, Any] | None:
    """The soonest contest that has not started."""
    upcoming = [
        c for c in _get("contest.list?gym=false") if c.get("phase") == "BEFORE"
    ]
    if not upcoming:
        return None
    soonest = min(upcoming, key=lambda c: c.get("startTimeSeconds") or 0)
    return {
        "id": soonest.get("id"),
        "name": soonest.get("name", ""),
        "start_ts": soonest.get("startTimeSeconds") or 0,
        "duration_seconds": soonest.get("durationSeconds") or 0,
    }


def _ranks(handle: str, rating: int, country: str) -> dict[str, Any]:
    """Position in the rated list, by counting who is above you.

    Reduced to (rating, country) pairs as soon as it is parsed: keeping 48,000
    full user objects alive costs a few hundred MB for no reason, and this
    runs inside a 512 MiB service.
    """
    users = _get("user.ratedList?activeOnly=true&includeRetired=false")
    pairs = [(u.get("rating") or 0, u.get("country") or "") for u in users]
    del users

    lower = handle.lower()
    world_total = len(pairs)
    # Strictly greater, so everyone on the same rating shares a rank rather
    # than being ordered arbitrarily.
    above = sum(1 for r, _ in pairs if r > rating)

    out: dict[str, Any] = {
        "world_rank": above + 1,
        "world_total": world_total,
        "country_rank": None,
        "country_total": None,
    }
    if country:
        same = [(r, c) for r, c in pairs if c == country]
        out["country_rank"] = sum(1 for r, _ in same if r > rating) + 1
        out["country_total"] = len(same)
    log.info(
        "Codeforces: %s rated %s -> world %s/%s", lower, rating,
        out["world_rank"], world_total,
    )
    return out


def refresh(handle: str) -> dict[str, Any]:
    """Fetch everything for one handle. Never raises; reports in `error`."""
    payload = dict(EMPTY)
    payload["handle"] = handle
    payload["fetched_ts"] = time.time()

    if not handle:
        payload["error"] = "No Codeforces handle set."
        return payload
    if not HANDLE_OK.match(handle):
        payload["error"] = f"{handle!r} is not a valid Codeforces handle."
        return payload

    # The contest is independent of the profile, so a bad handle still leaves
    # you with a countdown rather than an empty row of tiles.
    try:
        payload["next_contest"] = next_contest()
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not read the contest list: %s", exc)

    try:
        info = _get(f"user.info?handles={handle}")
        if not info:
            payload["error"] = f"Codeforces has no user {handle!r}."
            return payload
        user = info[0]
    except Exception as exc:  # noqa: BLE001
        payload["error"] = str(exc)
        return payload

    payload["handle"] = user.get("handle", handle)
    payload["rating"] = user.get("rating")
    payload["max_rating"] = user.get("maxRating")
    payload["title"] = user.get("rank", "")
    payload["country"] = user.get("country", "") or ""

    if payload["rating"] is None:
        # Registered but never competed. Not an error.
        payload["error"] = ""
        return payload

    try:
        payload.update(_ranks(payload["handle"], payload["rating"], payload["country"]))
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not work out the rank: %s", exc)
        payload["error"] = f"Rating is current; rank unavailable ({exc})."

    return payload


def is_stale(payload: dict[str, Any], ttl: int = TTL_SECONDS) -> bool:
    return (time.time() - float(payload.get("fetched_ts") or 0)) > ttl
