"""Configuration: policy from config.yaml, wiring from the environment."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

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


def load_settings(policy_path: Path | None = None) -> Settings:
    policy = load_policy(policy_path)

    primary_email = _env("PRIMARY_EMAIL", required=True)
    college_email = _env("COLLEGE_EMAIL")

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

    return Settings(
        project=_env("GCP_PROJECT", required=True),
        region=_env("GCP_REGION", "asia-south1"),
        state_bucket=_env("STATE_BUCKET", required=True),
        gemini_model=_env("GEMINI_MODEL", "gemini-2.5-flash"),
        vertex_location=_env("VERTEX_LOCATION", _env("GCP_REGION", "asia-south1")),
        report_to=_env("REPORT_TO", primary_email),
        timezone=_env("TIMEZONE", "Asia/Kolkata"),
        dry_run=_env_bool("DRY_RUN", True),
        github_repo=_env("GITHUB_REPO", ""),
        github_secret=_env("GITHUB_SECRET", "inbox-agent-github-token"),
        accounts=accounts,
        policy=policy,
    )