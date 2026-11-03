"use server";

import { headers } from "next/headers";
import { resendInvitation } from "@/lib/register";

export interface ResendState {
  sent?: boolean;
  error?: string;
}

/**
 * Send a worker's readiness link again.
 *
 * Only workers have anything to resend — their invitation comes from the
 * register. Other registrants are only recorded, so their page offers no
 * resend and this refuses a forged post for them rather than emailing anyone.
 *
 * The register answers "sent" for an unknown click id and sends nothing, so
 * reporting success here cannot be used to probe which ids exist. What we DO
 * report honestly is when mail demonstrably did not leave (register down, key
 * unset, mail transport failing, rate limit): telling a worker to check their
 * inbox then would strand them, and none of those outcomes says anything about
 * their address.
 */
export async function resendVerificationAction(
  _prev: ResendState,
  data: FormData
): Promise<ResendState> {
  const clickId = String(data.get("clickId") ?? "").trim().slice(0, 64);
  const audience = String(data.get("for") ?? "").trim();
  if (!clickId || audience !== "worker") {
    return { error: "We couldn't identify your signup. Please start again from the join page." };
  }

  const h = await headers();
  const result = await resendInvitation(clickId, {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  });

  if (result.ok && result.mail === "sent") return { sent: true };
  if (!result.ok && result.reason === "rate_limited") {
    return { error: "You've asked for a few links already. Please wait a few minutes and try again." };
  }
  return {
    error:
      "We couldn't send the link just now. Please try again in a moment, or email info@inspireafricans.com.",
  };
}
