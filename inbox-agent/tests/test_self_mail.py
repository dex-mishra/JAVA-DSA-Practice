"""The agent must not react to its own reports.

Reports are sent from your address to your address, so they arrive in the
inbox being watched. An alert titled "Urgent: 3 things need you" is, read
plainly, urgent -- the classifier is right, and the loop is structural: alert
lands, next sweep reads it, alerts again.

So it is cut deterministically, before any judgement happens, and these tests
cover both the marker on new mail and the fallback for reports that were
already sitting in the inbox before the marker existed.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent.classify import Label  # noqa: E402
from agent.config import load_policy  # noqa: E402
from agent.gmail import AGENT_HEADER  # noqa: E402
from agent.policy import is_own_mail, urgent_verdict  # noqa: E402
from tests.test_policy import make_message  # noqa: E402

POLICY = load_policy(Path(__file__).parent.parent / "config.yaml")
ME = "malhotra.aryan.a01@gmail.com"
OWN = {ME, "aryanmalhotra@kgpian.iitkgp.ac.in"}


def report(subject: str, marked: bool = True, sender: str = ME):
    headers = {"X-Inbox-Agent": "digest"} if marked else {}
    return make_message(
        subject=subject, sender=f"Me <{sender}>", sender_email=sender,
        headers=headers, labels=[], age_days=0.01,
    )


class Marker(unittest.TestCase):
    def test_header_name_is_what_gmail_writes(self):
        self.assertEqual(AGENT_HEADER, "X-Inbox-Agent")

    def test_marked_mail_is_recognised(self):
        self.assertTrue(is_own_mail(report("Urgent: 3 things need you"), OWN))

    def test_marker_alone_is_enough_whatever_the_subject(self):
        self.assertTrue(is_own_mail(report("anything at all"), OWN))

    def test_marker_is_read_case_insensitively(self):
        msg = make_message(headers={"x-inbox-agent": "alert"}, sender_email=ME)
        self.assertTrue(is_own_mail(msg, OWN))


class FallbackForOlderReports(unittest.TestCase):
    """Reports already in the inbox predate the header."""

    def test_unmarked_report_from_yourself_is_recognised(self):
        for subject in [
            "Urgent: 3 things need you",
            "Inbox: 2 urgent, 5 to action",
            "Full inbox review: 8 still open of 300 read",
            "Added 2 to your calendar",
            "Nothing added to your calendar",
        ]:
            self.assertTrue(
                is_own_mail(report(subject, marked=False), OWN), subject
            )

    def test_the_same_subject_from_anyone_else_is_untouched(self):
        """The fallback is narrow on purpose. Someone else writing 'Urgent:'
        is exactly the mail this agent exists to surface."""
        other = report("Urgent: server is down", marked=False, sender="ops@company.com")
        self.assertFalse(is_own_mail(other, OWN))

    def test_your_own_ordinary_self_addressed_note_is_untouched(self):
        note = report("Reminder to myself about the GMAT", marked=False)
        self.assertFalse(is_own_mail(note, OWN))

    def test_no_sender_is_not_treated_as_ours(self):
        msg = make_message(sender_email="", headers={}, subject="Urgent: x")
        self.assertFalse(is_own_mail(msg, OWN))


class UrgentGateRefusesOwnMail(unittest.TestCase):
    """Defence in depth: even reaching the gate, it cannot alert."""

    def urgent_label(self):
        return Label(id="x", category="academic", importance="urgent", needs_action=True)

    def test_marked_mail_never_raises_an_alert(self):
        verdict = urgent_verdict(report("Urgent: 3 things need you"), self.urgent_label(), POLICY)
        self.assertFalse(verdict.allowed)
        self.assertIn("own report", verdict.reasons[-1])

    def test_not_even_via_the_always_urgent_list(self):
        policy = {**POLICY}
        policy["urgent"] = {**POLICY["urgent"], "always_urgent_senders": [ME]}
        verdict = urgent_verdict(report("Urgent: anything"), self.urgent_label(), policy)
        self.assertFalse(verdict.allowed)

    def test_a_real_urgent_message_still_gets_through(self):
        real = make_message(
            subject="Interview tomorrow 9am — confirm",
            sender="CDC <cdc@iitkgp.ac.in>", sender_email="cdc@iitkgp.ac.in",
            headers={}, labels=[], age_days=0.01,
        )
        self.assertTrue(urgent_verdict(real, self.urgent_label(), POLICY).allowed)


if __name__ == "__main__":
    unittest.main(verbosity=2)
