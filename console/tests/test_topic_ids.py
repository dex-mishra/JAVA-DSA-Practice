"""The topic id must match src/app.js byte for byte.

The page writes progress keyed by these ids and the API reads it back. If the
two implementations of djb2 ever diverge, every tick silently orphans: the
site keeps working, the API reports zero done, and nothing errors.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "_agent"))

import main  # noqa: E402


class TopicIdHash(unittest.TestCase):
    # Captured from a real browser session against the built page.
    KNOWN = {"1ue32lc", "8pvi1t", "10slz4v"}

    def test_known_browser_ids_are_reproduced(self):
        ids = {t["id"] for t in main.curriculum()["topics"]}
        self.assertTrue(ids, "curriculum did not load")
        missing = self.KNOWN - ids
        self.assertFalse(
            missing,
            f"ids seen in the browser are not reproduced in Python: {missing}",
        )

    def test_ids_are_unique(self):
        ids = [t["id"] for t in main.curriculum()["topics"]]
        dupes = len(ids) - len(set(ids))
        self.assertEqual(dupes, 0, f"{dupes} colliding topic ids")

    def test_shape_matches_javascript_base36(self):
        # toString(36) is lowercase alphanumeric with no padding.
        for t in main.curriculum()["topics"][:200]:
            self.assertRegex(t["id"], r"^[0-9a-z]+$")

    def test_rated_topic_count_matches_the_build(self):
        rated = [t for t in main.curriculum()["topics"] if t["rated"]]
        self.assertEqual(len(rated), 1328)


if __name__ == "__main__":
    unittest.main(verbosity=2)
