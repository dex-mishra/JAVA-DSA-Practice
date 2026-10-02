# Deployment runbook — for an agent

This is the executable counterpart to [DEPLOY.md](DEPLOY.md). That one
explains the hosting to a person; this one is a procedure to follow.

If you are a person, read DEPLOY.md instead — it is shorter.

---

## 0. Read this part first

### What you are deploying

A placement/MBA/DSA tracker. One Cloudflare Worker that does two jobs: it
serves `public/` as static assets, and it answers about a dozen `/api/`
routes backed by a D1 database. There is no container, no VM, nothing
long-running. The 354 DSA content files are static and never invoke the
Worker at all.

It runs inside Cloudflare's permanent free tier. **No payment method is
required at any point.** If you find yourself on a page asking for card
details, you have taken a wrong turn — stop and tell the user.

### The credential boundary — do not cross it

Chrome access lets you navigate and verify. It does not make these yours to
do. **Stop and hand back to the user for all of these:**

| Step | Why it is theirs |
|---|---|
| Creating the Cloudflare account | Account creation, and it needs their email and a password |
| Typing their Cloudflare password | Never type a user's password into anything |
| Clicking **Allow** on the `wrangler login` OAuth screen | Granting OAuth permissions on their account |
| Creating or copying an API token | It is a credential; you should not hold it |
| Choosing the `CONSOLE_PASSWORD` value | It is their password to choose |

You may navigate *to* these pages and say "this is the screen, it is yours
now". You may not complete them.

Everything else — the whole CLI sequence below — is yours to run.

### Where you will actually need Chrome

Less than you might expect. Steps 1–6 are terminal work. Chrome is for:

- the one-time account and OAuth moments above (user-driven)
- registering a `workers.dev` subdomain on a brand-new account (step 4)
- final visual verification (step 7)
- the optional custom domain (step 10)

If the user has already run `wrangler login` or exported
`CLOUDFLARE_API_TOKEN`, you may never open a browser before step 7.

---

## 1. Preflight

Work from the repository root. Confirm you are in the right place and the
tree is clean before changing anything.

```bash
git log --oneline -1 && git status --short
```

Install and prove the code is sound before deploying it:

```bash
npm install && npm test
```

**Expected:** `pass 20`, `fail 0`.

**If tests fail, stop.** Do not deploy and do not "fix" them to get past
this. One of those tests pins the topic-id hash against three ids captured
from a real browser session; if it fails, the deployed API would silently
stop recognising every tick the user has ever made. Report the failure and
wait.

Then build:

```bash
npm run build
```

**Expected:** ends with `public/ 354 files` (the number grows as more DSA
phases are imported — more is fine, zero is not).

---

## 2. Authenticate

Check whether the user is already authenticated:

```bash
npx wrangler whoami
```

**If it prints an email and account, skip to step 3.**

If it says you are not authenticated, there are two routes. Prefer the
first.

### Route A — `wrangler login` (simplest)

```bash
npx wrangler login
```

This opens a Cloudflare page asking to authorise Wrangler.

> **This is the user's click, not yours.** Tell them: "Wrangler has opened a
> Cloudflare authorisation page — please review and click Allow." Wait for
> them to confirm before continuing. Do not click it yourself, and do not
> proceed on the assumption that they did.

Then re-run `npx wrangler whoami` to confirm.

### Route B — API token

Only if Route A is unavailable. Ask the user to create the token
themselves at **My Profile → API Tokens → Create Token → Edit Cloudflare
Workers**, and to export it in the shell you are using:

```
export CLOUDFLARE_API_TOKEN=...
```

Do not create the token for them, and do not echo it back.

### If the user has no Cloudflare account

Stop. Say: "You'll need a free Cloudflare account first —
dash.cloudflare.com/sign-up. No card required. Tell me when you're in."
Do not create it.

---

## 3. Create the database

```bash
npx wrangler d1 create launch-console
```

**Expected:** a TOML block containing `database_id = "..."` (a UUID).

Take that UUID and put it in `wrangler.toml`, replacing the placeholder:

```toml
database_id = "PASTE_DATABASE_ID_HERE"
```

**This value is an identifier, not a secret.** Cloudflare's own docs commit
it. Commit it — do not add it to `.gitignore` or leave it uncommitted.

**If it says the database already exists**, it was created on an earlier
attempt. Get the id with:

```bash
npx wrangler d1 list
```

Create the tables:

```bash
npm run db:init
```

**Expected:** several statements succeed. This is idempotent — every
statement is `CREATE TABLE IF NOT EXISTS` or `CREATE INDEX IF NOT EXISTS`,
so re-running it is safe and is the right move if you are unsure whether it
completed.

---

## 4. Deploy

```bash
npm run deploy
```

**Expected:** an upload summary, the three bindings (`DB`, `ASSETS`,
`CF_HANDLE`), and a URL ending in `.workers.dev`. **Record that URL** — the
rest of the runbook and the MCP config both need it.

Wrangler will say it read a handful more files than the build reported
(359 against 354). That is not a mismatch: it counts the directories it
walks as well as the files in them. Both numbers are correct.

### If it asks you to register a workers.dev subdomain

This happens on an account that has never deployed a Worker. The error
names it directly.

This one you can do in the dashboard: **Workers & Pages → Overview**, and
choose a subdomain. It is a public name, not a credential — but it is
permanent and it becomes part of the user's URL, so **ask them what they
want it to be** rather than picking one. Then re-run `npm run deploy`.

### Other failures

| Error | Meaning | Fix |
|---|---|---|
| `Couldn't find a D1 DB` | `database_id` still says `PASTE_DATABASE_ID_HERE`, or is wrong | Redo step 3 |
| `assets directory ... does not exist` | `public/` was never built | `npm run build` |
| `Authentication error` | Token expired or wrong scope | Back to step 2 |
| `You have exceeded the number of subdomains` | Account already has one | Use it; do not create another |

---

## 5. Verify the API

Set the URL once:

```bash
URL=https://launch-console.<their-subdomain>.workers.dev
```

Run each of these and check the output against the expectation.

```bash
curl -s $URL/healthz
```
→ `ok`

```bash
curl -s $URL/api/progress
```
→ `{"data":{},"updated_ts":0}` on a fresh database.
**Non-zero `updated_ts` means data already exists — do not overwrite it.**

```bash
curl -s "$URL/api/topics?limit=1" | head -c 120
```
→ starts `{"total":1370,` — this proves the curriculum bundled correctly.
A different total means the Worker is serving different data from the page.

```bash
curl -s -o /dev/null -w '%{http_code}\n' $URL/data/dsa/problem/hashing-two-sum.json
```
→ `200`. This is the static path that used to 404 under the old hosting. If
it is 404, the assets did not upload — rebuild and redeploy.

```bash
curl -s $URL/api/overview | head -c 200
```
→ JSON with `mastery`, `mba`, `dsa` and `days_to_day_one`.

### Write round-trip

Prove the database accepts writes, then undo it. Run all three:

```bash
curl -s -X PATCH $URL/api/dsa/progress/hashing-two-sum -H 'content-type: application/json' -d '{"status":"solved","confidence":4}'
```
→ `{"id":"hashing-two-sum","progress":{"status":"solved",...,"confidence":4,...}}`

```bash
curl -s $URL/api/dsa/progress | head -c 120
```
→ the row is present.

```bash
curl -s -X PATCH $URL/api/dsa/progress/hashing-two-sum -H 'content-type: application/json' -d '{"status":"todo","confidence":null,"last_revised":null}'
```
→ back to defaults. Confirm with `curl -s $URL/api/dsa/progress` →
`{"problems":{},"updated_ts":0}`.

**Leave no test data behind.** If the user already had real progress, skip
the round-trip entirely rather than risk touching a real row.

---

## 6. Point the MCP server at the new URL

`.mcp.json` still points at the retired Cloud Run service. Edit the
`CONSOLE_URL` value to the `workers.dev` URL from step 4.

Verify:

```bash
CONSOLE_URL=$URL mcp/.venv/bin/python -c "import sys; sys.path.insert(0,'mcp'); import server; print(server.get_overview())"
```

**Expected:** a dict with `mastery`, `mba`, `dsa` and `days_to_day_one` —
no `error` key. If it reports it could not reach the console, the URL is
wrong.

Ignore the `IncompleteFieldDefinitionWarning` from pydantic on stderr. It
is noise from a dependency, not a problem with the server.

The MCP server's tools only reload when the client restarts, so tell the
user to restart Claude Code for the change to take effect.

---

## 7. Verify in the browser

Now open Chrome. Go to the deployment URL and check:

- [ ] Three top-level sections: **Placement**, **DSA Sheet**, **MBA**. No "Email Agent" — it was retired.
- [ ] Header reads **"Mastery rating · 1,328 topics + 600 problems"**.
- [ ] DSA Sheet → click **"what this teaches you"** on any problem. The panel fills with insight, trick, edge cases, complexity, siblings, follow-ups, template and Striver links. **This is the thing that failed under the old hosting** — if it shows "not reachable from here", the static assets are missing.
- [ ] DSA Sheet → **Theory** → open a topic. Markdown renders, C++ blocks are syntax-highlighted, the copy button works.
- [ ] DSA Sheet → **Templates** → 73 templates listed.
- [ ] Footer says **"synced across your devices"** — not "this browser only". That sentence is the single best indicator the API is reachable; if it reads "this browser only", the page is falling back to localStorage and something in step 5 is actually broken.
- [ ] Check the browser console. Expect zero errors.

Report anything that fails rather than working around it.

---

## 8. Migrate old data — only if asked

Skip unless the user says they have progress in the old Google Cloud
bucket **and** that bucket is still reachable. If the credits are gone the
bucket is likely gone too, in which case: tell them to open the site in the
browser they last used it in, and the cached `localStorage` copy will push
itself up on first load.

The procedure is in [DEPLOY.md](DEPLOY.md) under "Moving your data off
Google Cloud". Two rules:

1. **Check `curl -s $URL/api/progress` first.** If `updated_ts` is non-zero
   there is already data. A `PUT` replaces the whole document. Ask before
   overwriting anything.
2. Run the DSA migration loop **once**. It is a PATCH per problem; running
   it twice is harmless but it is slow, and a half-finished run is better
   resumed than restarted.

---

## 9. Commit

```bash
git add wrangler.toml .mcp.json && git commit -m "chore: point at the deployed Cloudflare Worker"
```

Note the repository has moved to `IsocodeLabs/Aryan-Placement-and-MBA`.
Pushes still work through GitHub's redirect. If you want to update the
remote, ask first — it is the user's call which URL their repo tracks.

---

## 10. Optional — offer these, do not assume

Raise each once. Do not do any of them unprompted.

**Password protection.** The console deploys open: anyone with the URL can
read and change the user's progress. With the email agent retired there are
no mail credentials behind it and nothing can send anything anywhere, so
the worst case is vandalised ticks. Still worth offering, because a domain
is not a secret — TLS certificates are published to public Certificate
Transparency logs and those are scanned continuously.

If they want one, **they** run this and type the value:

```bash
npx wrangler secret put CONSOLE_PASSWORD
```

Then remind them to add the same value as `CONSOLE_PASSWORD` in
`.mcp.json`'s `env` block, or the MCP tools will start returning 401.

**Custom domain.** Dashboard → Workers & Pages → launch-console → Settings
→ Domains & Routes → Add custom domain. Only if they own a domain on this
Cloudflare account.

**Deploy on push.** Via Workers Builds, in the dashboard — see DEPLOY.md.
Connecting it authorises the Cloudflare GitHub App against the repository,
which is an account-level grant and therefore the user's click, not yours.
Do not also add GitHub secrets for a Action: both deploy on push, so having
both means every commit deploys twice.

---

## Report back

When you finish, tell the user:

1. The live URL.
2. Which of step 5's checks passed, and the result of step 7's browser pass.
3. Whether `.mcp.json` was updated — and that **Claude Code must be restarted** for the MCP server to pick it up.
4. Anything you did not do: data not migrated, password not set, anything you were asked to leave.
5. That it is on the free tier with no card attached, and the limits it sits inside: 100k Worker requests/day, 100k D1 writes/day, static assets uncharged. This app uses a few hundred of each on a heavy day.

Do not report success for a step you skipped or could not verify. If
something is broken, say what and where rather than describing the
deployment as complete.

---

## Day-to-day, afterwards

```bash
npm run dev
```
Whole app locally at `localhost:8787` against a real local database in
`.wrangler/`. Writes persist between runs; nothing touches production.

```bash
npm run import && npm run deploy
```
After a new DSA phase lands in `dsa material/`. The importer is idempotent,
reports added/changed/unchanged, and never touches user progress.
