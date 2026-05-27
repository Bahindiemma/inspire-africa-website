# Glossary

> Purpose: domain + technical terms used across INSPIRE AFRICA.
> Last reviewed: 2026-05-27 (commit 49a621a)

| Term | Meaning |
|---|---|
| **Corridor** | A destination country/route INSPIRE AFRICA operates (e.g. UK, EU, Gulf). Content type `api::corridor.corridor`; rendered in the homepage marquee. |
| **Dynamic zone** | Strapi's flexible content field: a page's `sections` is an ordered list of typed components (hero, feature-list, etc.), rendered by `DynamicZoneRenderer`. |
| **`getPage(slug)`** | Website helper (`lib/cms/pages.ts`) that fetches a CMS Page with its dynamic zone populated; returns `null` → the page renders its static TSX fallback (see [Known issues](./15-known-issues-tech-debt.md)). |
| **Static TSX fallback** | The inline JSX a sub-page renders when `getPage` returns null. Currently what the live sub-pages display. |
| **ISR** | Next.js Incremental Static Regeneration — pages are cached and revalidated (here via `fetch` `revalidate`/`tags` + the publish webhook). |
| **Revalidate webhook** | CMS → `web:3000/api/revalidate?secret=…` on publish, busting the relevant ISR cache (`revalidateTag`/`revalidatePath`). |
| **Rollup** | A pre-aggregated daily analytics summary (`analytics-daily-rollup`) built by the nightly cron so the dashboard never scans raw events. |
| **`ipHash`** | A salted, truncated SHA-256 of the visitor IP (raw IP never stored). Used for coarse de-dup/rate-limiting only. |
| **Reseed / `RESEED_CONTENT`** | `seed-content.ts` normally skips when content exists; setting `RESEED_CONTENT=true` forces it to re-apply seed content (upsert-by-slug, no deletes). |
| **Seeder** | Idempotent bootstrap scripts (`src/bootstrap/*`) that create roles, the public API token, and content on CMS boot. |
| **Consent level** | `necessary` / `analytics` / `all` — drives which tracking runs (stored in the `ia_consent` cookie). |
| **GPC / DNT** | Global Privacy Control / Do-Not-Track browser signals — honoured as an opt-out default. |
| **IRIS** | The IOM's International Recruitment Integrity System — an ethical-recruitment standard referenced in copy. |
| **Earn-Learn-Return** | The circular-migration model: skills, capital and opportunity flow back into African economies over time. |
| **GHCR** | GitHub Container Registry (`ghcr.io`) — where the `web` (public) and `cms` (private) Docker images are published by CI. |
| **U&P** | Strapi's Users-&-Permissions plugin (end-user auth + role-based API access), distinct from admin-panel roles. |
| **The stack** | The `inspire-africa` Docker Compose project at `/opt/inspire-africa` (`db`, `cms`, `web`) on the shared Contabo VPS, behind host nginx. |
