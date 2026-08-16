"""What the site actually sends when you press a run button.

The agent grew two flags -- --manual, so a run you asked for reports back even
when there is nothing to say, and --preview, so "show me what it would bin"
cannot bin. Both are useless if the page never sends them, and that is a gap
no agent-side test can see: the agent's tests prove the flags work, this one
proves they are passed.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "_agent"))

import main  # noqa: E402


class FakeResponse:
    status_code = 200
    text = "{}"


class FakeSession:
    """Captures the override payload instead of starting a real job."""

    last_payload: dict = {}

    def __init__(self, creds):
        pass

    def post(self, url, json=None, timeout=None):
        FakeSession.last_payload = json or {}
        return FakeResponse()


class RunArguments(unittest.TestCase):
    def setUp(self):
        import google.auth
        from google.auth.transport import requests as greq

        self._default = google.auth.default
        self._session = greq.AuthorizedSession
        google.auth.default = lambda *a, **k: (object(), "project")
        greq.AuthorizedSession = FakeSession
        FakeSession.last_payload = {}
        main.app.config["TESTING"] = True

    def tearDown(self):
        import google.auth
        from google.auth.transport import requests as greq

        google.auth.default = self._default
        greq.AuthorizedSession = self._session

    def args_for(self, mode: str) -> list[str]:
        with main.app.test_client() as client:
            resp = client.post("/api/run", json={"mode": mode})
            self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
        overrides = FakeSession.last_payload["overrides"]["containerOverrides"]
        return overrides[0]["args"]

    def test_the_bin_preview_button_is_pinned_to_read_only(self):
        args = self.args_for("cleanup")
        self.assertIn("--mode=cleanup", args)
        self.assertIn("--preview", args)

    def test_every_button_asks_for_a_reply(self):
        for mode in ("digest", "review", "sweep", "cleanup"):
            self.assertIn("--manual", self.args_for(mode), mode)

    def test_only_cleanup_gets_the_preview_flag(self):
        """--preview on a digest would quietly disable the daily cleanup."""
        for mode in ("digest", "review", "sweep"):
            self.assertNotIn("--preview", self.args_for(mode), mode)

    def test_an_unknown_mode_is_refused_before_anything_starts(self):
        with main.app.test_client() as client:
            resp = client.post("/api/run", json={"mode": "rm -rf"})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(FakeSession.last_payload, {})


if __name__ == "__main__":
    unittest.main(verbosity=2)
