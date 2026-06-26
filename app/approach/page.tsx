import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { PageSection, SectionGrid, SectionLeft } from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { ProcessList } from "@/components/sections/ProcessList";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";
import { getPage } from "@/lib/cms/pages";
import { DynamicZoneRenderer } from "@/components/cms/DynamicZoneRenderer";

export const metadata: Metadata = buildMetadata({
  title: "Our Approach",
  description:
    "Ethical mobility, Earn-Learn-Return circular migration, structured finance — the operating model behind INSPIRE AFRICA.",
  path: "/approach",
});

const PRINCIPLES = [
  {
    title: "Ethical",
    body:
      "Worker protection built in. Workers do not pay recruitment fees — employers do. Aligned with the IOM's IRIS and other international ethical recruitment standards.",
  },
  {
    title: "Circular",
    body:
      "Earn-Learn-Return. Labour mobility designed so skills, capital and opportunity flow back into African economies over time.",
  },
  {
    title: "Structured",
    body:
      "Every journey follows a predictable, repeatable pipeline. Readiness, finance, deployment and aftercare coordinated as one system.",
  },
  {
    title: "Worker-Centred",
    body:
      "Built around the worker's journey, not the recruiter's deal flow. Outcomes are measured in worker progression — not placement count.",
  },
];

const JOURNEY = [
  { title: "Assess", body: "Capability, behaviour and suitability evaluated through a consistent, multi-dimensional framework." },
  { title: "Prepare", body: "Candidates are guided through a structured readiness process designed to ensure they are equipped for international work environments." },
  { title: "Match", body: "Candidates introduced to relevant employers through a controlled and transparent selection process." },
  { title: "Enable", body: "Where required, access to structured migration cost solutions allows candidates to proceed without prohibitive up-front barriers." },
  { title: "Deploy", body: "Documentation, compliance and relocation coordinated to ensure a smooth transition into employment." },
  { title: "Support", body: "Ongoing support maintains stability, performance and integration in the workplace." },
  { title: "Return & Progress", body: "Workers build experience, savings and skills that are reinvested into long-term careers, entrepreneurship and home economies." },
];

export default async function ApproachPage() {
  // CMS-driven render (preferred). Falls back to inline TSX below
  // if Strapi is unreachable AND no Page document exists at /approach.
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("approach")]);
  if (page) return <DynamicZoneRenderer sections={page.sections} />;
  return (
    <>
      <Hero
        watermark="APPROACH"
        eyebrow="Our approach"
        heading={
          <>
            <span className="small-italic">Not recruitment.</span>
            <span className="accent">Infrastructure.</span>
          </>
        }
        lede="A structured system for global labour mobility — built around four principles: ethical, circular, structured, worker-centred."
        ctas={
          <>
            <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "approach_hero" })} variant="primary" withArrow>
              Join the Community
            </ButtonLink>
            <ButtonLink href="/workers" variant="ghost">
              For Workers
            </ButtonLink>
          </>
        }
        photo={{
          src: "/images/approach-hero-tailor.jpg",
          alt: "African tailor focused on a stitching task — skilled, hands-on work being built into a career",
          captionTitle: "Earn · Learn · Return",
          captionSub: "The circular model",
        }}
      />

      <PageSection tone="yellow">
        <SectionGrid>
          <SectionLeft
            eyebrow="Operating principles"
            heading={
              <>
                Four ideas. <span className="italic-accent">One system.</span>
              </>
            }
          >
            <p>
              Most international recruitment is fragmented, opaque and extractive. INSPIRE AFRICA is built on four
              operating principles that shape every decision in the platform.
            </p>
          </SectionLeft>
          <FeatureList items={PRINCIPLES} />
        </SectionGrid>
      </PageSection>

      <PageSection>
        <SectionGrid>
          <SectionLeft
            eyebrow="A coordinated journey"
            heading={
              <>
                From <span className="yellow">readiness</span> to return.
              </>
            }
          >
            <p>Each pathway is tailored by role, sector and country — a set of stepping stones that carry a worker from where they are to where they want to be.</p>
          </SectionLeft>
          <ProcessList items={JOURNEY} />
        </SectionGrid>
      </PageSection>

      <FinalCta
        eyebrow="Your move"
        heading={
          <>
            <span className="italic-accent">Ready to begin?</span>
            Join the
            <br />
            community.
          </>
        }
        lede="Free membership. Direct route into the INSPIRE AFRICA ecosystem."
      >
        <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "approach_cta" })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
