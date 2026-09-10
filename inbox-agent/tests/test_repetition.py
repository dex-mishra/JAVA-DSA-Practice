"""Four complaints, all the same shape: it keeps telling you what you know.

  * every sweep re-read and re-classified the same six hours of mail, because
    a message was only written down once an *alert* went out -- so a quiet
    window was processed twenty-four times over;
  * a still-open item was carried into all four digests a day for the whole
    three-day window, twelve mentions of one email;
  * every digest re-proposed the same calendar item, each in its own batch,
    so the website's calendar card showed one deadline several times;
  * and the one thing that was genuinely new -- something urgent -- appeared
    only as a number in the headline, filed below whatever category it landed
    in.

The starring switch is here too, because "too much starring" is the same
complaint about a different channel.
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

from agent import overlay as overlay_mod  # noqa: E402
from agent import proposals as proposals_mod  # noqa: E402
from agent import report as report_mod  # noqa: E402
from agent.classify import Label  # noqa: E402
from agent.config import load_policy  # noqa: E402
from agent.gmail import Message  # noqa: E402
from agent.state import State, _EMPTY  # noqa: E402

POLICY = load_policy(Path(__file__).parent.parent / "config.yaml")
NOW = datetime(2026, 8, 16, 9, 0, tzinfo=ZoneInfo("Asia/Kolkata"))
HOUR = 3600.0


def msg(mid: str, subject: str = "Something", *, bulk: bool = False) -> Message:
    return Message(
        id=mid, thread_id="t" + mid, account="primary", subject=subject,
        sender="CDC <cdc@iitkgp.ac.in>", sender_email="cdc@iitkgp.ac.in",
        to="me@example.com", date_ts=time.time() - HOUR, snippet=subject,
        body=subject, label_ids=[],
        headers={"List-Id": "<cdc.iitkgp>"} if bulk else {},
    )


class MemState(State):
    """State without GCS, starting from the real empty shape."""

    def __init__(self):  # noqa: D107 -- deliberately no super()
        self.data = copy.deepcopy(_EMPTY)

    def save(self, attempts: int = 4) -> bool:
        return True


# ---------------------------------------------------------------------------
# The sweep stops re-reading


class SeenMail(unittest.TestCase):
    def test_a_message_is_only_new_once(self):
        state = MemState()
        self.assertFalse(state.already_seen("a"))
        state.mark_seen(["a", "b"])
        self.assertTrue(state.already_seen("a"))
        self.assertTrue(state.already_seen("b"))
        self.assertFalse(state.already_seen("c"))

    def test_seen_is_separate_from_alerted(self):
        """Being looked at is not being alerted about, and conflating them is
        exactly how the sweep came to re-read everything: `alerted` is written
        only when mail goes out, so a quiet window recorded nothing at all."""
        state = MemState()
        state.mark_seen(["a"])
        self.assertFalse(state.already_alerted("a"))

    def test_seen_expires_with_everything_else(self):
        state = MemState()
        state.data["seen"] = {"old": time.time() - 40 * 24 * HOUR, "new": time.time()}
        state._prune()
        self.assertEqual(list(state.data["seen"]), ["new"])


class BlankStateIsNotShared(unittest.TestCase):
    """`dict(_EMPTY)` is a shallow copy, so two State objects built that way
    pointed at the same inner maps -- and the first write on a run that
    started with no saved blob landed in the module-level default."""

    def test_two_states_do_not_share_maps(self):
        one, two = MemState(), MemState()
        one.mark_seen(["a"])
        self.assertFalse(two.already_seen("a"))
        self.assertEqual(_EMPTY["seen"], {})


# ---------------------------------------------------------------------------
# Carry-over is a nudge, not a drumbeat


class CarryOver(unittest.TestCase):
    def test_the_first_carry_is_always_allowed(self):
        state = MemState()
        self.assertTrue(state.carry_allowed("a", cooldown_hours=20, limit=3))

    def test_a_second_carry_the_same_day_is_not(self):
        state = MemState()
        state.mark_carried(["a"])
        self.assertFalse(state.carry_allowed("a", cooldown_hours=20, limit=3))

    def test_it_comes_back_after_the_cooldown(self):
        state = MemState()
        state.mark_carried(["a"])
        state.data["carries"]["a"] = [1, time.time() - 21 * HOUR]
        self.assertTrue(state.carry_allowed("a", cooldown_hours=20, limit=3))

    def test_it_stops_for_good_at_the_limit(self):
        state = MemState()
        state.data["carries"]["a"] = [3, time.time() - 100 * HOUR]
        self.assertFalse(state.carry_allowed("a", cooldown_hours=20, limit=3))

    def test_a_limit_of_zero_means_no_limit(self):
        state = MemState()
        state.data["carries"]["a"] = [99, time.time() - 100 * HOUR]
        self.assertTrue(state.carry_allowed("a", cooldown_hours=20, limit=0))

    def test_counts_accumulate(self):
        state = MemState()
        for _ in range(3):
            state.mark_carried(["a"])
        self.assertEqual(state.data["carries"]["a"][0], 3)

    def test_a_malformed_record_does_not_crash_the_digest(self):
        """State is read back from JSON written by an older version. A record
        it cannot parse must read as 'never carried', not raise."""
        state = MemState()
        state.data["carries"] = {"a": None, "b": "nonsense", "c": 1234.5}
        for mid in ("a", "b", "c"):
            state.carry_allowed(mid, cooldown_hours=20, limit=3)
        state._prune()

    def test_the_shipped_config_actually_sets_the_brakes(self):
        cfg = POLICY["report"]
        self.assertEqual(cfg["carry_cooldown_hours"], 20)
        self.assertEqual(cfg["max_carry_overs"], 3)


# ---------------------------------------------------------------------------
# Calendar proposals


class Proposing(unittest.TestCase):
    def build(self, messages, labels, *, skip_ids=(), cfg=None):
        policy = copy.deepcopy(POLICY)
        if cfg:
            policy["calendar"].update(cfg)
        return proposals_mod.build_proposals(messages, labels, policy, skip_ids=skip_ids)

    def test_a_dated_actionable_message_proposes_without_the_event_flag(self):
        """The complaint: a deadline stated plainly in a mail body never
        reached the calendar card. It needed `calendar_worthy`, which is a
        judgement about whether something is an *event* -- and a closing date
        is a date either way."""
        m = msg("m1", "Meesho DICE challenge")
        label = Label(
            id="m1", category="placement_internship", needs_action=True,
            deadline_iso="2026-09-20", calendar_worthy=False,
            one_line="Registration closes 20 Sep",
        )
        out = self.build([m], {"m1": label})
        self.assertEqual([p.title for p in out], ["Meesho DICE challenge"])
        self.assertEqual(out[0].start, "2026-09-20")

    def test_a_dated_message_nobody_has_to_act_on_does_not(self):
        label = Label(id="m1", category="academic", deadline_iso="2026-09-20")
        self.assertEqual(self.build([msg("m1")], {"m1": label}), [])

    def test_the_event_flag_still_works_on_its_own(self):
        label = Label(id="m1", category="academic", calendar_worthy=True,
                      event_start="2026-09-20", event_title="Viva")
        self.assertEqual([p.title for p in self.build([msg("m1")], {"m1": label})], ["Viva"])

    def test_the_relaxation_can_be_switched_off(self):
        label = Label(id="m1", category="academic", needs_action=True,
                      deadline_iso="2026-09-20")
        out = self.build([msg("m1")], {"m1": label}, cfg={"propose_from_deadlines": False})
        self.assertEqual(out, [])

    def test_something_already_proposed_is_not_proposed_again(self):
        label = Label(id="m1", category="academic", needs_action=True,
                      deadline_iso="2026-09-20")
        self.assertEqual(self.build([msg("m1")], {"m1": label}, skip_ids={"m1"}), [])

    def test_a_date_that_is_not_a_date_is_still_refused(self):
        label = Label(id="m1", category="academic", needs_action=True,
                      deadline_iso="sometime next week")
        self.assertEqual(self.build([msg("m1")], {"m1": label}), [])

    def test_bulk_marketing_is_still_skipped(self):
        label = Label(id="m1", category="personal", needs_action=True,
                      deadline_iso="2026-09-20")
        self.assertEqual(self.build([msg("m1", bulk=True)], {"m1": label}), [])

    def test_bulk_placement_mail_is_still_exempt(self):
        """The CDC list is bulk by every header test and is the single most
        important sender there is."""
        label = Label(id="m1", category="placement_internship", needs_action=True,
                      deadline_iso="2026-09-20")
        self.assertEqual(len(self.build([msg("m1", bulk=True)], {"m1": label})), 1)

    def test_numbering_stays_dense_when_items_are_skipped(self):
        """The reply grammar is 'track 1 3'. A gap in the numbering would make
        a confirmation land on the wrong event."""
        labels = {
            f"m{i}": Label(id=f"m{i}", category="academic", needs_action=True,
                           deadline_iso="2026-09-20")
            for i in range(1, 4)
        }
        out = self.build([msg("m1"), msg("m2"), msg("m3")], labels, skip_ids={"m2"})
        self.assertEqual([p.n for p in out], [1, 2])

    def test_state_remembers_what_was_offered(self):
        state = MemState()
        self.assertFalse(state.already_proposed("m1"))
        state.mark_proposed(["m1"])
        self.assertTrue(state.already_proposed("m1"))


# ---------------------------------------------------------------------------
# Urgent, at the top, by name


def item(mid, **kw) -> report_mod.Item:
    return report_mod.Item(msg(mid, kw.pop("subject", mid)), Label(id=mid, **kw))


class UrgentAtTheTop(unittest.TestCase):
    def render(self, **kw):
        return report_mod.render_digest(report_mod.DigestData(**kw), POLICY, NOW)[1]

    def test_an_urgent_message_is_named_not_just_counted(self):
        html = self.render(items=[item("m1", subject="Offer letter deadline",
                                       importance="urgent")])
        self.assertIn("Needs you now", html)
        self.assertIn("Offer letter deadline", html)

    def test_something_due_tomorrow_counts_however_it_was_described(self):
        html = self.render(items=[item("m1", subject="Form closes",
                                       needs_action=True, deadline_iso="2026-08-17")])
        self.assertIn("Needs you now", html)

    def test_something_due_next_month_does_not(self):
        html = self.render(items=[item("m1", subject="Form closes",
                                       needs_action=True, deadline_iso="2026-09-30")])
        self.assertNotIn("Needs you now", html)

    def test_a_carried_item_falling_due_is_promoted(self):
        """A deadline you were told about yesterday and that falls tomorrow is
        more urgent today, not less -- but it lives in the carried list, which
        is deliberately small print at the bottom."""
        html = self.render(carried=[item("m1", subject="Booth essay due",
                                         needs_action=True, deadline_iso="2026-08-17")])
        self.assertIn("Needs you now", html)
        self.assertIn("Booth essay due", html)

    def test_a_quiet_digest_has_no_block_at_all(self):
        html = self.render(items=[item("m1", subject="FYI", category="newsletter")])
        self.assertNotIn("Needs you now", html)

    def test_the_headline_count_matches_the_block(self):
        html = self.render(items=[
            item("m1", subject="A", importance="urgent"),
            item("m2", subject="B", needs_action=True, deadline_iso="2026-08-16"),
        ])
        self.assertIn("Needs you now (2)", html)
        self.assertIn("2 urgent", html)

    def test_a_subject_line_cannot_smuggle_markup_into_the_block(self):
        html = self.render(items=[item("m1", subject="<script>x</script>",
                                       importance="urgent")])
        self.assertNotIn("<script>", html)


# ---------------------------------------------------------------------------
# The starring switch


class StarSwitch(unittest.TestCase):
    def test_it_is_a_tristate_not_a_bool(self):
        """None means 'no opinion, use config.yaml'. Collapsing it to False
        would have the first save of any unrelated setting silently turn
        starring off."""
        self.assertIsNone(overlay_mod.DEFAULTS["star_enabled"])
        self.assertIsNone(overlay_mod.normalise({})["star_enabled"])

    def test_it_round_trips(self):
        self.assertIs(overlay_mod.normalise({"star_enabled": False})["star_enabled"], False)
        self.assertIs(overlay_mod.normalise({"star_enabled": True})["star_enabled"], True)
        self.assertIs(overlay_mod.normalise({"star_enabled": "off"})["star_enabled"], False)

    def test_nonsense_reads_as_no_opinion(self):
        self.assertIsNone(overlay_mod.normalise({"star_enabled": "maybe"})["star_enabled"])

    def test_switching_it_off_beats_the_compiled_rules(self):
        """The instructions box can only ever *extend* the star lists, so the
        off switch has to be applied after them or a compiled 'always star
        anything from the CDC' would outlive it."""
        from agent import rules as rules_mod

        policy = copy.deepcopy(POLICY)
        policy = rules_mod.apply_to_policy(
            policy, rules_mod.normalise({"star_senders": ["@cdc.iitkgp.ac.in"]})
        )
        policy.setdefault("star", {})["enabled"] = False
        self.assertFalse(policy["star"]["enabled"])

    def test_stopping_stars_leaves_everything_else_alone(self):
        """The point of a separate switch: summaries, alerts, the calendar
        loop and the cleanup all carry on."""
        policy = copy.deepcopy(POLICY)
        policy["star"]["enabled"] = False
        self.assertTrue(policy["calendar"]["enabled"])
        self.assertTrue(policy["cleanup"]["enabled"])
        self.assertTrue(policy["urgent"]["enabled"])


if __name__ == "__main__":
    unittest.main()
