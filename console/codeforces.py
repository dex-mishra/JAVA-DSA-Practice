"""Live Codeforces standing, cached in the bucket.

Rating and the contest calendar come from the public API. Rank does not: the
API's rank-shaped tool is user.ratedList, and it lies. Checked against the
site's own ratings pages for a real handle (rating 1752): the API-derived
count said India #215 (against the "active last month" slice) or #4,104
(against "every account ever rated, including retired"); the site itself
says #564. Neither API basis reproduces the number Codeforces shows its own
users, and there is no third query parameter that does either -- the site's
in-house filtering (very likely excluding banned/cheater-flagged accounts,
which the API has no field for) is not reconstructable from outside.

So rank comes from the same place a human would check it: codeforces.com's
own /ratings pages. A page lists 200 users at a time sorted by rating, so
finding one handle is a binary search over pages by rating rather than a
linear scan -- about 10 requests instead of one 17-40 MB download, and it
matches the displayed number exactly because it *is* the displayed number.

Fragile in the way any scrape is: it depends on markup this module does not
control. Every parse failure raises, is caught in refresh(), and degrades to
"rating is current; rank unavailable" -- a wrong number was the actual
complaint that started this, so silence is the safe failure here, not a
best-effort guess dressed up as one.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any
from urllib.parse import quote

import requests

log = logging.getLogger(__name__)

API = "https://codeforces.com/api"
SITE = "https://codeforces.com"
BLOB = "console/codeforces.json"
TTL_SECONDS = 3600

# Codeforces handles are 3-24 of these. Validated because it lands in a URL.
HANDLE_OK = re.compile(r"^[A-Za-z0-9_.-]{3,24}$")

# Kept short deliberately: this console runs one gunicorn worker with an
# 8-thread pool and a 120s request timeout. A binary search makes several of
# these in one request, so a single slow fetch cannot be allowed to eat the
# whole budget -- _locate() below also enforces a hard wall-clock deadline
# on top of this, for the same reason.
_TIMEOUT = 10
# Binary search over ~500-700 pages takes ~10 requests; this is headroom for
# the neighbour probing around a tie, not an expected case.
_MAX_PAGE_REQUESTS = 16
# Hard ceiling on one _locate() call, regardless of request count. 16 requests
# at the full 10s timeout would be 160s -- longer than gunicorn will wait for
# the whole HTTP request. This stops it well short of that.
_LOCATE_DEADLINE_SECONDS = 45

# One rated-list row. Two shapes share this pattern:
#   plain  /ratings/page/N            "<td>5798</td>"
#   country /ratings/country/X/page/N "<td>564&nbsp;(5798)</td>"
# Group 1 is always the rank on the page you asked for; group 2 is the global
# rank, present only on a country page. There is no </tr> in this markup --
# rows are unclosed <tr> soup, split on the next "<tr " instead.
_ROW = re.compile(
    r'<td>\s*(\d+)(?:&nbsp;\((\d+)\))?\s*</td>\s*'
    r'<td[^>]*>.*?href="/profile/([^"]+)".*?</a>\s*</td>\s*'
    r'<td>\s*(-?\d+)\s*</td>\s*'
    r'<td>\s*(-?\d+)\s*</td>',
    re.S,
)
_PAGE_LINK = re.compile(r'/page/(\d+)')

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


def _page_html(url: str) -> str:
    """One ratings page. A separate seam from _get() so tests can stub HTML
    scraping and JSON API calls independently."""
    response = requests.get(url, timeout=_TIMEOUT, headers={"User-Agent": _SITE_UA})
    response.raise_for_status()
    return response.text


_SITE_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def _page_rows(html: str) -> list[tuple[int, int | None, str, int]]:
    """(rank, global_rank_or_None, handle, rating) for every row on a page."""
    rows = []
    for chunk in html.split("<tr "):
        m = _ROW.search(">" + chunk)
        if m:
            rank, global_rank, who, _contrib, rating = m.groups()
            rows.append((int(rank), int(global_rank) if global_rank else None, who, int(rating)))
    return rows


def _total_pages(html: str) -> int:
    found = [int(n) for n in _PAGE_LINK.findall(html)]
    return max(found) if found else 1


def _country_population(html: str, country: str) -> int | None:
    """The exact count Codeforces itself states, lifted from the same page's
    country dropdown -- free, and it is literally the number the site uses."""
    m = re.search(
        r"<option[^>]*>\s*" + re.escape(country) + r",\s*(\d+)\s*</option>", html
    )
    return int(m.group(1)) if m else None


def _locate(base_url: str, handle: str, rating: int) -> dict[str, Any]:
    """Binary search ratings pages (sorted by rating, descending) for one
    handle's row.

    A page's own rank column is exact -- it is what the request is for -- so
    once the right page is found there is no counting left to do. The search
    narrows on the page's rating range: if you are rated higher than
    everyone shown, look earlier; lower than everyone shown, look later;
    otherwise you belong somewhere on this page or spilled onto a neighbour
    by a tie, so both immediate neighbours get one probe each before giving
    up. Giving up returns unknown ranks rather than a guess -- a wrong number
    was the complaint that started this rewrite.
    """
    import time as _time

    requests_made = 0
    cache: dict[int, str] = {}
    deadline = _time.monotonic() + _LOCATE_DEADLINE_SECONDS

    def get(page: int) -> str:
        nonlocal requests_made
        if page not in cache:
            if requests_made >= _MAX_PAGE_REQUESTS:
                raise RuntimeError("gave up after too many pages")
            if _time.monotonic() > deadline:
                raise RuntimeError("gave up after too long")
            cache[page] = _page_html(f"{base_url}/page/{page}")
            requests_made += 1
        return cache[page]

    first_html = get(1)
    lo, hi = 1, _total_pages(first_html)
    total_pages = hi
    page1_html = first_html

    while lo <= hi:
        mid = (lo + hi) // 2
        html = get(mid)
        rows = _page_rows(html)
        if not rows:
            hi = mid - 1
            continue
        if rating > rows[0][3]:
            hi = mid - 1
        elif rating < rows[-1][3]:
            lo = mid + 1
        else:
            for probe in (mid, mid - 1, mid + 1):
                if probe < 1 or probe > total_pages:
                    continue
                for rank, global_rank, who, _r in _page_rows(get(probe)):
                    if who.lower() == handle.lower():
                        return {
                            "rank": rank, "global_rank": global_rank,
                            "total_pages": total_pages, "page1_html": page1_html,
                        }
            break

    raise RuntimeError(f"{handle} not found near its rating on {base_url}")


def _ranks(handle: str, rating: int, country: str) -> dict[str, Any]:
    """Rank exactly as codeforces.com/ratings shows it -- see the module
    docstring for why this cannot come from the API."""
    out: dict[str, Any] = {
        "world_rank": None, "world_total": None,
        "country_rank": None, "country_total": None,
    }

    if country:
        found = _locate(f"{SITE}/ratings/country/{quote(country, safe='')}", handle, rating)
        out["country_rank"] = found["rank"]
        out["country_total"] = _country_population(found["page1_html"], country)
        out["world_rank"] = found["global_rank"]
        # The country page carries the global rank on the same row, but not a
        # global population -- that lives on the plain ratings pages, which
        # this handle's country search never visits. One more request.
        global_html = _page_html(f"{SITE}/ratings/page/1")
        out["world_total"] = _total_pages(global_html) * 200
    else:
        found = _locate(f"{SITE}/ratings", handle, rating)
        out["world_rank"] = found["rank"]
        out["world_total"] = found["total_pages"] * 200

    log.info(
        "Codeforces: %s rated %s -> world #%s, country #%s",
        handle, rating, out["world_rank"], out["country_rank"],
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
