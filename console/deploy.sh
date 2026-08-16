#!/usr/bin/env bash
#
# Deploys the Launch Console: the three-tab website (Placement, MBA, Email
# Agent) as a Cloud Run Service. Safe to re-run.
#
#   ./console/deploy.sh your-project-id
#
# The console goes in a DIFFERENT region from the agent job on purpose.
# Cloud Run domain mappings -- the free way to put this on your own domain --
# are not offered in asia-south1, where the job runs. asia-southeast1 is the
# nearest region that has them. Nothing else moves: both talk to the same
# bucket and the same secrets, which are reachable from anywhere.
set -euo pipefail

PROJECT="${1:-}"
if [[ -z "$PROJECT" ]]; then
  echo "usage: $0 <gcp-project-id>" >&2
  exit 1
fi

REGION="${CONSOLE_REGION:-asia-southeast1}"
SERVICE="${SERVICE:-launch-console}"
SA="${CONSOLE_SA:-launch-console}"
REPO="${ARTIFACT_REPO:-inbox-agent-images}"

# Must match bootstrap.sh -- the console reads the job's state and overlay.
BUCKET="${BUCKET:-${PROJECT}-inbox-agent-state}"
JOB_NAME="${JOB_NAME:-inbox-agent}"
JOB_REGION="${JOB_REGION:-asia-south1}"
AGENT_SA="inbox-agent@${PROJECT}.iam.gserviceaccount.com"

PRIMARY_EMAIL="${PRIMARY_EMAIL:-}"
COLLEGE_EMAIL="${COLLEGE_EMAIL:-}"
# Empty means the console is open to anyone with the URL, which is the
# default. Set it to require a password on every request.
CONSOLE_PASSWORD="${CONSOLE_PASSWORD:-}"
# When set, the MCP endpoint moves to /mcp/<token>. A custom connector can
# only supply a URL -- it cannot attach a header -- so a secret in the path
# is the one protection compatible with it. Empty leaves /mcp open, matching
# the rest of this console.
MCP_TOKEN="${MCP_TOKEN:-}"

if [[ -z "$PRIMARY_EMAIL" ]]; then
  echo "Set PRIMARY_EMAIL so the console can show where reports go, e.g.:" >&2
  echo "  PRIMARY_EMAIL=you@gmail.com $0 $PROJECT" >&2
  exit 1
fi

SA_EMAIL="${SA}@${PROJECT}.iam.gserviceaccount.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/launch-console:latest"

say() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }

# Same eventual-consistency problem as bootstrap.sh: a service account can
# exist and still be invisible to another API's IAM endpoint for a few
# seconds, and set -e would kill the script on the first one.
retry() {
  local attempts=10 delay=3 i
  for ((i = 1; i <= attempts; i++)); do
    if "$@" >/dev/null; then return 0; fi
    if ((i < attempts)); then
      echo "  not visible yet, retrying in ${delay}s (${i}/${attempts})..." >&2
      sleep "$delay"
    fi
  done
  echo "  gave up after ${attempts} attempts: $*" >&2
  return 1
}

gcloud config set project "$PROJECT" >/dev/null

say "Enabling APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com storage.googleapis.com artifactregistry.googleapis.com

say "Artifact Registry repo in ${REGION}"
if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker --location="$REGION" \
    --description="console and agent images"
else
  echo "already exists"
fi

say "Service account: ${SA_EMAIL}"
if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA" --display-name="Launch console"
else
  echo "already exists"
fi

say "Granting roles"
# Read state.json, read and write the settings overlay. Bucket-scoped.
retry gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

# Needed to read the OAuth client and to create a secret per mailbox you
# connect. Project-wide because the secret does not exist until you add it.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.admin" --condition=None

# So the "Run a digest now" button can start the job.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.developer" --condition=None

# The agent reads mailbox secrets the console creates after the agent was
# deployed, so a per-secret grant is impossible -- the secret does not exist
# yet. Project-scoped accessor is the tradeoff, and this project holds
# nothing but this agent's own secrets.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${AGENT_SA}" \
  --role="roles/secretmanager.secretAccessor" --condition=None

# Deploying a service that RUNS AS launch-console requires this on that
# identity specifically. bootstrap.sh grants the equivalent for the agent's
# service account; without this one, the push-to-deploy trigger can rebuild
# the site and then fail at the last step.
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
for builder in "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
               "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"; do
  retry gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --member="serviceAccount:${builder}" \
    --role="roles/iam.serviceAccountUser"
done

say "Building the site"
if command -v node >/dev/null 2>&1; then
  (cd "$ROOT" && node tools/build.mjs)
else
  echo "  node not found; shipping the committed index.html as-is"
fi
if [[ ! -f "${ROOT}/index.html" ]]; then
  echo "No index.html to serve. Run 'node tools/build.mjs' first." >&2
  exit 1
fi

say "Building the container"
gcloud builds submit "$ROOT" \
  --config "${ROOT}/console/cloudbuild.yaml" \
  --substitutions="_IMAGE=${IMAGE}" \
  --region="$JOB_REGION"

# Signs session cookies, which carry the OAuth state between starting a
# mailbox connection and coming back from Google. Reused across deploys so a
# redeploy mid-flow does not invalidate it; generated once on first deploy.
say "Session key"
EXISTING_SECRET="$(gcloud run services describe "$SERVICE" --region "$REGION" \
  --format='value(spec.template.spec.containers[0].env.filter("name:FLASK_SECRET").extract("value"))' 2>/dev/null || true)"
FLASK_SECRET="${EXISTING_SECRET:-$(python3 -c 'import secrets; print(secrets.token_hex(32))')}"
if [[ -n "$EXISTING_SECRET" ]]; then echo "reusing the existing key"; else echo "generated a new key"; fi

say "Deploying ${SERVICE} to ${REGION}"
ENV_VARS="GCP_PROJECT=${PROJECT}"
ENV_VARS="${ENV_VARS},STATE_BUCKET=${BUCKET}"
ENV_VARS="${ENV_VARS},JOB_NAME=${JOB_NAME}"
ENV_VARS="${ENV_VARS},JOB_REGION=${JOB_REGION}"
ENV_VARS="${ENV_VARS},PRIMARY_EMAIL=${PRIMARY_EMAIL}"
ENV_VARS="${ENV_VARS},COLLEGE_EMAIL=${COLLEGE_EMAIL}"
ENV_VARS="${ENV_VARS},AGENT_SERVICE_ACCOUNT=${AGENT_SA}"
ENV_VARS="${ENV_VARS},CONSOLE_PASSWORD=${CONSOLE_PASSWORD}"
ENV_VARS="${ENV_VARS},MCP_TOKEN=${MCP_TOKEN}"
ENV_VARS="${ENV_VARS},FLASK_SECRET=${FLASK_SECRET}"
# Shown on the agent tab next to the agent's own version, so a half-finished
# deploy is visible rather than looking like a fix that did not take.
ENV_VARS="${ENV_VARS},APP_VERSION=${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo local)}"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --timeout 120 \
  --set-env-vars "$ENV_VARS"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"

MCP_PATH="/mcp"
[[ -n "$MCP_TOKEN" ]] && MCP_PATH="/mcp/${MCP_TOKEN}"

cat <<EOF

Done.

  Your console:  ${URL}

Three tabs: Placement, MBA, Email Agent. The first two work immediately.

  Add to Claude as a custom connector -- no local install, nothing to run:
    Name                  Launch Console
    Remote MCP server URL ${URL}${MCP_PATH}
    OAuth                 leave blank
EOF

if [[ -z "$CONSOLE_PASSWORD" ]]; then
  cat <<EOF

This console is OPEN -- anyone with the URL can read your agent's settings
and change them. That was the choice; just know that a domain is not a
secret, since every TLS certificate issued for it is published publicly.
To lock it later, redeploy with a password and nothing else changes:

  CONSOLE_PASSWORD='something-long' PRIMARY_EMAIL=${PRIMARY_EMAIL} $0 ${PROJECT}
EOF
fi

cat <<EOF

To connect extra mailboxes from the Agent tab, you need a WEB OAuth client
(the one you made for the job is a Desktop client and will not work here):

  1. Console -> APIs & Services -> Credentials -> Create credentials
     -> OAuth client ID -> Web application
  2. Under "Authorised redirect URIs" add BOTH:
       ${URL}/api/oauth/callback
       https://YOUR-DOMAIN/api/oauth/callback     (once you add a domain)
  3. Download the JSON, then store it:

     gcloud secrets create inbox-agent-oauth-web-client \\
       --data-file=/path/to/client_secret.json --replication-policy=automatic

Everything else on the Agent tab -- instructions, the mode switches, "run a
digest now" -- works without that step.
EOF
