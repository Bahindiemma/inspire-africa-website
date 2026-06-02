import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { LegalLayout, LegalHeading, LegalCallout } from "@/components/legal/LegalLayout";
import { LegalBlocks } from "@/components/legal/LegalBlocks";
import { LegalMeta } from "@/components/legal/LegalMeta";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { getLegalDocument, formatLegalDate } from "@/lib/cms/legal";
import { getSiteSettings } from "@/lib/cms/site-settings";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description: "What cookies INSPIRE AFRICA uses on this website, why we use them, and how you can control them.",
  path: "/cookies",
});

const TOC = [
  { id: "what-are-cookies", label: "What cookies are" },
  { id: "why-we-use", label: "Why we use them" },
  { id: "categories", label: "Categories we use" },
  { id: "cookie-list", label: "Cookies we set" },
  { id: "third-party", label: "Third-party cookies" },
  { id: "manage", label: "How to manage cookies" },
  { id: "consent", label: "Consent & preferences" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default async function CookiesPage() {
  const [doc, settings] = await Promise.all([
    getLegalDocument("cookies"),
    getSiteSettings(),
  ]);
  return (
    <>
      <Hero
        watermark="COOKIES"
        eyebrow={doc.eyebrow}
        heading={<span dangerouslySetInnerHTML={{ __html: doc.headingHtml }} />}
        lede={doc.lede}
        centered
      />

      <LegalMeta
        items={[
          { label: "Version", value: doc.version },
          { label: "Last updated", value: formatLegalDate(doc.lastUpdated) },
          { label: "Scope", value: "inspireafricans.com and sub-domains" },
          { label: "Contact", value: <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a> },
        ]}
      />

      <LegalLayout
        toc={
          doc.tocAnchors && doc.tocAnchors.length > 0
            ? doc.tocAnchors.map((a) => ({ id: a.anchorId, label: a.label }))
            : TOC
        }
      >
        {doc.body && doc.body.length > 0 ? (
          <LegalBlocks blocks={doc.body} settings={settings} />
        ) : (
        <>
        <p className="lede">
          We use cookies and similar technologies to keep the site working, to remember preferences such as your
          theme choice, and to understand how visitors use the platform so we can improve it. We do not use cookies
          to build behavioural advertising profiles.
        </p>

        <LegalHeading num="01" id="what-are-cookies">What cookies are</LegalHeading>
        <p>
          Cookies are small text files placed on your device when you visit a website. They allow the site to
          recognise your device on subsequent visits and to remember choices you have made. Similar technologies
          — such as local storage, pixels and SDKs — perform comparable functions and are covered by this policy.
        </p>

        <LegalHeading num="02" id="why-we-use">Why we use them</LegalHeading>
        <ul>
          <li>To keep the site secure and operational</li>
          <li>To remember your preferences, including theme and language</li>
          <li>To understand which content is useful and where the site can be improved</li>
          <li>To measure the performance of our community outreach</li>
        </ul>

        <LegalHeading num="03" id="categories">Categories we use</LegalHeading>
        <p>We group cookies into four standard categories. Only strictly necessary cookies are loaded by default — others run only with your consent.</p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr><th>Category</th><th>Purpose</th><th>Consent</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Strictly necessary</strong></td><td>Security, load balancing, session integrity, theme preference.</td><td>Not required</td></tr>
              <tr><td><strong>Performance</strong></td><td>Aggregate page views, navigation paths and load timings to improve the site.</td><td>Required</td></tr>
              <tr><td><strong>Functional</strong></td><td>Remember preferences such as language or accessibility settings.</td><td>Required</td></tr>
              <tr><td><strong>Marketing</strong></td><td>Measure campaign performance on third-party platforms (e.g. LinkedIn).</td><td>Required</td></tr>
            </tbody>
          </table>
        </div>

        <LegalHeading num="04" id="cookie-list">Cookies we set</LegalHeading>
        <p>The list below covers the principal cookies and storage keys set by this website. Names and durations may evolve as the platform changes; the policy version above reflects the most recent review.</p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr><th>Name</th><th>Purpose</th><th>Type</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>inspire-theme</strong></td><td>Stores your light, dark or system theme choice.</td><td>Functional · localStorage</td><td>Persistent</td></tr>
              <tr><td><strong>ia_session</strong></td><td>Maintains your session and protects against cross-site request forgery.</td><td>Strictly necessary</td><td>Session</td></tr>
              <tr><td><strong>ia_consent</strong></td><td>Records your cookie-consent choices.</td><td>Strictly necessary</td><td>12 months</td></tr>
              <tr><td><strong>_ga, _ga_*</strong></td><td>Google Analytics 4 — measures usage in aggregate.</td><td>Performance</td><td>13 months</td></tr>
              <tr><td><strong>li_fat_id</strong></td><td>LinkedIn Insight Tag — measures campaign attribution.</td><td>Marketing</td><td>30 days</td></tr>
            </tbody>
          </table>
        </div>

        <LegalHeading num="05" id="third-party">Third-party cookies</LegalHeading>
        <p>Some cookies are placed by third-party providers we use to deliver functionality, measurement or community features:</p>
        <ul>
          <li><strong>Google LLC</strong> — analytics</li>
          <li><strong>LinkedIn Ireland Unlimited Company</strong> — campaign measurement</li>
          <li><strong>Mighty Networks</strong> — our community platform, which sets its own cookies when you visit the community</li>
          <li><strong>Wix.com Ltd</strong> — site infrastructure and form handling</li>
        </ul>
        <p>These providers process limited data on our behalf or as joint controllers. Their own privacy and cookie policies apply when you interact with them directly.</p>

        <LegalHeading num="06" id="manage">How to manage cookies</LegalHeading>
        <p>You can control cookies in several ways:</p>
        <ul>
          <li><strong>Browser controls</strong> — most browsers let you block, delete or be alerted to cookies. See your browser&apos;s help pages for instructions.</li>
          <li><strong>Device-level opt-outs</strong> — operating systems offer ad-tracking controls.</li>
          <li><strong>Provider opt-outs</strong> — for example, Google Analytics offers a browser add-on at <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">tools.google.com/dlpage/gaoptout</a>.</li>
        </ul>
        <LegalCallout title="If you block strictly necessary cookies">
          Some parts of the site — including security checks and the theme switcher — may not function properly.
        </LegalCallout>

        <LegalHeading num="07" id="consent">Consent &amp; preferences</LegalHeading>
        <p>
          When you first visit the site, a cookie banner asks for your consent to non-essential cookies. You may
          withdraw or change consent at any time by clearing the <strong>ia_consent</strong> cookie in your browser,
          or by emailing us at <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a>.
        </p>

        <LegalHeading num="08" id="changes">Changes to this policy</LegalHeading>
        <p>We review this policy regularly and whenever we introduce new technologies. The version and last-updated date at the top of this page record the current effective version.</p>

        <LegalHeading num="09" id="contact">Contact</LegalHeading>
        <p>For any question about cookies on this site, contact:</p>
        <ul>
          <li>Email: <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a></li>
          <li>Post: {settings.legalName}, {settings.companyAddress.street}, {settings.companyAddress.city}, {settings.companyAddress.postalCode}, {settings.companyAddress.country}</li>
        </ul>
        <p>For the full scope of personal-data handling, see our <Link href="/privacy">Privacy Policy</Link>.</p>
        </>
        )}
      </LegalLayout>

      <FinalCta
        eyebrow="Related policies"
        heading={
          <>
            <span className="italic-accent">Want the full picture?</span>
            Read our policies.
          </>
        }
        lede="Our privacy, terms and modern slavery statements complete the legal framework."
        secondary={
          <>
            <Link href="/terms">Terms</Link>
            <Link href="/modern-slavery">Modern Slavery</Link>
            <Link href="/contact">Contact</Link>
          </>
        }
        style={{ paddingTop: "clamp(48px,5vw,72px)", paddingBottom: "clamp(48px,5vw,72px)" }}
      >
        <ButtonLink href="/privacy" variant="dark" withArrow>
          Privacy Policy
        </ButtonLink>
      </FinalCta>
    </>
  );
}
