"use client";

/**
 * Profile wizard steps 2-6 (Andrew items 1-6, 8).
 *
 * Progressive enhancement, same as step 1: `action={formAction}` posts
 * natively without JavaScript. The "add another" buttons are the only
 * JS-only affordance, so the no-JS path renders a fixed number of blank
 * rows (see `initialRows`) and still captures real data.
 *
 * Every step is skippable. Step 1 already banked the lead, so pressure here
 * costs completion without protecting revenue — the "Skip for now" link is
 * deliberate, not an oversight.
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
  PROFILE_STEPS,
} from "@/lib/profile-shape";

const initial: ProfileState = {};

interface Props {
  step: number;
  clickId?: string;
  /** Renders a fixed row count when JS is unavailable. */
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
      <legend style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
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

export function ProfileWizardForm({ step, clickId, initialRows = 1 }: Props) {
  const [state, formAction, pending] = useActionState(saveProfile, initial);
  const err = state.fieldErrors ?? {};
  const meta = PROFILE_STEPS.find((s) => s.step === step);
  const next = PROFILE_STEPS.find((s) => s.step === step + 1);

  return (
    <form className="form-grid" action={formAction} name={`profile_step_${step}`} noValidate>
      <input type="hidden" name="step" value={step} />
      {clickId ? <input type="hidden" name="clickId" value={clickId} /> : null}

      {state.error ? (
        <div className="form-field full" role="alert">
          <p style={{ color: "#b00020", margin: 0, fontWeight: 600 }}>{state.error}</p>
        </div>
      ) : null}

      {/* ---------------- Step 2 — identity ---------------- */}
      {step === 2 ? (
        <>
          <div className="form-field full">
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
              <p id="dob-error" className="field-error" role="alert">{err.dateOfBirth}</p>
            ) : null}
          </div>
          <Repeatable
            legend="Identity document"
            hint="Your passport or national ID. We store the number encrypted, and only staff who need it can see it."
            initialRows={initialRows}
            render={(i) => (
              <>
                <div className="form-field">
                  <label htmlFor={`id-kind-${i}`}>Document type</label>
                  <select id={`id-kind-${i}`} name={`identityDocuments[${i}][kind]`} defaultValue="">
                    <option value="">Select…</option>
                    {ID_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`id-number-${i}`}>Document number</label>
                  <input id={`id-number-${i}`} name={`identityDocuments[${i}][number]`} type="text" autoComplete="off" />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-auth-${i}`}>Issuing authority</label>
                  <input id={`id-auth-${i}`} name={`identityDocuments[${i}][issuingAuthority]`} type="text" />
                </div>
                <div className="form-field">
                  <label htmlFor={`id-exp-${i}`}>Expiry date</label>
                  <input id={`id-exp-${i}`} name={`identityDocuments[${i}][expiresOn]`} type="date" />
                </div>
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- Step 3 — contact ---------------- */}
      {step === 3 ? (
        <>
          <div className="form-field full">
            <label htmlFor="residentialAddress">Residential address</label>
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

      {/* ---------------- Step 4 — qualifications ---------------- */}
      {step === 4 ? (
        <Repeatable
          legend="Qualifications"
          hint="Academic degrees, diplomas, and any professional or short courses. Include the institution that awarded it."
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
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor={`q-body-${i}`}>Awarded by</label>
                <input id={`q-body-${i}`} name={`qualifications[${i}][issuingBodyName]`} type="text" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-date-${i}`}>Date awarded</label>
                <input id={`q-date-${i}`} name={`qualifications[${i}][awardedOn]`} type="date" />
              </div>
              <div className="form-field">
                <label htmlFor={`q-grade-${i}`}>Grade (optional)</label>
                <input id={`q-grade-${i}`} name={`qualifications[${i}][grade]`} type="text" />
              </div>
            </>
          )}
        />
      ) : null}

      {/* ---------------- Step 5 — experience + languages ---------------- */}
      {step === 5 ? (
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
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`l-level-${i}`}>Level</label>
                  <select id={`l-level-${i}`} name={`languageCompetencies[${i}][level]`} defaultValue="">
                    <option value="">Select…</option>
                    {CEFR_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
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
              </>
            )}
          />
        </>
      ) : null}

      {/* ---------------- Step 6 — references ---------------- */}
      {step === 6 ? (
        <Repeatable
          legend="Character references"
          hint="People who can speak to your character and work. We will tell them where we got their details before contacting them."
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
                <label htmlFor={`r-org-${i}`}>Organisation (optional)</label>
                <input id={`r-org-${i}`} name={`characterReferences[${i}][organisation]`} type="text" />
              </div>
            </>
          )}
        />
      ) : null}

      <div className="form-submit" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href={next ? `/join/profile/${next.slug}` : "/join/profile/done"}
          style={{ fontSize: 14, opacity: 0.75 }}
        >
          Skip for now
        </Link>
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : meta && next ? "Save and continue" : "Save and finish"}
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
