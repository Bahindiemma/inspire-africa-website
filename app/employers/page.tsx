import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { PageSection, SectionGrid, SectionLeft } from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { ProcessList } from "@/components/sections/ProcessList";
import { Numbers } from "@/components/sections/Numbers";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EmployersForm } from "@/components/forms/EmployersForm";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { getPage } from "@/lib/cms/pages";
import { DynamicZoneRenderer } from "@/components/cms/DynamicZoneRenderer";

export const metadata: Metadata = buildMetadata({
  title: "For Employers",
  description:
    "Hire faster. Pre-screened, job-ready African talent on a compliant platform. 2/3 cost reduction, 1/3 faster timelines.",
  path: "/employers",
});

const PROBLEMS = [
  { marker: "×", bad: true, title: "Long hiring timelines", body: "Months lost between vacancy and arrival, while your roster runs short." },
  { marker: "×", bad: true, title: "High and unpredictable costs", body: "Fees scale with friction, not with quality. You don't know the final number until the invoice arrives." },
  { marker: "×", bad: true, title: "Poor candidate matching", body: "CVs aren't readiness. Mismatched hires drop out in the first 90 days." },
  { marker: "×", bad: true, title: "Opaque subcontractor networks", body: "You don't know who actually sourced the worker, or what they paid to get there." },
];

const SOLUTION = [
  { marker: "✓", title: "Predictive screening", body: "Capability, behaviour and readiness assessed before any CV reaches you." },
  { marker: "✓", title: "Centralised preparation", body: "Candidates arrive prepared for the workplace — language, documentation, expectations all handled." },
  { marker: "✓", title: "Migration finance", body: "Salary-linked finance expands the pool of available talent without falling on you." },
  { marker: "✓", title: "Compliance-first", body: "Audit-ready documentation. Aligned with the IOM's IRIS and other international ethical recruitment standards." },
];

const STATS = [
  { value: "2/3", label: "Reduction in cost-per-hire" },
  { value: "1/3", label: "Faster hiring timelines" },
  { value: "0", label: "Defaults on salary-linked plans" },
  { value: "7", label: "Destination corridors" },
];

const PROCESS = [
  { title: "Define your hiring needs", body: "Roles, sectors, locations, scale, timeline." },
  { title: "Receive pre-screened candidates", body: "Predictive screening shortlists those who will actually arrive ready." },
  { title: "Interview and select", body: "Your decision, on your timeline, with full context on each candidate." },
  { title: "We manage deployment", body: "Documentation, compliance, relocation logistics — all coordinated." },
  { title: "Ongoing support post-placement", body: "Aftercare reduces drop-outs and protects your investment in the hire." },
];

export default async function EmployersPage() {
  // CMS-driven render (preferred). Falls back to inline TSX below
  // if Strapi is unreachable AND no Page document exists at /employers.
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("employers")]);
  if (page) return <DynamicZoneRenderer sections={page.sections} />;
  return (
    <>
      <Hero
        watermark="EMPLOYERS"
        eyebrow="For employers"
        heading={
          <>
            <span className="small-italic">Hire faster.</span>
            Reduce cost.
            <br />
            <span className="accent">
              Increase
              <br />
              certainty.
            </span>
          </>
        }
        lede="Access a reliable pipeline of pre-screened, job-ready African talent through a single, compliant platform."
        ctas={
          <>
            <ButtonLink href="#employers-form" variant="primary" withArrow>
              Hire Talent
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
            eyebrow="The status quo"
            heading={
              <>
                International hiring is <span className="yellow">broken.</span>
              </>
            }
          >
            <p>You pay more — but outcomes don&apos;t improve. Legacy recruitment passes risk down the chain to you.</p>
          </SectionLeft>
          <FeatureList items={PROBLEMS} />
        </SectionGrid>
      </PageSection>

      <PageSection tone="yellow">
        <SectionGrid>
          <SectionLeft
            eyebrow="A better way to hire"
            heading={
              <>
                Built for <span className="italic-accent">outcomes</span> — not transactions.
              </>
            }
          >
            <p>
              INSPIRE AFRICA replaces fragmented recruitment with a structured, Africa-based talent pipeline. The
              model is transparent, ethical and measurable from end to end.
            </p>
          </SectionLeft>
          <FeatureList items={SOLUTION} />
        </SectionGrid>
      </PageSection>

      <section className="proof">
        <div className="container">
          <div className="proof-head">
            <Eyebrow>Early results</Eyebrow>
            <h2 className="reveal">
              What our partners <span className="yellow">are seeing.</span>
            </h2>
          </div>
          <Numbers stats={STATS} />
        </div>
      </section>

      <PageSection>
        <SectionGrid>
          <SectionLeft
            eyebrow="Simple, structured"
            heading={
              <>
                Five steps. <span className="yellow">No surprises.</span>
              </>
            }
          >
            <p>
              From defining your hiring needs to ongoing post-placement support — a coordinated, predictable
              process.
            </p>
          </SectionLeft>
          <ProcessList items={PROCESS} />
        </SectionGrid>
      </PageSection>

      <section className="form-section" id="employers-form">
        <div className="container">
          <div className="form-wrap">
            <Eyebrow>Start a conversation</Eyebrow>
            <h2>Hire talent</h2>
            <p>Tell us about your hiring needs. We&apos;ll come back within two working days.</p>
            <EmployersForm />
          </div>
        </div>
      </section>
    </>
  );
}
