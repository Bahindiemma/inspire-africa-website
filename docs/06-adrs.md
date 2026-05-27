# Architecture Decision Records (ADRs)

> Purpose: the significant architecture decisions, each with context, decision, and consequences, derived from the code/config.
> Last reviewed: 2026-05-27 (commit 49a621a)

Status legend: Accepted = in effect in code today.

## Table of contents
- [ADR-001 Strapi v5 + MySQL as the CMS](#adr-001-strapi-v5--mysql-as-the-cms)
- [ADR-002 GHCR + GitHub Actions for image delivery](#adr-002-ghcr--github-actions-for-image-delivery)
- [ADR-003 Host nginx as the single front proxy (Caddy retired)](#adr-003-host-nginx-as-the-single-front-proxy-caddy-retired)
- [ADR-004 Consent-first first-party analytics](#adr-004-consent-first-first-party-analytics)
- [ADR-005 geoip-lite for offline geo](#adr-005-geoip-lite-for-offline-geo)
- [ADR-006 Salted, truncated IP hashing](#adr-006-salted-truncated-ip-hashing)
- [ADR-007 Static-vs-CMS page rendering (and the fallback issue)](#adr-007-static-vs-cms-page-rendering-and-the-fallback-issue)
- [ADR-008 On-server build workaround for the private CMS package](#adr-008-on-server-build-workaround-for-the-private-cms-package)

---

## ADR-001 Strapi v5 + MySQL as the CMS
**Status:** Accepted

**Context.** The marketing site needs editable content (pages, blog, legal, navigation, site settings) without code deploys, plus a place to store form submissions, candidates (PII) and visitor analytics. A self-hosted, open-source headless CMS keeps data on the team's own VPS.

**Decision.** Use Strapi v5.46.1 (`/tmp/cms-edit/package.json`) with MySQL 8 in production (`config/database.ts`, `deploy/docker-compose.yml`). The DB client is env-selected (`DATABASE_CLIENT`) — Postgres and SQLite are also supported (SQLite for zero-setup dev). Content modelled as collection/single types with Dynamic Zones for flexible page composition.

**Consequences.** Full control + no SaaS fees; the team operates the DB, backups, and upgrades. Strapi v5's verbose `populate[...][on][...]` syntax for Dynamic Zones is a known sharp edge (see ADR-007). MySQL must be created with `utf8mb4`.

## ADR-002 GHCR + GitHub Actions for image delivery
**Status:** Accepted

**Context.** Two apps need reproducible deploys to a single VPS without building on the laptop or the server by default.

**Decision.** Each repo has a `Dockerfile` and `.github/workflows/docker-publish.yml` that builds and pushes to GHCR on push to `main` (tags `latest` + short SHA, GHA build cache). The server `docker compose pull && up -d`.

**Consequences.** Clean, cacheable CI builds; SHA tags enable rollback. The `website` package is PUBLIC (server pulls with no auth); the `cms` package is PRIVATE (see ADR-008). CI does not run tests/lint (see [Testing](./04-testing-strategy.md)).

## ADR-003 Host nginx as the single front proxy (Caddy retired)
**Status:** Accepted

**Context.** The VPS is **shared** with several unrelated production apps (coteug.com, blogs.coteug.com, agribzug.com, rentals.coteug.com, mbcrc.org, nchug.org, tasye.com, portainer). A per-stack reverse proxy would conflict with the host's existing TLS/routing.

**Decision.** A single **host nginx** (TLS via certbot) fronts everything and routes by path: `/api/analytics` + `/api/revalidate` → `web:3000`, Strapi paths (`/admin`, `/api`, `/uploads`) → `cms:1337`, everything else → `web`. The previously-considered `caddy` compose service is **retired/commented out**. `web` publishes only on `127.0.0.1:3000`.

**Consequences.** One place for TLS and routing; no port collisions with the other tenants. The nginx vhost lives on the server (not in either repo — `TODO/UNVERIFIED`, capture during handover). The repo `deploy/docker-compose.yml` still shows `web` on host port 80 and bare-IP URLs; this is **drift** from the live nginx-fronted setup (see [Known issues](./15-known-issues-tech-debt.md)).

## ADR-004 Consent-first first-party analytics
**Status:** Accepted

**Context.** GDPR/PECR require consent before non-essential tracking; third-party analytics (e.g. GA) add cookies, data-sharing, and a consent burden.

**Decision.** Build a first-party tracker (`lib/analytics/tracker.ts`) that only initialises **after** explicit analytics consent, honours GPC/DNT, batches via `sendBeacon` to a same-origin proxy (`app/api/analytics/route.ts`), which forwards to the CMS collect endpoint. No third-party scripts; the only pre-consent cookie is `ia_consent`.

**Consequences.** Strong privacy posture and full data ownership. Custom code to maintain. Bots are scored server-side; dashboards can exclude them. See [Frontend/analytics guide](./05-frontend-analytics-guide.md) and [Security & privacy](./14-security-and-privacy.md).

## ADR-005 geoip-lite for offline geo
**Status:** Accepted

**Context.** Coarse visitor geography (country/region/city) is useful, but calling an external geo API would add latency, a third-party data flow, and a dependency on the network from inside the request path.

**Decision.** Use `geoip-lite` (bundled offline GeoLite2 data) for an in-process lookup (`utils/analytics/geo.ts`). Private/loopback ranges are skipped. No external API call.

**Consequences.** Zero network dependency and no PII leaving the host for geo. The bundled GeoLite2 database ages — periodically rebuild the CMS image to refresh it (`TODO/UNVERIFIED`: no automated geoip data refresh is configured).

## ADR-006 Salted, truncated IP hashing
**Status:** Accepted

**Context.** Sessions/abuse need rough de-duplication, but storing raw IPs is PII and a liability.

**Decision.** `utils/analytics/ip.ts`: truncate the IP (IPv4 → /24, IPv6 → /48), then store `SHA-256(truncated|salt)[:32]` as `ipHash` (a `private` field). The raw IP is used only transiently for geo, then discarded. Salt is `ANALYTICS_IP_SALT`.

**Consequences.** No raw IP at rest; rate-limiting and coarse dedup keyed on `ipHash`. The hash is not reversible but is stable per /24 (or /48) + salt; rotating the salt breaks continuity (acceptable). Default salt must be overridden in production (the code warns if unset).

## ADR-007 Static-vs-CMS page rendering (and the fallback issue)
**Status:** Accepted (with a known defect)

**Context.** Content should be CMS-editable, but the site must always render even if the CMS is down or a page document is missing.

**Decision.** Two rendering tiers:
- **Static TSX**: the homepage (`app/page.tsx`) and legal pages (`privacy`, `cookies`, `terms`, `modern-slavery`, `contact`) are coded in TSX. The home page DOES read live CMS data for corridors + blog posts; legal pages read CMS *metadata* only (`lib/cms/legal.ts`), body stays in TSX.
- **CMS-or-fallback**: the sub-pages (`approach`, `employers`, `governments`, `join`, `workers`) call `getPage(slug)` (`lib/cms/pages.ts`); if a Page document is returned, render `<DynamicZoneRenderer>`; otherwise render an inline TSX fallback.

**Consequences / known defect.** In production these sub-pages currently render the **TSX fallback** because `getPage`'s fully-populated Strapi v5 query returns null / throws (the `populate[sections][on][...]` fragment in `lib/cms/pages.ts` likely needs fixing). The CMS Page documents + content exist (seeded by `seed-content.ts`) but aren't displayed. So today the live site is effectively static/code-driven. Tracked in [Known issues](./15-known-issues-tech-debt.md); editing guidance in [Content flow](./09-content-flow-and-editing.md).

## ADR-008 On-server build workaround for the private CMS package
**Status:** Accepted

**Context.** The `cms` GHCR package is PRIVATE. The shared VPS pulls images; a private package requires a GHCR PAT login (`read:packages`) on the host. When that login isn't available, `docker compose pull` of the CMS image fails.

**Decision.** The CMS can be **built on-host** when the image can't be pulled (the repo ships a `Dockerfile`; the server has Docker + Buildx). The `website` package stays PUBLIC so it always pulls cleanly.

**Consequences.** Deploys are resilient to GHCR auth gaps for the CMS, at the cost of a slower on-host build and build deps on the server. Friction documented in [Known issues](./15-known-issues-tech-debt.md); making the package public (or scripting the PAT login) would remove it.
