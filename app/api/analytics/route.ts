/**
 * Server-side analytics ingest proxy.
 *
 * The browser POSTs batches here (same-origin). We:
 *   1. Enforce same-origin (block cross-site abuse of the proxy).
 *   2. Cap the body size.
 *   3. Forward to the CMS collect endpoint with the shared secret in the
 *      Authorization header (the browser never sees it) and pass the
 *      visitor's IP + UA so the CMS can derive coarse geo / device.
 * Always returns 204 — analytics must never surface errors to visitors.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const url = process.env.ANALYTICS_INGEST_URL;
  const token = process.env.ANALYTICS_INGEST_TOKEN;
  // If analytics isn't configured in this environment, silently no-op.
  if (!url || !token) return noContent();

  // Same-origin guard.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return new NextResponse(null, { status: 403 });
      }
    } catch {
      return new NextResponse(null, { status: 403 });
    }
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return noContent();
  }
  if (!body || body.length > MAX_BODY_BYTES) return noContent();

  const xff =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "";
  const ua = req.headers.get("user-agent") || "";

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(xff ? { "x-forwarded-for": xff } : {}),
        "user-agent": ua,
      },
      body,
      // Don't let a slow CMS hold the request open.
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* swallow — never fail the beacon */
  }

  return noContent();
}
