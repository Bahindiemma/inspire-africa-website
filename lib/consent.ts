/**
 * Cookie-consent state for INSPIRE AFRICA. Privacy-by-design:
 *   - Only a strictly-necessary first-party cookie (`ia_consent`) stores
 *     the decision itself. Nothing else is set until the visitor opts in.
 *   - Honours Do-Not-Track and Global Privacy Control: when either is on
 *     and there's no explicit choice yet, we default to "rejected".
 *   - Versioned, so a policy change can re-prompt.
 *
 * Safe to import from client components; every browser API is guarded.
 */
export const CONSENT_COOKIE = 'ia_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export interface ConsentRecord {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: string; // ISO timestamp of the decision
}

export type ConsentLevel = 'necessary' | 'analytics' | 'all';

export const REJECTED: Omit<ConsentRecord, 'ts'> = {
  v: CONSENT_VERSION,
  analytics: false,
  marketing: false,
};

export const ACCEPTED_ALL: Omit<ConsentRecord, 'ts'> = {
  v: CONSENT_VERSION,
  analytics: true,
  marketing: true,
};

export function consentLevel(rec: ConsentRecord | null): ConsentLevel {
  if (!rec) return 'necessary';
  if (rec.marketing) return 'all';
  if (rec.analytics) return 'analytics';
  return 'necessary';
}

export function readConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    const parsed = JSON.parse(raw) as ConsentRecord;
    // A version bump invalidates an older decision → re-prompt.
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      v: CONSENT_VERSION,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      ts: typeof parsed.ts === 'string' ? parsed.ts : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(rec: Omit<ConsentRecord, 'ts' | 'v'>): ConsentRecord {
  const full: ConsentRecord = {
    v: CONSENT_VERSION,
    analytics: Boolean(rec.analytics),
    marketing: Boolean(rec.marketing),
    ts: new Date().toISOString(),
  };
  if (typeof document !== 'undefined') {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(full))}` +
      `; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }
  return full;
}

export function clearConsent() {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** True when the browser signals a global opt-out (GPC or DNT). */
export function hasRejectSignal(): boolean {
  if (typeof navigator === 'undefined') return false;
  const gpc = (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl;
  const dnt =
    navigator.doNotTrack === '1' ||
    (typeof window !== 'undefined' &&
      (window as unknown as { doNotTrack?: string }).doNotTrack === '1');
  return Boolean(gpc) || Boolean(dnt);
}
