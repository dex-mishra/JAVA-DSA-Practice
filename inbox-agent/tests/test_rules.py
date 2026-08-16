"""Guardrails on rules compiled from written instructions.

The instructions box can now change what gets starred, what is protected, what
may be binned, and how the summary is laid out. These tests are the boundary:
they assert what a compiled rule cannot do, however the sentence was worded or
however the model chose to read it.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import rules  # noqa: E402
from agent.classify import Label  # noqa: E402
from agent.config import load_policy  # noqa: E402
from agent.policy import trash_verdict  # noqa: E402
from tests.test_policy import NEVER_REPLIED, make_message  # noqa: E402

POLICY = load_policy(Path(__file__).parent.parent / "config.yaml")
OWN = {"gmail.com", "kgpian.iitkgp.ac.in"}


class OverBroadRules(unittest.TestCase):
    """The asymmetry that motivates all of this: a bad protect rule keeps
    clutter, a bad bin rule loses mail."""

    def test_bare_tlds_are_refused_for_binning(self):
        for pattern in ["com", "@com", "in", "@in", "org", "net"]:
            out = rules.normalise({"trash_senders": [pattern]}, own_domains=OWN)
            self.assertEqual(out["trash_senders"], [], f"{pattern!r} was accepted")

    def test_cannot_aim_a_bin_rule_at_your_own_mailboxes(self):
        out = rules.normalise(
            {"trash_senders": ["@gmail.com", "@kgpian.iitkgp.ac.in", "sub.gmail.com"]},
            own_domains=OWN,
        )
        self.assertEqual(out["trash_senders"], [])

    def test_ordinary_bin_rules_still_work(self):
        out = rules.normalise({"trash_senders": ["@unstop.com"]}, own_domains=OWN)
        self.assertEqual(out["trash_senders"], ["@unstop.com"])

    def test_list_lengths_are_capped(self):
        many = [f"sender{i}@example.com" for i in range(500)]
        out = rules.normalise({"trash_senders": many, "star_senders": many}, own_domains=OWN)
        self.assertEqual(len(out["trash_senders"]), rules.MAX_TRASH_RULES)
        self.assertEqual(len(out["star_senders"]), rules.MAX_PER_LIST)

    def test_garbage_shapes_never_raise(self):
        for value in (None, "text", 5, [], {"trash_senders": "not-a-list"}):
            self.assertIsInstance(rules.normalise(value, own_domains=OWN), dict)


class AdditiveOnly(unittest.TestCase):
    """"Only add, never reduce" -- asserted against the merge itself, not
    against the prompt that asked for it."""

    def test_existing_protections_are_never_removed(self):
        before = set(POLICY["cleanup"]["protect"]["keywords"])
        merged = rules.apply_to_policy(
            POLICY, rules.normalise({"protect_keywords": ["btp"]}, own_domains=OWN)
        )
        after = set(merged["cleanup"]["protect"]["keywords"])
        self.assertTrue(before.issubset(after))
        self.assertIn("btp", after)

    def test_existing_star_rules_are_never_removed(self):
        before = set(POLICY["star"]["faculty_senders"])
        merged = rules.apply_to_policy(
            POLICY, rules.normalise({"star_senders": ["prof@x.edu"]}, own_domains=OWN)
        )
        self.assertTrue(before.issubset(set(merged["star"]["faculty_senders"])))

    def test_no_section_can_be_dropped_from_the_report(self):
        merged = rules.apply_to_policy(
            POLICY,
            rules.normalise({"report_sections": ["placement_internship"]}, own_domains=OWN),
        )
        sections = merged["report"]["sections"]
        self.assertEqual(sections[0], "placement_internship")
        for known in rules.KNOWN_SECTIONS:
            self.assertIn(known, sections)

    def test_items_per_section_can_rise_but_not_fall(self):
        base = POLICY["report"]["max_items_per_section"]
        lowered = rules.apply_to_policy(
            POLICY, rules.normalise({"max_items_per_section": 2}, own_domains=OWN)
        )
        self.assertEqual(lowered["report"]["max_items_per_section"], base)
        raised = rules.apply_to_policy(
            POLICY, rules.normalise({"max_items_per_section": 30}, own_domains=OWN)
        )
        self.assertEqual(raised["report"]["max_items_per_section"], 30)

    def test_caps_and_age_floor_are_untouchable(self):
        merged = rules.apply_to_policy(
            POLICY,
            rules.normalise(
                {"trash_senders": ["@spam.example"], "max_items_per_section": 60},
                own_domains=OWN,
            ),
        )
        self.assertEqual(
            merged["cleanup"]["max_trash_per_run"], POLICY["cleanup"]["max_trash_per_run"]
        )
        self.assertEqual(merged["cleanup"]["min_age_days"], POLICY["cleanup"]["min_age_days"])

    def test_the_original_policy_is_not_mutated(self):
        before = len(POLICY["star"]["faculty_senders"])
        rules.apply_to_policy(
            POLICY, rules.normalise({"star_senders": ["a@b.com"]}, own_domains=OWN)
        )
        self.assertEqual(len(POLICY["star"]["faculty_senders"]), before)


class ProtectionWins(unittest.TestCase):
    def test_a_sender_on_both_lists_is_protected(self):
        merged = rules.apply_to_policy(
            POLICY,
            rules.normalise(
                {"protect_senders": ["@cdc.example"], "trash_senders": ["@cdc.example"]},
                own_domains=OWN,
            ),
        )
        self.assertIn("@cdc.example", merged["cleanup"]["protect"]["senders"])
        self.assertNotIn("@cdc.example", merged["cleanup"].get("extra_senders", []))


class BinRulesStillObeyEveryProtection(unittest.TestCase):
    """A compiled bin rule widens what is *eligible*. It is not a bypass."""

    def merged(self):
        return rules.apply_to_policy(
            POLICY, rules.normalise({"trash_senders": ["@unstop.example"]}, own_domains=OWN)
        )

    def named_message(self, **kw):
        base = dict(
            sender="Unstop <news@unstop.example>",
            sender_email="news@unstop.example",
            subject="Hackathon roundup",
        )
        base.update(kw)
        return make_message(**base)

    def test_the_rule_makes_an_otherwise_ineligible_message_binnable(self):
        verdict = trash_verdict(
            self.named_message(),
            Label(id="x", category="notification"),   # not a trashable category
            self.merged(),
            NEVER_REPLIED,
        )
        self.assertTrue(verdict.allowed, verdict.reasons)
        self.assertIn("bin rule", verdict.reasons[-1])

    def test_but_not_if_it_is_starred(self):
        msg = self.named_message(labels=["CATEGORY_PROMOTIONS", "STARRED"])
        verdict = trash_verdict(msg, Label(id="x", category="notification"),
                                self.merged(), NEVER_REPLIED)
        self.assertFalse(verdict.allowed)

    def test_but_not_if_it_is_too_recent(self):
        verdict = trash_verdict(self.named_message(age_days=3),
                                Label(id="x", category="notification"),
                                self.merged(), NEVER_REPLIED)
        self.assertFalse(verdict.allowed)

    def test_but_not_if_the_model_says_it_needs_action(self):
        verdict = trash_verdict(self.named_message(),
                                Label(id="x", category="notification", needs_action=True),
                                self.merged(), NEVER_REPLIED)
        self.assertFalse(verdict.allowed)

    def test_but_not_if_it_is_from_a_real_person(self):
        msg = self.named_message(headers={}, labels=[])
        verdict = trash_verdict(msg, Label(id="x", category="notification"),
                                self.merged(), NEVER_REPLIED)
        self.assertFalse(verdict.allowed)

    def test_but_not_if_you_replied_in_the_thread(self):
        verdict = trash_verdict(self.named_message(),
                                Label(id="x", category="notification"),
                                self.merged(), lambda _t: True)
        self.assertFalse(verdict.allowed)

    def test_unnamed_mail_is_unaffected_by_the_rule(self):
        other = make_message(sender="X <a@other.example>", sender_email="a@other.example")
        verdict = trash_verdict(other, Label(id="x", category="notification"),
                                self.merged(), NEVER_REPLIED)
        self.assertFalse(verdict.allowed)


class Description(unittest.TestCase):
    def test_empty_rules_describe_as_nothing(self):
        self.assertEqual(rules.describe(rules.normalise({}, own_domains=OWN)), [])
        self.assertTrue(rules.is_empty(rules.normalise({}, own_domains=OWN)))

    def test_rules_are_described_in_plain_english(self):
        lines = rules.describe(
            rules.normalise(
                {"star_senders": ["prof@iitkgp.ac.in"], "report_sections": ["deadlines"]},
                own_domains=OWN,
            )
        )
        joined = " ".join(lines)
        self.assertIn("prof@iitkgp.ac.in", joined)
        self.assertIn("Summary order", joined)


if __name__ == "__main__":
    unittest.main(verbosity=2)
