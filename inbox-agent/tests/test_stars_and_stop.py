"""Two things the agent had no way to do: leave a star alone, and stop.

The star rules were re-evaluated from scratch on every run against whatever
was in the scan window, so a message you unstarred by hand was starred again
within fifteen minutes. Nothing was wrong with the rules; the agent simply
kept no record of having acted, so "not starred yet" and "starred, and you
took it off" were the same state to it.

And there was no way to halt it short of a redeploy -- the dry-run switches
change what it *does* with your mail, not whether it reads it.
"""

from __future__ import annotations

import sys
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import main as main_mod  # noqa: E402
from agent import overlay as overlay_mod  # noqa: E402
from agent.classify import Label  # noqa: E402
from agent.state import State  # noqa: E402
from agent.gmail import Message  # noqa: E402
from tests.test_run_modes import FakeClient, settings_with  # noqa: E402


class MemoryState(State):
    """State without GCS. Records what save() was asked to keep."""

    def __init__(self):  # noqa: D107 -- deliberately no super()
        self.data = {"starred": {}, "alerted": {}, "reported": {}}
        self.saved = 0

    def save(self, attempts: int = 4) -> bool:
        self.saved += 1
        return True


def faculty(mid: str) -> Message:
    """Mail the star rules will flag."""
    return Message(
        id=mid, thread_id="t" + mid, account="primary",
        subject="BTP meeting on Thursday",
        sender="Prof Sarkar <korak@iitkgp.ac.in>",
        sender_email="korak@iitkgp.ac.in",
        to="me@example.com", date_ts=time.time() - 3600,
        snippet="meeting", body="meeting", label_ids=[], headers={},
    )


class StarsStayUnstarred(unittest.TestCase):
    def setUp(self):
        self.settings = settings_with(True)
        self.settings.policy["star"] = {"enabled": True, "max_stars_per_run": 50,
                                        "faculty_senders": ["@iitkgp.ac.in"]}
        self.messages = [faculty("m1"), faculty("m2")]
        self.labels = {m.id: Label(id=m.id, category="academic") for m in self.messages}

    def run_once(self, state):
        client = FakeClient(self.messages)
        starred = main_mod._apply_stars(
            self.messages, self.labels, {"primary": client}, self.settings, state
        )
        return client, starred

    def test_the_first_run_stars(self):
        state = MemoryState()
        client, starred = self.run_once(state)
        self.assertEqual(len(starred), 2)
        self.assertEqual(sorted(client.starred), ["m1", "m2"])
        self.assertEqual(sorted(state.data["starred"]), ["m1", "m2"])

    def test_a_second_run_does_not_star_again(self):
        """The actual complaint: it re-starred what had been unstarred."""
        state = MemoryState()
        self.run_once(state)
        client, starred = self.run_once(state)
        self.assertEqual(starred, [], "it starred mail it had already starred")
        self.assertEqual(client.starred, [], "it touched Gmail at all")

    def test_an_unstarred_message_is_left_alone_however_it_looks(self):
        """Deliberately not a live check of the Gmail flag: the record says we
        have had our say, so the user's unstar is the last word."""
        state = MemoryState()
        self.run_once(state)
        for m in self.messages:          # as if the user cleared the flag
            m.label_ids = []
        _, starred = self.run_once(state)
        self.assertEqual(starred, [])

    def test_mail_the_agent_has_not_seen_is_still_starred(self):
        state = MemoryState()
        self.run_once(state)
        self.messages.append(faculty("m3"))
        self.labels["m3"] = Label(id="m3", category="academic")
        _, starred = self.run_once(state)
        self.assertEqual([i.message.id for i in starred], ["m3"])

    def test_without_state_the_old_behaviour_is_unchanged(self):
        """The parameter is optional; run_review and the tests that predate
        this must not change behaviour."""
        client = FakeClient(self.messages)
        starred = main_mod._apply_stars(
            self.messages, self.labels, {"primary": client}, self.settings
        )
        self.assertEqual(len(starred), 2)


class StarMemorySurvivesMerging(unittest.TestCase):
    def test_two_runs_starring_different_mail_both_persist(self):
        state = State.__new__(State)
        state.data = {"starred": {"a": 1.0}, "alerted": {}, "reported": {},
                      "proposals": {}, "trashed_total": 0, "events_created": 0}
        state._base = {"trashed_total": 0, "events_created": 0}
        merged = state._merge_onto({"starred": {"b": 2.0}, "alerted": {}, "reported": {}})
        self.assertEqual(sorted(merged["starred"]), ["a", "b"])


class TheStopSwitch(unittest.TestCase):
    def test_it_defaults_to_running(self):
        self.assertIs(overlay_mod.normalise({})["paused"], False)

    def test_it_is_a_plain_bool_not_a_tristate(self):
        """The dry-run switches have three states because there is a deployed
        default to defer to. "Stopped" has no such thing: off means off."""
        self.assertIs(overlay_mod.normalise({"paused": None})["paused"], False)
        self.assertIs(overlay_mod.normalise({"paused": True})["paused"], True)
        self.assertIs(overlay_mod.normalise({"paused": "on"})["paused"], True)
        self.assertIs(overlay_mod.normalise({"paused": "nonsense"})["paused"], False)

    def dispatched(self, mode, paused):
        """Run main() and report whether it reached the work."""
        seen = {"dispatched": False}
        settings = settings_with(True)
        settings.paused = paused

        def fake_dispatch(*a, **k):
            seen["dispatched"] = True
            return 0

        original = (main_mod._dispatch, main_mod.load_settings,
                    main_mod.archive_mod.log_run)
        logged = []
        main_mod._dispatch = fake_dispatch
        main_mod.load_settings = lambda *a, **k: settings
        main_mod.archive_mod.log_run = lambda *a, **k: logged.append(k)
        try:
            code = main_mod.main([f"--mode={mode}"])
        finally:
            (main_mod._dispatch, main_mod.load_settings,
             main_mod.archive_mod.log_run) = original
        return code, seen["dispatched"], logged

    def test_stopped_means_no_mailbox_is_opened(self):
        code, dispatched, logged = self.dispatched("digest", paused=True)
        self.assertEqual(code, 0)
        self.assertFalse(dispatched, "it went on to read mail while stopped")
        self.assertIn("stopped", logged[0]["detail"])

    def test_every_acting_mode_is_stopped(self):
        for mode in ("digest", "sweep", "review", "cleanup", "site-update"):
            _, dispatched, _ = self.dispatched(mode, paused=True)
            self.assertFalse(dispatched, mode)

    def test_check_still_runs_so_you_can_test_the_wiring(self):
        _, dispatched, _ = self.dispatched("check", paused=True)
        self.assertTrue(dispatched)

    def test_running_is_unaffected(self):
        code, dispatched, _ = self.dispatched("digest", paused=False)
        self.assertEqual(code, 0)
        self.assertTrue(dispatched)


if __name__ == "__main__":
    unittest.main(verbosity=2)
