"""Entry point. One process, several modes, driven by Cloud Scheduler.

  --mode=sweep    every 15 min. Cheap. Stars and files new mail, and sends an
                  out-of-band alert only for things that are genuinely urgent.
  --mode=digest   4x a day. Full report, and runs the cleanup pass once daily.
  --mode=review   on demand. Reads the WHOLE inbox, opened and unopened,
                  and mails one stocktake. Read-only whatever else is set.
  --mode=cleanup  cleanup only, for testing the rules in isolation.
  --mode=check    verifies credentials and config, touching nothing.

Modes are deliberately separate processes rather than one long-running loop:
a crash costs one cycle, not the service, and there is no state to corrupt
between runs beyond a single small JSON blob.
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from . import actions as actions_mod
from . import archive as archive_mod
from . import career as career_mod
from . import policy as policy_mod
from . import proposals as proposals_mod
from . import report as report_mod
from . import rules as rules_mod
from .calendar import CalendarClient, EventSpec
from .classify import Classifier, Label
from . import overlay as overlay_mod
from .config import Account, Settings, load_settings
from . import gmail as gmail_mod
from .gmail import GmailClient, Message
from .state import State

log = logging.getLogger("agent")

# Surfaced in the run log, so a lost write is visible on the site rather
# than being a line in Cloud Logging nobody reads.
STATE_LOST = "state write failed; this run's record was not kept"


class AgentError(RuntimeError):
    """A failure whose cause is worth reading, not just a stack trace.

    Everything raised as this ends up in the run log's detail field, which
    is what the website shows under a failed run. The alternative -- what
    this replaces -- was `return 1`, recorded as the entirely useless
    "exited 1": four failed runs in a row, no way to tell from the site
    whether the mailboxes were unreachable, the bucket was gone, or Vertex
    was refusing, and no answer short of learning gcloud.
    """


def _setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
        stream=sys.stdout,
    )
    for noisy in ("googleapiclient.discovery_cache", "google.auth", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def _now(settings: Settings) -> datetime:
    return datetime.now(ZoneInfo(settings.timezone))


def _deliver(
    primary: GmailClient | None,
    settings: Settings,
    mode: str,
    subject: str,
    html: str,
) -> tuple[bool, str | None]:
    """Send a report and keep a copy. Returns (sent, archived report id).

    Everything goes through here so the console can show you what was sent --
    including reports withheld by dry run, which are archived as sent=False.
    Otherwise "did it run?" is only answerable from Cloud Logging, and a run
    that dies before sending leaves no trace in the one place you look.
    """
    sent = False
    if settings.dry_run:
        log.info("[dry-run] would send %r to %s", subject, settings.report_to)
    elif primary:
        sent = bool(primary.send_html(settings.report_to, subject, html, kind=mode))
    else:
        log.error("Primary account not connected; cannot send %r", subject)

    report_id = archive_mod.save_report(
        settings.state_bucket, mode=mode, subject=subject, html=html, sent=sent
    )
    return sent, report_id


def _recompile_rules_if_due(settings: Settings) -> None:
    """Turn the instructions box into rules, when it has changed.

    Done here rather than in the console so the compile runs with the Vertex
    access the job already has, and so the rules are produced by the same
    process that will act on them.

    A failure leaves the previous rules in force. That is the important
    property: instructions that fail to compile must not quietly strip the
    protections the last successful compile put in place.
    """
    if settings.compile_requested_ts <= settings.compiled_ts:
        return

    log.info("Instructions changed; compiling them into rules.")
    try:
        from . import rule_compiler

        classifier = Classifier(
            settings.project, settings.vertex_location, settings.gemini_model
        )
        own = {a.email.split("@")[-1].lower() for a in settings.accounts if "@" in a.email}
        derived = rule_compiler.compile_instructions(
            classifier.client, settings.gemini_model, settings.instructions, own_domains=own
        )
    except Exception as exc:  # noqa: BLE001
        log.error("Could not compile instructions: %s", exc)
        return

    if rules_mod.is_empty(derived) and settings.instructions.strip():
        log.warning("Instructions produced no usable rules; keeping the previous set.")
        # Still stamp it, or every run retries a compile that will not improve.
        derived = settings.derived or {}

    try:
        current = overlay_mod.load(settings.state_bucket)
        current["derived"] = derived
        current["compiled_ts"] = time.time()
        overlay_mod.save(settings.state_bucket, current)
        for line in rules_mod.describe(derived):
            log.info("  rule: %s", line)
    except Exception as exc:  # noqa: BLE001
        log.error("Compiled the rules but could not save them: %s", exc)


def _connect(settings: Settings) -> tuple[dict[str, GmailClient], list[str]]:
    """Open every mailbox. Returns what opened, and why the rest did not.

    The reasons are returned rather than only logged because "no mailboxes
    reachable" on its own does not tell you whether a token expired, a
    secret was deleted, or the service account lost its grant -- and those
    want completely different fixes.
    """
    clients: dict[str, GmailClient] = {}
    failures: list[str] = []
    for account in settings.accounts:
        try:
            clients[account.key] = GmailClient(
                account.key, account.email, settings.project, account.secret_name
            )
            log.info("Connected: %s (%s)", account.key, account.email)
        except Exception as exc:
            reason = f"{account.key} ({account.email}): {type(exc).__name__}: {exc}"
            log.error("Could not connect %s", reason)
            failures.append(reason)
    return clients, failures


def _connect_or_fail(settings: Settings) -> dict[str, GmailClient]:
    """Connect, and raise something readable if nothing opened at all."""
    clients, failures = _connect(settings)
    if not clients:
        raise AgentError(
            "no mailboxes could be opened -- " + " | ".join(failures or ["no accounts configured"])
        )
    return clients


def _token_days_left(clients: dict[str, GmailClient]) -> float | None:
    """Days until the soonest-expiring mailbox token dies, if that is close.

    None when nothing is close, or when the tokens predate authorize.py
    stamping them -- an unstamped token is not evidence of a healthy one, but
    guessing a countdown from no data would be worse than saying nothing.
    """
    ages = [c.token_age_days for c in clients.values() if c.token_age_days is not None]
    if not ages:
        return None
    left = gmail_mod.TOKEN_LIFETIME_DAYS - max(ages)
    if max(ages) < gmail_mod.TOKEN_WARN_AFTER_DAYS:
        return None
    return left


def _collect(
    clients: dict[str, GmailClient], query: str, settings: Settings
) -> tuple[list[Message], list[str]]:
    """Run one search across every connected account."""
    scan = settings.section("scan")
    limit = int(scan.get("max_messages_per_run", 250))
    body_chars = int(scan.get("body_chars", 1800))

    # Everything the agent sends lands back in the inbox it reads. Dropped
    # here, once, so no later stage has to remember: not classified, not
    # starred, not alerted on, not filed as an opportunity, not binned.
    own = {a.email for a in settings.accounts} | {settings.report_to}

    messages: list[Message] = []
    errors: list[str] = []
    skipped = 0
    for key, client in clients.items():
        try:
            ids = client.search_ids(query, limit)
            for message in client.fetch(ids, body_chars):
                if policy_mod.is_own_mail(message, own):
                    skipped += 1
                    continue
                messages.append(message)
        except Exception as exc:
            msg = f"{key}: could not read mail ({exc})"
            log.error(msg)
            errors.append(msg)
    if skipped:
        log.info("Ignored %d of the agent's own reports.", skipped)
    return messages, errors


def _apply_stars(
    messages: list[Message],
    labels: dict[str, Label],
    clients: dict[str, GmailClient],
    settings: Settings,
    state: State | None = None,
) -> list[report_mod.Item]:
    """Star anything the rules flag, once and only once.

    The rules used to be re-evaluated from scratch on every run, so a message
    you unstarred by hand was starred again within the next fifteen minutes --
    for as long as it stayed inside the scan window. The agent had no way to
    tell "not starred yet" from "starred, and you took it off", because it
    kept no record of having acted.

    It does now, and the record is what is consulted rather than the flag in
    Gmail: reading the flag back would answer "is it starred", when the
    question is "have we already had our say". Your unstar is the last word.
    """
    star_cfg = settings.section("star")
    if not star_cfg.get("enabled", False):
        return []

    cap = int(star_cfg.get("max_stars_per_run", 50))
    label_name = star_cfg.get("also_label")
    starred: list[report_mod.Item] = []
    skipped = 0

    for msg in messages:
        if len(starred) >= cap:
            log.info("Hit the per-run star cap of %d.", cap)
            break
        if state is not None and state.already_starred(msg.id):
            skipped += 1
            continue
        label = labels.get(msg.id) or Label.safe_default(msg.id)
        verdict = policy_mod.star_verdict(msg, label, settings.policy)
        if not verdict.allowed:
            continue
        reason = verdict.reasons[-1] if verdict.reasons else ""
        if settings.dry_run:
            log.info("[dry-run] would star %s: %s", msg.subject[:60], reason)
        else:
            client = clients.get(msg.account)
            if not client or not client.star(msg.id, label_name):
                continue
        starred.append(report_mod.Item(msg, label, starred=True, star_reason=reason))

    if state is not None and starred:
        state.mark_starred([i.message.id for i in starred])
    if skipped:
        log.info("Left %d alone; already starred once.", skipped)
    log.info("Starred %d messages.", len(starred))
    return starred


def _update_career(
    messages: list[Message],
    labels: dict[str, Label],
    clients: dict[str, GmailClient],
    settings: Settings,
) -> tuple[int, list[dict]]:
    career_cfg = settings.section("career")
    if not career_cfg.get("enabled", False):
        return 0, []

    feed = career_mod.CareerFeed(
        settings.state_bucket, career_cfg.get("feed_object", "career/opportunities.json")
    ).load()

    entries = []
    gmail_label = career_cfg.get("label")
    for msg in messages:
        label = labels.get(msg.id) or Label.safe_default(msg.id)
        if not policy_mod.career_verdict(msg, label, settings.policy).allowed:
            continue
        entries.append(career_mod.build_entry(msg, label))
        if gmail_label and not settings.dry_run:
            client = clients.get(msg.account)
            if client:
                client.apply_label(msg.id, gmail_label)

    added = feed.merge(entries)
    dropped = feed.prune(int(career_cfg.get("keep_days", 365)))
    if (added or dropped) and not settings.dry_run:
        feed.save()
    elif added or dropped:
        log.info("[dry-run] would add %d and drop %d career entries.", added, dropped)

    log.info("Career feed: %d new, %d pruned.", added, dropped)
    return added, feed.upcoming()


def _run_queued_actions(
    clients: dict[str, GmailClient], settings: Settings
) -> tuple[int, list[str]]:
    """Perform calendar requests the website queued.

    The console cannot create events itself -- that needs your OAuth token and
    the calendar scope, which live with the job and must not be copied into a
    public web service. So it queues an intent and this performs it.

    Each request is marked terminal before the attempt, so a crash cannot
    leave one to be retried on every sweep forever.
    """
    queued = actions_mod.load(settings.state_bucket)
    if not queued:
        return 0, []

    expired = actions_mod.expire_stale(queued)
    todo = actions_mod.pending(queued)
    if not todo and not expired:
        return 0, []

    created, errors = 0, []
    calendar: CalendarClient | None = None

    for action in todo:
        if action.get("kind") != "create_event":
            action["status"] = "failed"
            action["detail"] = f"unknown kind {action.get('kind')!r}"
            continue
        if settings.dry_run:
            action["status"] = "failed"
            action["detail"] = "agent is in dry run; nothing was scheduled"
            continue
        try:
            if calendar is None:
                calendar = CalendarClient(
                    settings.project, settings.primary.secret_name, settings.timezone
                )
                calendar.ensure_calendar()
            spec = EventSpec(
                title=action["title"],
                start=action["start"],
                end=action.get("end", ""),
                all_day=bool(action.get("all_day", True)),
                source_url=action.get("source_url", ""),
            )
            calendar.create_event(spec)
            action["status"] = "done"
            created += 1
        except Exception as exc:  # noqa: BLE001 -- reported back to the page
            action["status"] = "failed"
            action["detail"] = str(exc)[:300]
            errors.append(f"calendar: {exc}")
        action["finished_ts"] = time.time()

    try:
        actions_mod.save(settings.state_bucket, queued)
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not write back the action queue: %s", exc)

    if created or expired:
        log.info("Queued actions: %d created, %d expired.", created, expired)
    return created, errors


def _resolve_calendar_replies(
    clients: dict[str, GmailClient], settings: Settings, state: State
) -> tuple[int, list[str]]:
    """Act on replies to earlier calendar proposals.

    The whole write path lives here, and every step of it is deterministic:
    fetch the reply you typed, parse it with a fixed grammar, create exactly
    the events you numbered. No model is consulted at any point.
    """
    cal_cfg = settings.section("calendar")
    if not cal_cfg.get("enabled", False):
        return 0, []

    expiry = float(cal_cfg.get("proposal_expiry_hours", 72))
    batches = state.open_batches(expiry)
    if not batches:
        return 0, []

    primary = clients.get(settings.primary.key)
    if not primary:
        return 0, ["calendar: primary mailbox unavailable"]

    errors: list[str] = []
    created_total = 0

    calendar: CalendarClient | None = None
    for raw_batch in batches:
        batch = proposals_mod.ProposalBatch(**raw_batch)
        body = proposals_mod.find_reply(primary, batch)
        if body is None:
            continue  # still waiting

        items = batch.proposals()
        valid = {p.n for p in items}
        decision = proposals_mod.parse_reply(body, valid)

        if not decision.understood:
            log.info("Reply to batch %s could not be parsed; leaving it open.", batch.token)
            errors.append(
                "Could not read your calendar reply. Use e.g. 'track 1 3', "
                "'track all' or 'none'."
            )
            state.resolve_batch(batch.token)
            continue

        chosen = [p for p in items if p.n in decision.track]
        skipped = len(items) - len(chosen)

        created: list[tuple[Any, str]] = []
        if chosen:
            if calendar is None:
                try:
                    calendar = CalendarClient(
                        settings.project, settings.primary.secret_name, settings.timezone
                    )
                except Exception as exc:
                    errors.append(f"calendar unavailable: {exc}")
                    state.resolve_batch(batch.token)
                    continue
                if not calendar.has_scope():
                    errors.append(
                        "The primary token has no calendar permission. Re-run "
                        "setup/authorize.py for the primary account."
                    )
                    state.resolve_batch(batch.token)
                    continue

            for proposal in chosen:
                if settings.dry_run:
                    log.info("[dry-run] would create event %r on %s", proposal.title, proposal.start)
                    created.append((proposal, ""))
                    continue
                link = calendar.create_event(proposal.to_event())
                if link is not None:
                    created.append((proposal, link))
                else:
                    errors.append(f"could not create event: {proposal.title[:60]}")

        state.resolve_batch(batch.token)
        created_total += len(created)
        state.count_events(len(created))

        subject, html = report_mod.render_confirmation(created, skipped, _now(settings))
        _deliver(primary, settings, "confirmation", subject, html)

    state.prune_batches(expiry)
    return created_total, errors


def _run_cleanup(
    clients: dict[str, GmailClient],
    settings: Settings,
    classifier: Classifier,
    *,
    force_preview: bool = False,
) -> tuple[list[tuple[Message, str]], list[tuple[Message, str]], list[str]]:
    """Returns (trashed, would_trash, errors).

    `force_preview` makes this pass read-only regardless of configuration. It
    exists so the site's "Show me what it would bin" button cannot bin: a
    button that promises a preview must not be one switch away from deleting
    a hundred emails, and the switch it depended on is exactly the sort of
    thing that turns out to be set differently from what the page displays.
    It can only ever make a run safer, never the reverse.
    """
    cleanup_cfg = settings.section("cleanup")
    if not cleanup_cfg.get("enabled", False):
        return [], [], []

    query = policy_mod.build_cleanup_query(settings.policy)
    log.info("Cleanup query: %s", query)

    candidates, errors = _collect(clients, query, settings)
    if not candidates:
        return [], [], errors

    body_chars = int(settings.section("scan").get("body_chars", 1800))
    cap = int(cleanup_cfg.get("max_trash_per_run", 100))
    dry = settings.cleanup_dry_run or force_preview
    quarantine = cleanup_cfg.get("quarantine_label")

    # Screen on metadata before spending anything on the model. trash_verdict
    # makes all of these checks too, so whatever drops out here was going to
    # be kept regardless -- see policy.may_be_trashable.
    screened = [m for m in candidates if policy_mod.may_be_trashable(m, settings.policy)]
    log.info(
        "Cleanup: %d candidates, %d still eligible after the metadata screen.",
        len(candidates),
        len(screened),
    )

    trashed: list[tuple[Message, str]] = []
    would: list[tuple[Message, str]] = []
    hit_cap = False

    # Classify a chunk at a time and stop once the cap is reached, rather than
    # classifying everything upfront. The cap applies to the verdict, so on a
    # large mailbox the old order paid for hundreds of classifications whose
    # results were then thrown away -- enough to push the digest past its
    # 15-minute task timeout, get killed, retry, and get killed again.
    chunk = max(1, classifier.batch_size)
    for start in range(0, len(screened), chunk):
        if hit_cap:
            break
        block = screened[start : start + chunk]
        labels = classifier.classify(block, body_chars)

        for msg in block:
            if len(trashed) + len(would) >= cap:
                hit_cap = True
                break

            client = clients.get(msg.account)
            if not client:
                continue

            label = labels.get(msg.id) or Label.safe_default(msg.id)
            verdict = policy_mod.trash_verdict(msg, label, settings.policy, client.thread_has_sent)
            if not verdict.allowed:
                log.debug(
                    "Keeping %s: %s",
                    msg.subject[:50],
                    verdict.reasons[-1] if verdict.reasons else "",
                )
                continue

            reason = verdict.reasons[-1] if verdict.reasons else "matched cleanup rules"
            if dry:
                would.append((msg, reason))
                continue

            ok = client.apply_label(msg.id, quarantine) if quarantine else client.trash(msg.id)
            if ok:
                trashed.append((msg, reason))

    if hit_cap:
        log.info("Hit the per-run cleanup cap of %d; stopped there.", cap)
    log.info("Cleanup: %d trashed, %d would-trash (dry_run=%s).", len(trashed), len(would), dry)
    return trashed, would, errors


# --------------------------------------------------------------------------
# Modes
# --------------------------------------------------------------------------


def run_sweep(settings: Settings) -> int:
    _recompile_rules_if_due(settings)
    settings = load_settings()
    state = State(settings.state_bucket).load()
    clients = _connect_or_fail(settings)

    # Replies are checked here too, not only on the digest, so confirming a
    # calendar item takes minutes rather than waiting for the next digest.
    events_made, _ = _resolve_calendar_replies(clients, settings, state)
    if events_made:
        log.info("Created %d calendar events from your reply.", events_made)
    queued_made, _ = _run_queued_actions(clients, settings)
    if queued_made:
        log.info("Created %d calendar events queued from the website.", queued_made)

    hours = int(settings.section("scan").get("sweep_window_hours", 6))
    messages, errors = _collect(clients, f"in:inbox newer_than:{hours}h -in:chats", settings)

    fresh = [m for m in messages if not state.already_alerted(m.id)]
    if not fresh:
        log.info("Nothing new since the last sweep.")
        state.save()
        return 0

    classifier = Classifier(
        settings.project,
        settings.vertex_location,
        settings.gemini_model,
        instructions=settings.instructions,
    )
    labels = classifier.classify(fresh, int(settings.section("scan").get("body_chars", 1800)))

    _apply_stars(fresh, labels, clients, settings, state)
    _update_career(fresh, labels, clients, settings)

    urgent: list[report_mod.Item] = []
    for msg in fresh:
        label = labels.get(msg.id) or Label.safe_default(msg.id)
        if policy_mod.urgent_verdict(msg, label, settings.policy).allowed:
            urgent.append(report_mod.Item(msg, label))

    if not urgent:
        log.info("Nothing urgent among %d new messages.", len(fresh))
        state.save()
        return 0

    gap = float(settings.section("urgent").get("min_minutes_between_alerts", 30)) * 60
    if state.seconds_since_last_alert() < gap:
        log.info("Holding %d urgent items; last alert was too recent.", len(urgent))
        state.save()
        return 0

    subject, body = report_mod.render_alert(urgent, _now(settings))
    primary = clients.get(settings.primary.key)
    sent, _ = _deliver(primary, settings, "alert", subject, body)
    if sent:
        state.mark_alerted([i.message.id for i in urgent])

    if not state.save():
        raise RuntimeError(STATE_LOST)
    if errors:
        log.warning("Finished with %d errors.", len(errors))
    return 0


def run_cleanup_only(settings: Settings, *, preview: bool = False) -> int:
    """Cleanup on its own, and -- unlike before -- it tells you what it found.

    This is what the site's "Show me what it would bin" button runs. It used
    to write its findings to the log and return, so the one button whose whole
    purpose is to show you something showed you nothing unless you went to
    Cloud Logging to look. An empty result still sends: "nothing matched" is
    an answer, and silence is indistinguishable from a button that is broken.
    """
    _recompile_rules_if_due(settings)
    settings = load_settings()
    state = State(settings.state_bucket).load()

    clients = _connect_or_fail(settings)

    classifier = Classifier(
        settings.project,
        settings.vertex_location,
        settings.gemini_model,
        instructions=settings.instructions,
    )
    trashed, would, errors = _run_cleanup(
        clients, settings, classifier, force_preview=preview
    )
    dry = settings.cleanup_dry_run or preview

    # Only a run that actually binned things counts as the day's cleanup. A
    # preview must not satisfy the 20-hour gap, or clicking the preview button
    # would quietly cancel the real sweep.
    if not dry:
        state.mark_cleanup_ran(len(trashed))
        state.save()

    subject, html = report_mod.render_cleanup(
        trashed, would, _now(settings), dry_run=dry, errors=errors
    )
    _deliver(clients.get(settings.primary.key), settings, "cleanup", subject, html)
    log.info("Cleanup: %d binned, %d previewed.", len(trashed), len(would))
    return 0


def run_digest(
    settings: Settings, *, force_cleanup: bool = False, manual: bool = False
) -> int:
    _recompile_rules_if_due(settings)
    # Reload so this run acts on the rules it just compiled rather than
    # waiting for the next one.
    settings = load_settings()
    state = State(settings.state_bucket).load()
    clients = _connect_or_fail(settings)

    days = int(settings.section("scan").get("attention_window_days", 3))
    messages, errors = _collect(clients, f"in:inbox newer_than:{days}d -in:chats", settings)

    classifier = Classifier(
        settings.project,
        settings.vertex_location,
        settings.gemini_model,
        instructions=settings.instructions,
    )
    labels = classifier.classify(
        messages, int(settings.section("scan").get("body_chars", 1800))
    )

    starred = _apply_stars(messages, labels, clients, settings, state)
    career_new, career_upcoming = _update_career(messages, labels, clients, settings)

    # Act on any reply to a previous digest before proposing a new batch, so
    # the numbering never overlaps between two open batches.
    events_made, cal_errors = _resolve_calendar_replies(clients, settings, state)
    errors.extend(cal_errors)
    queued_made, queued_errors = _run_queued_actions(clients, settings)
    events_made += queued_made
    errors.extend(queued_errors)

    proposals = proposals_mod.build_proposals(messages, labels, settings.policy)
    batch = proposals_mod.ProposalBatch.new(proposals) if proposals else None

    # Cleanup runs once a day, on whichever digest fires first after the gap.
    trashed: list[tuple[Message, str]] = []
    would: list[tuple[Message, str]] = []
    if force_cleanup or state.seconds_since_last_cleanup() > 20 * 3600:
        trashed, would, cleanup_errors = _run_cleanup(clients, settings, classifier)
        errors.extend(cleanup_errors)
        state.mark_cleanup_ran(len(trashed))
    else:
        log.info("Cleanup already ran today; skipping.")

    # Anything already covered by an earlier digest is not listed again. The
    # scan window is three days and digests run four times a day, so without
    # this every message appears in up to twelve consecutive summaries -- the
    # dedup state was being written and never read.
    #
    # Dropping them outright would be worse than repeating, though: an
    # unanswered deadline would be mentioned once and then go quiet. So a
    # previously-reported message reappears only while it still wants
    # something, and then only as a one-line reminder.
    report_cfg = settings.section("report")
    repeat = str(report_cfg.get("repeat_reported", "open_only"))

    def still_open(msg: Message) -> bool:
        label = labels.get(msg.id) or Label.safe_default(msg.id)
        return bool(label.needs_action or label.needs_reply)

    if repeat == "always":
        fresh, carried_msgs = messages, []
    else:
        fresh = [m for m in messages if not state.already_reported(m.id)]
        seen = [m for m in messages if state.already_reported(m.id)]
        carried_msgs = [m for m in seen if still_open(m)] if repeat == "open_only" else []

    log.info(
        "Digest: %d new, %d carried over, %d already handled.",
        len(fresh), len(carried_msgs), len(messages) - len(fresh) - len(carried_msgs),
    )

    items = [
        report_mod.Item(m, labels.get(m.id) or Label.safe_default(m.id))
        for m in fresh
    ]
    carried = [
        report_mod.Item(m, labels.get(m.id) or Label.safe_default(m.id))
        for m in carried_msgs
    ]
    starred_ids = {i.message.id for i in starred}
    for item in items:
        if item.message.id in starred_ids:
            item.starred = True

    # A digest with no new mail, nothing still open and nothing to confirm is
    # noise. Four of those a day trains you to ignore the ones that matter.
    nothing_to_say = (
        not items and not carried and not proposals and not trashed and not would
    )
    # A scheduled digest with nothing to say stays quiet. One you asked for by
    # pressing a button does not: you are owed an answer to a question you
    # just asked, and "all clear" is an answer. Staying silent here is what
    # makes a working button look broken -- and now that repeats are filtered,
    # a manual digest with nothing new is the common case, not the rare one.
    if nothing_to_say and report_cfg.get("skip_if_empty", True) and not manual:
        log.info("Nothing new since the last digest; not sending.")
        state.save()
        return 0

    data = report_mod.DigestData(
        items=items,
        carried=carried,
        starred=starred,
        trashed=trashed,
        would_trash=would,
        career_new=career_new,
        career_upcoming=career_upcoming,
        proposals=proposals,
        proposal_token=batch.token if batch else "",
        dry_run=settings.cleanup_dry_run,
        errors=errors,
        scanned=len(messages),
        token_days_left=_token_days_left(clients),
    )

    subject, body = report_mod.render_digest(data, settings.policy, _now(settings))
    primary = clients.get(settings.primary.key)
    if not primary:
        log.error("Primary account is not connected; cannot send the report.")
        return 1

    if settings.dry_run:
        log.info("[dry-run] would send %r to %s", subject, settings.report_to)
        if proposals:
            log.info("[dry-run] %d calendar proposals withheld", len(proposals))
        archive_mod.save_report(
            settings.state_bucket, mode="digest", subject=subject, html=body, sent=False
        )
    else:
        sent = primary.send_html(settings.report_to, subject, body, kind="digest")
        archive_mod.save_report(
            settings.state_bucket, mode="digest", subject=subject, html=body, sent=bool(sent)
        )
        if sent:
            state.mark_digest_sent()
            state.mark_reported([m.id for m in messages])
            # Only record the batch once the mail carrying it actually went
            # out, otherwise we would wait forever for a reply to nothing.
            if batch:
                batch.sent_message_id = sent["id"]
                batch.thread_id = sent["threadId"]
                state.put_batch(vars(batch))
                log.info("Awaiting a reply on %d calendar proposals.", len(proposals))

    log.info("Digest done. %d events created this run.", events_made)
    # Raised, not logged. A digest whose state write is lost repeats every
    # message next time and forgets the calendar items it just proposed, and
    # that is worth failing the run over -- a failure shows up on the website,
    # a warning in Cloud Logging does not.
    if not state.save():
        raise RuntimeError(STATE_LOST)
    return 0


def run_review(settings: Settings) -> int:
    """Read the whole inbox once and mail back a stocktake.

    Read-only by construction, not by configuration. It never calls the star,
    trash, career or calendar paths at all, so no switch can make a review
    act -- which matters because this is the one mode that touches mail from
    years ago, where a misjudgement is least recoverable and least expected.
    """
    cfg = settings.section("review")
    if not cfg.get("enabled", True):
        log.info("Review mode is disabled in config.yaml.")
        return 0

    clients = _connect_or_fail(settings)

    query = str(cfg.get("query", "in:inbox -in:chats"))
    cap = int(cfg.get("max_messages_per_account", 300))
    body_chars = int(settings.section("scan").get("body_chars", 1800))

    messages: list[Message] = []
    errors: list[str] = []
    per_account: dict[str, int] = {}
    available = 0

    for key, client in clients.items():
        try:
            # Ask for more than the cap purely to learn the true size, so the
            # report can say "300 of 4,812" instead of implying it read it all.
            ids = client.search_ids(query, max(cap * 4, cap))
            available += len(ids)
            taken = ids[:cap]
            fetched = client.fetch(taken, body_chars)
            messages.extend(fetched)
            per_account[key] = len(fetched)
            log.info("[%s] reviewing %d of %d matching messages.", key, len(fetched), len(ids))
        except Exception as exc:
            msg = f"{key}: could not read mail ({exc})"
            log.error(msg)
            errors.append(msg)

    if not messages:
        # Still sends. A review is always something you asked for by hand, and
        # "your inbox is empty" is a result, not a reason to say nothing.
        log.info("Nothing matched %r.", query)
        subject, body = report_mod.render_review(
            [], _now(settings), scanned=0, available=available,
            per_account=per_account, errors=errors,
        )
        _deliver(clients.get(settings.primary.key), settings, "review", subject, body)
        return 0

    classifier = Classifier(
        settings.project,
        settings.vertex_location,
        settings.gemini_model,
        batch_size=int(cfg.get("batch_size", 25)),
        instructions=settings.instructions,
    )
    log.info("Classifying %d messages in batches of %d.", len(messages), classifier.batch_size)
    labels = classifier.classify(messages, body_chars)

    items = [
        report_mod.Item(m, labels.get(m.id) or Label.safe_default(m.id)) for m in messages
    ]
    subject, body = report_mod.render_review(
        items,
        _now(settings),
        scanned=len(messages),
        available=available,
        per_account=per_account,
        errors=errors,
    )

    primary = clients.get(settings.primary.key)
    if not primary:
        log.error("Primary account is not connected; cannot send the review.")
        return 1

    sent, _ = _deliver(primary, settings, "review", subject, body)
    if sent:
        log.info("Review sent to %s.", settings.report_to)

    log.info("Review done: %d read of %d available.", len(messages), available)
    return 0


def run_check(settings: Settings) -> int:
    """Verify wiring without touching anything.

    Every failure is collected rather than returned as a bare exit code, so
    the one mode whose entire job is to tell you what is wrong actually
    says what is wrong -- on the website, not only in Cloud Logging.
    """
    problems: list[str] = []
    log.info("Project=%s region=%s bucket=%s", settings.project, settings.region, settings.state_bucket)
    log.info("Global DRY_RUN=%s, cleanup dry run=%s", settings.dry_run, settings.cleanup_dry_run)

    try:
        State(settings.state_bucket).load()
        log.info("State bucket reachable.")
    except Exception as exc:
        log.error("State bucket unreachable: %s", exc)
        problems.append(f"state bucket {settings.state_bucket}: {type(exc).__name__}: {exc}")

    clients, connect_failures = _connect(settings)
    problems.extend(connect_failures)
    for account in settings.accounts:
        client = clients.get(account.key)
        if not client:
            continue
        try:
            profile = client.service.users().getProfile(userId="me").execute()
            log.info(
                "  %s -> %s, %s messages total",
                account.key,
                profile.get("emailAddress"),
                profile.get("messagesTotal"),
            )
            if profile.get("emailAddress", "").lower() != account.email.lower():
                log.warning(
                    "  config says %s but the token belongs to %s",
                    account.email,
                    profile.get("emailAddress"),
                )
        except Exception as exc:
            log.error("  %s profile read failed: %s", account.key, exc)
            problems.append(f"{account.key} profile read: {type(exc).__name__}: {exc}")

    try:
        Classifier(
            settings.project,
            settings.vertex_location,
            settings.gemini_model,
            instructions=settings.instructions,
        )
        log.info("Vertex AI client constructed (model=%s).", settings.gemini_model)
    except Exception as exc:
        log.error("Vertex AI unavailable: %s", exc)
        problems.append(f"Vertex AI: {type(exc).__name__}: {exc}")

    log.info("Cleanup query would be: %s", policy_mod.build_cleanup_query(settings.policy))
    if problems:
        log.error("Check FAILED: %d problem(s).", len(problems))
        raise AgentError(" | ".join(problems))
    log.info("Check passed.")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Inbox agent")
    parser.add_argument(
        "--mode",
        default="sweep",
        choices=["sweep", "digest", "review", "cleanup", "check", "site-update"],
    )
    parser.add_argument(
        "--manual",
        action="store_true",
        help="This run was asked for from the site, not by the scheduler. It "
             "always reports back, even when there is nothing to say.",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Force cleanup to be read-only for this run, whatever the "
             "switches say.",
    )
    args = parser.parse_args(argv)

    _setup_logging()
    settings = load_settings()
    log.info(
        "Starting mode=%s%s%s at %s",
        args.mode,
        " (manual)" if args.manual else "",
        " (preview)" if args.preview else "",
        _now(settings).isoformat(),
    )
    started = time.time()

    # The stop switch, checked before anything opens a mailbox. `check` is
    # exempt: it touches nothing and is how you confirm the wiring still works
    # while stopped.
    #
    # The schedules keep firing -- this is a Cloud Run Job and there is nothing
    # here that can unschedule them -- so a paused run starts, finds this, and
    # exits in about a second. That is deliberate: whatever goes wrong with the
    # console, the way back on is a switch on a page, not a redeploy.
    if settings.paused and args.mode != "check":
        log.warning("Stopped from the website; not reading any mail.")
        archive_mod.log_run(
            settings.state_bucket, mode=args.mode, ok=True,
            detail="stopped from the website", started_ts=started,
        )
        return 0

    try:
        code = _dispatch(args.mode, settings, manual=args.manual, preview=args.preview)
    except AgentError as exc:
        # Expected and explained: record the reason and exit non-zero without
        # a traceback, which would add noise and no information. The message
        # is the point -- it is what the website shows under the failed run.
        log.error("%s", exc)
        archive_mod.log_run(
            settings.state_bucket, mode=args.mode, ok=False,
            detail=str(exc), started_ts=started,
        )
        return 1
    except Exception as exc:  # noqa: BLE001 -- logged, then re-raised
        archive_mod.log_run(
            settings.state_bucket, mode=args.mode, ok=False,
            detail=f"{type(exc).__name__}: {exc}", started_ts=started,
        )
        raise
    archive_mod.log_run(
        settings.state_bucket, mode=args.mode, ok=(code == 0),
        detail="" if code == 0 else f"exited {code}", started_ts=started,
    )
    return code


def _dispatch(
    mode: str, settings: Settings, *, manual: bool = False, preview: bool = False
) -> int:
    if mode == "check":
        return run_check(settings)
    if mode == "site-update":
        from . import site_update
        return site_update.run(settings)
    if mode == "sweep":
        return run_sweep(settings)
    if mode == "digest":
        return run_digest(settings, manual=manual)
    if mode == "review":
        return run_review(settings)
    if mode == "cleanup":
        return run_cleanup_only(settings, preview=preview)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
