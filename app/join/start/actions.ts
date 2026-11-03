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
 * Flow: validate → record the lead in the CMS (everyone) → for a worker, ask
 * the register to email an invitation into INSPIRE AFRICA Readiness → land on
 * /join/check-email. There is no Mighty Networks hand-off any more.
 *
 * The CMS stays the measurement record for every registrant type (join
 * statistics, attribution), but for a worker it is ONLY that: the worker's
 * email comes from the register, so a CMS outage must not stop a worker being
 * invited. Non-workers have no register step and keep today's CMS behaviour.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { submitSignup, newClickId } from "@/lib/cms/community";
import { requestInvitation } from "@/lib/register";
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

  if (registrantType === "worker") {
    // Honeypot: the CMS quietly swallows a bot's submission, but the register
    // has no such field, so a bot must never reach it — that would make us
    // email links to whatever addresses spam fills in. Show the neutral
    // "received" page, which promises no email.
    if (company) {
      redirect(`/join/check-email?for=other&clickId=${encodeURIComponent(clickId)}`);
    }

    // CMS result is deliberately ignored beyond this point: the lead row is a
    // measurement, the invitation is the product. Use the id the CMS settled
    // on when it answered (it folds a second tab into the existing row), else
    // the one we proposed, so "send it again" can find the invitation.
    const inviteClickId = result.ok ? result.clickId : clickId;

    const invite = await requestInvitation(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        registrant_type: "worker",
        click_id: inviteClickId,
        source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      },
      forward
    );

    if (!invite.ok) {
      if (invite.reason === "rate_limited") {
        return {
          error: "Too many attempts for this email address. Please wait an hour and try again.",
          values,
        };
      }
      if (invite.reason === "validation") {
        return {
          error:
            invite.message || "We couldn't accept those details. Please check and try again.",
          values,
        };
      }
      // The register is unreachable or not configured, so no link has been
      // sent. There is no honest "check your inbox" to show — say so and let
      // them retry. (Their details are not lost: the CMS row, if it saved,
      // already holds them.)
      return {
        error:
          "We couldn't complete your signup just now. Please try again in a moment — nothing has been lost.",
        values,
      };
    }

    // The same page whether the address is new, already a member, or on a
    // suppression list: the difference lives only in the email, never on
    // screen, so this form cannot be used to find out who has an account.
    const query = new URLSearchParams({ for: "worker", clickId: inviteClickId });
    if (invite.mail === "failed") query.set("mail", "failed");
    // redirect() throws NEXT_REDIRECT by design — must be outside try/catch.
    redirect(`/join/check-email?${query.toString()}`);
  }

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
    // The CMS is unreachable, so this (non-worker) signup was not recorded.
    // Say so and let them retry rather than claim we have their details.
    return {
      error:
        "We couldn't complete your signup just now. Please try again in a moment — nothing has been lost.",
      values,
    };
  }

  // Non-workers are only recorded: no register step, no link, no resend.
  // redirect() throws NEXT_REDIRECT by design — must be outside try/catch.
  redirect(`/join/check-email?for=other&clickId=${encodeURIComponent(result.clickId)}`);
}
