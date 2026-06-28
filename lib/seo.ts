import type { Metadata } from "next";
import { SITE } from "./site";

// The site ships NO static images — the default share/OG image and the
// brand logo are served from the Strapi Media Library. `app/layout.tsx`
// reads them live from the CMS for the global default; sync call sites
// (per-page `buildMetadata`, JSON-LD) read the absolute CMS URLs from
// these public env vars (point them at the CMS Media Library URLs).
// When unset, the image is simply omitted — never a bundled fallback.
const DEFAULT_OG_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE ?? "";
const BRAND_LOGO_URL = process.env.NEXT_PUBLIC_BRAND_LOGO_URL ?? "";

/** Niche keywords reused as the default for every page. */
export const SITE_KEYWORDS = [
  "labour mobility",
  "ethical recruitment",
  "African workers",
  "skilled migration",
  "healthcare recruitment Africa",
  "international recruitment agency",
  "governed migration pathways",
  "migration finance",
  "diaspora employment",
  "UK care sector recruitment",
  "workforce mobility infrastructure",
  "Earn-Learn-Return",
  "INSPIRE AFRICA",
];

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  /** Absolute CMS Media Library URL, or null/undefined to use the
   *  env-configured default (NEXT_PUBLIC_DEFAULT_OG_IMAGE). */
  image?: string | null;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageSeoInput): Metadata {
  const url = new URL(path, SITE.url).toString();
  // Absolute CMS image, env default, or none — never a bundled file.
  const rawOg = image || DEFAULT_OG_IMAGE;
  const ogImage = rawOg ? new URL(rawOg, SITE.url).toString() : null;
  const fullTitle = title.includes(SITE.name) ? title : `${title} — ${SITE.name}`;

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description,
    keywords: keywords ?? SITE_KEYWORDS,
    applicationName: SITE.name,
    authors: [{ name: SITE.legalName, url: SITE.url }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    category: "business",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      locale: SITE.locale,
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }] }
        : {}),
      ...(type === "article" && (publishedTime || modifiedTime)
        ? { publishedTime, modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Organization JSON-LD. `logo`/`image` are served from the CMS — pass the
 * resolved absolute Media Library URLs from a server component (layout
 * reads them via getSiteSettings). When not provided, falls back to the
 * env-configured URLs, and the field is omitted entirely if still empty
 * (no static /public asset is ever referenced).
 */
export function organizationJsonLd(opts?: { logoUrl?: string | null; imageUrl?: string | null }) {
  const logoUrl = opts?.logoUrl || BRAND_LOGO_URL;
  const imageUrl = opts?.imageUrl || DEFAULT_OG_IMAGE;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.url,
    description: SITE.description,
    ...(logoUrl ? { logo: new URL(logoUrl, SITE.url).toString() } : {}),
    ...(imageUrl ? { image: new URL(imageUrl, SITE.url).toString() } : {}),
    foundingLocation: SITE.company.address.country,
    sameAs: [
      SITE.social.linkedin,
      SITE.social.facebook,
      SITE.social.x,
      SITE.social.instagram,
      SITE.social.tiktok,
      SITE.social.youtube,
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.company.address.street,
      addressLocality: SITE.company.address.city,
      postalCode: SITE.company.address.postalCode,
      addressCountry: SITE.company.address.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: SITE.contact.email,
        telephone: SITE.contact.africaPhone,
        availableLanguage: ["en"],
      },
      {
        "@type": "ContactPoint",
        contactType: "WhatsApp",
        telephone: SITE.contact.africaPhone,
        availableLanguage: ["en"],
      },
    ],
  } as const;
}

/** WebSite schema — enables richer Google branding / sitelinks. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: SITE.legalName,
      url: SITE.url,
    },
  } as const;
}
