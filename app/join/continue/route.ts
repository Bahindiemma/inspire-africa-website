/**
 * Retired: the Mighty Networks hand-off.
 *
 * This route used to send a confirmed visitor on to the community and record
 * the hand-off. Joining now ends in INSPIRE AFRICA Readiness, which the
 * register invites workers into by email, so there is no community URL to send
 * anyone to and nothing to mark as redirected.
 *
 * The route stays (rather than 404ing) because old links exist in inboxes,
 * bookmarks and the profile wizard; they land on the join form, where a worker
 * gets a fresh link. It no longer reads the community base URL from the CMS,
 * calls markRedirected, or emits any Mighty Networks URL.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const target = new URL("/join/start?source=continue_retired", req.nextUrl);
  return NextResponse.redirect(target, { status: 303 });
}
