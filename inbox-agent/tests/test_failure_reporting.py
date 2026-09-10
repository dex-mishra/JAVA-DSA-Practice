"""A failed run has to say why, on the website.

Four runs failed in a row -- two digests, two reviews -- and the run log
recorded "exited 1" for every one of them. That is what `return 1` looks
like from the outside: no way to tell an expired Gmail token from a deleted
secret from a bucket that lost its grant, and no answer short of learning
gcloud. The reason was in Cloud Logging the whole time, which is exactly the
place this project keeps deciding is not good enough.

These pin the reason reaching archive.log_run's detail field, which is what
the site renders under a failed run.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import main as main_mod  # noqa: E402
from tests.test_run_modes import settings_with  # noqa: E402


class RecordingRun:
    """Captures what main() hands to the run log."""

    def __init__(self):
        self.entries = []

    def __call__(self, bucket, **kw):
        self.entries.append(kw)

    @property
    def last(self):
        return self.entries[-1] if self.entries else None


class Harness(unittest.TestCase):
    def setUp(self):
        self.settings = settings_with(True)
        self.log_run = RecordingRun()
        self._saved = (
            main_mod.load_settings,
            main_mod.archive_mod.log_run,
            main_mod._connect,
        )
        main_mod.load_settings = lambda *a, **k: self.settings
        main_mod.archive_mod.log_run = self.log_run

    def tearDown(self):
        (main_mod.load_settings,
         main_mod.archive_mod.log_run,
         main_mod._connect) = self._saved

    def connect_fails(self, reason="RefreshError: invalid_grant: Token has been expired or revoked."):
        main_mod._connect = lambda settings: ({}, [f"primary (me@example.com): {reason}"])

    def connect_works(self):
        main_mod._connect = lambda settings: ({"primary": object()}, [])


class ConnectFailureIsExplained(Harness):
    def test_the_reason_reaches_the_run_log_not_just_exited_1(self):
        self.connect_fails()
        code = main_mod.main(["--mode=digest"])
        self.assertEqual(code, 1)
        detail = self.log_run.last["detail"]
        self.assertNotEqual(detail, "exited 1")
        self.assertIn("invalid_grant", detail)
        self.assertIn("primary", detail)

    def test_it_is_recorded_as_a_failure(self):
        self.connect_fails()
        main_mod.main(["--mode=digest"])
        self.assertFalse(self.log_run.last["ok"])

    def test_every_mode_that_opens_a_mailbox_explains_itself(self):
        for mode in ("digest", "sweep", "review", "cleanup"):
            self.log_run.entries.clear()
            self.connect_fails()
            code = main_mod.main([f"--mode={mode}"])
            self.assertEqual(code, 1, mode)
            self.assertIn("invalid_grant", self.log_run.last["detail"], mode)

    def test_which_account_failed_is_named(self):
        """Two mailboxes, one dead: the message has to say which, since
        re-authorising the wrong one fixes nothing."""
        main_mod._connect = lambda settings: (
            {}, ["primary (a@x.com): RefreshError: bad", "college (b@y.com): PermissionDenied: nope"]
        )
        main_mod.main(["--mode=digest"])
        detail = self.log_run.last["detail"]
        self.assertIn("primary", detail)
        self.assertIn("college", detail)
        self.assertIn("PermissionDenied", detail)

    def test_no_accounts_configured_says_so_rather_than_nothing(self):
        main_mod._connect = lambda settings: ({}, [])
        main_mod.main(["--mode=digest"])
        self.assertIn("no accounts configured", self.log_run.last["detail"])


class CheckReportsWhatIsWrong(Harness):
    """The one mode whose whole job is to tell you what is broken."""

    def run_check_with(self, **stubs):
        for name, value in stubs.items():
            setattr(main_mod, name, value)
        return main_mod.main(["--mode=check"])

    def test_a_dead_token_is_named_in_the_run_log(self):
        self.connect_fails()
        main_mod.State = lambda bucket: type("S", (), {"load": lambda self: None})()
        main_mod.Classifier = lambda *a, **k: object()
        code = main_mod.main(["--mode=check"])
        self.assertEqual(code, 1)
        self.assertIn("invalid_grant", self.log_run.last["detail"])

    def test_a_passing_check_records_no_problem(self):
        class FakeService:
            def users(self):
                return self

            def getProfile(self, userId=None):
                return self

            def execute(self):
                return {"emailAddress": "me@example.com", "messagesTotal": 10}

        main_mod._connect = lambda settings: (
            {"primary": type("C", (), {"service": FakeService()})()}, []
        )
        main_mod.State = lambda bucket: type("S", (), {"load": lambda self: None})()
        main_mod.Classifier = lambda *a, **k: object()
        code = main_mod.main(["--mode=check"])
        self.assertEqual(code, 0)
        self.assertTrue(self.log_run.last["ok"])
        self.assertEqual(self.log_run.last["detail"], "")


class ExpiredTokenSaysWhatToDo(unittest.TestCase):
    """The raw google-auth error is `invalid_grant`, which names no cause
    and no fix. The overwhelmingly likely cause has exactly one fix."""

    def load_with(self, refresh_error):
        from google.auth.exceptions import RefreshError

        from agent import gmail as gmail_mod

        saved = (gmail_mod.secretmanager.SecretManagerServiceClient,
                 gmail_mod.Credentials)

        class FakeSecrets:
            def access_secret_version(self, request=None):
                payload = type("P", (), {"data": b'{"refresh_token":"r","client_id":"c","client_secret":"s"}'})
                return type("R", (), {"payload": payload})()

        class FakeCreds:
            def __init__(self, **kw):
                pass

            def refresh(self, request):
                raise RefreshError(refresh_error)

        gmail_mod.secretmanager.SecretManagerServiceClient = lambda: FakeSecrets()
        gmail_mod.Credentials = FakeCreds
        try:
            return gmail_mod.load_credentials("proj", "inbox-agent-primary-token")
        finally:
            (gmail_mod.secretmanager.SecretManagerServiceClient,
             gmail_mod.Credentials) = saved

    def test_invalid_grant_names_the_testing_mode_trap_and_the_fix(self):
        from agent.gmail import TokenExpired

        with self.assertRaises(TokenExpired) as caught:
            self.load_with("('invalid_grant: Token has been expired or revoked.', {})")
        message = str(caught.exception)
        self.assertIn("Testing", message)
        self.assertIn("7 days", message)
        self.assertIn("authorize.py", message)
        self.assertIn("inbox-agent-primary-token", message)

    def test_an_unrelated_refresh_failure_is_not_dressed_up_as_that(self):
        """Guessing "your token expired" at a network blip would send you
        re-authorising for no reason."""
        from google.auth.exceptions import RefreshError

        with self.assertRaises(RefreshError):
            self.load_with("Connection reset by peer")


class PausedStillReportsCleanly(Harness):
    def test_a_paused_run_is_not_a_failure(self):
        """Regression guard: the pause path must keep reporting ok, not get
        swept up as an error now that failures raise."""
        self.settings.paused = True
        self.connect_fails()
        code = main_mod.main(["--mode=digest"])
        self.assertEqual(code, 0)
        self.assertTrue(self.log_run.last["ok"])
        self.assertIn("stopped from the website", self.log_run.last["detail"])


if __name__ == "__main__":
    unittest.main(verbosity=2)


class ExpiryIsAnnouncedBeforeItHappens(unittest.TestCase):
    """The token dies on a seven-day schedule and cannot be published out of
    it, so the only thing that helps is saying so while sending still works.
    Last time it went unnoticed for nineteen days."""

    def clients(self, *ages):
        return {
            f"acct{i}": type("C", (), {"token_age_days": age})()
            for i, age in enumerate(ages)
        }

    def test_a_fresh_token_says_nothing(self):
        self.assertIsNone(main_mod._token_days_left(self.clients(0.5, 1.0)))

    def test_it_starts_warning_two_days_out(self):
        left = main_mod._token_days_left(self.clients(5.2))
        self.assertIsNotNone(left)
        self.assertAlmostEqual(left, 1.8, places=1)

    def test_the_soonest_to_die_is_the_one_that_counts(self):
        """Two mailboxes, minted days apart: the warning has to track the
        older one, since that is what stops first."""
        left = main_mod._token_days_left(self.clients(1.0, 6.0))
        self.assertAlmostEqual(left, 1.0, places=1)

    def test_unstamped_tokens_produce_no_countdown(self):
        """Written before authorize.py stamped them. Silence beats inventing
        a deadline out of no data."""
        self.assertIsNone(main_mod._token_days_left(self.clients(None, None)))

    def test_an_expired_token_still_reports_rather_than_going_negative_in_the_copy(self):
        from agent import report as report_mod

        _, html = report_mod.render_digest(
            report_mod.DigestData(scanned=0, token_days_left=-0.4),
            {"report": {}},
            __import__("datetime").datetime(2026, 9, 10),
        )
        self.assertIn("Re-authorise today", html)

    def test_the_banner_names_the_command_and_is_absent_when_not_due(self):
        from agent import report as report_mod

        when = __import__("datetime").datetime(2026, 9, 10)
        warned = report_mod.render_digest(
            report_mod.DigestData(scanned=0, token_days_left=2), {"report": {}}, when
        )[1]
        self.assertIn("authorize.py", warned)
        self.assertIn("in 2 days", warned)

        quiet = report_mod.render_digest(
            report_mod.DigestData(scanned=0, token_days_left=None), {"report": {}}, when
        )[1]
        self.assertNotIn("Re-authorise", quiet)
