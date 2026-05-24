import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { PageSection, SectionGrid, SectionLeft } from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { ProcessList } from "@/components/sections/ProcessList";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GovernmentsForm } from "@/components/forms/GovernmentsForm";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { getPage } from "@/lib/cms/pages";
import { DynamicZoneRenderer } from "@/components/cms/DynamicZoneRenderer";

export const metadata: Metadata = buildMetadata({
  title: "For Governments",
  description:
    "Build transparent, scalable labour mobility pathways. Data-driven workforce planning aligned with national development priorities.",
  path: "/governments",
});

const PROBLEMS = [
  { marker: "×", bad: true, title: "Irregular migration creates risk and instability", body: "Without legal channels, citizens move anyway — often through dangerous, exploitative routes." },
  { marker: "×", bad: true, title: "Limited oversight of recruitment pathways", body: "Informal agents dominate. Government visibility is partial at best." },
  { marker: "×", bad: true, title: "Lost opportunities for skills development and return", body: "Workers leave without a return plan. Skills don't flow back." },
  { marker: "×", bad: true, title: "Remittances are not fully leveraged", body: "Capital arrives at the household level but rarely connects to national development priorities." },
];

const SOLUTION = [
  { marker: "✓", title: "Transparent sourcing and selection", body: "Every candidate is traceable end-to-end. No informal subcontracting." },
  { marker: "✓", title: "Worker protection and ethical recruitment", body: "Aligned with international ethical-recruitment standards. Workers pay no fees." },
  { marker: "✓", title: "Data-driven workforce planning", body: "Visibility into who is moving, where, and what they do — across the full lifecycle." },
  { marker: "✓", title: "Scalable international partnerships", body: "Bilateral pathways designed once, repeatable across corridors and sectors." },
];

const PROCESS = [
  { title: "Define priority sectors and corridors", body: "Where the national interest sits, and which destination markets align." },
  { title: "Establish transparent pathways", body: "Rules-based, documented, auditable — replacing informal channels." },
  { title: "Prepare and deploy workers", body: "Readiness, finance, compliance — coordinated by INSPIRE, monitored by government." },
  { title: "Monitor outcomes abroad", body: "Welfare, performance, integration — tracked across the journey." },
  { title: "Enable return and reintegration", body: "Skills transfer, savings deployment, second-stage opportunities at home." },
];

export default async function GovernmentsPage() {
  // CMS-driven render (preferred). Falls back to inline TSX below
  // if Strapi is unreachable AND no Page document exists at /governments.
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("governments")]);
  if (page) return <DynamicZoneRenderer sections={page.sections} />;
  return (
    <>
      <Hero
        watermark="GOVERN"
        eyebrow="For governments & partners"
        heading={
          <>
            <span className="small-italic">Make migration work —</span>
            for your
            <br />
            <span className="accent">economy.</span>
          </>
        }
        lede="INSPIRE AFRICA provides the tools and infrastructure to build transparent, scalable labour mobility pathways."
        ctas={
          <>
            <ButtonLink href="#governments-form" variant="primary" withArrow>
              Partner With Us
            </ButtonLink>
            <ButtonLink href="/approach" variant="ghost">
              Our Approach
            </ButtonLink>
          </>
        }
        photo={{
          src: "/images/inspire-farmer-agriculture.jpg",
          alt: "Architectural sketch of infrastructure — INSPIRE's systemic approach to migration",
          captionTitle: "Systems-led",
          captionSub: "From migration to mobility infrastructure",
        }}
      />

      <PageSection tone="alt">
        <SectionGrid>
          <SectionLeft
            eyebrow="The current reality"
            heading={
              <>
                Migration is happening —
                <br />
                <span className="yellow">but not working optimally.</span>
              </>
            }
          >
            <p>
              Unmanaged migration creates risk for citizens, lost opportunity for economies, and limited oversight
              for governments.
            </p>
          </SectionLeft>
          <FeatureList items={PROBLEMS} />
        </SectionGrid>
      </PageSection>

      <PageSection tone="yellow">
        <SectionGrid>
          <SectionLeft
            eyebrow="From unmanaged to governed"
            heading={
              <>
                Governed mobility <span className="italic-accent">systems.</span>
              </>
            }
          >
            <p>
              INSPIRE AFRICA enables structured, rules-based labour mobility that aligns with national
              development priorities.
            </p>
          </SectionLeft>
          <FeatureList items={SOLUTION} />
        </SectionGrid>
      </PageSection>

      <PageSection>
        <SectionGrid>
          <SectionLeft
            eyebrow="A structured partnership model"
            heading={
              <>
                Five steps. <span className="yellow">Five outcomes.</span>
              </>
            }
          >
            <p>
              From defining priority corridors to enabling return and reintegration — a clear, repeatable
              framework.
            </p>
          </SectionLeft>
          <ProcessList items={PROCESS} />
        </SectionGrid>
      </PageSection>

      <section className="form-section" id="governments-form">
        <div className="container">
          <div className="form-wrap">
            <Eyebrow>Begin a conversation</Eyebrow>
            <h2>Partner with us</h2>
            <p>
              Tell us briefly about your priorities. A senior member of the team will respond within three working
              days.
            </p>
            <GovernmentsForm />
          </div>
        </div>
      </section>
    </>
  );
}
