import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { buildMetadata } from "@/lib/seo";
import { verifyEmail } from "@/lib/cms/community";
import { ResendVerificationForm } from "@/components/forms/ResendVerificationForm";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Confirming your email",
  description: "Confirming your email address for the INSPIRE AFRICA community.",
  path: "/join/verify",
});

interface Props {
  searchParams: Promise<{ token?: string }>;
}

/**
 * The target of the emailed confirmation link.
 *
 * On success we hand straight off to the community via /join/continue, which
 * records the handoff — so a confirmed email leads directly into Mighty
 * Networks with no extra click. Failures explain themselves and offer a
 * resend rather than dead-ending.
 *
 * A page (not a route handler) because the failure states need to be
 * readable, and because the success path still redirects either way.
 */
export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Outcome
        eyebrow="Link incomplete"
        heading="That link is missing its code."
        lede="Please open the confirmation link directly from the email — some clients cut long links in half."
      />
    );
  }

  const h = await headers();
  const result = await verifyEmail(token, {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  });

  if (result.ok) {
    // Confirmed — straight into the community. redirect() throws
    // NEXT_REDIRECT by design, so it must not sit inside a try/catch.
    redirect(
      `/join/continue?source=${result.alreadyVerified ? "verify_repeat" : "verify_success"}` +
        (result.clickId ? `&clickId=${encodeURIComponent(result.clickId)}` : "")
    );
  }

  if (result.reason === "expired") {
    return (
      <Outcome
        eyebrow="Link expired"
        heading="That link has expired."
        lede="Confirmation links last 72 hours. Send yourself a fresh one below and it will work straight away."
        clickId={result.clickId}
      />
    );
  }

  if (result.reason === "invalid") {
    return (
      <Outcome
        eyebrow="Link not recognised"
        heading="We couldn't match that link."
        lede="It may already have been used — confirmation links work once. If you have already confirmed, you can go straight to the community."
        showCommunity
      />
    );
  }

  return (
    <Outcome
      eyebrow="Something went wrong"
      heading="We couldn't confirm you just now."
      lede="This is our problem, not yours. Please try the link again in a moment."
    />
  );
}

function Outcome({
  eyebrow,
  heading,
  lede,
  clickId,
  showCommunity,
}: {
  eyebrow: string;
  heading: string;
  lede: string;
  clickId?: string;
  showCommunity?: boolean;
}) {
  return (
    <>
      <Hero watermark="EMAIL" eyebrow={eyebrow} heading={heading} lede={lede} centered />
      <PageSection>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {clickId ? <ResendVerificationForm clickId={clickId} /> : null}
          {showCommunity ? (
            <p>
              <Link href="/join/continue?source=verify_already" className="btn btn--primary">
                Go to the community
              </Link>
            </p>
          ) : null}
          <p style={{ marginTop: 28, fontSize: 14, opacity: 0.75 }}>
            Still stuck? Email{" "}
            <a href="mailto:info@inspireafricans.com">info@inspireafricans.com</a> and we&apos;ll
            sort it out. Or{" "}
            <Link href="/join/start?source=verify_retry">start again</Link>.
          </p>
        </div>
      </PageSection>
    </>
  );
}
