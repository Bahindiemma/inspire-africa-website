/**
 * CMS-aware variant of joinUrl() — reads the Mighty Networks
 * community URL from Strapi Site Settings (editors can change it
 * without a code deploy), falls back to the legacy lib/utm constant.
 *
 * Use this in async server components:
 *   const href = await getJoinUrl({ source: 'workers_hero' });
 *
 * Or, if you've already loaded site settings, use the cheap sync
 * variant that takes the base URL as a parameter:
 *   buildJoinUrl(settings.communityBaseUrl, { source: 'workers_hero' });
 */
import { getSiteSettings } from './site-settings';
import { joinUrl as staticJoinUrl, type JoinLinkOptions } from '@/lib/utm';

export interface JoinUrlOptions extends JoinLinkOptions {}

export function buildJoinUrl(
  baseUrl: string | null | undefined,
  { source, medium = 'website', campaign = 'join_community' }: JoinUrlOptions
): string {
  if (!baseUrl) return staticJoinUrl({ source, medium, campaign });
  const url = new URL(baseUrl);
  url.searchParams.set('autojoin', '1');
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

export async function getJoinUrl(opts: JoinUrlOptions): Promise<string> {
  try {
    const settings = await getSiteSettings();
    return buildJoinUrl(settings.communityBaseUrl, opts);
  } catch {
    return staticJoinUrl(opts);
  }
}
