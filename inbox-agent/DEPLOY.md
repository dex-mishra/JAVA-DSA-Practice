# Deployment guide — Google Cloud Console

Everything below uses the **Console UI**, since you don't have `gcloud` or
Docker installed locally. Cloud Shell (a terminal built into the Console,
free, no local install) runs the few commands that need a shell.

**What you end up with:** the agent reads both `malhotra.aryan.a01@gmail.com`
and your `@kgpian.iitkgp.ac.in` mailbox. Every report — digest, urgent alert,
calendar confirmation receipt — lands in `malhotra.aryan.a01@gmail.com`. Every
calendar event it creates lands on a calendar tied to that same Google
account. The college mailbox is read-only to the agent: it never sends mail
and never touches a calendar itself, it's only a source of things to report on.

Total time: 45–60 minutes, mostly waiting for APIs to enable and the first
build to finish.

---

## 0. Before you start

- Sign in to [console.cloud.google.com](https://console.cloud.google.com) with
  `malhotra.aryan.a01@gmail.com` — this is the account your free trial credits
  are on, and it must be the project owner.
- Have both mailbox passwords / 2FA ready. You'll authorize each once through
  a Google consent screen; the agent never sees a password.
- The two files this guide keeps referring to — `config.yaml` and
  `.env.example` — already exist in this repo (`inbox-agent/`), pushed to
  [github.com/CeasaKK/Placement-and-MBA](https://github.com/CeasaKK/Placement-and-MBA).

---

## 1. Create the project

1. Console → top-left project dropdown → **New Project**.
2. Name it something like `inbox-agent-prod`. Note the **Project ID** it
   generates (e.g. `inbox-agent-prod-471203`) — you'll paste this in several
   places below. It is *not* the same as the project name if the name was
   taken.
3. **Billing** → link the billing account your free trial credits are on. The
   project cannot enable most APIs without this, even while spending $0.

---

## 2. Open Cloud Shell

Top-right of the Console, click the `>_` icon. A terminal opens at the bottom
of the browser, already authenticated as you, with `gcloud` pre-installed.
Every command in this guide from here on runs there.

Set your project as the default so you don't have to repeat `--project` on
every command:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` everywhere below with the actual ID from step 1.

---

## 3. Enable the APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  gmail.googleapis.com \
  calendar-json.googleapis.com \
  artifactregistry.googleapis.com
```

Takes 2–3 minutes the first time.

---

## 4. Pull the code into Cloud Shell

Cloud Shell has its own small persistent disk and its own `git`, unrelated to
your laptop's network — this sidesteps whatever was blocking `github.com` on
your machine earlier.

```bash
git clone https://github.com/CeasaKK/Placement-and-MBA.git
cd Placement-and-MBA/inbox-agent
```

---

## 5. OAuth consent screen

This is the screen Google shows *you* when the agent asks for permission —
one-time setup, not shown to anyone else.

1. Console → search bar → **"OAuth consent screen"**.
2. User type: **External**. (Internal requires a Google Workspace org that
   owns this project; your personal Gmail project doesn't have one.)
3. App name: `Inbox Agent`. User support email and developer contact: your
   Gmail address.
4. Scopes: skip this page, you don't need to add scopes here — the code
   requests them directly.
5. **Test users**: add both
   - `malhotra.aryan.a01@gmail.com`
   - your `@kgpian.iitkgp.ac.in` address

   This matters: while the app is unpublished ("Testing" status, which is
   fine to leave it in forever for personal use), **only listed test users can
   authorize it**. Skipping this step is the single most common reason
   authorization fails.
6. Save. Leave publishing status as **Testing** — you never need to submit
   for verification for personal use with two test users.

---

## 6. OAuth client

1. Console → **APIs & Services → Credentials → + Create Credentials → OAuth
   client ID**.
2. Application type: **Desktop app**. Name: `inbox-agent-cli`.
3. Click the download icon on the created credential → saves a JSON file.
4. Upload it into Cloud Shell: in the Cloud Shell panel, click the ⋮ menu →
   **Upload** → pick the downloaded file. It lands in your Cloud Shell home
   directory.
5. Move it into place:

   ```bash
   mv ~/client_secret*.json ~/Placement-and-MBA/inbox-agent/client_secret.json
   ```

---

## 7. Authorize both mailboxes

```bash
cd ~/Placement-and-MBA/inbox-agent
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### Primary — malhotra.aryan.a01@gmail.com

```bash
.venv/bin/python setup/authorize.py --account primary \
  --project YOUR_PROJECT_ID --secret inbox-agent-primary-token
```

This prints a URL. **Cloud Shell has no browser** — copy the URL into a new
tab on your laptop, sign in as `malhotra.aryan.a01@gmail.com`, approve. You'll
see:

> Google hasn't verified this app

That's expected — the app is in Testing mode with you as a listed test user.
Click **Advanced → Go to Inbox Agent (unsafe)**. "Unsafe" here just means
Google hasn't manually reviewed it; you wrote the code, so this is fine.

Approve all three scopes it asks for: read/modify Gmail, send Gmail, and
"create calendars" — the last one is what lets it create events later.

After approving, the browser redirects to `localhost` and appears to hang or
error ("can't connect") — **that's fine**, ignore it. Copy the full redirected
URL from the browser's address bar back into Cloud Shell if it's waiting for
one, or just check Cloud Shell — it usually completes on its own once the
redirect fires. You'll see "Stored a new version of inbox-agent-primary-token."

### College — your @kgpian.iitkgp.ac.in address

```bash
.venv/bin/python setup/authorize.py --account college \
  --project YOUR_PROJECT_ID --secret inbox-agent-college-token
```

Same flow, sign in as the college account this time.

**If Google blocks this with an admin-policy error** ("this app is blocked" /
"contact your administrator") rather than the normal unverified-app warning,
KGP's Workspace tenant has third-party app access restricted. Three ways
through, in order of effort:

1. Email `webmaster@iitkgp.ac.in` or check if there's a self-service app
   allowlist in your KGP Google Workspace admin settings, asking to allow this
   OAuth client.
2. Set up mail forwarding instead: college Gmail → **Settings → Forwarding and
   POP/IMAP → Add a forwarding address** → your primary Gmail, "keep copy."
   Then skip this step entirely and don't set `COLLEGE_EMAIL` in step 9 — the
   agent reads everything from one mailbox. You lose per-mailbox starring in
   college mail specifically, but reporting is unaffected.
3. Come back to this later; the primary mailbox alone is still fully useful.

---

## 8. GitHub token, for the weekly site-update PRs

Only needed if you want the tracker's deadlines to auto-check themselves. Skip
straight to step 9 if not.

1. [github.com/settings/tokens](https://github.com/settings/tokens) →
   **Fine-grained tokens → Generate new token**.
2. Repository access: **Only select repositories** →
   `CeasaKK/Placement-and-MBA`.
3. Permissions: **Contents: Read and write**, **Pull requests: Read and
   write**. Nothing else.
4. Generate, copy the token (`github_pat_...`), you won't see it again.

```bash
printf '%s' 'PASTE_YOUR_TOKEN_HERE' | gcloud secrets create inbox-agent-github-token \
  --data-file=- --replication-policy=automatic
```

---

## 9. Everything else, in one script

```bash
COLLEGE_EMAIL=you@kgpian.iitkgp.ac.in ./setup/bootstrap.sh YOUR_PROJECT_ID
```

Replace `you@kgpian.iitkgp.ac.in` with your actual college address. (If you
went the forwarding route in step 7, omit `COLLEGE_EMAIL=...` entirely.)

This one script:
- creates the GCS bucket that holds the agent's small state file
- creates a dedicated service account with only the permissions it needs
  (its own bucket, and Vertex AI — nothing project-wide)
- builds the container from source (Cloud Build does this remotely; nothing
  builds on your machine)
- deploys it as a **Cloud Run Job** — not a server, just something that runs
  on a schedule and exits
- creates three Cloud Scheduler entries: digest (4×/day), sweep (every 15
  min), and site-update (weekly, only if you did step 8)

It deploys with `DRY_RUN=true`. Nothing is sent, starred, trashed, or
scheduled yet — everything just gets logged so you can check the agent's
judgement before it acts.

Takes 3–5 minutes, mostly the container build.

---

## 10. Verify before going live

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=check" --wait
```

Confirms both mailboxes are reachable, the state bucket exists, and Vertex AI
responds. Read the output — it prints each mailbox's actual email address, so
you can catch a token authorized under the wrong account.

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=digest" --wait
gcloud run jobs executions logs read --region asia-south1 --job inbox-agent | tail -80
```

This runs a full digest cycle in dry-run — you'll see in the logs exactly what
it *would* send, star, and propose for your calendar, without anything
happening yet.

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=cleanup" --wait
gcloud run jobs executions logs read --region asia-south1 --job inbox-agent | tail -60
```

Same, for the cleanup rules specifically — every message it would trash, and
why.

Read a few of these before trusting it. If something looks wrong, the rules
live in `config.yaml`; edit and redeploy with:

```bash
gcloud run jobs deploy inbox-agent --source . --region asia-south1
```

---

## 11. Go live

Two separate switches, on purpose — flip mail/calendar/starring on first, and
leave cleanup in dry-run a while longer since it's the only irreversible-ish
one (30-day Trash, but still).

```bash
gcloud run jobs update inbox-agent --region asia-south1 --update-env-vars DRY_RUN=false
```

From here: digests actually send to `malhotra.aryan.a01@gmail.com`, urgent
mail actually alerts, matching mail actually gets starred, and calendar
proposals actually go out (though nothing is scheduled until you reply to
them — see below).

Cleanup stays off separately. Once a week or so of digests look right, edit
`config.yaml`:

```yaml
cleanup:
  dry_run: false
```

```bash
gcloud run jobs deploy inbox-agent --source . --region asia-south1
```

---

## 12. Using the calendar feature

After go-live, a digest may include a numbered "Add to calendar?" section.
**Nothing in it is scheduled yet.** Reply to that email (same thread) with
which ones to keep:

```
track 1 3
```
```
track all
```
```
none
```

Within 15 minutes (the next sweep) the agent creates exactly those events on a
calendar named **"Inbox Agent"** inside `malhotra.aryan.a01@gmail.com`'s
Google Calendar, and emails you a receipt with links. That calendar shows
alongside your normal ones in the Calendar app — collapse or hide it anytime
with one checkbox in the sidebar, and it cannot touch anything on your other
calendars even if it wanted to (the OAuth scope physically doesn't reach
them).

---

## 13. Turning on the site-update job

Only if you set up the GitHub token in step 8 — it's already scheduled weekly
(Monday 9am IST) by `bootstrap.sh`. To run it once manually and see what it
proposes:

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=site-update" --wait
gcloud run jobs executions logs read --region asia-south1 --job inbox-agent | tail -60
```

In dry-run this just logs what it would propose. Once you flip `DRY_RUN=false`
in step 11, it opens real pull requests against
[github.com/CeasaKK/Placement-and-MBA](https://github.com/CeasaKK/Placement-and-MBA)
— review and merge each one yourself; it never touches `main` directly.

---

## 14. Publish the tracker site

If you haven't already:

1. On GitHub: `CeasaKK/Placement-and-MBA` → **Settings → Pages → Source →
   GitHub Actions**.
2. Push to `main` (or merge any open PR) — `.github/workflows/pages.yml`
   already in the repo builds and deploys automatically.
3. Site appears at `https://ceasakk.github.io/Placement-and-MBA/`.

---

## What it costs

At four digests, ~96 sweeps, and one site-update a day/week:

| Service | Rough monthly cost |
|---|---|
| Cloud Run (Jobs, pay-per-second) | ~$1–2 |
| Cloud Scheduler | free (3 jobs, well under the free tier of 3) |
| Cloud Storage (one small JSON file) | pennies |
| Vertex AI / Gemini Flash, few hundred short emails/day | a few dollars |
| Secret Manager | pennies |

All comfortably inside free-trial credits.

---

## Troubleshooting

**"redirect_uri_mismatch" during authorize.py** — the Desktop app OAuth client
type handles this automatically; if you see it, double check you picked
**Desktop app**, not **Web application**, in step 6.

**check mode shows the wrong email for an account** — the token was
authorized while signed into the wrong Google account in that browser tab. Use
an incognito window and sign in explicitly as the mailbox you're authorizing,
then re-run `setup/authorize.py` for that account — it overwrites the secret.

**Scheduler jobs exist but nothing happens** — check
`gcloud scheduler jobs list --location=asia-south1` for `lastAttemptTime` and
status. A `PERMISSION_DENIED` there usually means the
`scheduler-invoker` service account (created by `bootstrap.sh`) lost its
`roles/run.invoker` binding — re-run `bootstrap.sh`, it's idempotent.

**Want to change how aggressive cleanup or starring is** — everything tunable
lives in `config.yaml` with comments explaining each rule. Edit, then
`gcloud run jobs deploy inbox-agent --source . --region asia-south1` to
redeploy.
