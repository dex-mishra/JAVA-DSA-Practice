"""The console shares two blobs with the agent and must not trample them.

state.json holds the calendar proposals the site lists -- and, in the same
object, which messages have been alerted on and summarised. actions.json holds
queued calendar requests, whose status the agent updates as it performs them.

Both used to be written by downloading the object, editing it in memory and
uploading the whole thing back. Whatever the agent wrote in between was simply
gone. Confirming one calendar item from the page could therefore erase the
record of what had already been summarised, and the visible symptom would be
the next digest repeating everything -- a bug that looks nothing like its cause.
"""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO / "console"))

import main  # noqa: E402


class FakeBlob:
    """A GCS blob with real generation-precondition semantics."""

    def __init__(self, store, name):
        self.store = store
        self.name = name
        self.generation = None
        self.writes = 0

    def download_as_bytes(self):
        from google.api_core import exceptions as gexc

        if self.name not in self.store:
            raise gexc.NotFound(self.name)
        payload, generation = self.store[self.name]
        self.generation = generation
        return payload

    def upload_from_string(self, data, content_type=None, if_generation_match=None):
        from google.api_core import exceptions as gexc

        current = self.store.get(self.name)
        current_gen = current[1] if current else 0
        if if_generation_match is not None and if_generation_match != current_gen:
            raise gexc.PreconditionFailed("generation mismatch")
        self.writes += 1
        payload = data.encode() if isinstance(data, str) else data
        self.store[self.name] = (payload, current_gen + 1)


class FakeGCS:
    def __init__(self, store):
        self.store = store
        self.blobs = {}

    def bucket(self, name):
        return self

    def blob(self, name):
        return self.blobs.setdefault(name, FakeBlob(self.store, name))


class PreconditionedWrites(unittest.TestCase):
    def setUp(self):
        self.store = {}
        self.gcs = FakeGCS(self.store)
        self._real_gcs = main.gcs
        main.gcs = lambda: self.gcs

    def tearDown(self):
        main.gcs = self._real_gcs

    def put(self, name, doc):
        self.store[name] = (json.dumps(doc).encode(), 7)

    def get(self, name):
        return json.loads(self.store[name][0].decode())

    def test_a_concurrent_agent_write_is_not_discarded(self):
        """The agent records a summarised message while the page is deciding."""
        self.put("state.json", {"reported": {"old": 1}, "proposals": {"tok": {"resolved": False}}})

        calls = {"n": 0}

        def resolve(doc):
            calls["n"] += 1
            # Simulate the agent writing between our read and our write, but
            # only on the first attempt.
            if calls["n"] == 1:
                live = self.get("state.json")
                live["reported"]["fresh_from_agent"] = 2
                self.store["state.json"] = (json.dumps(live).encode(), 8)
            doc["proposals"]["tok"]["resolved"] = True
            return True

        main.mutate_json_blob("state.json", resolve)

        final = self.get("state.json")
        self.assertTrue(final["proposals"]["tok"]["resolved"], "our edit was lost")
        self.assertIn(
            "fresh_from_agent", final["reported"],
            "the agent's concurrent write was overwritten",
        )
        self.assertEqual(calls["n"], 2, "the write should have been retried once")

    def test_an_absent_blob_is_created(self):
        main.mutate_json_blob("actions.json", lambda doc: doc.setdefault("actions", []))
        self.assertEqual(self.get("actions.json"), {"actions": []})

    def test_a_corrupt_blob_is_refused_rather_than_overwritten(self):
        """It may be state the agent is still using; losing it is worse than
        failing the request."""
        self.store["state.json"] = (b"{not json", 3)
        with self.assertRaises(ValueError):
            main.mutate_json_blob("state.json", lambda doc: None)
        self.assertEqual(self.store["state.json"][0], b"{not json", "it was overwritten")

    def test_giving_up_raises_rather_than_reporting_success(self):
        """Contention that never clears must not look like a saved change."""
        from google.api_core import exceptions as gexc

        self.put("state.json", {"a": 1})
        bumped = {"n": 0}

        def always_contended(doc):
            bumped["n"] += 1
            payload, generation = self.store["state.json"]
            self.store["state.json"] = (payload, generation + 1)

        with self.assertRaises(gexc.PreconditionFailed):
            main.mutate_json_blob("state.json", always_contended)
        self.assertEqual(bumped["n"], 4, "should have used all four attempts")


class QueuedActions(unittest.TestCase):
    def setUp(self):
        self.store = {}
        self.gcs = FakeGCS(self.store)
        self._real_gcs = main.gcs
        main.gcs = lambda: self.gcs

    def tearDown(self):
        main.gcs = self._real_gcs

    def actions(self):
        return json.loads(self.store[main.ACTIONS_BLOB][0].decode())["actions"]

    def test_appending_keeps_the_agents_status_updates(self):
        """A plain overwrite here could resurrect an action the agent had just
        marked done -- and create the calendar event a second time."""
        self.store[main.ACTIONS_BLOB] = (
            json.dumps({"actions": [{"id": "a1", "status": "done"}]}).encode(), 4
        )
        main._append_actions([{"id": "a2", "status": "pending"}])
        rows = self.actions()
        self.assertEqual([r["id"] for r in rows], ["a1", "a2"])
        self.assertEqual(rows[0]["status"], "done")

    def test_the_duplicate_check_happens_inside_the_write(self):
        self.store[main.ACTIONS_BLOB] = (
            json.dumps({"actions": [{"id": "a1", "status": "pending", "title": "BTP form"}]}).encode(),
            4,
        )
        added = main._append_actions(
            [{"id": "a2", "status": "pending", "title": "BTP form"}],
            skip_duplicate_of=lambda a: a.get("title") == "BTP form",
        )
        self.assertIsNone(added, "a duplicate was queued")
        self.assertEqual(len(self.actions()), 1)

    def test_the_history_stays_bounded(self):
        main._append_actions([{"id": f"a{i}", "status": "pending"} for i in range(80)])
        self.assertEqual(len(self.actions()), 50)


if __name__ == "__main__":
    unittest.main(verbosity=2)
