import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts, getBlogPost, getRelatedPosts, formatBlogDate } from "@/lib/cms/blogs";
import { buildMetadata } from "@/lib/seo";
import { FinalCta } from "@/components/sections/FinalCta";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { joinUrl } from "@/lib/utm";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/** Pre-render every known post at build time, sourcing slugs from the CMS. */
export async function generateStaticParams() {
  const posts = await getBlogPosts(100);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) {
    return buildMetadata({
      title: "Article not found",
      description: "The article you’re looking for couldn’t be located.",
      path: `/blog/${slug}`,
    });
  }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.heroImage,
  });
}

export default async function BlogDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, 2);

  return (
    <>
      <article className="blog-detail">
        <header className="blog-hero">
          <div className="container">
            <Link href="/#insights" className="blog-back">
              <ArrowIcon size={14} />
              <span>Back to insights</span>
            </Link>
            <div className="blog-hero-inner">
              <span className="blog-category">{post.category}</span>
              <h1 className="reveal">{post.title}</h1>
              <p className="blog-hero-excerpt reveal">{post.excerpt}</p>
              <div className="blog-hero-meta">
                <div className="blog-hero-meta-item">
                  <strong>By</strong>
                  {post.author}
                  <span aria-hidden>·</span>
                  {post.authorRole}
                </div>
                <div className="blog-hero-meta-item">
                  <strong>Published</strong>
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                </div>
                <div className="blog-hero-meta-item">
                  <strong>Read</strong>
                  {post.readMinutes} min
                </div>
              </div>
            </div>
          </div>
        </header>

        {post.heroImage ? (
          <div className="blog-cover">
            <div className="container">
              <div className="blog-cover-frame">
                <Image
                  src={post.heroImage}
                  alt={post.heroAlt}
                  fill
                  priority
                  sizes="(max-width: 1100px) 100vw, 1100px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <section className="blog-body-section">
          <div className="container">
            <div className="blog-body">
              {post.body.map((s, i) => {
                switch (s.kind) {
                  case "lede":
                    return (
                      <p className="lede" key={i}>
                        {s.text}
                      </p>
                    );
                  case "h2":
                    return <h2 key={i}>{s.text}</h2>;
                  case "p":
                    return <p key={i}>{s.text}</p>;
                  case "list":
                    return s.ordered ? (
                      <ol className="blog-list" key={i}>
                        {s.items.map((it, j) => (
                          <li key={j}>{it}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul key={i}>
                        {s.items.map((it, j) => (
                          <li key={j}>{it}</li>
                        ))}
                      </ul>
                    );
                  case "callout":
                    return (
                      <aside className="blog-callout" key={i}>
                        <strong>{s.title}</strong>
                        <p>{s.text}</p>
                      </aside>
                    );
                  case "quote":
                    return (
                      <blockquote className="blog-quote" key={i}>
                        <p>&ldquo;{s.text}&rdquo;</p>
                        {s.attribution ? <cite>— {s.attribution}</cite> : null}
                      </blockquote>
                    );
                }
              })}

              <div className="blog-tags" aria-label="Tags">
                {post.tags.map((t) => (
                  <span className="blog-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="blog-related">
            <div className="container">
              <div className="blog-related-head">
                <Eyebrow>Keep reading</Eyebrow>
                <h2>More from the corridor.</h2>
              </div>
              <div className="blog-related-grid">
                {related.map((r) => (
                  <article className="insight-card" key={r.slug}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="insight-card-media"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      {r.heroImage ? (
                        <Image
                          src={r.heroImage}
                          alt=""
                          fill
                          sizes="(max-width: 980px) 100vw, 50vw"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <span className="insight-card-media-placeholder" aria-hidden="true" />
                      )}
                      <span className="insight-card-tag">{r.category}</span>
                    </Link>
                    <div className="insight-card-body">
                      <div className="insight-card-meta">
                        <time dateTime={r.date}>{formatBlogDate(r.date)}</time>
                        <span aria-hidden>·</span>
                        <span>{r.readMinutes} min read</span>
                      </div>
                      <h3>
                        <Link href={`/blog/${r.slug}`}>{r.title}</Link>
                      </h3>
                      <p>{r.excerpt}</p>
                      <Link href={`/blog/${r.slug}`} className="insight-card-cta">
                        Read the piece
                        <ArrowIcon size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      <FinalCta
        eyebrow="Stay close to the platform"
        heading={
          <>
            <span className="italic-accent">Built for workers —</span>
            Join the
            <br />
            community.
          </>
        }
        lede="Free membership. Direct route into the INSPIRE AFRICA ecosystem."
      >
        <ButtonLink href={joinUrl({ source: `blog_${post.slug}` })} variant="dark" withArrow>
          Join the Community — Free
        </ButtonLink>
      </FinalCta>
    </>
  );
}
