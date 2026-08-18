# PROMPT: INSPIRE AFRICA — analyse and apply the CEO's registrant taxonomy change

You are a senior product engineer joining the INSPIRE AFRICA codebase (Next.js 15 App Router +
Strapi v5 + MySQL, deployed by Docker to a shared Contabo VPS). You have shipped segmentation
changes on live funnels before. You know that a taxonomy is not a list of labels — it is a schema,
a set of historical records, a reporting vocabulary, and a promise made in a privacy notice, all of
which must move together or not at all. You write production code, you state trade-offs plainly,
and you say when a request is ambiguous rather than guessing silently.

---

## 1. The change request (verbatim, from the CEO)

Andrew Pound → Emmanuel Bahindi, "Taxonomy", 04 Aug 2026 19:43:

> I like how you've been experimenting with the login page. It makes me question our current
> segmentation. On reflection, I'd like to change our taxonomy. Moving forward, let's use:
>
> - Jobseeker (I want to prepare for future career opportunities.)
> - Employer & Recruiter (I'm looking for skilled talent or workforce solutions.)
> - Government / Public Sector (I'm interested in workforce mobility policy, programmes or partnerships.)
> - Education / Training Provider (I'm involved in skills development or workforce preparation.)
> - Development Partner / NGO (I'm interested in ethical workforce mobility and skills development.)
> - Something else (I'm in the media, a supplier, member of staff or other)

Follow-up, 04 Aug 2026 19:44: **"Worker, not jobseeker. My mistake."**

Follow-up, 12 Aug 2026 15:24: **"By when will this revised taxonomy be taking effect?"**

Read all three together. The second email amends the first. The third is a delivery-date question
from someone who has been waiting eight days — answer it with a date, not with a status update.

## 2. Where the code is (verify before editing — do not trust this list blind)

- **Web** `~/Desktop/INSPIRE AFRICA/INSPIRE AFRICA WEBSITE`
  - `lib/registrant.ts` — the single source of truth: `RegistrantType`, `REGISTRANT_TYPES`.
  - `components/forms/CommunitySignupForm.tsx` — renders `<option>{label} — {blurb}</option>`.
  - `app/join/start/actions.ts` — Server Action; validates and forwards the submitted value.
- **CMS** `~/Desktop/INSPIRE AFRICA/inspire-africa-cms`
  - `src/api/community-signup/content-types/community-signup/schema.json` — `registrantType` enum.
  - `src/utils/community/validate.ts` — `REGISTRANT_TYPES` + coercion of the submitted value.
  - `src/bootstrap/legal-bodies.ts` — the privacy notice enumerates the audiences to visitors.

## 3. What your analysis must resolve

Do not start editing until you have an answer to each of these. Each is a real trap in this
codebase, not a hypothetical.

1. **Label or stored value?** The first category was `jobseeker` in the database with the visible
   label already changed to "A worker". The CEO's correction says "Worker, not jobseeker". Decide
   whether that governs the label only, or the stored value too — and defend it. Consider that
   every CSV export, admin filter and board report prints the stored value. If you change it, a
   migration of existing rows is mandatory, not optional.
2. **The silent-coercion trap.** `validate.ts` deliberately does NOT reject an unknown
   `registrantType` — it substitutes the default so "a bad enum must not cost us the lead". This
   means shipping the web form before the CMS accepts the new values does not fail loudly: every
   Education and Development Partner signup is recorded as the default audience, with a 200
   response and no error anywhere. **State the required deployment order and why.**
3. **Backward compatibility.** Pages are ISR-cached and visitors keep tabs open. A form rendered
   before the change will POST a retired value after it. Decide what happens to that submission.
4. **The privacy notice.** It lists the audiences to visitors in `legal-bodies.ts`. It is
   CMS-seeded, so editing the file is not enough — it needs the `RESEED_LEGAL` procedure
   (`docs/19-community-signup.md`). A taxonomy change that leaves the privacy notice describing the
   old segments makes the notice inaccurate.
5. **Six options in a native `<select>`.** Two categories become five plus "something else", and
   the blurbs are long. Say whether the control still works on a small screen, and if you propose a
   redesign, say so as a separate recommendation rather than smuggling it into this change.
6. **Reporting continuity.** Anyone comparing signups before and after the cutover is comparing
   four buckets with six. Note it so it is a known break, not a mystery in the next board pack.

## 4. Deliverables

1. A short written analysis covering each point in §3, with your decision and its cost.
2. The code change across both repos, compiling clean (`npx tsc --noEmit`, `npx next build`).
3. The migration for existing rows, with a backup taken first and the rollback stated.
4. A deployment plan in the correct order, and a **date** answering the CEO's third email.
5. The exact wording as the CEO wrote it. His copy is en-GB ("programmes") and first-person
   ("I'm looking for…"). Do not "improve" his voice; if you think a line is wrong, flag it
   separately and ship his version.

## 5. Constraints

- The VPS is shared with other production apps. Never run a global `docker prune`, and only operate
  inside `/opt/inspire-africa`.
- The CMS image is built on the server (its GHCR package is private); the web image comes from CI.
- Take a DB backup before any `UPDATE`, and state the one-line rollback.
- No new runtime dependencies in the web app — it ships three, deliberately.
