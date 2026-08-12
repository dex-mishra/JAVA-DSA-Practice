"""Tests for the two write paths added on top of the read-only agent.

Both are places where something outside the process can cause a change in the
world -- a calendar event, a commit on a repo -- so both get the same treatment
as the trash rules: prove the guard actually holds, not that the happy path
works.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent.calendar import EventSpec  # noqa: E402
from agent.classify import _coerce  # noqa: E402
from agent.proposals import parse_reply, strip_quoted  # noqa: E402
from agent.site_update import Change, apply_changes, validate  # noqa: E402

VALID = {1, 2, 3, 4, 5}


class ReplyGrammar(unittest.TestCase):
    def test_plain_track(self):
        d = parse_reply("track 1 3", VALID)
        self.assertTrue(d.understood)
        self.assertEqual(d.track, {1, 3})

    def test_commas_and_and(self):
        self.assertEqual(parse_reply("track 1, 2 and 5", VALID).track, {1, 2, 5})

    def test_mixed_track_and_ignore(self):
        d = parse_reply("track 1 3, ignore 2 4", VALID)
        self.assertEqual(d.track, {1, 3})
        self.assertEqual(d.ignore, {2, 4})

    def test_track_all(self):
        self.assertEqual(parse_reply("track all", VALID).track, VALID)

    def test_none_ignores_everything(self):
        d = parse_reply("none", VALID)
        self.assertTrue(d.understood)
        self.assertEqual(d.track, set())

    def test_bare_numbers_read_as_consent(self):
        self.assertEqual(parse_reply("1 3 5", VALID).track, {1, 3, 5})

    def test_sentence_with_a_digit_is_not_bare_numbers(self):
        """'call me on 2 Sep' must not silently schedule proposal 2."""
        d = parse_reply("I will look at this on 2 September when I am free", VALID)
        self.assertEqual(d.track, set())

    def test_out_of_range_numbers_are_discarded(self):
        d = parse_reply("track 3 and 99", VALID)
        self.assertEqual(d.track, {3})

    def test_ignore_beats_track_for_the_same_number(self):
        d = parse_reply("track 1 2, ignore 2", VALID)
        self.assertEqual(d.track, {1})

    def test_unparseable_reply_is_not_guessed(self):
        d = parse_reply("hmm not sure about these, let me think", VALID)
        self.assertFalse(d.understood)
        self.assertFalse(d.actionable)

    def test_empty_reply(self):
        self.assertFalse(parse_reply("", VALID).understood)


class QuotedTextHandling(unittest.TestCase):
    """The quoted digest contains every proposal number. If it were parsed,
    every reply would read as 'track all' -- the exact opposite of consent."""

    REPLY = """track 2

On Wed, 12 Aug 2026 at 07:00, Aryan <a@b.com> wrote:
> 1. Endsem timetable
> 2. Interview with Acme
> 3. Guest lecture
> track 1 3
"""

    def test_only_the_new_text_is_parsed(self):
        d = parse_reply(self.REPLY, VALID)
        self.assertEqual(d.track, {2}, "quoted numbers leaked into the decision")

    def test_strip_quoted_removes_the_original(self):
        out = strip_quoted(self.REPLY)
        self.assertIn("track 2", out)
        self.assertNotIn("Endsem", out)

    def test_angle_quoted_lines_dropped(self):
        self.assertEqual(parse_reply("> track all\nignore 1", VALID).track, set())


class InjectionViaProposal(unittest.TestCase):
    """An email cannot schedule itself. It can only become a numbered line."""

    def test_model_cannot_emit_an_event_without_a_valid_date(self):
        label = _coerce({
            "id": "m1", "category": "promotional",
            "calendar_worthy": True,
            "event_title": "URGENT add our webinar series",
            "event_start": "whenever you like",
        })
        self.assertFalse(label.calendar_worthy)
        self.assertEqual(label.event_start, "")

    def test_malformed_datetime_is_rejected(self):
        label = _coerce({
            "id": "m2", "category": "academic", "calendar_worthy": True,
            "event_start": "2026-13-45T99:99",
        })
        self.assertEqual(label.event_start, "")
        self.assertFalse(label.calendar_worthy)

    def test_end_before_start_is_dropped(self):
        label = _coerce({
            "id": "m3", "category": "academic", "calendar_worthy": True,
            "event_start": "2026-09-10", "event_end": "2026-09-01",
        })
        self.assertEqual(label.event_end, "")


class EventBodies(unittest.TestCase):
    def test_all_day_end_is_exclusive(self):
        body = EventSpec(title="Exam", start="2026-09-10", all_day=True).body("Asia/Kolkata")
        self.assertEqual(body["start"]["date"], "2026-09-10")
        self.assertEqual(body["end"]["date"], "2026-09-11")

    def test_timed_event_gets_an_hour_by_default(self):
        body = EventSpec(
            title="Interview", start="2026-09-10T14:00", all_day=False
        ).body("Asia/Kolkata")
        self.assertIn("2026-09-10T14:00:00", body["start"]["dateTime"])
        self.assertIn("2026-09-10T15:00:00", body["end"]["dateTime"])

    def test_source_url_lands_in_the_description(self):
        body = EventSpec(
            title="X", start="2026-09-10", source_url="https://mail.google.com/x"
        ).body("Asia/Kolkata")
        self.assertIn("https://mail.google.com/x", body["description"])


# --------------------------------------------------------------------------


def mba_fixture():
    return {
        "phases": [{
            "n": "PHASE 04",
            "items": [
                {"id": "p4i", "task": "HBS 2+2", "date": "2027-04-22",
                 "tags": ["projected", "oneshot"], "note": "x"},
                {"id": "p3d", "task": "Stanford R2", "date": "2027-01-06",
                 "tags": ["confirmed", "oneshot"], "note": "y"},
            ],
        }],
        "excluded": [{"id": "x1", "task": "CAT", "date": "2026-09-15", "note": "z"}],
    }


def change(**kw):
    base = dict(op="update_date", file="data/mba.json", id="p4i", field="date",
                value="2027-04-30", reason="published", source="https://hbs.edu/x")
    base.update(kw)
    return Change(**base)


class UpdaterRules(unittest.TestCase):
    def test_ordinary_projected_date_update_is_accepted(self):
        ok, _ = validate([change()], mba_fixture())
        self.assertEqual(len(ok), 1)
        self.assertEqual(ok[0].op, "update_date")

    def test_confirmed_item_is_never_overwritten(self):
        """The single most important rule: a confirmed date is human-verified
        and a scraped source does not outrank it."""
        ok, rej = validate([change(id="p3d", value="2027-01-20")], mba_fixture())
        self.assertEqual(len(ok), 1)
        self.assertEqual(ok[0].op, "flag_verify", "confirmed date was overwritten")
        self.assertTrue(any("confirmed" in r for r in rej))

    def test_writes_outside_data_are_refused(self):
        for path in ["src/app.js", "tools/build.mjs", "index.html", "../etc/passwd"]:
            with self.subTest(path=path):
                ok, _ = validate([change(file=path)], mba_fixture())
                self.assertEqual(ok, [])

    def test_source_url_is_mandatory(self):
        for src in ["", "not a url", "http://insecure.example", "javascript:alert(1)"]:
            with self.subTest(src=src):
                ok, _ = validate([change(source=src)], mba_fixture())
                self.assertEqual(ok, [])

    def test_unknown_operations_rejected(self):
        for op in ["delete", "remove_item", "confirm", "update_tags", ""]:
            with self.subTest(op=op):
                ok, _ = validate([change(op=op)], mba_fixture())
                self.assertEqual(ok, [])

    def test_malformed_dates_rejected(self):
        for bad in ["2027-4-2", "April 2027", "2027-13-01", "", None]:
            with self.subTest(bad=bad):
                ok, _ = validate([change(value=bad)], mba_fixture())
                self.assertEqual(ok, [])

    def test_unchanged_date_is_not_churn(self):
        ok, _ = validate([change(value="2027-04-22")], mba_fixture())
        self.assertEqual(ok, [])

    def test_unknown_id_rejected(self):
        ok, _ = validate([change(id="nope")], mba_fixture())
        self.assertEqual(ok, [])

    def test_new_items_can_never_be_born_confirmed(self):
        c = change(op="add_item", id="", field="PHASE 04",
                   value={"task": "New programme", "date": "2027-05-01",
                          "tags": ["confirmed"]})
        ok, _ = validate([c], mba_fixture())
        self.assertEqual(len(ok), 1)
        self.assertNotIn("confirmed", ok[0].value["tags"])
        self.assertIn("projected", ok[0].value["tags"])

    def test_change_volume_is_capped(self):
        many = [change(id="p4i", value=f"2027-04-{d:02d}") for d in range(1, 26)]
        ok, rej = validate(many, mba_fixture())
        self.assertLessEqual(len(ok), 12)
        self.assertTrue(any("capped" in r for r in rej))

    def test_nothing_is_ever_deleted(self):
        doc = mba_fixture()
        before = len(doc["phases"][0]["items"]) + len(doc["excluded"])
        ok, _ = validate([change(), change(op="flag_verify", id="x1", value="verify")], doc)
        apply_changes(doc, ok)
        after = len(doc["phases"][0]["items"]) + len(doc["excluded"])
        self.assertEqual(before, after)

    def test_applied_change_records_its_source(self):
        doc = mba_fixture()
        ok, _ = validate([change()], doc)
        apply_changes(doc, ok)
        item = doc["phases"][0]["items"][0]
        self.assertEqual(item["date"], "2027-04-30")
        self.assertIn("https://hbs.edu/x", item["note"])
        self.assertIn("2027-04-22 -> 2027-04-30", item["note"])


if __name__ == "__main__":
    unittest.main(verbosity=2)