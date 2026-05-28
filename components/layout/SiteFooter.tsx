import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { SITE } from "@/lib/site";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { getSiteSettings } from "@/lib/cms/site-settings";
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
  whatsapp: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  ),
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
            <Brand onDark height={48} />
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
                <a href={`tel:${settings.contactUkPhone.replace(/\s+/g, "")}`}>
                  {settings.contactUkPhone}
                </a>
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
                <br />
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
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
