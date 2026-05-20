import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { SITE } from "@/lib/site";
import { joinUrl } from "@/lib/utm";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

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

export function SiteFooter() {
  const year = new Date().getFullYear();
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
            <a className="footer-cta" href={joinUrl({ source: "footer" })}>
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
                {SITE.company.address.street}
                <br />
                {SITE.company.address.city}, {SITE.company.address.postalCode}
                <br />
                <a href={`tel:${SITE.contact.ukPhone.replace(/\s+/g, "")}`}>{SITE.contact.ukPhone}</a>
              </div>
              <div className="office">
                <strong>Africa · Regional Office</strong>
                <a href={`tel:${SITE.contact.africaPhone.replace(/\s+/g, "")}`}>{SITE.contact.africaPhone}</a>
                <br />
                <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>
              </div>
            </div>
            <div className="footer-socials">
              <a href={SITE.social.linkedin} className="footer-social" aria-label="LinkedIn" rel="noopener">
                LI
              </a>
              <a href={SITE.social.facebook} className="footer-social" aria-label="Facebook" rel="noopener">
                FB
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            © {year} {SITE.legalName}. Registered in England and Wales (company no. {SITE.company.number}).
          </div>
          <div className="footer-legal">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
