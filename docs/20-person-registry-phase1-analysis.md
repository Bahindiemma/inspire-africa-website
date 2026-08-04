# Phase 1 Analysis — Andrew's "Database Front Door"

> Response to Andrew Pound, "Re: Two-step signup process", 2026-08-04.
> Prose analysis only — no schemas, no code, per the brief.
> Prepared 2026-08-04.

## 0. Headline

**Do not build this in the marketing CMS.** A person registry already exists, in the right
technology, with the right security primitives. Andrew's eleven items are best read not as a
request for new tables in Strapi, but as a **normalisation-and-generalisation specification for the
LMIS `persons` model**, which today is flat and hard-coded to the Gambia–Spain corridor.

Seven of Andrew's eleven items do not exist anywhere yet. Four exist in a flattened form that
matches his critique almost exactly.

---

## 1. What actually exists (verified 2026-08-04)

### 1a. The marketing stack — Strapi CMS + Next.js site

`api::community-signup` (shipped today) is the front door on the website: click recorded
server-side, then first/last name, email, phone, country and consents, then handoff to Mighty
Networks. `api::candidate` also exists — `fullName`, unique `email`, `phone`, `countryOfOrigin`,
`resume`, `skillTags`, plus `sectors` and `languageProficiency` as **JSON blobs**.

**Production row counts, checked directly against MySQL:**

| table | rows |
|---|---|
| `candidates` | **0** |
| `community_signups` | **0** |
| `form_submissions` | **0** |
| `job_postings` | **0** |
| `tags` | 17 |

This is the single most de-risking fact in the analysis. **There is no data to migrate.**
`api::candidate` is an unused, empty schema. It can be deleted rather than reconciled, and no
backfill, rollback plan or duplicate-email resolution is required. The migration problem the brief
anticipated does not exist.

### 1b. INSPIRE LMIS — the real system

`~/Desktop/inspire-lmis-backend` is a **Laravel / PHP** application (not NestJS — the
`LMISTech Stack.pdf` is out of date), with `openapi.yaml`, Docker deployment, and 27 tables:

```
accounts              application_drafts    application_events    applications
activation_tokens     audit_entries         candidate_documents   charges
consents              corridor_parties      corridors             eligibility_criteria
employer_feedback     incidents             notifications         persons
placement_comments    placements            role_permissions      selection_stages
staff_users           tenant_origins        timesheets            training_enrolments
visas                 welfare_checks        worker_returns
```

It already has the hard parts: **row-level security** (`add_invariants_and_rls`), **encryption at
the model layer** (`passport_number` is marked ENCRYPTED), an **append-only audit trail**
(`audit_entries`), **consent records**, **multi-tenancy** (`tenant_origins`, `accounts`), and
role-based access (`staff_users`, `role_permissions`).

There are four more related repos — `inspire-lmis`, `inspire-lmis-ke-web`,
`inspire-lmis-kenya-germany`, plus `inspire-mighty-etl`.

`INSPIRE_AFRICA_ERD_v3.pdf` (June 2026) documents a **Central Data Model of ~80 entities across 17
modules**, including *Worker/person management*, *Profile & readiness*, *Verification & identity*,
*Compliance, visa & mobility*, and *Audit, tenancy & data rights*. It explicitly resolves
`APPLICATION_EVENT` as "a normalised timeline replacing the legacy submitted/picked/interviewed
columns" — which is precisely Andrew's item 10.

**So the architecture question in the brief is already answered, and answered well.** The design
principles stated on the ERD — flexible config tables, modular bounded contexts, append-only
events, tenant isolation, field-level encryption, data-subject rights — are the right ones.

---

## 2. The actual gap Andrew is pointing at

Here is the current `persons` table:

```php
full_name            // one string — Andrew wants first / last / other names
date_of_birth
sex
lga, district, region_of_residence
local_language       // "Mandinka | Wolof | Fula | ..."
languages_spoken     // "spanish | english | both | neither"   ← a string enum
proficiency          // one string                              ← for ALL languages
education            // one string                              ← for ALL qualifications
works_in_agriculture // boolean
applied_before, dependants
corridor_code        // DEFAULT 'GM-ES'
passport_number      // one encrypted text column
photo_path
```

This is a **pilot schema for one corridor**, and Andrew's email is, in effect, a precise critique of
it. Mapping his eleven items against reality:

| # | Andrew's item | Status today |
|---|---|---|
| 1 | **ID** (names, DOB, ID type/number/authority/expiry) | ⚠️ **Partial** — `full_name` is one string; only `passport_number` exists. No ID *type*, *issuing authority* or *expiry*. |
| 2 | **Contact** (email, SMS, messaging, landline, address) | ⚠️ **Partial** — email/phone live on `accounts`; no typed multi-channel contact model, no residential address |
| 3 | **Academic qualifications** + accreditation | ❌ **Missing** — collapsed into `education` (one string) |
| 4 | **Professional qualifications** + accreditation | ❌ **Missing** |
| 5 | **Professional experience** | ❌ **Missing** — only `works_in_agriculture` boolean |
| 6 | **Language competency** (7 attributes) | ❌ **Missing** — collapsed into `languages_spoken` + `proficiency` strings |
| 7 | **Fitness** (health cert, police clearance) | ❌ **Missing** |
| 8 | **Character references** | ❌ **Missing** |
| 9 | **Infectious disease screening** | ❌ **Missing** |
| 10 | **Interview transactions** | ✅ **Exists** — `applications`, `application_events`, `selection_stages`, `visas`, `placements` |
| 11 | **Source of name** | ✅ **Exists** — `tenant_origins` |
| — | Profiling (surveys, psychometric, WILD) | ⚠️ **Partial** — `training_enrolments` exists; no generic assessment/response model |
| — | Issuing-body accreditation registry | ❌ **Missing** — and it is a *registry*, not a boolean (see §4) |

**Verdict: 7 missing, 3 partial, 2 present.** Andrew is right, and the work is real — it just
belongs in LMIS, not in Strapi.

---

## 3. Recommendation

1. **Build Andrew's items 1–9 in `inspire-lmis-backend`**, as normalised tables hanging off
   `persons`. It already has RLS, encryption, audit and consent — rebuilding those in Strapi would
   be strictly worse and would split the person record across two systems.
2. **Delete `api::candidate` from the Strapi CMS.** It is empty, unused, and a second identity
   record for the same human. Leaving it invites someone to start writing to it.
3. **Keep `community-signup` exactly as it is** — a lightweight, high-converting front door and an
   immutable *registration event* with attribution. It should *create or link* an LMIS person via
   API, not become the identity table.
4. **Generalise `persons` off the Gambia–Spain pilot.** `corridor_code` defaulting to `GM-ES`,
   `works_in_agriculture`, `lga`, and Mandinka/Wolof/Fula local languages are pilot artefacts.
   Andrew's "regardless of their status" requires a corridor-agnostic person + a **role** concept
   (jobseeker / employer / government / internal / other), which does not exist today.
5. **Split names now, while there are zero rows.** `full_name` → given / family / other names is
   trivial today and painful after 10,000 registrations.

---

## 4. Design points worth deciding before any code

- **Accreditation is a registry, not a flag.** "Flagged for accreditation by the competent national
  authority" needs `issuing_body` (name, country, type) and `accreditation` (body → accrediting
  authority, status, valid from/to, evidence). Two bodies with the same name in different countries
  must not collide. Someone must own keeping this current — that is an ongoing operational cost, not
  a one-off migration.
- **One verification pattern, defined once.** Every credential in items 3–9 needs the same shape:
  status (`self_declared | submitted | verified | rejected | expired`), verifier, verified date,
  evidence document, expiry. Define it once and reuse; do not hand-roll it nine times.
- **"Matched against a standard job description" (item 5) means adopting a taxonomy.** Recommend
  **ISCO-08** — ILO-maintained, international, maps to national schemes, and appropriate for a
  multi-corridor pan-African system. O*NET is US-centric; UK SOC 2020 is single-country. Do not
  invent one.
- **Identity resolution is a policy decision, not a code detail.** Item 11 guarantees the same human
  arriving twice (self-registration *and* a third-party bulk upload). Deterministic match on ID
  number + issuing authority; probabilistic on name + DOB + contact. **Never auto-merge person
  records** — flag for human adjudication. Someone must own that queue.
- **Contact as typed rows, not five columns.** `contact_point` (type, value, is_primary, verified,
  verified_at) generalises and gives verification state for free. Andrew's five contact types are
  five rows, not five columns.

---

## 5. Data protection — the blocking constraint

Items 7 and 9 are **UK/EU GDPR Article 9 special-category data** (health certificates, tests
covered, TB, yellow fever). Item 7 also contains **Article 10 criminal-offence data** (police
clearance).

- The **legitimate-interests basis published in the privacy policy this morning does not cover
  either.** Each needs its own lawful basis plus an Article 9(2) / Article 10 condition — realistically
  explicit consent and/or employment-law obligation.
- A **DPIA is mandatory** here: large-scale special-category processing, vulnerable data subjects,
  cross-border transfers. It should be completed **before** these tables ship, not after.
- **Recommendation: build items 1–6 and 8 first, and gate 7 and 9 behind the signed-off DPIA.**
  That is not a delaying tactic — it is the natural phase boundary, because 7 and 9 are also the
  data you cannot lawfully collect until much later in the journey anyway (see §6).
- LMIS already encrypts `passport_number` at the model layer and has RLS + audit. Extend that same
  treatment; do not introduce a weaker path.

---

## 6. Sequencing — Andrew's list is a destination, not a form

Collecting DOB, passport number and TB results at registration would be unlawful (no purpose yet)
and would destroy the signup conversion just built. Proposed ladder, each tier tied to a real
purpose:

| Tier | When | Data |
|---|---|---|
| 0 | Front door (**live now**) | name, email, phone, country, consent |
| 1 | Profile building | contact points, languages (6), qualifications (3, 4), experience (5) |
| 2 | Matched to a role | identity document (1), character references (8) |
| 3 | **Post-offer only**, after DPIA | fitness (7), disease screening (9) |

The `/join/start` gate must stay at five fields. If a proposal adds fields to the front door, that
is the signal something has been misread.

---

## 7. Correction to an earlier finding — Mighty Networks

Earlier I reported that Mighty Networks has no public REST API and that `MemberConfirmed` is blocked
on plan tier. `~/Desktop/inspire-mighty-etl` ("Mighty Networks Community Vault", implementing
*Mighty Networks API Integration & Data Architecture Plan v1.0*) at first appears to contradict
that — it is built against a "Mighty Networks Admin API".

It does not. Its `src/Sync/EndpointMap.php` states the file deliberately contains **no** real
endpoint reference, and the tool **refuses to run**:

> `"REFUSING TO RUN: Mighty Networks endpoints are unverified."`

with instructions to obtain the Admin API reference from the Mighty Networks host. So a second
engineer independently hit the same wall and — correctly — chose to fail loudly rather than guess
endpoint paths. My original conclusion stands, now corroborated: **closing the `MemberConfirmed`
loop is blocked on getting a verified Admin API reference or a Zapier-tier integration from the
Mighty Networks account owner.** That is a commercial/account question, not an engineering one.

---

## 8. What I recommend telling Andrew

1. He is right, and the gap is real — 7 of his 11 items exist nowhere today.
2. The registry belongs in LMIS, which already has the person spine, applications, visas, consents,
   audit and encryption. The website CMS should stay a marketing site plus the front door.
3. The current `persons` table is a Gambia–Spain pilot schema; his list is the specification for
   generalising it. Splitting `full_name` and normalising `education` / `languages_spoken` should
   happen now, while every table is empty.
4. "Regardless of their status" needs an explicit **role** model, which does not exist yet — that is
   the single most structural thing missing.
5. Items 7 and 9 need a DPIA before a schema, and cannot ride on the current lawful basis.
6. Someone must own the issuing-body accreditation registry and the duplicate-person adjudication
   queue. Both are ongoing operational commitments, not build tasks.

## 9. Open questions for Andrew / the CEO

- Which corridors must v1 support? `persons.corridor_code` currently defaults to `GM-ES`, and there
  are separate Kenya–Germany repos — is the intent one registry across corridors, or one per corridor?
- Is there an existing DPIA covering the Gambia–Spain pilot that can be extended?
- Who is the competent national authority per corridor for accreditation flagging, and who
  maintains that list?
- For "employer, government, internal" people — do they authenticate through the same front door,
  or a separate staff path? (`staff_users` already exists and is separate.)
- Are the five LMIS repos converging into one system, or are they per-corridor forks? This changes
  where items 1–9 should be built.
