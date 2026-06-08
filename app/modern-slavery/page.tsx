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
  title: "Modern Slavery Statement",
  description:
    "INSPIRE AFRICA's statement on the steps we take to prevent modern slavery and human trafficking in our operations and supply chains. Published under the UK Modern Slavery Act 2026.",
  path: "/modern-slavery",
});

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "structure", label: "Our structure" },
  { id: "supply-chain", label: "Supply chain" },
  { id: "policies", label: "Policies" },
  { id: "due-diligence", label: "Due diligence" },
  { id: "risk", label: "Risk assessment" },
  { id: "training", label: "Training" },
  { id: "kpis", label: "KPIs & outcomes" },
  { id: "whistleblowing", label: "Reporting concerns" },
  { id: "future", label: "Looking ahead" },
  { id: "approval", label: "Board approval" },
];

export default async function ModernSlaveryPage() {
  const [doc, settings] = await Promise.all([
    getLegalDocument("modern-slavery"),
    getSiteSettings(),
  ]);
  return (
    <>
      <Hero
        watermark="ETHICS"
        eyebrow={doc.eyebrow}
        heading={<span dangerouslySetInnerHTML={{ __html: doc.headingHtml }} />}
        lede={doc.lede}
        centered
      />

      <LegalMeta
        items={[
          { label: "Statement period", value: "1 April 2025 — 31 March 2026" },
          { label: "Published", value: formatLegalDate(doc.lastUpdated) },
          { label: "Approved by", value: "Board of Directors" },
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
          INSPIRE AFRICA exists to make international labour mobility ethical, structured and worker-first.
          Preventing modern slavery and human trafficking is not a compliance afterthought — it is the operating
          thesis of the business.
        </p>

        <LegalCallout title="Zero-tolerance commitment">
          We do not tolerate modern slavery, forced labour, debt bondage, child labour or human trafficking in any
          form, anywhere in our operations or supply chains. Workers do not pay recruitment fees through this
          platform — employers do.
        </LegalCallout>

        <LegalHeading num="01" id="introduction">Introduction</LegalHeading>
        <p>
          This statement is published by {settings.legalName} (company no. {settings.companyNumber}) on behalf of itself
          and other companies in the group. It covers the financial year ended 31 March 2026 and is made
          in accordance with section 54 of the UK Modern Slavery Act 2026.
        </p>
        <p>
          Modern slavery — including human trafficking, forced labour and debt bondage — is a structural risk in
          international labour mobility. We treat that risk as central to platform design, not as a tick-box
          exercise.
        </p>

        <LegalHeading num="02" id="structure">Our structure</LegalHeading>
        <p>
          INSPIRE AFRICA is a labour-mobility infrastructure business connecting African workers to ethical
          employers through government-recognised pathways. We operate across the UK, EU, USA, Canada, Australia, Saudi Arabia
          and African corridor countries. Our key functions include:
        </p>
        <ul>
          <li>Worker readiness, screening and pre-departure support</li>
          <li>Employer matching and compliant deployment</li>
          <li>Salary-linked migration finance</li>
          <li>Government partnership and pathway design</li>
        </ul>

        <LegalHeading num="03" id="supply-chain">Our supply chain</LegalHeading>
        <p>Our supply chain is concentrated in services rather than physical goods. The main categories are:</p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr><th>Category</th><th>Examples</th><th>Risk profile</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Recruitment partners</strong></td><td>In-country sourcing and training organisations</td><td>Elevated — direct contact with candidates</td></tr>
              <tr><td><strong>Employers</strong></td><td>Care groups, hospitality, agriculture, construction</td><td>Sector-dependent — monitored continuously</td></tr>
              <tr><td><strong>Professional services</strong></td><td>Legal, audit, immigration advisory</td><td>Low</td></tr>
              <tr><td><strong>Technology suppliers</strong></td><td>Cloud hosting, identity verification, payments</td><td>Low</td></tr>
              <tr><td><strong>Operations</strong></td><td>Office facilities, travel, communications</td><td>Low</td></tr>
            </tbody>
          </table>
        </div>

        <LegalHeading num="04" id="policies">Our policies</LegalHeading>
        <p>The following policies underpin our anti-slavery commitment. They apply across the group and to all partners who deliver services under our brand:</p>
        <ul>
          <li>Ethical Recruitment Policy — aligned with IRIS Standard and ILO Fair Recruitment Initiative</li>
          <li>Worker-Pays-Nothing Policy — workers never pay recruitment fees; employers do</li>
          <li>Supplier Code of Conduct — pre-contract due diligence and ongoing audits</li>
          <li>Whistleblowing and Speak-Up Policy</li>
          <li>Anti-Bribery and Corruption Policy</li>
          <li>Data Protection and Worker Privacy Policy — see our <Link href="/privacy">Privacy Policy</Link></li>
        </ul>

        <LegalHeading num="05" id="due-diligence">Due diligence</LegalHeading>
        <p>Our due-diligence programme is operational, not paperwork. It runs across three stages:</p>
        <ol className="legal-list">
          <li><strong>Onboarding.</strong> Every employer and recruitment partner is screened against sanctions, ethical-recruitment standards and labour-rights track records before they can transact on the platform.</li>
          <li><strong>In-pathway monitoring.</strong> Worker check-ins at pre-departure, arrival and post-placement points generate signals that are reviewed by our integrity team. Patterns trigger investigations.</li>
          <li><strong>Independent audit.</strong> Annual audits of priority corridors, performed by an external firm specialising in fair-recruitment due diligence.</li>
        </ol>

        <LegalHeading num="06" id="risk">Risk assessment</LegalHeading>
        <p>We assess modern-slavery risk by corridor, sector and partner. Our current heat map identifies the following as priority watch-points:</p>
        <ul>
          <li>Sectors with historically high informal-labour reliance (agriculture, hospitality, construction)</li>
          <li>Corridors with documented recruitment-fee abuse</li>
          <li>Sub-tier partners introduced by primary suppliers</li>
          <li>Worker financial pressure that can be exploited by bad actors</li>
        </ul>
        <p>Risk is reviewed quarterly and after any material incident. Findings shape pathway design, partner selection and training priorities.</p>

        <LegalHeading num="07" id="training">Training</LegalHeading>
        <p>All staff complete an annual modern-slavery and ethical-recruitment training module. Targeted training is provided to roles in direct candidate contact, compliance and partner management. Recruitment partners are required to evidence equivalent training within their own organisations.</p>

        <LegalHeading num="08" id="kpis">KPIs &amp; outcomes</LegalHeading>
        <p>We measure progress through a small number of operational indicators. The figures below reflect the statement period:</p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr><th>Indicator</th><th>Target</th><th>Outcome</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Workers paying recruitment fees</strong></td><td>0</td><td>0</td></tr>
              <tr><td><strong>Partner audits completed</strong></td><td>100%</td><td>100%</td></tr>
              <tr><td><strong>Staff anti-slavery training completion</strong></td><td>100%</td><td>100%</td></tr>
              <tr><td><strong>Substantiated grievances</strong></td><td>—</td><td>0</td></tr>
              <tr><td><strong>Speak-Up channel reports investigated within 30 days</strong></td><td>100%</td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <LegalHeading num="09" id="whistleblowing">Reporting concerns</LegalHeading>
        <p>Workers, employers, partners and members of the public can report concerns confidentially via our Speak-Up channel. Concerns can be raised in any of our operating languages, and we do not tolerate retaliation against anyone reporting in good faith.</p>
        <ul>
          <li>Email: <a href={`mailto:${settings.contactSpeakupEmail}`}>{settings.contactSpeakupEmail}</a></li>
          <li>Post: Compliance Officer, {settings.legalName}, {settings.companyAddress.street}, {settings.companyAddress.city}, {settings.companyAddress.postalCode}, {settings.companyAddress.country}</li>
        </ul>

        <LegalHeading num="10" id="future">Looking ahead</LegalHeading>
        <p>In the next financial year we plan to:</p>
        <ul>
          <li>Extend independent audits to all active corridors</li>
          <li>Publish a worker-voice index drawn from anonymous candidate feedback</li>
          <li>Strengthen sub-tier partner mapping using structured data from primary suppliers</li>
          <li>Co-develop corridor-level anti-trafficking protocols with our government partners</li>
        </ul>

        <LegalHeading num="11" id="approval">Board approval</LegalHeading>
        <p>This statement was reviewed and approved by the Board of Directors of {settings.legalName} on 12 May 2026. It will be reviewed annually and updated as required by law and by changes to our operations.</p>
        <p style={{ marginTop: 24 }}>
          <strong>Signed —</strong> on behalf of the Board
          <br />
          {settings.legalName}
          <br />
          12 May 2026
        </p>
        </>
        )}
      </LegalLayout>

      <FinalCta
        eyebrow="Report a concern"
        heading={
          <>
            <span className="italic-accent">See something? —</span>
            Say something.
          </>
        }
        lede="Our Speak-Up channel is confidential and protected against retaliation."
        secondary={
          <>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </>
        }
        style={{ paddingTop: "clamp(48px,5vw,72px)", paddingBottom: "clamp(48px,5vw,72px)" }}
      >
        <ButtonLink href={`mailto:${settings.contactSpeakupEmail}`} variant="dark" withArrow>
          Report Confidentially
        </ButtonLink>
      </FinalCta>
    </>
  );
}
