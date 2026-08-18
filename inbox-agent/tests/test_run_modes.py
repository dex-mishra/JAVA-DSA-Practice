"""The buttons on the site have to produce mail.

Three of the four run modes could finish successfully and send you nothing,
which is indistinguishable from a broken button:

  * cleanup wrote its findings to Cloud Logging and returned -- so the one
    button whose entire purpose is to show you something showed you nothing;
  * a digest you asked for by hand stayed silent when it had nothing new,
    which is now the common case rather than the rare one;
  * a review of an empty inbox returned without a word.

And the cleanup button is labelled "show me what it would bin", so the most
important assertion here is the one that says it cannot bin.
"""

from __future__ import annotations

import copy
import sys
import time
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import main as main_mod  # noqa: E402
from agent import report as report_mod  # noqa: E402
from agent.classify import Label  # noqa: E402
from agent.config import Account, Settings, load_policy  # noqa: E402
from agent.gmail import Message  # noqa: E402

POLICY = load_policy(Path(__file__).parent.parent / "config.yaml")
NOW = datetime(2026, 8, 16, 21, 15, tzinfo=ZoneInfo("Asia/Kolkata"))


def junk(mid: str) -> Message:
    """Bulk mail old enough and dull enough to be genuinely binnable."""
    return Message(
        id=mid,
        thread_id="t" + mid,
        account="primary",
        subject=f"Weekly roundup {mid}",
        sender="Unstop <news@unstop.example>",
        sender_email="news@unstop.example",
        to="me@example.com",
        date_ts=time.time() - 40 * 86400,
        snippet="newsletter",
        body="newsletter",
        label_ids=["CATEGORY_PROMOTIONS"],
        headers={"List-Unsubscribe": "<https://unstop.example/u>"},
    )


class FakeClient:
    """Just enough Gmail to drive a cleanup pass, and it records the damage."""

    def __init__(self, messages):
        self._messages = messages
        self.trashed: list[str] = []
        self.labelled: list[tuple[str, str]] = []
        self.starred: list[str] = []

    def search_ids(self, query, limit):
        return [m.id for m in self._messages][:limit]

    def fetch(self, ids, body_chars):
        return [m for m in self._messages if m.id in set(ids)]

    def thread_has_sent(self, thread_id):
        return False

    def trash(self, message_id):
        self.trashed.append(message_id)
        return True

    def star(self, message_id, label=None):
        self.starred.append(message_id)
        return True

    def apply_label(self, message_id, label):
        self.labelled.append((message_id, label))
        return True


class FakeClassifier:
    batch_size = 25

    def classify(self, messages, body_chars):
        return {
            m.id: Label(id=m.id, category="newsletter", importance="low")
            for m in messages
        }


def settings_with(cleanup_dry_run: bool) -> Settings:
    policy = copy.deepcopy(POLICY)
    policy["cleanup"]["dry_run"] = cleanup_dry_run
    policy["cleanup"]["quarantine_label"] = None
    return Settings(
        project="p",
        region="asia-south1",
        state_bucket="",
        gemini_model="m",
        vertex_location="asia-south1",
        report_to="me@example.com",
        timezone="Asia/Kolkata",
        dry_run=False,
        github_repo="",
        github_secret="",
        accounts=[Account(key="primary", email="me@example.com",
                          secret_name="s", can_send=True)],
        policy=policy,
    )


class PreviewCannotBin(unittest.TestCase):
    """The safety property. "Show me what it would bin" must not bin, and it
    must not depend on a switch elsewhere being set the way the page says."""

    def run_cleanup(self, *, cleanup_dry_run, force_preview):
        settings = settings_with(cleanup_dry_run)
        client = FakeClient([junk("a"), junk("b"), junk("c")])
        trashed, would, _ = main_mod._run_cleanup(
            {"primary": client}, settings, FakeClassifier(),
            force_preview=force_preview,
        )
        return client, trashed, would

    def test_live_cleanup_really_bins(self):
        """The control. Without this the test below proves nothing -- it
        would pass just as well against a cleanup that never worked."""
        client, trashed, would = self.run_cleanup(
            cleanup_dry_run=False, force_preview=False
        )
        self.assertEqual(len(trashed), 3)
        self.assertEqual(would, [])
        self.assertEqual(len(client.trashed), 3)

    def test_preview_bins_nothing_even_when_cleanup_is_live(self):
        client, trashed, would = self.run_cleanup(
            cleanup_dry_run=False, force_preview=True
        )
        self.assertEqual(trashed, [])
        self.assertEqual(len(would), 3)
        self.assertEqual(client.trashed, [], "preview moved real mail to Trash")

    def test_preview_cannot_make_a_dry_run_live(self):
        """The flag only ever tightens. It has no false setting that acts."""
        client, trashed, _ = self.run_cleanup(
            cleanup_dry_run=True, force_preview=True
        )
        self.assertEqual(trashed, [])
        self.assertEqual(client.trashed, [])


class CleanupReports(unittest.TestCase):
    def rows(self, n):
        return [(junk(str(i)), "bulk mail, unread, 40 days old") for i in range(n)]

    def test_preview_says_nothing_was_touched(self):
        subject, html = report_mod.render_cleanup(
            [], self.rows(3), NOW, dry_run=True
        )
        self.assertIn("3 would be binned", subject)
        self.assertIn("Would be binned (3)", html)
        self.assertNotIn("Moved to Trash", html)

    def test_a_live_run_says_where_the_mail_went(self):
        subject, html = report_mod.render_cleanup(
            self.rows(2), [], NOW, dry_run=False
        )
        self.assertIn("Binned 2 messages", subject)
        self.assertIn("Moved to Trash", html)
        self.assertIn("30 days", html)

    def test_an_empty_result_still_produces_a_report(self):
        """Silence is what made a working button look broken."""
        subject, html = report_mod.render_cleanup([], [], NOW, dry_run=True)
        self.assertIn("nothing matched", subject.lower())
        self.assertIn("matched the cleanup rules", html)

    def test_the_listing_is_capped_and_says_so(self):
        _, html = report_mod.render_cleanup([], self.rows(58), NOW, dry_run=True)
        self.assertIn("and 18 more", html)

    def test_subjects_are_escaped(self):
        msg = junk("x")
        msg.subject = "<script>alert(1)</script>"
        _, html = report_mod.render_cleanup(
            [], [(msg, "junk")], NOW, dry_run=True
        )
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)


class OwnMailStillRecognised(unittest.TestCase):
    """The new report kinds have to be covered by the self-mail screen, or
    each one becomes a fresh way for the agent to react to itself."""

    def test_the_new_subjects_are_treated_as_ours(self):
        from agent.policy import is_own_mail

        for subject in ("Junk preview: 12 would be binned",
                        "Binned 4 messages",
                        "Binned nothing this run"):
            msg = junk("z")
            msg.subject = subject
            msg.sender_email = "me@example.com"
            msg.headers = {}
            self.assertTrue(is_own_mail(msg, {"me@example.com"}), subject)


class AlertSubjects(unittest.TestCase):
    """"Urgent: Urgent: Urgent: Inbox: 5 urgent" -- one prefix per hop."""

    def item(self, subject):
        msg = junk("u")
        msg.subject = subject
        return report_mod.Item(msg, Label(id="u", category="academic"))

    def test_an_existing_urgent_prefix_is_not_repeated(self):
        subject, _ = report_mod.render_alert(
            [self.item("Urgent: Inbox: 5 urgent, 15 to action")], NOW
        )
        self.assertEqual(subject, "Urgent: Inbox: 5 urgent, 15 to action")

    def test_several_layers_all_come_off(self):
        subject, _ = report_mod.render_alert(
            [self.item("Urgent: Urgent: Urgent: Something")], NOW
        )
        self.assertEqual(subject, "Urgent: Something")

    def test_an_ordinary_subject_is_untouched(self):
        subject, _ = report_mod.render_alert([self.item("Interview tomorrow")], NOW)
        self.assertEqual(subject, "Urgent: Interview tomorrow")

    def test_a_subject_that_was_only_the_prefix_still_says_something(self):
        subject, _ = report_mod.render_alert([self.item("Urgent:")], NOW)
        self.assertEqual(subject, "Urgent: Something needs you")


class CommandLine(unittest.TestCase):
    """The flags the console sends have to exist and reach the right mode."""

    def dispatch_args(self, argv):
        seen = {}

        def fake_dispatch(mode, settings, *, manual=False, preview=False):
            seen.update(mode=mode, manual=manual, preview=preview)
            return 0

        original_dispatch = main_mod._dispatch
        original_load = main_mod.load_settings
        original_log = main_mod.archive_mod.log_run
        main_mod._dispatch = fake_dispatch
        main_mod.load_settings = lambda *a, **k: settings_with(True)
        main_mod.archive_mod.log_run = lambda *a, **k: None
        try:
            main_mod.main(argv)
        finally:
            main_mod._dispatch = original_dispatch
            main_mod.load_settings = original_load
            main_mod.archive_mod.log_run = original_log
        return seen

    def test_the_scheduler_form_is_unchanged(self):
        """Cloud Scheduler passes only --mode, and must keep its quiet
        behaviour: four "all clear" emails a day is the thing skip_if_empty
        exists to prevent."""
        self.assertEqual(
            self.dispatch_args(["--mode=digest"]),
            {"mode": "digest", "manual": False, "preview": False},
        )

    def test_the_site_form_is_understood(self):
        self.assertEqual(
            self.dispatch_args(["--mode=cleanup", "--manual", "--preview"]),
            {"mode": "cleanup", "manual": True, "preview": True},
        )

    def test_cleanup_no_longer_dead_ends_in_the_logs(self):
        """It used to log its findings and return without delivering."""
        import inspect

        source = inspect.getsource(main_mod._dispatch)
        self.assertIn("run_cleanup_only", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
