/**
 * Renders a Strapi Dynamic Zone — `page.sections[]` — by mapping each
 * `__component` string to the existing React section component and
 * translating the Strapi field shapes back into the props the
 * components were already designed to accept.
 *
 * Add a new section type by:
 *   1. Adding a `case 'sections.foo'` branch below.
 *   2. Making sure Strapi's content-types/components/sections/foo.json
 *      and `lib/cms/pages.ts` `SECTION_POPULATE` know about it.
 */
import { Hero } from "@/components/sections/Hero";
import {
  PageSection,
  SectionGrid,
  SectionLeft,
} from "@/components/sections/PageSection";
import { FeatureList } from "@/components/sections/FeatureList";
import { ProcessList } from "@/components/sections/ProcessList";
import { StepCards } from "@/components/sections/StepCards";
import { Numbers } from "@/components/sections/Numbers";
import { FinalCta } from "@/components/sections/FinalCta";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { ContactForm } from "@/components/forms/ContactForm";
import { EmployersForm } from "@/components/forms/EmployersForm";
import { GovernmentsForm } from "@/components/forms/GovernmentsForm";

export interface DynamicZoneSection {
  __component: string;
  id?: number;
  [k: string]: any;
}

interface Props {
  sections: DynamicZoneSection[] | undefined | null;
}

export function DynamicZoneRenderer({ sections }: Props) {
  if (!sections || sections.length === 0) return null;
  return (
    <>
      {sections.map((s, i) => (
        <SectionSwitch key={`${s.__component}-${i}`} section={s} index={i} />
      ))}
    </>
  );
}

function html(s: string | undefined): React.ReactNode {
  if (!s) return null;
  return <span dangerouslySetInnerHTML={{ __html: s }} />;
}

function SectionSwitch({
  section: s,
  index: i,
}: {
  section: DynamicZoneSection;
  index: number;
}) {
  switch (s.__component) {
    // ─────────────────────────────────────────────────────────────
    case "sections.hero": {
      const photoSrc: string | null = s.photoUrl ?? s.photo?.url ?? null;
      return (
        <Hero
          watermark={s.watermark ?? ""}
          eyebrow={s.eyebrow ?? ""}
          heading={html(s.headingHtml)}
          lede={s.lede ?? ""}
          centered={!!s.centered}
          className={s.className}
          ctas={
            Array.isArray(s.ctas) && s.ctas.length > 0 ? (
              <>
                {s.ctas.map((c: any, j: number) => (
                  <ButtonLink
                    key={j}
                    href={c.href}
                    variant={c.variant ?? "primary"}
                    withArrow={c.withArrow ?? true}
                  >
                    {c.label}
                  </ButtonLink>
                ))}
              </>
            ) : undefined
          }
          photo={
            photoSrc
              ? {
                  src: photoSrc,
                  alt: s.photoAlt ?? "",
                  captionTitle: s.photoCaptionTitle ?? "",
                  captionSub: s.photoCaptionSub ?? "",
                  priority: s.priority ?? i === 0,
                }
              : undefined
          }
        />
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.feature-list": {
      const items = (s.items ?? []).map((it: any) => ({
        marker: it.marker,
        title: it.title,
        body: it.body,
        bad: !!it.isBad,
      }));
      return (
        <PageSection tone={s.tone ?? "default"}>
          <SectionGrid>
            <SectionLeft eyebrow={s.eyebrow} heading={html(s.headingHtml)}>
              {s.lede ? <p>{s.lede}</p> : null}
            </SectionLeft>
            <FeatureList items={items} />
          </SectionGrid>
        </PageSection>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.process-list": {
      const steps = (s.steps ?? []).map((step: any) => ({
        title: step.title,
        body: step.body,
      }));
      return (
        <PageSection tone={s.tone ?? "default"}>
          <SectionGrid>
            <SectionLeft eyebrow={s.eyebrow} heading={html(s.headingHtml)}>
              {s.lede ? <p>{s.lede}</p> : null}
            </SectionLeft>
            <ProcessList items={steps} />
          </SectionGrid>
        </PageSection>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.step-cards": {
      const items = (s.items ?? []).map((it: any) => ({
        marker: it.marker,
        title: it.title,
        body: it.body,
      }));
      return (
        <PageSection>
          {s.eyebrow || s.headingHtml ? (
            <div className="proof-head proof-head--left">
              {s.eyebrow ? <Eyebrow>{s.eyebrow}</Eyebrow> : null}
              {s.headingHtml ? (
                <h2
                  className="proof-head-h2"
                  dangerouslySetInnerHTML={{ __html: s.headingHtml }}
                />
              ) : null}
            </div>
          ) : null}
          <StepCards items={items} />
        </PageSection>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.numbers": {
      const stats = (s.stats ?? []).map((st: any) => ({
        value: st.value,
        label: st.label,
      }));
      return (
        <section className="proof">
          <div className="container">
            {s.eyebrow || s.headingHtml ? (
              <div className="proof-head">
                {s.eyebrow ? <Eyebrow>{s.eyebrow}</Eyebrow> : null}
                {s.headingHtml ? (
                  <h2
                    className="reveal"
                    dangerouslySetInnerHTML={{ __html: s.headingHtml }}
                  />
                ) : null}
              </div>
            ) : null}
            <Numbers stats={stats} />
          </div>
        </section>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.final-cta": {
      const primary = s.primaryCta;
      return (
        <FinalCta
          eyebrow={s.eyebrow}
          heading={html(s.headingHtml)}
          lede={s.lede}
          secondary={
            Array.isArray(s.secondaryLinks) && s.secondaryLinks.length > 0 ? (
              <>
                {s.secondaryLinks.map((l: any, j: number) => (
                  <a key={j} href={l.href}>
                    {l.label}
                  </a>
                ))}
              </>
            ) : undefined
          }
        >
          {primary ? (
            <ButtonLink
              href={primary.href}
              variant={primary.variant ?? "dark"}
              withArrow={primary.withArrow ?? true}
            >
              {primary.label}
            </ButtonLink>
          ) : null}
        </FinalCta>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.form-block": {
      const formMap: Record<string, React.ComponentType> = {
        contact: ContactForm,
        employers: EmployersForm,
        governments: GovernmentsForm,
      };
      const FormComponent = formMap[s.formKey as string];
      return (
        <section className="form-section" id={s.anchorId || undefined}>
          <div className="container">
            <div className="form-wrap">
              {s.eyebrow ? <Eyebrow>{s.eyebrow}</Eyebrow> : null}
              {s.headingHtml ? (
                <h2 dangerouslySetInnerHTML={{ __html: s.headingHtml }} />
              ) : null}
              {s.lede ? <p>{s.lede}</p> : null}
              {FormComponent ? <FormComponent /> : null}
            </div>
          </div>
        </section>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Home-only sections — wired for completeness so an editor moving
    // a section between pages doesn't render a blank gap.
    case "sections.corridors-marquee":
    case "sections.audiences":
    case "sections.testimonials":
    case "sections.insights-strip":
      // These are home-specific compositions that have their own
      // server-fetched data (corridors, blog posts). Out of scope for
      // the generic renderer — handled inline on the home page.
      return null;

    // ─────────────────────────────────────────────────────────────
    default:
      // eslint-disable-next-line no-console
      console.warn(
        `[DynamicZoneRenderer] no mapping for ${s.__component} — section dropped.`
      );
      return null;
  }
}
