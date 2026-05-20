import type { Metadata } from "next";
import { SITE } from "./site";

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function buildMetadata({ title, description, path, image }: PageSeoInput): Metadata {
  const url = new URL(path, SITE.url).toString();
  const ogImage = image ?? "/images/inspire-healthcare-team.jpg";
  const fullTitle = title.includes(SITE.name) ? title : `${title} — ${SITE.name}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      locale: SITE.locale,
      images: [{ url: new URL(ogImage, SITE.url).toString(), width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [new URL(ogImage, SITE.url).toString()],
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
    logo: new URL("/images/inspire-healthcare-team.jpg", SITE.url).toString(),
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
