"""What the agent tab hands to the page, and back.

The starring switch is a tristate on the wire, and the two ends have to agree
on that: `null` means "no opinion, use the deployed config", which is on.
A `false` that came back as `null`, or a `null` the page read as `false`,
would turn starring off for someone who never touched the switch -- or leave
it on for someone who did.

The calendar card is here for a different reason. It listed a title and a
date, which is not enough to tell two deadlines from the same sender apart,
and deciding is the entire job of that card.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO / "console"))

import main  # noqa: E402
from tests.test_shared_writes import FakeGCS  # noqa: E402


class ConsoleCase(unittest.TestCase):
    """Two separate paths to the same fake bucket.

    The console's own blobs go through main.gcs(). The overlay is shared code
    vendored from the agent and deliberately depends on nothing of the
    console's, so it builds its own storage.Client() -- which has to be
    stubbed at the library, not at main.
    """

    def setUp(self):
        from google.cloud import storage

        self.store = {}
        self.gcs = FakeGCS(self.store)
        self._real_gcs = main.gcs
        self._real_client = storage.Client
        self._real_bucket = main.BUCKET
        self._storage = storage

        main.gcs = lambda: self.gcs
        storage.Client = lambda *a, **k: self.gcs
        main.BUCKET = "test-bucket"
        main.app.config["TESTING"] = True
        self.client = main.app.test_client()

    def tearDown(self):
        main.gcs = self._real_gcs
        main.BUCKET = self._real_bucket
        self._storage.Client = self._real_client

    def put(self, name, doc):
        self.store[name] = (json.dumps(doc).encode(), 7)


class StarSwitchOnTheWire(ConsoleCase):
    def test_an_untouched_switch_reads_as_no_opinion(self):
        body = self.client.get("/api/settings").get_json()
        self.assertIn("star_enabled", body)
        self.assertIsNone(body["star_enabled"])

    def test_turning_it_off_survives_the_round_trip(self):
        saved = self.client.put(
            "/api/settings", json={"star_enabled": False}
        ).get_json()
        self.assertIs(saved["star_enabled"], False)
        self.assertIs(self.client.get("/api/settings").get_json()["star_enabled"], False)

    def test_saving_something_else_does_not_disturb_it(self):
        """The failure this guards: a tristate collapsed to a bool would have
        every save of the instructions box quietly switch starring off."""
        self.client.put("/api/settings", json={"star_enabled": False})
        self.client.put("/api/settings", json={"instructions": "Prof Sarkar matters."})
        self.assertIs(self.client.get("/api/settings").get_json()["star_enabled"], False)

    def test_it_is_independent_of_the_stop_switch(self):
        self.client.put("/api/settings", json={"star_enabled": False})
        body = self.client.get("/api/settings").get_json()
        self.assertFalse(body["paused"])


class ProposalsCarryTheirContext(ConsoleCase):
    def test_a_proposal_arrives_with_the_line_that_explains_it(self):
        self.put("state.json", {
            "proposals": {
                "tok": {
                    "token": "tok", "resolved": False, "sent_ts": 1,
                    "items": [{
                        "n": 1, "title": "Meesho DICE challenge",
                        "start": "2026-09-20", "all_day": True,
                        "source_url": "https://mail.google.com/x",
                        "context": "Registration closes 20 Sep",
                    }],
                }
            }
        })
        item = self.client.get("/api/proposals").get_json()["batches"][0]["items"][0]
        self.assertEqual(item["context"], "Registration closes 20 Sep")
        self.assertEqual(item["source_url"], "https://mail.google.com/x")

    def test_an_older_proposal_without_one_is_still_listed(self):
        """Batches written before this field existed are still sitting in
        state.json and must not disappear from the card."""
        self.put("state.json", {
            "proposals": {
                "tok": {
                    "token": "tok", "resolved": False, "sent_ts": 1,
                    "items": [{"n": 1, "title": "Viva", "start": "2026-09-20"}],
                }
            }
        })
        item = self.client.get("/api/proposals").get_json()["batches"][0]["items"][0]
        self.assertEqual(item["title"], "Viva")
        self.assertEqual(item["context"], "")


class AddingOneYourself(ConsoleCase):
    """The card can now queue an event the agent never proposed. It still
    cannot create one: that needs the calendar credentials, which stay with
    the job rather than with a service open to the internet."""

    def test_a_manual_event_is_queued_not_created(self):
        r = self.client.post("/api/calendar/request", json={
            "title": "Meesho DICE challenge closes", "start": "2026-09-20",
            "origin": "manual",
        })
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["status"], "pending")

    def test_a_bad_date_is_refused(self):
        r = self.client.post("/api/calendar/request", json={
            "title": "Something", "start": "next Tuesday",
        })
        self.assertEqual(r.status_code, 400)

    def test_a_second_tap_does_not_queue_it_twice(self):
        payload = {"title": "Same thing", "start": "2026-09-20"}
        self.assertEqual(self.client.post("/api/calendar/request", json=payload).status_code, 201)
        self.assertEqual(self.client.post("/api/calendar/request", json=payload).status_code, 409)


if __name__ == "__main__":
    unittest.main()
