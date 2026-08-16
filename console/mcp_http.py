"""MCP over HTTP, served by the console itself.

The stdio server in mcp/ needs a Python interpreter, a virtualenv and two
absolute paths on the machine running Claude -- which broke twice: once
because the desktop app ships no `claude` CLI, once because the project
folder moved. None of that is inherent to MCP; it is inherent to stdio.

This exposes the same tools over HTTP at /mcp, so the console can be added as
a custom connector with nothing but its URL. No local install, no paths to go
stale, and it works from anything that speaks MCP rather than only from the
one Mac.

Transport notes. This implements the request/response half of Streamable
HTTP: JSON-RPC over POST, answered with a single JSON object. The spec
permits that instead of an SSE stream, and every tool here is a short
request/response with nothing to stream. GET is answered with 405, which
tells a client "no server-initiated stream" rather than leaving it hanging.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable

from flask import Blueprint, Response, jsonify, request

log = logging.getLogger("console.mcp")

PROTOCOL_VERSION = "2025-06-18"
SERVER_INFO = {"name": "launch-console", "version": "1.0.0"}

# JSON-RPC error codes used here.
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INTERNAL_ERROR = -32603


def _text(value: Any) -> dict:
    """A tool result. Everything is returned as JSON text, which is what
    assistants read most reliably."""
    body = value if isinstance(value, str) else json.dumps(value, indent=1, default=str)
    return {"content": [{"type": "text", "text": body}], "isError": False}


def _error_text(message: str) -> dict:
    return {"content": [{"type": "text", "text": message}], "isError": True}


def build_tools(d: dict[str, Callable]) -> dict[str, dict]:
    """The tool table. `d` supplies the console's own data functions, so this
    module holds no knowledge of GCS or the curriculum -- it only shapes
    them for MCP."""

    def obj(props: dict, required: list[str] | None = None) -> dict:
        return {
            "type": "object",
            "properties": props,
            "required": required or [],
            "additionalProperties": False,
        }

    S = {"type": "string"}
    B = {"type": "boolean"}
    I = {"type": "integer"}

    return {
        "get_overview": {
            "description": (
                "Where things stand overall: mastery rating and rank, topics cleared, "
                "MBA window integrity, per-track progress, open goals, streak. Best "
                "first call -- enough context to answer most questions without listing."
            ),
            "schema": obj({}),
            "run": lambda a: d["overview"](),
        },
        "list_topics": {
            "description": (
                "Placement topics. status: all|todo|done. track: a track id from "
                "get_overview. query: substring of the topic name."
            ),
            "schema": obj(
                {
                    "status": {**S, "enum": ["all", "todo", "done"]},
                    "track": S,
                    "query": S,
                    "limit": I,
                }
            ),
            "run": lambda a: d["topics"](
                a.get("status", "all"), a.get("track", ""), a.get("query", ""),
                int(a.get("limit", 50)),
            ),
        },
        "set_topics_done": {
            "description": (
                "Tick or untick placement topics by id. Moves the mastery rating, so "
                "only mark what has genuinely been learned."
            ),
            "schema": obj(
                {"topic_ids": {"type": "array", "items": S}, "done": B}, ["topic_ids"]
            ),
            "run": lambda a: d["set_topics"](a.get("topic_ids") or [], bool(a.get("done", True))),
        },
        "list_mba_items": {
            "description": "Every MBA commitment with its date, phase, tags and done state.",
            "schema": obj({}),
            "run": lambda a: d["mba"](),
        },
        "set_mba_item_done": {
            "description": "Mark one MBA commitment done or not done, by id.",
            "schema": obj({"item_id": S, "done": B}, ["item_id"]),
            "run": lambda a: d["set_mba"](a.get("item_id", ""), bool(a.get("done", True))),
        },
        "list_goals": {
            "description": "Goals. Optionally filter by status: open, done or dropped.",
            "schema": obj({"status": {**S, "enum": ["", "open", "done", "dropped"]}}),
            "run": lambda a: d["goals"](a.get("status", "")),
        },
        "create_goal": {
            "description": (
                "Add a goal. due is YYYY-MM-DD or empty. Tagged source='ai' so it "
                "stays clear which goals an assistant added."
            ),
            "schema": obj({"title": S, "detail": S, "due": S}, ["title"]),
            "run": lambda a: d["create_goal"](
                a.get("title", ""), a.get("detail", ""), a.get("due", "")
            ),
        },
        "update_goal": {
            "description": "Change a goal. Only non-empty fields are applied.",
            "schema": obj(
                {
                    "goal_id": S,
                    "title": S,
                    "detail": S,
                    "due": S,
                    "status": {**S, "enum": ["", "open", "done", "dropped"]},
                },
                ["goal_id"],
            ),
            "run": lambda a: d["update_goal"](a.get("goal_id", ""), a),
        },
        "list_opportunities": {
            "description": (
                "Internships and placement openings the inbox agent extracted from "
                "your mail: company, role, deadline, stipend, apply link."
            ),
            "schema": obj({"limit": I}),
            "run": lambda a: d["opportunities"](int(a.get("limit", 25))),
        },
        "get_agent_settings": {
            "description": "The agent's free-text instructions and its two dry-run switches.",
            "schema": obj({}),
            "run": lambda a: d["settings"](),
        },
        "set_agent_instructions": {
            "description": (
                "REPLACE the agent's instructions -- this does not append, so read "
                "get_agent_settings first if you mean to extend them. Steers judgement "
                "only; it cannot widen what the agent is permitted to do."
            ),
            "schema": obj({"instructions": S}, ["instructions"]),
            "run": lambda a: d["set_instructions"](a.get("instructions", "")),
        },
        "get_agent_status": {
            "description": (
                "Agent activity: last summary, last urgent alert, last junk sweep, "
                "mailboxes read, and how many calendar items await confirmation."
            ),
            "schema": obj({}),
            "run": lambda a: d["status"](),
        },
        "list_proposals": {
            "description": "Calendar items the agent proposed and is still waiting on.",
            "schema": obj({}),
            "run": lambda a: d["proposals"](),
        },
        "add_to_calendar": {
            "description": (
                "Queue an event for the agent to create on its next run, within 15 "
                "minutes. start is YYYY-MM-DD or YYYY-MM-DDTHH:MM."
            ),
            "schema": obj({"title": S, "start": S, "end": S, "source_url": S}, ["title", "start"]),
            "run": lambda a: d["add_event"](
                a.get("title", ""), a.get("start", ""), a.get("end", ""), a.get("source_url", "")
            ),
        },
        "run_agent": {
            "description": (
                "Start a run now instead of waiting for the schedule. "
                "digest: last 3 days, emailed, 3-5 min. "
                "review: the WHOLE inbox, one stocktake, 10-20 min. "
                "sweep: last few hours, emails only if urgent. "
                "cleanup: lists what it would bin, bins nothing. "
                "Returns once started; the result arrives by email."
            ),
            "schema": obj(
                {"mode": {**S, "enum": ["digest", "review", "sweep", "cleanup", "check"]}},
                ["mode"],
            ),
            "run": lambda a: d["run_agent"](a.get("mode", "digest")),
        },
    }


def build_blueprint(deps: dict[str, Callable], token: str = "") -> Blueprint:
    """`token`, when set, becomes a required path segment: /mcp/<token>.

    A custom connector can only supply a URL -- it cannot attach a header --
    so a secret in the path is the one form of protection compatible with it.
    Left empty the endpoint is open, matching the rest of this console.
    """
    bp = Blueprint("mcp_http", __name__)
    tools = build_tools(deps)

    def _rpc_error(rpc_id: Any, code: int, message: str):
        return jsonify({"jsonrpc": "2.0", "id": rpc_id, "error": {"code": code, "message": message}})

    def _handle(payload: dict):
        rpc_id = payload.get("id")
        method = payload.get("method")
        params = payload.get("params") or {}

        if method == "initialize":
            asked = params.get("protocolVersion")
            return jsonify(
                {
                    "jsonrpc": "2.0",
                    "id": rpc_id,
                    "result": {
                        "protocolVersion": asked if isinstance(asked, str) else PROTOCOL_VERSION,
                        "capabilities": {"tools": {"listChanged": False}},
                        "serverInfo": SERVER_INFO,
                    },
                }
            )

        # Notifications carry no id and expect no body.
        if method and method.startswith("notifications/"):
            return Response(status=202)

        if method == "ping":
            return jsonify({"jsonrpc": "2.0", "id": rpc_id, "result": {}})

        if method == "tools/list":
            return jsonify(
                {
                    "jsonrpc": "2.0",
                    "id": rpc_id,
                    "result": {
                        "tools": [
                            {
                                "name": name,
                                "description": spec["description"],
                                "inputSchema": spec["schema"],
                            }
                            for name, spec in tools.items()
                        ]
                    },
                }
            )

        if method == "tools/call":
            name = params.get("name")
            args = params.get("arguments") or {}
            spec = tools.get(name)
            if not spec:
                return _rpc_error(rpc_id, METHOD_NOT_FOUND, f"no tool named {name!r}")
            try:
                result = spec["run"](args)
            except Exception as exc:  # noqa: BLE001
                # Reported as a tool error, not a protocol error: the call was
                # well-formed, the work failed, and the assistant can act on that.
                log.exception("MCP tool %s failed", name)
                return jsonify(
                    {"jsonrpc": "2.0", "id": rpc_id,
                     "result": _error_text(f"{type(exc).__name__}: {exc}")}
                )
            return jsonify({"jsonrpc": "2.0", "id": rpc_id, "result": _text(result)})

        return _rpc_error(rpc_id, METHOD_NOT_FOUND, f"unsupported method {method!r}")

    def _guard(supplied: str):
        if token and supplied != token:
            return _rpc_error(None, INVALID_REQUEST, "not found")
        return None

    @bp.post("/mcp")
    @bp.post("/mcp/<path:supplied>")
    def mcp_post(supplied: str = ""):
        blocked = _guard(supplied)
        if blocked is not None:
            return blocked, 404

        payload = request.get_json(silent=True)
        if payload is None:
            return _rpc_error(None, PARSE_ERROR, "body must be JSON"), 400

        # A batch is a list; answer each and drop notification replies.
        if isinstance(payload, list):
            out = []
            for item in payload:
                if not isinstance(item, dict):
                    continue
                resp = _handle(item)
                if resp.status_code != 202:
                    out.append(resp.get_json())
            return jsonify(out) if out else Response(status=202)

        if not isinstance(payload, dict):
            return _rpc_error(None, INVALID_REQUEST, "expected an object"), 400
        return _handle(payload)

    @bp.get("/mcp")
    @bp.get("/mcp/<path:supplied>")
    def mcp_get(supplied: str = ""):
        # No server-initiated stream. Saying so beats leaving a client waiting.
        return (
            jsonify({"error": "This endpoint accepts POST only (no SSE stream)."}),
            405,
            {"Allow": "POST"},
        )

    return bp
