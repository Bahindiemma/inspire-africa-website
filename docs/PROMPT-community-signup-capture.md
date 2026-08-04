# PROMPT: INSPIRE AFRICA — Community Signup Capture Layer

You are a senior full-stack engineer (Next.js 15 App Router + Strapi v5) joining the INSPIRE AFRICA
codebase. You write production code: typed, defensive, privacy-first, and consistent with the
conventions already in the repo. You do not add dependencies casually, you do not invent APIs, and
you state your assumptions before you code.

---

## 1. Repository context (already verified — do not re-derive, but DO re-confirm before editing)

Two sibling repos on this machine:

- **Website** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`
  Next.js 15.5 App Router, React 19, TypeScript 5.7, Tailwind CSS v4. **Only 3 runtime deps**
  (`next`, `react`, `react-dom`). Deployed via Docker → GHCR → Contabo VPS.
- **CMS** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms`
  Strapi v5. Content types under `src/api/*`. Docs live in the website repo under `docs/`.

### Current "Join the Community" behaviour (the thing being changed)

Every CTA is a **direct outbound `<a>` to Mighty Networks**. No interstitial, no data capture:

| Call site | Source tag |
|---|---|
| `components/layout/SiteHeader.tsx:13-14` | `header_nav`, `mobile_drawer` |
| `components/layout/SiteFooter.tsx:94` | `footer` |
| `components/layout/MobileNav.tsx:164` | (via nav links) |
| `app/join/page.tsx:70,136` | `join_page_main` |
| `app/workers/page.tsx:67,135` | `workers_hero`, `workers_final` |
| `app/approach/page.tsx:73,131` | `approach_hero`, `approach_cta` |
| `app/blog/[slug]/page.tsx:228`, `app/page.tsx:106,353`, `app/contact/page.tsx:139` | various |

URL construction: `lib/cms/utm.ts` → `buildJoinUrl(settings.communityBaseUrl, { source })`, which
appends `autojoin=1`, `utm_source`, `utm_medium=website`, `utm_campaign=join_community`.
Base URL comes from Strapi **Site Settings** (`lib/cms/site-settings.ts:63` → `communityBaseUrl`),
falling back to the static constant in `lib/site.ts:39`
(`https://inspire-africa.mn.co/spaces/20105635`). `lib/utm.ts` holds the legacy static variant.

### What we can measure today (and why it is insufficient)

`lib/analytics/tracker.ts` fires an `outbound_click` event when any cross-origin link is clicked,
POSTed to `/api/analytics` (`app/api/analytics/route.ts`), which proxies to the CMS
`POST /api/analytics/collect` with `ANALYTICS_INGEST_TOKEN`. Limitations, all of which the new
feature must address:

1. **Consent-gated.** `initTracker()` returns early on `consentLevel === "necessary"` — anyone who
   declines analytics cookies is invisible.
2. **Anonymous.** `analytics-event` carries no PII by design (`docs/07-data-model-erd.md:143`).
   We know *a* click happened, not *who*.
3. **Fire-and-forget.** `sendBeacon` on a link that immediately navigates away — lossy.
4. **No conversion truth.** We never learn whether the click became a Mighty Networks member.

### Existing CMS primitives to reuse (do NOT rebuild these)

- `src/api/form-submission/content-types/form-submission/schema.json` — already has
  `firstName`/`lastName`/`email`/`phone`/`ipAddress`/`userAgent`/`recaptchaScore` all marked
  `"private": true`, a `status` enum, and `payload` JSON. **But** `formKey` is an enum restricted to
  `["contact","employers","governments"]`, and Public role has `form-submission.create` only
  (`docs/08-api-reference.md` §4). The website forms (`components/forms/*.tsx`) are **still stubs**
  that call `alert()` — they never POST.
- `src/api/analytics/*` — ingest controller, `utils/analytics/validate.ts` (payload sanitisation,
  string caps), `utils/analytics/rate-limit.ts` (token bucket per `ipHash`, 240/min, burst 120),
  `parseUa` bot scoring, salted IP hashing (raw IP is discarded — keep this property).
- `app/api/revalidate/route.ts` + `REVALIDATE_SECRET` — the CMS→web cache-busting webhook.
- `lib/strapi.ts` — `strapiFetch<T>()` with Bearer auth, `next.revalidate`/`next.tags`, throws on
  non-2xx. `buildQs()` for Strapi query strings.
- `lib/consent.ts` + `components/consent/*` — the cookie consent model.

---

## 2. Business objective (from the product owner, verbatim intent)

> Add an INSPIRE AFRICA-owned signup layer in front of the Mighty Networks handoff so we capture
> **email, first name, last name, phone number** (and possibly a password) into the INSPIRE AFRICA
> CMS. **The main objective is to know how many people clicked the signup link to join the
> community, and to own that user data ourselves.**

Read that as three distinct requirements, and treat them as separately testable:

- **R1 — Attribution:** count and attribute every intent-to-join click, per source/page/campaign,
  **independent of cookie consent**.
- **R2 — Data ownership:** persist identity fields in our own CMS, not only inside Mighty Networks.
- **R3 — Funnel truth:** measure the drop-off `CTA click → form started → form submitted → handed
  off to MN → (ideally) confirmed MN member`.

---

## 3. Phase 1 — Analysis (deliver BEFORE writing any code)

Produce a concise written analysis. No code yet.

1. **CTA inventory.** Enumerate every "Join the Community" entry point with file:line, the `source`
   tag it passes, and whether it should route through the new gate or stay a direct link. Call out
   `components/layout/NavLinks.tsx` and `lib/site.ts:55` (`{ href: "/join", cta: true }`), which
   already point internally — do not double-gate those.
2. **Current measurement gap.** Quantify what `outbound_click` does and does not tell us, per the
   four limitations above.
3. **Mighty Networks integration surface.** Establish — from documentation, not assumption — which
   of these exist for the `inspire-africa.mn.co` plan:
   - a **prefill** mechanism (query params that pre-populate MN's own signup fields),
   - a **members/webhook API** to confirm that a given email actually completed MN registration,
   - **SSO / SAML / OIDC** (typically a higher MN tier) that would let INSPIRE AFRICA be the
     identity provider.
   If any answer is unknown, say **"UNKNOWN — needs verification with the MN account admin"**.
   Do not design around a capability you have not confirmed. Design the v1 so it degrades
   gracefully to "we capture, then redirect" if none of these exist.
4. **The password question — give a straight engineering recommendation.** Collecting a password
   that authenticates nothing creates a *dead credential*: real security liability (hashing,
   rotation, reset flow, breach exposure, users reusing their bank password) for zero user value,
   and it will measurably depress conversion at the exact step we are trying to optimise.
   Recommend **omitting the password in v1** unless a confirmed MN SSO/API path exists, and
   describe the migration to accounts (Strapi users-permissions or an auth provider) as a
   deliberate later phase. If the product owner still wants it after reading this, implement it
   correctly (see §5.4) — the decision is theirs, the correct implementation is yours.
5. **Compliance read.** These are Ugandan/African workers plus UK/EU-facing operations. Identify
   what changes in `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx` (which
   already names Mighty Networks as a third party at line 126), the lawful basis for processing,
   the retention period, and the DSAR/erasure path. Note that these legal pages are static TSX,
   not CMS-driven.

---

## 4. Phase 2 — Design decision (present options, then recommend one)

Present these three with honest trade-offs, then **pick one and justify it**:

- **A — Interstitial route (`/join/start`).** CTA → our form page → POST → 302 to MN.
  Highest capture, works without JS, simplest to reason about, one extra step.
- **B — Modal over the current CTA.** Lower friction, but needs a client component, a no-JS
  fallback, focus-trap/ESC/aria-modal accessibility work, and it complicates server-rendered pages.
- **C — Post-click beacon only.** No form; a reliable server-side click log. Satisfies R1 alone,
  fails R2 and R3.

Default recommendation unless the analysis contradicts it: **A, with C's server-side click log
built in underneath it** — so that even an abandoned form still yields a counted, attributed
click. That combination is what makes R1 consent-independent.

---

## 5. Phase 3 — Implementation specification

### 5.1 CMS — new content type `community-signup`

Create `inspire-africa-cms/src/api/community-signup/` (schema + routes + controller + service),
mirroring the structure and conventions of `form-submission`. **Do not overload `form-submission`'s
`formKey` enum** — signups are a different lifecycle with different retention and a different
admin audience.

Fields (mark every identity field `"private": true`, exactly as `form-submission` does):

| Field | Type | Notes |
|---|---|---|
| `email` | email, required, **unique** | primary identity key |
| `firstName`, `lastName` | string, private, required | |
| `phone` | string, private | store E.164; capture country dial code separately in the UI |
| `passwordHash` | string, private | **only if §5.4 is approved**; never a plaintext `password` field |
| `country` | string | optional |
| `consentMarketing` | boolean, default false | explicit, unticked opt-in — never bundled with T&Cs |
| `consentTerms` | boolean, required | records acceptance of Terms + Privacy |
| `source` | string | the existing `source` tag, e.g. `workers_hero` |
| `utmSource`/`utmMedium`/`utmCampaign` | string (≤128) | mirrors `analytics-session` |
| `referrerHost` | string (≤255) | host only — never a full URL with a query string |
| `landingPath` | string (≤512) | |
| `clickId` | uid/string, unique, indexed | correlates click → submit → redirect → MN return |
| `status` | enum `Clicked / Submitted / RedirectedToMN / MemberConfirmed / Duplicate / Spam` | default `Clicked` |
| `redirectedAt`, `confirmedAt` | datetime | |
| `ipHash` | string, private | **salted hash only** — mirror the analytics module; never store raw IP |
| `userAgent`, `deviceType`, `botScore` | string / enum / float, private | reuse `parseUa` |

`draftAndPublish: false`. Add `createdAt` indexes for reporting queries.

### 5.2 CMS — endpoints and permissions

- `POST /api/community-signups/track` — logs intent (status `Clicked`), returns `{ clickId }`.
- `POST /api/community-signups` — creates/updates the full record (status `Submitted`).
- Both: `auth: false` + a **shared-secret policy** modelled on `global::is-analytics-ingest`
  (constant-time compare, fails closed when the secret is unset). The browser must never see the
  secret — the Next.js route handler holds it, exactly like the analytics proxy does today.
- **Public users-permissions role gets NOTHING here** — no `find`, no `findOne`, no `create`. This
  endpoint is reachable only through our own server proxy. `GET/PUT/DELETE` are admin-only.
- Rate-limit by `ipHash` reusing `utils/analytics/rate-limit.ts`; tighter than analytics
  (suggest ~10/min per IP, burst 5). Return `429 {error:"rate_limited"}`.
- Validate and cap every string server-side (reuse the `LIMITS` pattern from
  `utils/analytics/validate.ts`). Never trust client-supplied `source`/`utm*`.
- **Idempotency:** re-submitting the same email must update the existing record and increment an
  attempt counter — not throw a 500 on the unique constraint, and not silently leak "this email
  already exists" to an unauthenticated caller (enumeration). Return the same 200/204 either way.

### 5.3 Website — routes and components

- **`app/join/start/page.tsx`** — Server Component. Reads `?source=` and UTM params, renders the
  form, and includes a `<noscript>`-safe path. Uses the existing `.form-grid`/`.form-field`/
  `.btn btn--primary` classes and `ArrowIcon` so it matches `ContactForm.tsx` visually.
- **`components/forms/CommunitySignupForm.tsx`** — `"use client"`. Progressive enhancement: a real
  `<form method="post">` that works without JS, enhanced with `useActionState`/Server Action for
  inline validation. Fields: first name, last name, email, phone (with country dial code), country,
  terms checkbox (required), marketing checkbox (unticked). Add a honeypot input and a
  submit-timing check. Set `name="community_signup"` so the existing
  `form_start`/`form_submit` tracker events (`lib/analytics/tracker.ts:179-193`) label correctly.
- **`app/api/community/signup/route.ts`** — `runtime = "nodejs"`, `dynamic = "force-dynamic"`.
  Mirror the hardening already in `app/api/analytics/route.ts`: same-origin guard, body size cap,
  `AbortSignal.timeout(...)`. Forward XFF + UA. **Differences from the analytics proxy:** this one
  must NOT silently swallow failures — a user who typed their details deserves either a success
  redirect or a real error message. Log server-side, degrade gracefully (still redirect to MN so
  the user is never blocked by our persistence layer), and surface a non-alarming notice.
- **`app/api/community/click/route.ts`** — the consent-independent click log (R1). Called on CTA
  click; sets a short-lived first-party `clickId` cookie so the subsequent form submit correlates.
  This is *strictly necessary* first-party measurement of a user-initiated action, not analytics
  profiling — but confirm that framing against `app/cookies/page.tsx` and state it explicitly.
- **`lib/cms/utm.ts`** — add `buildJoinGateUrl(source)` returning `/join/start?source=…&utm_*=…`,
  and keep `buildJoinUrl()` as the final MN hop used by the server-side redirect. Update every call
  site in the table in §1. **Do not change `buildJoinUrl`'s signature** — it is used in 10+ places
  and the static fallback in `lib/utm.ts` must keep working when Strapi is unreachable.
- **Redirect:** on success, `303` to `buildJoinUrl(communityBaseUrl, { source })` with `autojoin=1`
  preserved, plus MN prefill params **only if Phase 1 confirmed they exist**, plus `clickId` so a
  future MN webhook can close the loop. Set `status = RedirectedToMN`, stamp `redirectedAt`.

### 5.4 If — and only if — a password is approved

- Hash with **argon2id** (preferred) or bcrypt cost ≥ 12, **server-side in the CMS only**.
- The plaintext must never be logged, never enter `payload` JSON, never cross the Next.js proxy in
  a loggable form, and never appear in an error message or a Strapi admin column.
- Minimum 12 characters; check against a common-password list; no composition rules that push users
  toward `Passw0rd!`.
- You must also ship: password reset, an account page, and a documented answer to "what does this
  password actually log into?" If those three are not in scope, **do not ship the field** — say so
  plainly and move on.

### 5.5 Reporting (this is the primary deliverable — R1)

- A Strapi admin list view for `community-signup` with `status`, `source`, `createdAt` filters and
  CSV export.
- Extend the nightly rollup (`api::analytics-daily-rollup`, 02:15 UTC cron) or add a parallel
  `community-signup-daily-rollup`: signups/day, by `source`, by `utmCampaign`, and the
  **click → submit conversion rate**.
- One clear number the CEO can read without SQL: *"N people clicked Join this month; M gave us
  their details; that is X%."*

---

## 6. Hard constraints

- **No new runtime dependencies** without explicit justification and approval. The site ships with
  exactly three. If you want argon2, say why and what it costs in the Docker image.
- Match existing conventions: file-header comment blocks explaining *why* (see `lib/strapi.ts`,
  `lib/analytics/tracker.ts`), named exports, `@/` path alias, existing CSS class names.
- **Must pass** `npm run typecheck` (`tsc --noEmit`), `npm run lint`, and `npm run build` in the
  website repo before you claim done. Run them; paste the output.
- Server Components by default; `"use client"` only where interactivity genuinely requires it.
- The site must still render if Strapi is down — every `lib/cms/*` module already has a static
  fallback path. The signup gate must fail **open** (user still reaches MN), never closed.
- Accessibility: labelled inputs, `aria-describedby` error text, visible focus, keyboard-complete,
  and a form that submits without JavaScript.
- Never log PII to stdout. Container logs on the VPS are not a safe store.
- CMS CORS is allow-listed via `CORS_ORIGINS` and must never become `*`.

---

## 7. Explicitly out of scope for v1

Full user accounts/login; migrating Mighty Networks off-platform; CRM/email-marketing sync;
SMS/OTP verification; candidate-profile linkage (`api::candidate`). Note where each would hook in
later, but do not build it.

---

## 8. Acceptance criteria

1. Clicking any "Join the Community" CTA lands on `/join/start` with `source` preserved.
2. A record with `status = Clicked` exists **even when the visitor has declined analytics cookies**
   and even if they abandon the form.
3. Submitting the form persists first name, last name, email, phone into `community-signup` in the
   CMS, then redirects to Mighty Networks with `autojoin=1` and UTM intact.
4. Same email submitted twice → one record, updated, no 500, no enumeration leak.
5. The form fully works with JavaScript disabled.
6. Strapi unreachable → user still reaches Mighty Networks; failure logged without PII.
7. Public role cannot read `community-signup` via the API (expect `403`); PII fields absent from
   any API response by virtue of `private: true`.
8. Rate limiting returns `429` under burst; honeypot submissions are marked `Spam`, not persisted
   as leads.
9. Privacy, Terms and Cookies pages updated to reflect the new collection and the MN transfer.
10. `typecheck` + `lint` + `build` all pass, output shown.

---

## 9. How to work

1. **Deliver Phase 1 analysis first, as prose.** No code until the design in Phase 2 is chosen.
2. State every assumption explicitly. Where you had to guess (especially Mighty Networks
   capabilities), label it `ASSUMPTION` and say how to verify it.
3. Then produce the implementation as reviewable, file-by-file changes, CMS repo first
   (schema/permissions), website second.
4. Do not mark anything complete that you have not actually run. If a step is blocked, finish
   everything else and say precisely what is blocked and why.
5. If you believe a requirement is wrong — the password field is the obvious candidate — say so
   once, clearly, with your reasoning, then implement whatever the product owner decides.
