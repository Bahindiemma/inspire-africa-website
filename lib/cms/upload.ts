/**
 * Server-only upload path for signup documents.
 *
 * NOTE: server-only — importing this from a "use client" file would leak
 * COMMUNITY_SIGNUP_TOKEN into the browser bundle.
 *
 * Everything here is validated SERVER-SIDE. The `accept` attribute and any
 * client-side size check are advisory: a determined caller posts whatever
 * they like, so the limits below are the real ones. Strapi's own ceiling
 * (2 MB, config/plugins.ts) is the backstop, not the control.
 *
 * Limits are deliberately small. This VPS disk is shared with several other
 * production applications, and a few thousand registrants uploading a CV, a
 * passport scan and a couple of certificates is tens of gigabytes.
 */
// Uploads go to our own /api/community/upload endpoint, NOT Strapi's core
// /api/upload. Core upload needs a Strapi API token with upload permission —
// a second credential to issue, rotate and leak. Routing through the custom
// endpoint keeps everything behind the one shared secret that already gates
// the signup writes, and lets the CMS enforce the same limits server-side.

/** Per-purpose limits, in bytes. Smaller than the Strapi ceiling on purpose. */
export const UPLOAD_LIMITS = {
  profileImage: 500 * 1024, //  500 KB — a headshot, not a photograph
  idImage: 1024 * 1024, //  1 MB   — a phone photo of a passport page
  document: 1536 * 1024, //  1.5 MB — a CV or a certificate PDF
} as const;

export type UploadPurpose = keyof typeof UPLOAD_LIMITS;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const DOC_TYPES = ["application/pdf", ...IMAGE_TYPES];

const ALLOWED: Record<UploadPurpose, string[]> = {
  profileImage: IMAGE_TYPES,
  idImage: IMAGE_TYPES,
  document: DOC_TYPES,
};

export type UploadResult =
  | { ok: true; id: number; name: string; size: number }
  | { ok: false; reason: "too_large" | "wrong_type" | "empty" | "unavailable"; message: string };

function human(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Validate then push a single file into Strapi's media library.
 * Returns the media id to attach to a component/entry.
 */
export async function uploadSignupFile(
  file: File,
  purpose: UploadPurpose
): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { ok: false, reason: "empty", message: "That file appears to be empty." };
  }

  const limit = UPLOAD_LIMITS[purpose];
  if (file.size > limit) {
    return {
      ok: false,
      reason: "too_large",
      message: `That file is ${human(file.size)}. Please upload something under ${human(limit)} — a phone photo or a compressed PDF is usually enough.`,
    };
  }

  // Trust the declared type only as a first filter; Strapi re-checks, and the
  // allowedTypes on each media field is the final gate.
  if (!ALLOWED[purpose].includes(file.type)) {
    return {
      ok: false,
      reason: "wrong_type",
      message:
        purpose === "document"
          ? "Please upload a PDF or a photo."
          : "Please upload a photo (JPEG, PNG or WebP).",
    };
  }

  const base = process.env.COMMUNITY_SIGNUP_URL || process.env.STRAPI_BASE_URL;
  const token = process.env.COMMUNITY_SIGNUP_TOKEN;
  if (!base || !token) {
    return { ok: false, reason: "unavailable", message: "Uploads are unavailable right now." };
  }

  const form = new FormData();
  form.append("files", file, file.name);
  form.append("purpose", purpose);

  try {
    const res = await fetch(`${base}/api/community/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(20000), // uploads are slower than JSON writes
    });
    if (!res.ok) {
      return { ok: false, reason: "unavailable", message: "We couldn't store that file just now." };
    }
    // /api/community/upload returns a single object; Strapi's core upload
    // returns an array. Accept both — assuming the array shape silently
    // treated every successful upload as a failure, which aborted the save
    // AND left the stored file orphaned on disk.
    const json = (await res.json()) as
      | { id: number; name: string; size: number }
      | Array<{ id: number; name: string; size: number }>;
    const first = Array.isArray(json) ? json[0] : json;
    if (!first || typeof first.id !== "number") {
      return { ok: false, reason: "unavailable", message: "We couldn't store that file just now." };
    }
    return { ok: true, id: first.id, name: first.name, size: first.size };
  } catch {
    return { ok: false, reason: "unavailable", message: "We couldn't store that file just now." };
  }
}
