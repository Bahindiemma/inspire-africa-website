import { SITE } from "./site";

export interface JoinLinkOptions {
  source: string;
  medium?: string;
  campaign?: string;
}

/**
 * Internal URL for the signup gate at /join/start.
 *
 * This is what every "Join the Community" CTA points at. The gate records
 * the click server-side (consent-independent, no JS required), collects
 * name / email / phone, then performs the Mighty Networks handoff itself
 * via joinUrl()/buildJoinUrl() — so the outbound URL, its `autojoin` flag
 * and its UTM tags are unchanged from Mighty Networks' point of view.
 *
 * Lives HERE rather than in lib/cms/utm.ts on purpose: it needs no site
 * settings, and MobileNav is a client component. Importing the CMS module
 * into a client bundle would pull in lib/strapi and its server-only env.
 */
export function buildJoinGateUrl({
  source,
  medium = "website",
  campaign = "join_community",
}: JoinLinkOptions): string {
  const qs = new URLSearchParams({
    source,
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  return `/join/start?${qs.toString()}`;
}

export function joinUrl({ source, medium = "website", campaign = "join_community" }: JoinLinkOptions): string {
  const url = new URL(SITE.community.baseUrl);
  url.searchParams.set("autojoin", "1");
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
