/**
 * Server-only client for the CMS profile endpoint (wizard steps 2+).
 *
 * NOTE: server-only module — importing this from a "use client" file would
 * leak COMMUNITY_SIGNUP_TOKEN into the browser bundle. Server Components,
 * Server Actions and Route Handlers only.
 *
 * Step 1 of signup is unchanged and still writes a `Submitted` lead through
 * lib/cms/community.ts. Everything here is additive, so a visitor who
 * abandons the wizard is still a captured lead rather than a lost one.
 */
import type { ProfilePayload } from '@/lib/profile-shape';

const BASE = process.env.COMMUNITY_SIGNUP_URL || process.env.STRAPI_BASE_URL;
const TOKEN = process.env.COMMUNITY_SIGNUP_TOKEN;
const TIMEOUT_MS = 6000; // higher than the 4s used elsewhere: bigger payload

export type ProfileResult =
  | { ok: true; resumeToken: string; profileStep: number; profileCompleteness: number }
  | { ok: false; reason: 'validation' | 'rate_limited' | 'not_found' | 'expired' | 'unavailable'; message?: string };

export async function saveProfileStep(
  payload: ProfilePayload,
  forward?: { ip?: string | null; ua?: string | null }
): Promise<ProfileResult> {
  if (!BASE || !TOKEN) return { ok: false, reason: 'unavailable' };

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/community/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        ...(forward?.ip ? { 'x-forwarded-for': forward.ip } : {}),
        ...(forward?.ua ? { 'user-agent': forward.ua } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (res.status === 429) return { ok: false, reason: 'rate_limited' };
  if (res.status === 404) return { ok: false, reason: 'not_found' };
  if (res.status === 410) return { ok: false, reason: 'expired' };
  if (res.status === 400) {
    let message: string | undefined;
    try {
      message = ((await res.json()) as { error?: string }).error;
    } catch {
      /* non-JSON body */
    }
    return { ok: false, reason: 'validation', message };
  }
  if (!res.ok) return { ok: false, reason: 'unavailable' };

  try {
    const j = (await res.json()) as {
      resumeToken?: string;
      profileStep?: number;
      profileCompleteness?: number;
    };
    return {
      ok: true,
      resumeToken: j.resumeToken ?? '',
      profileStep: j.profileStep ?? 2,
      profileCompleteness: j.profileCompleteness ?? 0,
    };
  } catch {
    return { ok: true, resumeToken: '', profileStep: 2, profileCompleteness: 0 };
  }
}
