import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts, formatBlogDate } from "@/lib/cms/blogs";
import { buildMetadata } from "@/lib/seo";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

export const metadata: Metadata = buildMetadata({
  title: "Blogs",
  description:
    "Insights from the corridor — ethical recruitment, labour-mobility policy and the realities of migration finance, from the INSPIRE AFRICA editorial desk.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  // The site ships no static images; hero images come from the CMS and may
  // be null (handled per-card with the neutral placeholder).
  const posts = await getBlogPosts(50);

  return (
    <article className="blog-detail">
      <header className="blog-hero">
        <div className="container">
          <div className="blog-hero-inner">
            <Eyebrow>From the field</Eyebrow>
            <h1 className="reveal">Insights from the corridor.</h1>
            <p className="blog-hero-excerpt reveal">
              Field notes on ethical recruitment, labour-mobility policy and migration
              finance — the realities behind governed migration.
            </p>
          </div>
        </div>
      </header>

      <section className="blog-related">
        <div className="container">
          {posts.length > 0 ? (
            <div className="blog-related-grid">
              {posts.map((p) => (
                <article className="insight-card" key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="insight-card-media"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    {p.heroImage ? (
                      <Image
                        src={p.heroImage}
                        alt=""
                        fill
                        sizes="(max-width: 980px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className="insight-card-media-placeholder" aria-hidden="true" />
                    )}
                    <span className="insight-card-tag">{p.category}</span>
                  </Link>
                  <div className="insight-card-body">
                    <div className="insight-card-meta">
                      <time dateTime={p.date}>{formatBlogDate(p.date)}</time>
                      <span aria-hidden>·</span>
                      <span>{p.readMinutes} min read</span>
                    </div>
                    <h3>
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                    </h3>
                    <p>{p.excerpt}</p>
                    <Link href={`/blog/${p.slug}`} className="insight-card-cta">
                      Read the piece
                      <ArrowIcon size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="reveal">No articles yet — check back soon.</p>
          )}
        </div>
      </section>
    </article>
  );
}
