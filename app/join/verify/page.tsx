import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { PageSection } from "@/components/sections/PageSection";
import { buildMetadata } from "@/lib/seo";
import { verifyEmail } from "@/lib/cms/community";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Confirming your email",
  description: "Joining INSPIRE AFRICA now takes you to INSPIRE AFRICA Readiness.",
  path: "/join/verify",
});

interface Props {
  searchParams: Promise<{ token?: string }>;
}

/**
 * The target of the OLD emailed confirmation link.
 *
 * Joining no longer ends in the Mighty Networks community, and the CMS no
 * longer emails workers at all (the register sends their invitation). But up
 * to 72 hours of links are already sitting in inboxes from before the cutover.
 * We still confirm them with the CMS, so the lead row keeps its status, and
 * then explain what changed instead of redirecting to a community that is no
 * longer the destination.
 *
 * We can't mint an invitation from here: the CMS verify answer carries only a
 * clickId, and the register never hands a raw link to the website. So the
 * honest path is to ask for the form once more and email a fresh link — three
 * fields, once, for a handful of people.
 */
export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Outcome
        eyebrow="Link incomplete"
        heading="That link is missing its code."
        lede="Joining now takes you to INSPIRE AFRICA Readiness. Please fill in the join form and we'll email you a link."
      />
    );
  }

  const h = await headers();
  // The result only decides whether the CMS row is marked confirmed; whatever
  // it says, the visitor needs the same next step, so every branch below lands
  // on the same explanation. Not redirecting keeps this readable with the
  // failure states intact.
  await verifyEmail(token, {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip"),
    ua: h.get("user-agent"),
  });

  return (
    <Outcome
      eyebrow="Joining has moved"
      heading="Joining now takes you to INSPIRE AFRICA Readiness."
      lede="Please fill in the join form once more and we'll email you a link."
    />
  );
}

function Outcome({
  eyebrow,
  heading,
  lede,
}: {
  eyebrow: string;
  heading: string;
  lede: string;
}) {
  return (
    <>
      <Hero watermark="EMAIL" eyebrow={eyebrow} heading={heading} lede={lede} centered />
      <PageSection>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p>
            <Link href="/join/start?source=verify_moved" className="btn btn--primary">
              Fill in the join form
            </Link>
          </p>
          <p style={{ marginTop: 28, fontSize: 14, opacity: 0.75 }}>
            Still stuck? Email{" "}
            <a href="mailto:info@inspireafricans.com">info@inspireafricans.com</a> and we&apos;ll
            sort it out.
          </p>
        </div>
      </PageSection>
    </>
  );
}
