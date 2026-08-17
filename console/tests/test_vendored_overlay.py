"""The vendored overlay must work the way the image assembles it.

overlay.py and rules.py are copied out of inbox-agent/agent/ into the console
image at build time. overlay.py does `from . import rules`, which needs a
parent package -- and when the copies landed as two loose modules on sys.path
that import raised ImportError inside normalise(). The damage was asymmetric
and quiet:

  * save() calls normalise() first, so every attempt to save the instructions
    box failed;
  * load() catches everything, so every read fell back to defaults -- showing
    an empty instructions box and, worse, showing cleanup as preview-only
    while the agent was reading a stored setting that had it switched on.

These tests copy the current agent files into a temporary directory laid out
exactly as the Dockerfile lays them out. That matters: a checkout's own
console/_agent/ copies are generated and can be months stale, so a test that
imported those would have passed throughout the outage.
"""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
AGENT = REPO / "inbox-agent" / "agent"
MARKER = REPO / "console" / "_agent" / "__init__.py"


def vendor() -> Path:
    """Assemble the package the way console/Dockerfile does."""
    root = Path(tempfile.mkdtemp())
    pkg = root / "_agent"
    pkg.mkdir()
    shutil.copy(MARKER, pkg / "__init__.py")
    for name in ("overlay.py", "rules.py"):
        shutil.copy(AGENT / name, pkg / name)
    return root


class FakeBlob:
    def __init__(self, payload: bytes | None):
        self.payload = payload
        self.written: bytes | None = None

    def download_as_bytes(self):
        if self.payload is None:
            raise FileNotFoundError("no such object")
        return self.payload

    def upload_from_string(self, data, content_type=None):
        self.written = data.encode() if isinstance(data, str) else data


class FakeGCS:
    def __init__(self, blob):
        self._blob = blob

    def bucket(self, name):
        return self

    def blob(self, name):
        return self._blob


class VendoredLayout(unittest.TestCase):
    """Loaded from a fresh copy, so this cannot pass against a stale one."""

    @classmethod
    def setUpClass(cls):
        cls.root = vendor()
        sys.path.insert(0, str(cls.root))
        for name in [n for n in sys.modules if n == "_agent" or n.startswith("_agent.")]:
            del sys.modules[name]
        from _agent import overlay  # noqa: PLC0415

        cls.overlay = overlay

    @classmethod
    def tearDownClass(cls):
        sys.path.remove(str(cls.root))
        for name in [n for n in sys.modules if n == "_agent" or n.startswith("_agent.")]:
            del sys.modules[name]
        shutil.rmtree(cls.root, ignore_errors=True)

    def test_the_marker_is_committed(self):
        """Generated copies plus an uncommitted marker is the broken state."""
        self.assertTrue(MARKER.exists(), "console/_agent/__init__.py is missing")

    def test_it_is_a_package_so_relative_imports_resolve(self):
        self.assertEqual(self.overlay.__package__, "_agent")

    def test_normalise_does_not_raise_on_the_save_path(self):
        """This is what broke the instructions box: save() normalises first."""
        out = self.overlay.normalise({"instructions": "always star Prof Sharma"})
        self.assertEqual(out["instructions"], "always star Prof Sharma")
        self.assertIsInstance(out["derived"], dict)

    def test_instructions_survive_a_save_and_load_round_trip(self):
        blob = FakeBlob(None)
        gcs = FakeGCS(blob)
        self.overlay.save("bkt", {"instructions": "star the CDC office"}, client=gcs)
        self.assertIsNotNone(blob.written, "nothing was written")

        blob.payload = blob.written
        back = self.overlay.load("bkt", client=gcs)
        self.assertEqual(back["instructions"], "star the CDC office")
        self.assertGreater(back["updated_ts"], 0)


class ReadFailuresAreDistinguishable(unittest.TestCase):
    """"Nothing saved" and "saved but unreadable" must not look the same.

    They produce the same settings either way, but only one of them means the
    page is telling you something different from what the agent is using."""

    @classmethod
    def setUpClass(cls):
        VendoredLayout.setUpClass.__func__(cls)

    @classmethod
    def tearDownClass(cls):
        VendoredLayout.tearDownClass.__func__(cls)

    def test_nothing_saved_is_not_reported_as_an_error(self):
        data, error = self.overlay.load_with_status("bkt", client=FakeGCS(FakeBlob(None)))
        self.assertEqual(error, "")
        self.assertEqual(data["updated_ts"], 0.0)

    def test_a_stored_but_corrupt_overlay_is_reported(self):
        blob = FakeBlob(b"{not json at all")
        data, error = self.overlay.load_with_status("bkt", client=FakeGCS(blob))
        self.assertTrue(error, "a corrupt overlay was reported as 'nothing saved'")
        self.assertEqual(data["updated_ts"], 0.0)

    def test_a_stored_switch_is_read_back_as_stored(self):
        """The divergence that mattered: the page said preview-only while the
        agent read a setting that let it move mail to Trash."""
        blob = FakeBlob(json.dumps({"cleanup_dry_run": False, "updated_ts": 1.0}).encode())
        data, error = self.overlay.load_with_status("bkt", client=FakeGCS(blob))
        self.assertEqual(error, "")
        self.assertIs(data["cleanup_dry_run"], False)

    def test_absent_and_false_stay_different_things(self):
        self.assertIsNone(self.overlay.normalise({})["cleanup_dry_run"])
        self.assertIs(self.overlay.normalise({"cleanup_dry_run": False})["cleanup_dry_run"], False)


if __name__ == "__main__":
    unittest.main(verbosity=2)
