# Known Issues, Tech Debt & Roadmap

> Purpose: the honest list of what's broken, drifting, or unverified — and what to do about it.
> Last reviewed: 2026-05-27 (commit 49a621a)

## High priority

### 1. CMS-driven sub-pages render the static TSX fallback (CMS content is inert)
`app/{approach,employers,governments,join,workers}/page.tsx` do `const page = await getPage(slug); if (page) return <DynamicZoneRenderer>; …fallback`. In production `getPage()` (`lib/cms/pages.ts`) returns `null`, so the **inline TSX fallback** renders — the seeded CMS Page documents are never displayed. Confirmed empirically (live pages show TSX strings; CMS API has the new strings).
- **Likely cause:** the fully-populated Strapi v5 query (`populate[sections][on][sections.*]…`) 400s or mismatches a component path → `strapiFetch` throws → `getPage` catches → `null`. Less likely: token/env wiring.
- **Impact:** editors can't change sub-page copy via the CMS; all copy edits currently require a code change + web rebuild (this is why the CEO edits were applied to **both** the TSX and the CMS seed).
- **Fix:** debug the populate fragment against the live CMS (`curl -g` with `STRAPI_PUBLIC_TOKEN`), correct it, confirm `DynamicZoneRenderer` handles every section type, then re-enable CMS rendering.

### 2. Repo ↔ live compose/env drift
`deploy/docker-compose.yml` + `deploy/.env.production.example` reflect the **old bare-IP / host-port-80** layout, not the live **nginx-fronted** setup (`web` on `127.0.0.1:3000`, HTTPS `inspireafricans.com` values, `caddy` retired, analytics + `RESEED_CONTENT` env added on the server). The live `/opt/inspire-africa/{docker-compose.yml,.env}` is the source of truth. **Reconcile the repo file with the live file**, and ideally version the nginx vhost + Caddyfile-history + `.env.example` together.

### 3. `cms` GHCR package is PRIVATE
The server can't `docker compose pull cms` without a `read:packages` login, forcing on-host CMS builds (~45 min on the VPS). **Fix:** make the `inspire-africa-cms` package public (the `inspire-africa-website` package already is) **or** store a long-lived `read:packages` PAT via `docker login ghcr.io` on the server.

## Medium priority

- **nginx vhost + certbot config live only on the server**, not in any repo — capture them into a `server-config` repo (or this `docs/` folder) so the routing/TLS isn't bus-factor-1.
- **CMS findings** (see CMS repo `docs/known-issues.md`): `config/database.ts` defaults `DATABASE_CLIENT` to **postgres** (prod overrides to mysql — fragile); the custom `form-submission.create` controller returns **200** but `scripts/smoke-test.sh` asserts **201** (smoke test will fail); `seed-content.ts` seeds **6** corridors but logs "7"; the CMS `.env.example` is missing the analytics vars, `RESEED_CONTENT`, `CRON_ENABLED`, `IS_PROXIED`.
- **No automated geoip refresh**: `geoip-lite`'s bundled DB ages; schedule a periodic `npm run updatedb` + image rebuild if geo precision matters.
- **Tests**: no unit/integration/e2e suite (see [Testing strategy](./04-testing-strategy.md)). Lint is decoupled from the build.

## CEO web-edits — outstanding (need assets / decisions)
- **Imagery (deck S6/S8):** real client photos + post-relevant blog imagery (e.g. ILO logo on ILO posts).
- **Modern Slavery statement (S15):** "WorkMax Africa Ltd" + financial-year wording — needs legal sign-off (financial year is legally required; WorkMax looks like template residue).
- **WhatsApp contact (S14/S22):** swap the phone CTA to WhatsApp once the 24/7 line/SIM + auto-replies exist.

## Roadmap
1. Fix #1 so the CMS actually drives the sub-pages (unlocks no-code editing).
2. Reconcile #2 and resolve #3 (clean deploys via GHCR pull).
3. Analytics dashboard v2: country **choropleth map**, **conversion funnel** (pageview→section→form_start→form_submit), activity **heatmap**, new-vs-returning, UTM performance (see CMS `docs/analytics.md`).
4. Add a test suite + CI test gate; fix the smoke-test status mismatch.
