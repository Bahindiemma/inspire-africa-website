/**
 * Shared shape for the signup profile wizard (Andrew items 1-6, 8).
 *
 * Deliberately dependency-free and importable from BOTH client and server —
 * it contains types and option lists only, never secrets and never a CMS
 * call. The server-only transport lives in lib/cms/profile.ts.
 *
 * Items 7 (fitness: health certificate, police clearance) and 9 (infectious
 * disease screening) are intentionally absent. They are GDPR Article 9 /
 * Article 10 data, are not covered by the lawful basis published in the
 * privacy policy, and at signup there is no purpose that satisfies data
 * minimisation. They require a completed DPIA before any field exists.
 */

export interface IdentityDocumentInput {
  kind: string;
  number: string;
  issuingAuthority?: string;
  issuingCountry?: string;
  issuedOn?: string;
  expiresOn?: string;
}

export interface ContactPointInput {
  kind: string;
  value: string;
  label?: string;
  isPrimary?: boolean;
}

export interface QualificationInput {
  kind: string;
  title: string;
  level?: string;
  fieldOfStudy?: string;
  issuingBodyName?: string;
  issuingBodyCountry?: string;
  reference?: string;
  awardedOn?: string;
  expiresOn?: string;
  grade?: string;
}

export interface WorkExperienceInput {
  employerName: string;
  employerCountry?: string;
  jobTitle: string;
  startedOn?: string;
  endedOn?: string;
  isCurrent?: boolean;
  responsibilities?: string;
}

export interface LanguageCompetencyInput {
  languageCode: string;
  languageName?: string;
  level?: string;
  framework?: string;
  qualificationTitle?: string;
  issuingBodyName?: string;
  qualifiedOn?: string;
  expiresOn?: string;
  grade?: string;
}

export interface CharacterReferenceInput {
  name: string;
  relationship?: string;
  email?: string;
  phone?: string;
  organisation?: string;
}

export interface ProfilePayload {
  clickId?: string;
  resumeToken?: string;
  step: number;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  residentialAddress?: string | null;
  identityDocuments?: IdentityDocumentInput[];
  contactPoints?: ContactPointInput[];
  qualifications?: QualificationInput[];
  workExperiences?: WorkExperienceInput[];
  languageCompetencies?: LanguageCompetencyInput[];
  characterReferences?: CharacterReferenceInput[];
}

/* ----------------------------- option lists ----------------------------- */

export const ID_KINDS = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'birth_certificate', label: 'Birth certificate' },
  { value: 'drivers_licence', label: "Driver's licence" },
  { value: 'residence_permit', label: 'Residence permit' },
  { value: 'other', label: 'Other' },
] as const;

export const QUAL_LEVELS = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's degree" },
  { value: 'master', label: "Master's degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'short_course', label: 'Short course' },
  { value: 'other', label: 'Other' },
] as const;

export const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 — Beginner' },
  { value: 'A2', label: 'A2 — Elementary' },
  { value: 'B1', label: 'B1 — Intermediate' },
  { value: 'B2', label: 'B2 — Upper intermediate' },
  { value: 'C1', label: 'C1 — Advanced' },
  { value: 'C2', label: 'C2 — Proficient' },
  { value: 'native', label: 'Native speaker' },
] as const;

/** Languages that actually matter across our corridors, most likely first. */
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
  { value: 'sw', label: 'Swahili' },
  { value: 'wo', label: 'Wolof' },
  { value: 'ff', label: 'Fula' },
  { value: 'mnk', label: 'Mandinka' },
  { value: 'lg', label: 'Luganda' },
  { value: 'am', label: 'Amharic' },
  { value: 'other', label: 'Other' },
] as const;

/** The wizard. Step 1 is the existing five-field signup and is NOT part of this. */
export const PROFILE_STEPS = [
  { step: 2, slug: 'about-you', title: 'About you', blurb: 'A few details that identify you on official documents.' },
  { step: 3, slug: 'contact', title: 'How to reach you', blurb: 'The best ways to contact you about opportunities.' },
  { step: 4, slug: 'qualifications', title: 'Qualifications', blurb: 'What you have studied and any professional training.' },
  { step: 5, slug: 'experience', title: 'Work & languages', blurb: 'Where you have worked and which languages you speak.' },
  { step: 6, slug: 'references', title: 'References', blurb: 'People who can speak to your character and work.' },
] as const;

export function stepBySlug(slug: string) {
  return PROFILE_STEPS.find((s) => s.slug === slug) ?? null;
}
