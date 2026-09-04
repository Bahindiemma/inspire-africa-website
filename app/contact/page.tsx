import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { ContactForm } from "@/components/forms/ContactForm";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";
import { buildJoinGateUrl } from "@/lib/utm";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { getPage } from "@/lib/cms/pages";

/*
  A PRERENDER MUST BE ABLE TO EXPIRE ON ITS OWN.

  These pages were fully static with no revalidate window, so Next served them
  with `s-maxage=31536000` and they could only change when the CMS webhook fired
  `/api/revalidate`. On 4 August 2026 the image build produced a page with no
  photographs — the CMS is unreachable from inside `docker build`, so a
  build-time prerender of CMS content is always empty — and that empty page was
  then pinned for a year. It served for thirteen days.

  It was fifteen minutes, and on 4 September 2026 that was still too long: a
  redeploy served the image-less fallback because the post-deploy revalidation
  step was skipped, and every page sat there without photographs.

  One minute is the compromise now. The webhook still gives editors an instant
  update; this is only the floor under it, so a missed signal or a bad build
  expires by itself in a minute instead of lasting until somebody notices. The
  cost is one background regeneration per page per minute, and only when that
  page is actually being viewed.
*/
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch. UK office and Africa regional office. Enquiries from workers, employers, governments and partners.",
  path: "/contact",
});

export default async function ContactPage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getPage("contact"),
  ]);

  // Editable prose comes from the CMS `contact` page doc (hero +
  // form-block sections); we keep the bespoke two-column layout and the
  // settings-driven office aside. Each value falls back to the original
  // copy when the CMS is unreachable or the section is absent.
  const sections = page?.sections ?? [];
  const heroSec = sections.find((s) => s.__component === "sections.hero");
  const formSec = sections.find((s) => s.__component === "sections.form-block");

  return (
    <>
      <Hero
        watermark="CONTACT"
        eyebrow={heroSec?.eyebrow ?? "Get in touch"}
        heading={
          heroSec?.headingHtml ? (
            <span dangerouslySetInnerHTML={{ __html: heroSec.headingHtml }} />
          ) : (
            <>
              <span className="small-italic">Let&apos;s talk —</span>
              <span className="accent">on your terms.</span>
            </>
          )
        }
        lede={
          heroSec?.lede ??
          "Enquiries from workers, employers, governments and partners. We respond within two working days."
        }
        centered
        className="hero--compact"
      />

      <section className="form-section" style={{ borderTop: "none" }}>
        <div className="container">
          <div className="contact-split">
            <div className="form-wrap" style={{ maxWidth: "none", margin: 0 }}>
              <Eyebrow>{formSec?.eyebrow ?? "Send a message"}</Eyebrow>
              {formSec?.headingHtml ? (
                <h2 style={{ marginTop: 14 }} dangerouslySetInnerHTML={{ __html: formSec.headingHtml }} />
              ) : (
                <h2 style={{ marginTop: 14 }}>How can we help?</h2>
              )}
              <p>
                {formSec?.lede ??
                  "Tell us who you are and what you're looking for. We'll route your message to the right person."}
              </p>
              <ContactForm />
            </div>

            <aside>
              <div className="contact-info-block">
                <Eyebrow>Office</Eyebrow>
                <h3 style={{ marginTop: 14 }}>
                  One office.
                  <br />
                  One team.
                </h3>
                <div className="yellow-bar" />

                <div className="contact-info-row">
                  <strong>UK · Registered Office</strong>
                  {settings.legalName}
                  <br />
                  {settings.companyAddress.street}
                  <br />
                  {settings.companyAddress.city}, {settings.companyAddress.postalCode}
                  <br />
                  {settings.companyAddress.country}
                  <br />
                  <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                  <br />
                  <a
                    href={`https://wa.me/${settings.contactAfricaPhone.replace(/\D+/g, "")}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {settings.contactAfricaPhone}
                  </a>
                  <br />
                  <small style={{ opacity: 0.75 }}>WhatsApp only · no calls</small>
                </div>

                <div className="contact-info-row">
                  <strong>Specialist enquiries</strong>
                  Employers: <Link href="/employers">Hire Talent form →</Link>
                  <br />
                  Governments: <Link href="/governments">Partner With Us form →</Link>
                  <br />
                  Workers: <Link href="/join">Join the Community →</Link>
                </div>

                <div className="contact-info-row">
                  <strong>Legal &amp; data protection</strong>
                  <a href={`mailto:${settings.contactLegalEmail}`}>{settings.contactLegalEmail}</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <FinalCta
        eyebrow="Or skip the form"
        heading={
          <>
            <span className="italic-accent">If you&apos;re a worker —</span>
            Join the community.
          </>
        }
        lede="It&apos;s the fastest way in."
        style={{ paddingTop: "clamp(48px,5vw,72px)", paddingBottom: "clamp(48px,5vw,72px)" }}
      >
        <ButtonLink href={buildJoinGateUrl({ source: "contact_final_cta" })} variant="dark" withArrow prefetch={false}>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
