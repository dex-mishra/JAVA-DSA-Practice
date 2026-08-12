"""Weekly content refresh for the career site.

Gemini, with Google Search grounding, checks whether the dates and facts in
`data/*.json` still hold, and proposes changes. Those changes open a **pull
request**. They never touch `main`.

That is not caution for its own sake. The MBA tracker's entire value is that
it distinguishes a `confirmed` date from a `projected` one, and schedules two
human verification checkpoints to promote between them. A model that quietly
overwrote a confirmed deadline with a scraped guess would destroy exactly the
property the page exists to provide -- and the failure would be invisible until
a door had already shut.

So the rules below are enforced in Python, after generation, and a proposal
that breaks any of them is dropped rather than repaired:

  1. `data/` only. `src/`, `tools/` and the build are untouchable.
  2. Never delete an item. Options that are declined stay visible with live
     dates; that is a deliberate feature of the MBA brief.
  3. Never promote `projected` to `confirmed`. Only a human checkpoint does
     that. The updater may go the other way -- confirmed to needs-verifying.
  4. Never edit an item already tagged `confirmed`, except to add a note.
  5. Every change carries a source URL, or it is dropped.
  6. A bounded number of changes per run. A proposal to rewrite forty items
     is a malfunction, not a research breakthrough.
"""

from __future__ import annotations

import base64
import json
import logging
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from google import genai
from google.genai import types
from google.cloud import secretmanager

from .dates import is_date

log = logging.getLogger(__name__)

API = "https://api.github.com"
DATA_FILES = ("data/mba.json", "data/placement.json")

MAX_CHANGES_PER_RUN = 12

ALLOWED_OPS = {"update_date", "add_note", "flag_verify", "add_item"}


# --------------------------------------------------------------------------
# GitHub
# --------------------------------------------------------------------------


class GitHub:
    def __init__(self, repo: str, token: str):
        self.repo = repo
        self._token = token

    def _call(self, method: str, path: str, body: dict | None = None) -> Any:
        url = path if path.startswith("http") else f"{API}{path}"
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self._token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("X-GitHub-Api-Version", "2022-11-28")
        req.add_header("User-Agent", "inbox-agent-site-updater")
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode()[:400]
            raise RuntimeError(f"GitHub {method} {path} -> {exc.code}: {detail}") from exc

    def default_sha(self, branch: str = "main") -> str:
        return self._call("GET", f"/repos/{self.repo}/git/ref/heads/{branch}")["object"]["sha"]

    def get_file(self, path: str, ref: str = "main") -> tuple[Any, str]:
        """Returns (parsed json, blob sha)."""
        meta = self._call("GET", f"/repos/{self.repo}/contents/{path}?ref={ref}")
        content = base64.b64decode(meta["content"]).decode("utf-8")
        return json.loads(content), meta["sha"]

    def create_branch(self, name: str, from_sha: str) -> None:
        self._call(
            "POST",
            f"/repos/{self.repo}/git/refs",
            {"ref": f"refs/heads/{name}", "sha": from_sha},
        )

    def put_file(self, path: str, content: str, sha: str, branch: str, message: str) -> None:
        self._call(
            "PUT",
            f"/repos/{self.repo}/contents/{path}",
            {
                "message": message,
                "content": base64.b64encode(content.encode()).decode(),
                "sha": sha,
                "branch": branch,
            },
        )

    def open_pr(self, branch: str, title: str, body: str, base: str = "main") -> str:
        pr = self._call(
            "POST",
            f"/repos/{self.repo}/pulls",
            {"title": title, "head": branch, "base": base, "body": body},
        )
        return pr.get("html_url", "")


def load_token(project: str, secret_name: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    path = f"projects/{project}/secrets/{secret_name}/versions/latest"
    return client.access_secret_version(request={"name": path}).payload.data.decode().strip()


# --------------------------------------------------------------------------
# Generation
# --------------------------------------------------------------------------

SYSTEM = """You verify a student's MBA and placement tracker against current public information.

You are checking a JSON dataset of application deadlines and programme facts.
Use search to establish what is true right now. Report only what you can
support with a specific source URL.

The dataset distinguishes three tag states and the distinction is the point:
  - `confirmed`  a date taken from the school's own admissions page
  - `projected`  inferred from last cycle, not yet published
  - `verify`     a task to resolve something genuinely unresolved

Rules you must follow:
  - You may NEVER mark something confirmed. Only the user does that, at a
    scheduled verification checkpoint. If you find a published date for a
    projected item, propose `update_date` and say so in the reason; leave the
    tag alone.
  - If a date you find CONTRADICTS one tagged confirmed, do not change it.
    Propose `flag_verify` so a human looks. Sources go stale and get cached;
    you are not authoritative over the user's own verification.
  - Never propose removing anything. Declined options stay listed on purpose.
  - No source URL means no proposal. Do not infer, average or guess a date.
  - If nothing has changed, return an empty list. That is a good outcome and
    the expected one most weeks.

Return JSON only:
{"changes":[{"op":"update_date|add_note|flag_verify|add_item",
             "file":"data/mba.json","id":"p4i","field":"date",
             "value":"2027-04-22","reason":"...","source":"https://..."}]}

For `add_item` supply `value` as an object with task, note, date and tags, and
put the phase name in `field`. New items must be genuinely new opportunities
with a published deadline, not restatements of existing ones."""


@dataclass
class Change:
    op: str
    file: str
    id: str
    field: str
    value: Any
    reason: str
    source: str


def _extract_json(text: str) -> dict | None:
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        pass
    match = re.search(r"\{.*\}", text or "", re.S)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except ValueError:
        return None


def propose(client: genai.Client, model: str, mba: dict, placement: dict) -> list[Change]:
    """Ask for changes. Grounding and structured output do not combine on all
    model versions, so this parses leniently and validates strictly after."""
    schools = [
        {"n": s.get("n"), "p": s.get("p")} for s in mba.get("schools", [])
    ]
    dated = []
    for phase in mba.get("phases", []):
        for item in phase.get("items", []):
            if item.get("date"):
                dated.append({
                    "id": item.get("id"), "task": item.get("task"),
                    "date": item.get("date"), "tags": item.get("tags", []),
                    "phase": phase.get("n"),
                })

    prompt = (
        "Today is " + datetime.now(tz=timezone.utc).strftime("%Y-%m-%d") + ".\n\n"
        "Schools tracked:\n" + json.dumps(schools, indent=1) + "\n\n"
        "Dated items to verify:\n" + json.dumps(dated, indent=1) + "\n\n"
        "Check the deferred-MBA deadlines above against what each school "
        "currently publishes for the 2027 entry cycle. Report only genuine "
        "differences, each with a source URL."
    )

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        temperature=0.0,
        tools=[types.Tool(google_search=types.GoogleSearch())],
        max_output_tokens=8192,
    )

    try:
        resp = client.models.generate_content(model=model, contents=prompt, config=config)
        parsed = _extract_json(resp.text)
    except Exception as exc:
        log.error("Grounded generation failed: %s", exc)
        return []

    if not parsed:
        log.warning("Model returned nothing parseable.")
        return []

    out = []
    for row in parsed.get("changes", []) or []:
        if not isinstance(row, dict):
            continue
        out.append(Change(
            op=str(row.get("op", "")),
            file=str(row.get("file", "")),
            id=str(row.get("id", "")),
            field=str(row.get("field", "")),
            value=row.get("value"),
            reason=str(row.get("reason", ""))[:500],
            source=str(row.get("source", ""))[:500],
        ))
    return out


# --------------------------------------------------------------------------
# Validation -- the part that actually protects the data
# --------------------------------------------------------------------------


def _index_mba(mba: dict) -> dict[str, dict]:
    out = {}
    for phase in mba.get("phases", []):
        for item in phase.get("items", []):
            if item.get("id"):
                out[item["id"]] = item
    for item in mba.get("excluded", []):
        if item.get("id"):
            out[item["id"]] = item
    return out


def validate(changes: list[Change], mba: dict) -> tuple[list[Change], list[str]]:
    """Drop anything that breaks the rules. Returns (accepted, rejections)."""
    items = _index_mba(mba)
    accepted: list[Change] = []
    rejected: list[str] = []

    for change in changes:
        def reject(why: str) -> None:
            rejected.append(f"{change.op} {change.id or '(new)'}: {why}")

        if change.op not in ALLOWED_OPS:
            reject(f"unknown operation '{change.op}'")
            continue
        if change.file not in DATA_FILES:
            reject(f"refuses to write outside data/ ({change.file})")
            continue
        if not change.source.lower().startswith("https://"):
            reject("no https source URL")
            continue

        if change.op == "add_item":
            if not isinstance(change.value, dict) or not change.value.get("task"):
                reject("add_item needs an object with a task")
                continue
            date = change.value.get("date")
            if date and not is_date(str(date)):
                reject(f"bad date {date!r}")
                continue
            # New items are never born confirmed.
            tags = [t for t in (change.value.get("tags") or []) if t != "confirmed"]
            if "projected" not in tags:
                tags.append("projected")
            change.value["tags"] = tags
            accepted.append(change)
            continue

        target = items.get(change.id)
        if not target:
            reject("no item with that id")
            continue

        tags = target.get("tags") or []

        if change.op == "update_date":
            if not is_date(str(change.value or "")):
                reject(f"bad date {change.value!r}")
                continue
            if "confirmed" in tags:
                # Downgrade to a flag rather than overwriting a human-verified
                # date. This is the single most important rule here.
                rejected.append(
                    f"update_date {change.id}: item is confirmed; converted to a verify flag"
                )
                accepted.append(Change(
                    op="flag_verify", file=change.file, id=change.id, field="tags",
                    value="verify",
                    reason=f"Source suggests {change.value}, which differs from the "
                           f"confirmed {target.get('date')}. Needs a human check. "
                           + change.reason,
                    source=change.source,
                ))
                continue
            if str(change.value) == str(target.get("date")):
                reject("date unchanged")
                continue
            accepted.append(change)
            continue

        if change.op == "add_note":
            if not isinstance(change.value, str) or len(change.value) < 5:
                reject("note too short")
                continue
            accepted.append(change)
            continue

        if change.op == "flag_verify":
            if "verify" in tags:
                reject("already flagged")
                continue
            accepted.append(change)

    if len(accepted) > MAX_CHANGES_PER_RUN:
        rejected.append(
            f"capped at {MAX_CHANGES_PER_RUN}; {len(accepted) - MAX_CHANGES_PER_RUN} dropped"
        )
        accepted = accepted[:MAX_CHANGES_PER_RUN]

    return accepted, rejected


def apply_changes(mba: dict, changes: list[Change]) -> int:
    """Mutate the document in memory. Never deletes."""
    items = _index_mba(mba)
    stamp = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
    applied = 0

    for change in changes:
        if change.op == "add_item":
            phase = next(
                (p for p in mba.get("phases", []) if p.get("n") == change.field), None
            )
            if phase is None:
                continue
            new = dict(change.value)
            new.setdefault("id", f"auto{abs(hash(new.get('task', ''))) % 100000}")
            new["note"] = (new.get("note", "") + f"\n\n[Added automatically {stamp}. "
                           f"Source: {change.source}]").strip()
            phase.setdefault("items", []).append(new)
            applied += 1
            continue

        target = items.get(change.id)
        if not target:
            continue

        if change.op == "update_date":
            old = target.get("date")
            target["date"] = change.value
            target["note"] = (target.get("note", "") +
                              f"\n\n[Date changed automatically {stamp}: {old} -> "
                              f"{change.value}. {change.reason} Source: {change.source}]").strip()
            applied += 1
        elif change.op == "add_note":
            target["note"] = (target.get("note", "") +
                              f"\n\n[{stamp}] {change.value} Source: {change.source}").strip()
            applied += 1
        elif change.op == "flag_verify":
            tags = target.setdefault("tags", [])
            if "verify" not in tags:
                tags.append("verify")
            target["note"] = (target.get("note", "") +
                              f"\n\n[Flagged for verification {stamp}] {change.reason} "
                              f"Source: {change.source}").strip()
            applied += 1

    return applied


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------


def run(settings) -> int:
    repo = getattr(settings, "github_repo", "") or ""
    if not repo:
        log.error("GITHUB_REPO is not set; nothing to update.")
        return 1

    try:
        token = load_token(settings.project, settings.github_secret)
    except Exception as exc:
        log.error("Could not read the GitHub token: %s", exc)
        return 1

    gh = GitHub(repo, token)
    try:
        mba, mba_sha = gh.get_file("data/mba.json")
        placement, _ = gh.get_file("data/placement.json")
    except Exception as exc:
        log.error("Could not read the repo: %s", exc)
        return 1

    client = genai.Client(vertexai=True, project=settings.project, location=settings.vertex_location)
    raw_changes = propose(client, settings.gemini_model, mba, placement)
    log.info("Model proposed %d changes.", len(raw_changes))

    accepted, rejected = validate(raw_changes, mba)
    for note in rejected:
        log.info("  rejected: %s", note)

    if not accepted:
        log.info("Nothing to change. This is the expected weekly outcome.")
        return 0

    applied = apply_changes(mba, accepted)
    if not applied:
        log.info("No change survived application.")
        return 0

    if settings.dry_run:
        log.info("[dry-run] would open a PR with %d changes:", applied)
        for change in accepted:
            log.info("    %s %s -> %r (%s)", change.op, change.id, change.value, change.source)
        return 0

    stamp = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M")
    branch = f"auto/site-update-{stamp}"

    try:
        gh.create_branch(branch, gh.default_sha())
        gh.put_file(
            "data/mba.json",
            json.dumps(mba, indent=1, ensure_ascii=False) + "\n",
            mba_sha,
            branch,
            f"chore(data): automated deadline refresh ({applied} changes)",
        )
        body = _pr_body(accepted, rejected)
        url = gh.open_pr(branch, f"Automated deadline refresh — {applied} change(s)", body)
        log.info("Opened %s", url)
    except Exception as exc:
        log.error("Could not open the PR: %s", exc)
        return 1

    return 0


def _pr_body(accepted: list[Change], rejected: list[str]) -> str:
    lines = [
        "Automated content refresh. **Review every row before merging.**",
        "",
        "Only `data/` is touched. The updater cannot promote a date to "
        "`confirmed`, cannot edit a confirmed item, and cannot delete anything.",
        "",
        "| Op | Item | New value | Source | Why |",
        "|---|---|---|---|---|",
    ]
    for c in accepted:
        value = c.value if not isinstance(c.value, dict) else c.value.get("task", "(new item)")
        lines.append(
            f"| `{c.op}` | `{c.id or 'new'}` | {str(value)[:60]} | "
            f"[link]({c.source}) | {c.reason[:140]} |"
        )
    if rejected:
        lines += ["", "<details><summary>Rejected by the safety rules</summary>", ""]
        lines += [f"- {r}" for r in rejected]
        lines += ["", "</details>"]
    lines += [
        "",
        "---",
        "Dates here are still **projected** unless you verify them yourself. "
        "The two verification checkpoints (1 Dec 2026, 1 Feb 2027) remain the "
        "only thing that promotes a date to confirmed.",
    ]
    return "\n".join(lines)