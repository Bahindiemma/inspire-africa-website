import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { LegalLayout, LegalHeading, LegalCallout } from "@/components/legal/LegalLayout";
import { LegalMeta } from "@/components/legal/LegalMeta";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How INSPIRE AFRICA collects, uses, shares and protects your personal data. Worker, employer and government data rights under UK GDPR and applicable laws.",
  path: "/privacy",
});

const TOC = [
  { id: "who-we-are", label: "Who we are" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use", label: "How we use your data" },
  { id: "lawful-basis", label: "Lawful basis" },
  { id: "sharing", label: "Sharing & disclosure" },
  { id: "international", label: "International transfers" },
  { id: "retention", label: "Retention" },
  { id: "your-rights", label: "Your rights" },
  { id: "security", label: "Security" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <>
      <Hero
        watermark="PRIVACY"
        eyebrow="Legal · Data protection"
        heading={
          <>
            <span className="small-italic">Your data —</span>
            <span className="accent">handled with care.</span>
          </>
        }
        lede="This policy explains what personal data INSPIRE AFRICA collects, why we collect it, how we use and share it, and the rights you have over it."
        centered
      />

      <LegalMeta
        items={[
          { label: "Version", value: "2.1" },
          { label: "Last updated", value: "12 May 2026" },
          { label: "Controller", value: SITE.legalName },
          { label: "Contact", value: <a href={`mailto:${SITE.contact.legalEmail}`}>{SITE.contact.legalEmail}</a> },
        ]}
      />

      <LegalLayout toc={TOC}>
        <p className="lede">
          INSPIRE AFRICA operates labour mobility infrastructure across multiple jurisdictions. Protecting the
          personal data of workers, employers and government partners is foundational to our model — not an
          afterthought.
        </p>

        <LegalHeading num="01" id="who-we-are">Who we are</LegalHeading>
        <p>
          <strong>{SITE.legalName}</strong> (company no. {SITE.company.number}) is the data controller for personal data
          processed through this website and our pathways. Our registered office is {SITE.company.address.street},{" "}
          {SITE.company.address.city}, {SITE.company.address.postalCode}, {SITE.company.address.country}.
          Our regional office handles operations across our African corridors.
        </p>
        <p>
          For data-protection enquiries, contact our legal team at{" "}
          <a href={`mailto:${SITE.contact.legalEmail}`}>{SITE.contact.legalEmail}</a>.
        </p>

        <LegalHeading num="02" id="data-we-collect">Data we collect</LegalHeading>
        <p>
          We collect personal data only where it is necessary to deliver our services, meet legal obligations, or
          pursue legitimate operational interests. The categories of data we collect depend on your relationship
          with us.
        </p>
        <h3>From workers and candidates</h3>
        <ul>
          <li>Identity: name, date of birth, nationality, passport and ID details</li>
          <li>Contact: email address, phone number, postal address</li>
          <li>Professional: CV, qualifications, work history, references, language proficiency</li>
          <li>Assessment data: readiness scores, behavioural assessments, interview notes</li>
          <li>Financial: bank details and information necessary for salary-linked finance</li>
          <li>Health and biometric data where required by destination-country immigration rules</li>
        </ul>
        <h3>From employers and government partners</h3>
        <ul>
          <li>Organisation, role and contact details of representatives</li>
          <li>Job descriptions, role requirements and placement records</li>
          <li>Compliance documentation related to ethical-recruitment standards</li>
        </ul>
        <h3>Automatically</h3>
        <ul>
          <li>Device and browser information, IP address, approximate location</li>
          <li>Pages viewed, referral source and interaction events (see our <Link href="/cookies">Cookie Policy</Link>)</li>
        </ul>

        <LegalHeading num="03" id="how-we-use">How we use your data</LegalHeading>
        <p>
          We use personal data to operate the INSPIRE platform — matching qualified workers to ethical employers,
          supporting governments to govern mobility, and ensuring compliant deployment.
        </p>
        <ul>
          <li>Assess readiness, suitability and eligibility for international roles</li>
          <li>Match candidates to employer vacancies and coordinate selection</li>
          <li>Operate salary-linked migration finance, including affordability checks</li>
          <li>Manage immigration documentation, travel and aftercare</li>
          <li>Communicate updates relevant to your application or partnership</li>
          <li>Comply with legal, regulatory and ethical-recruitment obligations</li>
          <li>Improve our platform, products and service quality</li>
        </ul>

        <LegalHeading num="04" id="lawful-basis">Lawful basis</LegalHeading>
        <p>
          Under UK GDPR and equivalent frameworks in our operating jurisdictions, we rely on one or more of the
          following lawful bases when processing your personal data:
        </p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Basis</th>
                <th>When we rely on it</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Contract</strong></td>
                <td>To deliver services you have engaged us to provide — readiness, matching, deployment, finance.</td>
              </tr>
              <tr>
                <td><strong>Legal obligation</strong></td>
                <td>Where required by immigration, employment, tax, anti-trafficking or financial-services law.</td>
              </tr>
              <tr>
                <td><strong>Legitimate interests</strong></td>
                <td>For platform improvement, fraud prevention and operational continuity, balanced against your rights.</td>
              </tr>
              <tr>
                <td><strong>Consent</strong></td>
                <td>For optional marketing, sensitive categories of data and non-essential cookies. You may withdraw consent at any time.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <LegalHeading num="05" id="sharing">Sharing &amp; disclosure</LegalHeading>
        <p>We share personal data only with parties necessary to deliver our services — and only under contractual safeguards consistent with this policy.</p>
        <ul>
          <li>Employers and prospective employers — where you have applied or been matched</li>
          <li>Government, regulatory and immigration authorities — where legally required</li>
          <li>Service providers (cloud hosting, identity verification, payment, communications) bound by data-processing agreements</li>
          <li>Professional advisers — legal, audit, compliance</li>
          <li>Successors in interest in the event of corporate reorganisation</li>
        </ul>
        <LegalCallout title="We do not sell your personal data.">
          Worker data is never sold to recruiters, marketers or any third party. Workers do not pay recruitment
          fees — employers do.
        </LegalCallout>

        <LegalHeading num="06" id="international">International transfers</LegalHeading>
        <p>
          Because INSPIRE AFRICA operates across the UK, EU, USA, Canada, Australia, Mauritius, Saudi Arabia and
          African corridor countries, your personal data may be transferred outside your country of residence.
          Where it is, we use appropriate safeguards such as the UK International Data Transfer Agreement, EU
          Standard Contractual Clauses, or adequacy regulations.
        </p>

        <LegalHeading num="07" id="retention">Retention</LegalHeading>
        <p>We retain personal data only for as long as necessary to deliver the service, meet legal obligations, and support legitimate operational needs. Specific retention windows depend on the data category:</p>
        <ul>
          <li>Active candidate and placement records — for the duration of the relationship and up to seven years thereafter</li>
          <li>Financial records — six to ten years, depending on jurisdiction</li>
          <li>Marketing data — until you withdraw consent</li>
          <li>Cookies — as set out in our <Link href="/cookies">Cookie Policy</Link></li>
        </ul>

        <LegalHeading num="08" id="your-rights">Your rights</LegalHeading>
        <p>Subject to applicable law, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request erasure where there is no overriding legal basis to retain</li>
          <li>Restrict or object to certain processing</li>
          <li>Request data portability in a structured, machine-readable format</li>
          <li>Withdraw consent for processing based on consent</li>
          <li>Lodge a complaint with a supervisory authority (e.g. the UK Information Commissioner&apos;s Office)</li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a href={`mailto:${SITE.contact.legalEmail}`}>{SITE.contact.legalEmail}</a>. We respond within one month,
          extendable by two months for complex requests.
        </p>

        <LegalHeading num="09" id="security">Security</LegalHeading>
        <p>
          We apply organisational and technical measures appropriate to the sensitivity of the data we process —
          including encryption in transit and at rest, role-based access control, vendor due diligence, secure
          cloud infrastructure and regular security review. No system is invulnerable, but we treat data security
          as load-bearing infrastructure.
        </p>

        <LegalHeading num="10" id="changes">Changes to this policy</LegalHeading>
        <p>
          We update this policy as our services and the regulatory landscape evolve. Material changes are flagged
          on this page and, where appropriate, communicated by email to active users. The version and last-updated
          date at the top of this page record the current effective version.
        </p>

        <LegalHeading num="11" id="contact">Contact</LegalHeading>
        <p>For any question about this policy or your personal data:</p>
        <ul>
          <li>Email: <a href={`mailto:${SITE.contact.legalEmail}`}>{SITE.contact.legalEmail}</a></li>
          <li>Post: {SITE.legalName}, {SITE.company.address.street}, {SITE.company.address.city}, {SITE.company.address.postalCode}, {SITE.company.address.country}</li>
          <li>Phone: <a href={`tel:${SITE.contact.ukPhone.replace(/\s+/g, "")}`}>{SITE.contact.ukPhone}</a></li>
        </ul>
      </LegalLayout>

      <FinalCta
        eyebrow="Have a question?"
        heading={
          <>
            <span className="italic-accent">If something&apos;s unclear —</span>
            Get in touch.
          </>
        }
        lede="Our legal team responds within two working days."
        secondary={
          <>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
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
