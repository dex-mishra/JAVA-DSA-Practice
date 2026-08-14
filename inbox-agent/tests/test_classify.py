"""Tests for response-parsing in classify.py.

Regression coverage for a real production crash: the unstructured fallback
call (used when the schema-constrained call returns nothing usable) isn't
bound to the {"results": [...]} wrapper and can return a bare JSON array
instead. The parsing helpers must accept either shape.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent.classify import _coerce, _extract_json, _extract_rows  # noqa: E402


class ExtractJsonTests(unittest.TestCase):
    def test_object_shape(self):
        parsed = _extract_json('{"results": [{"id": "1"}]}')
        self.assertEqual(parsed, {"results": [{"id": "1"}]})

    def test_bare_array_shape(self):
        parsed = _extract_json('[{"id": "1"}, {"id": "2"}]')
        self.assertEqual(parsed, [{"id": "1"}, {"id": "2"}])

    def test_array_embedded_in_prose(self):
        text = 'Sure, here you go:\n[{"id": "1"}, {"id": "2"}]\nHope that helps!'
        parsed = _extract_json(text)
        self.assertEqual(parsed, [{"id": "1"}, {"id": "2"}])

    def test_garbage_returns_none(self):
        self.assertIsNone(_extract_json("not json at all"))
        self.assertIsNone(_extract_json(""))
        self.assertIsNone(_extract_json(None))


class ExtractRowsTests(unittest.TestCase):
    def test_object_wrapper(self):
        self.assertEqual(_extract_rows({"results": [{"id": "1"}]}), [{"id": "1"}])

    def test_object_wrapper_missing_results_key(self):
        self.assertEqual(_extract_rows({"other": "stuff"}), [])

    def test_bare_list(self):
        # This is the exact shape that crashed classify.py: parsed.get(...)
        # on a list raised AttributeError instead of hitting this branch.
        self.assertEqual(_extract_rows([{"id": "1"}, {"id": "2"}]), [{"id": "1"}, {"id": "2"}])

    def test_unparseable_input_is_none_not_empty(self):
        # None/empty must stay distinguishable from "parsed fine, zero rows",
        # so the caller still logs a failure and defaults the batch.
        self.assertIsNone(_extract_rows(None))
        self.assertIsNone(_extract_rows("just a string"))
        self.assertIsNone(_extract_rows(42))


class CoerceRowTests(unittest.TestCase):
    def test_rows_from_bare_array_still_coerce_to_labels(self):
        rows = _extract_rows(_extract_json('[{"id": "abc", "category": "personal", '
                                            '"importance": "normal", "needs_action": false, '
                                            '"needs_reply": false, "one_line": "hi"}]'))
        label = _coerce(rows[0])
        self.assertIsNotNone(label)
        self.assertEqual(label.id, "abc")
        self.assertEqual(label.category, "personal")


if __name__ == "__main__":
    unittest.main()
