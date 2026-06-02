# 17 · Full CMS sync migration (homepage, legal, contact)

**Status:** code complete on branch `cms-sync-migration` (web + cms). Not
yet deployed. This document is the deploy runbook + rationale.

## Why this change

A hero image changed in Strapi was not appearing on the site. Root causes:

1. **The homepage never read the CMS.** `app/page.tsx` was static TSX; it
   only fetched corridors + blog posts. The CMS `home` document existed
   but nothing rendered it.
2. **Uploaded images were ignored.** The hero/card renderer used
   `photoUrl ?? photo.url`, so the seed's `photoUrl` (a `/images/*` path)
   always beat an editor's uploaded Media Library `photo`.
3. **Relative media URLs broke.** Strapi returns `/uploads/x.jpg`; handed
   to `next/image` that resolves against the *Next* origin, not Strapi.

Instant sync itself was already wired: the CMS
`src/middlewares/revalidate-frontend.ts` lifecycle subscriber POSTs
`{ collection, slug, uid }` to the web app's `/api/revalidate` on every
create/update/delete of `page`, `legal-document`, `site-setting`,
`corridor`, `blog-post`, etc. So once the env vars below are set, a
**publish in Strapi revalidates the live page within seconds**.

## What changed

### Web (`INSPIRE AFRICA WEBSITE`)
- `lib/cms/media.ts` — `strapiMedia()` makes relative `/uploads` URLs absolute.
- `components/cms/DynamicZoneRenderer.tsx` — `photo.url ?? photoUrl`
  (uploads now win), routed through `strapiMedia`; implements the
  home-only sections (`audiences`, `corridors-marquee`, `insights-strip`).
- `app/page.tsx` — fetches `getPage('home')` and renders via the CMS
  renderer; falls back to the original static layout if Strapi is down.
- `components/legal/LegalBlocks.tsx` — renders the legal `body` dynamic
  zone (auto-numbered h2 TOC headings, rich-text AST, lists/tables/
  callouts) with `{{token}}` substitution for company details.
- `lib/cms/legal.ts` — fetches `body` + `tocAnchors`.
- `app/{privacy,terms,cookies,modern-slavery}/page.tsx` — render CMS body
  with static fallback.
- `app/contact/page.tsx` — hero + form intro from a CMS `contact` doc.
- `lib/cms/blogs.ts` — blog hero images routed through `strapiMedia`.
- `next.config.mjs` — `remotePatterns` derived from the Strapi origin +
  https/domain/localhost media hosts.

### CMS (`inspire-africa-cms`)
- `src/components/cards/audience-card.json` — add `photoUrl` fallback.
- `src/bootstrap/legal-bodies.ts` — verbatim block bodies for all 4 legal docs.
- `src/bootstrap/seed-content.ts` — faithful `home` doc (hero photo,
  audience cards, Numbers "Proof" section, insights, final-CTA), legal
  bodies merged into the legal upsert, new `contact` page doc.

### `{{tokens}}` available in legal text
`legalName`, `companyNumber`, `addressStreet`, `addressCity`,
`addressPostalCode`, `addressCountry`, `addressFull`, `email`,
`legalEmail`, `speakupEmail`, `whatsapp`, `whatsappDigits`, `whatsappLink`.
These substitute from the CMS `site-setting`, so company details stay a
single source of truth.

## Required environment variables

**Web app (.env on VPS):**
- `STRAPI_BASE_URL` — Strapi API origin (already set).
- `STRAPI_PUBLIC_TOKEN` — read token (already set).
- `REVALIDATE_SECRET` — must match the CMS value.
- `STRAPI_MEDIA_URL` — **new.** Public, browser-reachable media host that
  matches `remotePatterns`, e.g. `http://37.60.225.220:1337` or
  `https://cms.inspireafricans.com`. If unset it falls back to
  `STRAPI_BASE_URL`; set it explicitly if `STRAPI_BASE_URL` is an internal
  Docker host (e.g. `http://cms:1337`).

**CMS (.env on VPS) — for instant sync:**
- `FRONTEND_REVALIDATE_URL` — e.g. `https://inspireafricans.com/api/revalidate`.
- `REVALIDATE_SECRET` — must match the web value.

## Deploy order (IMPORTANT)

Production already has an OLD `home` document (no Numbers section, no hero
photo, slightly different audience copy). Once the web app is deployed it
will render that document — so the **CMS reseed and the web deploy must
land together**, or the homepage briefly regresses.

1. **CMS first:** rebuild the CMS image from `cms-sync-migration`, deploy
   with `RESEED_CONTENT=true`, watch logs for `[seed-content] DONE`, then
   restart without `RESEED_CONTENT`. This upserts the faithful home doc,
   the contact doc, and all legal bodies. (The new `audience-card.photoUrl`
   + `legal-document.body` fields are already in the schema; a schema sync
   runs on boot.)
2. **Set env vars:** add `STRAPI_MEDIA_URL` to the web `.env`; confirm
   `FRONTEND_REVALIDATE_URL` + `REVALIDATE_SECRET` on the CMS.
3. **Web second:** merge `cms-sync-migration` → `main`, let CI build, then
   `docker compose pull web && up -d web`.

## Verification

- Home, /privacy, /terms, /cookies, /modern-slavery, /contact render
  identically to before (CMS now drives them).
- In Strapi admin, change the home hero image (upload to the `photo`
  field) and **Publish** → the homepage updates within seconds (webhook),
  not after the 60s ISR window.
- Edit a legal version/date or a paragraph → publish → page updates.
- Change the company address in `site-setting` → every legal page's
  interpolated address updates (token substitution).

## Notes / follow-ups

- Audience-card and hero images still use `photoUrl` (`/images/*`) as a
  seed fallback; uploading to the `photo` field in admin now overrides
  them. To fully move images into the Media Library, upload each and clear
  `photoUrl`.
- The legal pages keep their in-repo JSX as a fallback (used only if the
  CMS body is empty/unreachable). Safe to remove once CMS rendering is
  confirmed in production.
