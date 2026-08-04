"use client";

/**
 * The INSPIRE AFRICA signup layer that sits in front of the Mighty Networks
 * handoff.
 *
 * Captures who you are (jobseeker / employer / government / other), your
 * name and your email — nothing else. Everyone then confirms their email
 * before reaching the community.
 *
 * Progressive enhancement is the point: `action={formAction}` posts natively
 * when JavaScript is unavailable, and upgrades to inline errors and a
 * pending state when it is. Nothing here is required for the form to work —
 * only for it to feel better.
 *
 * Reuses the existing .form-grid / .form-field / .btn classes from
 * globals.css so it matches ContactForm without new CSS.
 */
import { useActionState } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { submitCommunitySignup, type SignupState } from "@/app/join/start/actions";
import { REGISTRANT_TYPES } from "@/lib/registrant";

export interface CommunitySignupFormProps {
  clickId: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

const initialState: SignupState = {};

export function CommunitySignupForm({
  clickId,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
}: CommunitySignupFormProps) {
  const [state, formAction, pending] = useActionState(submitCommunitySignup, initialState);
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  const describedBy = (name: string) => (err[name] ? `${name}-error` : undefined);

  return (
    <form className="form-grid" action={formAction} name="community_signup" noValidate>
      {/* Attribution — set server-side, never editable by the visitor. */}
      <input type="hidden" name="clickId" value={clickId} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="utm_source" value={utmSource} />
      <input type="hidden" name="utm_medium" value={utmMedium} />
      <input type="hidden" name="utm_campaign" value={utmCampaign} />

      {/* Honeypot. Off-screen rather than display:none — some bots skip
          hidden inputs but happily fill positioned ones. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="cs-company">Company (leave this blank)</label>
        <input id="cs-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error ? (
        <div className="form-field full" role="alert">
          <p style={{ color: "#b00020", margin: 0, fontWeight: 600 }}>{state.error}</p>
        </div>
      ) : null}

      <div className="form-field full">
        <label htmlFor="cs-type">I am…</label>
        <select
          id="cs-type"
          name="registrantType"
          required
          defaultValue={v.registrantType || "jobseeker"}
          aria-describedby="cs-type-hint"
        >
          {REGISTRANT_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} — {r.blurb}
            </option>
          ))}
        </select>
        <p id="cs-type-hint" style={{ fontSize: 13, opacity: 0.7, margin: "6px 0 0" }}>
          Everyone is welcome in the community.
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="cs-first">First name</label>
        <input
          id="cs-first"
          name="firstName"
          type="text"
          autoComplete="given-name"
          required
          defaultValue={v.firstName ?? ""}
          aria-invalid={err.firstName ? true : undefined}
          aria-describedby={describedBy("firstName")}
        />
        {err.firstName ? (
          <p id="firstName-error" className="field-error" role="alert">
            {err.firstName}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="cs-last">Last name</label>
        <input
          id="cs-last"
          name="lastName"
          type="text"
          autoComplete="family-name"
          required
          defaultValue={v.lastName ?? ""}
          aria-invalid={err.lastName ? true : undefined}
          aria-describedby={describedBy("lastName")}
        />
        {err.lastName ? (
          <p id="lastName-error" className="field-error" role="alert">
            {err.lastName}
          </p>
        ) : null}
      </div>

      <div className="form-field full">
        <label htmlFor="cs-email">Email</label>
        <input
          id="cs-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={v.email ?? ""}
          aria-invalid={err.email ? true : undefined}
          aria-describedby={err.email ? "email-error" : "email-hint"}
        />
        {err.email ? (
          <p id="email-error" className="field-error" role="alert">
            {err.email}
          </p>
        ) : (
          <p id="email-hint" style={{ fontSize: 13, opacity: 0.7, margin: "6px 0 0" }}>
            We send a confirmation link here — check it is one you can open.
          </p>
        )}
      </div>

      <div className="form-field full">
        <label
          htmlFor="cs-terms"
          style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}
        >
          <input
            id="cs-terms"
            name="consentTerms"
            type="checkbox"
            required
            style={{ width: "auto", marginTop: 4 }}
            aria-invalid={err.consentTerms ? true : undefined}
            aria-describedby={describedBy("consentTerms")}
          />
          <span>
            I accept the <a href="/terms">Terms</a> and{" "}
            <a href="/privacy">Privacy Policy</a>, and understand that the community is
            hosted on Mighty Networks.
          </span>
        </label>
        {err.consentTerms ? (
          <p id="consentTerms-error" className="field-error" role="alert">
            {err.consentTerms}
          </p>
        ) : null}
      </div>

      <div className="form-submit">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Sending your link…" : "Join the Community — Free"}
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
