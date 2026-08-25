"""Live Codeforces standing on the header.

Codeforces publishes a rating and a title but no rank number, so the only way
to know where you stand is to download the whole rated list and count the
people above you. That is the expensive part and the part worth pinning: the
counting rule, what "rank" is actually a rank *of*, and what happens when the
site is unreachable.

Nothing here touches the network. The shapes are the real ones, taken from
the live API while this was written.
"""

from __future__ import annotations

import json
import sys
import time
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO / "console"))

import codeforces as cf  # noqa: E402


def rated(*rows):
    """(rating, country) -> the user objects the API actually returns."""
    return [
        {"handle": f"u{i}", "rating": r, "country": c, "rank": "expert"}
        for i, (r, c) in enumerate(rows)
    ]


class Counting(unittest.TestCase):
    """Rank is "how many are strictly above me, plus one"."""

    def setUp(self):
        self.calls = []
        self.roster = rated(
            (3000, "Belarus"), (2000, "India"), (1800, "India"),
            (1500, ""), (1500, "India"), (1200, "India"),
        )
        cf._get = self.fake_get

    def fake_get(self, path):
        self.calls.append(path)
        if path.startswith("user.ratedList"):
            return self.roster
        raise AssertionError(path)

    def test_rank_counts_only_those_above(self):
        out = cf._ranks("me", 1800, "India")
        self.assertEqual(out["world_rank"], 3)      # 3000, 2000 are above
        self.assertEqual(out["world_total"], 6)

    def test_a_tie_shares_the_rank_rather_than_being_ordered_arbitrarily(self):
        a = cf._ranks("a", 1500, "")
        self.assertEqual(a["world_rank"], 4)        # 3000, 2000, 1800 above

    def test_country_rank_is_within_that_country_only(self):
        out = cf._ranks("me", 1800, "India")
        self.assertEqual(out["country_rank"], 2)    # only 2000 is above
        self.assertEqual(out["country_total"], 4)

    def test_no_country_on_the_profile_means_no_country_rank(self):
        out = cf._ranks("me", 1800, "")
        self.assertIsNone(out["country_rank"])
        self.assertIsNone(out["country_total"])

    def test_the_top_rating_is_rank_one(self):
        self.assertEqual(cf._ranks("me", 4000, "")["world_rank"], 1)

    def test_it_asks_only_for_the_active_list(self):
        """Rank among people who competed this month, which is what the site's
        own ratings page shows. Including retired users would silently change
        what the number means."""
        cf._ranks("me", 1800, "India")
        self.assertIn("activeOnly=true", self.calls[0])
        self.assertIn("includeRetired=false", self.calls[0])


class Handles(unittest.TestCase):
    def test_a_bad_handle_never_reaches_the_network(self):
        cf._get = lambda p: (_ for _ in ()).throw(AssertionError("called out"))
        for bad in ("", "ab", "x" * 25, "has space", "semi;colon", "amp&sand"):
            out = cf.refresh(bad)
            self.assertTrue(out["error"], f"{bad!r} was accepted")

    def test_the_error_says_which_problem_it_is(self):
        self.assertIn("No Codeforces handle", cf.refresh("")["error"])
        self.assertIn("not a valid", cf.refresh("a b c")["error"])


class Refresh(unittest.TestCase):
    def setUp(self):
        self.contest = {
            "id": 1, "name": "Codeforces Round 1200 (Div. 2)",
            "phase": "BEFORE", "startTimeSeconds": 2000000000,
            "durationSeconds": 7200,
        }

    def wire(self, *, info=None, roster=None, fail=None):
        def fake(path):
            if fail and fail in path:
                raise RuntimeError("boom")
            if path.startswith("contest.list"):
                return [self.contest, {"phase": "FINISHED", "startTimeSeconds": 1}]
            if path.startswith("user.info"):
                return info if info is not None else []
            if path.startswith("user.ratedList"):
                return roster or rated((3000, "X"), (1400, "India"))
            raise AssertionError(path)
        cf._get = fake

    def profile(self, **kw):
        base = {"handle": "aryan", "rating": 1400, "maxRating": 1502,
                "rank": "specialist", "country": "India"}
        base.update(kw)
        return [base]

    def test_a_good_handle_produces_everything(self):
        self.wire(info=self.profile())
        out = cf.refresh("aryan")
        self.assertEqual(out["error"], "")
        self.assertEqual(out["rating"], 1400)
        self.assertEqual(out["max_rating"], 1502)
        self.assertEqual(out["title"], "specialist")
        self.assertEqual(out["world_rank"], 2)
        self.assertEqual(out["country_rank"], 1)
        self.assertEqual(out["next_contest"]["name"], self.contest["name"])

    def test_only_a_contest_that_has_not_started(self):
        self.wire(info=self.profile())
        self.assertEqual(cf.refresh("aryan")["next_contest"]["id"], 1)

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

    def test_the_contest_survives_a_broken_profile_call(self):
        """Two independent facts. Losing one should not cost the other."""
        self.wire(info=self.profile(), fail="user.info")
        out = cf.refresh("aryan")
        self.assertTrue(out["error"])
        self.assertIsNotNone(out["next_contest"])

    def test_the_rating_survives_a_broken_rank_call(self):
        """The rated list is 17 MB and the likeliest thing to fail. A rating
        with no rank beside it is still worth showing."""
        self.wire(info=self.profile(), fail="user.ratedList")
        out = cf.refresh("aryan")
        self.assertEqual(out["rating"], 1400)
        self.assertIsNone(out["world_rank"])
        self.assertIn("rank unavailable", out["error"])

    def test_no_api_key_is_ever_sent(self):
        """Every endpoint used here is anonymous. Nothing should be carrying a
        key or a signature, so there is none to leak."""
        source = (REPO / "console" / "codeforces.py").read_text()
        for term in ("apiKey", "apiSig", "api_key", "secret"):
            self.assertNotIn(term, source, f"{term} appears in the module")


class Staleness(unittest.TestCase):
    def test_fresh_is_not_stale(self):
        self.assertFalse(cf.is_stale({"fetched_ts": time.time()}))

    def test_an_hour_old_is_stale(self):
        self.assertTrue(cf.is_stale({"fetched_ts": time.time() - 3601}))

    def test_nothing_cached_is_stale(self):
        self.assertTrue(cf.is_stale({}))


class TheEndpointCaches(unittest.TestCase):
    """A 17 MB download per page load would be absurd, so the answer is cached
    for an hour. What matters is when that cache is bypassed, and that a
    failed refresh does not blank out a rating that was true a minute ago."""

    def setUp(self):
        import main

        self.main = main
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
                inner.store[inner.name] = (
                    data.encode() if isinstance(data, str) else data
                )

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

    def fake_refresh(self, handle=None):
        handle = handle if isinstance(handle, str) else ""
        self.refreshes.append(handle)
        return {"handle": handle, "rating": 1400, "world_rank": 5,
                "fetched_ts": time.time(), "error": self.error}

    error = ""

    def cache(self, **kw):
        doc = {"handle": "aryan", "rating": 1234, "world_rank": 9,
               "fetched_ts": time.time(), "error": ""}
        doc.update(kw)
        self.store[self.main.CF_BLOB] = json.dumps(doc).encode()

    def get(self, query=""):
        with self.main.app.test_client() as client:
            return client.get("/api/codeforces" + query).get_json()

    def test_a_fresh_cache_is_served_without_asking_codeforces(self):
        self.cache()
        self.assertEqual(self.get()["rating"], 1234)
        self.assertEqual(self.refreshes, [])

    def test_an_hour_old_cache_is_refreshed(self):
        self.cache(fetched_ts=time.time() - 3601)
        self.assertEqual(self.get()["rating"], 1400)
        self.assertEqual(self.refreshes, ["aryan"])

    def test_changing_the_handle_refreshes_immediately(self):
        """Otherwise you would type a new handle and watch someone else's
        rating for the next hour."""
        self.cache(handle="someoneelse")
        self.assertEqual(self.get()["handle"], "aryan")
        self.assertEqual(self.refreshes, ["aryan"])

    def test_refresh_can_be_forced(self):
        self.cache()
        self.get("?refresh=1")
        self.assertEqual(self.refreshes, ["aryan"])

    def test_a_failed_refresh_keeps_the_last_good_rating(self):
        """A rating from fifty minutes ago is still true, and Codeforces
        being briefly unreachable is not worth blanking the header for."""
        self.cache(fetched_ts=time.time() - 3601)
        self.error = "Codeforces is down"
        try:
            out = self.get()
        finally:
            self.error = ""
        self.assertEqual(out["rating"], 1234)
        self.assertTrue(out["stale"])
        self.assertEqual(out["error"], "Codeforces is down")

    def test_the_refreshed_answer_is_written_back(self):
        self.cache(fetched_ts=time.time() - 3601)
        self.get()
        stored = json.loads(self.store[self.main.CF_BLOB].decode())
        self.assertEqual(stored["rating"], 1400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
