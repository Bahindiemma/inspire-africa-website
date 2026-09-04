#!/usr/bin/env bash
#
# Redeploy the Next.js web container — the WHOLE procedure, not just the pull.
#
# Run on the VPS, or pipe it in:
#   ssh -i ~/.ssh/contabo_deploy -p 2021 root@37.60.225.220 bash -s < deploy/redeploy-web.sh
#
# WHY THIS IS A SCRIPT AND NOT A RUNBOOK PARAGRAPH.
#
# `docker compose up -d --force-recreate web` on its own ships a broken site.
# CI builds the image in GitHub Actions, where the CMS is unreachable, so every
# CMS-driven page is prerendered with the image-less fallback. Without the
# revalidation below the site comes back with no photographs — which is exactly
# what happened on 2026-08-04 (thirteen days) and again on 2026-09-04.
#
# The pages now carry `revalidate = 60`, so a skipped run self-heals within a
# minute. That is the safety net, not the plan. Run the whole thing.
#
set -uo pipefail

COMPOSE_DIR=/opt/inspire-africa
SITE=https://inspireafricans.com
PAGES=(/ /join /approach /workers /employers /governments /contact /blog)
SLUGS=(home workers employers governments approach join contact)
COLLECTIONS=(site-setting navigation blog-post legal-document)

cd "$COMPOSE_DIR"

# NOTE: never `source` this .env — it holds unquoted values containing spaces,
# so sourcing it executes stray words and aborts the script. Read the one key
# we need instead.
SECRET=$(sed -n 's/^REVALIDATE_SECRET=//p' "$COMPOSE_DIR/.env" | head -1 | tr -d '"' | tr -d "'" | tr -d '\r')
if [ -z "$SECRET" ]; then
  echo "!! REVALIDATE_SECRET missing from $COMPOSE_DIR/.env — refusing to deploy blind."
  exit 1
fi

echo "==> 1/5  clearing stale ghcr credentials"
# An expired login makes the daemon send bad auth instead of pulling
# anonymously, so even a PUBLIC image fails with "denied".
docker logout ghcr.io >/dev/null 2>&1 || true

echo "==> 2/5  pulling web"
docker compose pull web || { echo "!! pull failed"; exit 1; }

echo "==> 3/5  recreating web"
docker compose up -d --force-recreate web || { echo "!! recreate failed"; exit 1; }
sleep 8
docker compose ps web

echo "==> 4/5  revalidating (NOT optional — see header)"
for s in "${SLUGS[@]}"; do
  printf '    page/%-14s ' "$s"
  curl -s -o /dev/null -w '%{http_code}\n' -X POST \
    "http://127.0.0.1:3000/api/revalidate?secret=${SECRET}" \
    -H 'Content-Type: application/json' -d "{\"collection\":\"page\",\"slug\":\"$s\"}"
done
for c in "${COLLECTIONS[@]}"; do
  printf '    %-19s ' "$c"
  curl -s -o /dev/null -w '%{http_code}\n' -X POST \
    "http://127.0.0.1:3000/api/revalidate?secret=${SECRET}" \
    -H 'Content-Type: application/json' -d "{\"collection\":\"$c\"}"
done

# stale-while-revalidate: the first hit serves stale and kicks off the
# regeneration, the second serves the fresh page. Warm twice or the first
# real visitor is the one who gets the stale copy.
echo "==> 5/5  warming pages (twice each)"
for i in 1 2; do
  for p in "${PAGES[@]}"; do
    curl -s -o /dev/null "$SITE$p"
  done
  sleep 3
done

echo
echo "==> verifying"
fail=0
for p in "${PAGES[@]}"; do
  html=$(curl -s "$SITE$p")
  leaks=$(printf '%s' "$html" | grep -o 'href="[^"]*mn\.co[^"]*"' | wc -l | tr -d ' ')
  gate=$(printf '%s' "$html" | grep -o 'href="/join/start' | wc -l | tr -d ' ')
  imgs=$(printf '%s' "$html" | grep -o '_next/image' | wc -l | tr -d ' ')
  status=ok
  # Every page carries join CTAs in the header and footer.
  [ "$leaks" -ne 0 ] && { status=FAIL; fail=1; }
  [ "$gate" -eq 0 ] && { status=FAIL; fail=1; }
  # /blog and /contact are legitimately text-only; the rest carry photography.
  case "$p" in
    /blog|/contact) ;;
    *) [ "$imgs" -eq 0 ] && { status=FAIL; fail=1; } ;;
  esac
  printf '    %-6s %-14s community:%-3s gate:%-3s images:%s\n' "$status" "$p" "$leaks" "$gate" "$imgs"
done

echo
if [ "$fail" -ne 0 ]; then
  echo "!! DEPLOY IS NOT CLEAN."
  echo "   community != 0 -> a CTA skips the signup page (check CMS CTA hrefs)."
  echo "   gate == 0      -> the header/footer did not render; the app is broken."
  echo "   images == 0    -> serving the build-time fallback; revalidation did"
  echo "                     not take. Re-run this script; if it repeats, check"
  echo "                     STRAPI_MEDIA_URL and that cms is reachable from web."
  exit 1
fi
echo "   deploy clean: every page has photography, and every join button goes"
echo "   through the signup page."
