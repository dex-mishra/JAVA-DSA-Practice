"""Live Codeforces standing on the header.

Rank does not come from Codeforces' API. It was built against
user.ratedList originally -- count everyone with a higher rating, add one --
and it was wrong. Checked against the real site for a rating-1752 handle:
the "active in the last month" API slice said India #215, the "every
account ever rated" slice said #4,104, and codeforces.com/ratings itself
says #564. Neither API basis reproduces what the site shows its own users,
and there is no third query parameter that does -- the site almost
certainly excludes accounts the API has no field for (banned, flagged),
which is not reconstructable from outside.

So rank is read the way a person would read it: scraping the real ratings
pages, binary-searching by rating rather than paging through hundreds of
them. These tests build small fake HTML pages in the site's actual row
format (unclosed <tr> soup, "RANK&nbsp;(GLOBAL)" on a country page) and
pin the search against them -- including the case that started this
rewrite: the correct answer sits inside a run of tied ratings, so the
handle is not necessarily the first row matching the bracket.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO / "console"))

import codeforces as cf  # noqa: E402


def row(rank, handle, rating, *, global_rank=None):
    """One row of ratings-page HTML, in the site's actual unclosed-<tr> shape."""
    lead = f"{rank}&nbsp;({global_rank})" if global_rank is not None else str(rank)
    return (
        f'<tr >\n<td>\n{lead}\n</td>\n'
        f'<td style="text-align:left;padding-left:1em;">'
        f'<img class="standings-flag" src="//x/flags-16/in.png" alt="India" title="India"/>'
        f'<a href="/profile/{handle}" title="Expert {handle}" class="rated-user user-blue">'
        f'{handle}</a></td>\n<td>\n16\n</td>\n<td>\n{rating}\n</td>\n'
    )


def page(rows, *, last_page=1, current_window=None):
    """A minimal fake ratings page: the rows, plus a pagination block so
    _total_pages() can find the highest page number, the same way it reads
    the real site's paginator."""
    window = current_window or [1, last_page]
    links = "".join(f'<a href="/ratings/page/{n}">{n}</a>' for n in window)
    return "".join(rows) + f'<div class="pagination">{links}</div>'


def country_option(name, total):
    return f'<option value="{name}">\n{name}, {total}\n</option>'


class FakeSite(unittest.TestCase):
    """A tiny in-memory ratings site: {page number: html}."""

    def setUp(self):
        self.pages: dict[str, str] = {}
        self.requested: list[str] = []
        cf._page_html = self.fake_page_html

    def fake_page_html(self, url):
        self.requested.append(url)
        for key, html in self.pages.items():
            if url.endswith(key):
                return html
        raise AssertionError(f"no fake page for {url}")

    def put(self, path, html):
        self.pages[path] = html


class Locate(FakeSite):
    """The binary search over a fake ratings site, sorted by rating desc."""

    def build_ladder(self, ratings, *, per_page=4, handles=None, global_offset=0):
        """ratings: a descending list. Paginate it and register every page,
        with a pagination block naming every page (small ladders in tests,
        so a full link list is realistic)."""
        handles = handles or [f"u{i}" for i in range(len(ratings))]
        total_pages = max(1, -(-len(ratings) // per_page))
        for p in range(1, total_pages + 1):
            chunk = list(zip(ratings, handles))[(p - 1) * per_page : p * per_page]
            rows = [
                row(
                    (p - 1) * per_page + i + 1, h, r,
                    global_rank=(global_offset + (p - 1) * per_page + i + 1) if global_offset else None,
                )
                for i, (r, h) in enumerate(chunk)
            ]
            self.put(f"/page/{p}", page(rows, last_page=total_pages,
                                        current_window=list(range(1, total_pages + 1))))
        return total_pages

    def test_finds_a_handle_in_the_middle_of_the_ladder(self):
        self.build_ladder([3000, 2500, 2000, 1800, 1600, 1400, 1200, 1000],
                          handles=["a", "b", "c", "target", "e", "f", "g", "h"])
        out = cf._locate(f"{cf.SITE}/ratings", "target", 1800)
        self.assertEqual(out["rank"], 4)

    def test_the_first_and_last_rows_are_reachable(self):
        self.build_ladder([3000, 2500, 2000, 1800], handles=["top", "b", "c", "bottom"])
        self.assertEqual(cf._locate(f"{cf.SITE}/ratings", "top", 3000)["rank"], 1)
        self.assertEqual(cf._locate(f"{cf.SITE}/ratings", "bottom", 1800)["rank"], 4)

    def test_a_tie_that_spills_onto_the_next_page_is_still_found(self):
        """The exact shape of the real bug: ceasak's rating (1752) is shared
        by 14 people, and the binary search can land on either side of that
        run depending on where the midpoint falls. The handle sought here
        sits on the page AFTER the one the bracket check lands on."""
        ratings = [2000, 1900, 1800] + [1700] * 6 + [1600, 1500]
        handles = ["a", "b", "c"] + [f"tied{i}" for i in range(6)] + ["y", "z"]
        self.build_ladder(ratings, handles=handles, per_page=4)
        # tied5 is the last of the run of ties, likely spilling past a
        # 4-per-page boundary from wherever the binary search first lands.
        out = cf._locate(f"{cf.SITE}/ratings", "tied5", 1700)
        self.assertEqual(out["rank"], 9)  # index 8, 1-based

    def test_a_country_page_carries_the_global_rank_too(self):
        self.build_ladder([2000, 1800, 1600], handles=["a", "target", "c"],
                          global_offset=5000)
        out = cf._locate(f"{cf.SITE}/ratings/country/India", "target", 1800)
        self.assertEqual(out["rank"], 2)
        self.assertEqual(out["global_rank"], 5002)

    def test_a_plain_page_has_no_global_rank(self):
        self.build_ladder([2000, 1800], handles=["a", "target"])
        out = cf._locate(f"{cf.SITE}/ratings", "target", 1800)
        self.assertIsNone(out["global_rank"])

    def test_a_handle_nowhere_near_its_own_rating_is_not_found(self):
        """The site said this rating, but the handle genuinely is not on
        the page it should be on -- a real inconsistency, and it must be
        reported as "not found", not returned as some nearby row."""
        self.build_ladder([2000, 1800, 1600], handles=["a", "b", "c"])
        with self.assertRaises(RuntimeError):
            cf._locate(f"{cf.SITE}/ratings", "nonexistent", 1800)

    def test_it_does_not_download_the_whole_ladder(self):
        """The entire point of a binary search: not every page gets fetched."""
        total_pages = self.build_ladder(list(range(2000, 2000 - 400, -1)),
                                        handles=[f"u{i}" for i in range(400)],
                                        per_page=4)
        self.assertGreater(total_pages, 50)
        cf._locate(f"{cf.SITE}/ratings", "u199", 1801)
        self.assertLess(len(self.requested), 12)

    def test_it_gives_up_rather_than_loop_forever(self):
        """A pathological fake site with no valid rows anywhere must not
        spin -- the request cap has to actually stop it."""
        for p in range(1, 30):
            self.put(f"/page/{p}", page([], last_page=29))
        with self.assertRaises(RuntimeError):
            cf._locate(f"{cf.SITE}/ratings", "ghost", 1500)
        self.assertLessEqual(len(self.requested), cf._MAX_PAGE_REQUESTS)

    def test_a_wall_clock_deadline_also_bounds_it(self):
        """Independent of the request cap: this console is one gunicorn
        worker with a 120s timeout, so a slow (not failing) upstream must
        not be allowed to hold a search open indefinitely either."""
        for p in range(1, 30):
            self.put(f"/page/{p}", page([], last_page=29))
        original = cf._LOCATE_DEADLINE_SECONDS
        cf._LOCATE_DEADLINE_SECONDS = 0
        try:
            with self.assertRaises(RuntimeError):
                cf._locate(f"{cf.SITE}/ratings", "ghost", 1500)
        finally:
            cf._LOCATE_DEADLINE_SECONDS = original
        # A zero-second deadline expires before even the first fetch.
        self.assertEqual(len(self.requested), 0)


class Parsing(unittest.TestCase):
    def test_a_plain_row_parses(self):
        rows = cf._page_rows(row(5798, "dbg_8", 1752))
        self.assertEqual(rows, [(5798, None, "dbg_8", 1752)])

    def test_a_country_row_parses_both_numbers(self):
        rows = cf._page_rows(row(564, "ceasak", 1752, global_rank=5798))
        self.assertEqual(rows, [(564, 5798, "ceasak", 1752)])

    def test_several_unclosed_rows_in_a_row_all_parse(self):
        html = row(1, "a", 3000) + row(2, "b", 2900) + row(3, "c", 2800)
        rows = cf._page_rows(html)
        self.assertEqual([r[2] for r in rows], ["a", "b", "c"])

    def test_total_pages_reads_the_highest_link(self):
        html = page([row(1, "a", 3000)], last_page=513,
                    current_window=[1, 2, 3, 512, 513])
        self.assertEqual(cf._total_pages(html), 513)

    def test_no_pagination_links_means_a_single_page(self):
        self.assertEqual(cf._total_pages("<div>nothing here</div>"), 1)

    def test_country_population_reads_the_dropdown(self):
        html = country_option("India", 102425) + country_option("Nepal", 900)
        self.assertEqual(cf._country_population(html, "India"), 102425)

    def test_an_absent_country_gives_no_population(self):
        html = country_option("India", 102425)
        self.assertIsNone(cf._country_population(html, "Elbonia"))


class RanksEndToEnd(FakeSite):
    """_ranks() wiring the pieces together for one handle.

    Uses full single-page ladders (small enough that _locate's search always
    lands on page 1) rather than the multi-page builder in Locate -- the
    search mechanics are already covered there; this checks what _ranks does
    with the result, including the one extra request the country path costs.
    """

    def one_page_site(self, base, rows, *, extra=""):
        self.put(f"{base}/page/1", page(rows, last_page=1) + extra)

    def test_a_handle_with_a_country_gets_both_ranks(self):
        self.one_page_site(
            "/country/India", [row(564, "ceasak", 1752, global_rank=5798)],
            extra=country_option("India", 102425),
        )
        self.one_page_site("", [row(1, "top", 3000)])

        out = cf._ranks("ceasak", 1752, "India")
        self.assertEqual(out["country_rank"], 564)
        self.assertEqual(out["country_total"], 102425)
        self.assertEqual(out["world_rank"], 5798)
        self.assertEqual(out["world_total"], 200)  # total_pages(1) * 200

    def test_a_handle_with_no_country_only_gets_a_world_rank(self):
        self.one_page_site("", [row(4, "tourist", 3530)])
        out = cf._ranks("tourist", 3530, "")
        self.assertEqual(out["world_rank"], 4)
        self.assertIsNone(out["country_rank"])
        self.assertIsNone(out["country_total"])

    def test_country_lookup_uses_one_request_for_the_global_total(self):
        """Documents the cost: the country page gives both ranks in one
        search, but the global population is a second, independent fetch."""
        self.one_page_site("/country/Freedonia", [row(1, "solo", 2000, global_rank=50)])
        self.one_page_site("", [row(1, "top", 3000)])
        cf._ranks("solo", 2000, "Freedonia")
        self.assertIn(f"{cf.SITE}/ratings/page/1", self.requested)


class Refresh(unittest.TestCase):
    """The parts that never changed: user.info, contest.list, and how
    refresh() degrades when one piece fails."""

    def setUp(self):
        self.contest = {
            "id": 1, "name": "Codeforces Round 1200 (Div. 2)",
            "phase": "BEFORE", "startTimeSeconds": 2000000000,
            "durationSeconds": 7200,
        }

    def wire(self, *, info=None, rank_result=None, fail_ranks=False):
        def fake_get(path):
            if path.startswith("contest.list"):
                return [self.contest, {"phase": "FINISHED", "startTimeSeconds": 1}]
            if path.startswith("user.info"):
                return info if info is not None else []
            raise AssertionError(path)

        def fake_ranks(handle, rating, country):
            if fail_ranks:
                raise RuntimeError("boom")
            return rank_result or {"world_rank": None, "world_total": None,
                                   "country_rank": None, "country_total": None}

        cf._get = fake_get
        cf._ranks = fake_ranks

    def profile(self, **kw):
        base = {"handle": "aryan", "rating": 1400, "maxRating": 1502,
                "rank": "specialist", "country": "India"}
        base.update(kw)
        return [base]

    def test_a_good_handle_produces_everything(self):
        self.wire(info=self.profile(),
                  rank_result={"world_rank": 5798, "world_total": 131800,
                              "country_rank": 564, "country_total": 102425})
        out = cf.refresh("aryan")
        self.assertEqual(out["error"], "")
        self.assertEqual(out["rating"], 1400)
        self.assertEqual(out["world_rank"], 5798)
        self.assertEqual(out["country_rank"], 564)
        self.assertEqual(out["next_contest"]["name"], self.contest["name"])

    def test_an_unknown_user_is_reported_and_not_guessed_at(self):
        self.wire(info=[])
        out = cf.refresh("aryan")
        self.assertIn("no user", out["error"])
        self.assertIsNone(out["rating"])

    def test_a_registered_but_unrated_user_is_not_an_error(self):
        self.wire(info=self.profile(rating=None, maxRating=None, rank=""))
        out = cf.refresh("aryan")
        self.assertEqual(out["error"], "")
        self.assertIsNone(out["rating"])

    def test_the_rating_survives_a_broken_rank_lookup(self):
        """A scrape can fail in a way an API call cannot: markup changes,
        a tie that outruns the neighbour probe, a timeout mid-search. The
        rating -- already known from user.info -- must not be lost with it."""
        self.wire(info=self.profile(), fail_ranks=True)
        out = cf.refresh("aryan")
        self.assertEqual(out["rating"], 1400)
        self.assertIsNone(out["world_rank"])
        self.assertIn("rank unavailable", out["error"])

    def test_bad_handles_never_reach_the_network(self):
        cf._get = lambda p: (_ for _ in ()).throw(AssertionError("called out"))
        for bad in ("", "ab", "x" * 25, "has space", "semi;colon"):
            self.assertTrue(cf.refresh(bad)["error"], f"{bad!r} was accepted")


class Staleness(unittest.TestCase):
    def test_fresh_is_not_stale(self):
        import time
        self.assertFalse(cf.is_stale({"fetched_ts": time.time()}))

    def test_an_hour_old_is_stale(self):
        import time
        self.assertTrue(cf.is_stale({"fetched_ts": time.time() - 3601}))

    def test_nothing_cached_is_stale(self):
        self.assertTrue(cf.is_stale({}))


class TheEndpointCaches(unittest.TestCase):
    """A scrape costs a real handful of requests to codeforces.com, so the
    answer is cached for an hour just as before. What matters is when that
    cache is bypassed, and that a failed refresh does not blank a rating
    that was true a minute ago."""

    def setUp(self):
        import json

        import main

        self.main = main
        self.json = json
        self.store = {}
        self.refreshes = []

        class Blob:
            def __init__(self, store, name):
                self.store, self.name = store, name

            def download_as_bytes(self):
                if self.name not in self.store:
                    raise FileNotFoundError(self.name)
                return self.store[self.name]

            def upload_from_string(inner, data, content_type=None):
                inner.store[inner.name] = data.encode() if isinstance(data, str) else data

        class GCS:
            def __init__(self, store):
                self.store = store

            def bucket(self, name):
                return self

            def blob(self, name):
                return Blob(self.store, name)

        self._gcs, self._refresh, self._load = (
            main.gcs, main.cf_mod.refresh, main.overlay_mod.load
        )
        main.gcs = lambda: GCS(self.store)
        main.overlay_mod.load = lambda *a, **k: {"cf_handle": "aryan"}
        main.cf_mod.refresh = self.fake_refresh
        main.app.config["TESTING"] = True

    def tearDown(self):
        self.main.gcs = self._gcs
        self.main.cf_mod.refresh = self._refresh
        self.main.overlay_mod.load = self._load

    error = ""

    def fake_refresh(self, handle=None):
        import time as _time
        handle = handle if isinstance(handle, str) else ""
        self.refreshes.append(handle)
        return {"handle": handle, "rating": 1400, "world_rank": 5,
                "fetched_ts": _time.time(), "error": self.error}

    def cache(self, **kw):
        import time as _time
        doc = {"handle": "aryan", "rating": 1234, "world_rank": 9,
               "fetched_ts": _time.time(), "error": ""}
        doc.update(kw)
        self.store[self.main.CF_BLOB] = self.json.dumps(doc).encode()

    def get(self, query=""):
        with self.main.app.test_client() as client:
            return client.get("/api/codeforces" + query).get_json()

    def test_a_fresh_cache_is_served_without_asking_codeforces(self):
        self.cache()
        self.assertEqual(self.get()["rating"], 1234)
        self.assertEqual(self.refreshes, [])

    def test_an_hour_old_cache_is_refreshed(self):
        import time as _time
        self.cache(fetched_ts=_time.time() - 3601)
        self.assertEqual(self.get()["rating"], 1400)
        self.assertEqual(self.refreshes, ["aryan"])

    def test_changing_the_handle_refreshes_immediately(self):
        self.cache(handle="someoneelse")
        self.assertEqual(self.get()["handle"], "aryan")
        self.assertEqual(self.refreshes, ["aryan"])

    def test_refresh_can_be_forced(self):
        self.cache()
        self.get("?refresh=1")
        self.assertEqual(self.refreshes, ["aryan"])

    def test_a_failed_refresh_keeps_the_last_good_rating(self):
        import time as _time
        self.cache(fetched_ts=_time.time() - 3601)
        self.error = "Codeforces is down"
        try:
            out = self.get()
        finally:
            self.error = ""
        self.assertEqual(out["rating"], 1234)
        self.assertTrue(out["stale"])

    def test_the_refreshed_answer_is_written_back(self):
        import time as _time
        self.cache(fetched_ts=_time.time() - 3601)
        self.get()
        stored = self.json.loads(self.store[self.main.CF_BLOB].decode())
        self.assertEqual(stored["rating"], 1400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
