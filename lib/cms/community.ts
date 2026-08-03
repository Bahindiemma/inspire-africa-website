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
  phone?: string | null;
  country?: string | null;
  password?: string | null;
  consentTerms: boolean;
  consentMarketing: boolean;
  /** Honeypot. Any value means a bot filled a hidden field. */
  company?: string | null;
}

export type SubmitResult =
  | { ok: true; clickId: string }
  | { ok: false; reason: 'validation' | 'rate_limited' | 'unavailable'; message?: string };

async function post(
  path: string,
  body: unknown,
  forward: { ip?: string | null; ua?: string | null } = {}
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
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
  const res = await post('/community/submit', input, forward);
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
    const json = (await res.json()) as { clickId?: string };
    return { ok: true, clickId: json.clickId || input.clickId };
  } catch {
    return { ok: true, clickId: input.clickId };
  }
}

/** Fire-and-forget: the handoff to Mighty Networks happened. */
export async function markRedirected(
  clickId: string,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<void> {
  await post('/community/redirect', { clickId }, forward);
}
