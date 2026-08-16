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

COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Both identities, because which one actually runs a build is not something
# this script gets to decide. A trigger created in the Console picks a service
# account from a dropdown; `gcloud run deploy --source` uses the Compute
# default; Google's own defaults have moved over time. Granting one and
# guessing wrong produces a build that compiles and pushes perfectly and then
# fails on the last step with "run.jobs.get denied", which is a slow way to
# learn this. These are build-and-deploy roles on identities that already
# exist, so granting both is cheap and idempotent.
for builder in "$CLOUDBUILD_SA" "$COMPUTE_SA"; do
  # Deploy the service and the job.
  retry gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${builder}" \
    --role="roles/run.developer" \
    --condition=None
  # Push the built images.
  retry gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${builder}" \
    --role="roles/artifactregistry.writer" \
    --condition=None
  # Write its own build logs.
  retry gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${builder}" \
    --role="roles/logging.logWriter" \
    --condition=None
  # Deploying a job that RUNS AS ${SA_EMAIL} needs this on that identity
  # specifically, not merely on the project.
  retry gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --member="serviceAccount:${builder}" \
    --role="roles/iam.serviceAccountUser"
done

# `gcloud run jobs deploy --source` (used both by the very next step, and by
# any manual redeploy run the same way later) triggers an implicit Cloud
# Build behind the scenes. On projects created after ~May 2024, that build
# runs as the Compute Engine default SA rather than the dedicated Cloud
# Build one above -- and unlike older projects, this identity is no longer
# auto-granted the broad Editor role that used to make this work invisibly.
# Without this it fails part-build with "storage.objects.get" denied on the
# uploaded source zip, since it can't even read what it's supposed to build.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudbuild.builds.builder" \
  --condition=None

# DRY_RUN is carried over from the deployed job rather than forced back to
# true. --set-env-vars below replaces the whole env map, so hardcoding it
# would switch a live agent back off on every re-run -- silently, and the
# troubleshooting steps in DEPLOY.md send you back here for every fix. A
# fresh install has no job to read, so it still starts in dry run, which is
# the behaviour that matters for a first deploy. Export DRY_RUN=true or
# DRY_RUN=false to force it either way.
current_dry_run() {
  gcloud run jobs describe "$JOB" --region "$REGION" --format=json 2>/dev/null | python3 -c '
import json, sys

def walk(node):
    if isinstance(node, dict):
        if node.get("name") == "DRY_RUN" and "value" in node:
            yield node["value"]
        for value in node.values():
            yield from walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk(value)

try:
    doc = json.load(sys.stdin)
except Exception:
    raise SystemExit
for found in walk(doc):
    print(found)
    break
' 2>/dev/null || true
}

DRY_RUN_VALUE="${DRY_RUN:-$(current_dry_run)}"
DRY_RUN_VALUE="${DRY_RUN_VALUE:-true}"

# Which build this is, so the site can show it back and you can tell at a
# glance whether a fix you pushed is actually the code that is running.
APP_VERSION_VALUE="${APP_VERSION:-$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)}"

say "Deploying the Cloud Run job (DRY_RUN=${DRY_RUN_VALUE})"
gcloud run jobs deploy "$JOB" \
  --source "$ROOT" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --tasks 1 \
  --max-retries 1 \
  --task-timeout 30m \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "GCP_PROJECT=${PROJECT},GCP_REGION=${REGION},STATE_BUCKET=${BUCKET},VERTEX_LOCATION=${REGION},GEMINI_MODEL=${GEMINI_MODEL},PRIMARY_EMAIL=${PRIMARY_EMAIL},COLLEGE_EMAIL=${COLLEGE_EMAIL},REPORT_TO=${REPORT_TO},TIMEZONE=${TZ_NAME},GITHUB_REPO=${GITHUB_REPO},DRY_RUN=${DRY_RUN_VALUE},APP_VERSION=${APP_VERSION_VALUE}"

say "Scheduler service account"
SCHED_SA="scheduler-invoker@${PROJECT}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SCHED_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create scheduler-invoker --display-name="Cloud Scheduler invoker"
fi
# NOT roles/run.invoker. That grants run.jobs.run, which is enough to start a
# job with its deployed arguments -- but every schedule here passes the mode
# as a container override, and overriding requires the separate
# run.jobs.runWithOverrides permission, which run.invoker does not include.
# With the wrong role each scheduled fire returns 403 and simply never runs,
# while manual `gcloud run jobs execute` keeps working because that runs as
# you. The symptom is an agent that looks deployed and healthy and silently
# never sends anything.
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SCHED_SA}" \
  --role="roles/run.jobsExecutorWithOverrides" \
  --condition=None

JOB_URI="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT}/jobs/${JOB}:run"

create_schedule() {
  local name="$1" cron="$2" mode="$3"
  local body="{\"overrides\":{\"containerOverrides\":[{\"args\":[\"--mode=${mode}\"]}]}}"

  if gcloud scheduler jobs describe "$name" --location="$REGION" >/dev/null 2>&1; then
    # `update http` spells this --update-headers, not --headers: it takes the
    # update/remove/clear triad for merging into an existing header map,
    # whereas `create http` below sets the whole map at once with --headers.
    # Every other flag is shared between the two, which is exactly why this
    # only surfaces on a re-run, after the first run created the job.
    gcloud scheduler jobs update http "$name" \
      --location="$REGION" --schedule="$cron" --time-zone="$TZ_NAME" \
      --uri="$JOB_URI" --http-method=POST \
      --message-body="$body" \
      --update-headers="Content-Type=application/json" \
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
# Offset off the hour rather than */15. Both used to fire at :00, so four
# times a day the digest and a sweep ran together and contended for the state
# object. State now merges on conflict, but not colliding by construction is
# cheaper than merging, and the interval is unchanged.
create_schedule "${JOB}-sweep"  "7,22,37,52 * * * *" "sweep"
if [[ -n "$GITHUB_REPO" ]]; then
  # Weekly. Deadlines do not move often, and every run costs a PR to read.
  create_schedule "${JOB}-siteupdate" "0 9 * * 1" "site-update"
else
  echo "  (GITHUB_REPO empty, skipping the site-update schedule)"
fi

if [[ "$DRY_RUN_VALUE" == "true" ]]; then
  STATE_NOTE="The agent is deployed in DRY_RUN mode: it will read, classify and report,
but will not star, trash, or send anything until you turn that off."
else
  STATE_NOTE="The agent is deployed LIVE (DRY_RUN=${DRY_RUN_VALUE}), carried over from the
previous deploy: it will star and send for real. Cleanup obeys its own
separate switch, cleanup.dry_run in config.yaml."
fi

# Telling someone already live to "go live" is just confusing, so the last
# hint depends on which mode was actually deployed.
if [[ "$DRY_RUN_VALUE" == "true" ]]; then
  NEXT_STEP="  Go live once the reports look right:
    gcloud run jobs update ${JOB} --region ${REGION} --update-env-vars DRY_RUN=false"
else
  NEXT_STEP="  Confirm the schedules can actually start the job (they need
  run.jobsExecutorWithOverrides, not run.invoker -- see the note above the
  grant in this script). Anything other than OK here means nothing is firing:
    gcloud logging read 'resource.type=\"cloud_scheduler_job\"' \\
      --project=${PROJECT} --freshness=1d --order=desc --limit=10 \\
      --format='value(timestamp,resource.labels.job_id,jsonPayload.status)'"
fi

cat <<EOF

Done.

${STATE_NOTE}

  Run it once now:
    gcloud run jobs execute ${JOB} --region ${REGION} --args="--mode=check" --wait

  See what cleanup would do, without doing it:
    gcloud run jobs execute ${JOB} --region ${REGION} --args="--mode=cleanup" --wait
    gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="${JOB}"' \\
      --project=${PROJECT} --freshness=10m --order=asc --format='value(textPayload)'

${NEXT_STEP}

EOF
