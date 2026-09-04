# Community Signup Capture

> Purpose: how the "Join the Community" funnel is measured and how member details reach the CMS.
> Last reviewed: 2026-08-03

## Table of contents
- [1. Why this exists](#1-why-this-exists)
- [2. The flow](#2-the-flow)
- [3. Data model](#3-data-model)
- [4. Endpoints](#4-endpoints)
- [5. Environment variables](#5-environment-variables)
- [6. Reporting](#6-reporting)
- [7. Privacy + retention](#7-privacy--retention)
- [8. Open questions / next steps](#8-open-questions--next-steps)

---

## 1. Why this exists

Before this feature, every "Join the Community" CTA was a direct outbound link to
`https://inspire-africa.mn.co/spaces/20105635`. The only signal was the anonymous
`outbound_click` analytics event, which:

1. is suppressed entirely for visitors who decline analytics cookies,
2. carries no identity — we knew *a* click happened, not who,
3. is fired with `sendBeacon` on a link that immediately navigates away (lossy),
4. never tells us whether the click became a member.

Three requirements followed:

- **R1 Attribution** — count every intent-to-join click, per source, independent of consent.
- **R2 Data ownership** — hold name / email / phone in our own CMS, not only in Mighty Networks.
- **R3 Funnel truth** — measure click → submit → handoff.

## 2. The flow

```
CTA (any page)                  → /join/start?source=workers_hero&utm_*
  buildJoinGateUrl() in lib/utm.ts, prefetch={false}

/join/start  (Server Component, force-dynamic)
  ├─ isPrefetch(headers)?  yes → render only, record nothing
  └─ no  → POST /api/community/track      → row: status=Clicked      ← R1
           renders <CommunitySignupForm clickId=…>

form submit (Server Action, app/join/start/actions.ts)
  ├─ POST /api/community/submit           → row: status=Submitted    ← R2
  ├─ POST /api/community/redirect         → row: status=RedirectedToMN
  └─ redirect(303) → buildJoinUrl(communityBaseUrl) — Mighty Networks, autojoin=1 + UTM
```

Key properties:

- **The click is recorded server-side on page render**, so it works with cookies declined,
  JavaScript off, and an ad-blocker installed. This is what makes R1 real.
- **A prefetch is not a click.** `<Link>` prefetches on hover and in the viewport. Every gate CTA
  passes `prefetch={false}`, and `/join/start` additionally checks `next-router-prefetch`,
  `x-middleware-prefetch` and `sec-purpose`. Without both guards the click count inflates by
  roughly an order of magnitude.
- **The form works without JavaScript.** It is a Server Action, not a `fetch()` handler, precisely
  so the no-JS path redirects correctly.
- **The gate fails open.** If the CMS is unreachable, the visitor is still redirected to Mighty
  Networks. We lose the lead; we never block the worker.

### 2.1 The invariant, and how it was broken

> **Nobody reaches Mighty Networks except through `/join/start`.**
> `app/join/continue/route.ts` is the one place in the codebase allowed to send a visitor to the
> community host.

**Incident, 2026-09-04.** The CEO reported that "Join the Community" skipped our signup page and
landed on `inspire-africa.mn.co/sign_up?auto_join=true&from=…&space_id=20105633`. Every CTA written
in TSX was correct and had been since `17424e7`. The bad links were **CMS data**: four
editor-authored CTAs (home page hero + final CTA, `/join` hero + final CTA) held a Mighty Networks
URL that someone had pasted out of their address bar. `space_id=20105633` is MN's own default
space, not our `20105635` — the tell that this was copy-paste, not configuration.

The structural fault was that `DynamicZoneRenderer` and `SiteHeader` rendered editor-supplied
`href` strings verbatim, and a CMS page silently overrides the correct static TSX beneath it. One
paste re-broke the funnel with no deploy and no review.

**The fix — one choke point.** `lib/utm.ts` now exports:

| Helper | Used for | Rewrites |
|---|---|---|
| `normalizeJoinHref(href, opts)` | nav items, secondary text links | community host only — `/join` stays reachable |
| `normalizeJoinCtaHref(href, opts)` | buttons (hero CTAs, final CTA, nav CTA) | community host **and** `/join` |
| `isCommunityHref(href)` | the host test | matches on hostname, so `mn.co.uk` is not caught |
| `isJoinGateHref(href)` | forcing `prefetch={false}` on rewritten links | — |

Every href that originates outside the codebase passes through one of these:
`components/cms/DynamicZoneRenderer.tsx` (hero `ctas[]`, `final-cta` `primaryCta` and
`secondaryLinks[]`, audience-card `ctaHref`) and `components/layout/SiteHeader.tsx` (Strapi
Navigation `headerLinks`). Attribution is preserved: an editor's `utmSource` on the `shared.cta`
component is used when set, otherwise the source names the section (`cms_hero`, `cms_final_cta`,
`header_nav_cta`, …).

**Guards.** Two, because the source scan alone would not have caught this:

```bash
npm run smoke:join                                    # source scan only (also runs as `prebuild`)
npm run smoke:join -- https://inspireafricans.com     # + fetches the live pages and checks hrefs
```

`scripts/assert-join-gate.mjs` fails the build on a community host literal anywhere under `app/`,
`components/` or `lib/` outside the allowlist, and — given a URL — fails on any rendered `href` to
the community host. `eslint.config.mjs` carries the same rule as `no-restricted-syntax` so it
surfaces while you type. Verified 2026-09-04 by poisoning every `Join*` CTA and nav link in a local
Strapi with the CEO's exact URL: 15 prerendered pages, zero community links, every join button
resolving to `/join/start`.

### 2.2 Keeping the site in step with the CMS

Three separate mechanisms, because no single one covers every case:

| Trigger | Mechanism | Latency |
|---|---|---|
| Editor publishes an entry | Strapi lifecycle subscriber (`src/middlewares/revalidate-frontend.ts`) → `POST /api/revalidate` → `revalidateTag` + `revalidatePath` | instant |
| Editor replaces a file in the Media Library | same subscriber — `plugin::upload.file` is in the revalidatable set, mapped to a whole-layout refresh | instant |
| Anything missed, or a redeploy | `export const revalidate = 60` on every CMS-driven page | ≤ 60s |
| Redeploy | `deploy/redeploy-web.sh` revalidates and warms, then verifies | immediate |

Two traps worth knowing, both of which cost the site its photography in production:

- **A redeploy serves the image-less fallback.** CI builds the image in GitHub
  Actions, where the CMS is unreachable, so `getPage()` returns null and every
  page prerenders with the static TSX fallback — which ships no images. Nothing
  fails; the build is green. Always redeploy with `deploy/redeploy-web.sh`,
  which revalidates and then *checks*. The 60s window is the net under it.
- **A replaced image keeps its URL.** Strapi's "replace media" deliberately
  reuses the filename and hash, and `next/image` keys its optimised blob on the
  URL — so the optimiser serves the old bytes even after revalidation. Media
  URLs therefore carry `?v=<file updatedAt>` (`lib/cms/media.ts`), which gives a
  replaced file a new optimiser key. Confirm with:

  ```bash
  curl -s https://inspireafricans.com/ | grep -o '_next/image?url=[^"&]*' | head -3
  ```

  Every URL should carry `%3Fv%3D<epoch>`. If they don't, the page was rendered
  by a build that predates this, and needs revalidating.

## 3. Data model

`api::community-signup` (CMS repo, `src/api/community-signup/`). One row per click, upgraded in
place as the visitor progresses. `content-api.visible: false`, so it can never be granted to a
users-permissions role by accident, and the controller enforces `inspire-admin` on all core verbs.

| Status | Meaning |
|---|---|
| `Clicked` | CTA clicked; no PII yet |
| `Submitted` | Details captured |
| `RedirectedToMN` | Handed off to Mighty Networks |
| `MemberConfirmed` | Confirmed as an MN member — **not wired yet**, see §8 |
| `Duplicate` | Superseded by an existing row for the same email |
| `Spam` | Honeypot tripped |

Every identity field (`email`, `firstName`, `lastName`, `phone`, `passwordHash`, `ipHash`,
`userAgent`) is `"private": true` — excluded from content-API responses.

**The raw IP is never stored.** It is used transiently for rate limiting, then reduced to a salted,
truncated hash via the existing `utils/analytics/ip.ts` helper (IPv4 → /24, IPv6 → /48).

### Merge semantics

- **One row per email.** Resolved by explicit lookup, not a unique index, so a repeat submission is
  an UPDATE rather than a 500 the visitor sees. The response is identical either way — telling an
  unauthenticated caller "that email already exists" is account enumeration.
- **Sparse updates never erase.** `keepExisting()` strips null/empty values before an update, so a
  resubmission that omits the country does not wipe the country we already hold, and click-time
  attribution survives a submit payload that doesn't repeat it.
- **First touch wins** for `source` / `utm*` / `referrerHost` / `landingPath`: the campaign that
  earned the lead is the one that brought them in first, not wherever they resubmitted from.
- **Refreshes are folded.** Same `ipHash` + `source` within 30 minutes while still `Clicked`
  increments `attempts` instead of creating a new row.

## 4. Endpoints

All under `/api/community/*` (namespaced like `/api/analytics/collect` so they cannot collide with
the core router's `/community-signups/:id`).

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/community/track` | `global::is-signup-ingest` | 30/min per ipHash, burst 15 |
| POST | `/community/submit` | `global::is-signup-ingest` | 10/min per ipHash, burst 5 |
| POST | `/community/redirect` | `global::is-signup-ingest` | 204 always |
| GET | `/community/stats?days=30` | `global::is-signup-ingest` | funnel numbers, aggregate only |

**Why `stats` is token-gated rather than role-gated.** `src/bootstrap/seed-roles.ts` wipes the
Public role and grants it only `form-submission.create`. That also removes
`users-permissions.auth.callback`, so `POST /api/auth/local` returns **403** and no
users-permissions JWT can be issued at all unless `KEYCLOAK_ENABLED=true` (verified 2026-08-03).
A role-gated stats route would therefore be unreachable in every environment without Keycloak.

The response contains **no PII** — the handler selects only `status`, `source`, `utmCampaign`,
`clickedAt` and `botScore`. **If you ever extend that select, re-check this decision**: adding an
identity column would push PII past a route that is not role-gated. The PII itself stays admin-only
via the core router + `requireAdmin()`, which is unaffected.

`is-signup-ingest` is a **separate secret** from `ANALYTICS_INGEST_TOKEN` on purpose: the analytics
token is transmitted on every page view, and a leak of it must not be replayable against an
endpoint that writes PII. Constant-time compare, fails closed when unset.

The browser never calls these — the Next.js server holds the secret (`lib/cms/community.ts`).

## 5. Environment variables

CMS (`inspire-africa-cms/.env`):

| Var | Default | Purpose |
|---|---|---|
| `COMMUNITY_SIGNUP_TOKEN` | — | Shared secret. Fails closed if unset. |
| `ANALYTICS_IP_SALT` | placeholder | Reused for the signup ipHash. |
| `COMMUNITY_CLICK_RETENTION_MONTHS` | 14 | Clicked/Spam/Duplicate purge window. |
| `COMMUNITY_LEAD_RETENTION_MONTHS` | 36 | Submitted-onward purge window. |
| `COMMUNITY_SIGNUP_PASSWORD` | `off` | See §8. |

Website (`.env.local`):

| Var | Default | Purpose |
|---|---|---|
| `COMMUNITY_SIGNUP_URL` | falls back to `STRAPI_BASE_URL` | CMS origin |
| `COMMUNITY_SIGNUP_TOKEN` | — | Must match the CMS value |
| `COMMUNITY_SIGNUP_PASSWORD` | `off` | Renders the password field |

If either the URL or the token is unset, capture silently no-ops and the gate still redirects to
Mighty Networks — the site is never broken by missing config.

## 6. Reporting

`GET /api/community/stats?days=30` (admin) returns:

```json
{
  "windowDays": 30,
  "clicks": 412, "captured": 168, "conversionRate": 40.8,
  "redirected": 165, "memberConfirmed": 0, "botsExcluded": 37,
  "clicksBySource": { "workers_hero": 120, "footer": 88, … },
  "capturedBySource": { … }, "capturedByCampaign": { … }
}
```

Bots (`botScore >= 1`) and `Spam` rows are excluded from every number except `botsExcluded`.

Aggregation is on demand rather than a nightly rollup: these are leads, not pageviews, and the
volume does not justify a rollup table. **If this exceeds ~100k rows, move it to a nightly rollup**
like `analytics-daily-rollup` — the query is capped at 100k and would silently truncate beyond that.

Editors can also browse and CSV-export the collection in the Strapi admin.

## 7. Privacy + retention

Covered in `app/privacy/page.tsx` (§02 data we collect, §04 lawful basis, §05 sharing, §07
retention), `app/cookies/page.tsx` §05, and `app/terms/page.tsx` §04.

- **Lawful basis:** legitimate interests for the capture and the click measurement; **consent**
  (separate, unticked checkbox) for marketing email.
- **No cookie is set by the gate.** The `clickId` travels as a hidden form field, not a cookie —
  which is why the click log needs no cookie-consent banner interaction.
- **Retention:** 14 months for click rows (no PII), 36 months for lead rows. Both purge nightly in
  `src/crons/analytics-maintenance.ts`. **These numbers are stated in the privacy policy — change
  one, change the other.**

The legal pages render CMS `legal-document` content when it exists and fall back to the in-repo TSX
only when the body is empty. **Both have been updated** (TSX in the web repo, CMS bodies via
`inspire-africa-cms/src/bootstrap/legal-bodies.ts`, commit `dbf3136`) and the new wording is live.

### Updating legal copy in future

Legal text is compliance copy that must track what the code actually does, so it is version
controlled in `legal-bodies.ts` — not hand-edited in the admin UI, where it would drift from git.

To publish a change:

```bash
# 1. edit inspire-africa-cms/src/bootstrap/legal-bodies.ts, commit, push
# 2. rebuild the CMS image (see the deploy runbook)
# 3. on the server:
cd /opt/inspire-africa
RESEED_LEGAL=true docker compose up -d --force-recreate cms
#    wait for: "[bootstrap] RESEED_LEGAL=true — refreshing legal documents only."
#              "[seed-content] 4 legal documents upserted"
# 4. clear the flag so a later restart does not re-seed:
docker compose up -d --force-recreate cms
```

**Do NOT use `RESEED_CONTENT=true` for this.** That re-runs the whole seeder and rewrites every
page, discarding content edits made in the admin UI. `RESEED_LEGAL` exists precisely so legal text
can be updated independently — it calls `seedLegalDocuments()` and nothing else.

Verify against the rendered HTML, not the boot log — the legal pages are ISR-cached:

```bash
curl -s https://inspireafricans.com/privacy | grep -c "When you join the community"
```

## 8. Open questions / next steps

1. **Mighty Networks plan tier — blocking for `MemberConfirmed`.** Verified 2026-08-03: MN has no
   public REST API. Integration is via **Zapier, on the Scale plan and up**, with triggers
   including *member joins*, *requests to join*, *leaves*, *profile updated*. **SSO is Growth plan
   / Mighty Pro only.** Action: confirm which plan `inspire-africa.mn.co` is on. If Scale+, a
   Zapier zap can POST to a new `/community/confirm` endpoint keyed on email to close the loop.
   Until then `MemberConfirmed` will always read 0 — that is expected, not a bug.
2. **Prefill params are undocumented.** No documented MN support for pre-populating their signup
   fields from query params. The gate therefore does not attempt prefill; members type their name
   twice (once for us, once for MN). Removing that friction requires SSO.
3. **The password field is off, and should stay off.** A password here authenticates nothing —
   Mighty Networks owns the login. It is real breach liability for zero user value and will depress
   conversion at the exact step being optimised. It is implemented (scrypt, `COMMUNITY_SIGNUP_PASSWORD=on`)
   so the decision is reversible, but switching it on also requires a reset flow, an account page,
   and a straight answer to "what does this log into?".
4. **Rate limiting is process-local.** `utils/analytics/rate-limit.ts` is an in-memory map. Correct
   for the current single-instance VPS deployment; move to Redis if the CMS is ever scaled out.
5. **No email notification on signup.** `form-submission` fires one; this does not. Add if the team
   wants a real-time nudge rather than a dashboard.
6. **Public-role login is disabled CMS-wide.** `seed-roles.ts` removing
   `users-permissions.auth.callback` means `POST /api/auth/local` 403s for everyone. That is
   probably intentional hardening, but it is worth confirming — it silently disables the entire
   users-permissions JWT path, not just this feature. `/community/stats` works around it with token
   auth (§4); anything else needing a role-based JWT will hit the same wall.
7. **Enabling Keycloak SSO** would let `/community/stats` move back to role-gating if the team
   later prefers that. Nothing else needs to change.
8. **The four poisoned CTAs are still in production Strapi** (as of 2026-09-04). The code fix makes
   them harmless — the renderer rewrites them — but the rows are still wrong and should be cleaned
   up in the admin UI, or overwritten by a RESEED. Set each to `/join/start`. Until then, the
   deployment scan is the only thing that would notice if the renderer guard were ever removed.
9. **Strapi-side validation was considered and skipped.** A lifecycle hook rejecting a community
   host in a CTA `href` would stop the paste at the source rather than at render. It is the right
   belt-and-braces addition; it was left out of this change because the render-time normalizer
   already makes the data harmless and validation on repeatable components inside dynamic zones is
   fiddly enough to deserve its own change.
