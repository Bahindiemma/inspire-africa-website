/**
 * Strapi-backed equivalents of the SITE / NAV_LINKS / CORRIDORS
 * constants from lib/site.ts. The legacy file is kept as a fallback —
 * if `STRAPI_BASE_URL` is unset (e.g. during a local prototype with
 * the CMS offline) the call sites still get usable data.
 *
 * Each fetcher is cached for 5 minutes (`revalidate: 300`) and tagged
 * so the CMS revalidation webhook can purge by tag.
 */
import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';
import { strapiMedia } from '@/lib/cms/media';
import { SITE as STATIC_SITE, NAV_LINKS as STATIC_NAV } from '@/lib/site';
import type { BrandLogo } from '@/components/ui/Brand';

/**
 * Resolve the header/footer logo from CMS site-settings into the shape the
 * `Brand` component expects (absolute URL + natural dimensions), or null
 * when the CMS has no logo — in which case Brand renders a text wordmark.
 * The site ships no bundled logo file.
 */
export function brandLogoFrom(settings: SiteSettings): BrandLogo | null {
  const src = strapiMedia(settings.logo?.url);
  if (!src || !settings.logo?.width || !settings.logo?.height) return null;
  return {
    src,
    width: settings.logo.width,
    height: settings.logo.height,
    alt: settings.logo.alternativeText ?? `${settings.name}`,
  };
}

export interface SiteSettings {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  baseUrl: string;
  locale: string;
  companyNumber: string;
  companyAddress: {
    label?: string;
    street: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  contactUkPhone: string;
  contactAfricaPhone: string;
  contactEmail: string;
  contactLegalEmail: string;
  contactSpeakupEmail: string;
  socialLinks: Array<{
    platform: string;
    label: string;
    url: string;
    handle?: string;
    iconKey?: string;
    order?: number;
  }>;
  communityBaseUrl: string;
  logo?: { url: string; alternativeText?: string; width?: number; height?: number };
  favicon?: { url: string };
  defaultOgImage?: { url: string };
}

export interface NavLinkCms {
  label: string;
  href: string;
  isExternal?: boolean;
  isCta?: boolean;
  order?: number;
  ariaLabel?: string;
}

export interface NavigationCms {
  headerLinks: NavLinkCms[];
  footerColumns: Array<{
    heading: string;
    links: NavLinkCms[];
    order?: number;
  }>;
  legalLinks: NavLinkCms[];
}

/** Falls back to the in-repo SITE constant if Strapi is unreachable. */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isStrapiAvailable()) return fromStatic();
  try {
    const { data } = await strapiFetch<SiteSettings>('/site-setting?populate=*', {
      revalidate: 300,
      tags: ['site-setting'],
    });
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[getSiteSettings] CMS unreachable, falling back:', (err as Error).message);
    }
    return fromStatic();
  }
}

export async function getNavigation(): Promise<NavigationCms> {
  if (!isStrapiAvailable()) return navFromStatic();
  try {
    const { data } = await strapiFetch<NavigationCms>(
      '/navigation?populate[headerLinks]=true&populate[footerColumns][populate]=links&populate[legalLinks]=true',
      { revalidate: 300, tags: ['navigation'] }
    );
    return data;
  } catch {
    return navFromStatic();
  }
}

// ---------- fallbacks ----------
function fromStatic(): SiteSettings {
  return {
    name: STATIC_SITE.name,
    legalName: STATIC_SITE.legalName,
    tagline: STATIC_SITE.tagline,
    description: STATIC_SITE.description,
    baseUrl: STATIC_SITE.url,
    locale: STATIC_SITE.locale,
    companyNumber: STATIC_SITE.company.number,
    companyAddress: {
      label: 'UK · Registered Office',
      street: STATIC_SITE.company.address.street,
      city: STATIC_SITE.company.address.city,
      postalCode: STATIC_SITE.company.address.postalCode,
      country: STATIC_SITE.company.address.country,
    },
    contactUkPhone: STATIC_SITE.contact.ukPhone,
    contactAfricaPhone: STATIC_SITE.contact.africaPhone,
    contactEmail: STATIC_SITE.contact.email,
    contactLegalEmail: STATIC_SITE.contact.legalEmail,
    contactSpeakupEmail: STATIC_SITE.contact.speakupEmail,
    socialLinks: [
      { platform: 'linkedin', label: 'LinkedIn', url: STATIC_SITE.social.linkedin, iconKey: 'linkedin', order: 1 },
      { platform: 'facebook', label: 'Facebook', url: STATIC_SITE.social.facebook, iconKey: 'facebook', order: 2 },
      // Stored as 'twitter' (CMS enum predates the X rename); footer maps both keys.
      { platform: 'twitter', label: 'X (Twitter)', url: STATIC_SITE.social.x, iconKey: 'x', order: 3 },
      { platform: 'instagram', label: 'Instagram', url: STATIC_SITE.social.instagram, iconKey: 'instagram', order: 4 },
      { platform: 'tiktok', label: 'TikTok', url: STATIC_SITE.social.tiktok, iconKey: 'tiktok', order: 5 },
      { platform: 'youtube', label: 'YouTube', url: STATIC_SITE.social.youtube, iconKey: 'youtube', order: 6 },
      {
        platform: 'whatsapp',
        label: 'WhatsApp Business',
        url: `https://wa.me/${STATIC_SITE.contact.africaPhone.replace(/\D+/g, '')}`,
        iconKey: 'whatsapp',
        order: 7,
      },
    ],
    communityBaseUrl: STATIC_SITE.community.baseUrl,
  };
}

function navFromStatic(): NavigationCms {
  return {
    headerLinks: STATIC_NAV.map((l, i) => ({
      label: l.label,
      href: l.href,
      isCta: l.cta,
      order: i + 1,
    })),
    footerColumns: [],
    legalLinks: [
      { label: 'Privacy', href: '/privacy', order: 1 },
      { label: 'Cookies', href: '/cookies', order: 2 },
      { label: 'Terms', href: '/terms', order: 3 },
      { label: 'Modern Slavery', href: '/modern-slavery', order: 4 },
    ],
  };
}
