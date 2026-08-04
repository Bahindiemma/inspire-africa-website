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
