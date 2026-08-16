"""End-to-end check of the MCP server over the real protocol.

Not a unit test of the tool functions: it launches server.py as a subprocess,
speaks MCP to it over stdio exactly as an assistant would, and calls the
tools. That is the only way to catch a server that imports cleanly and still
fails to serve -- a bad schema, a tool that never registers, a hang on start.

Needs the console running:
    console/.venv/bin/python console/main.py
    CONSOLE_URL=http://127.0.0.1:8080 mcp/.venv/bin/python mcp/test_server.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

HERE = Path(__file__).parent
CONSOLE_URL = os.environ.get("CONSOLE_URL", "http://127.0.0.1:8080")

# Tools that only read. Safe to call against a live console.
READ_ONLY = [
    ("get_overview", {}),
    ("list_topics", {"status": "todo", "limit": 3}),
    ("list_topics", {"query": "segment tree", "limit": 5}),
    ("list_mba_items", {}),
    ("list_goals", {}),
    ("list_opportunities", {"limit": 5}),
    ("get_agent_settings", {}),
    ("get_agent_status", {}),
]


def unwrap(result) -> object:
    """FastMCP returns content blocks; pull the JSON payload back out."""
    if getattr(result, "structuredContent", None):
        return result.structuredContent
    for block in result.content:
        text = getattr(block, "text", None)
        if text:
            try:
                return json.loads(text)
            except ValueError:
                return text
    return None


async def main() -> int:
    params = StdioServerParameters(
        command=sys.executable,
        args=[str(HERE / "server.py")],
        env={**os.environ, "CONSOLE_URL": CONSOLE_URL},
    )

    failures: list[str] = []

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            listed = await session.list_tools()
            names = sorted(t.name for t in listed.tools)
            print(f"tools exposed ({len(names)}):")
            for tool in sorted(listed.tools, key=lambda t: t.name):
                first_line = (tool.description or "").strip().split("\n")[0]
                print(f"  {tool.name:<26} {first_line[:64]}")
                if not tool.description:
                    failures.append(f"{tool.name} has no description")
                if not tool.inputSchema:
                    failures.append(f"{tool.name} has no input schema")

            print("\nread-only calls:")
            for name, args in READ_ONLY:
                payload = unwrap(await session.call_tool(name, args))
                label = f"{name}({', '.join(f'{k}={v!r}' for k, v in args.items())})"
                if isinstance(payload, dict) and "error" in payload:
                    print(f"  FAIL  {label}\n          {payload['error'][:110]}")
                    failures.append(f"{label}: {payload['error'][:110]}")
                else:
                    summary = json.dumps(payload)[:96] if payload is not None else "None"
                    print(f"  ok    {label}\n          {summary}")

            # Rejections must be clean errors, not crashes.
            print("\nbad input is refused:")
            for name, args, expect in [
                ("list_topics", {"status": "nonsense"}, "status must be"),
                ("run_agent", {"mode": "rm -rf"}, "unknown mode"),
                ("set_topics_done", {"topic_ids": []}, "at least one"),
                ("update_goal", {"goal_id": "g_nope"}, "nothing to change"),
            ]:
                payload = unwrap(await session.call_tool(name, args))
                got = payload.get("error", "") if isinstance(payload, dict) else ""
                if expect in got:
                    print(f"  ok    {name} -> {got[:70]}")
                else:
                    print(f"  FAIL  {name} -> expected {expect!r}, got {got[:70]!r}")
                    failures.append(f"{name} did not reject cleanly")

    print()
    if failures:
        print(f"{len(failures)} problem(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"All good: {len(names)} tools, {len(READ_ONLY)} read calls, 4 rejections.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
