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
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from . import career as career_mod
from . import policy as policy_mod
from . import proposals as proposals_mod
from . import report as report_mod
from .calendar import CalendarClient
from .classify import Classifier, Label
from .config import Account, Settings, load_settings
from .gmail import GmailClient, Message
from .state import State

log = logging.getLogger("agent")


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


def _connect(settings: Settings) -> dict[str, GmailClient]:
    clients: dict[str, GmailClient] = {}
    for account in settings.accounts:
        try:
            clients[account.key] = GmailClient(
                account.key, account.email, settings.project, account.secret_name
            )
            log.info("Connected: %s (%s)", account.key, account.email)
        except Exception as exc:
            log.error("Could not connect %s (%s): %s", account.key, account.email, exc)
    return clients


def _collect(
    clients: dict[str, GmailClient], query: str, settings: Settings
) -> tuple[list[Message], list[str]]:
    """Run one search across every connected account."""
    scan = settings.section("scan")
    limit = int(scan.get("max_messages_per_run", 250))
    body_chars = int(scan.get("body_chars", 1800))

    messages: list[Message] = []
    errors: list[str] = []
    for key, client in clients.items():
        try:
            ids = client.search_ids(query, limit)
            messages.extend(client.fetch(ids, body_chars))
        except Exception as exc:
            msg = f"{key}: could not read mail ({exc})"
            log.error(msg)
            errors.append(msg)
    return messages, errors


def _apply_stars(
    messages: list[Message],
    labels: dict[str, Label],
    clients: dict[str, GmailClient],
    settings: Settings,
) -> list[report_mod.Item]:
    """Star anything the rules flag. Reversible, so this ignores DRY_RUN's
    cleanup semantics but still respects the global kill switch."""
    star_cfg = settings.section("star")
    if not star_cfg.get("enabled", False):
        return []

    cap = int(star_cfg.get("max_stars_per_run", 50))
    label_name = star_cfg.get("also_label")
    starred: list[report_mod.Item] = []

    for msg in messages:
        if len(starred) >= cap:
            log.info("Hit the per-run star cap of %d.", cap)
            break
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
        if settings.dry_run:
            log.info("[dry-run] would confirm: %s", subject)
        else:
            primary.send_html(settings.report_to, subject, html)

    state.prune_batches(expiry)
    return created_total, errors


def _run_cleanup(
    clients: dict[str, GmailClient], settings: Settings, classifier: Classifier
) -> tuple[list[tuple[Message, str]], list[tuple[Message, str]], list[str]]:
    """Returns (trashed, would_trash, errors)."""
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
    dry = settings.cleanup_dry_run
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
    state = State(settings.state_bucket).load()
    clients = _connect(settings)
    if not clients:
        log.error("No mailboxes reachable; nothing to do.")
        return 1

    # Replies are checked here too, not only on the digest, so confirming a
    # calendar item takes minutes rather than waiting for the next digest.
    events_made, _ = _resolve_calendar_replies(clients, settings, state)
    if events_made:
        log.info("Created %d calendar events from your reply.", events_made)

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

    _apply_stars(fresh, labels, clients, settings)
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
    if primary and not settings.dry_run:
        if primary.send_html(settings.report_to, subject, body):
            state.mark_alerted([i.message.id for i in urgent])
    else:
        log.info("[dry-run] would alert on: %s", [i.message.subject[:50] for i in urgent])

    state.save()
    if errors:
        log.warning("Finished with %d errors.", len(errors))
    return 0


def run_digest(settings: Settings, *, force_cleanup: bool = False) -> int:
    state = State(settings.state_bucket).load()
    clients = _connect(settings)
    if not clients:
        log.error("No mailboxes reachable; nothing to do.")
        return 1

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

    starred = _apply_stars(messages, labels, clients, settings)
    career_new, career_upcoming = _update_career(messages, labels, clients, settings)

    # Act on any reply to a previous digest before proposing a new batch, so
    # the numbering never overlaps between two open batches.
    events_made, cal_errors = _resolve_calendar_replies(clients, settings, state)
    errors.extend(cal_errors)

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

    items = [
        report_mod.Item(m, labels.get(m.id) or Label.safe_default(m.id))
        for m in messages
    ]
    starred_ids = {i.message.id for i in starred}
    for item in items:
        if item.message.id in starred_ids:
            item.starred = True

    data = report_mod.DigestData(
        items=items,
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
    else:
        sent = primary.send_html(settings.report_to, subject, body)
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
    state.save()
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

    clients = _connect(settings)
    if not clients:
        log.error("No mailboxes reachable; nothing to do.")
        return 1

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
        log.info("Nothing matched %r.", query)
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

    if settings.dry_run:
        log.info("[dry-run] would send %r to %s", subject, settings.report_to)
    elif primary.send_html(settings.report_to, subject, body):
        log.info("Review sent to %s.", settings.report_to)

    log.info("Review done: %d read of %d available.", len(messages), available)
    return 0


def run_check(settings: Settings) -> int:
    """Verify wiring without touching anything."""
    ok = True
    log.info("Project=%s region=%s bucket=%s", settings.project, settings.region, settings.state_bucket)
    log.info("Global DRY_RUN=%s, cleanup dry run=%s", settings.dry_run, settings.cleanup_dry_run)

    try:
        State(settings.state_bucket).load()
        log.info("State bucket reachable.")
    except Exception as exc:
        log.error("State bucket unreachable: %s", exc)
        ok = False

    clients = _connect(settings)
    for account in settings.accounts:
        client = clients.get(account.key)
        if not client:
            ok = False
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
            ok = False

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
        ok = False

    log.info("Cleanup query would be: %s", policy_mod.build_cleanup_query(settings.policy))
    log.info("Check %s.", "passed" if ok else "FAILED")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Inbox agent")
    parser.add_argument(
        "--mode",
        default="sweep",
        choices=["sweep", "digest", "review", "cleanup", "check", "site-update"],
    )
    args = parser.parse_args(argv)

    _setup_logging()
    settings = load_settings()
    log.info("Starting mode=%s at %s", args.mode, _now(settings).isoformat())

    if args.mode == "check":
        return run_check(settings)
    if args.mode == "site-update":
        from . import site_update
        return site_update.run(settings)
    if args.mode == "sweep":
        return run_sweep(settings)
    if args.mode == "digest":
        return run_digest(settings)
    if args.mode == "review":
        return run_review(settings)
    if args.mode == "cleanup":
        clients = _connect(settings)
        classifier = Classifier(
            settings.project,
            settings.vertex_location,
            settings.gemini_model,
            instructions=settings.instructions,
        )
        trashed, would, _ = _run_cleanup(clients, settings, classifier)
        log.info("Trashed=%d would_trash=%d", len(trashed), len(would))
        for msg, reason in (would or trashed)[:40]:
            log.info("  %-64s | %s", msg.subject[:64], reason)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
