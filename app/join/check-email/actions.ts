"use server";

import { headers } from "next/headers";
import { resendVerification } from "@/lib/cms/community";

export interface ResendState {
  sent?: boolean;
  error?: string;
}

/**
 * Re-send the verification email.
 *
 * Always reports success to the visitor. The CMS caps resends and answers
 * identically for unknown or already-verified ids, so surfacing anything
 * more specific here would leak which clickIds exist — and would not help
 * the person, who can only wait or contact us either way.
 */
export async function resendVerificationAction(
  _prev: ResendState,
  data: FormData
): Promise<ResendState> {
  const clickId = String(data.get("clickId") ?? "").trim().slice(0, 64);
  if (!clickId) {
    return { error: "We couldn't identify your signup. Please start again from the join page." };
  }

  const h = await headers();
  await resendVerification(clickId, {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  });

  return { sent: true };
}
