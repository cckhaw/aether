#!/usr/bin/env bash
# Waits until the production deployment for $SHA is READY. Exits non-zero if it fails, is cancelled,
# or doesn't finish in time, so the cleanup step never deletes anything for a broken deploy.
# Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID, SHA; optional TIMEOUT_SECONDS (default 900), VERCEL_API.
set -euo pipefail

: "${VERCEL_TOKEN:?VERCEL_TOKEN is required}"
: "${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID is required}"
: "${VERCEL_TEAM_ID:?VERCEL_TEAM_ID is required}"
: "${SHA:?SHA is required}"
API="${VERCEL_API:-https://api.vercel.com}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-900}"
POLL_SECONDS="${POLL_SECONDS:-15}"

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
while :; do
  page="$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    "$API/v6/deployments?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=20")"
  state="$(jq -r --arg sha "$SHA" \
    '[.deployments[] | select(.meta.githubCommitSha == $sha and .target == "production")][0].state // "NOT_FOUND_YET"' <<<"$page")"
  echo "Deployment for ${SHA:0:7}: $state"
  case "$state" in
    READY) exit 0 ;;
    ERROR|CANCELED) echo "::error::Deployment for $SHA ended as $state; not cleaning up."; exit 1 ;;
  esac
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "::error::Timed out waiting for the deployment of $SHA; not cleaning up."
    exit 1
  fi
  sleep "$POLL_SECONDS"
done
