import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { SITE } from "@/lib/site";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { getSiteSettings, brandLogoFrom } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";

// Inline brand glyphs (24px viewBox) — keeps icon weight tiny vs. importing a
// separate icon library. `currentColor` so they inherit the footer-social
// hover state styles.
const SOCIAL_ICONS: Record<string, React.ReactElement> = {
  linkedin: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24h11.494v-9.294H9.691v-3.622h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.241l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  // Strapi schema's social-link enum predates the X rename; accept the legacy
  // platform key as an alias so DB rows with platform='twitter' render the X glyph.
  twitter: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.83a8.16 8.16 0 0 0 4.77 1.52V6.9a4.85 4.85 0 0 1-1.84-.21z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
    </svg>
  ),
  // WhatsApp is intentionally NOT a social icon — it's surfaced as a
  // contact line in the footer Contact block instead. With no glyph here,
  // the socials filter below drops any whatsapp socialLink automatically.
};

const audienceLinks = [
  { href: "/workers", label: "For Workers" },
  { href: "/employers", label: "For Employers" },
  { href: "/governments", label: "For Governments" },
  { href: "/join", label: "Join the Community" },
];
const platformLinks = [
  { href: "/approach", label: "Our Approach" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy & Cookies" },
  { href: "/modern-slavery", label: "Modern Slavery" },
];
const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Terms" },
  { href: "/modern-slavery", label: "Modern Slavery" },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();
  // Order: keep CMS-provided `order` if present, else fall back to insertion
  // order. Drop entries we don't have an icon for so we don't render a blank tile.
  const socials = [...settings.socialLinks]
    .filter((s) => s.url && s.url !== "#" && SOCIAL_ICONS[s.platform])
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand onDark height={48} logo={brandLogoFrom(settings)} />
            <p>
              Labour mobility infrastructure connecting Africa&apos;s workforce to global employers and governments —
              through governed pathways, predictive screening and migration finance.
            </p>
            <a className="footer-cta" href={buildJoinUrl(settings.communityBaseUrl, { source: "footer" })}>
              Join the Community
              <ArrowIcon />
            </a>
          </div>
          <div className="footer-col">
            <h4>Audiences</h4>
            <ul>
              {audienceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>The Platform</h4>
            <ul>
              {platformLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact">
              <div className="office">
                <strong>UK · Registered Office</strong>
                {settings.companyAddress.street}
                <br />
                {settings.companyAddress.city}, {settings.companyAddress.postalCode}
                <br />
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                <br />
                <a
                  href={`https://wa.me/${settings.contactAfricaPhone.replace(/\D+/g, "")}`}
                  target="_blank"
                  rel="noopener"
                >
                  {settings.contactAfricaPhone}
                </a>
                <br />
                <small style={{ opacity: 0.75 }}>WhatsApp only · no calls</small>
              </div>
            </div>
            <div className="footer-socials">
              {socials.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  className="footer-social"
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            © {year} {settings.legalName}. Registered in England and Wales (company no. {settings.companyNumber}).
          </div>
          <div className="footer-legal">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <CookieSettingsLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
