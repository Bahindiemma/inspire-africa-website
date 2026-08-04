import type { Metadata } from "next";
import { headers } from "next/headers";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { CommunitySignupForm } from "@/components/forms/CommunitySignupForm";
import { buildMetadata } from "@/lib/seo";
import { newClickId, trackClick } from "@/lib/cms/community";

export const metadata: Metadata = buildMetadata({
  title: "Join the Community",
  description:
    "One short step before you land in the INSPIRE AFRICA community. Tell us who you are so we can welcome you properly.",
  path: "/join/start",
});

/**
 * Never cache: this route has a side effect (recording the click) and
 * renders a per-visitor clickId.
 */
export const dynamic = "force-dynamic";

/**
 * A prefetch is not a click. Next.js <Link> prefetches on hover and in the
 * viewport, and Chrome's speculation rules do the same — without this
 * guard the click count would be inflated by an order of magnitude by
 * people who merely scrolled past the button. The CTAs also pass
 * prefetch={false}; this is the second line of defence, and the one that
 * catches browser-initiated speculation we don't control.
 */
function isPrefetch(h: Headers): boolean {
  if (h.get("next-router-prefetch") === "1") return true;
  if (h.get("x-middleware-prefetch") === "1") return true;
  const purpose = h.get("sec-purpose") || h.get("purpose") || h.get("x-purpose");
  return Boolean(purpose && purpose.toLowerCase().includes("prefetch"));
}

interface Props {
  searchParams: Promise<{
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
}

export default async function JoinStartPage({ searchParams }: Props) {
  const sp = await searchParams;
  const h = await headers();

  const source = (sp.source || sp.utm_source || "join_gate").slice(0, 128);
  const utmSource = (sp.utm_source || source).slice(0, 128);
  const utmMedium = (sp.utm_medium || "website").slice(0, 128);
  const utmCampaign = (sp.utm_campaign || "join_community").slice(0, 128);

  // Record intent-to-join server-side. This is the number the business
  // asked for, and doing it here means it works with cookies declined,
  // JavaScript off, and an ad-blocker installed. The CMS folds refreshes
  // and duplicate tabs into one row and returns the id to use.
  let clickId = newClickId();
  if (!isPrefetch(h)) {
    clickId = await trackClick(
      {
        clickId,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
        referrer: h.get("referer"),
        landingPath: "/join/start",
      },
      { ip: h.get("x-forwarded-for") || h.get("x-real-ip"), ua: h.get("user-agent") }
    );
  }

  return (
    <>
      <Hero
        watermark="JOIN"
        eyebrow="One short step"
        heading={
          <>
            <span className="small-italic">Tell us who</span>
            you are.
          </>
        }
        lede="Membership is free. Tell us who you are, confirm your email, and you're in."
        centered
      />

      <PageSection>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <CommunitySignupForm
            clickId={clickId}
            source={source}
            utmSource={utmSource}
            utmMedium={utmMedium}
            utmCampaign={utmCampaign}
          />
          <p style={{ marginTop: 28, fontSize: 14, opacity: 0.75 }}>
            We store your name and email to support your journey, and send you a link to
            confirm the address. The community itself is hosted on Mighty Networks, who will
            ask you to create an account with them when you arrive. See our{" "}
            <a href="/privacy">Privacy Policy</a> for how long we keep this and how to ask
            us to delete it.
          </p>
        </div>
      </PageSection>
    </>
  );
}
