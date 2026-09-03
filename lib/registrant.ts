/**
 * Who is signing up.
 *
 * Andrew Pound: "everyone must pass, regardless of their status". Asking at
 * signup means every record is attributable to an audience from the first
 * touch, without needing a different form per audience.
 *
 * The categories and their descriptions are the CEO's own words
 * (Taxonomy, 04 Aug 2026), with his 12 Aug correction applied: the first
 * category is a WORKER, not a jobseeker. `diaspora` (Diaspora Contributor)
 * was added on top of that original six in September 2026. That correction is the reason the
 * stored value is `worker` too and not just the visible label — leaving
 * `jobseeker` in the database would mean every report and CSV export kept
 * printing the term he rejected. Legacy rows were migrated; `jobseeker` is
 * still accepted on input and mapped to `worker` so a stale form or a
 * cached page cannot lose a signup.
 *
 * Dependency-free and safe to import from client or server — types and
 * option lists only, no secrets and no CMS call.
 */
export type RegistrantType =
  | 'worker'
  | 'employer'
  | 'government'
  | 'education'
  | 'development'
  | 'diaspora'
  | 'other';

export const REGISTRANT_TYPES: ReadonlyArray<{
  value: RegistrantType;
  label: string;
  blurb: string;
}> = [
  {
    value: 'worker',
    label: 'Worker',
    blurb: 'I want to prepare for future career opportunities.',
  },
  {
    value: 'employer',
    label: 'Employer & Recruiter',
    blurb: "I'm looking for skilled talent or workforce solutions.",
  },
  {
    value: 'government',
    label: 'Government / Public Sector',
    blurb: "I'm interested in workforce mobility policy, programmes or partnerships.",
  },
  {
    value: 'education',
    label: 'Education / Training Provider',
    blurb: "I'm involved in skills development or workforce preparation.",
  },
  {
    value: 'development',
    label: 'Development Partner / NGO',
    blurb: "I'm interested in ethical workforce mobility and skills development.",
  },
  {
    value: 'diaspora',
    label: 'Diaspora Contributor',
    blurb:
      'I want to support African talent and workforce development through investment, expertise, mentoring or networks.',
  },
  {
    value: 'other',
    label: 'Something else',
    blurb: "I'm in the media, a supplier, member of staff or other.",
  },
];

/** The value this form defaults to, and the fallback for anything unrecognised. */
export const DEFAULT_REGISTRANT_TYPE: RegistrantType = 'worker';

/**
 * Values retired by the 2026-08 taxonomy change, mapped to their replacement.
 * Kept so a page cached before the change still submits something valid.
 */
const LEGACY_REGISTRANT_TYPES: Record<string, RegistrantType> = {
  jobseeker: 'worker',
};

export function isRegistrantType(v: string | undefined | null): v is RegistrantType {
  return !!v && REGISTRANT_TYPES.some((r) => r.value === v);
}

/** Normalise anything submitted into a current value. Never throws. */
export function toRegistrantType(v: string | undefined | null): RegistrantType {
  if (isRegistrantType(v)) return v;
  if (v && LEGACY_REGISTRANT_TYPES[v]) return LEGACY_REGISTRANT_TYPES[v];
  return DEFAULT_REGISTRANT_TYPE;
}
