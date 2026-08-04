"use server";

/**
 * Server Action behind the community signup gate.
 *
 * Chosen over a POST route handler deliberately: a Server Action gives us
 * real progressive enhancement for free — the <form> posts and redirects
 * correctly with JavaScript disabled, which a fetch()-based handler cannot
 * do without hand-rolling a no-JS fallback. The signup path is the one
 * place on this site where losing a submission has a direct commercial
 * cost, so it should degrade the least.
 *
 * Flow: validate → persist to the CMS → mark the handoff → 303 to Mighty
 * Networks. If the CMS is unreachable we STILL redirect: a broken database
 * must never stand between a worker and the community.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";
import { markRedirected, submitSignup, newClickId } from "@/lib/cms/community";

export interface SignupState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a failed submit doesn't wipe what the visitor typed. */
  values?: Record<string, string>;
}

const MAX = { name: 80, email: 254, phone: 32, country: 80 };

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
  const dialCode = field(data, "dialCode", 8);
  const phoneLocal = field(data, "phone", MAX.phone);
  const country = field(data, "country", MAX.country);
  const password = field(data, "password", 200);
  const consentTerms = data.get("consentTerms") != null;
  const consentMarketing = data.get("consentMarketing") != null;
  const company = field(data, "company", 200); // honeypot
  const clickId = field(data, "clickId", 64) || newClickId();
  const source = field(data, "source", 128) || "join_gate";
  const utmSource = field(data, "utm_source", 128) || source;
  const utmMedium = field(data, "utm_medium", 128) || "website";
  const utmCampaign = field(data, "utm_campaign", 128) || "join_community";

  // Values echoed back on error. Never echo the password.
  const values = {
    firstName,
    lastName,
    email,
    dialCode,
    phone: phoneLocal,
    country,
    consentMarketing: consentMarketing ? "on" : "",
  };

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Please enter your first name.";
  if (!lastName) fieldErrors.lastName = "Please enter your last name.";
  if (!email) fieldErrors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email))
    fieldErrors.email = "That email address doesn't look right.";
  if (!phoneLocal) fieldErrors.phone = "Please enter your phone number.";
  else if (phoneLocal.replace(/\D+/g, "").length < 6)
    fieldErrors.phone = "That phone number looks too short.";
  if (!consentTerms)
    fieldErrors.consentTerms = "Please accept the Terms and Privacy Policy to continue.";

  if (Object.keys(fieldErrors).length) {
    return { fieldErrors, values };
  }

  // Combine dial code + local number into E.164. The national trunk prefix
  // must be dropped: people across our corridors write their number as
  // "0704 118 220", and naively concatenating gives +2560704118220 — a
  // number that cannot be dialled or matched against a WhatsApp account.
  // If they typed a full international number themselves, leave it alone.
  const phone = phoneLocal.startsWith("+")
    ? phoneLocal
    : `${dialCode || ""}${phoneLocal.replace(/\D+/g, "").replace(/^0/, "")}`;

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
      phone,
      country: country || null,
      password: password || null,
      consentTerms,
      consentMarketing,
      company,
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
    // `unavailable` — the CMS is down or unconfigured. We have lost the
    // lead, which is bad, but blocking the visitor is worse: send them to
    // the community anyway. The failure is already logged server-side.
  }

  if (result.ok) {
    // Best-effort; never block the handoff on it.
    await markRedirected(result.clickId, forward).catch(() => {});

    // The lead is banked. Offer the profile wizard next — every step of it is
    // skippable and the community link is present throughout, so this adds
    // profile depth without holding the membership hostage.
    // redirect() throws NEXT_REDIRECT by design — outside try/catch.
    redirect(`/join/profile/about-you?clickId=${encodeURIComponent(result.clickId)}`);
  }

  // Capture failed (CMS unreachable). Do not send them into a wizard that
  // cannot save — hand them straight to the community as before.
  const settings = await getSiteSettings().catch(() => null);
  redirect(
    buildJoinUrl(settings?.communityBaseUrl, {
      source,
      medium: utmMedium,
      campaign: utmCampaign,
    })
  );
}
