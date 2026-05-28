import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Numbers } from "@/components/sections/Numbers";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";
import { joinUrl } from "@/lib/utm";
import { buildMetadata } from "@/lib/seo";
import { getCorridors } from "@/lib/cms/corridors";
import { getBlogPosts, formatBlogDate } from "@/lib/cms/blogs";

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  path: "/",
});

const STATS = [
  { value: "2/3", label: "Reduction in cost-per-hire" },
  { value: "1/3", label: "Faster hiring timelines" },
  { value: "0", label: "Defaults on salary-linked plans" },
  { value: "7", label: "Destination corridors" },
];

// Testimonials hidden until approved client photos + quotes are available.
// Re-enable by un-commenting this block and the testimonials-grid JSX below.
// const TESTIMONIALS = [
//   {
//     photo: "/nhs_001.jpg",
//     flag: "Worker voice",
//     quote: "The route felt honest. At every step I knew what was coming next.",
//     name: "Community member",
//     role: "Healthcare · Pathway to UK",
//   },
//   {
//     photo: "/nhs_002.jpg",
//     flag: "Employer voice",
//     quote: "We get candidates who arrive prepared. Drop-outs stopped almost completely.",
//     name: "HR Director",
//     role: "UK Care Group",
//   },
//   {
//     photo: "/nhs_003.jpg",
//     flag: "Government voice",
//     quote:
//       "What we engage INSPIRE for is transparency. We see worker outcomes, not just placement counts.",
//     name: "Ministry official",
//     role: "West Africa",
//   },
// ];

export default async function HomePage() {
  // Fetched in parallel from the Strapi CMS. Both fall back to
  // the legacy in-repo constants if the CMS is unreachable.
  const [CORRIDOR_SECTORS, BLOG_POSTS] = await Promise.all([
    getCorridors(),
    getBlogPosts(3),
  ]);
  return (
    <>
      <Hero
        watermark="INSPIRE"
        eyebrow="Labour mobility infrastructure"
        heading={
          <>
            <span className="small-italic">Work abroad.</span>
            Earn more.
            <br />
            <span className="accent">
              Change
              <br />
              {/* Non-breaking space locks "your" and "future" on one line
                  so text-wrap: balance can't split the phrase apart at
                  narrow widths. */}
              your{" "}future.
            </span>
          </>
        }
        lede={SITE.description}
        ctas={
          <>
            <ButtonLink href={joinUrl({ source: "homepage_hero" })} variant="primary" withArrow>
              Join the Community
            </ButtonLink>
            <ButtonLink href="/approach" variant="ghost">
              Our Approach
            </ButtonLink>
          </>
        }
        photo={{
          src: "/images/inspire-healthcare-team.jpg",
          alt: "African professional in a modern workplace, confident and looking into camera",
          captionTitle: "Ready Now",
          captionSub: "3-tier readiness pipeline",
          priority: true,
        }}
      />

      <div
        className="container"
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "calc(clamp(56px, 7vw, 96px) * -1)",
          paddingTop: "clamp(56px, 7vw, 96px)",
        }}
      >
        <div className="corridors-marquee reveal" aria-label="Corridors INSPIRE AFRICA operates across">
          <span className="corridors-marquee-label">Operating across</span>
          <div className="corridors-marquee-viewport">
            {/* Duplicated track — the animation translates by exactly -50%
                so the second copy seamlessly takes over from the first. */}
            <div className="corridors-marquee-track">
              {[...CORRIDOR_SECTORS, ...CORRIDOR_SECTORS].map((c, i) => (
                <span className="corridors-marquee-item" key={`${c.country}-${i}`} aria-hidden={i >= CORRIDOR_SECTORS.length}>
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

      <section className="audiences">
        <div className="container">
          <div className="audiences-head">
            <div>
              <Eyebrow>Built for workers, employers and governments</Eyebrow>
              <h2 className="reveal">
                Three audiences.
                <br />
                <span className="yellow">One platform.</span>
              </h2>
            </div>
            <p className="reveal">
              Workers are our primary audience. Employers and governments engage through trusted pathways.
            </p>
          </div>

          <div className="audiences-grid">
            <article className="audience-card audience-card--primary">
              <div className="audience-card-photo">
                <Image
                  src="/images/inspire-farmer-square.jpg"
                  alt="Two African professionals collaborating at a laptop"
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="audience-card-photo-tag">For Workers</span>
              </div>
              <div className="audience-card-body">
                <div className="audience-card-num">01</div>
                <h3>Access global work</h3>
                <p>
                  Fair, structured pathways with preparation, support and salary-linked finance — so you can work
                  abroad and bring the gains home.
                </p>
                <Link href="/workers" className="audience-card-cta">
                  Start Your Journey
                  <ArrowIcon size={16} />
                </Link>
              </div>
            </article>

            <article className="audience-card">
              <div className="audience-card-photo">
                <Image
                  src="/images/inspire-healthcare-team.jpg"
                  alt="African healthcare professionals collaborating at work"
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="audience-card-photo-tag">For Employers</span>
              </div>
              <div className="audience-card-body">
                <div className="audience-card-num">02</div>
                <h3>Hire with confidence</h3>
                <p>
                  Pre-qualified African talent. Ethical recruitment with faster mobilisation.
                </p>
                <Link href="/employers" className="audience-card-cta">
                  Talk to Us
                  <ArrowIcon size={16} />
                </Link>
              </div>
            </article>

            <article className="audience-card">
              <div className="audience-card-photo">
                <Image
                  src="/images/inspire-chef-hospitality.jpg"
                  alt="Architectural sketch representing infrastructure"
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="audience-card-photo-tag">For Governments</span>
              </div>
              <div className="audience-card-body">
                <div className="audience-card-num">03</div>
                <h3>Build mobility systems</h3>
                <p>
                  Structured, ethical labour pathways aligned with national strategy and long-term capability.
                </p>
                <Link href="/governments" className="audience-card-cta">
                  Explore a Partnership
                  <ArrowIcon size={16} />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="proof">
        <div className="container">
          <div className="proof-head">
            <Eyebrow>Proof, not promises</Eyebrow>
            <h2 className="reveal">
              Early signal. <span className="yellow">Structural scale.</span>
            </h2>
          </div>

          <Numbers stats={STATS} />

          {/* Testimonials hidden until approved client photos + quotes are available.
              Re-enable by un-commenting this block and the TESTIMONIALS array above.
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card reveal" key={t.name + t.role}>
                <Image
                  className="testimonial-card-img"
                  src={t.photo}
                  alt=""
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                />
                <span className="testimonial-flag">{t.flag}</span>
                <div className="testimonial-content">
                  <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testimonial-attr">
                    <strong>{t.name}</strong>
                    {t.role}
                  </div>
                </div>
                <div className="testimonial-tagline">
                  Your future.
                  <br />
                  Our infrastructure.
                </div>
              </div>
            ))}
          </div>
          */}
        </div>
      </section>

      <section className="insights" id="insights" aria-labelledby="insights-title">
        <div className="container">
          <div className="insights-head">
            <div>
              <Eyebrow>From the field</Eyebrow>
              <h2 id="insights-title" className="reveal">
                Insights from the
                <br />
                <span className="yellow">corridor.</span>
              </h2>
            </div>
            <p className="reveal insights-head-lede">
              Analysis and insight from inside the labour mobility system within and without Africa. Policy shifts, market signals and the structural forces shaping workforce migration.
            </p>
          </div>

          <div className="insights-rows">
            {BLOG_POSTS.map((post, i) => (
              <article
                className={`insight-row reveal${i % 2 === 1 ? " insight-row--reverse" : ""}`}
                key={post.slug}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="insight-row-media"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <Image
                    src={post.heroImage}
                    alt=""
                    fill
                    sizes="(max-width: 880px) 100vw, 45vw"
                    style={{ objectFit: "cover" }}
                  />
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
                    Read the piece
                    <ArrowIcon size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FinalCta
        eyebrow="Your move"
        heading={
          <>
            <span className="italic-accent">If you&apos;re ready —</span>
            Join the
            <br />
            community.
          </>
        }
        lede="Free membership. Your direct route into the INSPIRE AFRICA ecosystem. Connect with employers, opportunities and fellow professionals already on the journey."
        secondary={
          <>
            <Link href="/employers">For Employers</Link>
            <Link href="/governments">For Governments</Link>
            <Link href="/contact">Contact Us</Link>
          </>
        }
      >
        <ButtonLink href={joinUrl({ source: "homepage_final_cta" })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
