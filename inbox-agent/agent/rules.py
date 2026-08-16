"""Rules compiled from your written instructions.

The instructions box is plain English. Prose alone steers the classifier's
judgement, which was all it used to do. This turns the same text into
concrete rules the deterministic layer can act on -- who to star, what never
to bin, how the summary is laid out -- so "always star anything from Prof
Sharma" becomes a rule rather than a hope.

The compilation happens once, when you save, and the result is shown back to
you. It is not re-interpreted on every run: the same sentence read against
different mail can yield different decisions, and for anything that touches
your inbox the decision should be fixed at the moment you approve it.

Two invariants hold no matter what the text says.

**Additive only.** Compiled rules are appended to what config.yaml already
says. There is no operation here that removes a protection, shortens a
list, or drops a section from the report -- so a careless instruction can
make the agent noisier or more cautious, never less careful.

**Protection wins.** If a sender or keyword ends up on both the protect list
and the bin list, it is protected. Ties do not go to deletion.

And the ceilings are not reachable from here at all: how much may be binned in
one run, the minimum age before anything is eligible, and the OAuth scope that
makes permanent deletion impossible all live in config.yaml and code.
"""

from __future__ import annotations

import copy
import logging
import re
from typing import Any

log = logging.getLogger(__name__)

# Per-list ceilings. A compiled patch proposing hundreds of rules is a
# malfunction, not an unusually detailed instruction.
MAX_PER_LIST = 40
MAX_TRASH_RULES = 25
MAX_NOTE = 400

# Sections the report knows how to render. Anything else is discarded rather
# than silently producing an empty heading.
KNOWN_SECTIONS = [
    "needs_reply", "deadlines", "academic", "placement_internship",
    "finance", "security", "fyi",
]

STAR_CATEGORIES = [
    "academic", "placement_internship", "finance", "security",
    "personal", "work_project",
]

# A bin rule this broad is almost never what someone means, and the cost of
# being wrong is asymmetric: an over-broad protect rule keeps clutter, an
# over-broad bin rule loses mail.
_TOO_BROAD = re.compile(r"^[@.]*(com|net|org|in|edu|co|io|ac|gov|me)$", re.I)
_ENTRY_OK = re.compile(r"^[A-Za-z0-9@._+-]{3,120}$")

FIELDS_LIST = [
    "star_senders", "star_keywords", "protect_senders", "protect_keywords",
    "trash_senders", "trash_keywords",
]

EMPTY: dict[str, Any] = {
    **{f: [] for f in FIELDS_LIST},
    "star_categories": [],
    "report_sections": [],
    "max_items_per_section": 0,
    "note": "",
}


def _clean_entries(raw: Any, limit: int, *, for_trash: bool = False,
                   own_domains: set[str] | None = None) -> list[str]:
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in raw:
        if len(out) >= limit:
            break
        text = str(item or "").strip().lower()
        if not text or text in seen or not _ENTRY_OK.match(text):
            continue
        bare = text.lstrip("@")
        if _TOO_BROAD.match(bare):
            log.warning("Refusing an over-broad rule: %r", text)
            continue
        if for_trash:
            # Never let a compiled rule aim at the mailboxes we read.
            if own_domains and any(bare == d or bare.endswith("." + d) for d in own_domains):
                log.warning("Refusing a bin rule aimed at your own domain: %r", text)
                continue
        seen.add(text)
        out.append(text)
    return out


def normalise(raw: Any, own_domains: set[str] | None = None) -> dict[str, Any]:
    """Coerce a compiled patch into something safe. Never raises."""
    out = copy.deepcopy(EMPTY)
    if not isinstance(raw, dict):
        return out

    for field in FIELDS_LIST:
        is_trash = field.startswith("trash_")
        out[field] = _clean_entries(
            raw.get(field),
            MAX_TRASH_RULES if is_trash else MAX_PER_LIST,
            for_trash=is_trash,
            own_domains=own_domains,
        )

    cats = raw.get("star_categories")
    if isinstance(cats, list):
        out["star_categories"] = [c for c in cats if c in STAR_CATEGORIES][:len(STAR_CATEGORIES)]

    # Reorder and extend, never drop: any known section the instructions did
    # not mention is appended in its original order rather than removed.
    sections = raw.get("report_sections")
    if isinstance(sections, list):
        picked = [s for s in sections if s in KNOWN_SECTIONS]
        deduped: list[str] = []
        for s in picked:
            if s not in deduped:
                deduped.append(s)
        if deduped:
            out["report_sections"] = deduped + [s for s in KNOWN_SECTIONS if s not in deduped]

    try:
        out["max_items_per_section"] = max(0, min(int(raw.get("max_items_per_section") or 0), 60))
    except (TypeError, ValueError):
        out["max_items_per_section"] = 0

    note = raw.get("note")
    out["note"] = str(note).strip()[:MAX_NOTE] if isinstance(note, str) else ""
    return out


def is_empty(derived: dict[str, Any]) -> bool:
    return not any(
        derived.get(k) for k in (*FIELDS_LIST, "star_categories", "report_sections")
    ) and not derived.get("max_items_per_section")


def apply_to_policy(policy: dict[str, Any], derived: dict[str, Any]) -> dict[str, Any]:
    """Fold compiled rules into the deployed policy. Additive throughout.

    Returns a new dict; the caller's policy is left alone.
    """
    if not derived or is_empty(derived):
        return policy

    merged = copy.deepcopy(policy)

    def extend(section: dict[str, Any], key: str, values: list[str]) -> None:
        existing = list(section.get(key) or [])
        lowered = {str(v).lower() for v in existing}
        for value in values:
            if value not in lowered:
                existing.append(value)
                lowered.add(value)
        section[key] = existing

    star = merged.setdefault("star", {})
    extend(star, "faculty_senders", derived.get("star_senders", []))
    extend(star, "subjects", derived.get("star_keywords", []))
    extend(star, "categories", derived.get("star_categories", []))

    cleanup = merged.setdefault("cleanup", {})
    protect = cleanup.setdefault("protect", {})
    extend(protect, "senders", derived.get("protect_senders", []))
    extend(protect, "keywords", derived.get("protect_keywords", []))

    # Bin rules are recorded on their own keys rather than widening
    # trashable_categories, so policy.py keeps deciding categories and these
    # only ever narrow to specific senders and phrases.
    trash_senders = [
        s for s in derived.get("trash_senders", [])
        if s not in {str(x).lower() for x in protect.get("senders", [])}
    ]
    trash_keywords = [
        k for k in derived.get("trash_keywords", [])
        if k not in {str(x).lower() for x in protect.get("keywords", [])}
    ]
    if trash_senders:
        extend(cleanup, "extra_senders", trash_senders)
    if trash_keywords:
        extend(cleanup, "extra_keywords", trash_keywords)

    report = merged.setdefault("report", {})
    if derived.get("report_sections"):
        report["sections"] = derived["report_sections"]
    wanted = int(derived.get("max_items_per_section") or 0)
    if wanted:
        # Only ever raises: "only add, never reduce" applies to how much the
        # summary tells you as much as to what the agent protects.
        report["max_items_per_section"] = max(
            int(report.get("max_items_per_section", 12)), wanted
        )

    return merged


def describe(derived: dict[str, Any]) -> list[str]:
    """Plain-English lines for the console, so what was understood from your
    text is visible rather than implied."""
    if not derived or is_empty(derived):
        return []
    lines = []
    pairs = [
        ("star_senders", "Always star mail from"),
        ("star_keywords", "Always star mail mentioning"),
        ("star_categories", "Always star these kinds"),
        ("protect_senders", "Never bin mail from"),
        ("protect_keywords", "Never bin mail mentioning"),
        ("trash_senders", "Treat as junk from"),
        ("trash_keywords", "Treat as junk when mentioning"),
    ]
    for key, label in pairs:
        values = derived.get(key) or []
        if values:
            lines.append(f"{label}: {', '.join(values[:12])}"
                         + (f" (+{len(values) - 12} more)" if len(values) > 12 else ""))
    if derived.get("report_sections"):
        lines.append("Summary order: " + " → ".join(derived["report_sections"]))
    if derived.get("max_items_per_section"):
        lines.append(f"Show up to {derived['max_items_per_section']} items per section")
    return lines
