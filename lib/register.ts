/**
 * Server-only client for the member register's website-invitation endpoints.
 *
 * Why this exists: a worker who joins on this site is no longer sent on to
 * the Mighty Networks community. The register (db.inspireafricans.com) owns
 * invitations, accounts and all worker email, so after the CMS has recorded
 * the lead we ask the register to email the worker a link into INSPIRE AFRICA
 * Readiness. See docs/superpowers/specs/2026-11-03-join-to-readiness-design.md.
 *
 * The shared secret (REGISTER_WEBSITE_KEY) lives only here, never in a client
 * bundle, and is deliberately a different secret from COMMUNITY_SIGNUP_TOKEN
 * and from the portal's key, so a leak of one cannot be replayed against
 * another. Like lib/cms/community.ts this does not import the `server-only`
 * package (the repo ships exactly three runtime dependencies), so the rule is
 * by convention: importing this from a "use client" file WILL leak the key
 * into the browser bundle. Only import it from Server Components, Server
 * Actions or Route Handlers.
 *
 * Failure policy — FAIL CLOSED. A worker's only email is the register's
 * invitation, so when the register is not configured, unreachable, slow or
 * answers anything we do not understand, the result is "unavailable" and the
 * caller must NOT tell the worker to check their inbox: nothing was sent.
 *
 * The register answers 202 "sent" for every address case (new, already a
 * member, deactivated, suppressed) so that nothing here can reveal whether an
 * address has an account. We pass that through untouched and never branch on
 * anything finer than "mail left" vs "mail failed".
 */
const BASE = process.env.REGISTER_API_URL?.replace(/\/+$/, '');
const KEY = process.env.REGISTER_WEBSITE_KEY;
/**
 * The register sends the email inline before answering, so this has to sit
 * above its own send cap — same reasoning as MAIL_TIMEOUT_MS in
 * lib/cms/community.ts: aborting mid-send makes a SUCCESSFUL invite look like
 * a failure and the worker is told to try again.
 */
const TIMEOUT_MS = 20000;

export interface InviteInput {
  first_name: string;
  last_name: string;
  email: string;
  /** Only workers are invited; the register rejects anything else with 422. */
  registrant_type: 'worker';
  /** The CMS join-click id — lets "send it again" find the invitation. */
  click_id?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export type InviteResult =
  | {
      ok: true;
      /** "failed" only when the register's mail transport is down. */
      mail: 'sent' | 'failed';
    }
  | { ok: false; reason: 'validation' | 'rate_limited' | 'unavailable'; message?: string };

export function isRegisterConfigured(): boolean {
  return Boolean(BASE && KEY);
}

async function call(
  path: string,
  body: unknown,
  forward: { ip?: string | null; ua?: string | null } = {}
): Promise<InviteResult> {
  if (!BASE || !KEY) return { ok: false, reason: 'unavailable' };

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Website-Key': KEY,
        ...(forward.ip ? { 'x-forwarded-for': forward.ip } : {}),
        ...(forward.ua ? { 'user-agent': forward.ua } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Network error or timeout — nothing is known to have been sent.
    return { ok: false, reason: 'unavailable' };
  }

  if (res.status === 429) return { ok: false, reason: 'rate_limited' };

  if (res.status === 422) {
    let message: string | undefined;
    try {
      message = ((await res.json()) as { message?: string }).message;
    } catch {
      /* non-JSON body — the caller falls back to a generic message */
    }
    return { ok: false, reason: 'validation', message };
  }

  // Anything but 202 (401 wrong/unset key, 5xx, a proxy's HTML error page…)
  // is "unavailable": we cannot claim a link is on its way.
  if (res.status !== 202) return { ok: false, reason: 'unavailable' };

  try {
    const json = (await res.json()) as { data?: { mail?: string } };
    if (json.data?.mail === 'sent') return { ok: true, mail: 'sent' };
    if (json.data?.mail === 'failed') return { ok: true, mail: 'failed' };
  } catch {
    /* fall through */
  }
  // A 202 we cannot read is not proof that mail left.
  return { ok: false, reason: 'unavailable' };
}

/** Ask the register to email this worker a link into readiness. */
export function requestInvitation(
  input: InviteInput,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<InviteResult> {
  return call('/website/invitations', input, forward);
}

/**
 * Issue a fresh link for the invitation tied to this join click. The register
 * answers "sent" for an unknown id (nothing is sent), so this cannot be used
 * to probe which ids exist.
 */
export function resendInvitation(
  clickId: string,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<InviteResult> {
  return call('/website/invitations/resend', { click_id: clickId }, forward);
}
