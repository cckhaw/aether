#!/usr/bin/env bash
# Deletes every Vercel deployment of the project except the current production one.
# Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID; optional DRY_RUN=true, VERCEL_API.
set -euo pipefail

: "${VERCEL_TOKEN:?VERCEL_TOKEN is required}"
: "${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID is required}"
: "${VERCEL_TEAM_ID:?VERCEL_TEAM_ID is required}"
API="${VERCEL_API:-https://api.vercel.com}"
DRY_RUN="${DRY_RUN:-false}"

api() { curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" "$@"; }

# Safety: only clean up once we can positively identify a healthy current production deployment.
current="$(api "$API/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_TEAM_ID" | jq -r '.targets.production.id // empty')"
if [ -z "$current" ]; then
  echo "::error::Could not determine the current production deployment; refusing to delete anything."
  exit 1
fi
state="$(api "$API/v13/deployments/$current?teamId=$VERCEL_TEAM_ID" | jq -r '.readyState // empty')"
if [ "$state" != "READY" ]; then
  echo "::error::Current production deployment $current is '$state', not READY; refusing to delete anything."
  exit 1
fi
echo "Keeping current production deployment: $current"

# Collect every finished deployment (previews and old production), following pagination.
ids=()
until_ts=""
while :; do
  url="$API/v6/deployments?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=100"
  [ -n "$until_ts" ] && url="$url&until=$until_ts"
  page="$(api "$url")"
  while IFS= read -r id; do
    [ -n "$id" ] && ids+=("$id")
  done < <(jq -r --arg cur "$current" \
    '.deployments[] | select(.uid != $cur) | select((.state // .readyState) | IN("READY","ERROR","CANCELED")) | .uid' <<<"$page")
  until_ts="$(jq -r '.pagination.next // empty' <<<"$page")"
  [ -z "$until_ts" ] && break
done

echo "Found ${#ids[@]} deployment(s) to delete."
failed=0
for id in "${ids[@]+"${ids[@]}"}"; do
  if [ "$DRY_RUN" = "true" ]; then
    echo "[dry run] would delete $id"
  elif api -X DELETE "$API/v13/deployments/$id?teamId=$VERCEL_TEAM_ID" >/dev/null; then
    echo "Deleted $id"
  else
    echo "::warning::Failed to delete $id"
    failed=$((failed + 1))
  fi
done
echo "Done. ${failed} failure(s)."
