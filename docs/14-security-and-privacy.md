# Security & Privacy

> Purpose: the platform's authentication/authorization model, secrets handling, HTTP security posture, and the analytics privacy/GDPR-PECR design.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Authentication & tokens](#1-authentication--tokens)
- [2. Authorization (RBAC)](#2-authorization-rbac)
- [3. Secrets handling](#3-secrets-handling)
- [4. HTTP security headers & CORS](#4-http-security-headers--cors)
- [5. Analytics privacy (GDPR / UK-PECR)](#5-analytics-privacy-gdpr--uk-pecr)
- [6. PII handling](#6-pii-handling)
- [7. Transport & dependencies](#7-transport--dependencies)

---

## 1. Authentication & tokens

| Token / mechanism | Used by | Scope | Where set |
|---|---|---|---|
| **Public read API token** (`STRAPI_PUBLIC_TOKEN`) | Next.js server (`lib/strapi.ts`) | read-only content API | server `.env`; seeded as `nextjs-public` by `ensure-public-api-token.ts` |
| **Analytics ingest secret** (`ANALYTICS_INGEST_TOKEN`) | Next proxy `app/api/analytics` → CMS `/api/analytics/collect` | constant-time bearer check (`is-analytics-ingest` policy) | same value on `web` + `cms` |
| **Revalidate secret** (`REVALIDATE_SECRET`) | CMS publish webhook → `app/api/revalidate` | query-string shared secret | same value on `web` + `cms` |
| **Admin JWT** | Strapi `/admin` users | admin panel (RBAC-scoped) | issued at login (`ADMIN_JWT_SECRET`) |
| **Keycloak OIDC** (optional) | end-user SSO | `KEYCLOAK_ENABLED=true` only | `KEYCLOAK_*` env (disabled by default) |

The browser **never** holds the ingest token: the tracker posts to the same-origin `/api/analytics` proxy, which adds the secret server-side and forwards to the CMS over the internal Docker network.

## 2. Authorization (RBAC)

Two role systems (detail in the CMS repo `docs/rbac.md`):
- **Admin-panel roles**: Super Admin, plus the seeded *Content Manager*, *Blog Editor*, *Read-only Viewer*. Content Manager additionally has end-user (`users-permissions.user`) CRUD + `users-permissions.roles.read` + read on the analytics types (this fixed the "Policy Failed" error on the user-create screen).
- **Users-&-Permissions roles** (API consumers): `inspire-admin` / `inspire-editor` / `inspire-viewer`; the **Public** role is locked to `form-submission.create` only.
- Analytics types and `candidate`/`form-submission` are **not** exposed to the public API token.

## 3. Secrets handling

- All secrets live in env: the server `/opt/inspire-africa/.env` (gitignored) and **GitHub Actions secrets** for CI. **No secrets are baked into images** (build args are public-safe) or committed (`.env.local` / `.env` are gitignored; `.env.example` / `deploy/.env.production.example` hold names + `CHANGE_ME` placeholders only).
- Generate with `openssl rand -base64 32`. Rotation: update the value in the server `.env` (and GH secret if used), then `docker compose up -d <service>`. Rotating `STRAPI_PUBLIC_TOKEN` also requires regenerating the token in Strapi → Settings → API Tokens.
- `TODO/UNVERIFIED`: the `~/.ssh/contabo_deploy` key used for automated server access should be rotated/revoked at handover.

## 4. HTTP security headers & CORS

- **Web** (`next.config.mjs` `headers()`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` (note: geolocation disabled — consistent with IP-based, not GPS, geo), `X-DNS-Prefetch-Control: on`. `poweredByHeader: false`.
- **CMS** (`config/middlewares.ts`): `strapi::security` CSP (img/media allow-listed to self + CDN hosts), and `strapi::cors` restricted to `CORS_ORIGINS` (never `*`) — the public read token grants read to all published content, so origins are allow-listed.
- The analytics ingest proxy enforces a **same-origin** check before forwarding.

## 5. Analytics privacy (GDPR / UK-PECR)

Privacy-by-design, for an EU/UK audience:
- **Consent-first**: no analytics cookies and **no tracking network calls before opt-in**. Only a strictly-necessary first-party cookie (`ia_consent`) stores the choice. The banner offers Accept all / Reject non-essential / Manage.
- **GPC / DNT honoured**: if the browser signals Global Privacy Control or Do-Not-Track and there's no explicit choice, the default is *rejected* (no nag).
- **No raw IP stored**: the CMS derives coarse geo (country/region/city) from the IP transiently, then stores only a **salted, truncated `ipHash`** (`ANALYTICS_IP_SALT`); the raw IP is discarded.
- **Data minimisation + retention**: only the documented fields are stored; a nightly cron purges raw events/sessions older than `ANALYTICS_RETENTION_MONTHS` (default 14) and keeps only aggregated rollups long-term.
- **First-party only**: no third-party analytics SDKs, no cross-site identifiers. Withdrawal via the footer "Cookie settings" stops tracking and clears analytics state.

## 6. PII handling

- `candidate` (CVs, contact details) and `form-submission` are **admin-only** (controller-enforced) with `private` fields excluded from API responses; not granted to the public token.
- `TODO/UNVERIFIED`: no formal DSAR / right-to-erasure runbook exists yet — the data structures support manual deletion but the procedure should be documented (see [Known issues](./15-known-issues-tech-debt.md)).

## 7. Transport & dependencies

- TLS terminated by **certbot-managed nginx** on the host (HTTP→HTTPS redirect; HSTS via `stale-while-revalidate` cache headers on app responses).
- Dependency posture: `npm audit` reports moderate/high advisories in the dev/build tree (typical for the Strapi/Next ecosystems); none are known to be runtime-exploitable in this setup. Review at each upgrade.
