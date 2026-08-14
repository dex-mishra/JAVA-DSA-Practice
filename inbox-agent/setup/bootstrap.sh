#!/usr/bin/env bash
#
# Stands up everything on GCP. Safe to re-run -- every step either creates a
# resource or reports that it already exists.
#
#   ./setup/bootstrap.sh your-project-id
#
set -euo pipefail

PROJECT="${1:-}"
REGION="${REGION:-asia-south1}"
JOB="${JOB:-inbox-agent}"
SA="${SA:-inbox-agent}"
BUCKET="${BUCKET:-${PROJECT}-inbox-agent-state}"
TZ_NAME="${TZ_NAME:-Asia/Kolkata}"
ARTIFACT_REPO="${ARTIFACT_REPO:-inbox-agent-images}"

if [[ -z "$PROJECT" ]]; then
  echo "usage: $0 <gcp-project-id>" >&2
  exit 1
fi

# These are read by the deployed job. Edit before running.
PRIMARY_EMAIL="${PRIMARY_EMAIL:-you@example.com}"
COLLEGE_EMAIL="${COLLEGE_EMAIL:-}"
REPORT_TO="${REPORT_TO:-$PRIMARY_EMAIL}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
# owner/repo for the weekly site-update PRs. Leave empty to skip that job.
GITHUB_REPO="${GITHUB_REPO:-CeasaKK/Placement-and-MBA}"

if [[ -z "$COLLEGE_EMAIL" ]]; then
  echo "Set COLLEGE_EMAIL first, e.g.:" >&2
  echo "  COLLEGE_EMAIL=you@kgpian.iitkgp.ac.in $0 $PROJECT" >&2
  exit 1
fi

SA_EMAIL="${SA}@${PROJECT}.iam.gserviceaccount.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

say() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }

# IAM propagation is eventually consistent: a service account (or an API
# freshly enabled, like Cloud Build's own SA) can exist and still be invisible
# to a *different* backend's IAM binding endpoint for several seconds. Every
# add-iam-policy-binding call below that references a principal this same run
# just created goes through this instead of running gcloud directly, so a
# losing race is a short wait, not a hard stop -- set -e would otherwise kill
# the whole script on the very first one, as it did for whoever hits this.
retry() {
  local attempts=10 delay=3 i
  for ((i = 1; i <= attempts; i++)); do
    if "$@" >/dev/null; then
      return 0
    fi
    if ((i < attempts)); then
      echo "  not visible yet, retrying in ${delay}s (${i}/${attempts})..." >&2
      sleep "$delay"
    fi
  done
  echo "  gave up after ${attempts} attempts: $*" >&2
  return 1
}

gcloud config set project "$PROJECT" >/dev/null

say "Enabling APIs (a few minutes the first time)"
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

say "State bucket: gs://${BUCKET}"
if ! gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${BUCKET}" \
    --location="$REGION" --uniform-bucket-level-access
else
  echo "already exists"
fi

say "Artifact Registry repo: ${ARTIFACT_REPO}"
if ! gcloud artifacts repositories describe "$ARTIFACT_REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$ARTIFACT_REPO" \
    --repository-format=docker --location="$REGION" \
    --description="inbox-agent container images"
else
  echo "already exists"
fi

say "Service account: ${SA_EMAIL}"
if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA" --display-name="Inbox agent"
else
  echo "already exists"
fi

say "Granting roles"
# Bucket-scoped rather than project-wide: the agent can only touch its own state.
retry gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user" \
  --condition=None

for secret in inbox-agent-primary-token inbox-agent-college-token inbox-agent-github-token; do
  if gcloud secrets describe "$secret" >/dev/null 2>&1; then
    retry gcloud secrets add-iam-policy-binding "$secret" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/secretmanager.secretAccessor"
    echo "  granted access to $secret"
  else
    echo "  !! $secret does not exist yet -- run setup/authorize.py, then re-run this script"
  fi
done

say "Cloud Build permissions (for the CI/CD trigger, see DEPLOY.md)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Push the built image, deploy the job, and write its own build logs. Granted
# unconditionally and harmlessly even if the GitHub trigger is never set up --
# it just sits unused until then. The Cloud Build API was possibly just
# enabled a few lines up in this same run, so its service account is subject
# to the same propagation delay as any freshly created one.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.developer" \
  --condition=None
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/logging.logWriter" \
  --condition=None
# Deploying a job that runs AS ${SA_EMAIL} requires this on that identity
# specifically, not just on the project.
retry gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

# `gcloud run jobs deploy --source` (used both by the very next step, and by
# any manual redeploy run the same way later) triggers an implicit Cloud
# Build behind the scenes. On projects created after ~May 2024, that build
# runs as the Compute Engine default SA rather than the dedicated Cloud
# Build one above -- and unlike older projects, this identity is no longer
# auto-granted the broad Editor role that used to make this work invisibly.
# Without this it fails part-build with "storage.objects.get" denied on the
# uploaded source zip, since it can't even read what it's supposed to build.
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudbuild.builds.builder" \
  --condition=None

say "Deploying the Cloud Run job"
gcloud run jobs deploy "$JOB" \
  --source "$ROOT" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --tasks 1 \
  --max-retries 1 \
  --task-timeout 15m \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "GCP_PROJECT=${PROJECT},GCP_REGION=${REGION},STATE_BUCKET=${BUCKET},VERTEX_LOCATION=${REGION},GEMINI_MODEL=${GEMINI_MODEL},PRIMARY_EMAIL=${PRIMARY_EMAIL},COLLEGE_EMAIL=${COLLEGE_EMAIL},REPORT_TO=${REPORT_TO},TIMEZONE=${TZ_NAME},GITHUB_REPO=${GITHUB_REPO},DRY_RUN=true"

say "Scheduler service account"
SCHED_SA="scheduler-invoker@${PROJECT}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SCHED_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create scheduler-invoker --display-name="Cloud Scheduler invoker"
fi
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SCHED_SA}" \
  --role="roles/run.invoker" \
  --condition=None

JOB_URI="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT}/jobs/${JOB}:run"

create_schedule() {
  local name="$1" cron="$2" mode="$3"
  local body="{\"overrides\":{\"containerOverrides\":[{\"args\":[\"--mode=${mode}\"]}]}}"

  if gcloud scheduler jobs describe "$name" --location="$REGION" >/dev/null 2>&1; then
    gcloud scheduler jobs update http "$name" \
      --location="$REGION" --schedule="$cron" --time-zone="$TZ_NAME" \
      --uri="$JOB_URI" --http-method=POST \
      --message-body="$body" \
      --headers="Content-Type=application/json" \
      --oauth-service-account-email="$SCHED_SA" >/dev/null
    echo "  updated $name ($cron)"
  else
    gcloud scheduler jobs create http "$name" \
      --location="$REGION" --schedule="$cron" --time-zone="$TZ_NAME" \
      --uri="$JOB_URI" --http-method=POST \
      --message-body="$body" \
      --headers="Content-Type=application/json" \
      --oauth-service-account-email="$SCHED_SA" >/dev/null
    echo "  created $name ($cron)"
  fi
}

say "Schedules"
# One entry covers all four digests; a second drives the urgent sweep. Three
# scheduler jobs total, which is exactly the free-tier allowance.
create_schedule "${JOB}-digest" "0 7,12,17,21 * * *" "digest"
create_schedule "${JOB}-sweep"  "*/15 * * * *"       "sweep"
if [[ -n "$GITHUB_REPO" ]]; then
  # Weekly. Deadlines do not move often, and every run costs a PR to read.
  create_schedule "${JOB}-siteupdate" "0 9 * * 1" "site-update"
else
  echo "  (GITHUB_REPO empty, skipping the site-update schedule)"
fi

cat <<EOF

Done.

The agent is deployed in DRY_RUN mode: it will read, classify and report, but
will not star, trash, or send anything until you turn that off.

  Run it once now:
    gcloud run jobs execute ${JOB} --region ${REGION} --args="--mode=check" --wait

  See what cleanup would do, without doing it:
    gcloud run jobs execute ${JOB} --region ${REGION} --args="--mode=cleanup" --wait
    gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="${JOB}"' \\
      --project=${PROJECT} --freshness=10m --order=asc --format='value(textPayload)'

  Go live once the reports look right:
    gcloud run jobs update ${JOB} --region ${REGION} --update-env-vars DRY_RUN=false

EOF
