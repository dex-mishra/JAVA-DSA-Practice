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
  artifactregistry.googleapis.com \
  developerconnect.googleapis.com
```

(`developerconnect` is only used later, for automatic deploys in step 12 — enabling it now just means one less wait later. `bootstrap.sh` in step 9 enables this same list again regardless, so this step is technically redundant with it; running both is harmless.)

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

This prints a URL and then waits for you to paste something back — it does
**not** complete on its own. **Cloud Shell has no browser**, so: copy the
printed URL into a new tab on your laptop, sign in as
`malhotra.aryan.a01@gmail.com`, approve. You'll see:

> Google hasn't verified this app

That's expected — the app is in Testing mode with you as a listed test user.
Click **Advanced → Go to Inbox Agent (unsafe)**. "Unsafe" here just means
Google hasn't manually reviewed it; you wrote the code, so this is fine.

Approve all three scopes it asks for: read/modify Gmail, send Gmail, and
"create calendars" — the last one is what lets it create events later.

After approving, your browser lands on a `localhost:8085` page that **fails
to load** — "can't connect," or similar. This is expected, not an error:
nothing is meant to be listening there. The thing you actually need is
already sitting in your address bar. Copy the **entire URL** from that failed
page — it looks like:

```
http://localhost:8085/?state=xxxx&code=xxxx&scope=xxxx
```

and paste it into the Cloud Shell terminal at the `Paste that URL here:`
prompt, then press Enter. You'll see "Stored a new version of
inbox-agent-primary-token."

(Why the browser-based `run_local_server` flow other Google auth guides
describe doesn't work here: it starts a listener and waits for Google to
redirect *back to it*, but that listener is a process on the remote Cloud
Shell VM while your browser is on your laptop — the redirect has nowhere
reachable to land, and the script would hang forever. Copying the URL by hand
sidesteps that; the failed page only needs to exist long enough to copy from,
never to actually load.)

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

`--wait` only tells you whether the execution succeeded or failed, not what it
actually did — Cloud Run Jobs write their output to Cloud Logging, not back to
this terminal. Read it with:

```bash
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="inbox-agent"' \
  --freshness=10m --order=asc --format='value(textPayload)' --limit=200
```

(`--freshness=10m` scopes this to whatever you just ran, so it doesn't matter
that the same command works for every mode below too.)

Confirms both mailboxes are reachable, the state bucket exists, and Vertex AI
responds. Read the output — it prints each mailbox's actual email address, so
you can catch a token authorized under the wrong account.

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=digest" --wait
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="inbox-agent"' \
  --freshness=10m --order=asc --format='value(textPayload)' --limit=200
```

This runs a full digest cycle in dry-run — you'll see in the logs exactly what
it *would* send, star, and propose for your calendar, without anything
happening yet.

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=cleanup" --wait
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="inbox-agent"' \
  --freshness=10m --order=asc --format='value(textPayload)' --limit=200
```

Same, for the cleanup rules specifically — every message it would trash, and
why.

Read a few of these before trusting it. If something looks wrong, the rules
live in `config.yaml`; edit and redeploy with:

```bash
gcloud run jobs deploy inbox-agent --source . --region asia-south1
```

(Once step 12 is done, `git push` replaces this command — every push to
`main` redeploys automatically. Until then, this is how a `config.yaml` edit
takes effect.)

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

## 12. Automatic deploys on push

Everything up to here deploys by running a command yourself, whenever you
choose to. This step wires up Cloud Build so that from now on, **any push to
`main`** — a config tweak, a code change, or a merged site-update PR —
automatically rebuilds the container and redeploys the Cloud Run Job. No more
running `gcloud run jobs deploy` by hand.

Worth knowing before turning this on: it applies to *any* push to `main`,
including the data-only PRs the weekly site-update job opens (deadline
changes in `data/*.json`). Merging one of those triggers a full rebuild and
redeploy of the agent too, even though nothing about the agent's own code
changed — a few wasted minutes, not a real problem, but the reason this step
is optional rather than folded into `bootstrap.sh`.

`bootstrap.sh` already granted Cloud Build's own service account everything it
needs to build, push, and deploy (`roles/run.developer`,
`roles/artifactregistry.writer`, `roles/logging.logWriter`, and
`roles/iam.serviceAccountUser` on the agent's runtime identity) — re-run it
first if you skipped straight here.

### Connect the repo

```bash
gcloud builds connections create github inbox-agent-github --region=asia-south1
```

This prints nothing useful yet — it creates the connection in a
pending-authorization state. Fetch the URL to finish it:

```bash
gcloud builds connections describe inbox-agent-github --region=asia-south1 \
  --format='value(installationState.actionUri)'
```

Open that URL on your laptop, sign in to GitHub, and either install the
**Google Cloud Build** GitHub App fresh or, if you've connected a repo to
Cloud Build before, add `CeasaKK/Placement-and-MBA` to its existing
installation. This is the one manual, browser-based step — GitHub's app
installation can't be scripted.

Confirm it went through:

```bash
gcloud builds connections describe inbox-agent-github --region=asia-south1 \
  --format='value(installationState.stage)'
```

Should print `COMPLETE`.

### Register the repository and create the trigger

```bash
gcloud builds repositories create placement-and-mba \
  --connection=inbox-agent-github --region=asia-south1 \
  --remote-uri=https://github.com/CeasaKK/Placement-and-MBA.git
```

```bash
gcloud builds triggers create github \
  --name=inbox-agent-deploy \
  --region=asia-south1 \
  --repository=projects/YOUR_PROJECT_ID/locations/asia-south1/connections/inbox-agent-github/repositories/placement-and-mba \
  --branch-pattern='^main$' \
  --build-config=inbox-agent/cloudbuild.yaml
```

That's it. Push anything to `main` and check progress at **Cloud Build →
History** in the Console, or:

```bash
gcloud builds list --region=asia-south1 --limit=5
```

One thing this trigger deliberately does *not* do: touch the job's
environment variables. `inbox-agent/cloudbuild.yaml` rebuilds the image and
redeploys it without specifying `--set-env-vars` or `--update-env-vars` at
all — Cloud Run carries the existing job's env forward unless told otherwise.
This is what stops an auto-deploy from silently resetting `DRY_RUN` back to
`true` after you've gone live in step 11. If you ever need to change an env
var, do it explicitly with `gcloud run jobs update ... --update-env-vars`, the
same as before — CI/CD only replaces the manual *code* redeploy, not the
manual *config* one.

---

## 13. Using the calendar feature

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

## 14. Turning on the site-update job

Only if you set up the GitHub token in step 8 — it's already scheduled weekly
(Monday 9am IST) by `bootstrap.sh`. To run it once manually and see what it
proposes:

```bash
gcloud run jobs execute inbox-agent --region asia-south1 --args="--mode=site-update" --wait
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="inbox-agent"' \
  --freshness=10m --order=asc --format='value(textPayload)' --limit=200
```

In dry-run this just logs what it would propose. Once you flip `DRY_RUN=false`
in step 11, it opens real pull requests against
[github.com/CeasaKK/Placement-and-MBA](https://github.com/CeasaKK/Placement-and-MBA)
— review and merge each one yourself; it never touches `main` directly.

---

## 15. Publish the tracker site

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

**`bootstrap.sh` dies partway with "... does not exist" right after creating a
service account** — IAM propagation lag: a freshly created service account
can take a few seconds to become visible to a different API's IAM binding
endpoint. The script retries every binding that could hit this automatically
(10 attempts, a few seconds apart), so this shouldn't happen on a current
checkout — if you see it, `git pull` to make sure you're not on an older copy
of `setup/bootstrap.sh`, then just re-run it. It's idempotent: anything
already created is reported as "already exists" and skipped, so re-running
picks up exactly where it stopped.

**`gcloud run jobs deploy --source` fails with "does not have
storage.objects.get access" on a `...-compute@developer.gserviceaccount.com`
identity** — projects created after roughly May 2024 no longer auto-grant the
Compute Engine default service account the broad Editor role it used to have,
which is what silently let `--source` deploys work with zero configuration
before. `bootstrap.sh` grants this identity `roles/cloudbuild.builds.builder`
specifically so it can read the source it's asked to build — if you see this
on a current checkout, `git pull` and re-run `bootstrap.sh` (idempotent, picks
up from wherever it stopped). This also matters for every *manual* redeploy
in this guide that uses `gcloud run jobs deploy --source .` — not just the
first one.

**"redirect_uri_mismatch" during authorize.py** — the Desktop app OAuth client
type handles this automatically; if you see it, double check you picked
**Desktop app**, not **Web application**, in step 6.

**authorize.py errors on the pasted URL, or `authorize.py` just hangs after
you paste** — codes are single-use and expire in minutes. If you waited a
while, re-ran the script, or opened the URL twice, the code in your address
bar is stale. Re-run the script for a fresh URL rather than pasting an old
one. Also make sure you copied the *entire* URL, including everything after
`code=` — an editor or terminal that word-wraps the line can make it easy to
copy only part of it.

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
lives in `config.yaml` with comments explaining each rule. Edit, commit, and
push (if step 12 is set up) or run
`gcloud run jobs deploy inbox-agent --source . --region asia-south1` yourself
to redeploy.

**Cloud Build trigger fires but the deploy step fails with a permission
error** — almost always one of the four roles `bootstrap.sh` grants Cloud
Build's service account (`roles/run.developer`,
`roles/artifactregistry.writer`, `roles/logging.logWriter`, and
`roles/iam.serviceAccountUser` on the `inbox-agent` runtime identity). Re-run
`bootstrap.sh`; all four grants are idempotent.

**`gcloud builds connections describe` never reaches `COMPLETE`** — the
GitHub App installation didn't finish. Re-run the `installationState.actionUri`
command to get a fresh URL and go through the GitHub authorization page again;
it's safe to repeat.
