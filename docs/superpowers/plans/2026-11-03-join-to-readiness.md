# Join → Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A worker who joins on inspireafricans.com gets an emailed link into readiness `/start`, sets a password at step 4 (account created, signed in), adds CV and work at steps 5–6, and is offered auto-fill on sign-in until they use it — without retyping anything.

**Architecture:** The register (Laravel) owns invitations, accounts, onboarding and all worker email. The website (Next 15) asks the register to invite workers after its existing CMS submit. The readiness portal (Next 16 BFF, stores nothing) inspects/accepts invitations through the register and starts the session. The CMS (Strapi) only stops emailing workers — a local patch, because the CMS repo is read-only for us.

**Tech Stack:** Laravel 13 / PHPUnit / MariaDB · Next.js 16 + Zod + Vitest · Next.js 15 · Strapi 5.

**Spec:** `docs/superpowers/specs/2026-11-03-join-to-readiness-design.md` (this repo, branch `docs/join-to-readiness-design`). Read it first; this plan does not repeat its reasoning.

## Global Constraints

- **Branches** (never commit to `main`, never merge, never deploy):
  register `feature/website-invitations` from `origin/main`;
  readiness `feature/join-invite-onboarding` from `feature/central-db-pass-portal`;
  website `feature/join-to-readiness` from `docs/join-to-readiness-design`;
  CMS `feature/join-emails-by-audience` from `main` (local only, cannot push).
- **Commit messages:** the repo's house style (full behavioural sentence as the subject). **No `Co-Authored-By` lines.** End each message with `Claude-Session: https://claude.ai/code/session_01WBw8oF9rXofvLwxjHWqDZy`. Push the branch after committing (not the CMS).
- **Register changes are additive:** new files, plus appends to `routes/api.php`, `config/portal.php`, `.env.example`, `AppServiceProvider` (limiters). Do not edit admin/Filament/Livewire code. It must later merge onto the CTO's `origin/fix/data-capture-on-new-admin` as well as `main`.
- **Readiness stores no candidate data.** Only the invite token (httpOnly cookie) and UI flags live in cookies. Every number and every name comes from the register.
- **Never reveal on screen whether an address already has an account** (spec §4.2).
- **The raw invite token is never returned by any API**; it exists only inside the email (spec §4.3).
- Invite token: 32 random bytes, base64url; stored as SHA-256 hex; valid **7 days**; single use; resend cap **5** per invitation.
- Registrant types: website `lib/registrant.ts` — only `worker` is invited.
- Starting paths: `new | better | technical | abroad`; goal mapping = readiness `GOAL_FOR_PATH` (`src/content/starting-points.ts`). Register stores the raw path too.

## The contract (all three builders code against exactly this)

Base: register `/api/v1`. JSON. Errors use Laravel's `{message, errors?}`.

**Website-only routes** — header `X-Website-Key` must equal `config('portal.website_key')` (env `WEBSITE_INVITE_KEY`), compared with `hash_equals`; unset key ⇒ every call `401`. Throttled per hashed email (5/hour) and a global cap (`throttle:website-invites` named limiter, 120/min).

| # | Route | Body | Success |
|---|---|---|---|
| W1 | `POST /website/invitations` | `{first_name, last_name, email, registrant_type:"worker", click_id?, source?, utm_source?, utm_medium?, utm_campaign?}` | `202 {"data":{"mail":"sent"}}` in **every** address case (new, unclaimed, claimed→AccountExists email, deactivated→nothing, suppressed→nothing). `{"data":{"mail":"failed"}}` **only** when `MailTransport::canSend()` is false or delivery threw. `422` bad body (incl. `registrant_type` ≠ `worker`). |
| W2 | `POST /website/invitations/resend` | `{click_id}` | `202 {"data":{"mail":"sent"|"failed"}}`; unknown `click_id` ⇒ `"sent"`, nothing sent. Issues a fresh token (old one dies), respects the cap. |

**Portal routes** — unauthenticated like `/register/verify-email`, `visitor-throttle:20,1`; the token is the credential.

| # | Route | Body | Success |
|---|---|---|---|
| P1 | `POST /invitations/inspect` | `{token}` | `200 {"data":{"status":"valid","first_name","last_name","email"}}` or `{"data":{"status":"expired"|"used"|"member"|"unknown"}}` (names only when `valid`; `member` = address now has a claimed account). Path-B invitations return the **register-held** name. |
| P2 | `POST /invitations/renew` | `{token}` | `202 {"data":{"mail":"sent"|"failed"}}` — for an expired (or valid) token: new token emailed to the invitation's address; unknown/used ⇒ `"sent"`, nothing sent. |
| P3 | `POST /invitations/accept` | `{token, password, password_confirmation, consent:true, path, sure:boolean, idempotency_key}` | `200` = **exactly** what `PortalSession::issueFor()` returns today (top-level `token`, `expires_at`). `422` validation (`MemberPassword`, consent, path). `410 {"message","data":{"status":"expired"}}`. `409 {"message","data":{"status":"used"|"member"}}`. `404` unknown. Same `idempotency_key` replayed ⇒ same session response, no second account. |

**Member routes** — normal portal member token, `member-throttle`.

| # | Route | Body | Success |
|---|---|---|---|
| M1 | `GET /me/onboarding` | — | `200 {"data":{"invited":bool,"path":string|null,"sure":bool|null,"completed_at":iso|null,"cv_read":bool}}`; `cv_read` = the person has ≥1 profile row whose source marks it as read from a CV (see migration `2026_10_19_065008_add_source_to_cv_read_profile_rows`). |
| M2 | `PUT /me/onboarding/work` | `{profession_text?, nationality_country_id?, phone?}` | `200 {"data":{"profession_text","nationality_country_id","phone"}}`. Fills a field **only when it is currently empty**, applied directly (no ProfileChangeService review); a non-empty field is left alone and reported unchanged. Phone shape = `InternationalPhone`, stored as the person's phone contact if they have none. |

**Email link:** `{config('portal.app_url')}/invite?token=<token>` (`PORTAL_APP_URL`, already in `.env.example`).

## Review Focus

1. **Double-press / retry at step 4** → one account, one session (P3 idempotency). Register test `accepting_twice_with_one_key_makes_one_account`.
2. **Someone signs up directly at readiness between invite and accept** → accept answers `409 member`, creates nothing. Register test `accept_refuses_when_the_address_has_since_become_a_member`.
3. **Forwarded link opened while another member is signed in** → readiness asks before replacing the session; never silently signs the other person out. Readiness test `an-invite-opened-while-signed-in-asks-before-switching`.
4. **Join form resubmitted three times** → one invitation row, latest token only valid, ≤5 sends. Register test `resubmitting_reissues_and_the_old_link_dies`.
5. **CMS down when a worker joins** → worker is still invited (CMS is measurement only); non-worker sees the honest failure. Website: covered by the action's branching (typecheck + the outcome table in spec §4.2).

---

## Part R — Register (`inspire-africa-community-vault`)

Test command (private MariaDB already running on 127.0.0.1:3417):
`DB_HOST=127.0.0.1 DB_PORT=3417 DB_DATABASE=inspire_africa_test DB_USERNAME=root DB_PASSWORD=ci_root_password ./vendor/bin/phpunit <file>` — style: `./vendor/bin/pint --test <files>`.
House style: long WHY comments, test methods named as sentences, follow `tests/Feature/RegistrationEmailVerificationTest.php` and `PublicRegistrationTest.php` for setup.

### Task R-1: Invitation model, issuing and emails (W1, W2)

**Files:**
- Create: `database/migrations/2026_11_03_090000_create_website_invitation_table.php` — table `website_invitation`: `invitation_id` uuid pk, `email` (lower-cased), `first_name`, `last_name`, `registrant_type`, `click_id` nullable, `source`/`utm_source`/`utm_medium`/`utm_campaign` nullable, `person_id` nullable uuid (set when the address matched a person at issue: path B), `token_hash` char(64) nullable unique, `expires_at`, `send_count` int, `last_sent_at`, `accepted_at` nullable, `accepted_account_id` nullable, `idempotency_key` nullable unique, `onboarding_path` nullable, `onboarding_sure` nullable bool, timestamps. Index `email`, `click_id`.
- Create: `app/Modules/Central/Models/WebsiteInvitation.php`
- Create: `app/Modules/Central/Support/Invitations/WebsiteInvitations.php` — `issue(array $input): string` (returns `'sent'|'failed'`), `resendByClickId(string $clickId): string`, `renew(string $token): string`, `inspect(string $token): array`, `static hashToken(string $token): string`.
- Create: `app/Modules/Central/Mail/WebsiteInvitationMail.php` + text/html views beside the existing mail views (greeting by first name, one button, plain link, "lasts 7 days").
- Create: `app/Http/Controllers/Api/V1/WebsiteInvitationController.php` (`store`, `resend`), `app/Http/Middleware/RequireWebsiteKey.php`.
- Modify (append only): `routes/api.php`, `config/portal.php` (`'website_key' => env('WEBSITE_INVITE_KEY', '')`), `.env.example` (`WEBSITE_INVITE_KEY=`), `AppServiceProvider` (named limiter `website-invites`).
- Test: `tests/Feature/WebsiteInvitationTest.php`

**Interfaces:**
- Produces: `WebsiteInvitations` service + `WebsiteInvitation` model used by R-2/R-3; routes W1/W2 per contract.
- Consumes: `MailTransport::deliver/canSend`, `Suppression::blocking($email)`, `AccountExistsMail` (claimed account case — as `EmailVerification::sendAccountExists` does), `CandidateAccount::isClaimed()/canSignIn()`, `is_active`.

- [ ] **Step 1: Write failing tests** in `WebsiteInvitationTest`:
  - `a_missing_or_wrong_website_key_is_refused` → 401 for none, wrong, and when `portal.website_key` is ''.
  - `a_new_worker_is_emailed_a_seven_day_link` → 202 `{"data":{"mail":"sent"}}`; `Mail::assertSent(WebsiteInvitationMail)`; link starts with `config('portal.app_url').'/invite?token='`; row has `token_hash = sha256(token)`, `expires_at` ≈ now+7d; raw token not in DB, not in response body.
  - `a_claimed_member_gets_the_account_exists_email_and_the_same_answer` → 202 identical body; `AccountExistsMail` sent; no `WebsiteInvitationMail`.
  - `an_unclaimed_record_is_invited_onto_that_person` → row `person_id` = existing person; invitation mail sent.
  - `a_deactivated_account_gets_nothing_but_the_same_answer` → 202 `sent`, no mail, audit entry recorded.
  - `a_suppressed_address_gets_nothing_but_the_same_answer`.
  - `only_workers_are_invited` → `registrant_type:"employer"` ⇒ 422.
  - `resubmitting_reissues_and_the_old_link_dies` → second POST same email: one row, `send_count` 2, old token's hash gone; sixth send ⇒ still 202, no mail.
  - `mail_that_cannot_leave_says_failed` → `MailTransport` unable ⇒ `{"data":{"mail":"failed"}}`.
  - `resend_by_click_id_is_uniform` → unknown id ⇒ `sent`, no mail; known ⇒ new token mailed.
- [ ] **Step 2: Run** `…phpunit tests/Feature/WebsiteInvitationTest.php` — expect failures (routes missing).
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Run** the test file — all pass; `pint --test` on new files clean.
- [ ] **Step 5: Commit + push** `feature/website-invitations`.

### Task R-2: Inspect, renew, accept (P1–P3)

**Files:**
- Create: `app/Http/Controllers/Api/V1/InvitationController.php` (`inspect`, `renew`, `accept`)
- Create: `app/Modules/Central/Support/Invitations/AcceptInvitation.php` — `handle(WebsiteInvitation $inv, array $input, Request $request): JsonResponse`
- Create migration `2026_11_03_090100_create_person_onboarding_table.php` — `person_onboarding`: `person_id` uuid pk, `path`, `sure` bool, `source` (`website-join`), `invitation_id` nullable, `completed_at`, timestamps. Model `app/Modules/Central/Models/PersonOnboarding.php`.
- Modify (append): `routes/api.php`; `config/portal.php` `arrival_sources` gains `'website-join' => 'Website join form'`.
- Test: `tests/Feature/InvitationAcceptTest.php`

**Interfaces:**
- Consumes: R-1 service/model; `RegistrationIntake::record()/promote($submission, 'auto:website-invite')` (path A); `AccountSetup` reasoning + `CandidateAccount` for path B; `PortalSession::issueFor($account, $request)`; consent recording as `RegistrationController::submit` does; `PersonGoal::TYPES`; `PersonArrival`; `MemberPassword` rule.
- Produces: P1–P3 per contract; `person_onboarding` row read by R-3.

- [ ] **Step 1: Write failing tests** in `InvitationAcceptTest`:
  - `inspect_tells_valid_expired_used_member_and_unknown_apart` (names only on `valid`).
  - `inspect_shows_the_register_held_name_for_a_known_person`.
  - `accepting_creates_the_person_account_consent_goal_arrival_and_onboarding` → 200 with top-level `token`; person names/email = invitation's; account claimed + `canSignIn()`; email verified; consent recorded; `person_goal` of the mapped type (read the four values of `GOAL_FOR_PATH` from readiness `src/content/starting-points.ts` and mirror them in a register constant); `person_arrival` source `website-join`; `person_onboarding` path/sure; invitation `accepted_at` set, `token_hash` null.
  - `accepting_onto_a_known_person_sets_the_password_and_keeps_their_name` (path B: no new person row).
  - `accepting_twice_with_one_key_makes_one_account` → second call same key ⇒ 200 same account, one `CandidateAccount`.
  - `a_used_token_is_409_used_and_an_expired_one_410`.
  - `accept_refuses_when_the_address_has_since_become_a_member` → 409 `member`, nothing created.
  - `a_weak_password_or_missing_consent_is_422` (uses `MemberPassword`).
  - `renew_mails_a_fresh_link_and_kills_the_old_one`.
- [ ] **Step 2: Run** — fail.
- [ ] **Step 3: Implement**; accept runs in one DB transaction with `lockForUpdate` on the invitation row.
- [ ] **Step 4: Run** — pass; pint clean.
- [ ] **Step 5: Commit + push.**

### Task R-3: Member onboarding read + work fill (M1, M2)

**Files:**
- Create: `app/Http/Controllers/Api/V1/OnboardingController.php` (`show`, `work`)
- Modify (append): `routes/api.php` inside the member group.
- Test: `tests/Feature/MemberOnboardingTest.php`

- [ ] **Step 1: Failing tests:** `onboarding_reports_the_path_and_whether_a_cv_was_read` (false before, true after a CV-sourced profile row exists); `a_member_who_was_not_invited_reads_invited_false`; `work_fills_empty_fields_directly_without_review` (nationality applied, no pending change row); `work_leaves_a_filled_field_alone`; `a_malformed_phone_is_422`.
- [ ] **Step 2–4:** run → implement → pass; pint clean.
- [ ] **Step 5: Commit + push.** Then run the **whole** suite once (`./vendor/bin/phpunit`) and record the totals in the final report.

---

## Part P — Readiness portal (`inspire-readiness`)

Verify: `npm run verify` (eslint 0 warnings + vitest + next build + asserts; set `INSPIRE_API_BASE_URL=https://register.invalid/api/v1` for the build). House style: test files named as sentences under `src/tests/`; `call()` from `src/lib/api/client.ts` with Zod schemas in `src/lib/api/schemas.ts`; kit components only (`assert-one-component`: no raw `<input>`/`<svg>`/`<button>` in new files outside `src/ui/`); copy in `src/content/*`. Mock the register in tests the way existing action tests do.

### Task P-1: Invitation client, `/invite` route, link-state page

**Files:**
- Create: `src/lib/invitation.ts` (`import "server-only"`): `inspectInvitation(token): Promise<InviteStatus>`, `renewInvitation(token): Promise<{mail:"sent"|"failed"}>`, `acceptInvitation(input: AcceptInput): Promise<Result<SessionGrant>>`, `INVITE_COOKIE = "inspire_readiness_invite"`, `readInviteToken(): Promise<string|null>`.
  Types: `InviteStatus = {status:"valid"; firstName; lastName; email} | {status:"expired"|"used"|"member"|"unknown"}`; `AcceptInput = {token; password; passwordConfirmation; consent: boolean; path: PathId; sure: boolean; idempotencyKey: string}`; `SessionGrant = {token: string; expiresAt: string|null}`.
- Modify: `src/lib/api/schemas.ts` (Zod for P1–P3, M1, M2).
- Create: `src/app/invite/route.ts` (GET): token from `?token=` → `inspectInvitation` → `valid`: set `INVITE_COOKIE` (httpOnly, secure in prod, sameSite lax, path `/`, maxAge 7200) and 303 to `/start`; otherwise 303 to `/invite/status?s=<status>`. If a session cookie already exists, 303 to `/invite/status?s=signed-in` (keep the invite cookie set). Check `src/proxy.ts` lets `/invite` through unauthenticated.
- Create: `src/app/(public)/invite/status/page.tsx` + copy in `src/content/invitation.ts`: expired → "This link has expired" + renew button (server action → `renewInvitation` from cookie); used/member → "You already have an account" + Sign in; unknown → "We couldn't match that link"; signed-in → "Continue as {invited first name}" (ends the current session, then `/start`) or "Stay signed in".
- Tests: `src/tests/an-invite-link-leaves-no-token-in-the-address.test.ts`, `src/tests/an-invite-opened-while-signed-in-asks-before-switching.test.tsx`, `src/tests/every-invite-state-says-what-to-do.test.tsx`.

- [ ] Steps: failing tests → run (fail) → implement → run (pass) → commit + push.

### Task P-2: `/start` steps 4–6 for an invited worker

**Files:**
- Modify: `src/app/(public)/start/page.tsx` — read invite cookie; when valid, pass `invitation={firstName,lastName,email}` and `cvPriced` (from `publicReadingOffer()` offer ≠ null) to `StartJourney`; allow `step` up to 6 for invitees only.
- Modify: `src/components/start/StartJourney.tsx` — `invitation?: {firstName; lastName; email} | null`, `cvPriced?: boolean`. With an invitation: 6-step rail; greeting by first name; step 3's call to action becomes **Continue** → step 4; steps 4–6 below. Without one: unchanged (3 steps).
- Create: `src/components/start/AccountStep.tsx` (step 4: name + email as text, never inputs; password + confirm via the kit and the same client checks `components/register` uses; the permission tick + "what we keep and why" copy reused from `components/register/ConsentStep.tsx` / its content; "Not you?" note), `src/components/start/OnboardingCvStep.tsx` (reuse `useCvUploads`/`useCvReading` from `src/components/cv/` so a read is confirmed into the profile; Skip always; not rendered when `cvPriced`), `src/components/start/WorkStep.tsx` (profession, nationality from `/register/countries`, optional phone; prefilled from `/me` profile; Skip).
- Create: `src/lib/invitation-actions.ts` (`"use server"`): `acceptInvitationAction(prev, form)` → `acceptInvitation` → `startSession(grant.token, grant.expiresAt)` → delete `INVITE_COOKIE` → `{ok:true}`; maps 409/410/404/422 to the step's messages. `saveOnboardingWorkAction(prev, form)` → M2 → `redirect("/")`.
- Tests: `src/tests/an-invited-worker-is-never-asked-their-name-or-email.test.tsx`, `src/tests/step-four-creates-the-account-and-signs-in-without-a-code.test.ts`, `src/tests/a-priced-reading-skips-the-cv-step.test.tsx`, `src/tests/the-public-first-step-still-has-three-steps.test.tsx`.

- [ ] Steps: failing tests → run → implement → run → `npm run verify` green → commit + push.

### Task P-3: The "done for you" dialog on sign-in

**Files:**
- Create: `src/lib/onboarding.ts` (server-only): `memberOnboarding(token): Promise<{invited; path; sure; completedAt; cvRead} | null>` (M1).
- Create: `src/components/home/SignedInDoneForYou.tsx` — reuses `DoneForYou` visuals/copy from `components/landing/DoneForYou.tsx` + `content/done-for-you.ts`; **auto-fill is the primary button** → `READING_DESTINATION`; secondary "I'll set it up myself" → server action `dismissDoneForYouAction()` sets cookie `ia_dfy_dismissed = sessionMarker` then → `/profile`.
  `sessionMarker = sha256(sessionToken).slice(0,16)` — a new sign-in has a new token, so the dismissal no longer matches and the dialog returns (spec §6).
- Modify: the signed-in home render in `src/app/(portal)/page.tsx` — show it when `cvRead === false` and the cookie ≠ the current marker. Opens on arrival (not the landing's localStorage-once rule).
- Tests: `src/tests/the-dialog-follows-a-member-until-a-cv-is-read.test.tsx` (shown when cvRead false; hidden when true), `src/tests/setting-up-myself-hides-the-dialog-only-until-next-sign-in.test.ts` (marker match hides; different token shows), `src/tests/auto-fill-is-the-first-choice.test.tsx`.

- [ ] Steps: failing tests → run → implement → run → `npm run verify` green → commit + push.

---

## Part W — Website (`inspire-africa-website`)

Verify: `npm run lint && npm run typecheck && NEXT_PUBLIC_SITE_URL=https://ci.example.invalid STRAPI_MEDIA_URL=https://cms.ci.example.invalid npm run build` (prebuild runs `smoke:join`). No test runner exists; do not add one.

### Task W-1: Workers are invited into readiness; Mighty Networks hand-off retired

**Files:**
- Create: `lib/register.ts` (server-only, same rules as `lib/cms/community.ts`): `requestInvitation(input: InviteInput, forward?): Promise<InviteResult>`, `resendInvitation(clickId: string): Promise<InviteResult>`; env `REGISTER_API_URL` (e.g. `https://db.inspireafricans.com/api/v1`), `REGISTER_WEBSITE_KEY`; 20 s timeout (mail is sent inline). `InviteResult = {ok:true; mail:"sent"|"failed"} | {ok:false; reason:"validation"|"rate_limited"|"unavailable"; message?: string}`.
- Modify: `app/join/start/actions.ts` — keep the CMS `submitSignup` call for everyone. Worker: ignore CMS failure; call `requestInvitation({first_name,last_name,email,registrant_type:"worker",click_id,source,utm_*})`; on `ok` redirect `/join/check-email?for=worker&clickId=…` (+`&mail=failed` when `mail==="failed"`); on not ok return the existing error messages (rate_limited / validation / unavailable wording). Non-worker: today's behaviour, redirect `/join/check-email?for=other&clickId=…`.
- Modify: `app/join/check-email/page.tsx` — `for=worker`: "Check your email — we've sent you a link to continue to INSPIRE AFRICA Readiness." + resend; `for=other`: "Thanks — we've received your details. We'll be in touch." with **no link and no resend**; `mail=failed` keeps today's honest failure block. Remove the `already verified → /join/continue` branch.
- Modify: `app/join/check-email/actions.ts` + `components/forms/ResendVerificationForm.tsx` — accept a `for` hidden field; worker ⇒ `resendInvitation(clickId)`, other ⇒ no resend offered.
- Modify: `app/join/verify/page.tsx` — on CMS verify success render "Joining now takes you to INSPIRE AFRICA Readiness. Please fill in the join form once more and we'll email you a link." + button to `/join/start?source=verify_moved` (no redirect to `/join/continue`).
- Modify: `app/join/continue/route.ts` — 303 to `/join/start?source=continue_retired`; no `markRedirected`, no community URL.
- Modify: copy that mentions Mighty Networks / "the community is hosted" in `app/join/start/page.tsx` and the `/join` TSX fallback (`app/join/page.tsx`) — worker-facing wording points to INSPIRE AFRICA Readiness. Leave legal pages alone (CMS bodies are live; legal copy goes through the owner — see Part C).
- Modify: `.env.example` (`REGISTER_API_URL=`, `REGISTER_WEBSITE_KEY=` with a comment: must equal the register's `WEBSITE_INVITE_KEY`), `docs/10-environment-variables.md` rows, `docs/19-community-signup.md` §2 a short "Superseded by the join→readiness spec" note.

- [ ] Step 1: implement `lib/register.ts`; typecheck.
- [ ] Step 2: action branching per the table in spec §4.2; typecheck.
- [ ] Step 3: pages, resend, verify, continue, copy, env/docs.
- [ ] Step 4: full verify command green; `grep -rn "mn\.co\|Mighty Networks" app components lib` shows only comments/allow-listed guard code.
- [ ] Step 5: commit + push `feature/join-to-readiness`.

---

## Part C — CMS (`inspire-africa-cms`, local branch only)

### Task C-1: Emails by audience
**Files:** `src/api/community-signup/controllers/community-signup.ts`, `src/utils/community/verification.ts`.
- `submit`: when `signup.registrantType === 'worker'` → no verification token, no email; response `verificationSent: true` (the website no longer reads it for workers). Otherwise → send `thankYouEmail({firstName})` (new function in `verification.ts`, plain + HTML, **no link**), no verification token.
- Verify: `npx tsc --noEmit` + `NODE_ENV=production npm run build`. Commit locally; write `git format-patch -1` to the scratchpad; do not push.
- Owner follow-ups (not code): legal copy in `src/bootstrap/legal-bodies.ts` (Mighty Networks → readiness; register holds worker profiles) — draft wording in the hand-off, owner approves, Emmanuel publishes with `RESEED_LEGAL`.

## Execution

Three builders in parallel (register R-1→R-3, readiness P-1→P-3, website W-1), the CMS patch by the coordinator, then one cross-repo review against this plan + spec, fixes, and a merge-check of the register branch onto `origin/fix/data-capture-on-new-admin`.
