import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { ProfileWizardForm } from "@/components/forms/ProfileWizardForm";
import { buildMetadata } from "@/lib/seo";
import { stepsFor, stepBySlug, type RegistrantType } from "@/lib/profile-shape";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const step = stepBySlug(slug);
  return buildMetadata({
    title: step ? `${step.title} — Your profile` : "Your profile",
    description: "Complete your INSPIRE AFRICA profile so we can match you to the right opportunities.",
    path: `/join/profile/${slug}`,
  });
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ clickId?: string; as?: string }>;
}

export default async function ProfileStepPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { clickId, as } = await searchParams;
  // The registrant type travels in the URL so the wizard is stateless and a
  // resumed link lands on the right branch. It is re-validated server-side on
  // every save, so it cannot be used to reach questions a role must not see.
  const registrantType = (["jobseeker", "employer", "government", "other"].includes(as || "")
    ? as
    : "jobseeker") as RegistrantType;
  const steps = stepsFor(registrantType);
  const step = stepBySlug(slug, registrantType);
  if (!step) notFound();

  // The community handoff stays one click away at every step. Step 1 already
  // captured the lead and the visitor was told membership is free — trapping
  // them behind a profile they did not ask for would break that promise, and
  // would cost community joins to buy profile depth.
  // Route via /join/continue so RedirectedToMN is only set when the visitor
  // actually leaves for the community — not merely because they reached the
  // wizard. Carries clickId when we have it so the status can be recorded.
  const communityHref =
    `/join/continue?source=profile_step_${step.step}` +
    (clickId ? `&clickId=${encodeURIComponent(clickId)}` : "");

  const index = steps.findIndex((s) => s.slug === slug);
  const pct = Math.round(((index + 1) / steps.length) * 100);

  return (
    <>
      <Hero
        watermark="PROFILE"
        eyebrow={`Step ${index + 2} of ${steps.length + 1}`}
        heading={
          <>
            <span className="small-italic">{step.title}</span>
          </>
        }
        lede={step.blurb}
        centered
      />

      <PageSection>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div
            aria-label={`Profile ${pct}% complete`}
            style={{ height: 6, background: "var(--line)", marginBottom: 32, borderRadius: 3, overflow: "hidden" }}
          >
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--yellow)" }} />
          </div>

          <ProfileWizardForm
            step={step.step}
            slug={step.slug}
            registrantType={registrantType}
            clickId={clickId}
          />

          <p style={{ marginTop: 32, fontSize: 14, opacity: 0.75 }}>
            You can stop at any point — everything you have saved is kept, and you are already a
            member.{" "}
            <a href={communityHref} rel="noopener">
              Go to the community now →
            </a>
          </p>
          <p style={{ marginTop: 12, fontSize: 13, opacity: 0.65 }}>
            We use these details to match you to opportunities. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for how long we keep them and how to ask us
            to delete them.
          </p>
        </div>
      </PageSection>
    </>
  );
}
