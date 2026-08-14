"""Deterministic decision rules.

Everything with a consequence is decided here, in plain Python, from the
message's own metadata plus the model's advisory label. Nothing in this file
trusts email content to be well-intentioned.

The trash path is deny-by-default: a message is kept unless it positively
matches an inclusion rule AND survives every protection. Each decision carries
its reasons so the digest can explain itself and you can audit the rules by
reading a report rather than reading the code.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Callable

from .classify import Label
from .gmail import Message

log = logging.getLogger(__name__)


@dataclass
class Verdict:
    """Outcome of one rule evaluation."""

    allowed: bool
    reasons: list[str] = field(default_factory=list)

    def deny(self, reason: str) -> "Verdict":
        return Verdict(False, self.reasons + [reason])

    def allow(self, reason: str) -> "Verdict":
        return Verdict(True, self.reasons + [reason])


def _matches_sender(msg: Message, patterns: list[str]) -> str | None:
    """Match a full address or an @domain suffix, case-insensitively."""
    email = (msg.sender_email or "").lower()
    domain = msg.sender_domain
    for raw in patterns or []:
        pattern = (raw or "").strip().lower()
        if not pattern:
            continue
        if pattern.startswith("@"):
            bare = pattern[1:]
            if domain == bare or domain.endswith("." + bare):
                return raw
        elif pattern == email:
            return raw
        elif domain == pattern or domain.endswith("." + pattern):
            return raw
    return None


@lru_cache(maxsize=1024)
def _keyword_pattern(needle: str) -> re.Pattern[str]:
    """Whole-word matcher for a keyword or phrase.

    Plain substring matching is wrong here and quietly so: 'exam' occurs inside
    'example.com', 'fee' inside 'coffee', 'intern' inside 'internet'. On the
    protect list that silently disables cleanup; on the star list it stars
    everything. So: word boundaries, flexible inner whitespace for phrases,
    and an optional plural suffix so 'invoice' still catches 'invoices'.
    """
    words = [re.escape(w) for w in needle.split()]
    body = r"\s+".join(words)
    return re.compile(rf"(?<!\w){body}(?:e?s)?(?!\w)", re.IGNORECASE)


def _matches_keyword(msg: Message, keywords: list[str]) -> str | None:
    haystack = msg.searchable()
    for raw in keywords or []:
        needle = (raw or "").strip().lower()
        if needle and _keyword_pattern(needle).search(haystack):
            return raw
    return None


# --------------------------------------------------------------------------
# Cleanup
# --------------------------------------------------------------------------


def may_be_trashable(msg: Message, cfg: dict[str, Any]) -> bool:
    """Cheap metadata-only screen, used to avoid classifying mail that is
    already certain to be kept.

    Every check here is one `trash_verdict` below also makes, and every one
    reads only headers and metadata -- nothing the model produces. So `False`
    here means `trash_verdict` would deny the message anyway, and skipping it
    cannot change an outcome. The converse does not hold: `True` means only
    "not yet excluded", and the full verdict still decides.

    Why it exists: the cap on how many messages may be trashed is enforced on
    the *verdict*, so classifying every candidate upfront meant paying the
    model for hundreds of results that were then discarded -- slow enough on a
    large mailbox to run the digest past its task timeout.

    Deliberately conservative. Leaving a check out only wastes a
    classification. Adding one that `trash_verdict` does not also make would
    silently keep mail that should have been considered, so don't.
    """
    cleanup = cfg.get("cleanup", {}) or {}
    protect = cleanup.get("protect", {}) or {}

    if not cleanup.get("enabled", False):
        return False
    if msg.age_days < float(cleanup.get("min_age_days", 30)):
        return False
    if msg.is_starred:
        return False
    if set(protect.get("labels", []) or []) & set(msg.label_ids):
        return False
    if "SENT" in msg.label_ids or "DRAFT" in msg.label_ids:
        return False
    if _matches_sender(msg, protect.get("senders", [])):
        return False
    if _matches_keyword(msg, protect.get("keywords", [])):
        return False
    if protect.get("human_senders", True) and not msg.is_bulk:
        return False
    # Not screened here: the category/importance/needs-action checks, which
    # need the model, and the thread-reply check, which costs an API call.
    return True


def trash_verdict(
    msg: Message,
    label: Label,
    cfg: dict[str, Any],
    thread_has_sent: Callable[[str], bool],
) -> Verdict:
    """Decide whether a message may be moved to Trash.

    Order matters: cheap local checks first, the API-backed thread check last,
    so we make as few extra Gmail calls as possible.
    """
    cleanup = cfg.get("cleanup", {}) or {}
    protect = cleanup.get("protect", {}) or {}
    verdict = Verdict(True)

    if not cleanup.get("enabled", False):
        return verdict.deny("cleanup disabled")

    # -- inclusion: must be positively eligible ----------------------------
    trashable = cleanup.get("trashable_categories", []) or []
    if label.category not in trashable:
        return verdict.deny(f"category '{label.category}' is not in trashable_categories")

    min_age = float(cleanup.get("min_age_days", 30))
    if msg.age_days < min_age:
        return verdict.deny(f"only {msg.age_days:.0f}d old, minimum is {min_age:.0f}d")

    # -- protections: any hit keeps the message ----------------------------
    if msg.is_starred:
        return verdict.deny("starred")

    protected_labels = set(protect.get("labels", []) or [])
    hit_labels = protected_labels & set(msg.label_ids)
    if hit_labels:
        return verdict.deny(f"carries protected label {sorted(hit_labels)[0]}")

    if "SENT" in msg.label_ids or "DRAFT" in msg.label_ids:
        return verdict.deny("is your own sent mail or a draft")

    if label.importance in {"urgent", "high"}:
        return verdict.deny(f"model rated importance '{label.importance}'")

    if label.needs_action or label.needs_reply:
        return verdict.deny("model says it needs action or a reply")

    # Sender identity is the more precise signal, so it is checked first and
    # gives a more useful reason in the report than a keyword hit would.
    sender = _matches_sender(msg, protect.get("senders", []))
    if sender:
        return verdict.deny(f"sender matches protected pattern '{sender}'")

    keyword = _matches_keyword(msg, protect.get("keywords", []))
    if keyword:
        return verdict.deny(f"matches protected keyword '{keyword}'")

    if protect.get("human_senders", True) and not msg.is_bulk:
        return verdict.deny("looks like a human sender, not a bulk mailer")

    # Most expensive check, so it runs only on messages that would otherwise go.
    if protect.get("threads_you_replied_to", True) and thread_has_sent(msg.thread_id):
        return verdict.deny("you replied in this thread")

    return verdict.allow(f"stale {label.category}, {msg.age_days:.0f}d old, bulk sender")


def build_cleanup_query(cfg: dict[str, Any]) -> str:
    """Compose the Gmail search that produces cleanup candidates.

    This narrows what we fetch. It is not a safety boundary -- every message it
    returns is still re-checked by trash_verdict above.
    """
    cleanup = cfg.get("cleanup", {}) or {}
    includes = [q for q in (cleanup.get("include_queries") or []) if q]
    excludes = [q for q in (cleanup.get("exclude_queries") or []) if q]
    min_age = int(cleanup.get("min_age_days", 30))

    parts = []
    if includes:
        parts.append("(" + " OR ".join(f"({q})" for q in includes) + ")")
    parts.append(f"older_than:{min_age}d")
    parts.extend(f"-({q})" for q in excludes)
    parts.append("-in:trash")
    parts.append("-in:spam")
    return " ".join(parts)


# --------------------------------------------------------------------------
# Starring
# --------------------------------------------------------------------------


def star_verdict(msg: Message, label: Label, cfg: dict[str, Any]) -> Verdict:
    """Decide whether to star. Any single rule matching is enough."""
    star = cfg.get("star", {}) or {}
    verdict = Verdict(True)

    if not star.get("enabled", False):
        return verdict.deny("starring disabled")

    if msg.is_starred:
        return verdict.deny("already starred")

    if star.get("never_star_bulk", True) and msg.is_bulk:
        # One exception: a genuine placement mail often arrives via a list.
        if label.category != "placement_internship":
            return verdict.deny("bulk sender")

    explicit = _matches_sender(msg, star.get("faculty_senders", []))
    if explicit:
        return verdict.allow(f"from tracked faculty address '{explicit}'")

    if label.category in (star.get("categories", []) or []):
        return verdict.allow(f"category '{label.category}'")

    faculty = _matches_sender(msg, star.get("faculty_domains", []))
    if faculty and not msg.is_bulk:
        return verdict.allow(f"human sender at '{faculty}'")

    subject = _matches_keyword(msg, star.get("subjects", []))
    if subject:
        return verdict.allow(f"mentions your subject '{subject}'")

    keyword = _matches_keyword(msg, star.get("keywords", []))
    if keyword and not msg.is_bulk:
        return verdict.allow(f"mentions '{keyword}'")

    if label.needs_action and label.importance in {"urgent", "high"}:
        return verdict.allow("needs action and rated important")

    return verdict.deny("no starring rule matched")


# --------------------------------------------------------------------------
# Urgency
# --------------------------------------------------------------------------


def urgent_verdict(msg: Message, label: Label, cfg: dict[str, Any]) -> Verdict:
    """Gate for out-of-band alerts.

    Requires the model's judgement AND a deterministic corroborating signal.
    Without the second half, anyone could buzz your phone by putting the word
    URGENT in a subject line.
    """
    urgent = cfg.get("urgent", {}) or {}
    verdict = Verdict(True)

    if not urgent.get("enabled", True):
        return verdict.deny("urgent alerts disabled")

    always = _matches_sender(msg, urgent.get("always_urgent_senders", []))
    if always:
        return verdict.allow(f"sender '{always}' is on the always-urgent list")

    if label.importance != "urgent":
        return verdict.deny(f"model rated '{label.importance}'")

    if urgent.get("require_non_bulk", True) and msg.is_bulk:
        return verdict.deny("bulk mail cannot raise an alert")

    allowed_domains = urgent.get("allowed_domains", []) or []
    if allowed_domains and not _matches_sender(msg, allowed_domains):
        return verdict.deny(f"sender domain '{msg.sender_domain}' not on the allow list")

    phrase = _matches_keyword(msg, urgent.get("always_urgent_phrases", []))
    if phrase:
        return verdict.allow(f"model rated urgent and it says '{phrase}'")

    if label.needs_action or label.deadline_iso:
        return verdict.allow("model rated urgent and it needs action")

    return verdict.deny("model rated urgent but nothing corroborates it")


# --------------------------------------------------------------------------
# Career feed
# --------------------------------------------------------------------------


def career_verdict(msg: Message, label: Label, cfg: dict[str, Any]) -> Verdict:
    career = cfg.get("career", {}) or {}
    verdict = Verdict(True)

    if not career.get("enabled", False):
        return verdict.deny("career feed disabled")
    if label.category not in (career.get("categories", []) or []):
        return verdict.deny(f"category '{label.category}' is not a career category")
    if not label.career_is_opportunity:
        return verdict.deny("model did not read it as an opportunity")
    if not (label.career_company or label.career_role):
        return verdict.deny("no company or role could be identified")
    return verdict.allow("career opportunity")
