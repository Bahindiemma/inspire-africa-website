import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { buildMetadata } from "@/lib/seo";
import { ResendVerificationForm } from "@/components/forms/ResendVerificationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Check your email",
  description: "One last step — open the link we emailed you to continue to INSPIRE AFRICA Readiness.",
  path: "/join/check-email",
});

interface Props {
  searchParams: Promise<{ clickId?: string; for?: string; mail?: string }>;
}

/**
 * Landing page after signup. Deliberately honest about which outcome you are
 * in rather than always saying "check your inbox":
 *   - for=worker: the register has emailed a link into readiness
 *   - for=worker&mail=failed: the register could not hand the message to the
 *     mail provider, so telling them to check their inbox would strand them
 *   - anything else (for=other, or an old link with no `for`): we recorded
 *     their details and sent NO link, so this page must not mention an email
 *     link, offer a resend, or point anywhere
 *
 * A worker sees this same page whether the address is new, already a member,
 * or on a suppression list. The difference travels only in the email, so the
 * page cannot be used to learn who has an account.
 */
export default async function CheckEmailPage({ searchParams }: Props) {
  const { clickId, for: audience, mail } = await searchParams;
  const isWorker = audience === "worker";
  const mailFailed = isWorker && mail === "failed";

  if (!isWorker) {
    return (
      <>
        <Hero
          watermark="THANKS"
          eyebrow="Details received"
          heading={
            <>
              <span className="small-italic">Thanks —</span>
              we&apos;ve received your details.
            </>
          }
          lede="We'll be in touch."
          centered
        />

        <PageSection>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p style={{ marginTop: 0, fontSize: 13, opacity: 0.65 }}>
              We store your name and email to support your journey. See our{" "}
              <Link href="/privacy">Privacy Policy</Link> for how long we keep them and how to
              ask us to delete them.
            </p>
          </div>
        </PageSection>
      </>
    );
  }

  return (
    <>
      <Hero
        watermark="CHECK"
        eyebrow="One last step"
        heading={
          mailFailed ? (
            <>
              <span className="small-italic">Almost there —</span>
              the email didn&apos;t go out.
            </>
          ) : (
            <>
              <span className="small-italic">Check your email</span>
              to continue.
            </>
          )
        }
        lede={
          mailFailed
            ? "We saved your details, but we couldn't send your link just now."
            : "We've sent you a link to continue to INSPIRE AFRICA Readiness."
        }
        centered
      />

      <PageSection>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {mailFailed ? (
            <div
              role="alert"
              style={{ border: "1px solid #b00020", padding: 18, marginBottom: 24 }}
            >
              <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#b00020" }}>
                We saved your details, but the email with your link didn&apos;t go out.
              </p>
              <p style={{ margin: 0, fontSize: 14 }}>
                This is our problem, not yours. Try sending it again below — if it still
                fails, email us at{" "}
                <a href="mailto:info@inspireafricans.com">info@inspireafricans.com</a> and
                we&apos;ll get you in manually.
              </p>
            </div>
          ) : (
            <>
              <p>
                The link works for 7 days. If it hasn&apos;t arrived in a few minutes, check
                your spam or promotions folder — emails like this often land there.
              </p>
              <p style={{ fontSize: 14, opacity: 0.75 }}>
                Wrong address, or nothing arrived? Send it again below.
              </p>
            </>
          )}

          {clickId ? <ResendVerificationForm clickId={clickId} /> : null}

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
