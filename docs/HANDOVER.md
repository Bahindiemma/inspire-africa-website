# INSPIRE AFRICA — Engineering Handover

> Purpose: the master index + handover checklist for both applications. Start here.
> Last reviewed: 2026-05-27 (commit 49a621a)

INSPIRE AFRICA is two apps deployed via Docker/GHCR to a shared Contabo VPS, fronted by host nginx (TLS via certbot):
- **Website** — Next.js 15 (this repo, `inspire-africa-website`). Image `ghcr.io/bahindiemma/inspire-africa-website` (GHCR **public**).
- **CMS** — Strapi v5 + MySQL (`inspire-africa-cms`). Image `ghcr.io/bahindiemma/inspire-africa-cms` (GHCR **private**). Its docs live in that repo's `docs/` (README index there).

## Documentation index (this repo)

| # | Doc | What it covers |
|---|---|---|
| — | [README](../README.md) | Overview, stack, quickstart, scripts |
| 01 | [System architecture](./01-system-architecture.md) | C4 context/container, components, trust boundaries |
| 02 | [Local development setup](./02-local-development-setup.md) | Run both apps locally end-to-end |
| 03 | [Coding standards](./03-coding-standards.md) | TS/lint conventions, commit/PR/branch model |
| 04 | [Testing strategy](./04-testing-strategy.md) | What exists + recommended approach |
| 05 | [Frontend & analytics guide](./05-frontend-analytics-guide.md) | Consent, tracker, ingest proxy, revalidate |
| 06 | [ADRs](./06-adrs.md) | Key architecture decisions (incl. nginx vs Caddy) |
| 07 | [Data model / ERD](./07-data-model-erd.md) | Content types, relations, PII fields |
| 08 | [API reference](./08-api-reference.md) | Strapi + Next routes, auth, examples |
| 09 | [Content flow & editing](./09-content-flow-and-editing.md) | Static vs CMS rendering, seeding, publish→revalidate |
| 10 | [Environment variables](./10-environment-variables.md) | Every var, purpose, where set, rotation |
| 11 | [CI/CD](./11-ci-cd.md) | GitHub Actions workflows |
| 12 | [Deployment runbook](./12-deployment-runbook.md) | Topology, deploy, on-server build, SSL |
| 13 | [Runbooks / incident playbooks](./13-runbooks-incident-playbooks.md) | Backup/restore, rollback, proxy-down, stale content |
| 14 | [Security & privacy](./14-security-and-privacy.md) | Auth, secrets, headers, analytics GDPR/PECR |
| 15 | [Known issues & tech debt](./15-known-issues-tech-debt.md) | What's broken/drifting + roadmap |
| 16 | [Glossary](./16-glossary.md) | Terms |

CMS-specific docs: see the `inspire-africa-cms` repo `docs/` (architecture, content-model, seeding, analytics, rbac, environment, deployment, operations, security-privacy, local-development, known-issues, glossary).

## Handover checklist — access to transfer

| Asset | Detail / where | Owner after handover |
|---|---|---|
| **Server SSH** | Contabo VPS `37.60.225.220`, port **2021**, root login has **2FA**. The automation key `~/.ssh/contabo_deploy` should be **rotated/revoked**. | |
| **GitHub** | org/user `Bahindiemma`; repos `inspire-africa-website`, `inspire-africa-cms`; Actions secrets | |
| **GHCR packages** | `inspire-africa-website` (public), `inspire-africa-cms` (private — make public or share a `read:packages` PAT) | |
| **Domain & DNS** | `inspireafricans.com` (apex + www → VPS). Registrar/DNS provider login | |
| **TLS** | certbot/Let's Encrypt on the host (auto-renew); admin email for ACME | |
| **MySQL** | in-container (`db`), creds in `/opt/inspire-africa/.env` (`DATABASE_*`, `MYSQL_ROOT_PASSWORD`) | |
| **Strapi admin** | Super Admin at `inspireafricans.com/admin` (super-admin password was rotated 2026-05-27) | |
| **Email / upload** | SendGrid (if `EMAIL_PROVIDER=sendgrid`); S3/Cloudinary only if `MEDIA_PROVIDER` set (default local) | |
| **Geo data** | `geoip-lite` (bundled offline DB — **no MaxMind license needed**) | |
| **Keycloak** | only if `KEYCLOAK_ENABLED=true` (disabled by default) | |

> Credentials are referenced by **name + location only** — never store values in the repo. Real values live in the server `.env` and GitHub Actions secrets.

## First-week onboarding tasks
1. Get SSH (2021/2FA) + GitHub + GHCR access; clone both repos; run both apps locally ([02](./02-local-development-setup.md)).
2. Read [01 architecture](./01-system-architecture.md), [09 content flow](./09-content-flow-and-editing.md), [12 deployment](./12-deployment-runbook.md), [15 known issues](./15-known-issues-tech-debt.md).
3. Do a safe no-op deploy of `web` to learn the pipeline ([12](./12-deployment-runbook.md)).
4. Tackle [Known issue #1](./15-known-issues-tech-debt.md) (CMS `getPage` fallback) — highest-leverage fix.

## Coverage report
| Doc | Status |
|---|---|
| 01 System architecture | ✅ |
| 02 Local dev | ✅ |
| 03 Coding standards | ✅ |
| 04 Testing strategy | ✅ (recommendations; no suite exists) |
| 05 Frontend & analytics | ✅ |
| 06 ADRs | ✅ |
| 07 Data model / ERD | ✅ |
| 08 API reference | ✅ |
| 09 Content flow | ✅ |
| 10 Env variables | ✅ |
| 11 CI/CD | ✅ |
| 12 Deployment runbook | ✅ |
| 13 Runbooks/incidents | ✅ |
| 14 Security & privacy | ✅ |
| 15 Known issues | ✅ |
| 16 Glossary | ✅ |
| HANDOVER index | ✅ |
| CMS repo docs | ✅ (in `inspire-africa-cms/docs/`) |

**UNVERIFIED items to confirm at handover** (search docs for `UNVERIFIED`): the nginx vhost + certbot config (server-only, not in repo); exact root cause of the `getPage` null; whether a DSAR/erasure procedure is needed; live values of a few env vars. Items 1–3 in [Known issues](./15-known-issues-tech-debt.md) are the priority follow-ups.
