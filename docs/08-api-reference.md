# API Reference

> Purpose: the HTTP surface across both apps — Strapi content API, the custom analytics collect endpoint, the Next.js route handlers, and the auth model.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Auth model](#1-auth-model)
- [2. Strapi content API (public read)](#2-strapi-content-api-public-read)
- [3. CMS — POST /api/analytics/collect](#3-cms--post-apianalyticscollect)
- [4. CMS — form submissions](#4-cms--form-submissions)
- [5. CMS — Keycloak OIDC routes](#5-cms--keycloak-oidc-routes)
- [6. Next.js — POST /api/analytics](#6-nextjs--post-apianalytics)
- [7. Next.js — POST /api/revalidate](#7-nextjs--post-apirevalidate)
- [8. Next.js — metadata routes](#8-nextjs--metadata-routes)

---

## 1. Auth model

| Credential | Used by | Where | Scope |
|-----------|---------|-------|-------|
| **Public read token** (`STRAPI_PUBLIC_TOKEN`) | web → cms content reads | `Authorization: Bearer` | Read-only on published content (token type `read-only`, created by `ensure-public-api-token.ts` as `nextjs-public`) |
| **Analytics ingest token** (`ANALYTICS_INGEST_TOKEN`) | web proxy → cms collect | `Authorization: Bearer` or `x-analytics-token` | Only `POST /api/analytics/collect` (policy `is-analytics-ingest`, constant-time compare) |
| **Admin JWT** | CMS admin panel users | cookie/header | Per admin-panel role (Super Admin / Content Manager / Blog Editor / Read-only Viewer) |
| **End-user JWT** (`JWT_SECRET`, 7d) | users-permissions API users | `Authorization: Bearer` | Per users-permissions role (`inspire-admin/editor/viewer`); Public role limited to `form-submission.create` |
| **Keycloak OIDC** (optional) | CMS SSO | redirect flow | Issues a Strapi JWT; realm role → Strapi role |
| **Revalidate secret** (`REVALIDATE_SECRET`) | cms → web webhook | `?secret=` query | Only `POST /api/revalidate` |

CORS (CMS): allow-listed via `CORS_ORIGINS` (never `*`); methods GET/POST/PUT/DELETE/PATCH/HEAD (`config/middlewares.ts`).

## 2. Strapi content API (public read)

Base: `${STRAPI_BASE_URL}/api` (prefix from `config/api.ts`). Default page size 25, max 100, `withCount: true`. Every Strapi v5 response is `{ data, meta }`.

The website calls these (see `lib/cms/*`). Auth: `Authorization: Bearer ${STRAPI_PUBLIC_TOKEN}`.

| Method | Path (example) | Used by | Notes |
|--------|---------------|---------|-------|
| GET | `/site-setting?populate=*` | `getSiteSettings` | single type |
| GET | `/navigation?populate[headerLinks]=true&populate[footerColumns][populate]=links&populate[legalLinks]=true` | `getNavigation` | |
| GET | `/pages?filters[slug][$eq]=<slug>&<SECTION_POPULATE>` | `getPage` | verbose dynamic-zone populate (see ADR-007 defect) |
| GET | `/pages?fields[0]=slug&fields[1]=title&pagination[pageSize]=100` | `listPages` | |
| GET | `/blog-posts?sort=publishedAt:desc&pagination[pageSize]=<n>&<POPULATE_LIST>` | `getBlogPosts` | |
| GET | `/blog-posts?filters[slug][$eq]=<slug>&<POPULATE_DETAIL>` | `getBlogPost` | |
| GET | `/corridors?sort=order:asc&pagination[pageSize]=50` | `getCorridors` | |
| GET | `/legal-documents?filters[slug][$eq]=<slug>` | `getLegalDocument` | metadata only |

Also publicly readable per `seed-roles.ts` (`PUBLIC_READABLE`): `design-token`, `tag`, `author`, `job-posting`, `form-definition`.

Example request/response:
```
GET /api/corridors?sort=order:asc HTTP/1.1
Authorization: Bearer <STRAPI_PUBLIC_TOKEN>

200 OK
{ "data": [ { "id": 1, "documentId": "…", "country": "UK", "displayName": "UK",
              "sectors": "Healthcare · Care", "order": 1 } ],
  "meta": { "pagination": { "page":1, "pageSize":25, "pageCount":1, "total":6 } } }
```

Error codes: `401` (missing/invalid token), `403` (token lacks the permission, e.g. reading `candidates`/`form-submissions`), `404` (no document), `4xx/5xx` surfaced — `strapiFetch` throws on non-2xx and `lib/cms/*` catch → static fallback.

## 3. CMS — POST /api/analytics/collect

Source: `src/api/analytics/routes/analytics.ts` + `controllers/analytics.ts`. Route config: `auth: false`, policy `global::is-analytics-ingest`.

- **Auth**: shared secret in `Authorization: Bearer <ANALYTICS_INGEST_TOKEN>` (or `x-analytics-token`), constant-time compared. Fails closed if the token isn't configured.
- **Payload** (sanitised by `utils/analytics/validate.ts`):
```json
{
  "sessionId": "string (≤64, required)",
  "consentLevel": "analytics | all (required)",
  "context": { "path": "≤512", "title": "≤255", "referrer": "host only", "utm": { "source": "≤128", "medium": "≤128", "campaign": "≤128" } },
  "events": [ { "type": "<whitelisted>", "path": "≤512", "pageTitle": "≤255",
               "referrer": "host only", "target": "≤512", "sectionId": "≤128",
               "scrollDepth": 0-100, "occurredAt": "ISO", "meta": "json ≤1024 bytes" } ]
}
```
- **Limits** (`LIMITS`): ≤50 events/batch; string caps as above; meta ≤1024 bytes. Unknown event types dropped; invalid types/missing sessionId/invalid consent → `400`.
- **Rate limit**: token bucket per `ipHash`, 240/min sustained, burst 120 → `429 {error:"rate_limited"}` (`utils/analytics/rate-limit.ts`).
- **Bot scoring**: `parseUa` flags bots (`botScore` 0..1) stored on the session.
- **IP handling**: client IP from `X-Forwarded-For` → coarse geo (transient) → salted/truncated hash stored; raw IP discarded.
- **Response**: `204` on success; `400` on invalid payload; `429` when rate-limited. Persistence failures are swallowed (still `204`).

Example:
```
POST /api/analytics/collect HTTP/1.1
Authorization: Bearer <ANALYTICS_INGEST_TOKEN>
X-Forwarded-For: 203.0.113.7
Content-Type: application/json

{ "sessionId":"s-1","consentLevel":"analytics",
  "context":{"path":"/","title":"Home"},
  "events":[{"type":"pageview","path":"/","occurredAt":"2026-05-27T10:00:00Z"}] }

204 No Content
```

## 4. CMS — form submissions

`POST /api/form-submissions` is open to the **Public** users-permissions role (`form-submission.create` only). `GET/PUT/DELETE` are admin-only (smoke test expects `403` on GET, `201` on POST). Body: `{ "data": { "formKey":"contact", "email":"…", ... } }`. NOTE: the website forms do NOT call this yet (stubs) — see [Content flow](./09-content-flow-and-editing.md).

## 5. CMS — Keycloak OIDC routes

Registered only when `KEYCLOAK_ENABLED=true` (`extensions/users-permissions/strategies/keycloak.ts`):
- `GET /api/auth/keycloak` → 302 to Keycloak (sets `kc_state`/`kc_nonce` cookies).
- `GET /api/auth/keycloak/callback` → exchanges code, verifies id_token, upserts a user keyed on `kc:<sub>`, maps realm role → Strapi role, issues a Strapi JWT, redirects to `target` (default `/admin`) with `#access_token=<jwt>`.

## 6. Next.js — POST /api/analytics

Source: `app/api/analytics/route.ts`. Same-origin ingest proxy. See [Frontend/analytics guide](./05-frontend-analytics-guide.md).
- `403` if `Origin` host ≠ `Host`.
- `204` always otherwise (no-op if unconfigured or body empty/>64 KB; forwards to CMS with the ingest token + XFF + UA, 4 s timeout, swallowing errors).

## 7. Next.js — POST /api/revalidate

Source: `app/api/revalidate/route.ts`.
- Auth: `?secret=<REVALIDATE_SECRET>` → `403` if missing/mismatched.
- Body: `{ collection?, slug?, uid? }`.
- Behaviour: `revalidateTag(collection)` + `revalidateTag(collection:slug)`; then `revalidatePath(...)` per collection (blog-post → `/`+`/blog/<slug>`; page → `/` or `/<slug>`; site-setting/design-token/navigation/corridor/form-definition → `revalidatePath('/', 'layout')`; legal-document → `/<slug>`).
- Response: `{ revalidated: true, collection, slug }`; `400` on invalid JSON.

## 8. Next.js — metadata routes

| Route | File | Output |
|-------|------|--------|
| `GET /sitemap.xml` | `app/sitemap.ts` | static routes + blog posts (from in-repo `BLOG_POSTS`) |
| `GET /robots.txt` | `app/robots.ts` | allow `/`, disallow `/api/` + `/_next/`, sitemap + host |
| `GET /manifest.webmanifest` | `app/manifest.ts` | PWA manifest |
