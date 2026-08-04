# PROMPT: INSPIRE AFRICA — "Database Front Door" / Person Registry

You are a senior engineer + data architect joining the INSPIRE AFRICA codebase (Next.js 15 App
Router + Strapi v5 + MySQL). You have worked on regulated systems that hold identity, health and
criminal-record data. You write production code, you phase large changes, and you say plainly when
a requirement is unlawful, unsafe, or premature — then implement what the owner decides.

---

## 1. Where the code actually is today (verified — re-confirm before editing)

Repos:
- **Website** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`
  Next.js 15.5, React 19, TS 5.7, Tailwind v4. **Three runtime deps only.**
- **CMS** — `/Users/mediachallengeinitiative/Desktop/INSPIRE AFRICA/inspire-africa-cms`
  Strapi v5.46, MySQL in prod (SQLite locally). Deployed via Docker → Contabo VPS.

### Just shipped (2026-08-04) — the thing Andrew is responding to

`/join/start` is a signup gate in front of Mighty Networks. Every "Join the Community" CTA routes
through it. It records the click **server-side on render** (consent-independent, works with JS off),
collects first name / last name / email / phone / country + consents, writes to
`api::community-signup`, then 303s to Mighty Networks with `autojoin=1` + UTM.

`api::community-signup` fields: `clickId` (unique), `status`
(`Clicked|Submitted|RedirectedToMN|MemberConfirmed|Duplicate|Spam`), `email`, `firstName`,
`lastName`, `phone`, `country`, `passwordHash` (off by default), consent flags +
`consentRecordedAt`, attribution (`source`, `utm*`, `referrerHost`, `landingPath`), `attempts`,
lifecycle timestamps, `ipHash` (salted/truncated — **raw IP is never stored**), `userAgent`,
`deviceType`, `botScore`. All identity fields are `private: true`; `content-api.visible: false`;
controller enforces `inspire-admin` on core verbs. Ingest is via a shared secret
(`global::is-signup-ingest`), separate from the analytics token. Docs: `docs/19-community-signup.md`.

### The collision you must resolve — `api::candidate` already exists

`inspire-africa-cms/src/api/candidate/content-types/candidate/schema.json` already holds:
`fullName`, `email` (**unique**), `phone`, `countryOfOrigin`, `currentLocation`, `resume` (media,
private), `portfolio`, `skillTags` (m2m → `tag`), `sectors` (**json**), `yearsExperience`,
`languageProficiency` (**json** — `[{language, level}]`), `applicationStatus`
(`New|Screening|Assessment|Matched|Deployed|Returned|Withdrawn|Rejected`), `assignedAgent`
(→ users-permissions user), `notes`, consent flags.

So today there are **two competing identity records** — `community-signup` and `candidate` — each
with their own `email`, and Andrew is asking for a third structure on top. Reconciling these is the
first architectural problem, not an afterthought. `languageProficiency` and `sectors` being JSON
blobs is exactly what Andrew is asking to normalise.

Also present: `job-posting` (title, slug, destinationCountry/City, sector, salary*, requirements,
benefits, closingDate, status, vacancies, tags, seo), `tag`, `form-submission`, `form-definition`,
`legal-document`, analytics entities, `page`, `blog-post`, `author`, `corridor`, `site-setting`,
`navigation`, `design-token`.

Access model: Public users-permissions role is locked to `form-submission.create` **only** — which
also strips `auth.callback`, so **no users-permissions JWT can be issued at all** unless
`KEYCLOAK_ENABLED=true`. Design around that; do not assume you can log a user in.

---

## 2. What Andrew asked for (email, 2026-08-04, "Re: Two-step signup process")

> "It is our **database front door** through which everyone must pass, **regardless of their status
> (jobseeker, employer, government, internal, other)**. We should have several discrete tables …
> that link to these initial registration identifiers."

1. **ID** — first name, last name, other names, DOB, ID type, ID number, ID issuing authority, ID expiry
2. **Contact** — email, SMS number, messaging mobile number, terrestrial phone, residential address
3. **Academic qualifications** — issuing body **flagged for accreditation by the competent national authority**
4. **Professional qualifications** — short courses + everything else, issuing body accreditation-flagged
5. **Professional experience** — employer, job title, dates, responsibilities **matched against a 'standard' job description**
6. **Language competency** — language, level, qualification, issuing body, date, expiry, grade
7. **Fitness** — health certificate (+number, expiry, issuing authority, tests covered); police clearance (+number, expiry)
8. **Character references** — name, relationship, email
9. **Infectious disease screening** — TB, yellow fever, etc.
10. **Interview-related transactions** — proposed, shortlisted, interviewed, offered, accepted, certificate of sponsorship, visa, travel documents
11. **Source of name** — self-selection, or appended if bulk-uploaded from a third party

Plus: "**profiling transactions**" — survey responses, HA psychometric test, WILD learner profile.

---

## 3. The architectural call to make first (and defend)

Andrew's "everyone must pass, regardless of status" is the load-bearing sentence. It means the root
entity is **not** a Candidate. Model it as a **Person / Party**, with *roles* attached:

```
person (identity — one row per human, ever)
  ├── person_role        jobseeker | employer_contact | government_official | internal | other
  │                      (a person may hold several, over time, with validity dates)
  ├── identity_document   1..n   (Andrew #1 — passport, national ID, …)
  ├── contact_point       1..n   (Andrew #2 — typed: email / sms / whatsapp / landline / postal)
  ├── qualification       1..n   (Andrew #3+#4 — one table, `kind: academic|professional`)
  ├── work_experience     1..n   (Andrew #5)
  ├── language_competency 1..n   (Andrew #6)
  ├── clearance           1..n   (Andrew #7+#9 — health cert, police check, disease screen)
  ├── character_reference 1..n   (Andrew #8)
  ├── application         1..n   (Andrew #10 — per job-posting, with a transaction log)
  └── assessment          1..n   (profiling — survey, psychometric, learner profile)
```

Things to decide and justify, not assume:
- **Does `community-signup` become the registration *event* that creates/links a `person`?** It
  should — it is already the front door and holds attribution. Keep it as the immutable event
  record; do not turn it into the identity table.
- **What happens to `api::candidate`?** It cannot survive unchanged alongside `person` — two unique
  emails, two sources of truth. Options: (a) migrate it into `person` + `person_role[jobseeker]` +
  the child tables and retire it; (b) keep it as a thin jobseeker-role projection. Recommend one,
  with a **data migration plan and a rollback**. There is live data — check row counts first.
- **Contact as a table vs columns.** Andrew lists 5 contact types. A typed `contact_point` table
  (type, value, isPrimary, verified, verifiedAt) generalises better than 5 columns and supports the
  verification state everything else needs.
- **Andrew #3 and #4 are one shape.** Both are "qualification + issuing body + accreditation".
  Model once with a `kind` discriminator unless you can show why not.
- **Accreditation is not a boolean.** "Flagged for accreditation by the competent national
  authority" implies a reference registry: `issuing_body` (name, country, type) and
  `accreditation` (issuing_body → accrediting authority, status, valid from/to, evidence). Propose
  it; note the seeding/maintenance burden honestly.
- **"Matched against a 'standard' job description"** implies an occupational taxonomy. Do **not**
  invent one — evaluate **ISCO-08** (ILO, international, maps to national schemes), **O*NET** (US),
  **UK SOC 2020**. Recommend one and say how `job-posting.sector` and `tag` relate to it.
- **Verification/provenance is cross-cutting.** Every credential needs: `status`
  (`self_declared|submitted|verified|rejected|expired`), verifier, verifiedAt, evidence document,
  and an expiry where applicable. Design it once (a shared component or consistent field set), not
  eleven times.
- **Identity resolution.** Andrew #11 (bulk upload from third parties) guarantees duplicate humans
  arriving from different sources. Specify the matching strategy (deterministic on ID
  number + issuing authority; probabilistic on name+DOB+contact), what happens on a suspected
  match, and who adjudicates. Never silently auto-merge person records.

---

## 4. Phase 1 — analysis and hard questions (deliver BEFORE any code)

Write this as prose. No schemas yet.

1. **Reconcile the three overlapping models** (`community-signup`, `candidate`, Andrew's list).
   Row counts from production first — `docker compose exec db` — so the migration is sized in real
   numbers, not hypotheticals.

2. **Classify every field Andrew listed by data-protection category.** This is the most important
   deliverable in Phase 1. At minimum:
   - **UK/EU GDPR Article 9 (special category)** — health certificate, tests covered, infectious
     disease screening (TB, yellow fever), anything medical. Also potentially psychometric results.
   - **Article 10 (criminal convictions/offences)** — police clearance certificate. In the UK this
     additionally engages DBS handling rules.
   - **Identity documents** — passport/national ID numbers are prime identity-theft material.
   State plainly: **the "legitimate interests" basis currently used for community signup does NOT
   cover Article 9 or Article 10 data.** Each needs its own lawful basis and an Article 9(2)/10
   condition (likely explicit consent and/or employment-law obligations), plus a **DPIA** — which is
   mandatory here (large-scale special-category processing of vulnerable data subjects across
   borders). Recommend the DPIA happens before this data model ships, not after.

3. **Data minimisation and staging.** Collecting DOB, passport number and TB results at the front
   door would be unlawful (no purpose yet) and would destroy the signup conversion we just built.
   Propose a **progressive disclosure ladder** — which tier is collected when, tied to a real
   purpose:
   - Tier 0 (front door, existing): name, email, phone, country, consent — *unchanged*
   - Tier 1 (profile): contact points, languages, experience, qualifications
   - Tier 2 (matched to a role): identity document, references
   - Tier 3 (post-offer, contractual/legal necessity): health, police clearance, disease screening
   Argue this explicitly. Andrew's list is a *destination*, not a signup form.

4. **Is Strapi the right home?** Give a straight answer. Strapi v5 is a headless CMS; this is a
   ~15-entity relational registry with workflow state machines, audit trails, verification chains
   and special-category data. Assess honestly: admin UX for deep relations, migration tooling,
   row-level access control, field-level encryption, audit logging, query performance on MySQL as
   rows grow. Options: (a) stay in Strapi; (b) separate service + database with Strapi remaining
   for marketing content; (c) hybrid. **Note that an "INSPIRE-LMIS" proposal already exists in the
   parent directory** (`INSPIRE-LMIS-Executive-Brief`, `Labour Marketing Information System/`) —
   read it before answering; this request may already be scoped there, and duplicating it would be
   the expensive mistake.

5. **Document storage.** Certificates, IDs and clearances are files. Strapi's default local/public
   upload is inappropriate for passports and medical records. Specify private storage + signed,
   expiring URLs, and confirm what `MEDIA_PROVIDER` / `AWS_S3_ACL` / `AWS_S3_SIGNED_URL_EXPIRES` are
   set to in production today.

6. **Access control.** Today: `inspire-admin` sees everything, Public sees nothing, no user login
   without Keycloak. That binary is inadequate once a person's medical and criminal data is held.
   Propose role granularity (recruiter vs compliance officer vs medical reviewer), and whether
   **the data subject themselves** ever gets access — which is also how you satisfy DSARs at scale.

7. **Audit trail + retention.** Immigration and employment records carry statutory retention;
   special-category data carries minimisation pressure. These conflict. Propose per-entity retention
   and an append-only audit log (who saw/changed what, when) — required to be defensible.

---

## 5. Phase 2 — design (present, then recommend)

- Full ERD (mermaid) of the proposed model, showing cardinality and which entities hold
  Article 9 / Article 10 data (mark them visibly).
- Per-entity field tables: type, required, `private`, retention tier, lawful basis.
- The verification/provenance pattern, defined once.
- The migration plan from `candidate` + `community-signup` → `person`, with rollback.
- A phased delivery plan. **Phase boundaries must be shippable and independently useful.** Suggested:
  1. `person` + `person_role` + `contact_point`, back-filled from `community-signup`/`candidate`
  2. Profile tier — qualifications, experience, languages (+ issuing-body registry)
  3. Applications + interview transaction log (Andrew #10), linked to `job-posting`
  4. Clearances / health / police (**gated on the DPIA being signed off**)
  5. Assessments / profiling
- What you would build **outside** Strapi, if anything, and the integration seam.

## 6. Phase 3 — implementation

Only after the design is chosen. Per phase:
- Strapi content types + relations, following the existing house conventions (see
  `community-signup`: `private: true` on every identity field, `content-api.visible: false`,
  `requireAdmin()` on core verbs, token-gated custom routes via a policy, salted-hash any IP).
- Idempotent migration/backfill scripts. Follow the `RESEED_LEGAL` precedent in
  `src/index.ts` + `seed-content.ts`: **a flag-gated, targeted operation** — never `RESEED_CONTENT`,
  which rewrites every page and destroys admin edits.
- Admin UX: these are deep relations; verify they are actually usable in Strapi's Content Manager
  before declaring a phase done.
- Tests, plus `scripts/smoke-test.sh` extensions asserting **403** on every new PII endpoint.

---

## 7. Hard constraints

- **No new website runtime dependencies** without justification (currently exactly three).
- CMS: prefer existing deps. Anything new must survive the Docker image build on a **4-CPU / 7.8 GB
  VPS** (it has 4 GB swap; builds are already slow — `strapi build` previously OOM-killed).
- Must pass `npm run typecheck`, `npm run lint`, `npm run build` (website) and `tsc --noEmit` +
  `strapi build` (CMS). Run them; paste output.
- **Do not regress the signup funnel.** `/join/start` must stay a 5-field form. If a change would
  add fields to the front door, that is a red flag — re-read §4.3.
- Raw IPs are never stored. Identity fields are always `private`. Public role gains nothing.
- The site must still render if the CMS is down (existing `lib/cms/*` fallback pattern), and the
  signup gate must keep failing **open** to Mighty Networks.
- Legal copy lives in `inspire-africa-cms/src/bootstrap/legal-bodies.ts` and publishes via
  `RESEED_LEGAL`. **Any new data collection requires the privacy policy to be updated in the same
  change** — the policy currently describes only name/email/phone/country.

## 8. Explicitly out of scope for the first phase

Building all 11 entities at once; the psychometric/WILD integrations; bulk third-party ingest
pipelines; a candidate-facing portal; automated verification with issuing authorities. Note where
each attaches later.

## 9. Acceptance criteria (phase 1 of the build)

1. One `person` row per human; `community-signup` and `candidate` both resolve to it with no
   duplicate-email collisions.
2. Backfill is idempotent and re-runnable, with a tested rollback.
3. No PII readable by the Public role or the site's read-only token (expect 403).
4. `/join/start` behaviour, field count and conversion path unchanged; funnel numbers still correct.
5. Privacy policy updated and published via `RESEED_LEGAL`, matching exactly what is now collected.
6. `typecheck` + `lint` + `build` pass in both repos; smoke tests extended and passing.
7. No Article 9 / Article 10 field exists in the schema until the DPIA is signed off.

## 10. How to work

1. **Phase 1 analysis first, as prose. No schemas, no code.** The classification in §4.2 and the
   Strapi-vs-service call in §4.4 are the two answers that change everything downstream.
2. Read `INSPIRE-LMIS-Executive-Brief` and `Labour Marketing Information System/` in the parent
   directory before proposing architecture — this may already be specified there.
3. Label every assumption `ASSUMPTION` and say how to verify it.
4. If you believe part of this should not be built as asked — most likely collecting health and
   police data before a DPIA, or expanding the front-door form — say so once, clearly, with
   reasoning, then implement the owner's decision.
5. Do not mark a phase complete that you have not run and verified.
