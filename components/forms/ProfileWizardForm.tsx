"use client";

/**
 * Profile wizard — every field Andrew listed, branched by registrant type.
 *
 * Steps are keyed on SLUG, not step number, because the three branches have
 * different step counts and reusing numbers across them was a bug waiting to
 * happen (an employer's step 4 is "hiring", a jobseeker's is "qualifications").
 *
 * Progressive enhancement, same as step 1: `action={formAction}` posts
 * natively without JavaScript, including file inputs — Server Actions accept
 * multipart FormData. The "add another" buttons are the only JS-only
 * affordance, so the no-JS path renders a fixed number of blank rows.
 *
 * Every step is skippable. Step 1 already banked the lead, so pressure here
 * costs completion without protecting revenue.
 */
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { saveProfile, type ProfileState } from "@/app/join/profile/actions";
import {
  ID_KINDS,
  QUAL_LEVELS,
  CEFR_LEVELS,
  LANGUAGES,
  ORG_KINDS,
  SIZE_BANDS,
  CLEARANCE_KINDS,
  SCREENING_RESULTS,
  UPLOAD_HINTS,
  stepsFor,
  type RegistrantType,
} from "@/lib/profile-shape";

const initial: ProfileState = {};

interface Props {
  step: number;
  slug: string;
  registrantType: RegistrantType;
  clickId?: string;
  /** Blank rows rendered when JS is unavailable. */
  initialRows?: number;
}

function Repeatable({
  legend,
  hint,
  initialRows = 1,
  render,
}: {
  legend: string;
  hint?: string;
  initialRows?: number;
  render: (i: number) => React.ReactNode;
}) {
  const [count, setCount] = useState(initialRows);
  return (
    <fieldset className="form-field full" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {legend}
      </legend>
      {hint ? <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 14px" }}>{hint}</p> : null}
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="profile-row">
          {render(i)}
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost"
        style={{ marginTop: 10 }}
        onClick={() => setCount((c) => Math.min(20, c + 1))}
      >
        + Add another
      </button>
    </fieldset>
  );
}

function FileField({
  id,
  name,
  label,
  hint,
  accept,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  accept: string;
}) {
  return (
    <div className="form-field full">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} type="file" accept={accept} />
      {/* The limit is enforced server-side; this is so it is not a surprise. */}
      <p style={{ fontSize: 12, opacity: 0.65, margin: "6px 0 0" }}>{hint}</p>
    </div>
  );
}

export function ProfileWizardForm({
  step,
  slug,
  registrantType,
  clickId,
  initialRows = 1,
}: Props) {
  const [state, formAction, pending] = useActionState(saveProfile, initial);
  const err = state.fieldErrors ?? {};
  const steps = stepsFor(registrantType);
  const idx = steps.findIndex((s) => s.slug === slug);
  const next = idx >= 0 ? steps[idx + 1] : undefined;

  return (
    <form
      className="form-grid"
      action={formAction}
      name={`profile_${slug}`}
      encType="multipart/form-data"
      noValidate
    >
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="registrantType" value={registrantType} />
      {clickId ? <input type="hidden" name="clickId" value={clickId} /> : null}

      {state.error ? (
        <div className="form-field full" role="alert">
          <p style={{ color: "#b00020", margin: 0, fontWeight: 600 }}>{state.error}</p>
        </div>
      ) : null}

      {/* ---------------- jobseeker: identity ---------------- */}
      {slug === "about-you" ? (
        <>
          <div className="form-field">
            <label htmlFor="otherNames">Other names (optional)</label>
            <input id="otherNames" name="otherNames" type="text" autoComplete="additional-name" />
          </div>
          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of birth</label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              autoComplete="bday"
              aria-invalid={err.dateOfBirth ? true : undefined}
              aria-describedby={err.dateOfBirth ? "dob-error" : undefined}
            />
            {err.dateOfBirth ? (
              <p id="dob-error" className="field-error" role="alert">
                {err.dateOfBirth}
              </p>
            ) : null}
          </div>
          <FileField
            id="profileImage"
            name="profileImage"
            label="Profile photo (optional)"
            hint={UPLOAD_HINTS.profileImage}
            accept="image/jpeg,image/png,image/webp"
          />
          <Repeatable
            legend="Identity document"
            hint="Your passport or national ID. The number is encrypted before we store it, and only staff who need it can see it."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`id-kind-${i}`}>Document type</label>
                  <select id={`id-kind-${i}`} name={`identityDocuments[${i}][kind]`} defaultValue="">
                    <option value="">Select…</option>
                    {ID_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`id-number-${i}`}>Document number</label>
                  <input
                    id={`id-number-${i}`}
                    name={`identityDocuments[${i}][number]`}
                    type="text"
                    autoComplete="off"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-auth-${i}`}>Issuing authority</label>
                  <input id={`id-auth-${i}`} name={`identityDocuments[${i}][issuingAuthority]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-country-${i}`}>Issuing country</label>
                  <input id={`id-country-${i}`} name={`identityDocuments[${i}][issuingCountry]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-issued-${i}`}>Issue date</label>
                  <input id={`id-issued-${i}`} name={`identityDocuments[${i}][issuedOn]`} type="date" />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-exp-${i}`}>Expiry date</label>
                  <input id={`id-exp-${i}`} name={`identityDocuments[${i}][expiresOn]`} type="date" />
                </div>
                <div className="form-field full">
                  <label htmlFor={`id-img-${i}`}>Photo of the document (optional)</label>
                  <input
                    id={`id-img-${i}`}
                    name={`identityDocuments[${i}][documentImage]`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <p style={{ fontSize: 12, opacity: 0.65, margin: "6px 0 0" }}>
                    {UPLOAD_HINTS.idImage}
                  </p>
                </div>
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- employer / government: organisation ---------------- */}
      {slug === "organisation" ? (
        <>
          <div className="form-field full">
            <label htmlFor="org-name">
              {registrantType === "government" ? "Ministry or agency name" : "Organisation name"}
            </label>
            <input id="org-name" name="organisation[name]" type="text" autoComplete="organization" />
          </div>
          <div className="form-field">
            <label htmlFor="org-kind">Type</label>
            <select
              id="org-kind"
              name="organisation[kind]"
              defaultValue={registrantType === "government" ? "ministry" : "employer"}
            >
              {ORG_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="org-country">Country</label>
            <input id="org-country" name="organisation[country]" type="text" autoComplete="country-name" />
          </div>
          <div className="form-field">
            <label htmlFor="org-title">Your job title</label>
            <input id="org-title" name="organisation[contactJobTitle]" type="text" autoComplete="organization-title" />
          </div>
          <div className="form-field">
            <label htmlFor="org-web">Website (optional)</label>
            <input id="org-web" name="organisation[website]" type="url" autoComplete="url" />
          </div>

          {registrantType === "government" ? (
            <>
              <div className="form-field full">
                <label htmlFor="org-dept">Department or directorate</label>
                <input id="org-dept" name="organisation[department]" type="text" />
              </div>
              <div className="form-field full">
                <label htmlFor="org-remit">Your remit</label>
                <textarea id="org-remit" name="organisation[remit]" />
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <label htmlFor="org-sector">Sector</label>
                <input id="org-sector" name="organisation[sector]" type="text" />
              </div>
              <div className="form-field">
                <label htmlFor="org-size">Organisation size</label>
                <select id="org-size" name="organisation[sizeBand]" defaultValue="">
                  <option value="">Select…</option>
                  {SIZE_BANDS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field full">
                <label htmlFor="org-reg">Company registration number (optional)</label>
                <input id="org-reg" name="organisation[registrationNumber]" type="text" />
              </div>
            </>
          )}
        </>
      ) : null}

      {/* ---------------- shared: contact ---------------- */}
      {slug === "contact" ? (
        <>
          <div className="form-field full">
            <label htmlFor="residentialAddress">
              {registrantType === "jobseeker" || registrantType === "other"
                ? "Residential address"
                : "Office address"}
            </label>
            <textarea id="residentialAddress" name="residentialAddress" autoComplete="street-address" />
          </div>
          <Repeatable
            legend="Other ways to reach you"
            hint="An SMS number, a WhatsApp number and a landline can all be different — add whichever you use."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`cp-kind-${i}`}>Type</label>
                  <select id={`cp-kind-${i}`} name={`contactPoints[${i}][kind]`} defaultValue="">
                    <option value="">Select…</option>
                    <option value="sms">SMS number</option>
                    <option value="messaging">WhatsApp / messaging</option>
                    <option value="landline">Landline</option>
                    <option value="email">Alternative email</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`cp-value-${i}`}>Details</label>
                  <input id={`cp-value-${i}`} name={`contactPoints[${i}][value]`} type="text" />
                </div>
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- jobseeker: qualifications ---------------- */}
      {slug === "qualifications" ? (
        <Repeatable
          legend="Qualifications"
          hint="Academic degrees, diplomas, and any professional or short courses. Include the institution that awarded it — we check whether it is accredited."
          initialRows={initialRows}
          render={(i) => (
            <>
              <div className="form-field">
                <label htmlFor={`q-kind-${i}`}>Type</label>
                <select id={`q-kind-${i}`} name={`qualifications[${i}][kind]`} defaultValue="academic">
                  <option value="academic">Academic</option>
                  <option value="professional">Professional / short course</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor={`q-title-${i}`}>Title</label>
                <input id={`q-title-${i}`} name={`qualifications[${i}][title]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-level-${i}`}>Level</label>
                <select id={`q-level-${i}`} name={`qualifications[${i}][level]`} defaultValue="">
                  <option value="">Select…</option>
                  {QUAL_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor={`q-field-${i}`}>Field of study</label>
                <input id={`q-field-${i}`} name={`qualifications[${i}][fieldOfStudy]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-body-${i}`}>Awarded by</label>
                <input id={`q-body-${i}`} name={`qualifications[${i}][issuingBodyName]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-bodyc-${i}`}>Country of institution</label>
                <input id={`q-bodyc-${i}`} name={`qualifications[${i}][issuingBodyCountry]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-date-${i}`}>Date awarded</label>
                <input id={`q-date-${i}`} name={`qualifications[${i}][awardedOn]`} type="date" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-grade-${i}`}>Grade (optional)</label>
                <input id={`q-grade-${i}`} name={`qualifications[${i}][grade]`} type="text" />
              </div>
              <div className="form-field full">
                <label htmlFor={`q-file-${i}`}>Certificate (optional)</label>
                <input
                  id={`q-file-${i}`}
                  name={`qualifications[${i}][certificateFile]`}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                />
                <p style={{ fontSize: 12, opacity: 0.65, margin: "6px 0 0" }}>{UPLOAD_HINTS.document}</p>
              </div>
            </>
          )}
        />
      ) : null}

      {/* ---------------- jobseeker: experience + languages ---------------- */}
      {slug === "experience" ? (
        <>
          <Repeatable
            legend="Work experience"
            hint="Describe your responsibilities in your own words — our team matches them to standard job descriptions afterwards."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`w-emp-${i}`}>Employer</label>
                  <input id={`w-emp-${i}`} name={`workExperiences[${i}][employerName]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`w-title-${i}`}>Job title</label>
                  <input id={`w-title-${i}`} name={`workExperiences[${i}][jobTitle]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`w-country-${i}`}>Country</label>
                  <input id={`w-country-${i}`} name={`workExperiences[${i}][employerCountry]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`w-from-${i}`}>From</label>
                  <input id={`w-from-${i}`} name={`workExperiences[${i}][startedOn]`} type="date" />
                </div>
                <div className="form-field">
                  <label htmlFor={`w-to-${i}`}>To (leave blank if current)</label>
                  <input id={`w-to-${i}`} name={`workExperiences[${i}][endedOn]`} type="date" />
                </div>
                <div className="form-field full">
                  <label htmlFor={`w-resp-${i}`}>What did you do?</label>
                  <textarea id={`w-resp-${i}`} name={`workExperiences[${i}][responsibilities]`} />
                </div>
              </>
            )}
          />
          <Repeatable
            legend="Languages"
            hint="Include any certificate you hold — it strengthens your profile with employers."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`l-lang-${i}`}>Language</label>
                  <select id={`l-lang-${i}`} name={`languageCompetencies[${i}][languageCode]`} defaultValue="">
                    <option value="">Select…</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`l-level-${i}`}>Level</label>
                  <select id={`l-level-${i}`} name={`languageCompetencies[${i}][level]`} defaultValue="">
                    <option value="">Select…</option>
                    {CEFR_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`l-qual-${i}`}>Certificate (optional)</label>
                  <input id={`l-qual-${i}`} name={`languageCompetencies[${i}][qualificationTitle]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`l-body-${i}`}>Awarded by (optional)</label>
                  <input id={`l-body-${i}`} name={`languageCompetencies[${i}][issuingBodyName]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`l-date-${i}`}>Date</label>
                  <input id={`l-date-${i}`} name={`languageCompetencies[${i}][qualifiedOn]`} type="date" />
                </div>
                <div className="form-field">
                  <label htmlFor={`l-exp-${i}`}>Expires</label>
                  <input id={`l-exp-${i}`} name={`languageCompetencies[${i}][expiresOn]`} type="date" />
                </div>
                <div className="form-field">
                  <label htmlFor={`l-grade-${i}`}>Grade (optional)</label>
                  <input id={`l-grade-${i}`} name={`languageCompetencies[${i}][grade]`} type="text" />
                </div>
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- employer: hiring needs ---------------- */}
      {slug === "hiring" ? (
        <Repeatable
          legend="Roles you are hiring for"
          hint="Rough numbers are fine — this helps us match candidates before you ever speak to one."
          initialRows={initialRows}
          render={(i) => (
            <>
              <div className="form-field">
                <label htmlFor={`h-role-${i}`}>Role title</label>
                <input id={`h-role-${i}`} name={`hiringNeeds[${i}][roleTitle]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`h-sector-${i}`}>Sector</label>
                <input id={`h-sector-${i}`} name={`hiringNeeds[${i}][sector]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`h-vac-${i}`}>Number of vacancies</label>
                <input id={`h-vac-${i}`} name={`hiringNeeds[${i}][vacancies]`} type="number" min={0} />
              </div>
              <div className="form-field">
                <label htmlFor={`h-dest-${i}`}>Destination country</label>
                <input id={`h-dest-${i}`} name={`hiringNeeds[${i}][destinationCountry]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`h-start-${i}`}>Ideal start date</label>
                <input id={`h-start-${i}`} name={`hiringNeeds[${i}][startFrom]`} type="date" />
              </div>
              <div className="form-field full">
                <label htmlFor={`h-notes-${i}`}>Anything else (optional)</label>
                <textarea id={`h-notes-${i}`} name={`hiringNeeds[${i}][notes]`} />
              </div>
            </>
          )}
        />
      ) : null}

      {/* ---------------- jobseeker: references + CV ---------------- */}
      {slug === "references" ? (
        <>
          <FileField
            id="cvFile"
            name="cvFile"
            label="Your CV (optional)"
            hint={UPLOAD_HINTS.document}
            accept="application/pdf,image/jpeg,image/png,image/webp"
          />
          <Repeatable
            legend="Character references"
            hint="People who can speak to your character and work. We tell them where we got their details before contacting them."
            initialRows={Math.max(2, initialRows)}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`r-name-${i}`}>Full name</label>
                  <input id={`r-name-${i}`} name={`characterReferences[${i}][name]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`r-rel-${i}`}>Relationship to you</label>
                  <input id={`r-rel-${i}`} name={`characterReferences[${i}][relationship]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`r-email-${i}`}>Email</label>
                  <input id={`r-email-${i}`} name={`characterReferences[${i}][email]`} type="email" />
                </div>
                <div className="form-field">
                  <label htmlFor={`r-phone-${i}`}>Phone (optional)</label>
                  <input id={`r-phone-${i}`} name={`characterReferences[${i}][phone]`} type="tel" />
                </div>
                <div className="form-field full">
                  <label htmlFor={`r-org-${i}`}>Organisation (optional)</label>
                  <input id={`r-org-${i}`} name={`characterReferences[${i}][organisation]`} type="text" />
                </div>
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- employer / government: documents ---------------- */}
      {slug === "documents" ? (
        <>
          <FileField
            id="profileImage"
            name="profileImage"
            label="Your photo (optional)"
            hint={UPLOAD_HINTS.profileImage}
            accept="image/jpeg,image/png,image/webp"
          />
          <FileField
            id="cvFile"
            name="cvFile"
            label="Supporting document (optional)"
            hint={`${UPLOAD_HINTS.document} — e.g. a letter of authority or company registration.`}
            accept="application/pdf,image/jpeg,image/png,image/webp"
          />
        </>
      ) : null}

      {/* ---------------- jobseeker: health & clearances (Article 9/10) ---------------- */}
      {slug === "clearances" ? (
        <>
          <div className="form-field full">
            <div
              style={{
                border: "1px solid var(--line-strong)",
                padding: 18,
                marginBottom: 20,
                background: "var(--surface)",
              }}
            >
              <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
                This section is entirely optional, and you can join and be matched without it.
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 14, opacity: 0.8 }}>
                Health certificates, medical screening results and police clearance certificates are
                treated as sensitive personal data under data-protection law. We only ask because
                some destination countries require them, and we need your explicit permission before
                holding any of it. You can withdraw that permission at any time and we will erase it.
              </p>
              <label
                htmlFor="consentSpecial"
                style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}
              >
                <input
                  id="consentSpecial"
                  name="consentSpecialCategory"
                  type="checkbox"
                  style={{ width: "auto", marginTop: 4 }}
                  aria-describedby="consentSpecial-hint"
                />
                <span id="consentSpecial-hint">
                  I explicitly consent to INSPIRE AFRICA holding the health and clearance information
                  I enter below.
                </span>
              </label>
              {err.consentSpecialCategory ? (
                <p className="field-error" role="alert">
                  {err.consentSpecialCategory}
                </p>
              ) : null}
            </div>
          </div>

          <Repeatable
            legend="Certificates and clearances"
            hint="Only if you already hold them. Leave blank otherwise."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`hc-kind-${i}`}>Type</label>
                  <select id={`hc-kind-${i}`} name={`healthClearances[${i}][kind]`} defaultValue="">
                    <option value="">Select…</option>
                    {CLEARANCE_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`hc-ref-${i}`}>Certificate number</label>
                  <input id={`hc-ref-${i}`} name={`healthClearances[${i}][reference]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`hc-auth-${i}`}>Issuing authority</label>
                  <input id={`hc-auth-${i}`} name={`healthClearances[${i}][issuingAuthority]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`hc-exp-${i}`}>Expiry date</label>
                  <input id={`hc-exp-${i}`} name={`healthClearances[${i}][expiresOn]`} type="date" />
                </div>
                <div className="form-field full">
                  <label htmlFor={`hc-tests-${i}`}>Tests covered (optional)</label>
                  <input id={`hc-tests-${i}`} name={`healthClearances[${i}][testsCovered]`} type="text" />
                </div>
              </>
            )}
          />

          <Repeatable
            legend="Screening results"
            hint="For example TB or yellow fever, where a destination country requires proof."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`ds-disease-${i}`}>Disease</label>
                  <input id={`ds-disease-${i}`} name={`diseaseScreenings[${i}][disease]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`ds-result-${i}`}>Result</label>
                  <select id={`ds-result-${i}`} name={`diseaseScreenings[${i}][result]`} defaultValue="">
                    <option value="">Select…</option>
                    {SCREENING_RESULTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`ds-date-${i}`}>Date tested</label>
                  <input id={`ds-date-${i}`} name={`diseaseScreenings[${i}][testedOn]`} type="date" />
                </div>
                <div className="form-field">
                  <label htmlFor={`ds-auth-${i}`}>Issuing authority</label>
                  <input id={`ds-auth-${i}`} name={`diseaseScreenings[${i}][issuingAuthority]`} type="text" />
                </div>
              </>
            )}
          />
        </>
      ) : null}

      <div className="form-submit" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href={
            next
              ? `/join/profile/${next.slug}?as=${registrantType}${clickId ? `&clickId=${encodeURIComponent(clickId)}` : ""}`
              : "/join/profile/done"
          }
          style={{ fontSize: 14, opacity: 0.75 }}
        >
          Skip for now
        </Link>
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : next ? "Save and continue" : "Save and finish"}
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
