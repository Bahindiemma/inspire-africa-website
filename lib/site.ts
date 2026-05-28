export const SITE = {
  name: "INSPIRE AFRICA",
  legalName: "Inspire Africa Platform Ltd",
  tagline: "Labour mobility infrastructure",
  description:
    "INSPIRE AFRICA connects skilled African workers, employers and governments through governed migration pathways, predictive screening and migration finance.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://inspireafricans.com",
  locale: "en_GB",
  company: {
    number: "12759109",
    address: {
      street: "71–75 Shelton Street",
      city: "London",
      postalCode: "WC2H 9JQ",
      country: "United Kingdom",
    },
  },
  contact: {
    // The single UK · Registered Office card displays two phones:
    //   ukPhone     → London landline (callable, normal tel: link)
    //   africaPhone → WhatsApp Business number (wa.me link, "WhatsApp only · no calls")
    // The schema names are historical; `africaPhone` was repurposed as the
    // WhatsApp number when the Africa Regional Office card was retired.
    // Live values come from the Strapi `site-setting` single type.
    ukPhone: "+44 20 7097 3943",
    africaPhone: "+256 750 329 751",
    email: "info@inspireafricans.com",
    legalEmail: "legal@inspireafrica.onmicrosoft.com",
    speakupEmail: "speakup@inspireafrica.onmicrosoft.com",
  },
  social: {
    // Placeholder handles for X, Instagram and TikTok — confirm + update once
    // accounts are claimed. WhatsApp Business uses the UK contact number's
    // wa.me link (built dynamically in the footer).
    linkedin: "https://uk.linkedin.com/company/inspire-africans",
    facebook: "https://www.facebook.com/INSPIREAFRICAN",
    x: "https://x.com/inspireafricans",
    instagram: "https://www.instagram.com/inspireafricans",
    tiktok: "https://www.tiktok.com/@inspireafricans",
  },
  community: {
    baseUrl: "https://inspire-africa.mn.co/spaces/20105635",
  },
} as const;

export interface NavLink {
  href: string;
  label: string;
  cta?: boolean;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/approach", label: "Our Approach" },
  { href: "/workers", label: "Workers" },
  { href: "/employers", label: "Employers" },
  { href: "/governments", label: "Governments" },
  { href: "/join", label: "Join the Community", cta: true },
  { href: "/contact", label: "Contact" },
];

export const CORRIDORS = [
  "UK",
  "EU",
  "USA",
  "Canada",
  "Australia",
  "Saudi Arabia",
] as const;

export const CORRIDOR_SECTORS: ReadonlyArray<{ country: string; sectors: string }> = [
  { country: "UK", sectors: "Healthcare · Care" },
  { country: "EU", sectors: "Hospitality · Manufacturing" },
  { country: "USA", sectors: "Tech · Hospitality" },
  { country: "Canada", sectors: "Care · Construction" },
  { country: "Australia", sectors: "Care · Mining" },
  { country: "Saudi Arabia", sectors: "Construction · Care" },
];
