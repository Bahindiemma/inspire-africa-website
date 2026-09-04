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

/* ────────────────────────────────────────────────────────────────────────
 * The invariant: nobody reaches Mighty Networks except through /join/start.
 *
 * Every CTA written in TSX already calls buildJoinGateUrl(). CMS-authored
 * hrefs are the hole — DynamicZoneRenderer and the header nav render editor
 * strings verbatim, so one pasted Mighty Networks link re-breaks the funnel
 * with no deploy and no review. That is exactly what happened: on 2026-09-04
 * the homepage and /join hero + final CTAs pointed straight at
 * `inspire-africa.mn.co/sign_up?...&space_id=20105633`, bypassing signup.
 *
 * So every href that comes from outside the codebase passes through here.
 * `app/join/continue/route.ts` is the ONE place allowed to emit an mn.co URL.
 * ──────────────────────────────────────────────────────────────────────── */

/** Hosts that mean "the community". Matched on hostname, never substring. */
const COMMUNITY_HOSTS = [/(^|\.)mn\.co$/i, /(^|\.)mightynetworks\.com$/i];

/**
 * Base used only to resolve relative hrefs while parsing. Never emitted, so
 * it does not need to match the real origin.
 */
const PARSE_BASE = "https://inspireafricans.com";

/** Does this href send the visitor to Mighty Networks? */
export function isCommunityHref(href: string): boolean {
  try {
    const { hostname } = new URL(href, PARSE_BASE);
    return COMMUNITY_HOSTS.some((re) => re.test(hostname));
  } catch {
    // An href we cannot parse is an href we cannot vouch for.
    return true;
  }
}

/** Is this already a link to the signup gate? Used to force prefetch={false}. */
export function isJoinGateHref(href: string): boolean {
  return href.startsWith("/join/start");
}

/** `/join` and `/join/` — our own community landing page, not the gate. */
function isJoinLandingHref(href: string): boolean {
  try {
    const { pathname } = new URL(href, PARSE_BASE);
    return pathname === "/join" || pathname === "/join/";
  } catch {
    return false;
  }
}

/**
 * For links (nav items, secondary text links): rewrite only outbound
 * community links. `/join` is left alone so the community landing page
 * stays reachable from the menu and the footer.
 */
export function normalizeJoinHref(href: string | null | undefined, opts: JoinLinkOptions): string {
  if (!href) return buildJoinGateUrl(opts);
  return isCommunityHref(href) ? buildJoinGateUrl(opts) : href;
}

/**
 * For buttons ("Join the Community", "Join — It's Free"): rewrite community
 * links AND `/join`. A button that says join must open the signup form, not
 * a page describing it — and on /join itself, `/join` was a link to nowhere.
 */
export function normalizeJoinCtaHref(href: string | null | undefined, opts: JoinLinkOptions): string {
  if (!href) return buildJoinGateUrl(opts);
  return isCommunityHref(href) || isJoinLandingHref(href) ? buildJoinGateUrl(opts) : href;
}
