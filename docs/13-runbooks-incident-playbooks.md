# Runbooks / Incident Playbooks

> Purpose: step-by-step recovery procedures for the most likely operational incidents.
> Last reviewed: 2026-05-27 (commit 49a621a)

All commands run from `/opt/inspire-africa` on the VPS unless noted. Re-read the [SHARED-VPS guardrails](./12-deployment-runbook.md#3-shared-vps-guardrails-read-first) before running anything destructive.

## Table of contents
- [1. Backups](#1-backups)
- [2. Restore](#2-restore)
- [3. Rollback a deploy](#3-rollback-a-deploy)
- [4. Proxy / site down](#4-proxy--site-down)
- [5. CMS crash-loop](#5-cms-crash-loop)
- [6. Cert renewal failure](#6-cert-renewal-failure)
- [7. Stale content](#7-stale-content)
- [8. Analytics not recording](#8-analytics-not-recording)

---

## 1. Backups

```bash
# MySQL dump (content + analytics)
docker compose exec db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" inspire_africa_cms' \
  > backup-$(date +%F).sql

# Uploaded media lives in the cms_uploads docker volume:
docker run --rm -v inspire-africa_cms_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```
Store both off-host. `TODO/UNVERIFIED`: no automated backup schedule is configured — set up a cron/offsite copy as a first-week task. The actual volume name may differ (`docker volume ls | grep uploads`).

## 2. Restore

```bash
# DB restore (into a running db)
cat backup-YYYY-MM-DD.sql | docker compose exec -T db \
  sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" inspire_africa_cms'

# Media restore
docker run --rm -v inspire-africa_cms_uploads:/data -v "$PWD":/backup alpine \
  sh -c 'tar xzf /backup/uploads-YYYY-MM-DD.tar.gz -C /data'

docker compose restart cms
```

## 3. Rollback a deploy

Images are tagged with the short SHA (CI). To roll back:
```bash
# pin the web (or cms) image to a known-good SHA
docker compose pull web   # ensure tag is fetchable, or use a local image
# edit /opt/inspire-africa/docker-compose.yml: change the image tag :latest → :sha-<good>
docker compose up -d web
docker compose ps
```
Then revert the offending commit on `main` so the next `:latest` build is correct.

## 4. Proxy / site down

Symptoms: 502/timeout at `inspireafricans.com`.
```bash
docker compose ps                 # are web + cms Up?
docker compose logs --tail=100 web
nginx -t && systemctl status nginx
curl -I http://127.0.0.1:3000     # web reachable directly?
```
- If `web` is down: `docker compose up -d web`; check logs for env/token errors.
- If `web` is Up but nginx 502: nginx upstream/port mismatch — confirm nginx proxies to `127.0.0.1:3000` and reload (`systemctl reload nginx`).
- If only Strapi paths 502: check `cms` (`docker compose logs cms`).

## 5. CMS crash-loop

Symptoms: `cms` restarting; `/admin` unreachable.
```bash
docker compose logs --tail=200 cms
docker compose ps                 # is db healthy?
```
Common causes:
- **DB not reachable / unhealthy**: confirm `db` is `healthy`; verify `DATABASE_*` in `.env` match the MySQL env. The `cms` `depends_on: db: service_healthy`.
- **Missing secrets**: `APP_KEYS` (needs 4 values), `ADMIN_JWT_SECRET`, etc. unset → Strapi refuses to boot.
- **Bad migration / seed**: a recent schema change failed. Check `[bootstrap]`/`[seed-*]` log lines. As a last resort, restore from backup (section 2).
- **Charset**: DB must be `utf8mb4`.

## 6. Cert renewal failure

```bash
certbot certificates
certbot renew --dry-run
# fix cause (port 80 reachable for HTTP-01? DNS correct?), then:
certbot renew
nginx -t && systemctl reload nginx
```
Ensure port 80 is open to the internet for the ACME challenge and that the apex + www DNS still point at `37.60.225.220`. `TODO/UNVERIFIED`: confirm the certbot plugin (nginx vs webroot) on the host.

## 7. Stale content

Symptom: a CMS edit isn't showing on the site.
1. Confirm the edit was **published** (not just saved as draft).
2. Check the CMS log for `[revalidate-frontend] notified …` after the publish. If absent:
   - verify `FRONTEND_REVALIDATE_URL` + `REVALIDATE_SECRET` are set on `cms` and `REVALIDATE_SECRET` matches `web`;
   - verify the Strapi webhook (Settings → Webhooks) points at `http://web:3000/api/revalidate?secret=…`.
3. Manually trigger revalidation:
   ```bash
   curl -X POST "http://127.0.0.1:3000/api/revalidate?secret=<REVALIDATE_SECRET>" \
     -H 'Content-Type: application/json' -d '{"collection":"blog-post","slug":"<slug>"}'
   ```
4. ISR fallback: content auto-refreshes within the `revalidate` window (60s pages/blogs, 300s settings/corridors/legal) on the next request.
5. Remember the **sub-pages render the TSX fallback today** (ADR-007) — CMS edits to those Pages won't appear until that's fixed; edit the TSX instead. See [Content flow](./09-content-flow-and-editing.md).
6. Force a content re-seed if needed: set `RESEED_CONTENT=true`, `docker compose up -d cms`, then unset.

## 8. Analytics not recording

1. Did the visitor grant analytics consent? GPC/DNT defaults to rejected.
2. `web` env: `ANALYTICS_INGEST_URL` + `ANALYTICS_INGEST_TOKEN` set?
3. `cms` env: `ANALYTICS_INGEST_TOKEN` set and **equal** to web's? If unset, the CMS rejects all ingest.
4. Same-origin: the proxy `403`s cross-origin; ensure the page and `/api/analytics` share an origin.
5. Rate limit: bursts beyond 240/min per ipHash get `429`.
6. Test the CMS endpoint directly with the ingest token (see [API reference](./08-api-reference.md) §3) — expect `204`.
