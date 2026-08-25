#!/usr/bin/env bash
#
# Deploys both halves in one go: the website (Cloud Run Service) and the inbox
# agent (Cloud Run Job).
#
#   ./deploy-all.sh
#
# This exists because the two must move together. The site is baked into the
# console image and the agent writes what the site displays, so deploying one
# without the other is how you end up with a page whose Calendar and Reports
# cards 404 against an older backend.
#
# It is also the fallback for the push-to-deploy trigger. That trigger needs a
# GitHub App installation which is a browser flow, and browser flows fail in
# ways a script cannot fix. This needs no browser and no GitHub connection.
set -euo pipefail

PROJECT="${1:-${GCP_PROJECT:-personal-agent-505411}}"
export PRIMARY_EMAIL="${PRIMARY_EMAIL:-malhotra.aryan.a01@gmail.com}"
export COLLEGE_EMAIL="${COLLEGE_EMAIL:-aryanmalhotra@kgpian.iitkgp.ac.in}"
# Seeds the Codeforces tiles so they work on first load. Overridden by
# whatever is set on the page, which is where it is meant to be changed.
export CF_HANDLE="${CF_HANDLE:-ceasak}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say() { printf "\n\033[1m######## %s\033[0m\n" "$1"; }

# Stamped into both images so the site can show which build each half is
# running. The two deploy separately, so a run that dies between them leaves
# the page current and the agent stale -- which is indistinguishable from a
# fix that did not work until you can see both numbers side by side.
export APP_VERSION="${APP_VERSION:-$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)}"
echo "Deploying version ${APP_VERSION}"

say "1/2  Website  ->  Cloud Run Service (asia-southeast1)"
./console/deploy.sh "$PROJECT"

# Second, so that if the console deploy fails you have not already changed the
# thing that sends your mail.
say "2/2  Inbox agent  ->  Cloud Run Job (asia-south1)"
(cd inbox-agent && ./setup/bootstrap.sh "$PROJECT")

CONSOLE_URL="$(gcloud run services describe launch-console \
  --region=asia-southeast1 --format='value(status.url)' 2>/dev/null || true)"

cat <<EOF

######## Both deployed.

  Console:  ${CONSOLE_URL:-see the output above}

The agent keeps whichever DRY_RUN it was already on; neither deploy resets it.
EOF
