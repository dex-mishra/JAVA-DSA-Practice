# Launch Console MCP server

> **Easiest route: no install at all.** The console serves the same tools over
> HTTP, so you can add it in Claude as a *custom connector* with just a URL:
>
> | Field | Value |
> |---|---|
> | Name | `Launch Console` |
> | Remote MCP server URL | `https://launch-console-3xcyebaaxq-as.a.run.app/mcp` |
> | OAuth client ID / secret | leave blank |
>
> That needs no Python, no virtualenv, and no absolute paths to go stale when
> a folder moves. It also works from claude.ai and your phone, not only from
> the one Mac. Deploy with `MCP_TOKEN=something-long` to move the endpoint to
> `/mcp/<token>` -- a connector can only supply a URL, never a header, so a
> secret in the path is the only protection compatible with it.
>
> The stdio server below remains for local development.

Lets an assistant read and change the same things you can from the website:
placement and MBA progress, goals, the inbox agent's instructions, and the
opportunities it has found in your mail.

It is a thin client over the console's HTTP API, not a second door into the
data. Validation, the topic-id scheme and the limits on what may change all
stay in one place, so an assistant cannot reach anything the page could not.

## Setup

```bash
python3 -m venv mcp/.venv && mcp/.venv/bin/pip install -r mcp/requirements.txt
```

### Claude Code

A committed `.mcp.json` at the repo root already registers this server, so
there is nothing to run — open Claude Code in this directory and restart it.

That file holds **absolute** paths, because neither client resolves relative
ones. If the project folder ever moves, regenerate it:

```bash
python3 -c 'import json,os; r=os.getcwd(); json.dump({"mcpServers":{"launch-console":{"command":r+"/mcp/.venv/bin/python","args":[r+"/mcp/server.py"],"env":{"CONSOLE_URL":"https://launch-console-3xcyebaaxq-as.a.run.app"}}}}, open(".mcp.json","w"), indent=2)'
```

If you do have the `claude` CLI on your PATH, this is the equivalent one-liner
— but it is not installed by the desktop app, so `command not found` there is
expected rather than a broken setup:

```bash
claude mcp add launch-console --env CONSOLE_URL=https://launch-console-3xcyebaaxq-as.a.run.app -- /ABSOLUTE/PATH/TO/mcp/.venv/bin/python /ABSOLUTE/PATH/TO/mcp/server.py
```

### Claude Desktop

In `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "launch-console": {
      "command": "/ABSOLUTE/PATH/TO/mcp/.venv/bin/python",
      "args": ["/ABSOLUTE/PATH/TO/mcp/server.py"],
      "env": { "CONSOLE_URL": "https://launch-console-3xcyebaaxq-as.a.run.app" }
    }
  }
}
```

Absolute paths in both — neither client resolves relative ones. Add
`CONSOLE_PASSWORD` alongside `CONSOLE_URL` if you have locked the console.

## Tools

| Tool | Does |
|---|---|
| `get_overview` | Rating, rank, topics cleared, window integrity, per-track progress, streak. Best first call. |
| `list_topics` | Placement topics, filtered by `status` (all/todo/done), `track`, or `query`. |
| `set_topics_done` | Tick or untick topics by id. Moves the mastery rating. |
| `list_mba_items` | Every MBA commitment with date, phase, tags, done state. |
| `set_mba_item_done` | Mark one done or not done. |
| `list_goals` | Goals, optionally filtered by status. |
| `create_goal` | Add one. Tagged `source: "ai"`. |
| `update_goal` | Change title, detail, due date or status. |
| `list_opportunities` | Internships and openings the agent extracted from your mail. |
| `get_agent_settings` | The agent's instructions and dry-run switches. |
| `set_agent_instructions` | Replace the instructions. **Replaces, not appends.** |
| `get_agent_status` | Last summary, last alert, mailboxes read, calendar items pending. |
| `run_agent` | Start a `digest`, `review`, `sweep` or `cleanup` run now. |

Goals created through MCP are tagged `source: "ai"`, so it stays obvious later
which ones you wrote and which an assistant added for you.

`set_agent_instructions` replaces the whole text. Call `get_agent_settings`
first if you mean to extend rather than overwrite.

## Checking it works

With the console reachable:

```bash
CONSOLE_URL=https://launch-console-3xcyebaaxq-as.a.run.app mcp/.venv/bin/python mcp/test_server.py
```

It launches the server as a subprocess and speaks MCP to it over stdio,
exactly as an assistant would — which is the only way to catch a server that
imports fine and still fails to serve. It lists the tools, checks each has a
description and a schema, makes every read-only call, and confirms four bad
inputs are refused rather than crashing. Exits non-zero on any failure, so it
works in CI.

Point `CONSOLE_URL` at `http://127.0.0.1:8080` to test against a local
console instead.

## What it cannot do

The console's own limits apply unchanged. Through MCP an assistant cannot
change where your summaries are sent, grant the agent new permissions, alter
the rules deciding what mail may be binned, or make the agent send as any
mailbox but your primary. Those live in the job's code, not behind the API.
