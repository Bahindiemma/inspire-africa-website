# PROMPT: Capture the full candidate profile at website signup

You are a senior engineer joining the INSPIRE AFRICA codebase (Next.js 15 App Router + Strapi v5 +
MySQL). You implement the decision below faithfully, you phase it so each step is shippable, and
you say plainly — once — where a requirement cannot lawfully or safely be built as stated, then
build the version that can.

---

## 1. The decision you are implementing

**All candidate attributes Andrew Pound specified are to be captured at signup on the INSPIRE AFRICA
website, and the profile schema is to be merged into `community-signup`.** The website — not a
separate back-office system — is the point of capture. The CEO's position is that the signup form
*is* the database front door, so the data should be collected there rather than assembled later.

This reverses an earlier recommendation (see `docs/20-person-registry-phase1-analysis.md`) that the
registry belong in `inspire-lmis-backend`. Treat the reversal as settled. What is **not** settled,
and what you must resolve in Phase 1, is the *system of record* question in §4.1 — because "capture
it on the website" and "the website owns it forever" are different claims, and only the first was
decided.

### Andrew's attributes (email 2026-08-04, "Re: Two-step signup process")

1. **ID** — first name, last name, other names, DOB, ID type, ID number, ID issuing authority, ID expiry
2. **Contact** — email, SMS number, messaging mobile number, terrestrial phone, residential address
3. **Academic qualifications** — issuing body flagged for accreditation by the competent national authority
4. **Professional qualifications** — short courses and everything else, issuing body accreditation-flagged
5. **Professional experience** — employer, job title, dates, responsibilities matched to a standard job description
6. **Language competency** — language, level, qualification, issuing body, date, expiry, grade
7. **Fitness** — health certificate (+number, expiry, issuing authority, tests covered); police clearance (+number, expiry) — **see §3, blocked**
8. **Character references** — name, relationship, email
9. **Infectious disease screening** — TB, yellow fever, etc. — **see §3, blocked**
10. **Interview transactions** — proposed, shortlisted, interviewed, offered, accepted, CoS, visa, travel documents
11. **Source of name** — self-selection, or appended if bulk-uploaded from a third party

Plus profiling: survey responses, HA psychometric, WILD learner profile.

---

## 2. Current state (verified 2026-08-04 — re-confirm before editing)

**Website** (`/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`) —
Next.js 15.5, React 19, Tailwind v4, **three runtime dependencies only**.

`/join/start` is live. It records the CTA click **server-side on render** (consent-independent,
works with JS disabled, prefetch-guarded), collects five fields, writes to `api::community-signup`
via a token-gated CMS endpoint, then 303s to Mighty Networks with `autojoin=1` + UTM.
Documented in `docs/19-community-signup.md`.

`api::community-signup` (Strapi) — `clickId` (unique), `status`
(`Clicked|Submitted|RedirectedToMN|MemberConfirmed|Duplicate|Spam`), `email`, `firstName`,
`lastName`, `phone`, `country`, consent flags + `consentRecordedAt`, attribution (`source`, `utm*`,
`referrerHost`, `landingPath`), `attempts`, lifecycle timestamps, `ipHash` (salted/truncated — raw
IP never stored), `userAgent`, `deviceType`, `botScore`. All identity fields `private: true`;
`content-api.visible: false`; controller enforces `inspire-admin`; ingest gated by
`global::is-signup-ingest` (a secret separate from the analytics token).

**Production row counts are 0** for `community_signups`, `form_submissions`, `job_postings`. There
is no data to migrate. `api::candidate` was deleted (commit `217bda7`) as an unused duplicate.

**LMIS** (`~/Desktop/inspire-lmis-backend`) — Laravel + PostgreSQL, 27 tables including `persons`,
`applications`, `application_events`, `visas`, `consents`, `audit_entries`, with **row-level
security**, **field-level encryption**, and an **append-only audit trail**. Commit `c60892a` added a
normalised profile layer there — `person_roles`, `contact_points`, `identity_documents`,
`qualifications`, `work_experiences`, `language_competencies`, `character_references`,
`issuing_bodies` + `accreditations`, `occupations` (ISCO-08) — tested against real data.

**That LMIS work is the reference data model for this task.** Do not redesign the entities from
scratch; port their shape. Read `inspire-lmis-backend/docs/person-profile-layer.md` first.

---

## 3. Hard constraint — items 7 and 9 must NOT be collected at signup

Health certificates, "tests covered", and TB / yellow-fever screening are **UK/EU GDPR Article 9
special-category data**. The police clearance certificate in item 7 is **Article 10 criminal-offence
data**.

- The lawful basis published in the live privacy policy is **legitimate interests**, which covers
  neither.
- Collecting them *at signup* has an additional defect beyond the basis: at signup there is **no
  purpose yet** — no job, no employer, no offer. Article 5(1)(c) data minimisation is not satisfied
  by "we might need it later", and consent obtained with no concrete purpose is not informed consent.
- A **DPIA is mandatory** (large-scale special-category processing, vulnerable data subjects,
  cross-border transfers) and must be completed *before* a schema holds this data.

**Therefore: build items 1–6, 8, 10 and 11 into the signup capture. Do not create fields, form
steps, or CMS attributes for items 7 or 9.** Leave a documented extension point. If the CEO
directs otherwise after reading this, that is their call to make in writing — but it needs the DPIA
and a distinct lawful basis first, and you should say so rather than quietly adding the fields.

Note: the LMIS dashboard already *scores* "Police clearance verified" and "Medical fitness verified"
without holding those tables, so this data is evidently already moving through the business
somewhere (likely `candidate_documents`). Flag that — the DPIA question is live today, not
hypothetical.

---

## 4. Phase 1 — decisions to make before code

### 4.1 System of record — the decision that governs everything else

"Capture it on the website" does not settle "the website owns it". Three options; recommend one and
justify it:

- **(a) Strapi is the capture surface; LMIS remains the registry.** The signup writes a full profile
  to `community-signup`, then pushes it to LMIS `persons` + profile tables. Strapi holds it only
  until synced. *Pro:* one registry; keeps encryption/RLS/audit where they already exist. *Con:*
  needs a sync mechanism and a failure/retry story.
- **(b) Strapi becomes the registry; LMIS consumes from it.** *Pro:* simplest capture path. *Con:*
  Strapi has **no field-level encryption and no row-level security** — you would be holding passport
  numbers with materially weaker protection than the system that holds them today. Say this plainly
  if you recommend it.
- **(c) Both, independently.** Do not recommend this. Two divergent person registries with two
  unique emails is the exact failure the earlier analysis identified.

Default recommendation is **(a)** unless you can show otherwise. Whichever you choose, state what
happens to LMIS commit `c60892a`: kept as the sync target, or reverted.

### 4.2 How to model 1:N in Strapi

Andrew's model is one-to-many — a person has many qualifications, languages, experiences,
references. `community-signup` is a single flat content type. Choose and justify:

- **Repeatable components** (e.g. `profile.qualification`) — natural when the children have no
  independent life outside the signup, keeps everything in one admin screen, populates in one query.
- **Related collection types** — needed if a child must be queried or verified independently.
- Note the existing dynamic-zone populate cost in `lib/cms/pages.ts` and ADR-007; deep populate in
  Strapi v5 is verbose and easy to get wrong (see the documented `populate[...][populate]` defect).

Recommend repeatable components for items 3–6 and 8, with a stated migration path to collection
types if independent verification workflows arrive.

### 4.3 Conversion — the thing most likely to be got wrong

The signup funnel was built and instrumented three days ago and currently converts a click into a
lead in five fields. Andrew's full list is roughly **40–60 inputs**. Putting them on one form will
collapse completion; that is not a matter of opinion.

Design a **multi-step wizard with save-and-resume**, and hold this line:

- **Step 1 remains exactly the five current fields** — first name, last name, email, phone,
  country, plus consents. A `Submitted` record is written **at the end of step 1**, before any
  further question is asked. This preserves the existing click→lead metric and means an abandoned
  profile is still a captured lead rather than nothing.
- Steps 2+ collect items 1–6, 8. Each step saves on completion; the visitor can leave and return.
- The Mighty Networks handoff must still happen — decide and state **when**: after step 1 (protects
  the community-join conversion) or after the final step. Recommend after step 1, with the profile
  continuing afterwards.
- Report `profileCompleteness` (0–100) so partial profiles are visible and chaseable.

If you conclude the CEO's intent is literally one long form, implement the wizard anyway and present
the funnel data — but say so explicitly rather than silently substituting your design.

### 4.4 Other decisions

- **Accreditation** (items 3, 4): port `issuing_bodies` + `accreditations` from LMIS. Accreditation
  is time-bounded and multi-authority — resolve it at read time; a stored boolean goes stale
  silently. `null` (unknown issuer) must remain distinct from `false` (not accredited).
- **Item 5 "standard job description"**: ISCO-08, as already chosen in LMIS. Do not invent a taxonomy.
- **Item 10** is a *lifecycle*, not signup input. It belongs to `applications` /
  `application_events` in LMIS. Do not put interview transactions on a signup form.
- **Item 11**: `community-signup` already carries `source` + `utm*`. Extend for bulk third-party
  upload, and state the duplicate-person policy — **never auto-merge**; flag for human adjudication.
- **Documents**: certificates and IDs are files. Strapi's default upload is unsuitable for identity
  documents. Specify private storage + signed, expiring URLs, and confirm production
  `MEDIA_PROVIDER` / `AWS_S3_ACL` / `AWS_S3_SIGNED_URL_EXPIRES`.

---

## 5. Phase 2 — design

- ERD of the merged `community-signup` model, marking every field's data-protection class.
- The wizard: steps, fields per step, validation, save-and-resume mechanism, completeness scoring.
- The sync contract to LMIS (if option (a)): payload, idempotency key, retry, failure visibility.
- Migration plan. Note there are **0 production rows**, so this is close to free — say so rather
  than inventing a backfill.
- Privacy policy diff — mandatory, see §7.

## 6. Phase 3 — implementation

Follow the conventions already in the repo:

- Strapi: `private: true` on every identity field, `content-api.visible: false`, `requireAdmin()`
  on core verbs, token-gated custom routes via a policy, salted-hash any IP, never store raw IPs.
- Website: Server Actions for progressive enhancement (the existing form works with JS disabled —
  **do not regress this**), `prefetch={false}` on gate CTAs, the click still recorded server-side.
- Reuse `keepExisting()` semantics from the signup controller: a sparse resubmission must never
  erase captured data, and attribution stays first-touch.
- Legal copy lives in `inspire-africa-cms/src/bootstrap/legal-bodies.ts` and publishes via
  **`RESEED_LEGAL`** — never `RESEED_CONTENT`, which rewrites every page and destroys admin edits.

## 7. Privacy policy — ships in the same change, not after

The live policy describes collecting name, email, phone and country under legitimate interests. This
change collects date of birth, identity-document numbers, employment history, qualifications and
third-party referee contact details. The policy must be updated **in the same deployment**, covering
each new category, its lawful basis, its retention period, and the referees' position (third parties
who never consented themselves — they need a source-of-data notice under Article 14).

Retention constants must match the published text: `COMMUNITY_LEAD_RETENTION_MONTHS=36`,
`COMMUNITY_CLICK_RETENTION_MONTHS=14`.

## 8. Hard constraints

- **No new website runtime dependencies** without justification (currently exactly three).
- Must pass `npm run typecheck`, `npm run lint`, `npm run build` (website) and `tsc --noEmit` +
  `strapi build` (CMS). Run them; paste output. Note: CMS builds are slow on the 4 GB-swap VPS.
- `/join/start` step 1 must keep working **with JavaScript disabled** and must keep **failing open**
  to Mighty Networks if the CMS is unreachable.
- No PII readable by the Public role or the site's read-only token — expect 403.
- Do not add fields for items 7 or 9 (§3).

## 9. Acceptance criteria

1. Step 1 is unchanged in field count and still converts; a `Submitted` row exists after step 1 alone.
2. A visitor can abandon at step 3 and return later; nothing captured is lost.
3. Items 1–6 and 8 are capturable and visible in the Strapi admin.
4. No Article 9 / Article 10 field exists anywhere in the schema.
5. Sparse resubmission never erases data; attribution remains first-touch.
6. No PII reachable unauthenticated (403 on every endpoint).
7. Privacy policy updated and published via `RESEED_LEGAL`, matching exactly what is collected.
8. `typecheck` + `lint` + `build` pass in both repos.
9. If option (a): a signup provably reaches LMIS `persons`, and a sync failure is visible rather
   than silent.

## 10. How to work

1. **Phase 1 analysis as prose first — no schemas, no code.** §4.1 (system of record) and §4.3
   (wizard vs one form) are the two answers that determine everything else.
2. Read `docs/19-community-signup.md`, `docs/20-person-registry-phase1-analysis.md` and
   `inspire-lmis-backend/docs/person-profile-layer.md` before proposing anything.
3. Label assumptions `ASSUMPTION` and say how to verify them.
4. Raise a concern once, clearly, then implement the owner's decision — except §3, which is a legal
   constraint rather than a preference and needs a DPIA, not a decision.
5. Do not mark anything complete you have not run.
