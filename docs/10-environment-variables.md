# Environment Variables Reference

> Purpose: every environment variable for web + cms — name, purpose, required?, where set, and how to rotate. NO secret values appear here.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Website (web)](#1-website-web)
- [2. CMS (cms) — core](#2-cms-cms--core)
- [3. CMS — database](#3-cms--database)
- [4. CMS — analytics & webhook](#4-cms--analytics--webhook)
- [5. CMS — media / email / Keycloak](#5-cms--media--email--keycloak)
- [6. Rotation guidance](#6-rotation-guidance)
- [7. Where they're set](#7-where-theyre-set)

---

## 1. Website (web)

Source: `.env.example`, `Dockerfile`, `deploy/docker-compose.yml`, `lib/strapi.ts`, `app/api/*`.

| Name | Purpose | Required | Where set |
|------|---------|----------|-----------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL; inlined into the client bundle at **build time** (canonical/OG/sitemap/robots) | Yes | Docker build-arg (`Dockerfile` ARG, default `https://inspireafricans.com`); compose `web.NEXT_PUBLIC_SITE_URL`; `.env.local` for dev |
| `STRAPI_BASE_URL` | CMS base for server-side fetches | Yes (else static fallback) | compose `web` = `http://cms:1337`; `.env.local` = `http://localhost:1337` |
| `STRAPI_PUBLIC_TOKEN` | Bearer token for public content reads | Yes (else static fallback) | compose/.env; from CMS admin or `.runtime/public-api-token.txt` |
| `REVALIDATE_SECRET` | Shared secret to authorise the CMS → web revalidate webhook | Yes (for live content refresh) | compose/.env; **must match the CMS value** |
| `ANALYTICS_INGEST_URL` | CMS collect endpoint the proxy forwards to | No (no-op if unset) | compose `web` = `http://cms:1337/api/analytics/collect` |
| `ANALYTICS_INGEST_TOKEN` | Bearer secret for the analytics proxy → CMS | No (no-op if unset) | compose/.env; **must match the CMS value** |
| `NODE_ENV`, `PORT`, `HOSTNAME` | Runtime | set by Docker | `Dockerfile` / compose |
| `NEXT_TELEMETRY_DISABLED` | Disable Next telemetry | No | `Dockerfile` |

Only `NEXT_PUBLIC_*` is exposed to the browser. The two tokens and the secret are server-only.

## 2. CMS (cms) — core

Source: `inspire-africa-cms/.env.example`, `config/*`, `deploy/docker-compose.yml`.

| Name | Purpose | Required | Notes |
|------|---------|----------|-------|
| `HOST`, `PORT` | Bind address/port (0.0.0.0:1337) | Yes | `config/server.ts` |
| `PUBLIC_URL` / `CMS_PUBLIC_URL` | Public origin (admin + signed-URL builders) | Yes | compose maps `CMS_PUBLIC_URL` → `PUBLIC_URL` |
| `IS_PROXIED` | Tell admin it's behind a proxy | When fronted by nginx | compose sets `"false"` (repo); set `true` behind nginx — `TODO/UNVERIFIED` on live value |
| `APP_KEYS` | Session/cookie signing (4 comma-separated) | Yes | secret |
| `API_TOKEN_SALT` | Salt for API token hashing | Yes | secret; `config/admin.ts` |
| `ADMIN_JWT_SECRET` | Admin panel JWT signing | Yes | secret |
| `TRANSFER_TOKEN_SALT` | Data-transfer token salt | Yes | secret |
| `JWT_SECRET` | users-permissions JWT signing (7d) | Yes | secret; `config/plugins.ts` |
| `ENCRYPTION_KEY` | Strapi field encryption | Yes | secret |
| `CORS_ORIGINS` | Allow-listed browser origins (never `*`) | Yes | `config/middlewares.ts` |
| `CRON_ENABLED` | Toggle scheduled jobs | No (default true) | `config/server.ts` |
| `ADMIN_URL` | Admin mount path | No (default `/admin`) | `config/admin.ts` |
| `FLAG_NPS`, `FLAG_PROMOTE_EE` | Suppress NPS/EE upsell | No | `config/admin.ts` |

## 3. CMS — database

| Name | Purpose | Required |
|------|---------|----------|
| `DATABASE_CLIENT` | `mysql` (prod) / `postgres` / `sqlite` | Yes |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Connection | Yes (mysql/postgres) |
| `DATABASE_SSL`, `DATABASE_SSL_REJECT_UNAUTHORIZED` | TLS to DB | No |
| `DATABASE_POOL_MIN/MAX`, `DATABASE_CONNECTION_TIMEOUT` | Pool | No |
| `DATABASE_FILENAME` | SQLite path (dev only) | No |
| `MYSQL_ROOT_PASSWORD` | MySQL root (compose `db` service) | Yes (compose) |

## 4. CMS — analytics & webhook

| Name | Purpose | Required | Notes |
|------|---------|----------|-------|
| `ANALYTICS_INGEST_TOKEN` | Validate the collect endpoint | Yes (else all ingest rejected) | **same value as web** |
| `ANALYTICS_IP_SALT` | Salt for the truncated-IP hash | Yes in prod | code warns + uses a CHANGE-ME default if unset |
| `ANALYTICS_RETENTION_MONTHS` | Raw event/session retention before nightly purge | No (default 14) | `crons/analytics-maintenance.ts` |
| `FRONTEND_REVALIDATE_URL` | web revalidate endpoint | Yes (for revalidation) | compose `http://web:3000/api/revalidate` |
| `REVALIDATE_SECRET` | Shared secret in the webhook query | Yes | **same value as web** |
| `WEBHOOKS_POPULATE_RELATIONS` | Webhook payload relations | No (default false) | |

## 5. CMS — media / email / Keycloak

Media (`MEDIA_PROVIDER` = `local` | `aws-s3` | `cloudinary`):
- AWS S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`, `AWS_CDN_BASE_URL`, `AWS_S3_SIGNED_URL_EXPIRES`, `AWS_S3_ACL`, `AWS_ROOT_PATH`.
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Production compose uses `MEDIA_PROVIDER=local` (volume `cms_uploads`).

Email: `EMAIL_PROVIDER` (sendgrid default), `SENDGRID_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, `EMAIL_FORM_NOTIFY`.

Abuse: `FORM_RATE_LIMIT_PER_HOUR` (default 10), `RECAPTCHA_SECRET`.

Keycloak (only if `KEYCLOAK_ENABLED=true`): `KEYCLOAK_ISSUER_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_REDIRECT_URI`, `KEYCLOAK_SCOPES`, `KEYCLOAK_ROLE_ADMIN`, `KEYCLOAK_ROLE_EDITOR`, `KEYCLOAK_ROLE_VIEWER`.

`RESEED_CONTENT` — set `true` to force a content re-seed on next boot (`seed-content.ts`).

## 6. Rotation guidance

- **STRAPI_PUBLIC_TOKEN**: CMS admin → Settings → API Tokens → regenerate/create a new read-only token → update `web` env → `docker compose up -d web`.
- **ANALYTICS_INGEST_TOKEN / REVALIDATE_SECRET**: generate a new value (`openssl rand -base64 32`), set the **same** value on both `web` and `cms` env, recreate both containers.
- **ANALYTICS_IP_SALT**: rotating breaks session-dedup continuity (acceptable); set once and keep.
- **Strapi secrets** (`APP_KEYS`, `*_SALT`, `*_SECRET`, `ENCRYPTION_KEY`): rotating `APP_KEYS`/`ADMIN_JWT_SECRET` invalidates existing admin sessions; rotating `ENCRYPTION_KEY` can break previously-encrypted fields — rotate deliberately, with a maintenance window.
- **DB passwords / MYSQL_ROOT_PASSWORD**: change in `.env`, then rotate the MySQL user password to match before recreating containers.
- **Provider keys** (SendGrid/AWS/Cloudinary/Keycloak): rotate in the provider console, then update CMS env.

## 7. Where they're set

- **Dev**: website `.env.local`; CMS `.env` (both gitignored).
- **Production**: `/opt/inspire-africa/.env` on the VPS, consumed by `docker compose` (see `deploy/.env.production.example`). NEVER commit the real `.env`.
- **Build-time only**: `NEXT_PUBLIC_SITE_URL` is baked into the web image at build (CI build-arg defaults to `https://inspireafricans.com`).
- Cross-reference: `deploy/docker-compose.yml` (variable→container mapping) and `deploy/.env.production.example` (the full prod template).
