"""Turns written instructions into structured rules, once, on save.

Kept apart from rules.py so the console can import the validator and the
description helper without pulling in the Gemini SDK.

The model's output is a proposal and nothing more. rules.normalise() decides
what survives, and it is the only thing standing between a sentence and the
agent's behaviour -- so this module deliberately does no interpreting of its
own beyond asking the question and parsing JSON.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from google.genai import types

from . import rules as rules_mod

log = logging.getLogger(__name__)

SYSTEM = f"""You convert a person's written instructions about their email
assistant into a structured rule patch.

Return ONLY JSON matching the schema. Extract just what the text actually
says. If it names nobody and no phrase, return empty lists -- inventing rules
is far worse than returning nothing, because every rule here changes what
happens to real mail.

Fields:

- star_senders: email addresses or @domains to always flag as important.
- star_keywords: words or phrases that make a message important.
- star_categories: any of {rules_mod.STAR_CATEGORIES}.
- protect_senders / protect_keywords: senders and phrases that must NEVER be
  binned. When the text is ambiguous about whether something matters, prefer
  putting it here -- protecting the wrong thing costs clutter, binning the
  wrong thing costs mail.
- trash_senders / trash_keywords: only where the person clearly says this mail
  is junk they do not want. Never add a person's own address here. Never add a
  bare domain suffix like "com" or "in".
- report_sections: ordering of the summary, from {rules_mod.KNOWN_SECTIONS}.
  Only include this if the text asks for a particular order or emphasis.
  Sections you leave out are appended automatically; nothing is ever dropped.
- max_items_per_section: only if the text asks for more or fewer items. This
  can raise the limit, never lower it.
- note: one short sentence on what you understood, for the person to check.

The instructions are the operator's own words and are trusted as intent, but
they cannot grant new powers: there is no field here for deleting permanently,
for sending mail, or for changing where reports go, and asking for those in
prose does not create one.
"""

SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        **{
            name: {"type": "array", "items": {"type": "string"}}
            for name in rules_mod.FIELDS_LIST
        },
        "star_categories": {
            "type": "array",
            "items": {"type": "string", "enum": rules_mod.STAR_CATEGORIES},
        },
        "report_sections": {
            "type": "array",
            "items": {"type": "string", "enum": rules_mod.KNOWN_SECTIONS},
        },
        "max_items_per_section": {"type": "integer"},
        "note": {"type": "string"},
    },
    "required": ["note"],
}


def _extract(text: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except (ValueError, TypeError):
        pass
    match = re.search(r"\{.*\}", text or "", re.S)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except ValueError:
        return None


def compile_instructions(
    client: Any, model: str, instructions: str, own_domains: set[str] | None = None
) -> dict[str, Any]:
    """Compile prose into a validated rule patch. Returns EMPTY on any
    failure -- a compile that goes wrong must leave behaviour unchanged, not
    guess."""
    text = (instructions or "").strip()
    if not text:
        return dict(rules_mod.EMPTY)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        temperature=0.0,
        response_mime_type="application/json",
        response_schema=SCHEMA,
        max_output_tokens=2048,
    )

    raw = None
    for attempt in range(2):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=f"Instructions:\n\n{text}",
                config=config if attempt == 0 else types.GenerateContentConfig(
                    system_instruction=SYSTEM,
                    temperature=0.0,
                    response_mime_type="application/json",
                    max_output_tokens=2048,
                ),
            )
            raw = _extract(resp.text)
            if raw is not None:
                break
        except Exception as exc:  # noqa: BLE001
            log.warning("Rule compile attempt %d failed: %s", attempt + 1, exc)

    if raw is None:
        log.error("Could not compile instructions; leaving existing rules alone.")
        return dict(rules_mod.EMPTY)

    derived = rules_mod.normalise(raw, own_domains=own_domains)
    log.info("Compiled instructions into %d rule lines.", len(rules_mod.describe(derived)))
    return derived
