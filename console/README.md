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
