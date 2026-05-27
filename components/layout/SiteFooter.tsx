import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";
import { SITE } from "@/lib/site";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";

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
  const linkedinUrl = settings.socialLinks.find((s) => s.platform === "linkedin")?.url ?? "#";
  const facebookUrl = settings.socialLinks.find((s) => s.platform === "facebook")?.url ?? "#";
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
                <a href={`tel:${settings.contactUkPhone.replace(/\s+/g, "")}`}>{settings.contactUkPhone}</a>
              </div>
              <div className="office">
                <strong>Africa · Regional Office</strong>
                <a href={`tel:${settings.contactAfricaPhone.replace(/\s+/g, "")}`}>{settings.contactAfricaPhone}</a>
                <br />
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </div>
            </div>
            <div className="footer-socials">
              <a href={linkedinUrl} className="footer-social" aria-label="LinkedIn" rel="noopener">
                LI
              </a>
              <a href={facebookUrl} className="footer-social" aria-label="Facebook" rel="noopener">
                FB
              </a>
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
