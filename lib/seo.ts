import type { Metadata } from "next";
import { SITE } from "./site";

const DEFAULT_OG_IMAGE = "/images/inspire-healthcare-team.jpg";

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
  image?: string;
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
  const ogImage = new URL(image ?? DEFAULT_OG_IMAGE, SITE.url).toString();
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
      ...(type === "article" && (publishedTime || modifiedTime)
        ? { publishedTime, modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: new URL("/inspire-africa-logo.png", SITE.url).toString(),
    image: new URL(DEFAULT_OG_IMAGE, SITE.url).toString(),
    foundingLocation: SITE.company.address.country,
    sameAs: [SITE.social.linkedin, SITE.social.facebook],
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
        telephone: SITE.contact.ukPhone,
        email: SITE.contact.email,
        areaServed: "GB",
        availableLanguage: ["en"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: SITE.contact.africaPhone,
        areaServed: "Africa",
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
