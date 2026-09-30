# Hosting the Launch Console

> Handing this to an agent to run? Point it at
> [DEPLOY-RUNBOOK.md](DEPLOY-RUNBOOK.md) instead — same deployment, written
> as a procedure, with the credential steps marked as yours rather than its.


Free, permanently, on Cloudflare. Not free-until-credits-run-out — the
tracker's whole workload sits inside limits that do not expire.

## What it costs

| | Free allowance | What this app uses |
|---|---|---|
| Workers requests | 100,000 / day | a few hundred |
| Static assets | unlimited, uncharged | every page load, all 354 DSA files |
| D1 rows read | 5,000,000 / day | a few thousand |
| D1 rows written | 100,000 / day | a few hundred on a heavy day |
| D1 storage | 5 GB | well under 1 MB |

The DSA content — every problem's learnings, all the theory, all 73
templates — is served as static files, which do not count against the
Workers request allowance at all. The Worker only runs for `/api/` calls,
which means only for reading and writing your progress.

No credit card is required for any of this.

## First deploy

You need a Cloudflare account. Everything else is four commands.

```bash
npm install
```

```bash
npx wrangler login
```

Create the database. This prints a `database_id` — paste it into
`wrangler.toml`, replacing `PASTE_DATABASE_ID_HERE`.

```bash
npx wrangler d1 create launch-console
```

Create the tables, then deploy:

```bash
npm run db:init && npm run deploy
```

Wrangler prints the URL it deployed to. That is the site.

## Optional: require a password

The console deploys **open** — anyone with the URL can read and change your
progress. That is how the Cloud Run version shipped too, and with the email
agent retired the worst case is smaller: there are no mail credentials
behind this any more, and nothing here can send anything anywhere.

It is still worth setting, because a domain is not a secret. Every TLS
certificate issued for one is published to public Certificate Transparency
logs, and those are scanned continuously.

```bash
npx wrangler secret put CONSOLE_PASSWORD
```

Nothing else changes. The page asks once and remembers.

## Optional: a custom domain

In the Cloudflare dashboard: **Workers & Pages → launch-console → Settings →
Domains & Routes → Add custom domain**. The certificate is issued
automatically.

## Optional: deploy on every push

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
It needs two repository secrets:

- `CLOUDFLARE_API_TOKEN` — My Profile → API Tokens → Create Token → *Edit
  Cloudflare Workers*
- `CLOUDFLARE_ACCOUNT_ID` — shown in the dashboard sidebar

Without them, `npm run deploy` from your laptop does the same job.

## Day-to-day

```bash
npm run dev
```

Runs the whole thing locally at `http://localhost:8787` against a local
database — a real one, in `.wrangler/`, so writes persist between runs and
nothing you do locally touches production.

If the API starts answering `no such table: doc`, the local database was
re-keyed — which happens the first time you run this after `database_id`
changes in `wrangler.toml`. Recreate the local tables:

```bash
npm run db:init:local
```

That only ever touches `.wrangler/`. Production is unaffected.

```bash
npm run import && npm run deploy
```

After dropping a new phase into `dsa material/`. The importer is idempotent
and reports what changed; it never touches your progress.

## Connecting the MCP server

Point it at the deployed URL in `.mcp.json`:

```json
{
  "mcpServers": {
    "launch-console": {
      "command": "/absolute/path/to/mcp/.venv/bin/python",
      "args": ["/absolute/path/to/mcp/server.py"],
      "env": {
        "CONSOLE_URL": "https://launch-console.<your-subdomain>.workers.dev"
      }
    }
  }
}
```

Add `CONSOLE_PASSWORD` to that `env` block if you set one.

## Moving your data off Google Cloud

If the old bucket is still reachable, the four documents that matter are
`console/progress.json`, `console/dsa_progress.json`,
`console/mba_custom.json` and `console/goals.json`.

```bash
gcloud storage cp gs://<your-bucket>/console/progress.json .
```

Then, with the file in hand:

```bash
curl -X PUT https://<your-worker-url>/api/progress \
  -H 'content-type: application/json' \
  --data-binary @progress.json
```

`progress.json` from the bucket is already `{"version":1,"updated_ts":…,
"data":{…}}`, which is the shape `PUT /api/progress` expects.

For the DSA rows, `dsa_progress.json` holds `{"problems": {id: {...}}}` —
replay each one as a PATCH:

```bash
python3 -c "
import json, subprocess, sys
url = sys.argv[1]
rows = json.load(open('dsa_progress.json'))['problems']
for pid, row in rows.items():
    subprocess.run(['curl','-sS','-X','PATCH',f'{url}/api/dsa/progress/{pid}',
                    '-H','content-type: application/json','-d',json.dumps(row)])
" https://<your-worker-url>
```

If the credits are already gone and the bucket with them, nothing is lost
that the page has not also been caching in `localStorage` on whichever
browser you used last — open the site there and it pushes its cached copy up
on first load.

## What was retired

The email agent: the Cloud Run job, the Gmail OAuth client, the secrets, and
the Agent tab on the site. Its source is still in `inbox-agent/` — nothing
deploys it, and nothing on the site talks to it.

The Opportunities tab used to be filled by that agent. It is now yours to
fill by hand, from the page or through the `add_opportunity` MCP tool.
