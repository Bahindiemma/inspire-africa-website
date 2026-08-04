/**
 * Who is signing up.
 *
 * Andrew Pound: "everyone must pass, regardless of their status (jobseeker,
 * employer, government, internal, other)". Asking at signup means every
 * record is attributable to an audience from the first touch, without
 * needing a different form per audience.
 *
 * Dependency-free and safe to import from client or server — types and
 * option lists only, no secrets and no CMS call.
 */
export type RegistrantType = 'jobseeker' | 'employer' | 'government' | 'other';

export const REGISTRANT_TYPES: ReadonlyArray<{
  value: RegistrantType;
  label: string;
  blurb: string;
}> = [
  { value: 'jobseeker', label: 'A jobseeker', blurb: 'I am looking for work abroad.' },
  { value: 'employer', label: 'An employer', blurb: 'I want to hire workers.' },
  { value: 'government', label: 'A government representative', blurb: 'I work for a ministry or public agency.' },
  { value: 'other', label: 'Something else', blurb: 'Partner, recruiter, training provider, press.' },
];

export function isRegistrantType(v: string | undefined | null): v is RegistrantType {
  return !!v && REGISTRANT_TYPES.some((r) => r.value === v);
}
