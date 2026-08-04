"use server";

/**
 * Server Action for the profile wizard (signup steps 2+).
 *
 * Server Action rather than a fetch handler for the same reason step 1 is:
 * the form must submit and redirect correctly with JavaScript disabled —
 * including file uploads, which Server Actions accept as multipart FormData.
 *
 * Everything here is ADDITIVE. Step 1 already wrote a `Submitted` lead, so
 * an abandoned wizard costs us profile depth, never the lead itself.
 *
 * Steps are keyed on SLUG, not step number: the three registrant branches
 * have different step counts, and an employer's step 4 is not a jobseeker's.
 */
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveProfileStep } from "@/lib/cms/profile";
import { uploadSignupFile, type UploadPurpose } from "@/lib/cms/upload";
import {
  stepsFor,
  REGISTRANT_TYPES,
  type ProfilePayload,
  type RegistrantType,
} from "@/lib/profile-shape";

export interface ProfileState {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedStep?: number;
  completeness?: number;
}

const RESUME_COOKIE = "ia_profile_resume";

function s(data: FormData, key: string, max = 200): string {
  const v = data.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Collect indexed repeatable rows: `qualifications[0][title]` etc. */
function rows(data: FormData, prefix: string): Record<string, string>[] {
  const byIndex = new Map<number, Record<string, string>>();
  for (const [k, v] of data.entries()) {
    const m = k.match(new RegExp(`^${prefix}\\[(\\d+)\\]\\[(\\w+)\\]$`));
    if (!m || typeof v !== "string") continue;
    const [, idx, field] = m;
    if (idx === undefined || field === undefined) continue;
    const i = Number(idx);
    if (!byIndex.has(i)) byIndex.set(i, {});
    byIndex.get(i)![field] = v.trim().slice(0, 2000);
  }
  return [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}

/** Flat `organisation[name]` style group. */
function group(data: FormData, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of data.entries()) {
    const m = k.match(new RegExp(`^${prefix}\\[(\\w+)\\]$`));
    if (!m || typeof v !== "string") continue;
    const field = m[1];
    if (field === undefined) continue;
    out[field] = v.trim().slice(0, 2000);
  }
  return out;
}

/** Drop rows the visitor left completely blank rather than storing empties. */
function nonEmpty(list: Record<string, string>[], required: string[]): Record<string, string>[] {
  return list.filter((r) => required.every((f) => r[f]));
}

/**
 * Upload one file field if the visitor actually chose a file. Returns the
 * media id, or an error message to surface. Size and type are validated
 * server-side — the `accept` attribute is advisory only.
 */
async function fileField(
  data: FormData,
  key: string,
  purpose: UploadPurpose,
  uploadErrors: string[]
): Promise<number | undefined> {
  const f = data.get(key);
  if (!(f instanceof File) || f.size === 0) return undefined;
  const res = await uploadSignupFile(f, purpose);
  if (!res.ok) {
    // Collected into a flat list, NOT into fieldErrors: no step renders an
    // inline message next to a file input, so a keyed error would vanish and
    // the visitor would see the form reset with no explanation at all.
    uploadErrors.push(res.message);
    return undefined;
  }
  return res.id;
}

export async function saveProfile(
  _prev: ProfileState,
  data: FormData
): Promise<ProfileState> {
  const step = Math.min(9, Math.max(2, Number(s(data, "step")) || 2));
  const slug = s(data, "slug", 64);
  const rawType = s(data, "registrantType", 32);
  const registrantType: RegistrantType = (REGISTRANT_TYPES.some((r) => r.value === rawType)
    ? rawType
    : "jobseeker") as RegistrantType;

  const clickId = s(data, "clickId", 64);
  const jar = await cookies();
  const resumeToken = s(data, "resumeToken", 64) || jar.get(RESUME_COOKIE)?.value || "";

  if (!clickId && !resumeToken) {
    return { error: "We couldn't find your signup. Please start again from the join page." };
  }

  const payload: ProfilePayload = { step };
  if (resumeToken) payload.resumeToken = resumeToken;
  if (clickId) payload.clickId = clickId;

  const fieldErrors: Record<string, string> = {};
  const uploadErrors: string[] = [];

  /* ------------------------------ identity ------------------------------ */
  if (slug === "about-you") {
    payload.otherNames = s(data, "otherNames", 120) || null;
    const dob = s(data, "dateOfBirth", 10);
    if (dob) {
      // A typo'd birth year is worse than a blank one — it silently drives
      // eligibility decisions later.
      const t = Date.parse(dob);
      const age = Number.isFinite(t) ? (Date.now() - t) / (365.25 * 24 * 3600 * 1000) : NaN;
      if (!Number.isFinite(age) || age < 16 || age > 100) {
        fieldErrors.dateOfBirth = "Please enter a valid date of birth.";
      } else {
        payload.dateOfBirth = dob;
      }
    }

    const img = await fileField(data, "profileImage", "profileImage", uploadErrors);
    if (img) payload.profileImage = img;

    const ids = nonEmpty(rows(data, "identityDocuments"), ["kind", "number"]);
    if (ids.length) {
      // Attach each row's document photo, if one was chosen.
      for (let i = 0; i < ids.length; i++) {
        const up = await fileField(data, `identityDocuments[${i}][documentImage]`, "idImage", uploadErrors);
        if (up) ids[i]!.documentImage = String(up);
      }
      payload.identityDocuments = ids as never;
    }
  }

  /* ------------------------ employer / government ------------------------ */
  if (slug === "organisation") {
    const org = group(data, "organisation");
    if (org.name) payload.organisation = org as never;
  }

  if (slug === "hiring") {
    const needs = nonEmpty(rows(data, "hiringNeeds"), ["roleTitle"]);
    if (needs.length) payload.hiringNeeds = needs as never;
  }

  /* ------------------------------- contact ------------------------------- */
  if (slug === "contact") {
    payload.residentialAddress = s(data, "residentialAddress", 2000) || null;
    const cps = nonEmpty(rows(data, "contactPoints"), ["kind", "value"]);
    if (cps.length) payload.contactPoints = cps as never;
  }

  /* ---------------------------- qualifications --------------------------- */
  if (slug === "qualifications") {
    const qs = nonEmpty(rows(data, "qualifications"), ["kind", "title"]);
    if (qs.length) {
      for (let i = 0; i < qs.length; i++) {
        const up = await fileField(data, `qualifications[${i}][certificateFile]`, "document", uploadErrors);
        if (up) qs[i]!.certificateFile = String(up);
      }
      payload.qualifications = qs as never;
    }
  }

  /* ------------------------- experience + languages ---------------------- */
  if (slug === "experience") {
    const we = nonEmpty(rows(data, "workExperiences"), ["employerName", "jobTitle"]);
    if (we.length) payload.workExperiences = we as never;
    const lc = nonEmpty(rows(data, "languageCompetencies"), ["languageCode"]);
    if (lc.length) payload.languageCompetencies = lc as never;
  }

  /* ------------------------ references / documents ----------------------- */
  if (slug === "references" || slug === "documents") {
    const cv = await fileField(data, "cvFile", "document", uploadErrors);
    if (cv) payload.cvFile = cv;
    const img = await fileField(data, "profileImage", "profileImage", uploadErrors);
    if (img) payload.profileImage = img;

    const refs = nonEmpty(rows(data, "characterReferences"), ["name"]);
    if (refs.length) payload.characterReferences = refs as never;
  }

  /* ---------------------- health / clearances (Art. 9) ------------------- */
  if (slug === "clearances") {
    const consent = data.get("consentSpecialCategory") != null;
    const clearances = nonEmpty(rows(data, "healthClearances"), ["kind"]);
    const screenings = nonEmpty(rows(data, "diseaseScreenings"), ["disease"]);

    // If they entered sensitive data without ticking explicit consent, do NOT
    // silently store it and do NOT silently discard it — tell them, so they
    // can decide. Storing it would be unlawful; dropping it without a word
    // would look like the form lost their work.
    if (!consent && (clearances.length || screenings.length)) {
      fieldErrors.consentSpecialCategory =
        "Please tick the consent box above before we can store health or clearance details — or clear those fields and continue.";
      return { fieldErrors };
    }
    if (consent) {
      payload.consentSpecialCategory = true;
      if (clearances.length) payload.healthClearances = clearances as never;
      if (screenings.length) payload.diseaseScreenings = screenings as never;
    }
  }

  // A rejected file must never be silent — the visitor waited for the upload.
  if (uploadErrors.length) {
    return { error: uploadErrors.join(" "), fieldErrors };
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const h = await headers();
  const result = await saveProfileStep(payload, {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  });

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      return { error: "Too many saves from your connection. Please wait a minute and try again." };
    }
    if (result.reason === "not_found" || result.reason === "expired") {
      return { error: "Your session has expired. Please start again from the join page." };
    }
    return {
      error:
        "We couldn't save that just now. Your community membership is unaffected — please try again shortly.",
    };
  }

  jar.set(RESUME_COOKIE, result.resumeToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/join/profile",
    maxAge: 30 * 24 * 60 * 60,
  });

  const steps = stepsFor(registrantType);
  const idx = steps.findIndex((x) => x.slug === slug);
  const next = idx >= 0 ? steps[idx + 1] : undefined;

  // redirect() throws NEXT_REDIRECT by design — keep it outside try/catch.
  redirect(
    next
      ? `/join/profile/${next.slug}?as=${registrantType}${clickId ? `&clickId=${encodeURIComponent(clickId)}` : ""}`
      : "/join/profile/done"
  );
}
