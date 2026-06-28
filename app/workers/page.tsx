import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { PageSection, SectionGrid, SectionLeft } from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { StepCards } from "@/components/sections/StepCards";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";
import { getPage } from "@/lib/cms/pages";
import { DynamicZoneRenderer } from "@/components/cms/DynamicZoneRenderer";

export const metadata: Metadata = buildMetadata({
  title: "For Workers",
  description:
    "Work abroad safely. Fair, structured pathways into international employment, with preparation and salary-linked finance.",
  path: "/workers",
});

const PROBLEMS = [
  { marker: "×", bad: true, title: "Jobs exist abroad — but access is limited", body: "Opportunities are real but hard to reach from where you are today." },
  { marker: "×", bad: true, title: "Up-front costs are too high", body: "Most pathways demand savings or family loans before you've earned a single pound." },
  { marker: "×", bad: true, title: "Pathways are unclear or unsafe", body: "Information is fragmented, and unregulated agents fill the gap." },
  { marker: "×", bad: true, title: "Too many take risks with irregular migration", body: "Without a legal route, people lose money, time and sometimes their safety." },
];

const SOLUTION = [
  { marker: "✓", title: "Transparent process", body: "Clear steps from start to finish — no hidden stages, no surprise costs." },
  { marker: "✓", title: "Interview & workplace preparation", body: "Coaching so you arrive ready, not learning on the job." },
  { marker: "✓", title: "Documentation & relocation support", body: "We handle the paperwork so you can focus on the role." },
  { marker: "✓", title: "Access to migration finance", body: "Salary-linked plans where needed — no family loans, no predatory interest." },
];

const PROTECTION = [
  { marker: "01", title: "Employers pay the fees", body: "Recruitment fees are paid by employers — not workers. That principle is non-negotiable." },
  { marker: "02", title: "No hidden steps", body: "The process is documented end-to-end. You know what's next and what it costs." },
  { marker: "03", title: "Support throughout", body: "From preparation to deployment to aftercare — you are not left alone at any stage." },
];

export default async function WorkersPage() {
  // CMS-driven render (preferred). Falls back to the inline TSX below
  // if Strapi is unreachable AND no Page document exists at /workers.
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("workers")]);
  if (page) return <DynamicZoneRenderer sections={page.sections} />;
  return (
    <>
      <Hero
        watermark="WORKERS"
        eyebrow="For workers"
        heading={
          <>
            <span className="small-italic">Work abroad.</span>
            Earn more.
            <br />
            <span className="accent">
              Change
              <br />
              your future.
            </span>
          </>
        }
        lede="Access real international job opportunities with fair recruitment, structured preparation and no large up-front costs."
        ctas={
          <>
            <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "workers_hero" })} variant="primary" withArrow>
              Join the Community
            </ButtonLink>
            <ButtonLink href="/approach" variant="ghost">
              How it works
            </ButtonLink>
          </>
        }
        /* No static hero image — Strapi-down fallback renders text-only. */
      />

      <PageSection tone="alt">
        <SectionGrid>
          <SectionLeft
            eyebrow="The reality"
            heading={
              <>
                The opportunity is real. <span className="yellow">The system is not.</span>
              </>
            }
          >
            <p>You should not have to risk everything to build a better future.</p>
          </SectionLeft>
          <FeatureList items={PROBLEMS} />
        </SectionGrid>
      </PageSection>

      <PageSection tone="yellow">
        <SectionGrid>
          <SectionLeft
            eyebrow="A clear, supported pathway"
            heading={
              <>
                Everything you need <span className="italic-accent">to succeed.</span>
              </>
            }
          >
            <p>
              INSPIRE AFRICA provides a structured journey from job readiness to international employment, with
              support at every step.
            </p>
          </SectionLeft>
          <FeatureList items={SOLUTION} />
        </SectionGrid>
      </PageSection>

      <PageSection>
        <div className="proof-head proof-head--left">
          <Eyebrow>Fair · Transparent · Protected</Eyebrow>
          <h2 className="proof-head-h2">
            You should not have to <span className="yellow">risk everything.</span>
          </h2>
        </div>
        <StepCards items={PROTECTION} />
      </PageSection>

      <FinalCta
        eyebrow="Your future starts here"
        heading={
          <>
            <span className="italic-accent">Take the first step —</span>
            Join the
            <br />
            community.
          </>
        }
        lede="Free membership. The single, supported route into INSPIRE's ecosystem."
      >
        <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "workers_final" })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
