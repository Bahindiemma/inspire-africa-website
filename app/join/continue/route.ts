/**
 * The community handoff.
 *
 * Every "go to the community" link in the profile wizard points here rather
 * than straight at Mighty Networks, so that `RedirectedToMN` means what it
 * says. Step 1 used to mark the handoff immediately, which overstated the
 * metric for everyone who went into the wizard and never clicked through.
 *
 * Fails open: if we cannot identify or record the visitor for any reason,
 * they are still sent to the community. Losing a status update must never
 * cost someone their membership.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";
import { markRedirected } from "@/lib/cms/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESUME_COOKIE = "ia_profile_resume";

export async function GET(req: NextRequest) {
  const source = (req.nextUrl.searchParams.get("source") || "profile_continue").slice(0, 128);
  const clickId = req.nextUrl.searchParams.get("clickId");

  const settings = await getSiteSettings().catch(() => null);
  const target = buildJoinUrl(settings?.communityBaseUrl, { source });

  // Only clickId can identify the row for markRedirected(); the resume token
  // is a different key. When we only have the cookie we still hand off — the
  // profile row is already captured, and an unset status is a smaller problem
  // than blocking the visitor.
  if (clickId) {
    await markRedirected(clickId, {
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      ua: req.headers.get("user-agent"),
    }).catch(() => {});
  } else if (!req.cookies.get(RESUME_COOKIE)) {
    // No identity at all — nothing to record, but still send them through.
  }

  return NextResponse.redirect(target, { status: 303 });
}
