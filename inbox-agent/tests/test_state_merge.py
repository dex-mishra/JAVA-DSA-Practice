"""Concurrent runs must merge, not overwrite and not surrender.

The digest and the sweep were scheduled on the same minute, so four times a
day they ran together. The one that finished second lost a generation
precondition and dropped its entire write -- which is how a digest could send
you an email while `last_digest_ts` stayed hours old, and how the record of
what had already been reported went missing so the next digest repeated it.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from google.api_core import exceptions as gcs_exceptions  # noqa: E402

from agent.state import State  # noqa: E402


class FakeBlob:
    """A GCS object with generation preconditions, and a scripted conflict."""

    def __init__(self, doc: dict, generation: int = 1):
        self.doc = dict(doc)
        self.generation = generation
        self.conflicts_remaining = 0
        self.other_writer = None
        self.writes = 0

    def download_as_bytes(self):
        return json.dumps(self.doc).encode()

    def upload_from_string(self, payload, content_type=None, if_generation_match=None):
        if self.conflicts_remaining > 0:
            self.conflicts_remaining -= 1
            # Someone else lands their write first.
            if self.other_writer:
                self.doc = self.other_writer(self.doc)
            self.generation += 1
            raise gcs_exceptions.PreconditionFailed("generation mismatch")
        if if_generation_match is not None and if_generation_match != self.generation:
            raise gcs_exceptions.PreconditionFailed("generation mismatch")
        self.doc = json.loads(payload)
        self.generation += 1
        self.writes += 1


class FakeBucket:
    name = "fake"

    def __init__(self, blob):
        self._blob = blob

    def blob(self, _name):
        return self._blob


class FakeClient:
    def __init__(self, blob):
        self._blob = blob

    def bucket(self, _name):
        return FakeBucket(self._blob)


def make(doc, generation=1):
    blob = FakeBlob(doc, generation)
    state = State("fake", client=FakeClient(blob))
    return state, blob


BASE = {
    "version": 1, "alerted": {}, "reported": {"old": 100.0},
    "last_digest_ts": 10.0, "last_cleanup_ts": 5.0, "last_alert_ts": 0.0,
    "trashed_total": 7, "proposals": {}, "events_created": 2,
}


class UncontendedWrite(unittest.TestCase):
    def test_plain_save_still_works(self):
        state, blob = make(BASE)
        state.load()
        state.mark_digest_sent()
        state.save()
        self.assertEqual(blob.writes, 1)
        self.assertGreater(blob.doc["last_digest_ts"], 10.0)


class ContendedWrite(unittest.TestCase):
    """A sweep lands between our load and our save."""

    def sweep_wrote(self, doc):
        doc = dict(doc)
        doc["alerted"] = {**doc.get("alerted", {}), "sweep_msg": 999.0}
        doc["last_alert_ts"] = 999.0
        return doc

    def test_our_write_survives_instead_of_being_dropped(self):
        state, blob = make(BASE)
        state.load()
        blob.conflicts_remaining = 1
        blob.other_writer = self.sweep_wrote

        state.mark_digest_sent()
        state.mark_reported(["fresh1", "fresh2"])
        state.save()

        self.assertEqual(blob.writes, 1, "the retry never landed")
        self.assertIn("fresh1", blob.doc["reported"])
        self.assertIn("fresh2", blob.doc["reported"])
        self.assertGreater(blob.doc["last_digest_ts"], 10.0)

    def test_the_other_run_is_not_clobbered_either(self):
        state, blob = make(BASE)
        state.load()
        blob.conflicts_remaining = 1
        blob.other_writer = self.sweep_wrote

        state.mark_reported(["fresh1"])
        state.save()

        self.assertIn("sweep_msg", blob.doc["alerted"], "the sweep's alert was lost")
        self.assertEqual(blob.doc["last_alert_ts"], 999.0)

    def test_counters_add_rather_than_overwrite(self):
        """Both runs binned things. The total must be the sum, which is why
        the delta is applied and not the absolute value."""
        state, blob = make(BASE)
        state.load()

        def other_binned_four(doc):
            doc = dict(doc)
            doc["trashed_total"] = doc.get("trashed_total", 0) + 4
            return doc

        blob.conflicts_remaining = 1
        blob.other_writer = other_binned_four

        state.mark_cleanup_ran(3)          # 7 -> 10 locally
        state.save()

        # remote reached 11 (7+4); our delta of 3 lands on top.
        self.assertEqual(blob.doc["trashed_total"], 14)

    def test_resolving_a_batch_is_not_undone(self):
        doc = dict(BASE)
        doc["proposals"] = {"tok": {"token": "tok", "resolved": False, "sent_ts": 1.0}}
        state, blob = make(doc)
        state.load()

        def other_touched_state(d):
            d = dict(d)
            d["last_alert_ts"] = 500.0
            return d

        blob.conflicts_remaining = 1
        blob.other_writer = other_touched_state

        state.resolve_batch("tok")
        state.save()
        self.assertTrue(blob.doc["proposals"]["tok"]["resolved"])

    def test_a_batch_added_by_the_other_run_survives(self):
        state, blob = make(BASE)
        state.load()

        def other_added_batch(d):
            d = dict(d)
            d["proposals"] = {"newtok": {"token": "newtok", "resolved": False, "sent_ts": 9.0}}
            return d

        blob.conflicts_remaining = 1
        blob.other_writer = other_added_batch

        state.mark_reported(["x"])
        state.save()
        self.assertIn("newtok", blob.doc["proposals"])

    def test_gives_up_loudly_rather_than_looping(self):
        state, blob = make(BASE)
        state.load()
        blob.conflicts_remaining = 99
        state.mark_reported(["x"])
        state.save(attempts=3)
        self.assertEqual(blob.writes, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
