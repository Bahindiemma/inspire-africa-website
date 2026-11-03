# Join → Readiness: one signup, no retyping

> Status: **draft for approval** · 2026-11-03
> Systems touched: website (`inspire-africa-website`), CMS (`inspire-africa-cms`),
> register (`inspire-africa-community-vault`, prod `db.inspireafricans.com`),
> readiness portal (`inspire-readiness`, `readiness.inspireafricans.com`).
> Supersedes the join → CMS confirmation → Mighty Networks hand-off described in
> `docs/19-community-signup.md` §2.
>
> Marking used below: **[Bruno]** = decided by the product owner in conversation;
> **[call]** = the designer's decision, open to override; **[builder]** = left to
> whoever builds it.

---

## 1. Intent

A worker who fills in "Join the Community" on inspireafricans.com has already
told us their name, their email address and that they are a worker. Today they
are then sent to Mighty Networks, and if they later want the readiness portal
they must register there and type all of it again.

**The point of this change is that nobody gives the same information twice.**
What the join form captured is used to create their readiness profile — but
only if they choose to carry on. **[Bruno]**

**The readiness portal replaces Mighty Networks** as where a joining worker
goes. **[Bruno]**

## 2. Goals, non-goals, anti-goals

### Goals
1. A worker who submits the join form receives an email with a link into the
   readiness portal. **[Bruno]**
2. The link opens readiness `/start`, which already knows who they are. **[Bruno]**
3. Their answers on `/start` are saved as part of their onboarding. **[Bruno]**
4. After step 3 of `/start`, a new step 4 asks them to set a password. **[Bruno]**
5. Completing step 4 creates their account and signs them in — no separate
   sign-in. They sign in again only when that session ends. **[Bruno]**
6. The remaining questions of the readiness registration form follow as steps
   after step 4. **[Bruno]**
7. On sign-in, the "Your profile, done for you" dialog appears, leading with
   auto-fill, until they have chosen auto-fill (§6). **[Bruno]**

### Non-goals (this change)
- **Somewhere for non-workers to go.** Employers, government, education,
  development/NGO, diaspora and "something else" get **no link** for now.
  **[Bruno]** Their details are still recorded (§4.2).
- Moving existing Mighty Networks members anywhere.
- A dedicated system mail sender (`noreply@`). Discussed and deferred by
  Bruno; this design uses whatever the register sends mail with today.
- Changing how visitors who arrive at readiness directly (not from the
  website) register. Their `/register` flow is unchanged. **[call]**
- Any change to the employer portal.

### Anti-goals — failing any of these is failing, even if it "works"
- Asking an invited worker for their name or email again.
- Creating a readiness account for someone who never opened the link.
- A second person record for someone the register already holds.
- Anyone other than the owner of the inbox being able to use the link to
  take over or create an account.
- Telling someone "check your inbox" when no email was sent.
- The readiness portal storing candidate data itself (house rule: the
  portal is a front end over the register and stores nothing).
- The dialog nagging someone who has already used auto-fill.

## 3. What exists today (verified 2026-11-03)

**Website.** Every Join CTA goes to `/join/start` (records a click in the CMS),
then a Server Action (`app/join/start/actions.ts`) posts name, email, registrant
type, consent and attribution to the CMS (`lib/cms/community.ts → /community/submit`).
The CMS emails a confirmation link to `/join/verify?token=…`, which forwards via
`/join/continue` to Mighty Networks. Registrant types live in `lib/registrant.ts`
(`worker` is the default; seven values).

**CMS (Strapi).** `api::community-signup` holds the lead row and its funnel
status (Clicked → Submitted → RedirectedToMN …), attribution, and the hashed
email-verification token; it sends the confirmation email itself
(`src/api/community-signup/controllers/community-signup.ts`,
`src/utils/community/verification.ts`). Endpoints are server-to-server behind
`COMMUNITY_SIGNUP_TOKEN`.

**Register (Laravel).** The system of record for people and accounts.
- `POST /v1/register` (required: first/last name, email, password +
  confirmation, consent; optional: phone, profession, nationality) creates a
  `RegistrationSubmission` and emails a 6-digit code.
- `POST /v1/register/verify-email` checks the code;
  `EmailVerification::admit()` → `RegistrationIntake::promote($submission,
  'auto:email-verified')` creates the `Person` and `CandidateAccount`, and
  `PortalSession::issueFor()` returns a session token.
- `AccountSetup` (`/v1/auth/claim/request`) already lets someone with a
  person record but no account set a password by proving control of their
  email.
- Goals: `person_goal` via `/v1/me/goals`. Campaign attribution:
  `person_arrival` via `/v1/me/arrival`, sources allow-listed in
  `config/portal.php → arrival_sources`.
- Trusted callers: `CallerAddress` trusts a peer IP in
  `portal.trusted_forwarders` plus `X-Portal-Key`.
- Mail: `MailTransport` over Gmail SMTP; connection drops are retried once.

**Readiness portal (Next.js 16 BFF).**
- `/start` (`src/app/(public)/start/page.tsx`,
  `src/components/start/StartJourney.tsx`, `src/content/starting-points.ts`):
  three steps, answers held only in the URL (`?from=&sure=&step=`). Step 1 is
  one choice of `new | better | technical | abroad`. `GOAL_FOR_PATH` maps each
  to a register goal type. The "Save as my goal" at step 3 is on the unmerged
  branch `feature/central-db-pass-portal`.
- `/register` (`src/components/register/steps.ts`): 1 About you (name,
  email, phone, password) · 2 Your CV (optional) · 3 Your work (profession,
  nationality) · 4 Your permission (review + consent) · then the 6-digit email
  code, which signs them in (`verifyRegistrationEmailAction` →
  `startSession`).
- Session: httpOnly cookie `inspire_readiness_session` holding the register's
  bearer token, expiring with it (`src/lib/session.ts`).
- "Your profile, done for you" dialog: `src/components/landing/DoneForYou.tsx`
  + `src/content/done-for-you.ts`; today shown once to anonymous visitors on the
  public landing page (localStorage). Its auto-fill path is
  `READING_DESTINATION = /cv?from=reading` (upload → `/me/cv/parse` → review →
  `/me/cv/confirm`), priced by the register when `STORE_PRODUCT_CV_READING` is
  set, free otherwise.

## 4. The flow

### 4.1 Overview

```
Website join form ──► website server action
                         ├─► CMS  /community/submit     (lead + funnel, as today; no email for workers)
                         └─► Register  invitation        (workers only)
                                          └─► email: "Continue to INSPIRE AFRICA Readiness"
                                                       │
Readiness  /invite?token=… → /start ◄─────────────────────┘
   steps 1–3  (where you are · topics · your starting point)
   step 4     your account: password + permission  ──► Register accepts invite:
                                                          person + account + onboarding + session
   step 5     your CV (optional, auto-fill)            ──► /me/cv/parse + confirm
   step 6     your work (only what is still missing)  ──► /me profile endpoints
   ──► portal home  (+ "done for you" dialog if no CV has been read yet)
```

### 4.2 On the website: submitting the join form

The form itself is unchanged: I am… (registrant type), first name, last name,
email, accept Terms and Privacy. **[call]**

On submit the server action:
1. Posts to the CMS exactly as today, so the lead row, attribution and join
   statistics keep working for every registrant type. **[call]**
2. **If the registrant type is `worker`**, asks the register to create an
   invitation (§4.3), passing first name, last name, email, the CMS `clickId`
   and the attribution (source, utm_*). **[Bruno: workers only]**
3. Redirects to a results page whose wording depends on the outcome:

| Outcome | What the visitor is told |
|---|---|
| Worker — whether new, already holding an account, or on a suppression list | **One identical page**: "Check your email — we've sent you a link to continue to INSPIRE AFRICA Readiness." Offer "send it again". The difference between the cases is carried **only in the email** (§4.3), never on screen. **[call]** |
| Worker, the register reports the mail transport is down | Honest failure + resend, as `/join/check-email?mail=failed` does today. This reveals nothing about the address, only that mail is failing. |
| Non-worker | "Thanks — we've received your details. We'll be in touch." No link anywhere. **[Bruno]** |
| Register unreachable | "We couldn't complete your signup just now — nothing has been lost, try again." Never "check your inbox". |

**Why one page [call].** Telling an unauthenticated visitor "that address
already has an account" is account enumeration. Both the register
(`EmailVerification::send`, `AccountExistsMail`) and the CMS (`submit`) already
refuse to do it and put the answer in the email instead; this flow follows the
same rule. Addresses on the register's suppression list are handled exactly as
`/register` handles them today: the same page, and no email. That is a
deliberate, existing exception to "never say check your inbox when nothing was
sent" — those people asked not to be emailed.

**Emails** **[call]**
- Workers get **one** email: the register's invitation. The CMS must **not**
  also send its confirmation email to a worker.
- Non-workers get a short "thanks, we've received your details" email from the
  CMS with **no link**.
- Both are CMS-side rules keyed on `registrantType` (see §7.2).

### 4.3 In the register: the invitation

A new, server-to-server endpoint, callable only by the website server, authenticated
with **its own secret** (not the portal's `X-Portal-Key`) and per-caller and
per-address rate limits in the style of `/register`. **[call]**

It stores an invitation: first name, last name, email, registrant type,
CMS `clickId`, attribution, a **hash** of a random single-use token, an expiry,
and send counts. The raw token is never stored, matching how the CMS and the
register already treat codes. **[call]**

It then decides by email address, and **answers the website the same way in
every case** except "mail transport down" (§4.2):
- **No person with this email** → send the invitation email. Accepting it
  creates a new person (§4.6, path A).
- **A person with an account that has already been claimed and can sign in** →
  send a "you already have an account — sign in" email (in the style of
  `AccountExistsMail`) linking to the readiness sign-in. No invitation token.
  **[call]**
- **A person the register already holds whose account has never been claimed,
  or who has no account** (most of the ~1,742 imported people; the register
  counts ~2,609 unclaimed accounts) → send the invitation. Accepting it sets
  the password on **that** record, by the same reasoning `AccountSetup` already
  applies: control of the inbox stands in for a coordinator. No duplicate
  person, no coordinator queue. **[call]** (§4.6, path B)
- **A person whose account staff have deactivated** (`is_active = false`) → no
  invitation and no email, and an audit entry, as `AccountSetup` treats them as
  not eligible; staff deactivated them deliberately. **[call]**
- **An address on the suppression list** → nothing is sent, as `/register` does.

Resubmitting the join form with the same address re-sends (subject to a send
cap, as resend is today) and invalidates any earlier link. **[builder: exact
response shape]**

**The raw invitation token never leaves the register except inside the email.**
The website's secret can ask for an invitation to be sent; it can never obtain
a link. So a leak of the website's secret cannot be used to create or take
over an account — at worst it sends invitation emails to inboxes. **[call]**

**Expiry: 7 days. [call]** Longer than the CMS's 72 hours, because many
workers check email infrequently.

**The invitation email** (sent through the register's existing `MailTransport`):
"Continue to INSPIRE AFRICA Readiness", greeting by first name, one button to
`https://readiness.inspireafricans.com/invite?token=<token>` (which lands on `/start`, §4.4), the link also as
plain text, and how long it lasts. Plain-text and HTML versions. **[call; final
wording is the owner's]**

### 4.4 Opening the link (readiness)

`/invite?token=<token>` (a readiness route handler; the email link):
1. The readiness server asks the register whether the token is valid and gets
   back only what the screens need: first name, last name, email, and status
   (`valid | expired | used | already-a-member`). **[call]**
2. If valid, it puts the token in a short-lived httpOnly cookie and redirects
   to `/start` (no token in the address), so the token is not left in browser history, in
   `Referer` headers or in analytics. **[call]**
3. Steps 1–3 then work exactly as today, with the invitation recognised from
   the cookie. The page greets them by first name.

| Link state | What they see |
|---|---|
| Expired | "This link has expired" + "Send me a new one" (register resends to the same address). |
| Already used, or already a member | "You already have an account" + Sign in. |
| Unknown / malformed | "We couldn't match that link" + Sign in / start again from the website. |
| Someone else already signed in on this browser | Ask whether to continue as the invited person (signs the other session out) or keep the current session. **[builder: copy]** |

### 4.5 `/start` for an invited worker

| Step | Title | Content | Saved |
|---|---|---|---|
| 1 | Where you are today | unchanged | URL only, as today |
| 2 | Topics | unchanged | URL only |
| 3 | Your starting point | unchanged, except the "Create your profile / Sign in" call to action becomes **Continue** → step 4 | URL only |
| 4 | **Your account** | Name and email shown, **not editable** here; password + confirm (register's `MemberPassword` rules); the permission tick with the readiness consent wording, and the short "what we keep and why" from the existing registration permission step | **Creates account, saves onboarding, signs in** (§4.6) |
| 5 | **Your CV** *(optional)* | "We read it so you type less." Upload → read → review → confirm, using the signed-in `/me/cv/parse` + `/me/cv/confirm` flow so what is read is **kept** in their profile. Skip is always available. | Profile, via the existing CV reader |
| 6 | **Your work** *(skippable)* | Only what is still missing after step 5: what they do (profession), nationality, phone (optional). Pre-filled from whatever the CV gave. | Profile, via a small onboarding endpoint that fills **empty** fields directly, as registration does (the ordinary profile edit holds nationality for staff review, which would tell a brand-new member their nationality is "pending") |
| — | Done | → portal home | — |

Notes:
- **Permission moves to step 4 [call].** The account is created at step 4 (Bruno),
  and the register cannot hold an account without consent. The website's Terms
  tick covers the website, not the readiness profile, so one tick here is
  still required. Nothing is retyped.
- **No 6-digit email code [call].** Opening the emailed link has already
  proven the address.
- **If CV reading has a price, step 5 is skipped [call]**, matching the
  current registration form ("priced → skip CV"). The paid reading is what the
  dialog sells (§6).
- Steps 5 and 6 happen **signed in**, so leaving part-way loses nothing. Gaps
  show on My profile as they do now; they are not forced back through the
  steps. **[call]**
- The step rail shows 6 steps for an invited worker; the public `/start` for
  everyone else keeps 3. **[call]**
- Step 4's name is not editable here because the name came from them a moment
  ago; corrections go through My profile. A "Not you?" link explains what to do
  if someone else's details appear (the link was forwarded). **[call]**

### 4.6 Step 4 — accepting the invitation (register)

The readiness server action posts the invite token (from the cookie), the
password + confirmation, consent, and the onboarding answers to a new register
endpoint. In **one transaction** the register:

1. Verifies the token (hash match, unexpired, unused) and marks it used.
   Re-checks the address: if it has meanwhile become a claimed account that can
   sign in, it stops and answers "already a member".
2. Then one of two paths, fixed when the invitation was created (§4.3):
   - **Path A — nobody on file.** Creates the `Person` the way a verified
     self-registration does today: a `RegistrationSubmission` promoted by
     `RegistrationIntake::promote` with a distinct reason such as
     `auto:website-invite`, so admin views and audits treat it like any other
     registration. Creates the `CandidateAccount` with the chosen password.
   - **Path B — already on file, account unclaimed or missing.** Does **not**
     call `promote()` (which always makes a new person, and whose
     duplicate rule — "a match is a flag, not an automatic merge" — is for
     unproven self-registrations). Sets the password on that person's
     account (creating the account if there is none), following
     `AccountSetup`. **The name the register already holds wins** and is what
     step 4 displays; the name typed on the website is kept on the invitation
     for staff to compare. **[call]**
   **[builder: exact reuse of `promote`/`AccountSetup` internals]**
3. Marks the email verified.
4. Records consent exactly as `/register` does.
5. Saves **onboarding** (§5).
6. Issues a portal session (`PortalSession::issueFor`) and returns the token.

The readiness server then calls `startSession(token, expires_at)` — the same
cookie a normal sign-in sets — and moves to step 5.

Idempotent: a double-press or retry of step 4 must not create two accounts;
a second accept with an already-used token answers "already a member" rather
than an error. **[builder: mechanism, e.g. the existing idempotency-key pattern]**

### 4.7 After onboarding

Portal home, signed in. Sessions last as long as the register's portal token
does today; nothing about session length changes. **[Bruno: they log in again
only when the session ends]**

## 5. What "saved as onboarding" means

The register keeps, for the new person **[call]**:
- **Their pathway as a goal**: `GOAL_FOR_PATH[path]` written to `person_goal`
  (priority), the same mapping the step-3 "Save as my goal" uses.
- **The raw answers**: the pathway id (`new | better | technical | abroad`),
  whether they said they were sure, and when onboarding completed — because the
  goal mapping is lossy and the owner will want to report on the answers
  themselves. A small onboarding record per person. **[builder: table shape]**
- **Where they came from**: a `person_arrival` with a new allow-listed source
  (e.g. `website-join`) plus the CMS `clickId` and utm values from the
  invitation, so a website signup can be followed into readiness.
- **Their registrant type** (`worker`) as given on the website.

## 6. The "done for you" dialog after sign-in

**[Bruno]** decided:
- It appears **on sign-in**.
- It **leads with auto-fill** — the auto-fill choice is the primary button.
- Choosing **"I'll set it up myself" hides it only until the next sign-in.**
- It **stops for good once they have chosen auto-fill.**

**[call]** for the details:
- "Sign-in" includes the automatic sign-in at the end of onboarding; the
  dialog shows on arrival at portal home after step 6, unless the rule below
  already stops it.
- "Chosen auto-fill" = **a CV reading has completed for them** (step 5 or
  later), as known by the register (CV-read profile rows already carry a
  source). Pressing the button and abandoning at upload or payment does **not**
  count, so the nudge comes back next sign-in. The register exposes this as a
  flag on the signed-in member's own data so the portal stores nothing.
- "Hide until next sign-in" is a cookie scoped to the current session only —
  UI state, not candidate data.
- Same component and copy as the landing dialog (`DoneForYou`,
  `content/done-for-you.ts`), shown inside the signed-in portal. Auto-fill →
  `READING_DESTINATION` (`/cv?from=reading`), priced or free exactly as
  today. Manual → My profile.
- The anonymous landing-page dialog is unchanged.

## 7. Changes by system

### 7.1 Website (`inspire-africa-website`)
- Join server action: CMS submit (all) + register invitation (workers);
  outcome-specific redirects (§4.2).
- `/join/check-email`: wording per outcome; resend asks the register for
  workers.
- Retire the Mighty Networks hand-off: `/join/continue` and the community
  base URL no longer used. **Links already in inboxes** (`/join/verify?token=`,
  at most 72 hours' worth at cutover): verify with the CMS as today, then show
  a short page — "Joining now takes you to INSPIRE AFRICA Readiness. Please
  fill in the join form once more and we'll email you a link" — with a button
  to `/join/start`. **[call]** The CMS verify answer carries only `clickId`, so
  the website cannot build an invitation from it without a CMS change, and the
  register must never hand a raw link to the website (§4.3). The cost is one
  re-entry of three fields for a handful of people, once.
- Copy: remove "hosted on Mighty Networks" and community wording from
  `/join/start`, `/join` (fallback TSX), and legal fallbacks.
  `scripts/assert-join-gate.mjs` and the ESLint rule stay (they forbid
  community links, which remains true).
- New env: register base URL + the website's register secret.

### 7.2 CMS (`inspire-africa-cms`) — **needs write access (see §9)**
- Community signup submit: **workers get no confirmation email**; non-workers
  get a "thanks, we've received your details" email with no link.
- Legal copy (`src/bootstrap/legal-bodies.ts`, published with `RESEED_LEGAL`):
  privacy/terms/cookies wording about Mighty Networks and what the join form
  stores must change to describe the readiness hand-off and the register
  holding worker profiles. **Retention numbers quoted there must stay true.**
- Editor-managed content (in the Strapi admin, not code): the `/join` page's
  community copy and any CTA text mentioning the community.
- **Join statistics [call].** No new CMS statuses. For workers the CMS row now
  ends at `Submitted`: they never verify through the CMS or pass
  `/join/continue`, so `/community/stats`' verified and redirected numbers stop
  meaning anything for them (expected, not a fault). Progress after the join
  form — invitation sent, invitation accepted, onboarding finished — is
  reported from the register, joined to the CMS row by `clickId`. Adding
  "Invited"/"Account created" statuses to the CMS would need a schema change,
  a cross-system callback and a change to the retention purge in
  `src/crons/analytics-maintenance.ts`; not worth it for this change.

### 7.3 Register (`inspire-africa-community-vault`)
- Invitation model + table; create / inspect / resend / accept endpoints
  (§4.3, §4.4, §4.6); separate caller secret; rate limits; audit entries.
- Invitation + "already a member" emails (Mailables, plain + HTML).
- Onboarding record (§5); `website-join` arrival source.
- Member flag "has had a CV read" on the signed-in member's data (§6).
- Tests in the house style (real MySQL/MariaDB in CI).

### 7.4 Readiness portal (`inspire-readiness`)
- `/invite?token=` route handler, invite cookie, link-state pages (§4.4).
- Steps 4–6 for invited workers (§4.5), reusing existing pieces: password
  rules and permission copy from `components/register`, the CV reader from
  `/cv`, profile fields from My profile.
- Step-4 server action → register accept → `startSession`.
- Signed-in "done for you" dialog with the rules in §6.
- Guards in the house style (`npm run verify`): e.g. a test that an invited
  worker is never shown a name or email input; that step 4 never offers a code
  step; that the invite token never appears in a rendered URL after the first
  redirect.

## 8. Security & privacy

- The invitation token is the only key to creating the account. Random,
  ≥ 32 bytes, stored only as a hash, single-use, 7-day expiry, constant-time
  comparison, rate-limited lookups. **[call]**
- The website→register secret is separate from the portal's key and from the
  CMS secrets, so a leak of one cannot be replayed against another. **[call]**
- Accept must refuse if the email now belongs to an account that can sign in
  (someone signed up directly in between) — answer "already a member".
- The readiness portal still stores no candidate data: the invite token lives
  in a short-lived httpOnly cookie; everything else is fetched from the
  register.
- Two systems now hold a worker's name and email (CMS lead row + register
  person). The privacy policy must say so; retention stays as published.
- The register's consent record is created at step 4 with the same wording as
  readiness registration.

## 9. Dependencies, order and risks

**Access.** Bruno's GitHub account has write access to the website, register
and readiness repos, but **read-only on the CMS**. §7.2 needs Emmanuel or
write access before workers stop getting two emails.

**Deploy order** (each step safe on its own):
1. Register: invitations + accept + onboarding + flag (unused until called).
2. Readiness: invite handling + steps 4–6 + signed-in dialog.
3. CMS: per-type emails + legal copy (until this lands, do **not** do step 4).
4. Website: call the register for workers; new wording; retire the Mighty
   Networks hand-off.

**Branches already in flight.**
- Readiness: `feature/central-db-pass-portal` (step-3 "Save as my goal",
  CV-reading routing) is pushed but unmerged; this work builds on top of it.
- Register: production serves the CTO's new admin (Blade/Livewire), which
  exists only on his branches `feature/admin-central-dashboard` and
  `fix/data-capture-on-new-admin` (Oct 25–26; 2 behind `main`, 4 and 7 ahead;
  both edit `routes/api.php`). The "Deploy to production" workflow last ran on
  2026-10-14 from `main`, before Actions was blocked, so production was
  deployed by hand from those branches. **Which base the new endpoints go on
  is open — see §11.**
- Register: `GET /public/reading` (priced CV read) is on `origin/main`
  (`abba16f`, `ada5119`) but, per the above, probably not deployed yet.

**Mail.** All worker emails now depend on the register's mailer (Gmail SMTP,
intermittent connection drops from the VPS, a person's mailbox). Signup
availability is only as good as that. The dedicated sender discussed separately
would remove the single-person dependency.

## 10. Left to the builder
Exact endpoint paths and payloads; table and column names; email HTML; how
the six-step rail is drawn; how step 6 decides what is "still missing"; test
names and fixtures; the copy for the "someone else is signed in" case.

## 11. Open — needs the product owner
1. **Register base branch.** Build the register endpoints on `main`, or on the
   CTO's new-admin branch that production actually runs, and who deploys the
   register?
