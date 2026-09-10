"""Configuration: policy from config.yaml, wiring from the environment."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

from . import overlay as overlay_mod
from . import rules as rules_mod

_CONFIG_PATH = Path(os.environ.get("CONFIG_PATH", Path(__file__).parent.parent / "config.yaml"))


def _env(name: str, default: str | None = None, *, required: bool = False) -> str:
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value or ""


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Account:
    """One mailbox the agent has access to."""

    key: str
    email: str
    secret_name: str
    # Only the primary account is allowed to send mail.
    can_send: bool = False


@dataclass
class Settings:
    project: str
    region: str
    state_bucket: str
    gemini_model: str
    vertex_location: str
    report_to: str
    timezone: str
    dry_run: bool
    github_repo: str = ""
    github_secret: str = "inbox-agent-github-token"
    accounts: list[Account] = field(default_factory=list)
    policy: dict[str, Any] = field(default_factory=dict)
    # Free text from the console, handed to the classifier as operator
    # guidance. Steers judgement only; policy.py still decides everything
    # with a consequence.
    instructions: str = ""
    # True when the stop switch on the website is on.
    paused: bool = False
    # The compiled form of `instructions`, and whether a recompile is due.
    derived: dict[str, Any] = field(default_factory=dict)
    compile_requested_ts: float = 0.0
    compiled_ts: float = 0.0

    @property
    def primary(self) -> Account:
        return next(a for a in self.accounts if a.can_send)

    def section(self, name: str) -> dict[str, Any]:
        return self.policy.get(name, {}) or {}

    @property
    def cleanup_enabled(self) -> bool:
        return bool(self.section("cleanup").get("enabled", False))

    @property
    def cleanup_dry_run(self) -> bool:
        """Dry run if either the global kill switch or the policy says so."""
        return self.dry_run or bool(self.section("cleanup").get("dry_run", True))


def load_policy(path: Path | None = None) -> dict[str, Any]:
    target = path or _CONFIG_PATH
    with open(target, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def load_settings(policy_path: Path | None = None, *, use_overlay: bool = True) -> Settings:
    policy = load_policy(policy_path)

    primary_email = _env("PRIMARY_EMAIL", required=True)
    college_email = _env("COLLEGE_EMAIL")
    state_bucket = _env("STATE_BUCKET", required=True)

    accounts = [
        Account(
            key="primary",
            email=primary_email,
            secret_name=_env("PRIMARY_SECRET", "inbox-agent-primary-token"),
            can_send=True,
        )
    ]
    if college_email:
        accounts.append(
            Account(
                key="college",
                email=college_email,
                secret_name=_env("COLLEGE_SECRET", "inbox-agent-college-token"),
                can_send=False,
            )
        )

    # Anything the console has changed since the last deploy. Absent or
    # unreadable overlays yield defaults, so this can only ever add.
    over = overlay_mod.load(state_bucket) if use_overlay else dict(overlay_mod.DEFAULTS)

    # Mailboxes connected from the web UI. can_send stays False for every one
    # of them: only the primary sends, and that is fixed at deploy time so a
    # console edit can never redirect where your reports go.
    for extra in over.get("extra_accounts", []):
        if any(a.key == extra["key"] for a in accounts):
            continue
        accounts.append(
            Account(
                key=extra["key"],
                email=extra["email"],
                secret_name=extra["secret_name"],
                can_send=False,
            )
        )

    dry_run = _env_bool("DRY_RUN", True)
    if over.get("dry_run") is not None:
        dry_run = bool(over["dry_run"])

    if over.get("cleanup_dry_run") is not None:
        policy.setdefault("cleanup", {})["dry_run"] = bool(over["cleanup_dry_run"])

    # Rules compiled from the instructions box. Purely additive -- see
    # rules.apply_to_policy, which cannot remove a protection or drop a
    # section however the instructions were worded.
    policy = rules_mod.apply_to_policy(policy, over.get("derived") or {})

    # After the derived rules, not before. Those can only ever *extend* the
    # star lists, so applying the off switch last is what makes it mean off --
    # otherwise a compiled "always star anything from the CDC" would sit in a
    # policy whose enabled flag had already been read.
    if over.get("star_enabled") is not None:
        policy.setdefault("star", {})["enabled"] = bool(over["star_enabled"])

    return Settings(
        project=_env("GCP_PROJECT", required=True),
        region=_env("GCP_REGION", "asia-south1"),
        state_bucket=state_bucket,
        gemini_model=_env("GEMINI_MODEL", "gemini-2.5-flash"),
        vertex_location=_env("VERTEX_LOCATION", _env("GCP_REGION", "asia-south1")),
        report_to=_env("REPORT_TO", primary_email),
        timezone=_env("TIMEZONE", "Asia/Kolkata"),
        dry_run=dry_run,
        github_repo=_env("GITHUB_REPO", ""),
        github_secret=_env("GITHUB_SECRET", "inbox-agent-github-token"),
        accounts=accounts,
        policy=policy,
        paused=bool(over.get("paused", False)),
        instructions=over.get("instructions", ""),
        derived=over.get("derived") or {},
        compile_requested_ts=float(over.get("compile_requested_ts") or 0.0),
        compiled_ts=float(over.get("compiled_ts") or 0.0),
    )
