# Local Development Setup

> Purpose: stand up BOTH apps (website + CMS + database) locally and have the website read live content from the CMS.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Prerequisites](#1-prerequisites)
- [2. Topology](#2-topology)
- [3. Start the CMS](#3-start-the-cms)
- [4. Wire the website to the CMS](#4-wire-the-website-to-the-cms)
- [5. Start the website](#5-start-the-website)
- [6. Local analytics end-to-end](#6-local-analytics-end-to-end)
- [7. Website-only mode (no CMS)](#7-website-only-mode-no-cms)
- [8. Gotchas](#8-gotchas)

---

## 1. Prerequisites

- **Node ≥ 20** (website `engines.node >=20`; CMS `>=20 <=22`). Use Node 20 or 22 to satisfy both.
- **npm** (lockfiles are npm; the website Dockerfile deliberately uses `npm install`, not `npm ci`).
- A database for the CMS. Easiest local path is **SQLite** (zero setup); production is **MySQL 8**.

## 2. Topology

```
Browser → Next.js dev (localhost:3000) → Strapi (localhost:1337) → DB
                     │
                     └── /api/analytics proxy → Strapi /api/analytics/collect
```

## 3. Start the CMS

Repo: `Bahindiemma/inspire-africa-cms` (read-only reference clone at `/tmp/cms-edit`).

```bash
cd inspire-africa-cms
cp .env.example .env
npm install
```

Edit `.env`:
- For the quickest boot, switch to SQLite:
  ```
  DATABASE_CLIENT=sqlite
  DATABASE_FILENAME=.tmp/data.db
  ```
  (MySQL path is the production default — see `config/database.ts`; create the DB with `utf8mb4`.)
- Generate the secrets (`APP_KEYS` = 4 comma-separated values, plus `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`) with `openssl rand -base64 32`.
- Set `CORS_ORIGINS=http://localhost:3000` (never `*` — see `config/middlewares.ts`).
- Leave `ANALYTICS_INGEST_TOKEN` set to a value you'll reuse on the website.

Boot:
```bash
npm run develop
```

On first boot `src/index.ts` `bootstrap()` runs (all idempotent):
1. `seedRoles` — users-permissions API roles (`inspire-admin/editor/viewer`; public locked to `form-submission.create`).
2. `seedAdminRoles` — admin-panel roles (Content Manager / Blog Editor / Read-only Viewer).
3. `ensurePublicApiToken` — creates a read-only token `nextjs-public` and writes the plaintext **once** to `.runtime/public-api-token.txt`.
4. `seedContent` — migrates all static website copy into Strapi (site-setting, design-token, navigation, corridors, author, tags, 3 blog posts, form-definitions, 4 legal docs, and **Page** Dynamic Zones for home/workers/employers/governments/approach/join). Skipped if Site Settings already exists unless `RESEED_CONTENT=true`.

Create the first admin user at `http://localhost:1337/admin`.

## 4. Wire the website to the CMS

Grab the public read token. Either:
- read `.runtime/public-api-token.txt` (written on first boot), or
- create one in the admin: **Settings → API Tokens → Create** (Read-only, no expiry).

## 5. Start the website

Repo: this one.

```bash
cp .env.example .env.local   # if .env.local doesn't exist
npm install
```

Set in `.env.local` (matches `.env.example`):
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRAPI_BASE_URL=http://localhost:1337
STRAPI_PUBLIC_TOKEN=<paste the read-only token>
REVALIDATE_SECRET=<same value you set on the CMS>
ANALYTICS_INGEST_URL=http://localhost:1337/api/analytics/collect
ANALYTICS_INGEST_TOKEN=<same value you set on the CMS>
```

Run:
```bash
npm run dev        # http://localhost:3000
# other scripts:
npm run build      # next build (standalone)
npm run start      # serve the production build
npm run lint       # next lint (NOT run during build — see next.config.mjs)
npm run typecheck  # tsc --noEmit
```

How the web talks to the CMS: `lib/strapi.ts` wraps `fetch` with `Authorization: Bearer ${STRAPI_PUBLIC_TOKEN}` against `${STRAPI_BASE_URL}/api`, with ISR (`next.revalidate` default 60s) and `next.tags`. If `STRAPI_BASE_URL`/`STRAPI_PUBLIC_TOKEN` are unset, `isStrapiAvailable()` is false and every `lib/cms/*` fetcher falls back to in-repo static content (`lib/site.ts`, `lib/blogs.ts`).

## 6. Local analytics end-to-end

1. Visit the site, accept analytics in the cookie banner.
2. `lib/analytics/tracker.ts` batches events and POSTs to `/api/analytics`.
3. `app/api/analytics/route.ts` (must be served same-origin) forwards to `ANALYTICS_INGEST_URL` with the `ANALYTICS_INGEST_TOKEN` and `X-Forwarded-For`.
4. CMS `POST /api/analytics/collect` (`src/api/analytics/controllers/analytics.ts`) validates, geo-locates, hashes the IP, rate-limits, and writes `analytics-session` + `analytics-event` rows.

To verify the CMS endpoint directly without the browser, you can POST a batch with the ingest token in the `Authorization: Bearer` header (see [API reference](./08-api-reference.md)).

## 7. Website-only mode (no CMS)

Leave `STRAPI_BASE_URL`/`STRAPI_PUBLIC_TOKEN` unset. The site renders entirely from in-repo constants and TSX. `lib/strapi.ts` logs a warning rather than throwing. This is also how the site behaves today in production for the sub-pages (see the fallback issue in [Known issues](./15-known-issues-tech-debt.md)).

## 8. Gotchas

- **SQLite DB path** is anchored to `process.cwd()` not `__dirname` on purpose (`config/database.ts`) — the dev TS watcher wipes `dist/`, which would otherwise delete an open DB.
- **`npm ci` vs `npm install`**: the website Dockerfile uses `npm install` because transitive hoisting differences make `npm ci` abort. Locally either works.
- **Forms do not submit** to the CMS. `components/forms/*.tsx` are client stubs that `alert()` and reference Wix Forms. The CMS `form-submission` collection exists and accepts public POSTs, but the website never calls it. See [Content flow](./09-content-flow-and-editing.md) and [Known issues](./15-known-issues-tech-debt.md).
- **Sub-pages render TSX fallback** even with the CMS running, because `getPage()`'s populate query currently returns null/throws (see [Known issues](./15-known-issues-tech-debt.md)). The home page DOES read live CMS data for corridors + blog posts.
- **CORS**: if the site shows fallback content unexpectedly, check the CMS `CORS_ORIGINS` includes your web origin and that the token is valid.
