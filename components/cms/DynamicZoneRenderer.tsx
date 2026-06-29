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
import Image from "next/image";
import Link from "next/link";
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
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ContactForm } from "@/components/forms/ContactForm";
import { EmployersForm } from "@/components/forms/EmployersForm";
import { GovernmentsForm } from "@/components/forms/GovernmentsForm";
import { strapiMedia } from "@/lib/cms/media";
import { formatBlogDate, type BlogPost } from "@/lib/blogs";
import type { CorridorCms } from "@/lib/cms/corridors";

export interface DynamicZoneSection {
  __component: string;
  id?: number;
  [k: string]: any;
}

interface Props {
  sections: DynamicZoneSection[] | undefined | null;
  /**
   * Server-fetched lists for the home-only sections that compose other
   * collections (corridors marquee, insights strip). The home page
   * fetches these once and passes them through so the CMS document only
   * has to carry the section's own copy, not a snapshot of the list.
   */
  corridors?: CorridorCms[];
  posts?: BlogPost[];
}

export function DynamicZoneRenderer({ sections, corridors, posts }: Props) {
  if (!sections || sections.length === 0) return null;
  return (
    <>
      {sections.map((s, i) => (
        <SectionSwitch
          key={`${s.__component}-${i}`}
          section={s}
          index={i}
          corridors={corridors}
          posts={posts}
        />
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
  corridors,
  posts,
}: {
  section: DynamicZoneSection;
  index: number;
  corridors?: CorridorCms[];
  posts?: BlogPost[];
}) {
  switch (s.__component) {
    // ─────────────────────────────────────────────────────────────
    case "sections.hero": {
      // Image comes exclusively from the Strapi Media Library (`photo`).
      // The legacy `photoUrl` static fallback is intentionally NOT read —
      // the app ships no static images. URLs are made absolute so relative
      // `/uploads/...` paths resolve against Strapi, not Next. If the CMS
      // has no photo, the hero simply renders without one (no blank box).
      const photoSrc: string | null = strapiMedia(s.photo?.url ?? null);
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
    case "sections.corridors-marquee": {
      // Prefer the server-injected corridor list (kept in sync with the
      // homepage's getCorridors fallback); fall back to the section's
      // own populated relation if no list was passed.
      const list: Array<{ country: string; sectors: string }> =
        corridors && corridors.length > 0
          ? corridors.map((c) => ({ country: c.country, sectors: c.sectors }))
          : (s.corridors ?? []).map((c: any) => ({
              country: c.displayName ?? c.country ?? "",
              sectors: c.sectors ?? "",
            }));
      if (list.length === 0) return null;
      return (
        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "calc(clamp(56px, 7vw, 96px) * -1)",
            paddingTop: "clamp(56px, 7vw, 96px)",
          }}
        >
          <div
            className="corridors-marquee reveal"
            aria-label="Corridors INSPIRE AFRICA operates across"
          >
            <span className="corridors-marquee-label">{s.label ?? "Operating across"}</span>
            <div className="corridors-marquee-viewport">
              <div className="corridors-marquee-track">
                {[...list, ...list].map((c, j) => (
                  <span
                    className="corridors-marquee-item"
                    key={`${c.country}-${j}`}
                    aria-hidden={j >= list.length}
                  >
                    <svg
                      className="chevron"
                      viewBox="0 0 24 24"
                      width={14}
                      height={14}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                    <strong>{c.country}</strong>
                    <span className="sep" aria-hidden>·</span>
                    <span className="sector">{c.sectors}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.audiences": {
      const cards: any[] = s.cards ?? [];
      if (cards.length === 0) return null;
      return (
        <section className="audiences">
          <div className="container">
            <div className="audiences-head">
              <div>
                {s.eyebrow ? <Eyebrow>{s.eyebrow}</Eyebrow> : null}
                {s.headingHtml ? (
                  <h2
                    className="reveal"
                    dangerouslySetInnerHTML={{ __html: s.headingHtml }}
                  />
                ) : null}
              </div>
              {s.lede ? <p className="reveal">{s.lede}</p> : null}
            </div>

            <div className="audiences-grid">
              {cards.map((c, j) => {
                const src = strapiMedia(c.photo?.url ?? null);
                return (
                  <article
                    className={`audience-card${c.isPrimary ? " audience-card--primary" : ""}`}
                    key={c.id ?? j}
                  >
                    {src ? (
                      <div className="audience-card-photo">
                        <Image
                          src={src}
                          alt={c.photoAlt ?? ""}
                          fill
                          sizes="(max-width: 980px) 100vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                        {c.tag ? (
                          <span className="audience-card-photo-tag">{c.tag}</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="audience-card-body">
                      {c.number ? <div className="audience-card-num">{c.number}</div> : null}
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                      {c.ctaHref ? (
                        <Link href={c.ctaHref} className="audience-card-cta">
                          {c.ctaLabel}
                          <ArrowIcon size={16} />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // ─────────────────────────────────────────────────────────────
    case "sections.insights-strip": {
      const limit = s.limit ?? 3;
      const list = (posts ?? []).slice(0, limit);
      if (list.length === 0) return null;
      return (
        <section className="insights" id="insights" aria-labelledby="insights-title">
          <div className="container">
            <div className="insights-head">
              <div>
                {s.eyebrow ? <Eyebrow>{s.eyebrow}</Eyebrow> : null}
                {s.headingHtml ? (
                  <h2
                    id="insights-title"
                    className="reveal"
                    dangerouslySetInnerHTML={{ __html: s.headingHtml }}
                  />
                ) : null}
              </div>
              {s.lede ? <p className="reveal insights-head-lede">{s.lede}</p> : null}
            </div>

            <div className="insights-rows">
              {list.map((post, j) => {
                const heroSrc = strapiMedia(post.heroImage);
                return (
                <article
                  className={`insight-row reveal${j % 2 === 1 ? " insight-row--reverse" : ""}`}
                  key={post.slug}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="insight-row-media"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    {heroSrc ? (
                      <Image
                        src={heroSrc}
                        alt=""
                        fill
                        sizes="(max-width: 880px) 100vw, 45vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className="insight-row-media-placeholder" aria-hidden="true" />
                    )}
                    <span className="insight-row-tag">{post.category}</span>
                  </Link>
                  <div className="insight-row-content">
                    <div className="insight-row-meta">
                      <span>{post.category}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                      <span aria-hidden>·</span>
                      <span>{post.readMinutes} min read</span>
                    </div>
                    <h3>
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p>{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="insight-row-cta">
                      {s.ctaLabel ?? "Read the piece"}
                      <ArrowIcon size={14} />
                    </Link>
                  </div>
                </article>
                );
              })}
            </div>
            <div className="insights-foot reveal">
              <ButtonLink href="/blog" variant="ghost" withArrow>
                All Blogs
              </ButtonLink>
            </div>
          </div>
        </section>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Testimonials stay hidden until approved client photos/quotes exist
    // (matches the commented-out block on the static homepage).
    case "sections.testimonials":
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
