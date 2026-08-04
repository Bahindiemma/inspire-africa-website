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
  documentImage?: number;
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
  certificateFile?: number;
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

export interface OrganisationInput {
  name: string;
  kind?: string;
  registrationNumber?: string;
  country?: string;
  sector?: string;
  sizeBand?: string;
  website?: string;
  contactJobTitle?: string;
  department?: string;
  remit?: string;
}

export interface HiringNeedInput {
  roleTitle: string;
  sector?: string;
  vacancies?: number;
  destinationCountry?: string;
  startFrom?: string;
  notes?: string;
}

/** Andrew item 7 — GDPR Article 9 / Article 10. Consent-gated. */
export interface HealthClearanceInput {
  kind: string;
  reference?: string;
  issuingAuthority?: string;
  issuedOn?: string;
  expiresOn?: string;
  testsCovered?: string;
  documentFile?: number;
}

/** Andrew item 9 — GDPR Article 9. Consent-gated. */
export interface DiseaseScreeningInput {
  disease: string;
  result?: string;
  testedOn?: string;
  expiresOn?: string;
  issuingAuthority?: string;
  certificateNumber?: string;
  documentFile?: number;
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
  organisation?: OrganisationInput | null;
  hiringNeeds?: HiringNeedInput[];
  healthClearances?: HealthClearanceInput[];
  diseaseScreenings?: DiseaseScreeningInput[];
  consentSpecialCategory?: boolean;
  profileImage?: number | null;
  cvFile?: number | null;
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

/* ------------------------------ registrant ------------------------------ */

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

export const ORG_KINDS = [
  { value: 'employer', label: 'Employer' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'agency', label: 'Government agency' },
  { value: 'public_employment_service', label: 'Public employment service' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'training_provider', label: 'Training provider' },
  { value: 'other', label: 'Other' },
] as const;

export const SIZE_BANDS = [
  { value: '1-9', label: '1–9 staff' },
  { value: '10-49', label: '10–49 staff' },
  { value: '50-249', label: '50–249 staff' },
  { value: '250-999', label: '250–999 staff' },
  { value: '1000+', label: '1,000+ staff' },
] as const;

export const CLEARANCE_KINDS = [
  { value: 'health_certificate', label: 'Health certificate' },
  { value: 'police_clearance', label: 'Police clearance certificate' },
] as const;

export const SCREENING_RESULTS = [
  { value: 'negative', label: 'Negative' },
  { value: 'positive', label: 'Positive' },
  { value: 'immune', label: 'Immune' },
  { value: 'vaccinated', label: 'Vaccinated' },
  { value: 'inconclusive', label: 'Inconclusive' },
  { value: 'not_tested', label: 'Not tested' },
] as const;

/* -------------------------------- wizard -------------------------------- */

export interface WizardStep {
  step: number;
  slug: string;
  title: string;
  blurb: string;
}

/**
 * Step 1 is the existing five-field signup plus the registrant-type choice,
 * and is NOT part of this list.
 *
 * The step sets differ by registrant type on purpose. An employer contact
 * must never be shown a passport field or a TB question — not merely because
 * it is irrelevant, but because asking for it would be collecting
 * special-category data with no lawful basis at all.
 */
const JOBSEEKER_STEPS: WizardStep[] = [
  { step: 2, slug: 'about-you', title: 'About you', blurb: 'A few details that identify you on official documents.' },
  { step: 3, slug: 'contact', title: 'How to reach you', blurb: 'The best ways to contact you about opportunities.' },
  { step: 4, slug: 'qualifications', title: 'Qualifications', blurb: 'What you have studied and any professional training.' },
  { step: 5, slug: 'experience', title: 'Work & languages', blurb: 'Where you have worked and which languages you speak.' },
  { step: 6, slug: 'references', title: 'References & documents', blurb: 'People who can vouch for you, and your CV.' },
  { step: 7, slug: 'clearances', title: 'Health & clearances', blurb: 'Only if you already hold these — every field is optional.' },
];

const EMPLOYER_STEPS: WizardStep[] = [
  { step: 2, slug: 'organisation', title: 'Your organisation', blurb: 'Who you are hiring on behalf of.' },
  { step: 3, slug: 'contact', title: 'How to reach you', blurb: 'The best ways to contact you.' },
  { step: 4, slug: 'hiring', title: 'What you are hiring for', blurb: 'Roles, volumes and destinations.' },
  { step: 5, slug: 'documents', title: 'Documents', blurb: 'Anything that helps us verify your organisation.' },
];

const GOVERNMENT_STEPS: WizardStep[] = [
  { step: 2, slug: 'organisation', title: 'Your ministry or agency', blurb: 'Which public body you represent.' },
  { step: 3, slug: 'contact', title: 'How to reach you', blurb: 'The best ways to contact you.' },
  { step: 4, slug: 'documents', title: 'Documents', blurb: 'Anything that helps us verify your role.' },
];

export function stepsFor(type: RegistrantType | undefined): WizardStep[] {
  if (type === 'employer') return EMPLOYER_STEPS;
  if (type === 'government') return GOVERNMENT_STEPS;
  return JOBSEEKER_STEPS; // jobseeker and 'other' share the fullest path
}

export function stepBySlug(slug: string, type?: RegistrantType) {
  return stepsFor(type).find((s) => s.slug === slug) ?? null;
}

/** First step of the wizard for a registrant type. */
export function firstStepSlug(type: RegistrantType | undefined): string {
  return stepsFor(type)[0]?.slug ?? 'about-you';
}

/* ------------------------------- uploads -------------------------------- */

/** Mirrors lib/cms/upload.ts. Shown to the user so limits are not a surprise. */
export const UPLOAD_HINTS = {
  profileImage: '500 KB max — JPEG, PNG or WebP',
  idImage: '1 MB max — a clear phone photo is fine',
  document: '1.5 MB max — PDF or photo',
} as const;
