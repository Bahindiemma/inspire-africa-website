import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { ContactForm } from "@/components/forms/ContactForm";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";
import { joinUrl } from "@/lib/utm";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch. UK office and Africa regional office. Enquiries from workers, employers, governments and partners.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <Hero
        watermark="CONTACT"
        eyebrow="Get in touch"
        heading={
          <>
            <span className="small-italic">Let&apos;s talk —</span>
            <span className="accent">on your terms.</span>
          </>
        }
        lede="Enquiries from workers, employers, governments and partners. We respond within two working days."
        centered
        className="hero--compact"
      />

      <section className="form-section" style={{ borderTop: "none" }}>
        <div className="container">
          <div className="contact-split">
            <div className="form-wrap" style={{ maxWidth: "none", margin: 0 }}>
              <Eyebrow>Send a message</Eyebrow>
              <h2 style={{ marginTop: 14 }}>How can we help?</h2>
              <p>Tell us who you are and what you&apos;re looking for. We&apos;ll route your message to the right person.</p>
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
        <ButtonLink href={joinUrl({ source: "contact_final_cta" })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
