import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { buildMetadata } from "@/lib/seo";
import { ResendVerificationForm } from "@/components/forms/ResendVerificationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Confirm your email",
  description: "One last step — confirm your email address to join the INSPIRE AFRICA community.",
  path: "/join/check-email",
});

interface Props {
  searchParams: Promise<{ clickId?: string; verified?: string; mail?: string }>;
}

/**
 * Landing page after signup. Deliberately honest about three different
 * outcomes rather than always saying "check your inbox":
 *   - normal: we sent a link
 *   - already verified: no new email was sent, go straight through
 *   - mail=failed: the CMS could not hand the message to the mail provider,
 *     so telling them to check their inbox would strand them
 */
export default async function CheckEmailPage({ searchParams }: Props) {
  const { clickId, verified, mail } = await searchParams;
  const alreadyVerified = verified === "1";
  const mailFailed = mail === "failed";

  return (
    <>
      <Hero
        watermark="CHECK"
        eyebrow={alreadyVerified ? "You're already confirmed" : "One last step"}
        heading={
          alreadyVerified ? (
            <>
              <span className="small-italic">You're all set —</span>
              welcome back.
            </>
          ) : (
            <>
              <span className="small-italic">Check your email</span>
              to finish.
            </>
          )
        }
        lede={
          alreadyVerified
            ? "This email address is already confirmed, so there is nothing more to do."
            : "We've sent you a link to confirm your email address. Opening it takes you straight into the community."
        }
        centered
      />

      <PageSection>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {alreadyVerified ? (
            <p>
              <Link href={`/join/continue?source=already_verified`} className="btn btn--primary">
                Go to the community
              </Link>
            </p>
          ) : mailFailed ? (
            <div
              role="alert"
              style={{ border: "1px solid #b00020", padding: 18, marginBottom: 24 }}
            >
              <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#b00020" }}>
                We saved your details, but the confirmation email didn&apos;t go out.
              </p>
              <p style={{ margin: 0, fontSize: 14 }}>
                This is our problem, not yours. Try sending it again below — if it still
                fails, email us at{" "}
                <a href="mailto:info@inspireafricans.com">info@inspireafricans.com</a> and
                we&apos;ll let you in manually.
              </p>
            </div>
          ) : (
            <>
              <p>
                The link works for 72 hours. If it hasn&apos;t arrived in a few minutes,
                check your spam or promotions folder — confirmation emails often land there.
              </p>
              <p style={{ fontSize: 14, opacity: 0.75 }}>
                Wrong address, or nothing arrived? Send it again below.
              </p>
            </>
          )}

          {!alreadyVerified && clickId ? <ResendVerificationForm clickId={clickId} /> : null}

          <p style={{ marginTop: 32, fontSize: 13, opacity: 0.65 }}>
            We store your name and email to support your journey. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for how long we keep them and how to
            ask us to delete them.
          </p>
        </div>
      </PageSection>
    </>
  );
}
