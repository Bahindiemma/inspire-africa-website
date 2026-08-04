"use server";

/**
 * Server Action for the profile wizard (signup steps 2+).
 *
 * Server Action rather than a fetch handler for the same reason step 1 is:
 * the form must submit and redirect correctly with JavaScript disabled.
 *
 * Everything here is ADDITIVE. Step 1 already wrote a `Submitted` lead, so
 * an abandoned wizard costs us profile depth, never the lead itself. That is
 * why each step saves on completion instead of one submit at the end.
 */
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveProfileStep } from "@/lib/cms/profile";
import { PROFILE_STEPS, type ProfilePayload } from "@/lib/profile-shape";

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

/** Drop rows the visitor left completely blank rather than storing empties. */
function nonEmpty(list: Record<string, string>[], required: string[]): Record<string, string>[] {
  return list.filter((r) => required.every((f) => r[f]));
}

export async function saveProfile(
  _prev: ProfileState,
  data: FormData
): Promise<ProfileState> {
  const step = Math.min(6, Math.max(2, Number(s(data, "step")) || 2));
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

  if (step === 2) {
    payload.otherNames = s(data, "otherNames", 120) || null;
    const dob = s(data, "dateOfBirth", 10);
    if (dob) {
      // Reject impossible dates early — a typo'd birth year is worse than a
      // blank one, because it silently drives eligibility decisions later.
      const t = Date.parse(dob);
      const age = Number.isFinite(t) ? (Date.now() - t) / (365.25 * 24 * 3600 * 1000) : NaN;
      if (!Number.isFinite(age) || age < 16 || age > 100) {
        fieldErrors.dateOfBirth = "Please enter a valid date of birth.";
      } else {
        payload.dateOfBirth = dob;
      }
    }
    const ids = nonEmpty(rows(data, "identityDocuments"), ["kind", "number"]);
    if (ids.length) payload.identityDocuments = ids as never;
  }

  if (step === 3) {
    payload.residentialAddress = s(data, "residentialAddress", 2000) || null;
    const cps = nonEmpty(rows(data, "contactPoints"), ["kind", "value"]);
    if (cps.length) payload.contactPoints = cps as never;
  }

  if (step === 4) {
    const qs = nonEmpty(rows(data, "qualifications"), ["kind", "title"]);
    if (qs.length) payload.qualifications = qs as never;
  }

  if (step === 5) {
    const we = nonEmpty(rows(data, "workExperiences"), ["employerName", "jobTitle"]);
    if (we.length) payload.workExperiences = we as never;
    const lc = nonEmpty(rows(data, "languageCompetencies"), ["languageCode"]);
    if (lc.length) payload.languageCompetencies = lc as never;
  }

  if (step === 6) {
    const refs = nonEmpty(rows(data, "characterReferences"), ["name"]);
    if (refs.length) payload.characterReferences = refs as never;
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
    // `unavailable` — the CMS is down. Say so honestly rather than pretending
    // it saved; the visitor has typed real work into this form.
    return {
      error: "We couldn't save that just now. Your community membership is unaffected — please try again shortly.",
    };
  }

  // 30 days, matching the CMS token lifetime.
  jar.set(RESUME_COOKIE, result.resumeToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/join/profile",
    maxAge: 30 * 24 * 60 * 60,
  });

  const next = PROFILE_STEPS.find((sx) => sx.step === step + 1);
  // redirect() throws NEXT_REDIRECT by design — keep it outside try/catch.
  redirect(next ? `/join/profile/${next.slug}` : "/join/profile/done");
}
