"use client";

/**
 * The INSPIRE AFRICA signup layer that sits in front of the Mighty
 * Networks handoff.
 *
 * Progressive enhancement is the point: `action={formAction}` posts
 * natively when JavaScript is unavailable (React 19 / Next 15 replay the
 * Server Action on the server and follow the redirect), and upgrades to
 * inline errors + a pending state when it is. Nothing here is required for
 * the form to work — only for it to feel better.
 *
 * Reuses the existing .form-grid / .form-field / .btn classes from
 * globals.css so it matches ContactForm without new CSS.
 */
import { useActionState } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { submitCommunitySignup, type SignupState } from "@/app/join/start/actions";
import { REGISTRANT_TYPES } from "@/lib/profile-shape";

/** Corridor + origin countries we actually serve, most likely first. */
const DIAL_CODES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "+256", label: "Uganda (+256)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+255", label: "Tanzania (+255)" },
  { code: "+250", label: "Rwanda (+250)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+233", label: "Ghana (+233)" },
  { code: "+251", label: "Ethiopia (+251)" },
  { code: "+260", label: "Zambia (+260)" },
  { code: "+263", label: "Zimbabwe (+263)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+353", label: "Ireland (+353)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+971", label: "UAE (+971)" },
];

export interface CommunitySignupFormProps {
  clickId: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  /** Only true when the CMS has COMMUNITY_SIGNUP_PASSWORD=on. */
  showPassword?: boolean;
}

const initialState: SignupState = {};

export function CommunitySignupForm({
  clickId,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
  showPassword = false,
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

      {/* Andrew: "everyone must pass, regardless of their status". This choice
          decides which questions we go on to ask — and, just as importantly,
          which we must NOT ask. An employer contact is never shown a passport
          or health field. */}
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
          This decides what we ask you next. Everyone is welcome in the community.
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
          aria-describedby={describedBy("email")}
        />
        {err.email ? (
          <p id="email-error" className="field-error" role="alert">
            {err.email}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="cs-dial">Country code</label>
        <select id="cs-dial" name="dialCode" defaultValue={v.dialCode || "+256"}>
          {DIAL_CODES.map((d) => (
            <option key={d.label} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="cs-phone">Phone number</label>
        <input
          id="cs-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          defaultValue={v.phone ?? ""}
          aria-invalid={err.phone ? true : undefined}
          aria-describedby={describedBy("phone")}
        />
        {err.phone ? (
          <p id="phone-error" className="field-error" role="alert">
            {err.phone}
          </p>
        ) : null}
      </div>

      <div className="form-field full">
        <label htmlFor="cs-country">Country you live in (optional)</label>
        <input
          id="cs-country"
          name="country"
          type="text"
          autoComplete="country-name"
          defaultValue={v.country ?? ""}
        />
      </div>

      {showPassword ? (
        <div className="form-field full">
          <label htmlFor="cs-password">Create a password (min 12 characters)</label>
          <input
            id="cs-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
          />
        </div>
      ) : null}

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

      <div className="form-field full">
        <label
          htmlFor="cs-marketing"
          style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}
        >
          <input
            id="cs-marketing"
            name="consentMarketing"
            type="checkbox"
            defaultChecked={v.consentMarketing === "on"}
            style={{ width: "auto", marginTop: 4 }}
          />
          <span>
            Send me opportunities, events and corridor updates by email. (Optional — you can
            unsubscribe at any time.)
          </span>
        </label>
      </div>

      <div className="form-submit">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Taking you there…" : "Join the Community — Free"}
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
