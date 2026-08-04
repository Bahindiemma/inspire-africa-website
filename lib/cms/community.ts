/**
 * Server-only client for the CMS community-signup endpoints.
 *
 * Why this exists: every "Join the Community" CTA used to be a raw
 * outbound link to Mighty Networks, so the only signal we had was an
 * `outbound_click` analytics event — which is anonymous AND suppressed
 * entirely for visitors who decline analytics cookies. These calls run
 * server-side, so the click count is consent-independent and does not
 * depend on the visitor having JavaScript.
 *
 * The shared secret (COMMUNITY_SIGNUP_TOKEN) lives only here, never in a
 * client bundle. Deliberately NOT importing lib/strapi.ts: that module is
 * for cached public content reads with the read-only token, and these are
 * uncached authenticated writes on a different secret.
 *
 * Failure policy differs per call and is the whole point:
 *   - trackClick / markRedirected: fail silently. Losing a measurement row
 *     must never block a visitor from reaching the community.
 *   - submitSignup: returns a discriminated result. The caller decides
 *     what to tell someone who just typed in their phone number.
 */
// NOTE: server-only module. We do not import the `server-only` package
// because this repo ships exactly three runtime dependencies and the guard
// isn't worth a fourth — but importing this from a "use client" file WILL
// leak COMMUNITY_SIGNUP_TOKEN into the browser bundle. Only import it from
// Server Components, Server Actions or Route Handlers.
import { randomUUID } from 'crypto';

const BASE = process.env.COMMUNITY_SIGNUP_URL || process.env.STRAPI_BASE_URL;
const TOKEN = process.env.COMMUNITY_SIGNUP_TOKEN;
const TIMEOUT_MS = 4000;
/**
 * submit/resend are slower than the other calls because the CMS attempts an
 * SMTP send before responding. The 4s default aborted mid-send and made a
 * SUCCESSFUL signup look like a failure to the visitor — the row existed,
 * the page said try again. Must stay comfortably above the CMS-side send cap.
 */
const MAIL_TIMEOUT_MS = 20000;

export function isCommunityCaptureConfigured(): boolean {
  return Boolean(BASE && TOKEN);
}

export function newClickId(): string {
  return randomUUID();
}

export interface ClickContext {
  clickId: string;
  source: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
}

export interface SignupInput extends ClickContext {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  consentTerms: boolean;
  consentMarketing: boolean;
  /** jobseeker | employer | government | other — decides the wizard branch. */
  registrantType?: string | null;
  /** Honeypot. Any value means a bot filled a hidden field. */
  company?: string | null;
}

export type SubmitResult =
  | {
      ok: true;
      clickId: string;
      /** True when this address had already confirmed — no new email sent. */
      alreadyVerified: boolean;
      /** False when the CMS could not hand the email to the provider. */
      verificationSent: boolean;
    }
  | { ok: false; reason: 'validation' | 'rate_limited' | 'unavailable'; message?: string };

async function post(
  path: string,
  body: unknown,
  forward: { ip?: string | null; ua?: string | null } = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response | null> {
  if (!BASE || !TOKEN) return null;
  try {
    return await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        ...(forward.ip ? { 'x-forwarded-for': forward.ip } : {}),
        ...(forward.ua ? { 'user-agent': forward.ua } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}

/**
 * Records intent-to-join. Returns the clickId the CMS wants us to use —
 * which may differ from the one we proposed, because the CMS folds a
 * refresh or a second tab into the existing row rather than inflating the
 * click count. Always returns a usable id, even when the CMS is down.
 */
export async function trackClick(
  ctx: ClickContext,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<string> {
  const res = await post('/community/track', ctx, forward);
  if (!res || !res.ok) return ctx.clickId;
  try {
    const json = (await res.json()) as { clickId?: string };
    return json.clickId || ctx.clickId;
  } catch {
    return ctx.clickId;
  }
}

export async function submitSignup(
  input: SignupInput,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<SubmitResult> {
  if (!isCommunityCaptureConfigured()) {
    return { ok: false, reason: 'unavailable' };
  }
  const res = await post('/community/submit', input, forward, MAIL_TIMEOUT_MS);
  if (!res) return { ok: false, reason: 'unavailable' };

  if (res.status === 429) return { ok: false, reason: 'rate_limited' };
  if (res.status === 400) {
    let message: string | undefined;
    try {
      message = ((await res.json()) as { error?: string }).error;
    } catch {
      /* non-JSON body — fall through to the generic message */
    }
    return { ok: false, reason: 'validation', message };
  }
  if (!res.ok) return { ok: false, reason: 'unavailable' };

  try {
    const json = (await res.json()) as {
      clickId?: string;
      alreadyVerified?: boolean;
      verificationSent?: boolean;
    };
    return {
      ok: true,
      clickId: json.clickId || input.clickId,
      alreadyVerified: !!json.alreadyVerified,
      // Absent means the CMS is an older build — assume sent rather than
      // showing a scary message for a working system.
      verificationSent: json.verificationSent !== false,
    };
  } catch {
    return { ok: true, clickId: input.clickId, alreadyVerified: false, verificationSent: true };
  }
}

/** Confirm an emailed token. Returns the outcome so the page can explain it. */
export async function verifyEmail(
  token: string,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<
  | { ok: true; alreadyVerified: boolean; clickId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'unavailable'; clickId?: string }
> {
  const res = await post('/community/verify', { token }, forward);
  if (!res) return { ok: false, reason: 'unavailable' };
  if (res.status === 404) return { ok: false, reason: 'invalid' };
  if (res.status === 410) {
    let clickId: string | undefined;
    try {
      clickId = ((await res.json()) as { clickId?: string }).clickId;
    } catch {
      /* body is optional here */
    }
    return { ok: false, reason: 'expired', clickId };
  }
  if (!res.ok) return { ok: false, reason: 'unavailable' };
  try {
    const j = (await res.json()) as { alreadyVerified?: boolean; clickId?: string };
    return { ok: true, alreadyVerified: !!j.alreadyVerified, clickId: j.clickId || '' };
  } catch {
    return { ok: true, alreadyVerified: false, clickId: '' };
  }
}

/** Re-send the verification email. Always resolves — never leaks whether the id exists. */
export async function resendVerification(
  clickId: string,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<void> {
  await post('/community/resend', { clickId }, forward, MAIL_TIMEOUT_MS);
}

/** Fire-and-forget: the handoff to Mighty Networks happened. */
export async function markRedirected(
  clickId: string,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<void> {
  await post('/community/redirect', { clickId }, forward);
}
