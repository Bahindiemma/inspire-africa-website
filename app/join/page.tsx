import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { PageSection, SectionGrid, SectionLeft } from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { ProcessList } from "@/components/sections/ProcessList";
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
  title: "Join the Community",
  description:
    "Free membership. Your direct route into the INSPIRE AFRICA ecosystem. Connect with employers, opportunities and fellow professionals already on the journey.",
  path: "/join",
});

const BENEFITS = [
  { marker: "✓", title: "A vibrant international network", body: "Connect with African professionals, recruiters and employers already on the path abroad." },
  { marker: "✓", title: "Live opportunities", body: "Real jobs from verified employers — not aggregated scraping from the wider web." },
  { marker: "✓", title: "Country-specific guidance", body: "Practical know-how on UK, EU, USA, Canada, Australia and Saudi Arabia — from people who actually went." },
  { marker: "✓", title: "Peer support", body: "Ask questions, share experience, build relationships that outlast a single placement." },
  { marker: "✓", title: "Events and learning", body: "Webinars, AMAs, language sessions, interview prep — scheduled across time zones." },
  { marker: "✓", title: "Free, lifetime access", body: "No paywalls. No hidden fees. Membership is genuinely free." },
];

const FIRST_WEEK = [
  { title: "Day 1 — Welcome", body: "You land in the community, set up your profile, and meet a welcome team member." },
  { title: "Day 2–3 — Orient", body: "You're guided through the spaces that matter most for your sector and destination." },
  { title: "Day 4–5 — Connect", body: "Introduced to peers already on a similar path — and to a recruiter if your readiness profile matches." },
  { title: "Day 6–7 — Start a journey", body: "If you're ready, the structured pathway begins. If not, you continue learning at your own pace." },
];

const AUDIENCES = [
  { marker: "A", title: "African workers", body: "Healthcare, engineering, mechanics, hospitality, mining, construction, care, teaching — if you have skill and ambition, this is your space." },
  { marker: "B", title: "Recruiters", body: "Trusted partners who source ethically and pay fees themselves. Open access for screened, registered recruiters." },
  { marker: "C", title: "Employers", body: "Direct line to readiness-screened candidates. Build your pipeline from inside the community, not above it." },
];

export default async function JoinPage() {
  // CMS-driven render (preferred). Falls back to inline TSX below
  // if Strapi is unreachable AND no Page document exists at /join.
  const [settings, page] = await Promise.all([getSiteSettings(), getPage("join")]);
  if (page) return <DynamicZoneRenderer sections={page.sections} />;
  return (
    <>
      <Hero
        watermark="JOIN"
        eyebrow="The community"
        heading={
          <>
            <span className="small-italic">A network of</span>
            African
            <br />
            <span className="accent">
              professionals,
              <br />
              going global.
            </span>
          </>
        }
        lede="Free membership. Your direct route into the INSPIRE AFRICA ecosystem. Connect with employers, opportunities and fellow professionals already on the journey."
        ctas={
          <>
            <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "join_page_main" })} variant="primary" withArrow>
              Join — It&apos;s Free
            </ButtonLink>
            <ButtonLink href="/workers" variant="ghost">
              For Workers
            </ButtonLink>
          </>
        }
        /* No static hero image — Strapi-down fallback renders text-only. */
      />

      <PageSection tone="yellow">
        <SectionGrid>
          <SectionLeft
            eyebrow="What you get inside"
            heading={
              <>
                Everything you need <span className="italic-accent">in one place.</span>
              </>
            }
          >
            <p>
              The Inspire community is your free entry point — a structured, peer-rich space
              designed to help you move from preparation to placement.
            </p>
          </SectionLeft>
          <FeatureList items={BENEFITS} />
        </SectionGrid>
      </PageSection>

      <PageSection>
        <SectionGrid>
          <SectionLeft
            eyebrow="What to expect"
            heading={
              <>
                Your first <span className="yellow">seven days.</span>
              </>
            }
          >
            <p>Joining is one click. Here&apos;s what happens after that.</p>
          </SectionLeft>
          <ProcessList items={FIRST_WEEK} />
        </SectionGrid>
      </PageSection>

      <PageSection tone="alt">
        <div className="proof-head proof-head--left">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="proof-head-h2">
            Built for <span className="yellow">workers, primarily.</span>
          </h2>
        </div>
        <StepCards items={AUDIENCES} />
      </PageSection>

      <FinalCta
        eyebrow="One click"
        heading={
          <>
            <span className="italic-accent">The door is open —</span>
            Join now.
          </>
        }
        lede="Free membership. No card. No commitment."
      >
        <ButtonLink href={buildJoinUrl(settings.communityBaseUrl, { source: "join_page_main" })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
