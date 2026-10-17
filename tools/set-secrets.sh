#!/usr/bin/env bash
# One-time setup: store the Worker's secrets in Cloudflare.
#
#   bash tools/set-secrets.sh
#
# Asks for each value with hidden input and pipes it straight into
# `wrangler secret put`, so nothing is echoed, logged or written to disk.
# Press Enter on any prompt to skip it and keep whatever is already set.
# Safe to run again later to replace one key.

set -u
cd "$(dirname "$0")/.."

ask() {
  local name="$1" hint="$2" prefix="$3" value=""
  echo
  echo "── $name"
  echo "   $hint"
  read -r -s -p "   Paste it and press Enter (Enter alone skips): " value
  echo
  if [ -z "$value" ]; then
    echo "   skipped"
    return
  fi
  if [ -n "$prefix" ] && [ "${value#"$prefix"}" = "$value" ]; then
    echo "   warning: this does not start with '$prefix' — check it is the right key"
  fi
  if printf '%s' "$value" | npx wrangler secret put "$name" >/dev/null 2>&1; then
    echo "   saved ✓"
  else
    echo "   FAILED — run:  npx wrangler secret put $name   to see the error"
  fi
}

echo "Launch Console — secrets setup. Values are hidden as you paste."

ask GROQ_API_KEY   "Groq key for the drill check. console.groq.com → API Keys → Create." "gsk_"
ask RESEND_API_KEY "Resend key for the emails. resend.com/api-keys → Create (Sending access)." "re_"
ask NOTIFY_TO      "The email address your Resend account is registered with (emails go here)." ""
ask JUDGE0_KEY     "RapidAPI key for grading mocks. rapidapi.com → Judge0 CE → Basic (free) plan → X-RapidAPI-Key." ""

echo
echo "Secrets now set on the Worker:"
npx wrangler secret list 2>/dev/null | grep -o '"name": *"[^"]*"' | sed 's/"name": *"\(.*\)"/   • \1/'
echo
echo "Done. No redeploy needed — tell Claude 'secrets are set' and it will verify everything."
