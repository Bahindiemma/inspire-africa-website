# 18 — CMS-Only Images Cutover (AI prompt set)

**Goal:** the live site serves images **only** from the Inspire Africa Strapi Media Library. All bundled `/images/*` static fallbacks are removed from the Next.js app.

This doc holds three coordinated, copy-pasteable AI prompts plus how they fit together. **Run them CMS-first, gated** (see Prompt C — the runbook). Never strip the website fallbacks until the CMS is proven to serve a real image for every placement.

- Website repo (Next.js): `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`
- CMS repo (Strapi v5): `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms`

**Execution order:** Prompt A (CMS) → verify live with fallbacks still present → Prompt B (website) → deploy. Prompt C orchestrates this with explicit gates and rollback.

Related: [`17-cms-full-sync-migration.md`](17-cms-full-sync-migration.md), [`12-deployment-runbook.md`](12-deployment-runbook.md).

---

## Prompt A — CMS: guarantee every placement has a PUBLISHED Media Library asset

```markdown
# Task: Guarantee every site image placement is backed by a PUBLISHED Strapi Media Library asset

## Context
- CMS repo (Strapi v5): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms
- Website repo (Next.js): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE — it is being changed to consume images **only** from this CMS (all bundled /images/* static fallbacks are being deleted there). After that change, **any placement whose Strapi `photo`/`heroImage` relation is empty or unpublished will render blank on the live site.** This task makes sure that can't happen.
- How imagery is wired today (src/bootstrap/):
  - seed-media.ts: `seedAllMedia()` uploads everything under public/seed-media/** into the Media Library, keyed by /images/<rel>. `collectPhotoUrls()` + `attachSectionPhotos()` attach a `photo` media id to hero/audience-card sections wherever a `photoUrl` key maps to an uploaded file. Blog `heroImage` is set from the slug→image map. `uploadOnce()` REPLACES an existing file's binary on reseed (keeps id + relations).
  - seed-content.ts: each placement carries a `photoUrl: '/images/...'` literal — this is the **seed-time lookup key** used to find/attach the Media Library file. It is NOT meant to be the runtime image source.
- Reseed guard: `seedContent` SKIPS entirely when site-settings already exist, so reseeding requires `RESEED_CONTENT=true` and a CMS restart.

## Objective
1. Ensure **every** image-bearing placement on every content type ends a (re)seed with a populated `photo`/`heroImage` relation pointing at a real Media Library file that returns HTTP 200.
2. Ensure those entities (and their media) are **published** and **publicly readable** by the website (the public API token / public role), so `photo.url` actually reaches the frontend.
3. Make the seeders **fail loud** (warn/log + summary) for any placement left without a media relation, so blanks are caught before deploy — never silently fall through to a dead `photoUrl`.
4. Keep `photoUrl` in seed-content.ts (it's the lookup key) but treat it as build-time-only; the runtime source of truth is the `photo`/`heroImage` relation.

## Placements that MUST end up with a media relation
Enumerate and verify each (don't assume the list is complete — grep for every media field across all content types):
- Home page: hero `photo`, 3 audience cards `photo` (home-hero-healthcare, home-card-{workers-construction,employers-hospitality,governments-agriculture}), plus any final-cta/section media.
- Sub-page heroes: workers, employers, governments, approach, join (*-hero-*.jpg) — `heroImage`/`photo`.
- Blog posts: `heroImage` for every published post (pa-uk-visa, ilo-minimum-wages-africa, gulf-corridor-rebar, and any others).
- Any other content type with an image/media field (corridor, site-setting logo/OG, legal-document, components in the dynamic zone). Run: `grep -rn "media\|photo\|image\|heroImage" src/api src/components` and check each schema with "type": "media".

## Tasks
1. **Seed coverage audit (code):** In seed-media.ts/seed-content.ts, confirm `seedAllMedia()` + `attachSectionPhotos()` (and the blog `heroImage` wiring at the heroId assignment) cover every placement above. Add wiring for any media field currently left on photoUrl-only with no `photo` attachment.
2. **Fail-loud guard:** After attaching, log a per-placement summary and emit strapi.log.error/warn for any placement where the relation is still null (e.g. `[seed-media] MISSING photo for home/hero`). Add a final line like `[seed-media] N/M placements have a published media relation`. The reseed log must make a gap obvious.
3. **Publish state:** Ensure seeded pages/blog posts are created/updated in the **published** state (Strapi v5 status: 'published' / publishedAt set), and that the attached media is the one served on the published version. A relation that exists only on the draft will not render.
4. **Public access:** Verify the Strapi **public role** (or the API token the website uses, STRAPI_PUBLIC_TOKEN) has find/findOne on the upload plugin and on each content type, and that /uploads/* is publicly reachable at STRAPI_MEDIA_URL. Confirm the upload provider is local and the files exist on the mounted volume.
5. **API populate:** Confirm the controllers/route configs return the media relation (populate photo, heroImage, nested component media) so the website receives a non-null photo.url. Add/repair populate if a media field is being stripped from the response.
6. **No dead binaries:** Confirm public/seed-media/** contains the correct, distinct images (post the recent branding-swap revert) and that `uploadOnce()`'s replace-on-reseed path will overwrite any stale binaries already in the live Media Library.

## Reseed + verify (run against a CMS instance)
1. RESEED_CONTENT=true reseed (locally or on the VPS /opt/inspire-africa, SSH :2021 2FA): `docker compose up -d --force-recreate cms` with the env set, then re-up without it.
2. Watch logs and confirm: `[seed-media] Media Library has N seeded images`, `[seed-media] replaced …` for each swapped image, the new per-placement coverage summary with **zero MISSING**, and `[seed-content] DONE`.
3. Query the public API for each page/blog and assert photo.url / heroImage.url is present and absolute-resolvable:
   - e.g. GET {STRAPI}/api/pages?filters[slug][$eq]=home&populate=deep (or the project's populate) → hero + cards have photo.data with a url.
   - curl -I {STRAPI_MEDIA_URL}{photo.url} → 200 for every placement.
4. Confirm the revalidate webhook (src/middlewares/revalidate-frontend.ts) fired (or trigger POST /api/revalidate on the web app) so the site picks up the media immediately.

## Verification checklist (all must pass)
- [ ] Every placement in the list above (and any media field found via grep) has a non-null, published photo/heroImage relation after reseed.
- [ ] curl -I returns 200 for each placement's media URL via STRAPI_MEDIA_URL.
- [ ] Reseed log shows the coverage summary with **0 MISSING**.
- [ ] Public API (token/public role) returns the media URLs without auth errors.
- [ ] No placement depends on photoUrl: '/images/*' at runtime (those files no longer exist on the website).

## Output
- Report: the full placement→media-id map after reseed, the reseed log coverage summary, the curl -I status for each placement, and any schema/permission/populate fixes made.
- Flag any placement that has no source image at all in public/seed-media/** (needs a real photo sourced before the website's fallback removal goes live).
- Do not commit/push or run the production reseed until the user approves.
```

---

## Prompt B — Website: delete static images, consume only from the CMS

```markdown
# Task: Make the Next.js site consume images ONLY from the Inspire Africa Strapi CMS

## Context
- Website repo (Next.js App Router): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE
- CMS (Strapi): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms — already seeds every site image into the Strapi **Media Library** via src/bootstrap/seed-media.ts. The CMS is the single source of truth for imagery.
- Today the website still ships **static fallback images** in public/images/ and the code falls back to them whenever a Strapi media URL is missing. These were kept as "dormant safety nets." The boss wants them gone: the site must **always** pull images from the CMS, never from bundled static copies.

## Objective
1. **Permanently delete** all bundled site/content images from the Next.js app.
2. **Remove every /images/* fallback code path** so images resolve exclusively from Strapi (photo.url / heroImage.url made absolute via strapiMedia()).
3. Ensure that when a CMS image is genuinely absent, the site degrades gracefully (render nothing / a neutral placeholder) — NOT a bundled photo.
4. Keep the build green and produce zero remaining references to /images/.

## Files to delete (content imagery)
- public/images/*.jpg — all 9 site photos: home-hero-healthcare, home-card-workers-construction, home-card-employers-hospitality, home-card-governments-agriculture, workers-hero-nurse, employers-hero-kitchen, governments-hero-market, approach-hero-tailor, join-hero-construction-team.
- public/images/blog/*.jpg — pa-uk-visa, ilo-minimum-wages-africa, gulf-corridor-rebar.
- Remove the now-empty public/images/ directory.

## Code to update (remove static fallbacks; CMS becomes the only source)
- lib/cms/blogs.ts: delete the HERO_FALLBACK_BY_SLUG map and the fallback chain `strapiMedia(s.heroImage?.url) ?? fallback?.url ?? '/images/home-hero-healthcare.jpg'`. Result: `heroImage = strapiMedia(s.heroImage?.url)` (may be null). Update heroAlt accordingly.
- lib/cms/media.ts → strapiMedia(): remove the branch that returns /images/ and /nhs paths untouched (those local assets no longer exist). Keep only: pass-through for absolute http(s):// URLs, and prefixing of Strapi-relative /uploads/... (and other relative) paths with MEDIA_ORIGIN.
- components/cms/DynamicZoneRenderer.tsx: where it resolves `photo?.url ?? photoUrl`, drop any /images/* literal/photoUrl static fallback so it relies on the Strapi photo.url only; render the image element only when a CMS URL exists.
- Sub-page route files app/{workers,employers,governments,approach,join}/page.tsx and app/page.tsx: remove inline /images/* literals and any static photoUrl defaults used as hero/card fallbacks. (Note: the 5 sub-pages + homepage render from the CMS getPage(slug) doc; strip the dead static image fallbacks.)
- lib/blogs.ts and lib/seo.ts: remove /images/* references. For lib/seo.ts (OG/Twitter image), see decisions below.
- Search the whole repo and eliminate every remaining occurrence: `grep -rn "/images/" app lib components` must return nothing.

## Decisions to confirm with the user before deleting (do NOT assume)
These are **brand/meta** assets, not content photos — list them and ask whether they also move to the CMS or stay bundled:
- public/inspire-africa-logo.png and public/inspire-africa-logo.jpg (header/footer logo, referenced in app/layout.tsx).
- Favicon / app/icon.* / apple-icon.* if present.
- The default Open Graph / Twitter social-share image in lib/seo.ts (metadataBase/openGraph.images). Crawlers need an absolute, always-available URL; a missing OG image is a real SEO regression. Recommend either pointing it at a stable CMS Media Library URL or keeping a single bundled og-default — get the user's call.

## Required CMS-source guarantees (verify, don't just assume)
- next.config.mjs images.remotePatterns must allow the Strapi media origin (host/port/protocol) so next/image can load /uploads/*. Add it if missing.
- Env: STRAPI_MEDIA_URL (browser-reachable Strapi media origin) must be set in every environment; STRAPI_BASE_URL is the fallback origin. Document this; the site cannot serve CMS images without it.
- Confirm isStrapiAvailable() / the public token (STRAPI_PUBLIC_TOKEN) path is live so pages actually read CMS data rather than the (now-removed) static fallbacks.

## Graceful-degradation rule
With fallbacks gone, every <Image>/<img> that previously had a static default must:
- render **nothing** (conditionally skip the element), or
- render a neutral CSS placeholder (solid brand color / blur), never a bundled photo.
Pick one consistent approach and apply it everywhere a CMS image can be null.

## Verification (all must pass)
1. `grep -rn "/images/" app lib components` → **no matches** (except any explicitly-approved brand/OG asset).
2. `git status` shows the public/images/** files deleted.
3. `npx tsc --noEmit` passes.
4. `next build` completes (all routes) with no broken-image type errors.
5. Manually/visually: with Strapi reachable, homepage hero + 3 audience cards + the 5 sub-page heroes + blog heroes all load from …/uploads/* (CMS), confirmed via the network panel — not /images/*.
6. With Strapi unreachable, pages still render (no crash); image slots show the chosen placeholder, never an old bundled photo.

## Output
- Make the edits, delete the files, and run the verification.
- Report: list of deleted files, list of code edits, grep result, build result, and the brand/OG-asset decisions still pending user confirmation.
- Do not commit or push until the user approves the diff.
```

---

## Prompt C — Runbook: orchestrate the cutover in the correct, gated order

```markdown
# Task: Orchestrate the "CMS-only images" cutover across the CMS and website — in the correct, gated order

## Context
- Two repos:
  - CMS (Strapi): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms
  - Website (Next.js): /Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE
- Goal of the overall change: the live site serves images **only** from the Strapi Media Library; all bundled /images/* static fallbacks are removed from the website.
- You are running TWO prepared prompts:
  - **Prompt A (CMS):** guarantees every placement has a published, publicly-readable Media Library image (fail-loud coverage guard).
  - **Prompt B (Website):** deletes public/images/** and removes every /images/* fallback code path.
- **Hard rule — order matters:** the CMS must be proven to serve a real image for every placement *before* the website's safety-net fallbacks are removed. If B ships first (or A isn't verified), any gap renders a **blank** on the live site. So: **CMS first, verified, then website.**
- Deploy environment (from project runbook): VPS at /opt/inspire-africa, ssh -p 2021 (2FA). Images are built by CI → GHCR (ghcr.io/bahindiemma/...). Deploy via docker compose pull && up -d. Web app exposes POST /api/revalidate?secret=$REVALIDATE_SECRET for instant ISR busting. Required env: web STRAPI_MEDIA_URL (browser-reachable Strapi media origin) + STRAPI_PUBLIC_TOKEN; CMS FRONTEND_REVALIDATE_URL + matching REVALIDATE_SECRET.

## Objective
Execute the cutover as a gated sequence where each phase has an explicit PASS condition that must be met before the next phase begins. Never advance on an unverified phase. Provide rollback at every step.

## Phase 0 — Pre-flight (no changes yet)
1. Confirm git status clean in both repos; note current main HEAD commit in each (these are your rollback targets).
2. Confirm public/seed-media/** in the CMS holds the correct, distinct images (post branding-swap revert) — no duplicate/degraded files.
3. Confirm required env is present in every environment: web STRAPI_MEDIA_URL, STRAPI_PUBLIC_TOKEN; CMS FRONTEND_REVALIDATE_URL, REVALIDATE_SECRET; next.config.mjs remotePatterns allows the Strapi media origin.
4. Confirm the brand/OG/favicon decision from Prompt B (logo, social-share image) is RESOLVED — those are explicitly excluded from deletion unless the user approved moving them to the CMS.
**GATE 0 (PASS to continue):** clean trees, correct seed images, env present, brand-asset decision made. If any fail → stop and report.

## Phase 1 — CMS changes (run Prompt A), staging/local verify
1. Apply Prompt A in the CMS repo. Run a local/staging reseed (RESEED_CONTENT=true).
2. Verify the reseed log coverage summary shows **0 MISSING** and [seed-content] DONE.
3. For every placement, curl -I {STRAPI_MEDIA_URL}{photo.url} → 200; public API returns non-null media URLs without auth.
**GATE 1 (PASS):** every placement resolves to a 200 image via the public API. If any MISSING/404 → fix or source the image; do NOT proceed.

## Phase 2 — Ship CMS to production, reseed, verify LIVE
1. Get user approval for the CMS diff. Commit + push CMS main. Wait for CI to build/push the cms image to GHCR.
2. On the VPS (/opt/inspire-africa, SSH :2021):
   docker compose pull cms
   RESEED_CONTENT=true docker compose up -d --force-recreate cms
   docker compose logs -f cms      # PASS: [seed-media] replaced … , coverage 0 MISSING, [seed-content] DONE
   docker compose up -d cms        # re-up WITHOUT reseed env
3. Bust cache: curl -X POST "https://inspireafricans.com/api/revalidate?secret=$REVALIDATE_SECRET" -d '{"collection":"site-setting"}'.
4. **Verify LIVE while fallbacks still exist** (this is the safety window): load the homepage, 5 sub-pages, and blog — every image must now load from …/uploads/* (CMS), confirmed in the browser network panel. Because the website still has fallbacks, a CMS gap here shows the old static image (not a blank) — so this is where you catch any remaining gap harmlessly.
**GATE 2 (PASS):** live site serves CMS /uploads/* for ALL placements; zero placements still falling back to /images/*. If ANY placement still shows a static fallback → the CMS is not fully covered → fix CMS and re-verify before touching the website. Do NOT proceed.

## Phase 3 — Website changes (run Prompt B), build + verify
1. Only after GATE 2 passes: apply Prompt B in the website repo (delete public/images/**, remove /images/* fallbacks).
2. grep -rn "/images/" app lib components → no matches (except approved brand/OG asset). npx tsc --noEmit and next build pass.
3. Local/preview run against production Strapi: all images load from CMS; with Strapi forced unreachable, pages render with the neutral placeholder (never a bundled photo, never a crash).
**GATE 3 (PASS):** clean grep, green build, CMS-sourced images render, graceful degradation confirmed.

## Phase 4 — Ship website to production
1. Get user approval for the website diff. Commit + push web main. Wait for CI → GHCR web image.
2. On the VPS: docker compose pull web && docker compose up -d web.
3. Revalidate if needed; verify LIVE: homepage + 5 sub-pages + blog all serve CMS /uploads/*; view-source / network shows no /images/* content requests.
**GATE 4 (PASS):** production site serves images exclusively from the CMS; no 404s; no blanks.

## Rollback (per phase)
- **CMS bad after Phase 2:** git revert the CMS commit (or redeploy the prior GHCR cms tag) + reseed; the website still has fallbacks so the site stays intact meanwhile.
- **Website bad after Phase 4:** redeploy the previous GHCR web image (docker compose pull web of the prior tag / up -d) — this restores the bundled fallbacks instantly. Then fix forward.
- Always keep the Phase 0 HEAD commits noted as the known-good rollback targets.

## Output
- A phase-by-phase log: what ran, the PASS/FAIL of each GATE with evidence (reseed coverage summary, curl -I codes, network-panel origins), commit hashes pushed, and deploy confirmations.
- Stop and report at the first failed gate rather than proceeding.
- Never run a production reseed or deploy, or push to main, without explicit user approval at Phase 2 and Phase 4.
```
