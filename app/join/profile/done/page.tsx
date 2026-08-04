import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { ButtonLink } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Profile saved",
  description: "Your INSPIRE AFRICA profile has been saved. Next stop: the community.",
  path: "/join/profile/done",
});

/**
 * End of the wizard. This is also where anyone who clicked "Skip for now" on
 * the last step lands, so it must read well for a fully-complete profile AND
 * for one that is barely started — it deliberately does not claim the profile
 * is finished.
 */
export default async function ProfileDonePage() {
  const settings = await getSiteSettings().catch(() => null);
  const communityHref = buildJoinUrl(settings?.communityBaseUrl, { source: "profile_complete" });

  return (
    <>
      <Hero
        watermark="DONE"
        eyebrow="Thank you"
        heading={
          <>
            <span className="small-italic">That's saved —</span>
            welcome aboard.
          </>
        }
        lede="Your details are with us. You can add more at any time, and our team will be in touch as opportunities that match you open up."
        centered
      />

      <PageSection>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <ButtonLink href={communityHref} variant="primary" withArrow>
            Go to the community
          </ButtonLink>
          <p style={{ marginTop: 28, fontSize: 14, opacity: 0.75 }}>
            Want to add more later? Everything you have entered is saved against your signup. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for how long we keep your details and how to
            ask us to delete them.
          </p>
        </div>
      </PageSection>
    </>
  );
}
