# PROMPT: INSPIRE AFRICA — every join CTA must pass through our own signup page

You are a senior Next.js / Strapi engineer joining the INSPIRE AFRICA codebase. You verify before
you change, you fix the class of bug rather than the one instance the boss happened to click, and
you leave behind a guard that makes the bug impossible to reintroduce. You write production code
and you report honestly on what you could not verify.

---

## 1. The report from the CEO (Emmanuel Bahindi, WhatsApp, 2026-09-04 11:05)

> "The website is broken. The 'Join the Community' link does not go to our landing page. Instead,
> it goes here:
> `https://inspire-africa.mn.co/sign_up?auto_join=true&from=https%3A%2F%2Finspire-africa.mn.co%2F%3Fautojoin%3D1&space_id=20105633`"

**The rule he is stating, which is now a hard product invariant:**

> Every button and link on the INSPIRE AFRICA website that means "join the community" MUST land the
> visitor on the INSPIRE AFRICA signup page first. Mighty Networks is only ever reached *after*
> that page, by our own server-side handoff. No CTA anywhere may point a visitor straight at
> `*.mn.co`.

Read two things out of that URL before you touch code — they are evidence, not decoration:

- `from=https://inspire-africa.mn.co/?autojoin=1` — the destination that bounced was the **MN root
  with `autojoin=1`**, i.e. a URL shaped by *our* `buildJoinUrl()` over a base of
  `https://inspire-africa.mn.co/`, not over the seeded `.../spaces/20105635`.
- `space_id=20105633` — **not** the `20105635` in `lib/site.ts` / the CMS seed.

So the live system is not what this repo's `main` says it is: either the deployed build predates
the signup gate, or live Strapi data (Site Settings `communityBaseUrl`, a Navigation link, or a
CTA `href` inside a Page dynamic zone) carries a raw Mighty Networks URL. **Establishing which is
step one. Do not skip it and do not guess.**

---

## 2. Ground truth in the repo (verified 2026-09-04 — re-confirm before editing)

Repos:
- **Website** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`
  Next.js 15.5 App Router, React 19, TS 5.7, Tailwind v4. **Three runtime deps only — add none.**
- **CMS** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms`
  Strapi v5.46, MySQL in prod. Docker → GHCR → Contabo VPS.

The gate already exists (commit `17424e7`, "Community signup gate"). The intended flow is:

```
CTA  →  /join/start   (signup gate: records the click server-side on render, captures
                       name + email + category, gated by email verification)
     →  /join/check-email  →  /join/verify
     →  /join/continue     (route handler: marks RedirectedToMN, then 303 to MN)
     →  Mighty Networks with autojoin=1 + UTM
```

The pieces that matter:

| File | Role |
|---|---|
| `lib/utm.ts` → `buildJoinGateUrl({source})` | The **only** correct CTA target. Returns `/join/start?source=…&utm_*` |
| `lib/utm.ts` → `joinUrl()` | Legacy static MN URL builder — outbound |
| `lib/cms/utm.ts` → `buildJoinUrl()` / `getJoinUrl()` | CMS-aware MN URL builder — outbound |
| `app/join/continue/route.ts` | The **only** place a visitor may legitimately be sent to `mn.co` |
| `lib/site.ts` → `SITE.community.baseUrl` | `https://inspire-africa.mn.co/spaces/20105635` (fallback) |
| `components/ui/Button.tsx` → `ButtonLink` | Renders `<a>` for `http(s)` hrefs, `<Link>` otherwise |
| `components/cms/DynamicZoneRenderer.tsx` | **Renders CMS `href` values verbatim** — see below |

Static TSX CTAs are already correct: `app/page.tsx` (121, 368), `app/join/page.tsx` (69, 135),
`app/approach/page.tsx` (88, 146), `app/contact/page.tsx` (154), `app/blog/[slug]/page.tsx` (228),
`components/layout/SiteHeader.tsx` (header + mobile drawer), `components/layout/SiteFooter.tsx` (96)
all call `buildJoinGateUrl()`. **That is why the repo looks fine and the live site is not.**

### The actual hole: CMS-authored hrefs are never validated

`components/cms/DynamicZoneRenderer.tsx` passes editor-supplied strings straight into `href`:

- `sections.hero` → `s.ctas[].href` (line ~109)
- `sections.final-cta` → `primary.href` (~245) and `s.secondaryLinks[].href` (~235)
- audience cards → `c.ctaHref` (~389)

and `SiteHeader` maps `nav.headerLinks[].href` from Strapi Navigation straight into `NavLinks` and
`MobileNav`. Every CMS-driven page (`/approach`, `/workers`, `/employers`, `/governments`, `/join`,
homepage) renders through this path and **silently overrides** the correct static TSX beneath it —
`app/join/page.tsx` only falls back to its hardcoded, correct CTAs when Strapi has no Page document.
One editor pasting an MN link into Strapi re-breaks the site with no deploy and no review.

Second, weaker issue to decide on: the seed (`inspire-africa-cms/src/bootstrap/seed-content.ts`)
points CMS join CTAs at **`/join`** — the marketing page — not at `/join/start`. That is one extra
click before the signup form, and on the `/join` page itself (seed line ~874) the hero CTA links to
`/join`, i.e. to itself. The CEO's rule says the button goes to the **signup page**. Treat
`/join` → `/join/start` for every CTA labelled like a join action, and say so in your report.

---

## 3. What you must do

### Step 1 — Diagnose the live site before changing anything (mandatory, report findings)

1. Fetch the live production HTML for `/`, `/join`, `/approach`, `/workers` and grep every `href`
   for `mn.co`. Record exactly which element(s) leak and on which pages.
2. Compare the deployed build against `main` (image tag / commit). State plainly whether prod is
   running a build older than `17424e7`.
3. Read live Strapi: Site Settings `communityBaseUrl`, Navigation `headerLinks`/`footerColumns`,
   and every Page dynamic zone CTA `href`. Report every value containing `mn.co` or `autojoin`,
   and reconcile `space_id=20105633` vs the seeded `20105635` — **ask the CEO which space is
   correct rather than picking one.**
4. Only then decide how much of the fix is a redeploy, how much is data, and how much is code.
   Say so explicitly in your report; do not let a data problem be hidden by a code change.

### Step 2 — Make the invariant structural, not a spot fix

Implement a single choke point and route **every** href through it:

- Add `normalizeJoinHref(href, {source})` (put it in `lib/utm.ts` — it must stay importable from
  client components; `lib/cms/*` pulls server-only env into the bundle).
- Behaviour: if `href` points at the community host (`*.mn.co`, any path, any query — match on
  hostname, not on a literal string), **or** is `/join` / `/join/` with a join-shaped label, return
  `buildJoinGateUrl({source})`. Otherwise return `href` unchanged. Never throw; an unparseable
  href falls back to the gate URL rather than to Mighty Networks.
- Apply it at **every** render site that consumes CMS data: all four `DynamicZoneRenderer` href
  paths above, the `SiteHeader` → `NavLinks` / `MobileNav` mapping, and the footer's CMS links.
  Derive a sensible `source` per site (e.g. `cms_hero`, `cms_final_cta`, `header_nav`) so the
  analytics attribution the gate records stays meaningful.
- Leave `app/join/continue/route.ts` as the **only** code path that emits an `mn.co` URL to a
  visitor. `joinUrl()` / `buildJoinUrl()` may still be *called* — only from there.

### Step 3 — Fix the data, not just the render

Update `inspire-africa-cms/src/bootstrap/seed-content.ts` so join CTAs target `/join/start`, and
document the RESEED step needed on the VPS (follow the existing RESEED procedure in `docs/`).
If live Strapi rows carry MN URLs, write down the exact rows and values to correct, and correct
them once the CEO confirms the space id. **The CMS deploys before the web** — respect that order.

### Step 4 — Make regression impossible

Ship at least two guards:

1. **Build-time / CI check** — a script in `scripts/` (the repo already has
   `assert-prerendered-images.mjs` as a model) that fails the build if any rendered/prerendered HTML
   or any `.tsx` contains an `href` to `mn.co` outside `app/join/continue/route.ts`.
2. **Lint rule** — an ESLint `no-restricted-syntax` (or equivalent) in `eslint.config.mjs` banning
   string literals matching `mn.co` in JSX `href` positions, with a message naming
   `buildJoinGateUrl`.

Optionally add a Strapi-side validation on CTA/navigation `href` fields rejecting `mn.co`. Say why
if you skip it.

### Step 5 — Do not break what works

- Keep `prefetch={false}` on every `/join/start` link — `<Link>` prefetch would record a click for
  everyone who merely scrolled past. Any new gate link needs it too.
- Keep the gate **failing open**: if Strapi is unreachable, the visitor must still reach the
  community. Losing an analytics write must never cost someone their membership.
- Do not change the `Clicked → Submitted → RedirectedToMN → MemberConfirmed` status semantics.
- Do not regress the email-verification flow (`/join/check-email`, `/join/verify`).
- Legal copy in `app/privacy`, `app/terms`, `app/cookies` describes this handoff. If your change
  alters *when* the handoff happens, update that copy; if it does not, leave it alone.

---

## 4. Acceptance criteria

The task is done when all of these are true and you have shown the evidence:

1. On the **live production site**, no `href` anywhere on `/`, `/join`, `/approach`, `/workers`,
   `/employers`, `/governments`, `/contact`, `/blog` and a blog post page contains `mn.co`.
   Show the actual command and output.
2. Clicking every join-labelled button — desktop header, mobile drawer, hero, final CTA, footer,
   blog CTA, audience cards — lands on `/join/start` with a distinct `source` param.
3. Mighty Networks is reached **only** after email verification, via `/join/continue`, and the
   outbound URL uses the space id the CEO confirms, with `autojoin=1` + UTM intact.
4. An editor pasting an MN URL into any Strapi CTA or navigation field cannot break rule 1 —
   demonstrate this by actually setting one in a local/staging Strapi and showing the rendered
   href is still `/join/start`.
5. `npm run build` and lint pass, and the new guard fails the build when you deliberately
   reintroduce an MN href (show that it fails, then revert).
6. Three runtime dependencies still. No new ones.

---

## 5. Deliverables

1. A single reviewable change per repo, with commit messages in the repo's existing style
   (imperative, sentence case, what-and-why — see `git log`).
2. An update to `docs/19-community-signup.md` recording the new invariant, the choke point, and
   the guard.
3. A short report to the CEO in plain English (no jargon, no file paths) stating: what was broken,
   why his link went to Mighty Networks, what now happens when someone clicks Join, and what he
   must confirm (the space id).
4. An explicit list of anything you could **not** verify — live Strapi rows you lacked access to,
   the deployed image tag, the correct MN space — stated as open questions, not assumptions.

---

## 6. Out of scope

Favicon work (the CEO raised it separately in the same thread), any Mighty Networks API/ETL work,
migrating off Mighty Networks, and any redesign of the signup wizard's fields. Fix the routing
invariant; leave the rest.
