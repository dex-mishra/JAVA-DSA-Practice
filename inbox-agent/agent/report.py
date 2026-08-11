"""HTML rendering for the digest and the urgent alert.

Email clients are a hostile rendering target, so this sticks to inline styles
and simple block layout. Every piece of email-derived text goes through
`esc()` -- a subject line containing markup should never become markup in the
report.
"""

from __future__ import annotations

import html
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Iterable

from .classify import Label
from .gmail import Message

FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
INK = "#1a1a1a"
MUTED = "#6b7280"
RULE = "#e5e7eb"
ACCENT = "#1d4ed8"
WARN = "#b45309"
DANGER = "#b91c1c"

SECTION_TITLES = {
    "needs_reply": "Waiting on your reply",
    "deadlines": "Dated",
    "academic": "Academic",
    "placement_internship": "Placement &amp; internships",
    "finance": "Money",
    "security": "Security",
    "fyi": "Everything else",
}

ACCOUNT_TAGS = {"primary": "personal", "college": "college"}


def esc(text: Any) -> str:
    return html.escape(str(text or ""), quote=True)


@dataclass
class Item:
    message: Message
    label: Label
    starred: bool = False
    star_reason: str = ""


@dataclass
class DigestData:
    items: list[Item] = field(default_factory=list)
    starred: list[Item] = field(default_factory=list)
    trashed: list[tuple[Message, str]] = field(default_factory=list)
    would_trash: list[tuple[Message, str]] = field(default_factory=list)
    career_new: int = 0
    career_upcoming: list[dict[str, Any]] = field(default_factory=list)
    dry_run: bool = True
    errors: list[str] = field(default_factory=list)
    scanned: int = 0


def _sender_name(msg: Message) -> str:
    raw = msg.sender or ""
    if "<" in raw:
        name = raw.split("<", 1)[0].strip().strip('"')
        if name:
            return name
    return msg.sender_email or raw


def _bucket(items: list[Item]) -> dict[str, list[Item]]:
    """Assign each message to exactly one section, most actionable first."""
    out: dict[str, list[Item]] = {key: [] for key in SECTION_TITLES}
    for item in items:
        label = item.label
        if label.needs_reply:
            out["needs_reply"].append(item)
        elif label.deadline_iso:
            out["deadlines"].append(item)
        elif label.category in out:
            out[label.category].append(item)
        elif label.importance in {"urgent", "high"} or label.needs_action:
            out["fyi"].append(item)
    return out


def _row(item: Item) -> str:
    msg, label = item.message, item.label
    tag = ACCOUNT_TAGS.get(msg.account, msg.account)
    when = datetime.fromtimestamp(msg.date_ts).strftime("%d %b") if msg.date_ts else ""

    chips = []
    if label.deadline_iso:
        chips.append(
            f'<span style="color:{WARN};font-weight:600">due {esc(label.deadline_iso)}</span>'
        )
    if item.starred:
        chips.append(f'<span style="color:{MUTED}">starred</span>')
    chip_html = (
        f'<div style="font-size:12px;margin-top:3px">{" &middot; ".join(chips)}</div>'
        if chips
        else ""
    )

    return f"""
    <div style="padding:11px 0;border-bottom:1px solid {RULE}">
      <div style="font-size:12px;color:{MUTED};margin-bottom:2px">
        {esc(_sender_name(msg))} &middot; {esc(tag)} &middot; {esc(when)}
      </div>
      <div style="font-size:15px;font-weight:600;color:{INK};line-height:1.35">
        <a href="{esc(msg.web_url)}" style="color:{INK};text-decoration:none">{esc(msg.subject)}</a>
      </div>
      <div style="font-size:13px;color:{MUTED};margin-top:3px;line-height:1.45">
        {esc(label.one_line or msg.snippet[:140])}
      </div>
      {chip_html}
    </div>"""


def _section(title: str, items: list[Item], limit: int) -> str:
    if not items:
        return ""
    ranked = sorted(
        items,
        key=lambda i: (
            {"urgent": 0, "high": 1, "normal": 2, "low": 3}.get(i.label.importance, 2),
            -(i.message.date_ts or 0),
        ),
    )
    shown = ranked[:limit]
    overflow = len(ranked) - len(shown)
    more = (
        f'<div style="font-size:12px;color:{MUTED};padding-top:8px">'
        f"and {overflow} more</div>"
        if overflow > 0
        else ""
    )
    return f"""
    <div style="margin:26px 0 0">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                  color:{ACCENT};padding-bottom:4px">{title}</div>
      {"".join(_row(i) for i in shown)}
      {more}
    </div>"""


def _cleanup_block(data: DigestData) -> str:
    rows: Iterable[tuple[Message, str]]
    if data.dry_run:
        rows, heading, note = (
            data.would_trash,
            "Would have cleaned up",
            "Dry run &mdash; nothing was touched. Set <code>dry_run: false</code> "
            "in config.yaml once these look right.",
        )
    else:
        rows, heading, note = (
            data.trashed,
            "Cleaned up",
            "Moved to Trash. Recoverable in Gmail for 30 days.",
        )

    if not rows:
        return ""

    listed = list(rows)[:15]
    overflow = len(list(rows)) - len(listed)
    body = "".join(
        f"""<div style="padding:6px 0;border-bottom:1px solid {RULE};font-size:13px">
             <span style="color:{INK}">{esc(m.subject[:70])}</span>
             <span style="color:{MUTED}"> &mdash; {esc(_sender_name(m))}</span>
             <div style="font-size:11px;color:{MUTED}">{esc(reason)}</div>
           </div>"""
        for m, reason in listed
    )
    more = (
        f'<div style="font-size:12px;color:{MUTED};padding-top:8px">and {overflow} more</div>'
        if overflow > 0
        else ""
    )
    return f"""
    <div style="margin:30px 0 0;padding:14px;background:#f9fafb;border-radius:8px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                  color:{MUTED}">{heading} ({len(list(rows))})</div>
      <div style="font-size:12px;color:{MUTED};margin:4px 0 8px">{note}</div>
      {body}{more}
    </div>"""


def _career_block(data: DigestData) -> str:
    if not data.career_upcoming and not data.career_new:
        return ""
    rows = "".join(
        f"""<div style="padding:7px 0;border-bottom:1px solid {RULE};font-size:13px">
             <span style="font-weight:600;color:{INK}">{esc(e.get("company") or "Unknown")}</span>
             <span style="color:{MUTED}"> &mdash; {esc(e.get("role") or e.get("kind"))}</span>
             <div style="font-size:12px;color:{WARN}">closes {esc(e.get("deadline"))}</div>
           </div>"""
        for e in data.career_upcoming
    )
    new_note = (
        f'<div style="font-size:12px;color:{MUTED};margin:4px 0 8px">'
        f"{data.career_new} new added to the career tracker</div>"
        if data.career_new
        else ""
    )
    return f"""
    <div style="margin:30px 0 0;padding:14px;background:#f5f7ff;border-radius:8px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                  color:{ACCENT}">Career tracker</div>
      {new_note}{rows}
    </div>"""


def render_digest(data: DigestData, policy: dict[str, Any], timestamp: datetime) -> tuple[str, str]:
    """Returns (subject, html)."""
    report_cfg = policy.get("report", {}) or {}
    limit = int(report_cfg.get("max_items_per_section", 12))
    order = report_cfg.get("sections") or list(SECTION_TITLES)

    buckets = _bucket(data.items)
    body = "".join(
        _section(SECTION_TITLES.get(key, key.title()), buckets.get(key, []), limit)
        for key in order
    )

    action_count = sum(1 for i in data.items if i.label.needs_action or i.label.needs_reply)
    urgent_count = sum(1 for i in data.items if i.label.importance == "urgent")

    if not body.strip():
        body = (
            f'<div style="padding:26px 0;color:{MUTED};font-size:14px">'
            f"Nothing needs you right now.</div>"
        )

    headline_bits = []
    if action_count:
        headline_bits.append(f"{action_count} need you")
    if urgent_count:
        headline_bits.append(f"{urgent_count} urgent")
    if data.starred:
        headline_bits.append(f"{len(data.starred)} starred")
    cleaned = len(data.trashed) if not data.dry_run else len(data.would_trash)
    if cleaned:
        headline_bits.append(
            f"{cleaned} {'cleaned' if not data.dry_run else 'cleanable'}"
        )
    headline = " &middot; ".join(headline_bits) or "all clear"

    subject_bits = []
    if urgent_count:
        subject_bits.append(f"{urgent_count} urgent")
    if action_count:
        subject_bits.append(f"{action_count} to action")
    subject = "Inbox: " + (", ".join(subject_bits) if subject_bits else "all clear")

    errors_html = ""
    if data.errors:
        listed = "".join(f"<div>{esc(e)}</div>" for e in data.errors)
        errors_html = f"""
        <div style="margin-top:24px;padding:11px;border-left:3px solid {DANGER};
                    background:#fef2f2;font-size:12px;color:{DANGER}">
          <strong>Ran into trouble</strong>{listed}
        </div>"""

    html_doc = f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff">
  <div style="max-width:640px;margin:0 auto;padding:26px 20px;font-family:{FONT};color:{INK}">
    <div style="border-bottom:2px solid {INK};padding-bottom:12px">
      <div style="font-size:20px;font-weight:700">Inbox report</div>
      <div style="font-size:13px;color:{MUTED};margin-top:3px">
        {timestamp.strftime("%A %d %B, %I:%M %p")} &middot; {data.scanned} messages read
      </div>
      <div style="font-size:13px;color:{ACCENT};margin-top:5px;font-weight:600">{headline}</div>
    </div>
    {body}
    {_career_block(data)}
    {_cleanup_block(data)}
    {errors_html}
    <div style="margin-top:28px;padding-top:12px;border-top:1px solid {RULE};
                font-size:11px;color:{MUTED};line-height:1.6">
      Sent by your inbox agent. It can read, star, label and move mail to Trash.
      It holds no permission to delete anything permanently.
    </div>
  </div>
</body></html>"""
    return subject, html_doc


def render_alert(items: list[Item], timestamp: datetime) -> tuple[str, str]:
    """The out-of-band urgent notification. Deliberately short."""
    lead = items[0].message.subject[:60] if items else "Something needs you"
    subject = f"Urgent: {lead}" if len(items) == 1 else f"Urgent: {len(items)} things need you"

    rows = "".join(
        f"""
      <div style="padding:13px 0;border-bottom:1px solid {RULE}">
        <div style="font-size:12px;color:{MUTED}">
          {esc(_sender_name(i.message))} &middot; {esc(ACCOUNT_TAGS.get(i.message.account, ""))}
        </div>
        <div style="font-size:16px;font-weight:600;margin-top:2px">
          <a href="{esc(i.message.web_url)}" style="color:{INK};text-decoration:none">
            {esc(i.message.subject)}</a>
        </div>
        <div style="font-size:13px;color:{MUTED};margin-top:4px">{esc(i.label.one_line)}</div>
        {f'<div style="font-size:13px;color:{WARN};font-weight:600;margin-top:4px">due {esc(i.label.deadline_iso)}</div>' if i.label.deadline_iso else ""}
      </div>"""
        for i in items
    )

    html_doc = f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff">
  <div style="max-width:600px;margin:0 auto;padding:22px 20px;font-family:{FONT};color:{INK}">
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                color:{DANGER};border-bottom:2px solid {DANGER};padding-bottom:7px">
      Needs you now
    </div>
    {rows}
    <div style="margin-top:20px;font-size:11px;color:{MUTED}">
      {timestamp.strftime("%d %b, %I:%M %p")} &middot; next digest will include this too.
    </div>
  </div>
</body></html>"""
    return subject, html_doc
