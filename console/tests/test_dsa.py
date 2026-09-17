"""The DSA sheet: content contract, user writes, and the two computed rules.

The things worth pinning here are the ones that fail silently. A checkpoint
that quietly drops a section still renders. A progress write that lands in
the tracker's blob still returns 200. A revision queue sorted the wrong way
still shows problems. None of those would raise anything in production.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from flask import Flask  # noqa: E402

import dsa as dsa_mod  # noqa: E402

REPO = Path(__file__).parent.parent.parent
DATA = REPO / "data"
HAS_CONTENT = (DATA / "dsa" / "index.json").exists()


def make_client():
    """The real blueprint over an in-memory blob store."""
    store: dict = {}

    def read_json_blob(path, default):
        return store.get(path, default)

    def mutate_json_blob(path, mutate, attempts=4):
        return mutate(store.setdefault(path, {}))

    app = Flask(__name__)
    app.register_blueprint(
        dsa_mod.build_blueprint(
            DATA,
            {
                "protected": lambda view: view,
                "read_json_blob": read_json_blob,
                "mutate_json_blob": mutate_json_blob,
            },
        )
    )
    return app.test_client(), store


@unittest.skipUnless(HAS_CONTENT, "data/dsa not imported")
class ImportContract(unittest.TestCase):
    """What tools/import-dsa.mjs promises the rest of the system."""

    @classmethod
    def setUpClass(cls):
        cls.index = json.loads((DATA / "dsa" / "index.json").read_text())
        cls.spec = json.loads((DATA / "dsa" / "spec.json").read_text())

    def test_problem_ids_are_unique(self):
        ids = [p["id"] for p in self.index["problems"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_index_and_phase_payloads_agree(self):
        """The page paints from the index and drills down into the phases.
        A problem in one and not the other is a row that opens onto nothing."""
        for phase in self.spec["phases"]:
            if not phase["loaded"]:
                continue
            payload = json.loads((DATA / "dsa" / f"phase-{phase['key']}.json").read_text())
            self.assertEqual(len(payload["problems"]), phase["problem_count"])
            in_index = {p["id"] for p in self.index["problems"] if p["phase"] == phase["key"]}
            in_payload = {p["id"] for p in payload["problems"]}
            self.assertEqual(in_index, in_payload, f"{phase['key']} index and payload differ")

    def test_ids_are_topic_plus_slug(self):
        """The id is what progress keys on, and it has to survive a problem
        moving day or tier. Deriving it from topic and slug is what makes
        that true -- an id carrying the day would not."""
        for p in self.index["problems"]:
            self.assertEqual(p["id"], f"{p['topic']}-{p['slug']}")

    def test_enums_are_closed(self):
        for p in self.index["problems"]:
            self.assertIn(p["tier"], {"CORE", "DRILL", "SKIM"})
            self.assertIn(p["difficulty"], {"Easy", "Medium", "Hard"})
            self.assertIn(p["campus_oa"], {"HIGH", "MEDIUM", "LOW"})

    def test_content_carries_no_user_fields(self):
        """The uploads ship a default user_fields block. Keeping it next to
        the content invites something to write to it, and the real progress
        lives in a different store entirely."""
        for phase in self.spec["phases"]:
            if not phase["loaded"]:
                continue
            payload = json.loads((DATA / "dsa" / f"phase-{phase['key']}.json").read_text())
            for p in payload["problems"]:
                self.assertNotIn("user_fields", p)

    def test_unloaded_phases_are_declared_not_hidden(self):
        """A phase that has not arrived reads as work outstanding, not as a
        sheet that is only 261 problems long."""
        keys = {p["key"] for p in self.spec["phases"]}
        self.assertEqual(keys, {"P0", "P1", "P2A", "P2B", "P3", "P4"})
        for p in self.spec["phases"]:
            if not p["loaded"]:
                self.assertEqual(p["problem_count"], 0)
                self.assertGreater(p["quota"], 0)


@unittest.skipUnless(HAS_CONTENT, "data/dsa not imported")
class ProgressWrites(unittest.TestCase):
    def setUp(self):
        self.client, self.store = make_client()
        self.pid = json.loads((DATA / "dsa" / "index.json").read_text())["problems"][0]["id"]

    def patch(self, body, pid=None):
        return self.client.patch(f"/api/dsa/progress/{pid or self.pid}", json=body)

    def test_writes_never_touch_the_tracker_blob(self):
        """The whole reason this is a separate store. A DSA note must not be
        able to push a placement tick over the tracker's 512 KB cap."""
        self.patch({"notes": "x" * 5000})
        self.assertIn(dsa_mod.PROGRESS_BLOB, self.store)
        self.assertNotIn("console/progress.json", self.store)

    def test_patch_merges_rather_than_replaces(self):
        self.patch({"status": "solved"})
        self.patch({"notes": "two pointers"})
        row = self.client.get("/api/dsa/progress").get_json()["problems"][self.pid]
        self.assertEqual(row["status"], "solved")
        self.assertEqual(row["notes"], "two pointers")

    def test_solving_stamps_the_revision_date(self):
        body = self.patch({"status": "solved"}).get_json()
        self.assertIsNotNone(body["progress"]["last_revised"])

    def test_explicit_date_wins_over_the_stamp(self):
        body = self.patch({"status": "solved", "last_revised": "2026-01-02"}).get_json()
        self.assertEqual(body["progress"]["last_revised"], "2026-01-02")

    def test_tags_are_normalised_and_deduplicated(self):
        body = self.patch({"tags": ["Elegant", " elegant ", "STUCK", ""]}).get_json()
        self.assertEqual(body["progress"]["tags"], ["elegant", "stuck"])

    def test_a_row_back_at_defaults_is_dropped(self):
        """Absence is the default state. Keeping an all-defaults row would
        make the blob grow with every problem merely looked at."""
        self.patch({"status": "solved", "confidence": 4})
        self.patch({"status": "todo", "confidence": None, "last_revised": None})
        self.assertEqual(self.store[dsa_mod.PROGRESS_BLOB]["problems"], {})

    def test_rejects_values_outside_the_schema(self):
        self.assertEqual(self.patch({"status": "done"}).status_code, 400)
        self.assertEqual(self.patch({"confidence": 0}).status_code, 400)
        self.assertEqual(self.patch({"confidence": 6}).status_code, 400)
        self.assertEqual(self.patch({"last_revised": "02-01-2026"}).status_code, 400)
        self.assertEqual(self.patch({}).status_code, 400)

    def test_rejects_an_unknown_problem(self):
        self.assertEqual(self.patch({"status": "solved"}, pid="not-a-problem").status_code, 404)

    def test_goodnotes_is_stored_verbatim(self):
        """Opaque by contract. If anything ever starts parsing this, the
        reference stops being free text and starts being a format."""
        ref = "DSA nb2 p.41 (top half) — see also nb1 p.7"
        body = self.patch({"goodnotes_ref": ref}).get_json()
        self.assertEqual(body["progress"]["goodnotes_ref"], ref)

    def test_long_fields_are_capped_not_rejected(self):
        body = self.patch({"notes": "n" * (dsa_mod.MAX_NOTES + 500)}).get_json()
        self.assertEqual(len(body["progress"]["notes"]), dsa_mod.MAX_NOTES)


@unittest.skipUnless(HAS_CONTENT, "data/dsa not imported")
class RevisionQueue(unittest.TestCase):
    """SPEC: status != todo AND (revision OR confidence <= 3),
    ordered confidence ASC NULLS LAST, last_revised ASC NULLS FIRST."""

    def setUp(self):
        self.client, _ = make_client()
        index = json.loads((DATA / "dsa" / "index.json").read_text())
        self.ids = [p["id"] for p in index["problems"][:6]]

    def patch(self, pid, body):
        return self.client.patch(f"/api/dsa/progress/{pid}", json=body)

    def test_untouched_problems_never_queue(self):
        self.patch(self.ids[0], {"revision": True})   # starred but still todo
        rows = self.client.get("/api/dsa/revision-queue").get_json()
        self.assertEqual(rows["total"], 0)

    def test_starred_or_low_confidence_qualifies(self):
        self.patch(self.ids[0], {"status": "solved", "revision": True, "confidence": 5})
        self.patch(self.ids[1], {"status": "solved", "confidence": 2})
        self.patch(self.ids[2], {"status": "solved", "confidence": 5})
        got = {p["id"] for p in self.client.get("/api/dsa/revision-queue").get_json()["problems"]}
        self.assertEqual(got, {self.ids[0], self.ids[1]})

    def test_weakest_first_then_least_recently_revised(self):
        self.patch(self.ids[0], {"status": "solved", "confidence": 3, "last_revised": "2026-05-01"})
        self.patch(self.ids[1], {"status": "solved", "confidence": 1})
        self.patch(self.ids[2], {"status": "solved", "confidence": 3, "last_revised": "2026-01-01"})
        self.patch(self.ids[3], {"status": "revisit", "revision": True})   # confidence null
        order = [p["id"] for p in self.client.get("/api/dsa/revision-queue").get_json()["problems"]]
        self.assertEqual(order, [self.ids[1], self.ids[2], self.ids[0], self.ids[3]])


@unittest.skipUnless(HAS_CONTENT, "data/dsa not imported")
class Checkpoints(unittest.TestCase):
    """The decay rule. Nothing is dropped; older material only gets denser."""

    @classmethod
    def setUpClass(cls):
        cls.content = dsa_mod.Content(DATA).load()

    def first_day_with(self, key):
        for day in sorted(self.content.days):
            cp = dsa_mod.build_checkpoint(self.content, day)
            if cp[key]:
                return cp
        return None

    def test_today_arrives_whole(self):
        cp = dsa_mod.build_checkpoint(self.content, min(self.content.days))
        self.assertTrue(cp["new_today"])
        for l in cp["new_today"]:
            self.assertTrue(l["detail"])
            self.assertIn("citations", l)

    def test_yesterday_keeps_one_citation_and_one_sentence(self):
        cp = self.first_day_with("from_yesterday")
        self.assertIsNotNone(cp, "no day in the sheet has a same-topic predecessor")
        for l in cp["from_yesterday"]:
            self.assertLessEqual(len(l["citations"]), 1)
            self.assertLessEqual(l["detail"].count(". "), 0)

    def test_two_days_back_keeps_a_title_only(self):
        cp = self.first_day_with("two_days_back")
        if cp is None:
            self.skipTest("no topic in the imported phases spans three days")
        for l in cp["two_days_back"]:
            self.assertNotIn("detail", l)
            self.assertIn("headline", l)

    def test_closed_topics_are_carried_forward_not_dropped(self):
        """The point of the rule. A topic you finished on day 3 is still
        present on day 19, as one line."""
        late = max(self.content.days)
        cp = dsa_mod.build_checkpoint(self.content, late)
        carried = {c["topic"] for c in cp["carried_forward"]}
        self.assertTrue(carried, "nothing carried forward on the last day")
        for c in cp["carried_forward"]:
            self.assertLess(c["closed_after_day"], late)
            self.assertTrue(c["headlines"])

    def test_carried_forward_excludes_the_current_topic(self):
        for day in sorted(self.content.days):
            cp = dsa_mod.build_checkpoint(self.content, day)
            self.assertNotIn(cp["topic"], {c["topic"] for c in cp["carried_forward"]})

    def test_every_learning_survives_somewhere(self):
        """The strongest version of "nothing is ever dropped": on the last
        day of the sheet, every learning ever taught is still reachable."""
        late = max(self.content.days)
        cp = dsa_mod.build_checkpoint(self.content, late)
        seen = set()
        for l in cp["new_today"] + cp["from_yesterday"]:
            seen.add(l["headline"])
        for l in cp["two_days_back"]:
            seen.add(l["headline"])
        seen |= set(cp["earlier_in_topic"])
        for c in cp["carried_forward"]:
            seen |= set(c["headlines"])
        missing = {l["headline"] for l in self.content.learnings} - seen
        self.assertFalse(missing, f"{len(missing)} learnings vanish by day {late}")


@unittest.skipUnless(HAS_CONTENT, "data/dsa not imported")
class ContentRoutes(unittest.TestCase):
    def setUp(self):
        self.client, _ = make_client()

    def test_day_view_sorts_core_before_drill_before_skim(self):
        rank = {"CORE": 0, "DRILL": 1, "SKIM": 2}
        for day in (1, 4, 14):
            rows = self.client.get(f"/api/dsa/day/{day}").get_json()["problems"]
            if not rows:
                continue
            tiers = [rank[r["tier"]] for r in rows]
            self.assertEqual(tiers, sorted(tiers), f"day {day} is out of tier order")

    def test_siblings_outside_the_sheet_resolve_to_leetcode(self):
        """202 of them point at problems deliberately left out of the 600.
        They have to render as something, and a dead internal link is worse
        than an honest external one."""
        content = dsa_mod.Content(DATA).load()
        pid = next(
            p for p, full in content.full.items()
            if any(s not in content.by_slug for s in (full["learnings"].get("siblings") or []))
        )
        sibs = self.client.get(f"/api/dsa/problem/{pid}").get_json()["siblings_resolved"]
        outside = [s for s in sibs if not s["in_sheet"]]
        self.assertTrue(outside)
        for s in outside:
            self.assertTrue(s["url"].startswith("https://leetcode.com/problems/"))
            self.assertEqual(s["id"], "")

    def test_a_dangling_template_is_reported_not_hidden(self):
        content = dsa_mod.Content(DATA).load()
        dangling = [
            p for p, full in content.full.items()
            if full.get("template") and full["template"] not in content.templates
        ]
        if not dangling:
            self.skipTest("every template reference resolves")
        body = self.client.get(f"/api/dsa/problem/{dangling[0]}").get_json()
        self.assertTrue(body["template_missing"])
        self.assertIsNone(body["template_resolved"])

    def test_filters_compose(self):
        core = self.client.get("/api/dsa/search?tier=CORE").get_json()["total"]
        hard = self.client.get("/api/dsa/search?difficulty=Hard").get_json()["total"]
        both = self.client.get("/api/dsa/search?tier=CORE&difficulty=Hard").get_json()["total"]
        self.assertLessEqual(both, min(core, hard))

    def test_unknown_ids_404_rather_than_500(self):
        for path in ("/api/dsa/problem/nope", "/api/dsa/theory/nope", "/api/dsa/template/nope"):
            self.assertEqual(self.client.get(path).status_code, 404, path)


if __name__ == "__main__":
    unittest.main()
