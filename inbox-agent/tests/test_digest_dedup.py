"""A message is summarised once, then only chased while it stays open.

The dedup helpers existed in state.py from the start and were never called.
Written but unwired is the failure mode this file guards: every assertion
below passed trivially before, because nothing consulted the state at all.
"""

from __future__ import annotations

import sys
import time
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import report as report_mod  # noqa: E402
from agent.classify import Label  # noqa: E402
from agent.config import load_policy  # noqa: E402
from agent.gmail import Message  # noqa: E402
from agent.state import State  # noqa: E402

POLICY = load_policy(Path(__file__).parent.parent / "config.yaml")
NOW = datetime(2026, 8, 16, 9, 0, tzinfo=ZoneInfo("Asia/Kolkata"))


def msg(mid: str, subject: str = "Something") -> Message:
    return Message(
        id=mid, thread_id="t" + mid, account="primary", subject=subject,
        sender="Prof <prof@iitkgp.ac.in>", sender_email="prof@iitkgp.ac.in",
        to="me@example.com", date_ts=time.time() - 3600, snippet=subject,
        body=subject, label_ids=[], headers={},
    )


class FakeState(State):
    """State without GCS. Only the dedup surface is exercised here."""

    def __init__(self, reported: set[str]):  # noqa: D107 -- deliberately no super()
        self.data = {"reported": {r: time.time() for r in reported}}


class ReportedTracking(unittest.TestCase):
    def test_state_records_and_recognises(self):
        state = FakeState(set())
        self.assertFalse(state.already_reported("a"))
        state.mark_reported(["a", "b"])
        self.assertTrue(state.already_reported("a"))
        self.assertTrue(state.already_reported("b"))
        self.assertFalse(state.already_reported("c"))


class SplitLogic(unittest.TestCase):
    """The partition run_digest performs, exercised directly."""

    def split(self, messages, labels, reported, repeat="open_only"):
        state = FakeState(reported)

        def still_open(m):
            lab = labels.get(m.id) or Label.safe_default(m.id)
            return bool(lab.needs_action or lab.needs_reply)

        if repeat == "always":
            return messages, []
        fresh = [m for m in messages if not state.already_reported(m.id)]
        seen = [m for m in messages if state.already_reported(m.id)]
        carried = [m for m in seen if still_open(m)] if repeat == "open_only" else []
        return fresh, carried

    def setUp(self):
        self.messages = [msg("new1"), msg("old_open"), msg("old_done")]
        self.labels = {
            "new1": Label(id="new1", category="academic"),
            "old_open": Label(id="old_open", category="academic", needs_action=True),
            "old_done": Label(id="old_done", category="academic"),
        }
        self.reported = {"old_open", "old_done"}

    def test_new_mail_is_listed(self):
        fresh, _ = self.split(self.messages, self.labels, self.reported)
        self.assertEqual([m.id for m in fresh], ["new1"])

    def test_settled_old_mail_disappears_entirely(self):
        """The actual complaint: an email already summarised should not come
        round again once it no longer wants anything."""
        fresh, carried = self.split(self.messages, self.labels, self.reported)
        ids = {m.id for m in fresh} | {m.id for m in carried}
        self.assertNotIn("old_done", ids)

    def test_open_old_mail_is_chased_but_not_relisted(self):
        """Dropping it outright would be worse than repeating -- an unanswered
        deadline would be mentioned once and then go quiet."""
        fresh, carried = self.split(self.messages, self.labels, self.reported)
        self.assertNotIn("old_open", [m.id for m in fresh])
        self.assertEqual([m.id for m in carried], ["old_open"])

    def test_never_drops_even_open_items(self):
        fresh, carried = self.split(self.messages, self.labels, self.reported, "never")
        self.assertEqual([m.id for m in fresh], ["new1"])
        self.assertEqual(carried, [])

    def test_always_restores_the_old_behaviour(self):
        fresh, carried = self.split(self.messages, self.labels, self.reported, "always")
        self.assertEqual(len(fresh), 3)
        self.assertEqual(carried, [])


class CarriedRendering(unittest.TestCase):
    def data(self, carried):
        return report_mod.DigestData(
            items=[report_mod.Item(msg("new1"), Label(id="new1", category="academic"))],
            carried=carried,
            scanned=3,
        )

    def test_carried_items_render_below_the_new_ones(self):
        item = report_mod.Item(
            msg("old_open", "Submit BTP form"),
            Label(id="old_open", category="academic", needs_action=True,
                  deadline_iso="2026-08-20"),
        )
        _, html = report_mod.render_digest(self.data([item]), POLICY, NOW)
        self.assertIn("Still open from before", html)
        self.assertIn("Submit BTP form", html)
        self.assertIn("2026-08-20", html)

    def test_no_carried_items_means_no_section(self):
        _, html = report_mod.render_digest(self.data([]), POLICY, NOW)
        self.assertNotIn("Still open from before", html)

    def test_headline_counts_what_is_listed_not_what_was_scanned(self):
        _, html = report_mod.render_digest(self.data([]), POLICY, NOW)
        self.assertIn("1 new of 3 read", html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
