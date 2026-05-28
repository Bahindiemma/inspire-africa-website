import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { LegalLayout, LegalHeading, LegalCallout } from "@/components/legal/LegalLayout";
import { LegalMeta } from "@/components/legal/LegalMeta";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { getLegalDocument, formatLegalDate } from "@/lib/cms/legal";
import { getSiteSettings } from "@/lib/cms/site-settings";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "The terms that govern your use of the INSPIRE AFRICA website, community and platform — including eligibility, acceptable use, liability and governing law.",
  path: "/terms",
});

const TOC = [
  { id: "acceptance", label: "Acceptance" },
  { id: "definitions", label: "Definitions" },
  { id: "eligibility", label: "Eligibility" },
  { id: "account", label: "Your account" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "ip", label: "Intellectual property" },
  { id: "third-party", label: "Third-party services" },
  { id: "fees", label: "Fees" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "termination", label: "Suspension & termination" },
  { id: "governing-law", label: "Governing law" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default async function TermsPage() {
  const [doc, settings] = await Promise.all([
    getLegalDocument("terms"),
    getSiteSettings(),
  ]);
  return (
    <>
      <Hero
        watermark="TERMS"
        eyebrow={doc.eyebrow}
        heading={<span dangerouslySetInnerHTML={{ __html: doc.headingHtml }} />}
        lede={doc.lede}
        centered
      />

      <LegalMeta
        items={[
          { label: "Version", value: doc.version },
          { label: "Last updated", value: formatLegalDate(doc.lastUpdated) },
          { label: "Governing law", value: "England and Wales" },
          { label: "Contact", value: <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a> },
        ]}
      />

      <LegalLayout toc={TOC}>
        <p className="lede">
          By accessing or using INSPIRE AFRICA, you agree to these terms. If you do not agree, please do not use
          the platform. Workers, employers and government partners may have additional terms in their respective
          onboarding agreements; in case of conflict, those signed agreements take precedence.
        </p>

        <LegalHeading num="01" id="acceptance">Acceptance of these terms</LegalHeading>
        <p>
          These Terms of Use form a binding agreement between you and {settings.legalName} (company no.{" "}
          {settings.companyNumber}), referred to as <strong>&quot;INSPIRE&quot;</strong>, <strong>&quot;we&quot;</strong>{" "}
          or <strong>&quot;us&quot;</strong>. By using the website, the community or any of our services, you
          confirm that you have read, understood and agreed to be bound by these terms and our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <LegalHeading num="02" id="definitions">Definitions</LegalHeading>
        <ul>
          <li><strong>&quot;Platform&quot;</strong> means the INSPIRE AFRICA website, community, applications and any related services we provide.</li>
          <li><strong>&quot;Worker&quot;</strong> means an individual seeking or holding international employment through the platform.</li>
          <li><strong>&quot;Employer&quot;</strong> means an organisation engaging the platform to hire workers.</li>
          <li><strong>&quot;Government Partner&quot;</strong> means a public-sector body engaging the platform on migration pathways.</li>
          <li><strong>&quot;User&quot;</strong> means any worker, employer, government partner or visitor using the platform.</li>
        </ul>

        <LegalHeading num="03" id="eligibility">Eligibility</LegalHeading>
        <p>You must be at least 18 years old and legally able to enter a contract in your country of residence. If you are using the platform on behalf of an organisation, you confirm that you have the authority to bind that organisation to these terms.</p>

        <LegalHeading num="04" id="account">Your account</LegalHeading>
        <p>Some parts of the platform — including the community — require registration. You agree to:</p>
        <ul>
          <li>Provide accurate, current and complete information when you register</li>
          <li>Keep your credentials secure and not share them with others</li>
          <li>Notify us promptly of any unauthorised access</li>
          <li>Be responsible for activity carried out under your account</li>
        </ul>

        <LegalHeading num="05" id="acceptable-use">Acceptable use</LegalHeading>
        <p>When using the platform you must not:</p>
        <ul>
          <li>Use the platform for any unlawful, fraudulent or harmful purpose</li>
          <li>Misrepresent your identity, qualifications or organisation</li>
          <li>Charge workers recruitment fees or otherwise breach ethical-recruitment standards</li>
          <li>Engage in trafficking, forced labour or any practice contrary to the UK Modern Slavery Act 2026</li>
          <li>Upload content that is defamatory, abusive, discriminatory or violates third-party rights</li>
          <li>Interfere with the platform&apos;s operation, including by scraping, automated access or attempting to gain unauthorised access</li>
          <li>Use the platform to circumvent immigration, employment or sanctions laws in any jurisdiction</li>
        </ul>
        <LegalCallout title="Our worker-first commitment">
          Workers do not pay recruitment fees through this platform. Any attempt by an employer or partner to
          charge workers contravenes these terms and may lead to immediate suspension.
        </LegalCallout>

        <LegalHeading num="06" id="ip">Intellectual property</LegalHeading>
        <p>The platform, including its design, code, text, graphics and trademarks, is owned by Inspire Africa Platform Ltd or licensed to us. You receive a limited, non-exclusive, non-transferable licence to use the platform for its intended purpose. You may not copy, modify, distribute or create derivative works without our prior written consent.</p>
        <p>Content you submit — such as your CV, profile or community posts — remains yours. You grant us a worldwide, non-exclusive licence to host, process and display that content as necessary to deliver the platform.</p>

        <LegalHeading num="07" id="third-party">Third-party services</LegalHeading>
        <p>The platform integrates third-party services for hosting, analytics, payments and community. Your use of those services is governed by their own terms. We are not responsible for third-party content or practices but choose our providers carefully and bind them under data-processing agreements where applicable.</p>

        <LegalHeading num="08" id="fees">Fees</LegalHeading>
        <p>Use of the public website and community is free. Employers and government partners are subject to fees as set out in their respective service agreements. Worker-side services that involve structured finance are governed by separate, transparent salary-linked agreements signed before any obligation arises.</p>

        <LegalHeading num="09" id="disclaimers">Disclaimers</LegalHeading>
        <p>The platform is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong>. While we work hard to maintain availability and accuracy, we do not warrant that the platform will be uninterrupted, error-free or meet your specific requirements. Nothing in these terms excludes liability that cannot be excluded by law — including liability for death or personal injury caused by negligence and liability for fraud.</p>

        <LegalHeading num="10" id="liability">Limitation of liability</LegalHeading>
        <p>To the maximum extent permitted by law, INSPIRE is not liable for:</p>
        <ul>
          <li>Indirect, consequential or special losses</li>
          <li>Loss of profit, revenue, business, opportunity, goodwill or anticipated savings</li>
          <li>Loss or corruption of data or interruption of service</li>
        </ul>
        <p>Our aggregate liability arising out of or in connection with these terms is limited to the greater of (a) the fees you have paid us in the twelve months preceding the event giving rise to the claim, or (b) £100.</p>

        <LegalHeading num="11" id="indemnity">Indemnity</LegalHeading>
        <p>You agree to indemnify and hold INSPIRE harmless from claims, damages and costs arising from your breach of these terms, your misuse of the platform, or your violation of any law or third-party right.</p>

        <LegalHeading num="12" id="termination">Suspension &amp; termination</LegalHeading>
        <p>We may suspend or terminate your access to the platform — with or without notice — if we reasonably believe you have breached these terms, posed a risk to other users, or acted contrary to ethical-recruitment standards. You may stop using the platform at any time; sections relating to intellectual property, liability and governing law survive termination.</p>

        <LegalHeading num="13" id="governing-law">Governing law &amp; disputes</LegalHeading>
        <p>These terms are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction over any dispute, except that we may bring proceedings in the courts of the jurisdiction in which you are resident where required by mandatory law. We encourage you to contact us first — most disputes are resolved through dialogue.</p>

        <LegalHeading num="14" id="changes">Changes to these terms</LegalHeading>
        <p>We may update these terms as our platform and the regulatory landscape evolve. Material changes are flagged on this page and, where appropriate, communicated by email. Continued use of the platform after changes take effect constitutes acceptance of the revised terms.</p>

        <LegalHeading num="15" id="contact">Contact</LegalHeading>
        <p>Questions about these terms:</p>
        <ul>
          <li>Email: <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a></li>
          <li>Post: {settings.legalName}, {settings.companyAddress.street}, {settings.companyAddress.city}, {settings.companyAddress.postalCode}, {settings.companyAddress.country}</li>
          <li>Phone: <a href={`tel:${settings.contactUkPhone.replace(/\s+/g, "")}`}>{settings.contactUkPhone}</a></li>
          <li>WhatsApp (no calls): <a href={`https://wa.me/${settings.contactAfricaPhone.replace(/\D+/g, "")}`} target="_blank" rel="noopener">{settings.contactAfricaPhone}</a></li>
        </ul>
      </LegalLayout>

      <FinalCta
        eyebrow="Got a question?"
        heading={
          <>
            <span className="italic-accent">Need clarification —</span>
            Talk to us.
          </>
        }
        lede="We&apos;re here to make sure things are clear before they&apos;re signed."
        secondary={
          <>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/modern-slavery">Modern Slavery</Link>
          </>
        }
        style={{ paddingTop: "clamp(48px,5vw,72px)", paddingBottom: "clamp(48px,5vw,72px)" }}
      >
        <ButtonLink href="/contact" variant="dark" withArrow>
          Contact Us
        </ButtonLink>
      </FinalCta>
    </>
  );
}
