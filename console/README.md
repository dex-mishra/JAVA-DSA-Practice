# Launch Console

One website, three tabs: **Placement**, **MBA**, **Email Agent**.

A Cloud Run *Service*, separate from the agent's Cloud Run *Job*. The job has
no URL and runs on a schedule; this has a URL and scales to zero, so it costs
essentially nothing between visits.

They meet at one place: a small JSON object in the agent's existing GCS
bucket. The console writes it, the next job execution reads it. Nothing is
redeployed when you change a setting, and if this service is down the agent
carries on with the configuration it was deployed with.

## Deploy

```bash
PRIMARY_EMAIL=you@gmail.com COLLEGE_EMAIL=you@kgpian.iitkgp.ac.in ./console/deploy.sh YOUR_PROJECT_ID
```

Re-runnable. Prints the URL when it finishes.

It deploys to **asia-southeast1**, not `asia-south1` where the job lives.
That is not arbitrary: Cloud Run domain mappings — the free route to a custom
domain — are not offered in `asia-south1`. Singapore is the nearest region
that has them. Both regions reach the same bucket and secrets.

## The Agent tab

**Instructions.** A text box, in plain English, handed to the model on every
run. This is how you tune it:

```
Anything from Prof. Sharma or the CDC office is always important.
Placement and internship mail outranks everything else this semester.
Newsletters from Unstop are noise unless they name a real deadline.
I am tracking deferred MBA programmes — flag anything mentioning ISB YLP.
```

It steers *judgement*: what gets flagged, starred, summarised, treated as an
opportunity. It cannot widen what the agent is permitted to do. The rules
deciding what may be binned, the per-run caps, and the OAuth scopes are in
`inbox-agent/agent/policy.py` and ship with the job. A sentence in this box
cannot reach them, which is what keeps a careless instruction from costing
you mail.

It also cannot change `REPORT_TO`. Where your summaries land is fixed at
deploy time, deliberately — otherwise anyone who reached this page could
point your inbox summaries at themselves.

**Mode.** Two switches. *Act on mail* is the global one: off means read,
classify and log, change nothing. *Bin stale bulk mail* is separate and
stays off independently, because it is the only one that touches Trash.

**Run something now.** Four buttons, all of which also happen on a schedule:
*Email me a summary* (the 3-day digest), *Full inbox review*, *Check for
anything urgent* (the 15-minute sweep), and *Show me what it would bin*.

**Full inbox review** is the deep one — `--mode=review`. It reads the whole
inbox, opened and unopened, however old, and mails back a single stocktake:
what still wants something from you, what has a date, what is career-related,
and a census of the rest. It is read-only by construction: it never calls the
star, bin, career or calendar paths at all, so no switch can make a review
act. That matters because it is the only mode that touches years-old mail.

It reads the most recent `review.max_messages_per_account` (default 300) per
mailbox rather than all 16,000 — a full pass would be hours of model time
against a 30-minute job ceiling — and the email says plainly when it did not
reach the bottom.

**Mailboxes.** Everything connected here folds into the single summary sent
to your primary address. Added mailboxes are read-only — `gmail.modify`, no
`gmail.send`. Only the primary sends.

## Connecting extra mailboxes

Needs a **Web** OAuth client. The one from the job's setup is a *Desktop*
client and will be rejected here.

1. Console → APIs & Services → Credentials → Create credentials → OAuth
   client ID → **Web application**.
2. Authorised redirect URIs — add the run.app URL now and your domain later:
   ```
   https://<your-console-url>/api/oauth/callback
   https://<your-domain>/api/oauth/callback
   ```
3. Download the JSON and store it:
   ```bash
   gcloud secrets create inbox-agent-oauth-web-client --data-file=client_secret.json --replication-policy=automatic
   ```

Everything else on the tab works without this.

## Deploying both at once

```bash
./deploy-all.sh
```

Site and agent, in that order. Use this rather than either script alone: the
site is baked into the console image and the agent writes what the site
displays, so deploying one without the other gives you a page whose Calendar
and Reports cards 404 against an older backend.

## Auto-deploy on push

Optional. `./deploy-all.sh` does the same job in one command and needs no
GitHub connection, so treat this as a convenience rather than a requirement —
the setup below hinges on a GitHub App installation, which is a browser flow
that can fail in ways no script can work around.

Without it, a merged site-update PR changes `data/mba.json` on GitHub while
the live page keeps serving the previous build — the site is baked into the
image at build time. `cloudbuild.yaml` at the repo root rebuilds and
redeploys **both** the site and the agent on every push to `main`.

**If the install window opens and closes itself**, the CLI-generated link is
the fragile part, not your setup. Do it from the Cloud Console instead:
**Cloud Build → Triggers → Connect Repository**, region `asia-south1`, source
*GitHub (Cloud Build GitHub App)*. That runs the same installation from an
already-authenticated session. Then come back and finish from
`gcloud builds repositories create` below.

One-off setup. Step 2 is the only part that needs a browser.

First, let Cloud Build's own service agent use Secret Manager. A GitHub
connection stores its token there, and without this the very first command
fails with *"could not assert Secret Manager permissions"*:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
```

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com" --role="roles/secretmanager.admin"
```

```bash
gcloud builds connections create github inbox-agent-github --region=asia-south1
```

```bash
gcloud builds connections describe inbox-agent-github --region=asia-south1 --format='value(installationState.actionUri)'
```

Open that URL, install the **Google Cloud Build** GitHub App, give it
`CeasaKK/Placement-and-MBA`. Confirm it says `COMPLETE`:

```bash
gcloud builds connections describe inbox-agent-github --region=asia-south1 --format='value(installationState.stage)'
```

```bash
gcloud builds repositories create placement-and-mba --connection=inbox-agent-github --region=asia-south1 --remote-uri=https://github.com/CeasaKK/Placement-and-MBA.git
```

```bash
gcloud builds triggers create github --name=deploy-all --region=asia-south1 --repository=projects/YOUR_PROJECT_ID/locations/asia-south1/connections/inbox-agent-github/repositories/placement-and-mba --branch-pattern='^main$' --build-config=cloudbuild.yaml
```

Neither deploy passes `--set-env-vars`, so Cloud Run carries the existing
environment forward. An automatic deploy cannot reset `DRY_RUN`,
`PRIMARY_EMAIL`, or the console's session key behind your back.

Watch a run with `gcloud builds list --region=asia-south1 --limit=5`.

## Custom domain

```bash
gcloud beta run domain-mappings create --service=launch-console --domain=console.yourdomain.com --region=asia-southeast1
```

It prints the DNS records to add at your registrar (a `CNAME` to
`ghs.googlehosted.com` for a subdomain; `A`/`AAAA` records for an apex
domain). Google issues the certificate automatically once DNS resolves —
15 minutes to a day.

Then add `https://console.yourdomain.com/api/oauth/callback` to the OAuth
client's redirect URIs, or connecting a mailbox from the domain will fail.

## A note on access

The console deploys **open**: anyone with the URL can read and change the
agent's settings. A domain is not a secret — every TLS certificate issued for
one is published to public Certificate Transparency logs, which are scanned
continuously. To require a password instead:

```bash
CONSOLE_PASSWORD='something-long' PRIMARY_EMAIL=you@gmail.com ./console/deploy.sh YOUR_PROJECT_ID
```

Nothing else changes.

## Local development

```bash
python3 -m venv console/.venv && console/.venv/bin/pip install -r console/requirements.txt
```

```bash
node tools/build.mjs && mkdir -p console/static console/_agent
```

```bash
cp index.html console/static/ && cp inbox-agent/agent/overlay.py console/_agent/
```

```bash
console/.venv/bin/python console/main.py
```

Those two copies are what the Dockerfile does at build time; neither is
committed, so there is only ever one real copy of each file. Without GCP
credentials the Agent tab still renders — it reads as an agent that has never
run, because the overlay read is deliberately fail-soft.
