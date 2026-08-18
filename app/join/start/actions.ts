"use server";

/**
 * Server Action behind the community signup gate.
 *
 * Chosen over a POST route handler deliberately: a Server Action gives us
 * real progressive enhancement for free — the <form> posts and redirects
 * correctly with JavaScript disabled, which a fetch()-based handler cannot
 * do without hand-rolling a no-JS fallback. Signup is the one place on this
 * site where losing a submission has a direct commercial cost, so it should
 * degrade the least.
 *
 * Flow: validate → persist → CMS sends a verification email → land on
 * /join/check-email. The community link is only reachable after the email is
 * confirmed, so unlike before we do NOT hand off to Mighty Networks here.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { submitSignup, newClickId } from "@/lib/cms/community";
import { toRegistrantType, type RegistrantType } from "@/lib/registrant";

export interface SignupState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a failed submit doesn't wipe what the visitor typed. */
  values?: Record<string, string>;
}

const MAX = { name: 80, email: 254 };

function field(data: FormData, key: string, max: number): string {
  const v = data.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function submitCommunitySignup(
  _prev: SignupState,
  data: FormData
): Promise<SignupState> {
  const firstName = field(data, "firstName", MAX.name);
  const lastName = field(data, "lastName", MAX.name);
  const email = field(data, "email", MAX.email);
  const consentTerms = data.get("consentTerms") != null;
  const company = field(data, "company", 200); // honeypot
  // Normalises unknown AND retired values (a page cached before the 2026-08
  // taxonomy change still posts `jobseeker`), so a stale form cannot be
  // rejected or silently filed under the wrong audience.
  const registrantType: RegistrantType = toRegistrantType(field(data, "registrantType", 32));
  const clickId = field(data, "clickId", 64) || newClickId();
  const source = field(data, "source", 128) || "join_gate";
  const utmSource = field(data, "utm_source", 128) || source;
  const utmMedium = field(data, "utm_medium", 128) || "website";
  const utmCampaign = field(data, "utm_campaign", 128) || "join_community";

  const values = {
    registrantType,
    firstName,
    lastName,
    email,
  };

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Please enter your first name.";
  if (!lastName) fieldErrors.lastName = "Please enter your last name.";
  if (!email) fieldErrors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email))
    fieldErrors.email = "That email address doesn't look right.";
  if (!consentTerms)
    fieldErrors.consentTerms = "Please accept the Terms and Privacy Policy to continue.";

  if (Object.keys(fieldErrors).length) {
    return { fieldErrors, values };
  }

  const h = await headers();
  const forward = {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  };

  const result = await submitSignup(
    {
      clickId,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer: h.get("referer"),
      landingPath: "/join/start",
      email,
      firstName,
      lastName,
      consentTerms,
      company,
      registrantType,
    },
    forward
  );

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      return {
        error: "Too many attempts from your connection. Please wait a minute and try again.",
        values,
      };
    }
    if (result.reason === "validation") {
      return {
        error: result.message || "We couldn't accept those details. Please check and try again.",
        values,
      };
    }
    // The CMS is unreachable. We cannot send a verification email, so there
    // is no honest "check your inbox" to show — say so and let them retry.
    // Previously this path fell through to the community; it must not now,
    // because an unverified visitor is not supposed to get there.
    return {
      error:
        "We couldn't complete your signup just now. Please try again in a moment — nothing has been lost.",
      values,
    };
  }

  // Saved, but the verification email did not go out. Telling them to check
  // their inbox would strand them, so send them to a page that offers a
  // resend instead.
  const query = new URLSearchParams({ clickId: result.clickId });
  if (result.alreadyVerified) query.set("verified", "1");
  if (!result.verificationSent) query.set("mail", "failed");

  // redirect() throws NEXT_REDIRECT by design — must be outside try/catch.
  redirect(`/join/check-email?${query.toString()}`);
}
